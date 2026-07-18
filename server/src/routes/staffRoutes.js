const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(staffController.getAll)
  .post(restrictTo('owner'), staffController.create);

router.get('/leaderboard', staffController.getLeaderboard);

router.route('/:id')
  .get(staffController.getOne)
  .put(restrictTo('owner', 'manager'), staffController.update)
  .delete(restrictTo('owner'), staffController.delete);

router.post('/:id/check-in', staffController.checkIn);
router.post('/:id/check-out', staffController.checkOut);
router.post('/:id/leave', staffController.requestLeave);
router.put('/:id/leave/:leaveId', restrictTo('owner', 'manager'), staffController.updateLeaveStatus);

module.exports = router;
