const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');
const handleErrorAsync = require('../utils/handleErrorAsync');

router.get('/', handleErrorAsync(productsController.getProducts));
router.get('/:products_id', handleErrorAsync(productsController.getProductId));

module.exports = router;