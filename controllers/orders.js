const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('OrdersController');
// const Classification = require('../entities/Classification');
const { Between, Not, In } = require('typeorm');
const { isNotValidInteger, isNotValidString } = require('../utils/validUtils');

const ordersController = {
  // 取得用戶所有訂單
  async getUserOrders(req, res, next) {
    try {
      const { user_id } = req.params;
      const { page } = req.query;
      const perPage = 8;
      const pageNum = Number(page);

      if (isNotValidInteger(pageNum) || isNaN(pageNum) || pageNum < 1) {
        logger.warn('查無此頁數');
        res.status(400).json({
          message: '查無此頁數',
        });
        return;
      }

      const userRepo = dataSource.getRepository('User');
      const findUser = await userRepo.findOne({
        where: { id: user_id },
      });

      if (isNotValidString(user_id) || !findUser) {
        logger.warn('查無此用戶');
        res.status(400).json({
          message: '查無此用戶',
        });
        return;
      }

      const ordersRepo = dataSource.getRepository('Order');
      const orders = await ordersRepo.find({
        where: { user_id },
        relations: ['order_link_product', 'order_link_product.product'],
        take: perPage,
        skip: perPage * (pageNum - 1),
        order: {
          created_at: 'DESC',
        },
      });

      const ordersResult = orders.map(order => {
        // 格式化日期為 YYYYMMDD
        const createdDay = order.created_at.toISOString().slice(0, 10).replace(/-/g, '');

        // 取得第一個商品名稱作為代表
        const firstProduct = order.order_link_product[0]?.product;

        return {
          created_at: createdDay,
          display_id: order.display_id,
          product_name: firstProduct ? firstProduct.name : '無商品',
          total_price: order.total_price,
          is_paid: order.is_paid ? 1 : 0,
          is_shipped: order.is_shipped ? 1 : 0,
        };
      });

      res.status(200).json({
        message: '取得成功',
        data: ordersResult,
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },

  // 取得用戶單一訂單詳細資訊
  async getUserOrderDetail(req, res, next) {
    try {
      const { user_id, order_id } = req.params;

      const userRepo = dataSource.getRepository('User');
      const findUser = await userRepo.findOne({
        where: { id: user_id },
      });

      if (isNotValidString(user_id) || !findUser) {
        logger.warn('查無此用戶');
        res.status(400).json({
          message: '查無此用戶',
        });
        return;
      }

      const ordersRepo = dataSource.getRepository('Order');
      const order = await ordersRepo.findOne({
        where: { id: order_id, user_id },
        relations: [
          'order_link_product',
          'order_link_product.product',
          'order_link_product.product.Product_detail',
          'user',
          'discount',
        ],
      });

      if (!order) {
        logger.warn('查無此訂單');
        res.status(400).json({
          message: '查無此訂單',
        });
        return;
      }

      // 格式化日期為 YYYYMMDD
      const createdDay = order.created_at.toISOString().slice(0, 10).replace(/-/g, '');

      const orderDetail = {
        id: order.id,
        display_id: order.display_id,
        created_day: createdDay,
        user_id: order.user_id,
        receiver: {
          name: order.receiver_name,
          phone: order.receiver_phone,
          post_code: order.receiver_post_code,
          address: order.receiver_address,
        },
        items: order.order_link_product.map(item => ({
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        summary: {
          discount_kol: order.discount?.kol_code || null,
          product_total: order.order_link_product.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
          shipping_fee: order.shipping_fee,
          subtotal: order.total_price,
          discount: order.discount_amount || 0,
          grand_total: order.final_price,
        },
        created_at: order.created_at.toISOString(),
      };

      res.status(200).json({
        message: '成功',
        data: orderDetail,
      });
    } catch (error) {
      logger.error('伺服器錯誤', error);
      next(error);
    }
  },
};

module.exports = ordersController;
