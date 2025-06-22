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

  async getCart(req, res, next) {
    try {
      const { id } = req.user;
      const cartRepository = dataSource.getRepository('Cart');

      // 1. 尋找使用者的購物車
      const cart = await cartRepository.findOne({
        where: { user_id: id, deleted_at: IsNull() },
        relations: ['Cart_link_product', 'Cart_link_product.Product', 'Discount_method'],
      });

      if (!cart || !cart.Cart_link_product || cart.Cart_link_product.length === 0) {
        return res.status(200).json({
          message: '購物車是空的',
          data: {
            items: [],
            total_price: 0,
            discount: 0,
            final_price: 0,
          },
        });
      }

      // 3. 整理購物車項目並計算商品總價
      let total_price = 0;
      const items = cart.Cart_link_product.map(item => {
        const single_total_price = item.price * item.quantity;
        total_price += single_total_price;
        return {
          product_id: item.Product.id,
          name: item.Product.name,
          image_url: item.Product.image_url,
          price: item.price,
          quantity: item.quantity,
          single_total_price,
        };
      });

      // 4. 計算折扣金額
      let discount = 0;
      const discountMethod = cart.Discount_method;
      if (discountMethod) {
        if (discountMethod.discount_percent < 1) {
          // 使用百分比折扣 (應該是折扣掉的部分)
          discount = Math.round(total_price * (1 - discountMethod.discount_percent));
        } else if (discountMethod.discount_price > 0) {
          // 使用固定金額折扣
          discount = discountMethod.discount_price;
        }
      }

      // 確保折扣金額不大於商品總價
      if (discount > total_price) {
        discount = total_price;
      }

      const final_price = total_price - discount;

      res.status(200).json({
        message: '取得成功',
        data: {
          items,
          total_price,
          discount,
          final_price,
        },
      });
    } catch (error) {
      logger.error('取得購物車內容錯誤:', error);
      next(error);
    }
  },

  async addToCart(req, res, next) {
    try {
      const userId = req.user.id;
      const { product_id, quantity } = req.body;

      // 基本欄位檢查
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ message: '加入購物車發生錯誤' });
      }

      const cartRepository = dataSource.getRepository('Cart');
      const productRepository = dataSource.getRepository('Product');
      const cartLinkProductRepository = dataSource.getRepository('Cart_link_product');

      // 取得或建立購物車
      let cart = await cartRepository.findOne({
        where: { user_id: userId, deleted_at: null },
      });
      if (!cart) {
        cart = cartRepository.create({ user_id: userId });
        cart = await cartRepository.save(cart);
      }

      // 查詢商品
      const product = await productRepository.findOne({
        where: { id: product_id, deleted_at: null },
      });
      if (!product) {
        return res.status(400).json({ message: '查無此商品' });
      }

      // 檢查庫存
      if (product.stock < quantity) {
        return res.status(400).json({ message: '商品庫存不足' });
      }

      // 查詢購物車內是否已有此商品
      let cartLinkProduct = await cartLinkProductRepository.findOne({
        where: { cart_id: cart.id, product_id: product_id, deleted_at: null },
      });

      if (cartLinkProduct) {
        // 已有則更新數量
        cartLinkProduct.quantity += quantity;
        await cartLinkProductRepository.save(cartLinkProduct);
      } else {
        // 沒有則新增
        cartLinkProduct = cartLinkProductRepository.create({
          cart_id: cart.id,
          product_id,
          quantity,
          price: product.price,
        });
        await cartLinkProductRepository.save(cartLinkProduct);
      }

      return res.status(200).json({ message: '新增成功' });
    } catch (error) {
      logger.error('加入購物車發生錯誤:', error);
    }
  },

  async getDiscount(req, res, next) {
    const { discount_kol } = req.body;
    const { id } = req.user;
    const discountRepo = dataSource.getRepository('Discount_method');
    const existDiscount = await discountRepo.findOne({
      where: { discount_kol },
    });

    if (!existDiscount) {
      res.status(400).json({
        message: '優惠碼錯誤',
      });
      return;
    }

    const cartInfo = await dataSource.getRepository('Cart').findOne({
      where: { id },
      relations: ['Cart_link_product', 'Cart_link_product.Product'],
    });

    // 計算購物車總價：quantity * price 的加總
    const totalPrice = cartInfo.Cart_link_product.reduce((sum, cartItem) => {
      return sum + cartItem.quantity * cartItem.price;
    }, 0);

    let result = 0;
    if (existDiscount.discount_percent !== 1) {
      result = totalPrice - existDiscount.discount_percent * totalPrice;
    } else if (existDiscount.discount_price > 0) {
      result = existDiscount.discount_price;
    }

    res.status(200).json({
      message: '輸入優惠碼成功',
      data: result,
    });
  },

  async getOrderReview(req, res, next) {
    try {
      const { id } = req.user;
      const shipping_fee = 80; // 固定運費

      const cartRepo = dataSource.getRepository('Cart');
      const userRepo = dataSource.getRepository('User');

      const cartPromise = cartRepo.findOne({
        where: { user_id: id },
        relations: ['Cart_link_product', 'Cart_link_product.Product', 'Discount_method'],
      });

      const userPromise = userRepo.findOne({
        where: { id },
        relations: ['Receiver'],
      });

      const [cart, user] = await Promise.all([cartPromise, userPromise]);

      if (!cart || !cart.Cart_link_product || cart.Cart_link_product.length === 0) {
        return res.status(400).json({ message: '購物車是空的' });
      }

      // 從 user 物件中取得 receiver
      const receiver = user ? user.Receiver : null;

      // 檢查收件人資訊是否完整
      if (!receiver || !receiver.name || !receiver.phone || !receiver.address) {
        return res.status(400).json({ message: '收件人資訊不完整，請先填寫收件人資訊' });
      }
      
      let totalPrice = 0;
      const orderItems = cart.Cart_link_product.map(item => {
        const subtotal = item.quantity * item.price;
        totalPrice += subtotal;
        return {
          product_id: item.product_id,
          name: item.Product.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: subtotal,
        };
      });

      let discount_amount = 0;
      if (cart.Discount_method) {
        if (cart.Discount_method.discount_price > 0) {
          discount_amount = cart.Discount_method.discount_price;
        } else if (cart.Discount_method.discount_percent < 1) {
          discount_amount = Math.round(totalPrice * (1 - cart.Discount_method.discount_percent));
        }
      }

      const grand_total = totalPrice + shipping_fee - discount_amount;

      const result = {
        orderItems,
        receiver: receiver && {
          name: receiver.name,
          phone: receiver.phone,
          post_code: receiver.post_code,
          address: receiver.address,
        },
        cost_summary: {
          totalPrice,
          shipping_fee,
          discount_amount,
          grand_total,
        },
      };

      res.status(200).json({
        message: '取得訂單預覽成功',
        data: result,
      });
    } catch (error) {
      logger.error('取得訂單預覽資訊錯誤:', error);
      next(error);
    }
  },

  async postCreateOrder(req, res, next) {
    const { name, phone, post_code, address } = req.body;
    const { id } = req.user;

    if (isUndefined(name) || isUndefined(phone) || isUndefined(post_code) || isUndefined(address)) {
      res.status(400).json({
        message: '欄位未填寫正確',
      });
      return;
    }

    if (isNotValidName(name)) {
      res.status(400).json({
        message: '收件者姓名格式錯誤',
      });
      return;
    }

    if (isNotValidTaiwanMobile(phone)) {
      res.status(400).json({
        message: '手機號碼不符合規則，需為台灣手機號碼',
      });
      return;
    }

    if (isNotValidTaiwanAddressAdvanced(address)) {
      res.status(400).json({
        message: '地址格式或郵遞區號錯誤，需為台灣地址',
      });
      return;
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cartRepo = queryRunner.manager.getRepository('Cart');
      const cart = await cartRepo.findOne({
        where: { user_id: id },
        relations: ['Cart_link_product', 'Cart_link_product.Product', 'Discount_method'],
      });

      if (!cart || !cart.Cart_link_product || cart.Cart_link_product.length === 0) {
        throw new Error('購物車是空的');
      }

      const productRepo = queryRunner.manager.getRepository('Product');
      for (const item of cart.Cart_link_product) {
        const product = item.Product;
        if (product.stock < item.quantity) {
          throw new Error(
            `商品 "${product.name}" 庫存不足 (剩餘 ${product.stock} 件)，無法建立訂單`
          );
        }
        product.stock -= item.quantity;
      }

      const shipping_fee = 80;
      let products_total = 0;
      cart.Cart_link_product.forEach(item => {
        products_total += item.price * item.quantity;
      });

      let discount_amount = 0;
      if (cart.Discount_method) {
        if (cart.Discount_method.discount_price > 0) {
          discount_amount = cart.Discount_method.discount_price;
        } else if (cart.Discount_method.discount_percent < 1) {
          discount_amount = Math.round(
            products_total * (1 - cart.Discount_method.discount_percent)
          );
        }
      }
      const grand_total = products_total + shipping_fee - discount_amount;

      // 檢查用戶是否已有收件人資訊
      const userRepo = queryRunner.manager.getRepository('User');
      const user = await userRepo.findOne({
        where: { id },
        relations: ['Receiver'],
      });

      let receiver_id;
      const receiverRepo = queryRunner.manager.getRepository('Receiver');

      if (user.Receiver) {
        // 更新現有的收件人資訊
        user.Receiver.name = name;
        user.Receiver.phone = phone;
        user.Receiver.post_code = post_code;
        user.Receiver.address = address;
        const updatedReceiver = await receiverRepo.save(user.Receiver);
        receiver_id = updatedReceiver.id;
      } else {
        // 建立新的收件人資訊
        const newReceiver = receiverRepo.create({
          name,
          phone,
          post_code,
          address,
        });
        const savedReceiver = await receiverRepo.save(newReceiver);

        // 更新用戶的 receiver_id
        user.receiver_id = savedReceiver.id;
        await userRepo.save(user);
        receiver_id = savedReceiver.id;
      }

      const orderRepo = queryRunner.manager.getRepository('Order');
      const now = new Date();
      const display_id = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

      const newOrder = orderRepo.create({
        display_id,
        user_id: id,
        receiver_id,
        is_paid: false,
        shipping_fee,
        total_price: grand_total,
        discount_id: cart.discount_id,
        // 此階段不設定 payment_method_id
        is_ship: false,
      });
      await orderRepo.save(newOrder);

      const orderLinkProductRepo = queryRunner.manager.getRepository('Order_link_product');
      const orderItems = cart.Cart_link_product.map(item =>
        orderLinkProductRepo.create({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })
      );
      await orderLinkProductRepo.save(orderItems);

      const updatedProducts = cart.Cart_link_product.map(item => item.Product);
      await productRepo.save(updatedProducts);

      const cartLinkProductRepo = queryRunner.manager.getRepository('Cart_link_product');
      await cartLinkProductRepo.delete({ cart_id: cart.id });
      cart.discount_id = null;
      await cartRepo.save(cart);

      await queryRunner.commitTransaction();

      res.status(201).json({
        message: '訂單建立成功',
        data: {
          order_id: newOrder.id,
          display_id: newOrder.display_id,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('建立訂單失敗:', error);

      if (error.message.includes('庫存不足')) {
        res.status(400).json({
          message: error.message,
        });
        return;
      }

      next(error);
    } finally {
      await queryRunner.release();
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

  async putCheckout(req, res, next) {
    try {
      const { display_id, payment_method_id } = req.body;
      const { id: user_id } = req.user;

      if (isUndefined(payment_method_id) || isNotValidInteger(payment_method_id)) {
        res.status(400).json({
          message: '請選擇付款方式',
        });
        return;
      }

      if (payment_method_id !== 1) {
        res.status(400).json({
          message: '金流交易維護中，請選擇貨到付款',
        });
        return;
      }

      const orderRepo = dataSource.getRepository('Order');
      const findOrder = await orderRepo.findOne({
        where: {
          display_id,
          user_id,
        },
      });

      if (!findOrder) {
        res.status(400).json({
          message: '查無此訂單',
        });
        return;
      }

      if (findOrder.is_paid) {
        return res.status(400).json({
          message: '此訂單已付款，無法重複結帳',
        });
      }

      // 目前暫時只接受 '貨到付款' 作為一個範例
      if (payment_method_id !== 1) {
        // 先假設 1 是 '貨到付款' 的 ID
        return res.status(400).json({
          message: '金流交易維護中，請選擇貨到付款',
        });
      }

      findOrder.payment_method_id = payment_method_id;

      const result = await orderRepo.save('Order');

      res.status(200).json({
        message: '結帳成功',
        data: {
          display_id: result.display_id,
        },
      });
    } catch (error) {
      logger.error('結帳過程失敗:', error);

      next(error);
    }
  },

  async postReceiver(req, res, next) {
    try {
      const { id } = req.user;
      const { name, phone, post_code, address } = req.body;
      if (
        isUndefined(name) ||
        isUndefined(phone) ||
        isUndefined(post_code) ||
        isUndefined(address)
      ) {
        res.status(400).json({
          message: '欄位未填寫正確',
        });
        return;
      }

      if (isNotValidName(name)) {
        res.status(400).json({
          message: '收件者姓名格式錯誤',
        });
        return;
      }

      if (isNotValidTaiwanMobile(phone)) {
        res.status(400).json({
          message: '手機號碼不符合規則，需為台灣手機號碼',
        });
        return;
      }

      if (isNotValidTaiwanAddressAdvanced(address)) {
        res.status(400).json({
          message: '地址格式或郵遞區號錯誤，需為台灣地址',
        });
        return;
      }

      const userRepo = dataSource.getRepository('User');
      const receiverRepo = dataSource.getRepository('Receiver');

      const findUser = await userRepo.findOne({
        where: { id },
        relations: ['Receiver'],
      });
      if (findUser.Receiver) {
        findUser.Receiver.name = name;
        findUser.Receiver.phone = phone;
        findUser.Receiver.post_code = post_code;
        findUser.Receiver.address = address;

        await receiverRepo.save(findUser.Receiver);

        res.status(200).json({
          message: '收件人資訊更新成功',
          data: findUser.Receiver,
        });
      } else {
        console.log('未偵測到舊資料，執行新增...');
        const newReceiver = receiverRepo.create({
          name,
          phone,
          post_code,
          address,
        });

        const savedReceiver = await receiverRepo.save(newReceiver);

        findUser.receiver_id = savedReceiver.id;
        await userRepo.save(findUser);

        res.status(201).json({
          message: '收件人資訊新增成功',
          data: savedReceiver,
        });
      }
    } catch (error) {
      logger.error('處理收件人資訊失敗:', error);
      next(error);
    }
  },

  async getCheckout(req, res, next) {
    try {
      const { id: user_id } = req.user;
      const { order_id } = req.query;

      if (!order_id) {
        res.status(400).json({
          message: '缺少訂單編號',
        });
        return;
      }

      const orderRepo = dataSource.getRepository('Order');

      const order = await orderRepo.findOne({
        where: {
          id: order_id,
          user_id: user_id,
        },
        relations: ['Receiver'],
      });

      if (!order) {
        return res.status(400).json({ message: '找不到此訂單' });
      }

      if (!order.Receiver) {
        return res.status(400).json({ message: '找不到此訂單的收件人資訊' });
      }

      const checkoutData = {
        order: {
          display_id: order.display_id,
          total_price: order.total_price,
        },
        receiver: {
          name: order.Receiver.name,
          phone: order.Receiver.phone,
          address: `${order.Receiver.post_code} ${order.Receiver.address}`,
        },
      };

      res.status(200).json({
        message: '取得結帳資訊成功',
        data: checkoutData,
      });
    } catch (error) {
      logger.error('取得結帳資訊失敗:', error);
      next(error);
    }
  },
};

module.exports = usersController;
