const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: String,
  address: {
    street: String, city: { type: String, default: 'Guwahati' },
    state: { type: String, default: 'Assam' }, pincode: String,
  },
  gstin: String,
  avatar: String,
  birthday: Date,
  anniversary: Date,

  // Financial
  creditLimit: { type: Number, default: 5000 },
  outstandingBalance: { type: Number, default: 0 },
  totalPurchased: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },

  // AI CRM fields
  aiScore: { type: Number, default: 50, min: 0, max: 100 }, // Health score
  churnProbability: { type: Number, default: 0, min: 0, max: 100 }, // %
  lifetimeValue: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  purchaseFrequency: { type: Number, default: 0 }, // orders per month
  lastPurchaseDate: Date,
  segment: { type: String, enum: ['vip', 'regular', 'occasional', 'at-risk', 'churned'], default: 'regular' },
  suggestedOffer: String,

  // Communication
  preferredContact: { type: String, enum: ['whatsapp', 'sms', 'call', 'email'], default: 'whatsapp' },
  whatsappOptIn: { type: Boolean, default: true },

  notes: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
