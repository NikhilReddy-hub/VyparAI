const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: String,
  phone: { type: String, required: true },
  email: String,
  gstin: String,
  address: {
    street: String, city: String, state: { type: String, default: 'Assam' }, pincode: String,
  },
  paymentTerms: { type: String, default: '30 days' },
  creditLimit: { type: Number, default: 100000 },
  outstandingBalance: { type: Number, default: 0 },
  totalPurchased: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5, default: 4 },

  // AI Negotiation
  priceHistory: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    price: Number,
    date: Date,
  }],
  marketPrices: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    marketAvgPrice: Number,
    lastUpdated: Date,
  }],

  bankDetails: {
    accountName: String, accountNumber: String, ifsc: String, bankName: String,
  },
  isActive: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });

supplierSchema.index({ name: 'text', contactPerson: 'text' });
module.exports = mongoose.model('Supplier', supplierSchema);
