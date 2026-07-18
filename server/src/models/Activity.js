const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sale', 'purchase', 'stock_update', 'customer_added', 'payment_received',
      'staff_checkin', 'staff_checkout', 'low_stock_alert', 'ai_alert', 'theft_alert',
      'invoice_created', 'order_placed', 'customer_payment', 'stock_adjustment', 'return'],
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  amount: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  metadata: mongoose.Schema.Types.Mixed,
  isAlert: { type: Boolean, default: false },
  severity: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
