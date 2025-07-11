# 築豆咖啡 E-commerce API

這是一個為「築豆咖啡」線上商店設計的後端 API 專案，提供了一個完整的電子商務解決方案，包含使用者管理、商品管理、購物車、以及完整的訂單處理流程。

## ✨ 功能特色

- **使用者系統**:
  - 註冊與登入 (JWT 驗證)
  - 忘記密碼與重設密碼 (Email 驗證)
  - 會員資料管理 (Profile)
  - 收件人資訊管理
- **商品系統**:
  - 多層級商品分類
  - 完整的商品資訊與規格
  - 公開的商品列表與詳情查詢
  - 暢銷商品與加購商品功能
- **購物車系統**:
  - 新增、查詢、更新購物車內容
  - 商品選擇狀態管理
  - 支援優惠碼 (Discount Code) 折扣
  - 購物車商品刪除
- **訂單系統**:
  - 從購物車建立訂單
  - 交易安全機制 (庫存檢查、後端計價、資料庫交易)
  - 訂單狀態追蹤與管理
  - 訂單歷史查詢
  - 結帳流程管理
- **管理後台**:
  - 管理員專屬的商品與分類管理 API
  - 訂單管理與狀態更新
  - 銷售統計與營收分析
  - 優惠碼與付款方式管理

## 🛠️ 技術棧

- **後端**: Node.js, Express.js
- **資料庫**: PostgreSQL 16.4
- **ORM**: TypeORM
- **驗證**: JSON Web Tokens (JWT), bcrypt
- **容器化**: Docker, Docker Compose
- **日誌**: Pino (結構化日誌)
- **環境變數**: dotenv
- **程式碼品質**: ESLint, Prettier
- **郵件服務**: Nodemailer
- **速率限制**: Express Rate Limit

## 📋 資料庫關係圖 (ERD)

本專案的資料庫結構遵循以下的 ERD 設計：

