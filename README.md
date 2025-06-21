# 啡豆咖啡 E-commerce API

這是一個為「啡豆咖啡」線上商店設計的後端 API 專案，提供了一個完整的電子商務解決方案，包含使用者管理、商品管理、購物車、以及完整的訂單處理流程。

## ✨ 功能特色

- **使用者系統**:
  - 註冊與登入 (JWT 驗證)
  - 忘記密碼與重設密碼
  - 會員資料管理 (Profile)
- **商品系統**:
  - 多層級商品分類
  - 完整的商品資訊與規格
  - 公開的商品列表與詳情查詢
- **購物車系統**:
  - 新增、查詢購物車內容
  - 支援優惠碼 (Discount Code) 折扣
- **訂單系統**:
  - 從購物車建立訂單
  - 交易安全機制 (庫存檢查、後端計價、資料庫交易)
  - 訂單狀態追蹤
- **管理後台**:
  - 管理員專屬的商品與分類管理 API

## 🛠️ 技術棧

- **後端**: Node.js, Express.js
- **資料庫**: PostgreSQL
- **ORM**: TypeORM
- **驗證**: JSON Web Tokens (JWT), bcrypt
- **容器化**: Docker, Docker Compose
- **日誌**: Pino
- **環境變數**: dotenv

## 📋 資料庫關係圖 (ERD)

本專案的資料庫結構遵循以下的 ERD 設計：

[點擊查看 ERD on dbdiagram.io](https://dbdiagram.io/d/coffeesouth3-67fd2c0b9cea640381aaa957)

## 🚀 API 端點文件

### Auth & Users (`/api/users`)

| Method | Endpoint               | 權限   | 描述                                |
| ------ | ---------------------- | ------ | ----------------------------------- |
| POST   | `/signup`              | Public | 使用者註冊                          |
| POST   | `/login`               | Public | 使用者登入                          |
| PATCH  | `/forget`              | Public | 忘記密碼 (寄送重設信件)             |
| PATCH  | `/reset-password`      | Public | 使用 token 重設密碼                 |
| GET    | `/membership/profile`  | User   | 取得使用者個人資料                  |
| PUT    | `/membership/profile`  | User   | 更新使用者個人資料                  |
| GET    | `/membership/receiver` | User   | 取得使用者預設收件資訊              |
| GET    | `/discount`            | User   | 套用優惠碼至購物車                  |
| GET    | `/orderReview`         | User   | 取得訂單預覽資訊 (購物車、費用明細) |
| POST   | `/membership/order`    | User   | 從購物車建立訂單                    |

### Products (`/api/products`)

| Method | Endpoint       | 權限   | 描述                      |
| ------ | -------------- | ------ | ------------------------- |
| GET    | `/`            | Public | 取得所有商品列表 (可分頁) |
| GET    | `/:product_id` | Public | 取得單一商品詳細資訊      |
| GET    | `/bestSeller`  | Public | 取得暢銷商品              |
| GET    | `/extras`      | Public | 取得加購商品              |

### Admin (`/api/admin`)

| Method | Endpoint          | 權限  | 描述                 |
| ------ | ----------------- | ----- | -------------------- |
| GET    | `/classification` | Admin | 取得所有商品分類     |
| POST   | `/classification` | Admin | 新增商品分類         |
| GET    | `/product_detail` | Admin | 取得所有商品詳細規格 |
| POST   | `/product_detail` | Admin | 新增商品詳細規格     |
| POST   | `/products`       | Admin | 新增商品             |
| GET    | `/:product_id`    | Admin | 取得單一商品後台資訊 |
| PUT    | `/:product_id`    | Admin | 更新單一商品資訊     |

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

在專案根目錄下，複製 `.env.example` (如果有的話) 或手動建立一個新的 `.env` 檔案。填入以下必要的環境變數：

```env
# 伺服器設定
PORT=8080

# 資料庫連線 (for Docker Compose)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# JWT 密鑰設定
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_DAY=7d
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

此指令會背景執行 `docker-compose up`。第一次啟動會需要一些時間來下載映像檔和建立容器。

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
- **停止專案**:
  ```bash
  npm stop
  ```
- **完整清除 (包含資料庫)**:
  ```bash
  npm run clean
  ```
