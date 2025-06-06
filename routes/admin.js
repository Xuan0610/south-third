const express = require('express');
const router = express.Router();
const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Users');
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

module.exports = router;