[點擊查看 ERD on dbdiagram.io](https://dbdiagram.io/d/coffeesouth3-67fd2c0b9cea640381aaa957)

### 主要資料表結構：

- **User**: 使用者基本資料
- **Product**: 商品資訊
- **Product_detail**: 商品詳細規格
- **Classification**: 商品分類
- **Cart**: 購物車
- **Cart_link_product**: 購物車商品關聯
- **Order**: 訂單
- **Order_link_product**: 訂單商品關聯
- **Receiver**: 收件人資訊
- **Discount_method**: 優惠方式
- **Payment_method**: 付款方式
- **User_discount_usage**: 使用者優惠使用紀錄

## 🚀 API 端點文件

### Auth & Users (`/api/v1/users`)

| Method | Endpoint                     | 權限   | 描述                                |
| ------ | ---------------------------- | ------ | ----------------------------------- |
| POST   | `/signup`                    | Public | 使用者註冊                          |
| POST   | `/login`                     | Public | 使用者登入                          |
| PATCH  | `/forget`                    | Public | 忘記密碼 (寄送重設信件)             |
| PATCH  | `/reset-password`            | Public | 使用 token 重設密碼                 |
| GET    | `/membership/profile`        | User   | 取得使用者個人資料                  |
| PUT    | `/membership/profile`        | User   | 更新使用者個人資料                  |
| GET    | `/membership/receiver`       | User   | 取得使用者預設收件資訊              |
| POST   | `/membership/receiver`       | User   | 新增/更新收件人資訊                 |
| GET    | `/membership/cart`           | User   | 取得購物車內容                      |
| POST   | `/membership/cart`           | User   | 新增商品至購物車                    |
| PATCH  | `/membership/cart`           | User   | 更新購物車商品數量                  |
| PATCH  | `/membership/cart/select`    | User   | 更新購物車商品選擇狀態              |
| PATCH  | `/membership/cart/discount`  | User   | 套用優惠碼至購物車                  |
| POST   | `/membership/cart/delete`    | User   | 刪除購物車商品                      |
| GET    | `/orderReview`               | User   | 取得訂單預覽資訊 (購物車、費用明細) |
| POST   | `/membership/order`          | User   | 從購物車建立訂單                    |
| GET    | `/membership/orders`         | User   | 取得使用者訂單列表                  |
| GET    | `/membership/:order_id`      | User   | 取得特定訂單詳細資訊                |
| GET    | `/checkout`                  | User   | 取得結帳資訊                        |
| PUT    | `/checkout`                  | User   | 更新結帳資訊                        |
| POST   | `/membership/discount`       | User   | 試算優惠碼折扣                      |
| POST   | `/membership/discount/usage` | User   | 儲存優惠碼使用紀錄                  |

### Products (`/api/v1/products`)

| Method | Endpoint       | 權限   | 描述                      |
| ------ | -------------- | ------ | ------------------------- |
| GET    | `/`            | Public | 取得所有商品列表 (可分頁) |
| GET    | `/:product_id` | Public | 取得單一商品詳細資訊      |
| GET    | `/bestSeller`  | Public | 取得暢銷商品              |
| GET    | `/extras`      | Public | 取得加購商品              |

### Admin (`/api/v1/admin`)

| Method | Endpoint            | 權限  | 描述                 |
| ------ | ------------------- | ----- | -------------------- |
| GET    | `/classification`   | Admin | 取得所有商品分類     |
| POST   | `/classification`   | Admin | 新增商品分類         |
| GET    | `/product_detail`   | Admin | 取得所有商品詳細規格 |
| POST   | `/product_detail`   | Admin | 新增商品詳細規格     |
| POST   | `/products`         | Admin | 新增商品             |
| GET    | `/:product_id`      | Admin | 取得單一商品後台資訊 |
| PUT    | `/:product_id`      | Admin | 更新單一商品資訊     |
| GET    | `/orders`           | Admin | 取得所有訂單列表     |
| GET    | `/orders/new`       | Admin | 取得新訂單           |
| GET    | `/orders/process`   | Admin | 取得處理中訂單       |
| GET    | `/orders/is_ship`   | Admin | 取得已出貨訂單       |
| GET    | `/orders/history`   | Admin | 取得訂單歷史         |
| GET    | `/orders/revenue`   | Admin | 取得營收統計         |
| PATCH  | `/orders/:order_id` | Admin | 更新訂單狀態         |
| POST   | `/discount`         | Admin | 新增優惠碼           |
| POST   | `/payment-method`   | Admin | 新增付款方式         |

---

## ⚙️ 安裝與啟動指南

### 1. 環境需求

- [Node.js](https://nodejs.org/) (v18.x 或以上版本)
- [Docker](https://www.docker.com/) 和 [Docker Compose](https://docs.docker.com/compose/)

### 2. 下載專案

```bash
git clone https://github.com/Xuan0610/south-third.git
cd south-third
```

### 3. 設定環境變數

在專案根目錄下建立 `.env` 檔案，填入以下必要的環境變數：

```env
# 伺服器設定
PORT=8080
NODE_ENV=development

# 資料庫連線 (for Docker Compose)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# JWT 密鑰設定
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_DAY=7d

# 郵件服務設定 (用於忘記密碼功能)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Firebase Admin (可選，用於推播通知)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 4. 安裝依賴套件

```bash
npm install
```

### 5. 啟動專案 (使用 Docker)

推薦使用 Docker Compose 來啟動專案，它會同時建立 Node.js 服務和 PostgreSQL 資料庫。

```bash
npm start
```

此指令會背景執行 `docker-compose up -d --build`。第一次啟動會需要一些時間來下載映像檔和建立容器。

### 6. 初始化資料庫綱要 (Schema)

當容器成功啟動後，執行以下指令來根據 TypeORM 的 entities 自動建立資料庫中的所有資料表。

```bash
npm run init:schema
```

### 7. 其他常用指令

- **開發模式 (本地)**: 如果你不想使用 Docker，並在本地端已經安裝了 PostgreSQL，可以使用 Nodemon 進行開發。
  ```bash
  # 需要修改 .env 中的 DB_HOST 為 localhost
  npm run dev
  ```
- **重新啟動專案**:
  ```bash
  npm run restart
  ```
- **停止專案**:
  ```bash
  npm stop
  ```
- **完整清除 (包含資料庫)**:
  ```bash
  npm run clean
  ```

## 🔧 開發工具

### 程式碼品質

- **ESLint**: 程式碼品質檢查
- **Prettier**: 程式碼格式化

### 日誌系統

專案使用 Pino 作為日誌系統，提供結構化的日誌輸出，便於除錯和監控。

### 安全性

- **JWT 驗證**: 安全的身份驗證機制
- **bcrypt**: 密碼加密
- **Rate Limiting**: API 速率限制防止濫用
- **CORS**: 跨域資源共享設定

## 📝 API 回應格式

所有 API 回應都遵循統一的格式：

### 成功回應

```json
{
  "status": "success",
  "data": {
    // 回應資料
  }
}
```

### 錯誤回應

```json
{
  "status": "error",
  "message": "錯誤訊息"
}
```

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 聯絡資訊

如有任何問題或建議，請透過以下方式聯絡：

- 專案 Issues: [GitHub Issues](https://github.com/Xuan0610/south-third/issues)
- Email: [cafe.south3@gmail.com]

---

**築豆咖啡 E-commerce API** - 為您的線上咖啡商店提供完整的後端解決方案 ☕
