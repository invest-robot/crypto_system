// Demo data for static deployment (no backend needed)
// Data captured from database on 2026-06-11

function generateCandles(startPrice, count, intervalMinutes) {
  const candles = [];
  const now = new Date('2026-06-11T08:00:00Z');
  let price = startPrice;
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const change = (Math.random() - 0.48) * startPrice * 0.02;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * startPrice * 0.005;
    const low = Math.min(open, close) - Math.random() * startPrice * 0.005;
    const volume = 100 + Math.random() * 500;
    
    candles.push({
      datetime: time.toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume * 100) / 100
    });
    price = close;
  }
  return candles;
}

function generateEquityCurve(initial, final, days) {
  const curve = [];
  const startDate = new Date('2024-01-11');
  let equity = initial;
  const totalChange = (final - initial) / initial;
  let cumChange = 0;
  
  for (let i = 0; i < days; i++) {
    const progress = i / days;
    const noise = (Math.random() - 0.5) * 0.05;
    const targetEquity = initial * (1 + totalChange * progress);
    equity = targetEquity * (1 + noise);
    if (equity < 0) equity = initial * 0.5;
    cumChange = (equity - initial) / initial;
    
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    curve.push({
      time: Math.floor(date.getTime() / 1000),
      equity: Math.round(equity * 100) / 100
    });
  }
  return curve;
}

const DEMO_BTC_CANDLES = generateCandles(105000, 500, 60);
const DEMO_ETH_CANDLES = generateCandles(2500, 500, 60);
const DEMO_SOL_CANDLES = generateCandles(150, 500, 60);

const DEMO_STRATEGY_INFO = {
  strategy_1: { name: 'strategy_1', description: '趋势策略，只做多，满仓买入，实时计算买入数量', summary: '杠杆1.1', execution_rule: '日策略，每日亚洲时间8：00' },
  strategy_2: { name: 'strategy_2', description: '趋势策略，做多和做空，满仓买入和卖出，实时计算买入数量和卖出数量', summary: '杠杆1.1', execution_rule: '日策略，每日亚洲时间8：00' },
  strategy_3: { name: 'strategy_3', description: '保守策略，做多和做空，购买数量持续变化，', summary: '平均杠杆0.5-1.5', execution_rule: '日策略，每日亚洲时间15：00' },
  strategy_4: { name: 'strategy_4', description: '保守策略，做多和做空，购买数量稳定，起始本金1000usd固定买卖0.004个btc', summary: '平均杠杆0.5-1.1', execution_rule: '日策略，每日亚洲时间12：00' },
  strategy_5: { name: 'strategy_5', description: 'ETH保守策略，做多和做空，购买数量持续变化，基于ETF流量分析', summary: '平均杠杆0.5-1.5', execution_rule: '日策略，每日亚洲时间15：00' },
  strategy_6: { name: 'strategy_6', description: 'SOL保守策略，做多和做空，购买数量持续变化，基于ETF流量分析', summary: '平均杠杆0.5-1.5', execution_rule: '日策略，每日亚洲时间15：00' }
};

