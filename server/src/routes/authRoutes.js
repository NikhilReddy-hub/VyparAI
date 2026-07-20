const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, authController.changePassword);

// One-time seed trigger (protected by secret key, remove after seeding)
router.post('/seed-now', async (req, res) => {
  if (req.headers['x-seed-secret'] !== (process.env.SEED_SECRET || 'vyapar-seed-2026')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const seed = require('../../seed/seed');
    await seed();
    res.json({ success: true, message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
