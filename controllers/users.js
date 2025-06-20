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
const { sendResetEmail } = require('../utils/mailer');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const { password } = require('../config/db');

const usersController = {
  async postSignup(req, res, next) {
    try {
      const { email, password, name } = req.body;
      if (
        isUndefined(name) ||
        isNotValidString(name) ||
        isUndefined(email) ||
        isNotValidString(email) ||
        isUndefined(password) ||
        isNotValidString(password)
      ) {
        logger.warn('欄位未填寫正確');
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }
      if (isNotValidEmail(email)) {
        logger.warn('建立使用者錯誤: 信箱格式錯誤');
        res.status(400).json({
          message: '信箱格式錯誤',
        });
        return;
      }
      if (isNotValidPassword(password)) {
        logger.warn(
          '建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
        );
        res.status(400).json({
          message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字',
        });
        return;
      }
      if (isNotValidName(name)) {
        logger.warn('建立使用者錯誤: 會員名稱長度不符');
        res.status(400).json({
          message: '會員名稱長度不符，最少 2 個字元，最長 10 字元，不得包含特殊字元與空白',
        });
        return;
      }

      const userRepository = dataSource.getRepository('User');
      const existingUser = await userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        logger.warn('建立使用者錯誤: Email 已被使用');
        res.status(409).json({
          message: '註冊失敗，Email 已被使用',
        });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const newUser = userRepository.create({
        name,
        email,
        role: 'USER',
        password: hashPassword,
      });
      const savedUser = await userRepository.save(newUser);
      logger.info('新建立的使用者ID:', savedUser.id);
      res.status(201).json({
        message: '註冊成功',
        data: {
          USER: {
            name: savedUser.name,
          },
        },
      });
    } catch (error) {
      logger.error('建立使用者錯誤:', error);
      next(error);
    }
  },

  async postLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      if (
        isUndefined(email) ||
        isNotValidString(email) ||
        isUndefined(password) ||
        isNotValidString(password)
      ) {
        logger.warn('欄位未填寫正確');
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }
      if (isNotValidEmail(email)) {
        logger.warn('建立使用者錯誤: 信箱格式錯誤');
        res.status(400).json({
          message: '信箱格式錯誤',
        });
        return;
      }
      if (isNotValidPassword(password)) {
        logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字');
        res.status(400).json({
          message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字',
        });
        return;
      }
      const userRepository = dataSource.getRepository('User');
      const existingUser = await userRepository.findOne({
        select: ['id', 'name', 'password', 'role'],
        where: { email },
      });

      if (!existingUser) {
        res.status(401).json({
          message: '使用者不存在或密碼輸入錯誤',
        });
        return;
      }
      logger.info(`使用者資料: ${JSON.stringify(existingUser)}`);
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        res.status(401).json({
          message: '使用者不存在或密碼輸入錯誤',
        });
        return;
      }
      const token = await generateJWT(
        {
          id: existingUser.id,
          role: existingUser.role,
        },
        config.get('secret.jwtSecret'),
        {
          expiresIn: `${config.get('secret.jwtExpiresDay')}`,
        }
      );

      res.status(201).json({
        data: {
          token,
          user: {
            name: existingUser.name,
            role: existingUser.role,
          },
        },
      });
    } catch (error) {
      logger.error('登入錯誤:', error);
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const { id } = req.user;
      const userRepository = dataSource.getRepository('User');
      const user = await userRepository.findOne({
        select: ['name', 'gender', 'birth_date', 'phone', 'address'],
        where: { id },
      });
      res.status(200).json({
        message: '登入成功',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('取得使用者資料錯誤:', error);
      next(error);
    }
  },

  async putProfile(req, res, next) {
    try {
      const { id } = req.user;
      const { name, gender, birth_date, phone, address } = req.body;
      if (
        isUndefined(name) ||
        isUndefined(gender) ||
        isUndefined(birth_date) ||
        isUndefined(phone) ||
        isUndefined(address)
      ) {
        logger.warn('欄位未填寫正確');
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }
      if (isNotValidName(name) || isNotValidString(name)) {
        logger.warn('編輯使用者錯誤: 姓名格式錯誤');
        res.status(400).json({
          message: '姓名格式錯誤',
        });
        return;
      }
      if (isNotValidGender(gender)) {
        logger.warn('編輯使用者錯誤: 性別格式錯誤');
        res.status(400).json({
          message: '性別格式錯誤',
        });
        return;
      }
      if (isNotValidBirthday(birth_date)) {
        logger.warn('編輯使用者錯誤: 生日格式錯誤');
        res.status(400).json({
          message: '生日格式錯誤',
        });
        return;
      }
      if (isNotValidTaiwanMobile(phone)) {
        logger.warn('編輯使用者錯誤: 手機格式錯誤');
        res.status(400).json({
          message: '手機號碼不符合規則，需為台灣手機號碼',
        });
        return;
      }
      if (isNotValidTaiwanAddressAdvanced(address) && address !== '') {
        logger.warn('編輯使用者錯誤: 地址格式錯誤');
        res.status(400).json({
          message: '地址格式錯誤，需為台灣地址',
        });
        return;
      }
      const userRepository = dataSource.getRepository('User');
      const user = await userRepository.findOne({
        select: ['name', 'gender', 'birth_date', 'phone', 'address'],
        where: {
          id,
        },
      });
      if (
        user.name === name &&
        user.gender === gender &&
        user.birth_date === birth_date &&
        user.phone === phone &&
        user.address === address
      ) {
        res.status(400).json({
          message: '使用者資料未變更',
        });
        return;
      }
      const updatedResult = await userRepository.update(
        {
          id,
        },
        {
          name,
          gender,
          birth_date,
          phone,
          address,
        }
      );
      if (updatedResult.affected === 0) {
        res.status(400).json({
          message: '更新使用者資料失敗',
        });
        return;
      }
      const result = await userRepository.findOne({
        select: ['name', 'gender', 'birth_date', 'phone', 'address'],
        where: {
          id,
        },
      });
      res.status(200).json({
        data: {
          user: result,
        },
      });
    } catch (error) {
      logger.error('取得使用者資料錯誤:', error);
      next(error);
    }
  },

  async getReceiver(req, res, next) {
    try {
      const { id } = req.user;
      const receiverRepository = dataSource.getRepository('Receiver');
      const findUser = await receiverRepository.findOne({
        select: ['name', 'phone', 'post_code', 'address'],
        where: { id },
      });
      res.status(200).json({
        data: findUser,
      });
    } catch (error) {
      logger.error('取得收件資訊錯誤:', error);
      next(error);
    }
  },

  async patchForget(req, res, next) {
    try {
      const { email } = req.body;
      if (isUndefined(email) || isNotValidEmail(email)) {
        res.status(400).json({
          message: '信箱格式錯誤',
        });
        return;
      }
      const userRepository = dataSource.getRepository('User');
      const existingUser = await userRepository.findOne({
        where: { email },
      });

      res.status(202).json({
        message: '寄送成功',
      });

      if (!existingUser) {
        logger.warn(`信箱不存在，${req.ip}`);
        return; // 帳號不存在就會停止在這邊
      }
      // google、token、nodemailer
      const token = nanoid(20);
      sendResetEmail(email, token);
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const forgetTokenExpire = new Date(Date.now() + 30 * 60 * 1000); // set 30 min expire
      await userRepository.update(
        { email },
        {
          forget_token: tokenHash,
          forget_token_expire: forgetTokenExpire,
          forget_token_is_used: 0,
        }
      );
    } catch (error) {
      logger.error('使用者忘記密碼錯誤:', error);
      next(error);
    }
  },

  async patchResetPassword(req, res, next) {
    try {
      const { newPassword, newPasswordCheck } = req.body;
      const { token } = req.query;
      if (isUndefined(token) || isUndefined(newPassword) || isUndefined(newPasswordCheck)) {
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }
      const checkToken = crypto.createHash('sha256').update(token).digest('hex');
      const userRepository = dataSource.getRepository('USER');
      const findUser = await userRepository.findOne({
        select: [
          'id',
          'name',
          'password',
          'role',
          'forget_token_is_used',
          'forget_token_expire',
          'forget_token',
        ],
        where: { forget_token: checkToken },
      });
      if (
        !findUser ||
        findUser.forget_token_is_used === 1 ||
        new Date() > new Date(findUser.forget_token_expire)
      ) {
        res.status(401).json({
          message: 'Token錯誤或已過期',
        });
        return;
      }
      if (newPassword !== newPasswordCheck) {
        res.status(400).json({
          message: '兩次密碼不相符',
        });
        return;
      }
      if (isNotValidPassword(newPassword)) {
        res.status(400).json({
          message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字',
        });
        return;
      }
      const isMatch = await bcrypt.compare(newPassword, findUser.password);
      if (isMatch) {
        res.status(400).json({
          message: '密碼歷程記錄不符',
        });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(newPassword, salt);
      const existUser = await userRepository.update(
        {
          forget_token: checkToken,
        },
        {
          password: newHashPassword,
          forget_token_is_used: 1,
        }
      );
      if (existUser.affected === 0) {
        res.status(400).json({
          message: '使用者資料未更新',
        });
        return;
      }
      res.status(200).json({
        message: '密碼更新成功',
      });
    } catch (error) {
      logger.warn('使用者重設密碼錯誤:', error);
      next(error);
    }
  },

  async getUserOrders(req, res, next) {
    try {
      const { id } = req.user;
      const { page } = req.query;
      const perPage = 10;
      const pageNum = page ? Number(page) : 1;

      if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
        logger.warn('查無此頁數');
        res.status(400).json({
          message: '查無此頁數',
        });
        return;
      }

      const ordersRepo = dataSource.getRepository('Order');
      const orders = await ordersRepo.find({
        where: { user_id: id },
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
          is_ship: order.is_ship ? 1 : 0,
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
      const { id } = req.user;
      const { order_id } = req.params;

      const ordersRepo = dataSource.getRepository('Order');
      const order = await ordersRepo.findOne({
        where: { user_id: id, order_id },
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

module.exports = usersController;
