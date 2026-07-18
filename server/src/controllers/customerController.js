const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const gemini = require('../services/gemini.service');

exports.getAll = async (req, res) => {
  try {
    const { search, segment, hasBalance, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (search) query.$text = { $search: search };
    if (segment) query.segment = segment;
    if (hasBalance === 'true') query.outstandingBalance = { $gt: 0 };

    const customers = await Customer.find(query)
      .sort('-updatedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);
    res.json({ success: true, data: customers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    // Fetch invoice history
    const invoices = await Invoice.find({ customer: customer._id }).sort('-createdAt').limit(10);
    res.json({ success: true, data: customer, invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, createdBy: req.user._id });
    await Activity.create({
      type: 'customer_added',
      title: `New customer: ${customer.name}`,
      description: `Phone: ${customer.phone}`,
      customer: customer._id,
      user: req.user._id,
    });
    req.io?.emit('customer:created', customer);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    req.io?.emit('customer:updated', customer);
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Customer deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// AI Churn Prediction & Customer Health
exports.getAICreditScore = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const invoices = await Invoice.find({ customer: customer._id }).sort('-createdAt').limit(15);
    
    const churnPred = await gemini.predictCustomerChurn(customer, invoices);
    
    // Update customer schema with AI prediction
    customer.churnProbability = churnPred.churnProbability;
    customer.segment = churnPred.segment;
    customer.aiScore = churnPred.aiScore;
    customer.suggestedOffer = churnPred.suggestedOffer;
    customer.lifetimeValue = churnPred.lifetimeValue;
    await customer.save();

    res.json({ success: true, prediction: churnPred });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate Credit Recovery WhatsApp Draft
exports.getWhatsAppReminder = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    if (customer.outstandingBalance <= 0) {
      return res.status(400).json({ success: false, message: 'Customer has no outstanding balance.' });
    }

    const message = `Namaskar ${customer.name}, this is a friendly reminder from Sharma General Stores regarding your outstanding balance of ₹${customer.outstandingBalance.toLocaleString('en-IN')}. Kindly clear the dues via UPI (GPay/PhonePe) or card at your earliest convenience. Thank you!`;
    const encodedText = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/91${customer.phone}?text=${encodedText}`;

    res.json({
      success: true,
      message,
      link: whatsappLink,
      phone: customer.phone,
      balance: customer.outstandingBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
