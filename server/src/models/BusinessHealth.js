const mongoose = require('mongoose');

const businessHealthSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  overallScore: { type: Number, min: 0, max: 100 },
  scores: {
    inventory: { score: Number, label: String, details: String },
    cashFlow: { score: Number, label: String, details: String },
    customerSatisfaction: { score: Number, label: String, details: String },
    staffProductivity: { score: Number, label: String, details: String },
    profitability: { score: Number, label: String, details: String },
  },
  suggestions: [String],
  alerts: [String],
  metrics: {
    todayRevenue: Number,
    todayProfit: Number,
    pendingPayments: Number,
    lowStockCount: Number,
    absentStaff: Number,
    newCustomers: Number,
    totalTransactions: Number,
  },
  aiNarrative: String, // AI-generated morning briefing text
  voiceSummary: String, // Text for TTS
}, { timestamps: true });

module.exports = mongoose.model('BusinessHealth', businessHealthSchema);
