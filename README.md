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
MONGO_VNPY_USER=your_username
MONGO_VNPY_PASS=your_password
MONGO_VNPY_HOST=your_mongodb_host
MONGO_VNPY_PORT=27024
MONGO_VNPY_DB=vnpy

MONGO_CRYPTO_USER=your_username
MONGO_CRYPTO_PASS=your_password
MONGO_CRYPTO_HOST=your_mongodb_host
MONGO_CRYPTO_PORT=27024
MONGO_CRYPTO_DB=crypto_daily
```

### 3. 安装依赖
```bash
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

## 数据库要求

### MongoDB 集合

#### 1. bar_data (行情数据) - `vnpy` 数据库
存储 K 线数据：

| 字段 | 类型 | 说明 |
|------|------|------|
| symbol | String | 交易对 (小写，如 `btcusdt`) |
| exchange | String | 交易所 (`LOCAL`) |
| interval | String | 时间周期 (`1h`, `4h`, `1d`) |
| datetime | Date | K线时间 |
| open_price | Number | 开盘价 |
| high_price | Number | 最高价 |
| low_price | Number | 最低价 |
| close_price | Number | 收盘价 |
| volume | Number | 成交量 |

**查询示例：**
```javascript
// 获取 btcusdt 1小时K线数据
db.bar_data.find({
  symbol: 'btcusdt',      // 小写
  exchange: 'LOCAL',
  interval: '1h'
}).sort({ datetime: -1 }).limit(500)
```

**注意：** 前端支持大写 symbol（如 `BTCUSDT`），后端会自动转为小写查询。

#### 2. btc_strategy (策略信号) - `crypto_daily` 数据库
存储策略交易信号：

| 字段 | 类型 | 说明 |
|------|------|------|
| record_id | String | 记录ID (格式: `strategy_id:日期`) |
| record_type | String | 记录类型 (如 `daily_signal`) |
| strategy_id | String | 策略ID (如 `strategy_3`) |
| symbol | String | 交易对 (如 `btcusdt`) |
| date | Date | 信号日期 |
| action | String | 操作类型 (`buy`, `sell`, `hold`) |
| position | Number | 当前持仓 |
| target_pos | Number | 目标持仓 |
| price | Number | 信号价格 |
| execution_price | Number | 执行价格 (可为 null) |
| execute_time | Date | 执行时间 (可为 null) |
| execute_time_global | String | 执行时间-全球时区 (如 `2026-05-23 07:00:00`) |
| execute_time_asia | String | 执行时间-亚洲时区 (如 `2026-05-23 15:00:00`) |
| btc_qty | Number | BTC 数量 |
| trade_qty | Number | 交易数量 |
| equity | Number | 当前权益 |
| initial_capital | Number | 初始资金 |
| data_updated_at | Date | 数据更新时间 |
| signal_updated_at | Date | 信号更新时间 |
| position_hold | Number | 持仓数量 |
| prev_position_hold | Number | 上次持仓数量 |
| position_action | String | 持仓动作 (`open`, `close`, `hold`) |

#### 查询示例
```javascript
// 获取 strategy_3 的所有交易信号
db.btc_strategy.find({
  strategy_id: 'strategy_3',
  record_type: 'daily_signal',
  position_action: { $in: ['open', 'close'] }
}).sort({ date: 1 })
```

## 功能

- 实时行情 K 线图 (TradingView 风格)
- 多时间周期切换 (1H / 4H / 1D)
- 策略信号标记 (买卖点)
- 盈亏统计面板
- 权益曲线图
- 中英文切换
- 支持 BTC / ETH / SOL / BNB

## 技术栈

- Frontend: React, lightweight-charts (TradingView)
- Backend: Express.js, Mongoose
- Database: MongoDB

## 默认策略

系统默认使用 `strategy_3`，支持以下策略：
- strategy_1
- strategy_2
- strategy_3

## 登录账号

- 用户名: `admin`
- 密码: `crypto123`