const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: String, unique: true },
  name: { type: String, required: true },
  phone: String,
  email: String,
  role: { type: String, default: 'staff' },
  department: String,
  joiningDate: Date,
  salary: {
    basic: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
  },
  commissionRate: { type: Number, default: 2 }, // % of sales
  totalSales: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  shifts: [{
    day: String, startTime: String, endTime: String,
  }],
  attendance: [{
    date: Date,
    checkIn: Date,
    checkOut: Date,
    checkInLocation: { lat: Number, lng: Number },
    status: { type: String, enum: ['present', 'absent', 'late', 'half-day', 'leave'], default: 'present' },
    hoursWorked: Number,
  }],
  leaves: [{
    type: { type: String, enum: ['sick', 'casual', 'earned', 'maternity'] },
    startDate: Date, endDate: Date,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  }],
  tasks: [{
    title: String, description: String,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date, priority: { type: String, enum: ['low', 'medium', 'high'] },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  }],
  performanceScore: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // AI: theft flag
  suspiciousActivities: [{
    date: Date, type: String, description: String, severity: String, resolved: Boolean,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
