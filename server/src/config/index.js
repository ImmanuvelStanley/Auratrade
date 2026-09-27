require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_stock_jwt_token_key_2026',
  redisUrl: process.env.REDIS_URL || null,
  mongoUri: process.env.MONGODB_URI || null,
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS, 10) || 3000,
  cacheTtlSec: parseInt(process.env.CACHE_TTL_SEC, 10) || 4,
  finnhubApiKey: process.env.FINNHUB_API_KEY || '',
  alphaVantageKey: process.env.ALPHA_VANTAGE_KEY || '',
  defaultSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ', 'GOLD', 'SILVER', 'GOLD.MCX', 'SILVER.MCX']
};
