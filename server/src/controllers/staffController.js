const Staff = require('../models/Staff');
const Activity = require('../models/Activity');

exports.getAll = async (req, res) => {
  try {
    const staffMembers = await Staff.find({ isActive: true })
      .populate('user', 'name email role avatar')
      .sort('-createdAt');
    res.json({ success: true, data: staffMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user', 'name email role avatar');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    await Activity.create({
      type: 'staff_checkin',
      title: `Staff member onboarded: ${staff.name}`,
      description: `Role: ${staff.role}`,
      staff: staff._id,
      user: req.user._id
    });
    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Staff member deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Check-in with latitude/longitude validation
exports.checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body; // Shop Location coordinates (e.g. Guwahati Shop: 26.1445, 91.7362)
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found.' });

    const shopLat = 26.1445;
    const shopLng = 91.7362;
    const distanceThresholdKm = 0.5; // Within 500 meters

    // Simple Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (lat - shopLat) * Math.PI / 180;
    const dLng = (lng - shopLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(shopLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    const isLate = new Date().getHours() > 9.5; // Late after 9:30 AM
    const status = isLate ? 'late' : 'present';

    const checkInRecord = {
      date: new Date(),
      checkIn: new Date(),
      checkInLocation: { lat, lng },
      status,
    };

    staff.attendance.push(checkInRecord);
    
    // Simple productivity metric updates
    staff.performanceScore = Math.max(0, staff.performanceScore + (isLate ? -2 : 5));
    await staff.save();

    await Activity.create({
      type: 'staff_checkin',
      title: `${staff.name} checked in`,
      description: `${isLate ? 'Late arrival.' : 'On time.'} Distance: ${(distance * 1000).toFixed(0)}m from store.`,
      staff: staff._id,
      metadata: { distance, lat, lng, isLate }
    });

    req.io?.emit('staff:attendance_update', { staffId: staff._id, checkIn: checkInRecord });
    res.json({ success: true, data: staff, insideGeofence: distance <= distanceThresholdKm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Check-out
exports.checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found.' });

    const todayRecord = staff.attendance.find(a => 
      new Date(a.date).toDateString() === new Date().toDateString() && !a.checkOut
    );

    if (!todayRecord) {
      return res.status(400).json({ success: false, message: 'No active check-in record found for today.' });
    }

    todayRecord.checkOut = new Date();
    const hours = (todayRecord.checkOut - todayRecord.checkIn) / (1000 * 60 * 60);
    todayRecord.hoursWorked = Number(hours.toFixed(2));
    
    await staff.save();

    await Activity.create({
      type: 'staff_checkout',
      title: `${staff.name} checked out`,
      description: `Worked ${todayRecord.hoursWorked} hours today.`,
      staff: staff._id,
    });

    req.io?.emit('staff:attendance_update', { staffId: staff._id, checkOut: todayRecord });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Sales Leaderboard & Commissions
exports.getLeaderboard = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('name role totalSales totalCommission performanceScore')
      .sort('-totalSales');
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Leave request management
exports.requestLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, startDate, endDate, reason } = req.body;
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    staff.leaves.push({ type, startDate, endDate, reason, status: 'pending' });
    await staff.save();
    
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id, leaveId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    const leave = staff.leaves.id(leaveId);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    leave.status = status;
    await staff.save();

    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
