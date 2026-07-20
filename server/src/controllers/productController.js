const Product = require('../models/Product');
const Activity = require('../models/Activity');
const gemini = require('../services/gemini.service');

exports.getAll = async (req, res) => {
  try {
    const { search, category, supplier, lowStock, deadStock, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ name: searchRegex }, { sku: searchRegex }, { barcode: searchRegex }];
    }
    if (category) query.category = category;
    if (supplier) query.supplier = supplier;
    if (lowStock === 'true') query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    if (deadStock === 'true') query.isDeadStock = true;

    const products = await Product.find(query)
      .populate('category', 'name color')
      .populate('supplier', 'name phone')
      .sort('-updatedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);
    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category supplier');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    await Activity.create({
      type: 'stock_update', title: `New product added: ${product.name}`,
      description: `Added with ${product.currentStock} units`, product: product._id, user: req.user._id,
    });
    req.io?.emit('product:created', product);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    req.io?.emit('product:updated', product);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { adjustment, reason, type } = req.body; // type: 'add'|'subtract'|'set'
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const prevStock = product.currentStock;
    if (type === 'add') product.currentStock += adjustment;
    else if (type === 'subtract') product.currentStock = Math.max(0, product.currentStock - adjustment);
    else product.currentStock = adjustment;

    await product.save();

    await Activity.create({
      type: 'stock_adjustment',
      title: `Stock adjusted: ${product.name}`,
      description: `${prevStock} → ${product.currentStock} (${reason})`,
      product: product._id, user: req.user._id,
    });

    // Check for theft if subtracting without invoice
    if (type === 'subtract' && adjustment > 5) {
      const theft = await gemini.detectTheft(product, prevStock, product.currentStock, []);
      if (theft?.theftRisk === 'high' || theft?.theftRisk === 'medium') {
        req.io?.emit('alert:theft', { product: product.name, ...theft });
      }
    }

    req.io?.emit('stock:updated', { productId: product._id, currentStock: product.currentStock });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    }).populate('category supplier').sort('currentStock');
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAIPrediction = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Mock sales history (in production, query Invoice model)
    const salesHistory = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      sold: Math.round(product.avgDailySales * (0.8 + Math.random() * 0.4)),
    }));

    const prediction = await gemini.predictStockDemand(product, salesHistory);
    
    // Update product with prediction
    await Product.findByIdAndUpdate(req.params.id, {
      daysUntilStockout: prediction.daysUntilStockout,
      aiPredictionConfidence: prediction.confidence,
    });

    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
