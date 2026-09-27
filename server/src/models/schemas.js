const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, default: '' },
  passwordHash: { type: String, default: '' },
  name: { type: String, default: '' },
  minBalance: { type: Number, default: 100 },
  traderProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// Portfolio Schema
const PortfolioSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  cashBalance: { type: Number, default: 1000.00 },
  holdings: [{
    symbol: { type: String, required: true },
    shares: { type: Number, required: true },
    averagePrice: { type: Number, required: true }
  }],
  transactions: [{
    id: { type: String, required: true },
    type: { type: String, required: true }, // BUY | SELL | DEPOSIT
    symbol: { type: String, required: true },
    shares: { type: Number, required: true },
    price: { type: Number, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() }
  }]
}, { timestamps: true });

// Watchlist Schema
const WatchlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  symbols: [{ type: String }]
}, { timestamps: true });

// Alert Schema
const AlertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  condition: { type: String, default: 'ABOVE' }, // ABOVE | BELOW | PCT_CHANGE
  status: { type: String, default: 'ACTIVE' }, // ACTIVE | TRIGGERED | DISABLED
  cooldownMinutes: { type: Number, default: 30 },
  lastTriggeredAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  items: [{
    id: { type: String, required: true },
    type: { type: String, default: 'INFO' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
    timestamp: { type: String, default: () => new Date().toISOString() },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  }]
}, { timestamps: true });

// Register models safely
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist', WatchlistSchema);
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

module.exports = {
  User,
  Portfolio,
  Watchlist,
  Alert,
  Notification
};
