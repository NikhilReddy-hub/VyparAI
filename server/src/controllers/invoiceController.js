const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Activity = require('../models/Activity');

const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const date = new Date();
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
};

const calculateGST = (amount, gstRate, isInterstate) => {
  const gstAmount = amount * (gstRate / 100);
  if (isInterstate) return { igst: gstAmount, cgst: 0, sgst: 0, total: gstAmount };
  return { igst: 0, cgst: gstAmount / 2, sgst: gstAmount / 2, total: gstAmount };
};

exports.getAll = async (req, res) => {
  try {
    const { status, customer, from, to, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    if (customer) query.customer = customer;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);
    res.json({ success: true, data: invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('items.product', 'name sku image')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { customerId, items, payments, discount = 0, notes, isInterstate = false } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    let subtotal = 0;
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      if (product.currentStock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}` });
      }

      const lineTotal = item.sellingPrice * item.quantity;
      const lineDiscount = lineTotal * ((item.discount || 0) / 100);
      const taxableAmount = lineTotal - lineDiscount;
      const gst = calculateGST(taxableAmount, product.gstRate, isInterstate);

      subtotal += taxableAmount;
      totalTax += gst.total;

      processedItems.push({
        product: product._id, productName: product.name, sku: product.sku,
        quantity: item.quantity, unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: item.sellingPrice,
        discount: item.discount || 0, gstRate: product.gstRate,
        hsnCode: product.hsnCode, ...gst,
        totalAmount: taxableAmount + gst.total,
      });

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { currentStock: -item.quantity },
        lastSoldDate: new Date(),
      });
    }

    const grandTotal = Math.round(subtotal + totalTax);
    const paidAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    const invoice = await Invoice.create({
      invoiceNumber: await generateInvoiceNumber(),
      customer: customerId, createdBy: req.user._id,
      items: processedItems, isInterstate,
      subtotal, totalDiscount: discount, totalTax,
      grandTotal, paidAmount,
      dueAmount: grandTotal - paidAmount,
      paymentStatus: paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
      paymentMethod: payments?.length === 1 ? payments[0].method : 'mixed',
      payments: payments || [],
      notes,
    });

    // Update customer
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalPurchased: grandTotal, totalOrders: 1, outstandingBalance: grandTotal - paidAmount },
      lastPurchaseDate: new Date(),
    });

    await Activity.create({
      type: 'invoice_created', title: `Invoice ${invoice.invoiceNumber} created`,
      description: `₹${grandTotal} — ${customer.name}`,
      amount: grandTotal, customer: customerId, invoice: invoice._id, user: req.user._id,
    });

    req.io?.emit('invoice:created', { invoice, customer });
    req.io?.emit('stock:bulk_updated');

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount, method, reference } = req.body;
    const invoice = await Invoice.findById(req.params.id).populate('customer', 'name');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    invoice.payments.push({ method, amount, reference, date: new Date() });
    invoice.paidAmount += amount;
    invoice.dueAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
    invoice.paymentStatus = invoice.dueAmount <= 0 ? 'paid' : invoice.paidAmount > 0 ? 'partial' : 'pending';
    await invoice.save();

    if (invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer._id, { $inc: { outstandingBalance: -amount } });
    }

    await Activity.create({
      type: 'payment_received', title: `Payment received: ₹${amount}`,
      description: `${method.toUpperCase()} — ${invoice.invoiceNumber}`,
      amount, invoice: invoice._id, customer: invoice.customer._id, user: req.user._id,
    });

    req.io?.emit('payment:received', { invoiceId: invoice._id, amount, method });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: 'issued'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$grandTotal' },
          collected: { $sum: '$paidAmount' },
          pending: { $sum: '$dueAmount' },
          transactions: { $sum: 1 },
          itemsArray: { $push: '$items' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: { revenue: 0, collected: 0, pending: 0, profit: 0, transactions: 0 }
      });
    }

    // Profit pipeline - sum margin for each product line item in MongoDB
    const profitResult = await Invoice.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'issued' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          profit: {
            $sum: {
              $multiply: [
                { $subtract: ['$items.sellingPrice', { $ifNull: ['$items.purchasePrice', 0] }] },
                '$items.quantity'
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0];
    res.json({
      success: true,
      data: {
        revenue: result.revenue,
        collected: result.collected,
        pending: result.pending,
        profit: profitResult[0]?.profit || 0,
        transactions: result.transactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
