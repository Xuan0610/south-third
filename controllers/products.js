const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('ProductsController');
const Classification = require('../entities/Classification');

const { isNotValidInteger, isNotValidString } = require('../utils/validUtils');

const productsController = {
  // 取得所有產品簡易資訊
  async getProducts(req, res, next) {
    try {
      const { page, classification } = req.query;
      const perPage = 8;
      const pageNum = Number(page);

      if (isNotValidInteger(pageNum) || isNaN(pageNum) || pageNum < 1) {
        logger.warn('查無此頁數');
        res.status(400).json({
          message: '查無此頁數',
        });
        return;
      }

      const queryOptions = {
        relations: ['Product_detail'],
        take: perPage,
        skip: perPage * (pageNum - 1),
        where: {},
      };

      const classificationRepo = dataSource.getRepository('Classification');

      if (classification) {
        const findClassification = await classificationRepo.findOne({
          where: { id: classification },
        });

        if (isNotValidString(classification) || !findClassification) {
          logger.warn('查無此分類');
          res.status(400).json({
            message: '查無此分類',
          });
          return;
        }
      }

      const productRepo = dataSource.getRepository('Product');
      const findProduct = await productRepo.find(queryOptions);

      const productResult = findProduct.map((products) => ({
        id: products.id,
        name: products.name,
        image_url: products.image_url,
        feature: products.Product_detail.feature,
        price: products.price,
      }));

      const allClassifications = await classificationRepo.find({
        select: ['id', 'name'],
      });

      res.status(200).json({
        message: '成功',
        data: {
          products: productResult,
          classification: allClassifications,
        },
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },

  // 取得單一商品詳細資訊
  async getProductId(req, res, next) {
    try {
      const { products_id } = req.params;
      const productRepo = dataSource.getRepository('Product');

      const findProduct = await productRepo.findOne({
        where: { id: products_id },
        relations: ['Product_detail', 'Product_detail.Classification'],
      });

      if (!findProduct) {
        logger.warn('查無此商品');
        res.status(400).json({
          message: '查無此商品',
        });
        return;
      }

      const { id, name, image_url, stock, price, Product_detail } = findProduct;
      const {
        origin,
        feature,
        variety,
        process_method,
        acidity,
        flavor,
        aftertaste,
        description,
      } = Product_detail;

      const result = {
        id,
        classification_name: Classification.name,
        name,
        origin,
        image_url,
        stock,
        feature,
        variety,
        process_method,
        acidity,
        flavor,
        aftertaste,
        price,
        description,
      };

      res.status(200).json({
        message: '成功',
        data: result,
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },
};

module.exports = productsController;