const DEMO_SIGNALS = {
  'btcusdt:strategy_3': [
    { execute_time: '2026-05-23 07:00:00', execute_time_global: '2026-05-23 07:00:00', execute_time_asia: '2026-05-23 15:00:00', action: 'buy', quantity: 0.0064, execute_price: 74609.36, pnl: 33.07, cumulativePnl: 744.40, positionAction: 'close' },
    { execute_time: '2026-05-14 07:00:00', execute_time_global: '2026-05-14 07:00:00', execute_time_asia: '2026-05-14 15:00:00', action: 'sell', quantity: 0.0064, execute_price: 79745.98, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-05-02 07:00:00', execute_time_global: '2026-05-02 07:00:00', execute_time_asia: '2026-05-02 15:00:00', action: 'buy', quantity: 0.0068, execute_price: 78220, pnl: -13.99, cumulativePnl: 711.33, positionAction: 'close' },
    { execute_time: '2026-04-30 07:00:00', execute_time_global: '2026-04-30 07:00:00', execute_time_asia: '2026-04-30 15:00:00', action: 'sell', quantity: 0.0068, execute_price: 76161.67, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-04-29 07:00:00', execute_time_global: '2026-04-29 07:00:00', execute_time_asia: '2026-04-29 15:00:00', action: 'buy', quantity: 0.0067, execute_price: 77053.64, pnl: -1.17, cumulativePnl: 725.32, positionAction: 'close' },
    { execute_time: '2026-04-28 07:00:00', execute_time_global: '2026-04-28 07:00:00', execute_time_asia: '2026-04-28 15:00:00', action: 'sell', quantity: 0.0067, execute_price: 76879.28, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-04-08 07:00:00', execute_time_global: '2026-04-08 07:00:00', execute_time_asia: '2026-04-08 15:00:00', action: 'sell', quantity: 0.0241, execute_price: 71627.59, pnl: 72.38, cumulativePnl: 726.50, positionAction: 'close' },
    { execute_time: '2026-04-07 07:00:00', execute_time_global: '2026-04-07 07:00:00', execute_time_asia: '2026-04-07 15:00:00', action: 'buy', quantity: 0.0241, execute_price: 68624.61, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-03-11 07:00:00', execute_time_global: '2026-03-11 07:00:00', execute_time_asia: '2026-03-11 15:00:00', action: 'sell', quantity: 0.0237, execute_price: 69648.29, pnl: -33.44, cumulativePnl: 654.11, positionAction: 'close' },
    { execute_time: '2026-03-06 07:00:00', execute_time_global: '2026-03-06 07:00:00', execute_time_asia: '2026-03-06 15:00:00', action: 'buy', quantity: 0.0237, execute_price: 71056.44, pnl: 0, cumulativePnl: 0, positionAction: 'open' }
  ],
  'ethusdt:strategy_5': [
    { execute_time: '2026-05-20 07:00:00', execute_time_global: '2026-05-20 07:00:00', execute_time_asia: '2026-05-20 15:00:00', action: 'buy', quantity: 0.45, execute_price: 2380.50, pnl: 125.30, cumulativePnl: 20885.70, positionAction: 'close' },
    { execute_time: '2026-05-10 07:00:00', execute_time_global: '2026-05-10 07:00:00', execute_time_asia: '2026-05-10 15:00:00', action: 'sell', quantity: 0.45, execute_price: 2100.20, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-04-25 07:00:00', execute_time_global: '2026-04-25 07:00:00', execute_time_asia: '2026-04-25 15:00:00', action: 'buy', quantity: 0.85, execute_price: 2680.40, pnl: 156.80, cumulativePnl: 20760.40, positionAction: 'close' },
    { execute_time: '2026-04-15 07:00:00', execute_time_global: '2026-04-15 07:00:00', execute_time_asia: '2026-04-15 15:00:00', action: 'sell', quantity: 0.85, execute_price: 2496.00, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-03-30 07:00:00', execute_time_global: '2026-03-30 07:00:00', execute_time_asia: '2026-03-30 15:00:00', action: 'buy', quantity: 1.2, execute_price: 2850.10, pnl: -180.50, cumulativePnl: 20603.60, positionAction: 'close' },
    { execute_time: '2026-03-20 07:00:00', execute_time_global: '2026-03-20 07:00:00', execute_time_asia: '2026-03-20 15:00:00', action: 'sell', quantity: 1.2, execute_price: 2699.85, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-02-28 07:00:00', execute_time_global: '2026-02-28 07:00:00', execute_time_asia: '2026-02-28 15:00:00', action: 'buy', quantity: 0.5, execute_price: 3100.20, pnl: 220.50, cumulativePnl: 20784.10, positionAction: 'close' },
    { execute_time: '2026-02-18 07:00:00', execute_time_global: '2026-02-18 07:00:00', execute_time_asia: '2026-02-18 15:00:00', action: 'sell', quantity: 0.5, execute_price: 2659.20, pnl: 0, cumulativePnl: 0, positionAction: 'open' }
  ],
  'solusdt:strategy_6': [
    { execute_time: '2026-05-18 07:00:00', execute_time_global: '2026-05-18 07:00:00', execute_time_asia: '2026-05-18 15:00:00', action: 'buy', quantity: 7.5, execute_price: 168.20, pnl: 85.50, cumulativePnl: 17041.66, positionAction: 'close' },
    { execute_time: '2026-05-08 07:00:00', execute_time_global: '2026-05-08 07:00:00', execute_time_asia: '2026-05-08 15:00:00', action: 'sell', quantity: 7.5, execute_price: 156.80, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-04-20 07:00:00', execute_time_global: '2026-04-20 07:00:00', execute_time_asia: '2026-04-20 15:00:00', action: 'buy', quantity: 12.0, execute_price: 152.30, pnl: 95.20, cumulativePnl: 16956.16, positionAction: 'close' },
    { execute_time: '2026-04-10 07:00:00', execute_time_global: '2026-04-10 07:00:00', execute_time_asia: '2026-04-10 15:00:00', action: 'sell', quantity: 12.0, execute_price: 144.36, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-03-15 07:00:00', execute_time_global: '2026-03-15 07:00:00', execute_time_asia: '2026-03-15 15:00:00', action: 'buy', quantity: 8.0, execute_price: 185.40, pnl: -120.30, cumulativePnl: 16860.96, positionAction: 'close' },
    { execute_time: '2026-03-05 07:00:00', execute_time_global: '2026-03-05 07:00:00', execute_time_asia: '2026-03-05 15:00:00', action: 'sell', quantity: 8.0, execute_price: 170.36, pnl: 0, cumulativePnl: 0, positionAction: 'open' },
    { execute_time: '2026-02-10 07:00:00', execute_time_global: '2026-02-10 07:00:00', execute_time_asia: '2026-02-10 15:00:00', action: 'buy', quantity: 6.5, execute_price: 195.80, pnl: 165.40, cumulativePnl: 16981.26, positionAction: 'close' },
    { execute_time: '2026-01-30 07:00:00', execute_time_global: '2026-01-30 07:00:00', execute_time_asia: '2026-01-30 15:00:00', action: 'sell', quantity: 6.5, execute_price: 170.35, pnl: 0, cumulativePnl: 0, positionAction: 'open' }
  ]
};

const DEMO_STATS = {
  'btcusdt:strategy_3': {
    initialCapital: 1000, currentCapital: '1744.40', totalPnl: '744.40',
    totalTrades: 94, winTrades: 30, lossTrades: 17, winRate: '63.83',
    leverage: 1, currentPosition: 0, maxDrawdown: '8.04', sharpeRatio: '1.40',
    annualReturn: '25.93', totalReturn: '74.44', updateTime: '2026-06-11T08:00:00.000Z'
  },
  'ethusdt:strategy_5': {
    initialCapital: 1000, currentCapital: '21885.70', totalPnl: '20885.70',
    totalTrades: 138, winTrades: 24, lossTrades: 45, winRate: '34.78',
    leverage: 1, currentPosition: 0, maxDrawdown: '29.68', sharpeRatio: '1.25',
    annualReturn: '61.39', totalReturn: '2088.57', updateTime: '2026-06-11T08:00:00.000Z'
  },
  'solusdt:strategy_6': {
    initialCapital: 1000, currentCapital: '18041.66', totalPnl: '17041.66',
    totalTrades: 124, winTrades: 22, lossTrades: 40, winRate: '35.48',
    leverage: 1, currentPosition: 0, maxDrawdown: '35.77', sharpeRatio: '1.23',
    annualReturn: '56.63', totalReturn: '1704.17', updateTime: '2026-06-11T08:00:00.000Z'
  }
};

const DEMO_EQUITY = {
  'btcusdt:strategy_3': generateEquityCurve(1000, 1744.40, 600),
  'ethusdt:strategy_5': generateEquityCurve(1000, 21885.70, 600),
  'solusdt:strategy_6': generateEquityCurve(1000, 18041.66, 600)
};

export const DEMO_MODE = window.location.hostname.includes('github.io');

export function getDemoMarketData(symbol) {
  if (symbol === 'ethusdt') return { interval: '1h', data: DEMO_ETH_CANDLES };
  if (symbol === 'solusdt') return { interval: '1h', data: DEMO_SOL_CANDLES };
  return { interval: '1h', data: DEMO_BTC_CANDLES };
}

export function getDemoStrategies(symbol) {
  if (symbol === 'ethusdt') return ['strategy_5'];
  if (symbol === 'solusdt') return ['strategy_6'];
  return ['strategy_1', 'strategy_2', 'strategy_3'];
}

export function getDemoSignals(symbol, strategy) {
  return DEMO_SIGNALS[`${symbol}:${strategy}`] || [];
}

export function getDemoStats(symbol, strategy) {
  return DEMO_STATS[`${symbol}:${strategy}`] || {
    initialCapital: 1000, currentCapital: '1000.00', totalPnl: '0.00',
    totalTrades: 0, winTrades: 0, lossTrades: 0, winRate: '0.00',
    leverage: 1, currentPosition: 0, maxDrawdown: '0.00', sharpeRatio: '0.00',
    annualReturn: '0.00', totalReturn: '0.00', updateTime: '2026-06-11T08:00:00.000Z'
  };
}

export function getDemoEquity(symbol, strategy) {
  return DEMO_EQUITY[`${symbol}:${strategy}`] || [];
}

export function getDemoStrategyInfo(strategy) {
  return DEMO_STRATEGY_INFO[strategy] || {
    name: strategy, description: 'Demo strategy', summary: '-', execution_rule: '-'
  };
}