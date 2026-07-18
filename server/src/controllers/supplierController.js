const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const gemini = require('../services/gemini.service');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };
    if (search) query.$text = { $search: search };

    const suppliers = await Supplier.find(query).sort('-createdAt');
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Supplier deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// AI Negotiation Helper
exports.getNegotiationInsight = async (req, res) => {
  try {
    const { id } = req.params; // supplierId
    const { productId, currentPrice } = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const advice = await gemini.getNegotiationAdvice(product, supplier, Number(currentPrice));
    res.json({ success: true, advice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
