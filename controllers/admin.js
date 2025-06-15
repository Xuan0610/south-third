const bcrypt = require('bcrypt');
const { IsNull, In } = require('typeorm');

const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('UsersController');
const {
  isNotValidInteger,
  isNotValidString,
  isUndefined,
  isNotValidPassword,
  isNotValidName,
  isNotValidEmail,
  isNotValidGender,
  isNotValidBirthday,
  isNotValidTaiwanMobile,
  isNotValidTaiwanAddressAdvanced,
} = require('../utils/validUtils');
const generateJWT = require('../utils/generateJWT');

const adminController = {
  async getClassification(req, res, next) {
    try {
      const getClass = await dataSource.getRepository('Classification').find({
        select: ['id', 'name'],
      });

      res.status(201).json({
        message: '取得成功',
        data: getClass,
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
          message: '欄位未填寫正確',
        });
        return;
      }
      if (name.length < 2 || name.length > 20) {
        res.status(400).json({
          message: '錯誤的名稱格式',
        });
        return;
      }
      const ClassificationRepo = dataSource.getRepository('Classification');
      const exitClassification = await ClassificationRepo.findOne({
        where: { name },
      });

      if (exitClassification) {
        res.status(400).json({
          message: '資料重複',
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
        },
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },

  async postProduct(req, res, next) {
    try {
      const { id, product_detail_id, name, origin_price, price, stock, image_url, is_enable } =
        req.body;

      if (
        isUndefined(id) ||
        isUndefined(name) ||
        isNotValidString(name) ||
        isUndefined(origin_price) ||
        isUndefined(price) ||
        isUndefined(stock) ||
        isUndefined(image_url) ||
        isUndefined(is_enable)
      ) {
        logger.warn('新增商品錯誤: 欄位未填寫正確');
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }

      if (name.length > 50) {
        logger.warn('新增商品錯誤: 商品名稱超過長度限制');
        res.status(400).json({
          message: '商品名稱超過長度限制',
        });
        return;
      }

      if (isNotValidInteger(origin_price) || isNotValidInteger(price)) {
        logger.warn('新增商品錯誤: 價格不能為負數');
        res.status(400).json({
          message: '價格不能為負數',
        });
        return;
      }

      if (stock < 0) {
        logger.warn('新增商品錯誤: 庫存不能為負數');
        res.status(400).json({
          message: '庫存不能為負數',
        });
        return;
      }

      const productDetailRepo = dataSource.getRepository('Product_detail');
      const findProductDetail = await productDetailRepo.findOne({
        where: { id: product_detail_id },
      });

      if (!findProductDetail) {
        logger.warn('新增商品錯誤: 查無此商品詳情');
        res.status(400).json({
          message: '查無此商品詳情',
        });
        return;
      }

      const productRepo = dataSource.getRepository('Product');
      const exitProduct = await productRepo.findOne({
        where: { id },
      });
      if (exitProduct) {
        res.status(400).json({
          message: '商品 ID 重複',
        });
        return;
      }
      const newProduct = productRepo.create({
        id,
        product_detail_id,
        name,
        origin_price,
        price,
        stock,
        image_url,
        is_enable,
      });

      const savedProduct = await productRepo.save(newProduct);

      const result = await productRepo.findOne({
        where: { id: savedProduct.id },
        relations: ['Product_detail', 'Product_detail.Classification'],
      });

      res.status(200).json({
        message: '新增成功',
        data: {
          id: result.id,
          product_detail_id: result.Product_detail.id,
          name: result.name,
          origin_price: result.origin_price,
          price: result.price,
          stock: result.stock,
          image_url: result.image_url,
          is_enable: result.is_enable,
          detail: {
            id: result.Product_detail.id,
            origin: result.Product_detail.origin,
            feature: result.Product_detail.feature,
            variety: result.Product_detail.variety,
            process_method: result.Product_detail.process_method,
            acidity: result.Product_detail.acidity,
            flavor: result.Product_detail.flavor,
            aftertaste: result.Product_detail.aftertaste,
            description: result.Product_detail.description,
            classification: result.Product_detail.Classification.name,
          },
        },
      });
    } catch (error) {
      logger.error('新增商品資訊錯誤:', error);
      next(error);
    }
  },

  // 取得個別商品資訊(Product entity)
  async getProductId(req, res, next) {
    try {
      const { id } = req.params;
      const productRepo = dataSource.getRepository('Product');
      const findProduct = await productRepo.find({
        where: { id },
        relations: ['Product_detail', 'Product_detail.Classification'],
      });

      const result = findProduct.map(product => ({
        id: product.id,
        product_detail_id: product.Product_detail.id,
        name: product.name,
        origin_price: product.origin_price,
        price: product.price,
        stock: product.stock,
        image_url: product.image_url,
        is_enable: product.is_enable,
        detail: {
          origin: product.Product_detail.origin,
          feature: product.Product_detail.feature,
          variety: product.Product_detail.variety,
          process_method: product.Product_detail.process_method,
          acidity: product.Product_detail.acidity,
          flavor: product.Product_detail.flavor,
          aftertaste: product.Product_detail.aftertaste,
          description: product.Product_detail.description,
          classification: product.Product_detail.Classification.name,
        },
      }));

      res.status(200).json({
        message: '取得成功',
        data: result,
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },

  // 新增個別商品資訊(Product entity)
  async putProductId(req, res, next) {
    try {
      const { id, name, product_detail_id, origin_price, price, stock, image_url, is_enable } =
        req.body;

      const productDetailRepo = dataSource.getRepository('Product_detail');
      const productRepo = dataSource.getRepository('Product');
      const findProductDetail = await productDetailRepo.findOneBy({ id: product_detail_id });

      const newProduct = productRepo.create({
        id,
        name,
        origin_price,
        price,
        stock,
        image_url,
        is_enable,
        Product_detail: findProductDetail,
      });

      const saveProduct = await productRepo.save(newProduct);

      const createProduct = await productRepo.findOne({
        where: { id: saveProduct.id },
        relations: ['Product_detail'],
      });

      const result = {
        product: [
          {
            id: createProduct.id,
            name: createProduct.name,
            product_detail_id: createProduct.Product_detail.id,
            origin_price: createProduct.origin_price,
            price: createProduct.price,
            stock: createProduct.stock,
            image_url: createProduct.image_url,
            is_enable: createProduct.is_enable,
            detail: {
              name: createProduct.Product_detail.name,
              description: createProduct.Product_detail.description,
              feature: createProduct.Product_detail.feature,
            },
          },
        ],
      };

      res.status(201).json({
        message: '新增成功',
        data: result,
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },

  async getProductDetail(req, res, next) {
    try {
      const productDetailRepo = dataSource.getRepository('Product_detail');

      const details = await productDetailRepo.find({
        relations: ['Classification'],
      });

      const result = details.map(detail => ({
        id: detail.id,
        name: detail.name,
        origin: detail.origin,
        feature: detail.feature,
        variety: detail.variety,
        process_method: detail.process_method,
        acidity: detail.acidity,
        flavor: detail.flavor,
        aftertaste: detail.aftertaste,
        description: detail.description,
        classification_id: detail.classification_id,
        classification_name: detail.Classification?.name || null,
      }));

      res.status(200).json({
        message: '取得成功',
        data: result,
      });
    } catch (error) {
      logger.error('取得商品詳情失敗:', error);
      next(error);
    }
  },

  async postProductDetail(req, res, next) {
    try {
      const {
        name,
        origin,
        feature,
        variety,
        process_method,
        acidity,
        flavor,
        aftertaste,
        description,
        classification_id,
      } = req.body;

      if (
        isUndefined(name) ||
        isUndefined(origin) ||
        isUndefined(feature) ||
        isUndefined(description) ||
        isUndefined(classification_id)
      ) {
        logger.warn('新增商品詳情錯誤: 欄位未填寫正確');
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }

      if (name.length > 50) {
        res.status(400).json({
          message: '類別名稱長度超過 50 字',
        });
        return;
      }
      if (feature.length > 30) {
        res.status(400).json({
          message: '產品特徵長度超過 30 字',
        });
        return;
      }
      if (origin.length > 15) {
        res.status(400).json({
          message: '產地長度超過 15 字',
        });
        return;
      }
      if (variety && variety.length > 30) {
        res.status(400).json({
          message: '品種長度超過 30 字',
        });
        return;
      }
      if (process_method && process_method.length > 30) {
        res.status(400).json({
          message: '處理方式長度超過 30 字',
        });
        return;
      }
      if (acidity && acidity.length > 30) {
        res.status(400).json({
          message: '酸度長度超過 30 字',
        });
        return;
      }
      if (flavor && flavor.length > 30) {
        res.status(400).json({
          message: '甜感長度超過 30 字',
        });
        return;
      }
      if (aftertaste && aftertaste.length > 30) {
        res.status(400).json({
          message: '尾韻長度超過 30 字',
        });
        return;
      }

      if (isNotValidInteger(classification_id) || classification_id === 0) {
        res.status(400).json({
          message: '分類ID格式錯誤',
        });
        return;
      }

      const classificationRepo = dataSource.getRepository('Classification');
      const classification = await classificationRepo.findOneBy({ id: classification_id });
      if (!classification) {
        res.status(400).json({
          message: '查無此分類',
        });
        return;
      }

      const productDetailRepo = dataSource.getRepository('Product_detail');
      const newProductDetail = productDetailRepo.create({
        name,
        origin,
        feature,
        variety,
        process_method,
        acidity,
        flavor,
        aftertaste,
        description,
        Classification: classification,
      });

      const savedProductDetail = await productDetailRepo.save(newProductDetail);

      res.status(200).json({
        message: '新增成功',
        // data: {
        //   id: savedProductDetail.id,
        //   name: savedProductDetail.name,
        //   origin: savedProductDetail.origin,
        //   feature: savedProductDetail.feature,
        //   variety: savedProductDetail.variety,
        //   process_method: savedProductDetail.process_method,
        //   acidity: savedProductDetail.acidity,
        //   flavor: savedProductDetail.flavor,
        //   aftertaste: savedProductDetail.aftertaste,
        //   description: savedProductDetail.description,
        //   classification_id: savedProductDetail.classification_id,
        // },
      });
    } catch (error) {
      logger.error('新增商品詳情錯誤:', error);
      next(error);
    }
  },
};

module.exports = adminController;
