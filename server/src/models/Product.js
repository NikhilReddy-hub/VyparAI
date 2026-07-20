const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String, unique: true, sparse: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  description: String,
  image: String,

  // Pricing
  purchasePrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  mrp: { type: Number },
  gstRate: { type: Number, default: 18 }, // percentage
  hsnCode: String,

  // Stock
  currentStock: { type: Number, default: 0 },
  unit: { type: String, default: 'pcs', enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'packet', 'dozen', 'bag'] },
  reorderLevel: { type: Number, default: 10 },
  maxStock: { type: Number, default: 1000 },

  // Batch & Expiry
  batches: [{
    batchNumber: String,
    quantity: Number,
    purchaseDate: Date,
    expiryDate: Date,
    purchasePrice: Number,
  }],

  // Warehouse
  location: { type: String }, // shelf/rack
  warehouse: { type: String, default: 'Main Store' },

  // AI fields
  avgDailySales: { type: Number, default: 0 },
  daysUntilStockout: { type: Number },
  isDeadStock: { type: Boolean, default: false },
  lastSoldDate: Date,
  aiPredictionConfidence: { type: Number, default: 0 },
  festivalDemandMultiplier: { type: Number, default: 1 },

  // Status
  isActive: { type: Boolean, default: true },
  tags: [String],

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productSchema.virtual('profitMargin').get(function () {
  return ((this.sellingPrice - this.purchasePrice) / this.sellingPrice * 100).toFixed(2);
});

productSchema.virtual('stockValue').get(function () {
  return this.currentStock * this.purchasePrice;
});

productSchema.index({ name: 1 });

module.exports = mongoose.model('Product', productSchema);
