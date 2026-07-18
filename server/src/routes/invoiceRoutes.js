const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(invoiceController.getAll)
  .post(invoiceController.create);

router.get('/today-stats', invoiceController.getTodayStats);

router.route('/:id')
  .get(invoiceController.getOne);

router.post('/:id/payment', invoiceController.recordPayment);

module.exports = router;
