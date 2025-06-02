const bcrypt = require('bcrypt');
const { IsNull, In } = require('typeorm');

const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('UsersController');
const { isNotValidInteger, isNotValidString, isUndefined, isNotValidPassword, isNotValidName, isNotValidEmail, isNotValidGender, isNotValidBirthday, isNotValidTaiwanMobile, isNotValidTaiwanAddressAdvanced } = require('../utils/validUtils');
const generateJWT = require('../utils/generateJWT');
const { sendResetEmail } = require('../utils/mailer');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const { password } = require('../config/db');

const adminController = {
  async getClassification(req, res, next) {
    try {
      const getClass = await dataSource.getRepository('Classification').find({
        select: ['id', 'name']
      });
  
      res.status(201).json({
        message: '取得成功',
        data: getClass
      });
        
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },
  async postClassification(req, res, next) {
    try {
      const { name } = req.body;
      if (isUndefined(name) || isNotValidString(name)) {
        res.status(400).json({
          message: '欄位未填寫正確'
        });
        return;
      }
      if (name.length < 2 || name.length > 20) {
        res.status(400).json({
          message: '錯誤的名稱格式'
        });
        return;
      }
      const ClassificationRepo = dataSource.getRepository('Classification');
      const exitClassification = await ClassificationRepo.findOne({ 
        where: { name } 
      });
      
      if (exitClassification) {
        res.status(400).json({
          message: '資料重複'
        });
        return;
      }
      const newClassification = ClassificationRepo.create({ name });
      const result = await ClassificationRepo.save(newClassification);

      res.status(201).json({
        message: '新增成功',
        data: {
          id: result.id, 
          name: result.name,
        }
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  }
};

module.exports = adminController;