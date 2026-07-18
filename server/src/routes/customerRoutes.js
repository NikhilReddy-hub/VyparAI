const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(customerController.getAll)
  .post(customerController.create);

router.route('/:id')
  .get(customerController.getOne)
  .put(customerController.update)
  .delete(customerController.delete);

router.get('/:id/ai-score', customerController.getAICreditScore);
router.get('/:id/whatsapp-reminder', customerController.getWhatsAppReminder);

module.exports = router;
