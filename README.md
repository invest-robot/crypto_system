# Web 3.0 Trading Dashboard

加密货币交易信号仪表板，支持多策略K线图、买卖信号标记和盈亏统计。

## 项目结构

```
crypto_system/
├── server/              # Node.js 后端 (端口 5000)
│   └── index.js
├── client/               # React 前端 (端口 3001)
│   └── src/
│       ├── App.js
│       └── App.css
├── .env                  # 数据库配置 (不上传GitHub)
├── .env.example          # 配置模板
├── .gitignore
└── package.json
```

## 部署步骤

### 1. 克隆项目
```bash
git clone https://github.com/invest-robot/crypto_system.git
cd crypto_system
```

### 2. 配置数据库

复制配置文件并填入你的 MongoDB 信息：
```bash
cp .env.example .env
```

编辑 `.env`：
```env
MONGO_VNPY_USER=你的用户名
MONGO_VNPY_PASS=你的密码
MONGO_VNPY_HOST=你的MongoDB地址
MONGO_VNPY_PORT=27024
MONGO_VNPY_DB=vnpy

MONGO_CRYPTO_USER=你的用户名
MONGO_CRYPTO_PASS=你的密码
MONGO_CRYPTO_HOST=你的MongoDB地址
MONGO_CRYPTO_PORT=27024
MONGO_CRYPTO_DB=crypto_daily
```

### 3. 安装依赖
```bash
cd crypto_system
npm install
cd client && npm install
cd ..
```

### 4. 启动服务
```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run server  # 后端 5000 端口
npm run client  # 前端 3000 端口
```

### 5. 打开浏览器
访问 http://localhost:3001

登录账号: `admin` / `crypto123`

## 功能

- 实时行情 K 线图 (TradingView 风格)
- 多时间周期切换 (1H / 4H / 1D)
- 策略信号标记 (买卖点)
- 盈亏统计面板
- 权益曲线图
- 中英文切换
- 支持 BTC / ETH / SOL / BNB

## 数据库要求

- MongoDB 4.4+
- 需要以下集合：
  - `vnpy.bar_data` - K线行情数据
  - `crypto_daily.btc_strategy` - 策略信号数据
  - `crypto_daily.strategy_stats` - 策略统计数据

## 技术栈

- Frontend: React, lightweight-charts (TradingView)
- Backend: Express.js, Mongoose
- Database: MongoDB