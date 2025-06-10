const express = require('express');
const router = express.Router();
const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Admin');
const adminController = require('../controllers/admin');
const handleErrorAsync = require('../utils/handleErrorAsync');
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger,
});
const isAdmin = require('../middlewares/isAdmin');
const limiter = require('../middlewares/limiter');

router.get('/classification', auth, isAdmin, handleErrorAsync(adminController.getClassification));
router.post('/classification', auth, isAdmin, handleErrorAsync(adminController.postClassification));
router.get('/product_detail', auth, isAdmin, handleErrorAsync(adminController.getProductDetail));
router.post('/product_detail', auth, isAdmin, handleErrorAsync(adminController.postProductDetail));
router.post('/products', auth, isAdmin, handleErrorAsync(adminController.postProduct));
router.get('/orders/is_ship', auth, isAdmin, handleErrorAsync(adminController.getIsShip));
router.get('/orders/revenue', auth, isAdmin, handleErrorAsync(adminController.getRevenue));
router.get('/:product_id', auth, isAdmin, handleErrorAsync(adminController.getProductId));
router.put('/:product_id', auth, isAdmin, handleErrorAsync(adminController.putProductId));
router.get('/orders', auth, isAdmin, handleErrorAsync(adminController.getAllOrders));
router.get('/orders/process', auth, isAdmin, handleErrorAsync(adminController.getProcessingOrders));
router.patch('/orders/:order_id', auth, isAdmin, handleErrorAsync(adminController.updateOrderStatus));
router.get('/orders/history', auth, isAdmin, handleErrorAsync(adminController.getOrderHistory));
router.get('/:product_id', handleErrorAsync(adminController.getProductId));
router.put('/:product_id', handleErrorAsync(adminController.putProductId));
router.post('/', handleErrorAsync(adminController.postProduct));
router.get('/:product_id', auth, isAdmin, handleErrorAsync(adminController.getProductId));
router.put('/:product_id', auth, isAdmin, handleErrorAsync(adminController.putProductId));
router.get('/product_detail', auth, isAdmin, handleErrorAsync(adminController.getProductDetail));
router.post('/product_detail', auth, isAdmin, handleErrorAsync(adminController.putProductDetail));
router.post('/', auth, isAdmin, handleErrorAsync(adminController.postProduct));

module.exports = router;
