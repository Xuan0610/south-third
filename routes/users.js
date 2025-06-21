const express = require('express');
const router = express.Router();
const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Users');
const usersController = require('../controllers/users');
const handleErrorAsync = require('../utils/handleErrorAsync');
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger,
});
const limiter = require('../middlewares/limiter');

router.post('/signup', handleErrorAsync(usersController.postSignup));
router.post('/login', handleErrorAsync(usersController.postLogin));
router.get('/membership/profile', auth, handleErrorAsync(usersController.getProfile));
router.put('/membership/profile', auth, handleErrorAsync(usersController.putProfile));
router.get('/membership/receiver', auth, handleErrorAsync(usersController.getReceiver));
router.get('/membership/cart', auth, handleErrorAsync(usersController.getCart));
router.post('/membership/cart', auth, handleErrorAsync(usersController.addToCart));
router.patch('/forget', limiter, handleErrorAsync(usersController.patchForget));
router.patch('/reset-password', handleErrorAsync(usersController.patchResetPassword));
router.get('/orderReview', auth, handleErrorAsync(usersController.getOrderReview));
router.post('/membership/order', auth, handleErrorAsync(usersController.postCreateOrder));
router.get('/membership/orders', auth, handleErrorAsync(usersController.getUserOrders));
router.put('/checkout', auth, handleErrorAsync(usersController.putCheckout));
router.get('/discount', auth, handleErrorAsync(usersController.getDiscount));
router.get('/orderReview', auth, handleErrorAsync(usersController.getOrderReview));
router.get('/membership/:order_id', auth, handleErrorAsync(usersController.getUserOrderDetail));

module.exports = router;
