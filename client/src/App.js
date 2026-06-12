import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TIME_RANGES = {
  '1D': { hours: 24, limit: 24 },
  '1W': { hours: 24 * 7, limit: 168 },
  '1M': { hours: 24 * 30, limit: 720 },
  '3M': { hours: 24 * 90, limit: 2160 },
  '6M': { hours: 24 * 180, limit: 4320 },
  '1Y': { hours: 24 * 365, limit: 8760 },
  'ALL': { hours: 24 * 365 * 10, limit: 87600 }
};

const T = {
  zh: {
    login: '登录',
    cryptoSignalSystem: 'Web 3.0',
    initialCapital: '初始资金',
    currentCapital: '当前资金',
    totalPnl: '总盈亏',
    totalTrades: '总交易次数',
    leverage: '收益率',
    currentPosition: '当前持仓',
    maxDrawdown: '最大回撤',
    sharpe: '夏普比率',
    priceChart: '价格图表',
    equityCurve: '权益曲线',
    tradeHistory: '交易记录',
    executeTimeGlobal: '执行时间(UTC)',
    executeTimeAsia: '执行时间(亚洲)',
    action: '操作',
    type: '类型',
    quantity: '数量',
    executePrice: '执行价格',
    pnl: '盈亏',
    cumulative: '累计',
    buy: '买入',
    sell: '卖出',
    open: '开仓',
    close: '平仓',
    strategy: '策略',
    dataUpdate: '数据更新',
    signalUpdate: '信号更新',
    langSwitch: 'EN'
  },
  en: {
    login: 'Login',
    cryptoSignalSystem: 'Web 3.0',
    initialCapital: 'Initial Capital',
    currentCapital: 'Current Capital',
    totalPnl: 'Total P&L',
    totalTrades: 'Total Trades',
    leverage: 'Yield',
    currentPosition: 'Current Position',
    maxDrawdown: 'Max Drawdown',
    sharpe: 'Sharpe',
    priceChart: 'Price Chart',
    equityCurve: 'Equity Curve',
    tradeHistory: 'Trade History',
    executeTimeGlobal: 'Execute Time (UTC)',
    executeTimeAsia: 'Execute Time (Asia)',
    action: 'Action',
    type: 'Type',
    quantity: 'Quantity',
    executePrice: 'Execute Price',
    pnl: 'P&L',
    cumulative: 'Cumulative',
    buy: 'Buy',
    sell: 'Sell',
    open: 'Open',
    close: 'Close',
    strategy: 'Strategy',
    dataUpdate: 'Data Update',
    signalUpdate: 'Signal Update',
    langSwitch: '中文'
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('crypto123');
  const [lang, setLang] = useState('zh');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [strategy, setStrategy] = useState('strategy_3');
  const [marketData, setMarketData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState(null);
  const [equityCurve, setEquityCurve] = useState([]);
  const [strategies, setStrategies] = useState(['strategy_1', 'strategy_2', 'strategy_3'].sort());
  const [timeRange, setTimeRange] = useState('1M');
  const [chartInterval, setChartInterval] = useState('1h');
  const [strategyInfo, setStrategyInfo] = useState(null);
  const [showTradeHistory, setShowTradeHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const equityChartRef = useRef(null);
  const equityChartInstance = useRef(null);
  const candleSeries = useRef(null);
  const equitySeries = useRef(null);
  const signalsRef = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStrategies();
      fetchMarketData();
      fetchSignals();
      fetchStats();
      fetchEquity();
      fetchStrategyInfo();
    }
  }, [isAuthenticated, symbol, strategy, timeRange, chartInterval]);

  useEffect(() => {
    if (isAuthenticated && marketData.length > 0) {
      initChart();
    }
  }, [isAuthenticated, marketData, signals]);

  useEffect(() => {
    if (isAuthenticated && equityCurve.length > 0) {
      initEquityChart();
    }
  }, [isAuthenticated, equityCurve]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchMarketData();
        fetchSignals();
        fetchStats();
        fetchEquity();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, symbol, strategy, timeRange, chartInterval]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'crypto123') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid credentials');
    }
  };

  const fetchMarketData = async () => {
    try {
      setError(null);
      const range = TIME_RANGES[timeRange];
      const res = await axios.get(`${API_BASE}/market/${symbol}`, {
        params: {
          interval: chartInterval,
          limit: range.limit
        }
      });
      const data = res.data.data || res.data;
      const cutoff = Date.now() - range.hours * 60 * 60 * 1000;
      const filtered = data.filter(d => new Date(d.datetime).getTime() >= cutoff);
      setMarketData(filtered);
    } catch (err) {
      console.error('Market data error:', err);
      setError('Failed to load market data');
    }
  };

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/strategies/${symbol}`);
      if (res.data.length > 0) {
        setStrategies(res.data);
        if (!res.data.includes(strategy)) {
          setStrategy(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Strategies error:', err);
    }
  };

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/signals/${symbol}/${strategy}`);
      setSignals(res.data);
      signalsRef.current = res.data;
    } catch (err) {
      console.error('Signals error:', err);
      setError('Failed to load signals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats/${symbol}/${strategy}`);
      setStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
      setError('Failed to load stats');
    }
  };

  const fetchEquity = async () => {
    try {
      const res = await axios.get(`${API_BASE}/equity/${symbol}/${strategy}`);
      setEquityCurve(res.data);
    } catch (err) {
      console.error('Equity error:', err);
      setError('Failed to load equity data');
    }
  };

  const fetchStrategyInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE}/strategy-info/${symbol}/${strategy}`);
      setStrategyInfo(res.data);
    } catch (err) {
      console.error('Strategy info error:', err);
    }
  };

  const initChart = () => {
    if (!chartRef.current || !marketData.length) return;

    if (chartInstance.current) {
      chartInstance.current.remove();
    }

    chartInstance.current = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 450,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const hour = date.getHours().toString().padStart(2, '0');
          const minute = date.getMinutes().toString().padStart(2, '0');
          return `${month}/${day} ${hour}:${minute}`;
        },
      },
    });

    const candleData = marketData.map(d => ({
      time: Math.floor(new Date(d.datetime).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.current = chartInstance.current.addCandlestickSeries({
      upColor: '#34c759',
      downColor: '#ff3b30',
      borderUpColor: '#34c759',
      borderDownColor: '#ff3b30',
      wickUpColor: '#34c759',
      wickDownColor: '#ff3b30',
    });

    candleSeries.current.setData(candleData);
    chartInstance.current.timeScale().fitContent();
    renderSignals();

    chartInstance.current.timeScale().subscribeVisibleLogicalRangeChange(() => {
      renderSignals();
    });
  };

  const renderSignals = () => {
    const signalData = signalsRef.current;
    if (!candleSeries.current || !signalData.length || !marketData.length) return;

    const chart = chartInstance.current;
    const visibleRange = chart.timeScale().getVisibleRange();
    const range = TIME_RANGES[timeRange];
    const cutoff = Math.max(visibleRange.from, Date.now() / 1000 - range.hours * 3600);

    const parseExecuteTime = (timeStr) => {
      const [datePart, timePart] = timeStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      return Date.UTC(year, month - 1, day, hour, minute, second) / 1000;
    };

    const markers = signalData
      .filter(s => s.execute_time)
      .filter(s => {
        const entryTime = parseExecuteTime(s.execute_time);
        return entryTime >= cutoff;
      })
      .sort((a, b) => parseExecuteTime(a.execute_time) - parseExecuteTime(b.execute_time))
      .map(s => {
        const entryTime = parseExecuteTime(s.execute_time);
        return {
          time: entryTime,
          position: s.action === 'buy' ? 'belowBar' : 'aboveBar',
          color: s.action === 'buy' ? '#34c759' : '#ff3b30',
          shape: 'arrowUp',
          text: s.action === 'buy' ? 'BUY' : 'SELL',
        };
      });

    candleSeries.current.setMarkers(markers);
  };

  const initEquityChart = () => {
    if (!equityChartRef.current || !equityCurve.length) return;

    if (equityChartInstance.current) {
      equityChartInstance.current.remove();
    }

    equityChartInstance.current = createChart(equityChartRef.current, {
      width: equityChartRef.current.clientWidth,
      height: 250,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${year}/${month}/${day}`;
        },
      },
    });

    equitySeries.current = equityChartInstance.current.addLineSeries({
      color: '#007aff',
      lineWidth: 2,
    });

    const equityData = equityCurve.map((e) => ({
      time: e.time,
      value: e.equity,
    }));

    equitySeries.current.setData(equityData);
    equityChartInstance.current.timeScale().fitContent();
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>{T[lang].cryptoSignalSystem}</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder={lang === 'zh' ? '用户名' : 'Username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder={lang === 'zh' ? '密码' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">{T[lang].login}</button>
          </form>
          <p className="test-hint">Test: admin / crypto123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>{T[lang].cryptoSignalSystem}</h1>
        </div>
        <div className="controls">
          <button className="lang-btn" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {T[lang].langSwitch}
          </button>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="SOLUSDT">SOLUSDT</option>
            <option value="BNBUSDT">BNBUSDT</option>
          </select>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            {strategies.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">{T[lang].initialCapital}</span>
            <span className="stat-value">${Number(stats.initialCapital).toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].currentCapital}</span>
            <span className="stat-value">${Number(stats.currentCapital).toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].totalPnl}</span>
            <span className={`stat-value ${Number(stats.totalPnl) >= 0 ? 'positive' : 'negative'}`}>
              {Number(stats.totalPnl) >= 0 ? '+' : ''}${Number(stats.totalPnl).toFixed(2)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].totalTrades}</span>
            <span className="stat-value">{signals.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].leverage}</span>
            <span className="stat-value">{Number(stats.totalReturn).toFixed(2)}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].currentPosition}</span>
            <span className="stat-value">{Number(stats.currentPosition).toFixed(3)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].maxDrawdown}</span>
            <span className="stat-value negative">-{Number(stats.maxDrawdown).toFixed(2)}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{T[lang].sharpe}</span>
            <span className="stat-value">{Number(stats.sharpeRatio).toFixed(2)}</span>
          </div>
        </div>
      )}

      {strategyInfo && stats && (
        <div className="strategy-info-section">
          <div className="strategy-desc-box">
            <div className="strategy-desc-content">
              <div className="strategy-desc-tag strategy-desc-tag-blue">{strategyInfo.description}</div>
              <div className="strategy-desc-tag strategy-desc-tag-red">{strategyInfo.summary}</div>
              <div className="strategy-desc-tag strategy-desc-tag-purple">{strategyInfo.execution_rule}</div>
              <div className="strategy-desc-tag strategy-desc-tag-gray">
                {lang === 'zh' 
                  ? `起始 ${stats.initialCapital}U | 当前 ${stats.currentCapital}U | 盈利 ${stats.totalPnl}U | 最大回撤 ${stats.maxDrawdown}%`
                  : `Initial ${stats.initialCapital}U | Current ${stats.currentCapital}U | P&L ${stats.totalPnl}U | Max DD ${stats.maxDrawdown}%`}
              </div>
            </div>
          </div>
          <div className="strategy-meta-box">
            <div className="meta-item">
              <span className="meta-label">{T[lang].dataUpdate}</span>
              <span className="meta-value">{stats.updateTime ? new Date(stats.updateTime).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '-'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">{T[lang].signalUpdate}</span>
              <span className="meta-value">{stats.updateTime ? new Date(stats.updateTime).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '-'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="chart-section">
        <div className="chart-header">
          <h2>{T[lang].priceChart} - {symbol}</h2>
          <div className="chart-controls">
            <select value={chartInterval} onChange={(e) => setChartInterval(e.target.value)}>
              <option value="1h">1H</option>
              <option value="4h">4H</option>
              <option value="1d">1D</option>
            </select>
            <div className="time-range-selector">
              {Object.keys(TIME_RANGES).map(range => (
                <button
                  key={range}
                  className={timeRange === range ? 'active' : ''}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div ref={chartRef} className="chart-container"></div>
      </div>

      <div className="chart-section">
        <h2>{T[lang].equityCurve}</h2>
        <div ref={equityChartRef} className="chart-container"></div>
      </div>

      <div className="signals-section">
        <div className="signals-header" onClick={() => setShowTradeHistory(!showTradeHistory)}>
          <h2>{T[lang].tradeHistory} ({signals.length})</h2>
          <span className="toggle-icon">{showTradeHistory ? '▲' : '▼'}</span>
        </div>
        {showTradeHistory && (
          <div className="signals-table-container">
            <table className="signals-table">
              <thead>
                <tr>
                  <th>{T[lang].executeTimeGlobal}</th>
                  <th>{T[lang].executeTimeAsia}</th>
                  <th>{T[lang].action}</th>
                  <th>{T[lang].type}</th>
                  <th>{T[lang].quantity}</th>
                  <th>{T[lang].executePrice}</th>
                  <th>{T[lang].pnl}</th>
                  <th>{T[lang].cumulative}</th>
                </tr>
              </thead>
              <tbody>
                {signals.slice(0, 10).map((sig, i) => {
                  return (
                    <tr key={i}>
                      <td>{sig.execute_time_global}</td>
                      <td>{sig.execute_time_asia}</td>
                      <td className={sig.action === 'buy' ? 'long' : 'short'}>
                        {sig.action === 'buy' ? T[lang].buy : T[lang].sell}
                      </td>
                      <td>{sig.positionAction === 'open' ? T[lang].open : T[lang].close}</td>
                      <td>{sig.quantity?.toFixed(4)}</td>
                      <td>{(sig.execute_price || 0).toFixed(2)}</td>
                      <td className={sig.pnl >= 0 ? 'positive' : 'negative'}>
                        {sig.pnl?.toFixed(2)}
                      </td>
                      <td className={sig.cumulativePnl >= 0 ? 'positive' : 'negative'}>
                        {sig.cumulativePnl?.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;