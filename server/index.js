const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const requiredEnv = ['MONGO_VNPY_USER', 'MONGO_VNPY_PASS', 'MONGO_VNPY_HOST', 'MONGO_VNPY_DB', 'MONGO_CRYPTO_USER', 'MONGO_CRYPTO_PASS', 'MONGO_CRYPTO_HOST'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('Missing required .env variables:', missingEnv.join(', '));
  console.error('Copy .env.example to .env and fill in your MongoDB credentials.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

function calculateMDD(equities) {
  let cummax = [equities[0]];
  for (let i = 1; i < equities.length; i++) {
    cummax.push(Math.max(cummax[i-1], equities[i]));
  }
  
  let mdd = 0;
  let mddIdx = 0;
  for (let i = 0; i < equities.length; i++) {
    const dd = equities[i] / cummax[i] - 1;
    if (dd < mdd) {
      mdd = dd;
      mddIdx = i;
    }
  }
  return { mdd: mdd * 100, mddIdx };
}

const MONGO_VNPY = `mongodb://${process.env.MONGO_VNPY_USER}:${process.env.MONGO_VNPY_PASS}@${process.env.MONGO_VNPY_HOST}:${process.env.MONGO_VNPY_PORT}/${process.env.MONGO_VNPY_DB}?authSource=admin`;
const MONGO_CRYPTO = `mongodb://${process.env.MONGO_CRYPTO_USER}:${process.env.MONGO_CRYPTO_PASS}@${process.env.MONGO_CRYPTO_HOST}:${process.env.MONGO_CRYPTO_PORT}/crypto_daily?authSource=admin`;
const MONGO_STRATEGY_INFO = `mongodb://${process.env.MONGO_CRYPTO_USER}:${process.env.MONGO_CRYPTO_PASS}@${process.env.MONGO_CRYPTO_HOST}:${process.env.MONGO_CRYPTO_PORT}/crypto_strategy?authSource=admin`;

const conn1 = mongoose.createConnection(MONGO_VNPY);
const conn2 = mongoose.createConnection(MONGO_CRYPTO);
const conn3 = mongoose.createConnection(MONGO_STRATEGY_INFO);

conn1.asPromise()
  .then(() => console.log('Connected to vnpy'))
  .catch(err => console.error('Failed to connect to vnpy:', err.message));
conn2.asPromise()
  .then(() => console.log('Connected to crypto_daily'))
  .catch(err => console.error('Failed to connect to crypto_daily:', err.message));
conn3.asPromise()
  .then(() => console.log('Connected to crypto_strategy'))
  .catch(err => console.error('Failed to connect to crypto_strategy:', err.message));

const barDataSchema = new mongoose.Schema({
  symbol: String,
  interval: String,
  exchange: String,
  datetime: Date,
  open_price: Number,
  high_price: Number,
  low_price: Number,
  close_price: Number,
  volume: Number
}, { collection: 'bar_data' });

const BarData = conn1.model('BarData', barDataSchema);

const signalSchema = new mongoose.Schema({
  record_id: String,
  record_type: String,
  strategy_id: String,
  strategy_name: String,
  symbol: String,
  date: Date,
  action: String,
  side: String,
  position: Number,
  price: Number,
  execution_price: Number,
  execute_time_global: String,
  execute_time_asia: String,
  btc_qty: Number,
  trade_qty: Number,
  trade_value: Number,
  pnl: Number,
  profit: Number,
  equity: Number,
  initial_capital: Number,
  data_updated_at: Date,
  signal_updated_at: Date,
  position_action: String,
  position_hold: Number
}, { collection: 'btc_strategy' });

const Signal = conn2.model('Signal', signalSchema);

const ethSignalSchema = new mongoose.Schema({}, { collection: 'eth_strategy', strict: false });
const EthSignal = conn2.model('EthSignal', ethSignalSchema);

const solSignalSchema = new mongoose.Schema({}, { collection: 'sol_strategy', strict: false });
const SolSignal = conn2.model('SolSignal', solSignalSchema);

const strategyInfoSchema = new mongoose.Schema({}, { collection: 'strategy_info', strict: false });
const StrategyInfo = conn3.model('StrategyInfo', strategyInfoSchema);

function getSignalModel(symbol) {
  const s = symbol.toLowerCase();
  if (s === 'ethusdt') return EthSignal;
  if (s === 'solusdt') return SolSignal;
  return Signal;
}

app.get('/api/market/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 500 } = req.query;
    const data = await BarData.find({
      symbol: symbol.toLowerCase(),
      exchange: 'LOCAL',
      interval: interval
    }).sort({ datetime: -1 }).limit(parseInt(limit));
    
    const formatted = data.map(d => ({
      datetime: d.datetime,
      open: d.open_price,
      high: d.high_price,
      low: d.low_price,
      close: d.close_price,
      volume: d.volume
    }));
    
    res.json({ interval, data: formatted.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/strategies/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const Model = getSignalModel(symbol);
    const strategies = await Model.distinct('strategy_id', { symbol: symbol.toLowerCase() });
    if (strategies.length) {
      res.json(strategies.sort());
    } else if (symbol.toLowerCase() === 'ethusdt') {
      res.json(['strategy_5']);
    } else if (symbol.toLowerCase() === 'solusdt') {
      res.json(['strategy_6']);
    } else {
      res.json(['strategy_1', 'strategy_2', 'strategy_3']);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/signals/:symbol/:strategy', async (req, res) => {
  try {
    const { symbol, strategy } = req.params;
    const Model = getSignalModel(symbol);
    const signals = await Model.find({
      symbol: symbol.toLowerCase(),
      strategy_id: strategy,
      record_type: 'daily_signal',
      position_action: { $in: ['open', 'close'] }
    }).sort({ date: 1 });

    if (!signals || signals.length === 0) {
      return res.json([]);
    }

    // Get total P&L from stats for scaling
    const latestSignal = signals[signals.length - 1];
    const initialCapital = signals[0]?.initial_capital || 2000;
    const currentCapital = latestSignal?.equity || initialCapital;
    const totalPnlFromStats = currentCapital - initialCapital;

    // Determine strategy type from strategy_info (intraday_strategy uses running-position algorithm)
    let strategyType = 'daily_strategy';
    try {
      const info = await StrategyInfo.findOne({ strategy_id: strategy, symbol: symbol.toLowerCase() });
      if (info && info.strategy_type) {
        strategyType = info.strategy_type;
      }
    } catch (err) {
      // Ignore errors, default to daily_strategy
    }
    const useRunningPosition = strategyType === 'intraday_strategy';

    const buyStack = [];
    let rawCumulativePnl = 0;
    const formatted = [];

    signals.forEach(s => {
      if (s.position_action === 'open') {
        const price = s.execution_price || s.price;
        const qty = Math.abs(s.trade_qty);

        if (s.action === 'buy') {
          buyStack.push({ price, qty });
        } else if (s.action === 'sell') {
          buyStack.push({ price, qty, isShort: true });
        }

        formatted.push({
          execute_time: s.execute_time_global,
          execute_time_global: s.execute_time_global,
          execute_time_asia: s.execute_time_asia,
          action: s.action,
          quantity: qty,
          execute_price: price,
          pnl: 0,
          cumulativePnl: 0,
          positionAction: 'open'
        });
      } else if (s.position_action === 'close') {
        const closePrice = s.execution_price || s.price;
        let closeQty = Math.abs(s.trade_qty);
        let pnl = 0;

        while (closeQty > 0 && buyStack.length > 0) {
          let open = buyStack[buyStack.length - 1];
          const matchQty = Math.min(closeQty, open.qty);

          if (open.isShort) {
            pnl += (open.price - closePrice) * matchQty;
          } else {
            pnl += (closePrice - open.price) * matchQty;
          }

          open.qty -= matchQty;
          closeQty -= matchQty;
          if (open.qty <= 0) buyStack.pop();
        }

        rawCumulativePnl += pnl;

        formatted.push({
          execute_time: s.execute_time_global,
          execute_time_global: s.execute_time_global,
          execute_time_asia: s.execute_time_asia,
          action: s.action,
          quantity: Math.abs(s.trade_qty),
          execute_price: closePrice,
          pnl: pnl,
          cumulativePnl: rawCumulativePnl,
          positionAction: 'close'
        });
      }
    });

    if (useRunningPosition) {
      // Intraday strategy: use running-position algorithm for accurate per-trade P&L
      let runningPos = 0;
      let avgEntryPrice = 0;
      let intradayPnl = 0;
      const sortedSignals = [...signals].sort((a, b) => {
        const ta = new Date(a.execute_time || a.date).getTime();
        const tb = new Date(b.execute_time || b.date).getTime();
        return ta - tb;
      });
      const intradayFormatted = [];
      sortedSignals.forEach(s => {
        const price = s.execution_price || s.price;
        const tradeQty = s.trade_qty || 0;
        const posChange = tradeQty;
        const newPos = runningPos + posChange;
        let pnl = 0;
        if (posChange !== 0) {
          if (runningPos === 0) {
            avgEntryPrice = price;
          } else if (Math.sign(newPos) === Math.sign(runningPos) && newPos !== 0) {
            avgEntryPrice = (avgEntryPrice * Math.abs(runningPos) + price * Math.abs(posChange)) / Math.abs(newPos);
          } else {
            const closeQty = Math.min(Math.abs(posChange), Math.abs(runningPos));
            if (runningPos > 0) pnl = (price - avgEntryPrice) * closeQty;
            else pnl = (avgEntryPrice - price) * closeQty;
            intradayPnl += pnl;
            avgEntryPrice = Math.abs(newPos) < 0.0001 ? 0 : price;
          }
          runningPos = newPos;
        }
        intradayFormatted.push({
          execute_time: s.execute_time_global,
          execute_time_global: s.execute_time_global,
          execute_time_asia: s.execute_time_asia,
          action: s.action,
          quantity: Math.abs(tradeQty),
          execute_price: price,
          pnl: pnl,
          cumulativePnl: intradayPnl,
          positionAction: s.position_action || 'hold'
        });
      });
      // Scale to match total P&L
      const scaleFactor = totalPnlFromStats / (intradayPnl || 1);
      let scaledCumulative = 0;
      intradayFormatted.forEach(f => {
        if (f.pnl !== 0) {
          f.pnl = f.pnl * scaleFactor;
          scaledCumulative += f.pnl;
          f.cumulativePnl = scaledCumulative;
        }
      });
      return res.json(intradayFormatted.reverse());
    }

    // Daily strategy: use standard open/close stack algorithm
    const scaleFactor = totalPnlFromStats / (rawCumulativePnl || 1);
    let scaledCumulative = 0;
    formatted.forEach((f, i) => {
      if (f.pnl !== 0) {
        f.pnl = f.pnl * scaleFactor;
        scaledCumulative += f.pnl;
        f.cumulativePnl = scaledCumulative;
      }
    });

    res.json(formatted.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/:symbol/:strategy', async (req, res) => {
  try {
    const { symbol, strategy } = req.params;
    const Model = getSignalModel(symbol);
    const query = {
      symbol: symbol.toLowerCase(),
      strategy_id: strategy
    };
    const signals = await Model.find(query).sort({ date: 1 });

    if (signals.length === 0) {
      return res.json({
        initialCapital: 2000,
        currentCapital: 2000,
        totalPnl: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        winRate: 0,
        leverage: 1,
        currentPosition: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        annualReturn: 0,
        totalReturn: 0,
        updateTime: new Date()
      });
    }

    const latest = signals[signals.length - 1];
    const first = signals[0];
    const initialCapital = first.initial_capital || 2000;
    const currentCapital = latest.equity || initialCapital;
    const totalPnl = currentCapital - initialCapital;
    const totalReturn = ((currentCapital - initialCapital) / initialCapital * 100).toFixed(2);
    
    const trades = signals.filter(s => s.pnl !== 0);
    const winTrades = trades.filter(t => t.pnl > 0);
    const winRate = trades.length ? (winTrades.length / trades.length * 100).toFixed(2) : 0;

    // Returns calculation
    let prevEquity = initialCapital;
    const returns = [];
    signals.forEach(s => {
      if (s.equity && s.equity !== prevEquity) {
        const ret = (s.equity - prevEquity) / prevEquity;
        if (ret !== 0 && isFinite(ret)) returns.push(ret);
        prevEquity = s.equity;
      }
    });

    // Max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let equity = initialCapital;
    signals.forEach(s => {
      if (s.equity) {
        equity = s.equity;
        if (equity > peak) peak = equity;
        const dd = (peak - equity) / peak * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }
    });

    // Sharpe ratio
    const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdReturn = returns.length > 1 
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
      : 0;
    const sharpeRatio = stdReturn ? (avgReturn / stdReturn * Math.sqrt(252)).toFixed(4) : 0;

    // Sortino ratio
    const negReturns = returns.filter(r => r < 0);
    const downDev = negReturns.length > 1 
      ? Math.sqrt(negReturns.reduce((s, r) => s + r * r, 0) / negReturns.length)
      : 0;
    const sortinoRatio = downDev ? (avgReturn / downDev * Math.sqrt(252)).toFixed(4) : 0;

    // Annual return
    const days = (new Date(latest.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
    const years = days / 365;
    const annualReturn = years > 0 ? (Math.pow(currentCapital / initialCapital, 1 / years) - 1) * 100 : 0;

    // Calmar ratio
    const calmarRatio = maxDrawdown ? (annualReturn / maxDrawdown).toFixed(4) : 0;

    const stats = {
      initialCapital,
      currentCapital: currentCapital.toFixed(2),
      totalPnl: totalPnl.toFixed(2),
      totalTrades: signals.length,
      winTrades: winTrades.length,
      lossTrades: trades.length - winTrades.length,
      winRate,
      leverage: 1,
      currentPosition: latest.position_hold || 0,
      maxDrawdown: maxDrawdown.toFixed(2),
      sharpeRatio,
      annualReturn: annualReturn.toFixed(2),
      totalReturn,
      updateTime: latest.data_updated_at || new Date(),
      dataUpdateTime: latest.data_updated_at || null,
      signalUpdateTime: latest.signal_updated_at || null
    };

    // Calculate MDD from database equity sequence
    const dbEquities = signals.map(s => s.equity);
    if (dbEquities.length > 0) {
      const mddResult = calculateMDD(dbEquities);
      stats.maxDrawdown = Math.abs(mddResult.mdd).toFixed(2);
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/strategy-info/:symbol/:strategy', async (req, res) => {
  try {
    const { strategy } = req.params;
    
    const info = await StrategyInfo.findOne({ strategy_id: strategy });
    
    if (!info) {
      return res.json({
        name: strategy,
        description: 'No description available',
        summary: '',
        execution_rule: ''
      });
    }

    res.json({
      name: info.strategy_id,
      description: info['介绍'] || info.description || '',
      summary: info['杠杆'] || info.summary || '',
      execution_rule: info['信号交易执行判断'] || info.execution_rule || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/equity/:symbol/:strategy', async (req, res) => {
  try {
    const { symbol, strategy } = req.params;
    const Model = getSignalModel(symbol);
    const signals = await Model.find({
      symbol: symbol.toLowerCase(),
      strategy_id: strategy
    }).sort({ date: 1 });

    const initialCapital = signals[0]?.initial_capital || 2000;
    const equityCurve = [];

    signals.forEach((s) => {
      equityCurve.push({
        time: Math.floor(new Date(s.date).getTime() / 1000),
        equity: s.equity || initialCapital
      });
    });

    res.json(equityCurve);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const path = require('path');
const expressStatic = path.resolve(__dirname, '../client/build');
app.use(express.static(expressStatic));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(expressStatic, 'index.html'));
});
const server = app.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other process or change PORT in .env`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    mongoose.disconnect();
    process.exit(0);
  });
});