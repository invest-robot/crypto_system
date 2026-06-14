# Web 3.0 Trading Dashboard

加密货币交易信号仪表板，支持多策略K线图、买卖信号标记和盈亏统计。

## 项目结构

```
crypto_system/
├── server/              # Node.js 后端 (端口 5000)
│   └── index.js
├── client/               # React 前端 (端口 3001)
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       └── App.css
├── .env                  # 数据库配置 (不上传GitHub)
├── .env.example          # 配置模板
├── .gitignore
├── nodemon.json
├── start.bat / stop.bat  # Windows 启动脚本
├── start.sh / stop.sh    # Linux/Mac 启动脚本
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
# vnpy 数据库: K线行情数据
MONGO_VNPY_USER=your_username
MONGO_VNPY_PASS=your_password
MONGO_VNPY_HOST=your_mongodb_host
MONGO_VNPY_PORT=27024
MONGO_VNPY_DB=vnpy

# crypto 数据库: 策略信号和策略介绍
# 两个数据库:
#   - crypto_daily: 交易信号 (btc_strategy / eth_strategy / sol_strategy)
#   - crypto_strategy: 策略描述 (strategy_info)
# 数据库名固定在服务器代码中, 这里只配置凭证/地址/端口
MONGO_CRYPTO_USER=your_username
MONGO_CRYPTO_PASS=your_password
MONGO_CRYPTO_HOST=your_mongodb_host
MONGO_CRYPTO_PORT=27024
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
npm run client  # 前端 3001 端口
```

或使用脚本：
- Windows: 双击 `start.bat` 启动，`stop.bat` 停止
- Linux/Mac: 运行 `./start.sh` 启动，`./stop.sh` 停止

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
db.bar_data.find({
  symbol: 'btcusdt',
  exchange: 'LOCAL',
  interval: '1h'
}).sort({ datetime: -1 }).limit(500)
```

#### 2. 交易信号集合 - `crypto_daily` 数据库
按交易对分集合存储策略交易信号：

| 集合 | 标的 |
|------|------|
| `btc_strategy` | BTC (含 strategy_1, strategy_2, strategy_3, strategy_4) |
| `eth_strategy` | ETH (strategy_5) |
| `sol_strategy` | SOL (strategy_6) |

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| record_id | String | 记录ID (格式: `strategy_id:日期`) |
| record_type | String | 记录类型 (`daily_signal`) |
| strategy_id | String | 策略ID (如 `strategy_3`) |
| symbol | String | 交易对 (如 `btcusdt`) |
| date | Date | 信号日期 |
| action | String | 操作类型 (`buy`, `sell`, `hold`) |
| position | Number | 当前持仓 |
| target_pos | Number | 目标持仓 |
| price | Number | 信号价格 |
| execution_price | Number | 执行价格 |
| execute_time_global | String | 执行时间-全球时区 |
| execute_time_asia | String | 执行时间-亚洲时区 |
| trade_qty | Number | 交易数量（带正负号：正=买入，负=卖出） |
| equity | Number | 当前权益 |
| initial_capital | Number | 初始资金 |
| position_action | String | 持仓动作 (`open`, `close`, `hold`) |

**查询示例：**
```javascript
db.btc_strategy.find({
  strategy_id: 'strategy_3',
  record_type: 'daily_signal',
  position_action: { $in: ['open', 'close'] }
}).sort({ date: 1 })
```

#### 3. strategy_info (策略介绍) - `crypto_strategy` 数据库
存储策略介绍和类型：

| 字段 | 类型 | 说明 |
|------|------|------|
| strategy_id | String | 策略ID |
| symbol | String | 交易对 (小写) |
| 介绍 | String | 策略描述 |
| 杠杆 | String | 杠杆/收益摘要 |
| 信号交易执行判断 | String | 执行规则 |
| strategy_type | String | `intraday_strategy` 或 `daily_strategy` |

**注意字段名是中文字段名**

**strategy_type 字段决定 P&L 计算算法：**
- `intraday_strategy`: 用 **running-position 算法**（支持加仓/反手/部分平仓）
- `daily_strategy` 或未设置: 用 **open/close 栈算法**

**查询示例：**
```javascript
db.strategy_info.find({ strategy_id: 'strategy_3' })
```

## 支持的策略

| strategy_id | 标的 | strategy_type | 算法 |
|-------------|------|---------------|------|
| strategy_1 | BTC | daily_strategy | 栈算法 |
| strategy_2 | BTC | daily_strategy | 栈算法 |
| strategy_3 | BTC | daily_strategy | 栈算法 |
| strategy_4 | BTC | intraday_strategy | running-position |
| strategy_5 | BTC | intraday_strategy | running-position |
| strategy_8 | ETH | daily_strategy | 栈算法 |
| strategy_9 | SOL | daily_strategy | 栈算法 |
| strategy_10 | BTC | intraday_strategy | running-position |

## P&L 计算逻辑

### daily_strategy（栈算法）
按时间顺序遍历 open/close 配对：
- **LONG（buy → sell）**: `profit = (卖价 - 买价) × 数量`
- **SHORT（sell → buy）**: `profit = (卖价 - 买价) × 数量`

每笔 P&L 累加，总和缩放到 equity 字段算出的总盈亏。

### intraday_strategy（running-position 算法）
维护 `runningPos`（当前净仓位）和 `avgEntryPrice`（平均开仓价）：
- 仓位变化方向与 runningPos 相同 → 加仓，更新均价
- 仓位变化方向与 runningPos 相反 → 减仓/平仓/反手，按均价计算实现 P&L
- 处理**加仓、减仓、反手、部分平仓**等复杂情况

每笔 P&L 按时间排序后累加，总和缩放到 equity 字段算出的总盈亏。

## 功能

- 实时行情 K 线图 (TradingView 风格)
- 多时间周期切换 (1H / 4H / 1D)
- 策略信号标记 (买卖点)
- 盈亏统计面板
- 权益曲线图
- 中英文切换
- 多币种支持 (BTC / ETH / SOL)

## 技术栈

- Frontend: React, lightweight-charts (TradingView)
- Backend: Express.js, Mongoose
- Database: MongoDB

## 登录账号

- 用户名: `admin`
- 密码: `crypto123`