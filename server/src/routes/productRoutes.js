const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(productController.getAll)
  .post(restrictTo('owner', 'manager'), productController.create);

router.get('/low-stock', productController.getLowStock);

router.route('/:id')
  .get(productController.getOne)
  .put(restrictTo('owner', 'manager'), productController.update)
  .delete(restrictTo('owner'), productController.delete);

router.post('/:id/adjust-stock', productController.adjustStock);
router.get('/:id/predict', productController.getAIPrediction);

module.exports = router;
