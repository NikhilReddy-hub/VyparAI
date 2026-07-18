const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    sku: String,
    quantity: { type: Number, required: true },
    unit: String,
    purchasePrice: Number,
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // percentage
    gstRate: { type: Number, default: 18 },
    hsnCode: String,
    cgst: Number, sgst: Number, igst: Number,
    totalAmount: Number,
  }],

  // GST
  subtotal: Number,
  totalDiscount: Number,
  totalTax: Number,
  roundOff: Number,
  grandTotal: { type: Number, required: true },
  isInterstate: { type: Boolean, default: false },

  // Payment
  paymentStatus: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'credit', 'mixed'] },
  payments: [{
    method: { type: String, enum: ['cash', 'upi', 'card', 'credit'] },
    amount: Number,
    reference: String,
    date: { type: Date, default: Date.now },
  }],
  paidAmount: { type: Number, default: 0 },
  dueAmount: Number,
  dueDate: Date,

  // Invoice type
  type: { type: String, enum: ['sale', 'return', 'exchange'], default: 'sale' },
  originalInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }, // for returns

  // QR & PDF
  qrCode: String,
  pdfUrl: String,

  notes: String,
  termsAndConditions: String,
  status: { type: String, enum: ['draft', 'issued', 'cancelled'], default: 'issued' },
}, { timestamps: true });

invoiceSchema.index({ invoiceNumber: 'text', 'items.productName': 'text' });

module.exports = mongoose.model('Invoice', invoiceSchema);
