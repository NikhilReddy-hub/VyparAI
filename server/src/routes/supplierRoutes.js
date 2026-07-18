const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(supplierController.getAll)
  .post(restrictTo('owner', 'manager'), supplierController.create);

router.route('/:id')
  .get(supplierController.getOne)
  .put(restrictTo('owner', 'manager'), supplierController.update)
  .delete(restrictTo('owner'), supplierController.delete);

router.post('/:id/negotiate', supplierController.getNegotiationInsight);

module.exports = router;
