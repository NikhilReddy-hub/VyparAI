const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['owner', 'manager', 'staff'], default: 'staff' },
  phone: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  permissions: {
    canManageInventory: { type: Boolean, default: true },
    canManageSales: { type: Boolean, default: true },
    canViewAnalytics: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canManageCustomers: { type: Boolean, default: true },
    canViewFinancials: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
  },
  lastLogin: { type: Date },
  department: { type: String },
  joinDate: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  if (this.role === 'owner') {
    this.permissions = {
      canManageInventory: true, canManageSales: true, canViewAnalytics: true,
      canManageStaff: true, canManageCustomers: true, canViewFinancials: true, canExportData: true,
    };
  } else if (this.role === 'manager') {
    this.permissions = {
      canManageInventory: true, canManageSales: true, canViewAnalytics: true,
      canManageStaff: false, canManageCustomers: true, canViewFinancials: false, canExportData: true,
    };
  }
});

module.exports = mongoose.model('User', userSchema);
