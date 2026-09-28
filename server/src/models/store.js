const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config');
const { User, Portfolio, Watchlist, Alert, Notification } = require('./schemas');

/**
 * Enterprise-Grade Dual-Engine DataStore
 * - Primary Engine (Cloud): MongoDB Atlas when MONGODB_URI is provided
 * - Resilient Engine (Local/Fallback): Atomic, crash-proof JSON store with auto-recovery and rotating backups
 * - Sub-millisecond read speed via write-through in-memory caching
 */
class DataStore {
  constructor() {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const serverlessTmp = '/tmp';
    this.primarySeedFile = path.join(__dirname, '../../data.json');

    this.storageFile = isServerless ? path.join(serverlessTmp, 'data.json') : path.join(__dirname, '../../data.json');
    this.tempFile = isServerless ? path.join(serverlessTmp, 'data.json.tmp') : path.join(__dirname, '../../data.json.tmp');
    this.backupFile = isServerless ? path.join(serverlessTmp, 'data.json.bak') : path.join(__dirname, '../../data.json.bak');
    this.snapshotFile = isServerless ? path.join(serverlessTmp, 'data.snapshot.json') : path.join(__dirname, '../../data.snapshot.json');

    this.users = new Map();
    this.watchlists = new Map(); // userId -> Set of symbols
    this.alerts = new Map(); // alertId -> alertObj
    this.portfolios = new Map(); // userId -> portfolioObj
    this.notifications = new Map(); // userId -> array of notifications
    this.otps = new Map(); // identifierKey -> OTP record

    this.saveTimeout = null;
    this.isMongoConnected = false;
    this.mongoConnecting = false;

    // 1. Initial Load from Local Atomic Store
    this.load();
    this.ensureDemoUser();

    // 2. Start rolling disaster-recovery snapshots (every 1 hour)
    this.snapshotTimer = setInterval(() => {
      this.createSnapshot();
    }, 60 * 60 * 1000);
    if (this.snapshotTimer && typeof this.snapshotTimer.unref === 'function') {
      this.snapshotTimer.unref();
    }

    // 3. Connect to MongoDB Atlas if URI is provided
    if (config.mongoUri) {
      this.initMongo(config.mongoUri);
    }
  }

  ensureDemoUser() {
    if (this.users.size === 0) {
      const demoId = 'usr_demo_institutional';
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password123', salt);
      const demoUser = {
        id: demoId,
        email: 'demo@stockmarket.io',
        phone: '+1 555-0199',
        passwordHash: hash,
        name: 'Institutional Trader (Demo)',
        minBalance: 100,
        traderProfile: null,
        createdAt: new Date().toISOString()
      };
      this.users.set(demoId, demoUser);
      this.portfolios.set(demoId, {
        userId: demoId,
        cashBalance: 1000.00,
        holdings: [],
        transactions: []
      });
      this.watchlists.set(demoId, new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOLD']));
      this.save(true);
    }
  }

  // --- MongoDB Connection & Cloud Synchronization ---
  async initMongo(uri) {
    if (this.isMongoConnected || this.mongoConnecting) return;
    this.mongoConnecting = true;
    try {
      console.log('[DataStore] 🍃 Connecting to MongoDB Atlas cluster...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
      });
      this.isMongoConnected = true;
      this.mongoConnecting = false;
      console.log('✅ [DataStore] 🍃 MongoDB Atlas connected successfully. Operating in Cloud Database mode.');

      // Bootstrap & migrate local data to MongoDB if MongoDB is empty
      await this.syncToMongo();

      // Listen for connection status changes
      mongoose.connection.on('disconnected', () => {
        this.isMongoConnected = false;
        console.warn('⚠️ [DataStore] MongoDB disconnected. Seamlessly switching to resilient atomic local engine.');
      });
      mongoose.connection.on('reconnected', () => {
        this.isMongoConnected = true;
        console.log('✅ [DataStore] MongoDB reconnected. Cloud synchronization resumed.');
      });
    } catch (err) {
      this.mongoConnecting = false;
      this.isMongoConnected = false;
      console.warn(`⚠️ [DataStore] MongoDB connection unavailable (${err.message}). Using resilient atomic local store with auto-recovery.`);
    }
  }

  // Sync / Migrate in-memory state to MongoDB Atlas
  async syncToMongo() {
    if (!this.isMongoConnected) return;
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0 && this.users.size > 0) {
        console.log(`[DataStore] Migrating ${this.users.size} local user(s) to MongoDB Atlas...`);
        for (const user of this.users.values()) {
          await User.findOneAndUpdate({ id: user.id }, user, { upsert: true, setDefaultsOnInsert: true });
        }
        for (const [userId, portfolio] of this.portfolios.entries()) {
          await Portfolio.findOneAndUpdate({ userId }, portfolio, { upsert: true });
        }
        for (const [userId, set] of this.watchlists.entries()) {
          await Watchlist.findOneAndUpdate({ userId }, { userId, symbols: Array.from(set) }, { upsert: true });
        }
        for (const alert of this.alerts.values()) {
          await Alert.findOneAndUpdate({ id: alert.id }, alert, { upsert: true });
        }
        console.log('✅ [DataStore] Migration to MongoDB Atlas complete.');
      } else if (userCount > 0) {
        // Hydrate from MongoDB Atlas to ensure in-memory cache reflects cloud state
        console.log('[DataStore] Hydrating cache from MongoDB Atlas...');
        const users = await User.find().lean();
        users.forEach(u => this.users.set(u.id, u));

        const portfolios = await Portfolio.find().lean();
        portfolios.forEach(p => this.portfolios.set(p.userId, p));

        const watchlists = await Watchlist.find().lean();
        watchlists.forEach(w => this.watchlists.set(w.userId, new Set(w.symbols || [])));

        const alerts = await Alert.find().lean();
        alerts.forEach(a => this.alerts.set(a.id, a));

        const notifications = await Notification.find().lean();
        notifications.forEach(n => this.notifications.set(n.userId, n.items || []));
        console.log(`✅ [DataStore] Hydration complete: ${this.users.size} users, ${this.portfolios.size} portfolios loaded.`);
      }
    } catch (err) {
      console.error('[DataStore] MongoDB sync error:', err.message);
    }
  }

  // --- Local Crash-Proof Atomic File Operations ---
  load() {
    let raw = null;
    let loadedFrom = null;

    // Attempt 1: Load primary data.json
    try {
      if (fs.existsSync(this.storageFile)) {
        raw = fs.readFileSync(this.storageFile, 'utf8');
        loadedFrom = 'data.json';
      }
    } catch (err) {
      console.warn('[DataStore] Primary data.json read error, attempting backup recovery...');
    }

    // Attempt 2: If primary missing or empty, attempt recovery from data.json.bak
    if (!raw || raw.trim().length === 0) {
      try {
        if (fs.existsSync(this.backupFile)) {
          raw = fs.readFileSync(this.backupFile, 'utf8');
          loadedFrom = 'data.json.bak';
          console.log('🔄 [DataStore] Recovered state from backup file data.json.bak');
        }
      } catch (e) {
        console.warn('[DataStore] Backup file recovery failed.');
      }
    }

    // Attempt 3: If in serverless and /tmp is clean, bootstrap from repository seed file
    if ((!raw || raw.trim().length === 0) && this.primarySeedFile && fs.existsSync(this.primarySeedFile)) {
      try {
        raw = fs.readFileSync(this.primarySeedFile, 'utf8');
        loadedFrom = 'repository seed data.json';
        console.log('🌱 [DataStore] Bootstrapped serverless memory store from repository seed.');
      } catch (e) {}
    }

    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.users && Array.isArray(data.users)) {
          data.users.forEach(u => {
            if (!u.phone) u.phone = '';
            if (u.minBalance === undefined) u.minBalance = 100;
            this.users.set(u.id, u);
          });
        }
        if (data.watchlists) Object.entries(data.watchlists).forEach(([k, v]) => this.watchlists.set(k, new Set(v)));
        if (data.alerts && Array.isArray(data.alerts)) data.alerts.forEach(a => this.alerts.set(a.id, a));
        if (data.portfolios) Object.entries(data.portfolios).forEach(([k, v]) => this.portfolios.set(k, v));
        if (data.notifications) Object.entries(data.notifications).forEach(([k, v]) => this.notifications.set(k, v));

        console.log(`✅ [DataStore] Loaded ${this.users.size} user(s), ${this.portfolios.size} portfolio(s) from ${loadedFrom}`);
      } catch (err) {
        console.error('❌ [DataStore] JSON parse error in data file. Attempting recovery from snapshot...');
        this.recoverFromSnapshot();
      }
    } else {
      console.log('[DataStore] Initialized clean persistent data store.');
    }
  }

  recoverFromSnapshot() {
    try {
      if (fs.existsSync(this.snapshotFile)) {
        const raw = fs.readFileSync(this.snapshotFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.users) data.users.forEach(u => this.users.set(u.id, u));
        if (data.watchlists) Object.entries(data.watchlists).forEach(([k, v]) => this.watchlists.set(k, new Set(v)));
        if (data.alerts) data.alerts.forEach(a => this.alerts.set(a.id, a));
        if (data.portfolios) Object.entries(data.portfolios).forEach(([k, v]) => this.portfolios.set(k, v));
        console.log('🛡️ [DataStore] Successfully recovered state from hourly snapshot.');
      }
    } catch (e) {
      console.error('⚠️ [DataStore] Could not recover from snapshot:', e.message);
    }
  }

  // Atomic, crash-proof save with debouncing
  save(immediate = false) {
    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this._commitSave();
      return;
    }

    // Debounce non-critical writes by 100ms to eliminate event-loop blocking under high traffic
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this._commitSave();
    }, 100);
  }

  _commitSave() {
    try {
      const data = {
        users: Array.from(this.users.values()),
        watchlists: Object.fromEntries(Array.from(this.watchlists.entries()).map(([k, set]) => [k, Array.from(set)])),
        alerts: Array.from(this.alerts.values()),
        portfolios: Object.fromEntries(this.portfolios.entries()),
        notifications: Object.fromEntries(this.notifications.entries()),
        lastSaved: new Date().toISOString()
      };

      const serialized = JSON.stringify(data, null, 2);

      // 1. Write to temporary file first (prevents half-written file if crash occurs)
      fs.writeFileSync(this.tempFile, serialized, 'utf8');

      // 2. Atomically rename temporary file to destination (OS-level atomic replacement)
      fs.renameSync(this.tempFile, this.storageFile);

      // 3. Keep latest valid state in backup file for auto-disaster recovery
      try {
        fs.copyFileSync(this.storageFile, this.backupFile);
      } catch (bakErr) {
        // Non-blocking
      }
    } catch (err) {
      console.error('❌ [DataStore] Atomic save failed:', err.message);
    }
  }

  createSnapshot() {
    try {
      if (fs.existsSync(this.storageFile)) {
        fs.copyFileSync(this.storageFile, this.snapshotFile);
        console.log('📦 [DataStore] Disaster recovery snapshot created.');
      }
    } catch (e) {
      console.warn('[DataStore] Snapshot creation failed:', e.message);
    }
  }

  // Flush any pending write immediately (used during graceful shutdown)
  flush() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this._commitSave();
  }

  // --- Helper Methods ---
  normalizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[\s\(\)\-\.]/g, '').trim();
  }

  maskDestination(str, channel) {
    if (!str) return '***';
    if (channel === 'sms') {
      const cleaned = str.trim();
      if (cleaned.length <= 6) return cleaned;
      return cleaned.slice(0, 3) + ' ***** ' + cleaned.slice(-4);
    }
    const parts = str.split('@');
    if (parts.length < 2) return str;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length <= 2 ? name[0] + '***' : name[0] + '***' + name.slice(-1);
    return `${maskedName}@${domain}`;
  }

  // --- User Operations ---
  async findUserById(id) {
    if (!id) return null;
    let user = this.users.get(id);
    if (user) return user;

    // Check MongoDB Atlas if connected
    if (this.isMongoConnected) {
      try {
        const doc = await User.findOne({ id }).lean();
        if (doc) {
          this.users.set(doc.id, doc);
          return doc;
        }
      } catch (e) {}
    }

    // Check disk storage in case written by a concurrent instance
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.users && Array.isArray(data.users)) {
          const diskUser = data.users.find(u => u.id === id);
          if (diskUser) {
            this.users.set(diskUser.id, diskUser);
            return diskUser;
          }
        }
      }
    } catch (e) {}

    return null;
  }

  async findUserByEmail(email) {
    if (!email) return null;
    const target = email.trim().toLowerCase();
    let user = Array.from(this.users.values()).find(u => u.email && u.email.trim().toLowerCase() === target) || null;
    if (user) return user;

    // Check MongoDB Atlas if connected
    if (this.isMongoConnected) {
      try {
        const doc = await User.findOne({ email: new RegExp('^' + target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
        if (doc) {
          this.users.set(doc.id, doc);
          return doc;
        }
      } catch (e) {}
    }

    // Check disk storage
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.users && Array.isArray(data.users)) {
          const diskUser = data.users.find(u => u.email && u.email.trim().toLowerCase() === target);
          if (diskUser) {
            this.users.set(diskUser.id, diskUser);
            return diskUser;
          }
        }
      }
    } catch (e) {}

    return null;
  }

  async findUserByPhone(phone) {
    if (!phone) return null;
    const target = this.normalizePhone(phone);
    if (!target) return null;

    let user = Array.from(this.users.values()).find(u => {
      if (!u.phone) return false;
      const stored = this.normalizePhone(u.phone);
      if (stored === target) return true;
      if (stored.length >= 10 && target.length >= 10) {
        return stored.slice(-10) === target.slice(-10);
      }
      return false;
    }) || null;
    if (user) return user;

    // Check MongoDB Atlas if connected
    if (this.isMongoConnected) {
      try {
        const doc = await User.findOne({
          $or: [
            { phone: target },
            { phone: new RegExp(target.slice(-10) + '$') }
          ]
        }).lean();
        if (doc) {
          this.users.set(doc.id, doc);
          return doc;
        }
      } catch (e) {}
    }

    // Check disk storage
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.users && Array.isArray(data.users)) {
          const diskUser = data.users.find(u => {
            if (!u.phone) return false;
            const stored = this.normalizePhone(u.phone);
            return stored === target || (stored.length >= 10 && target.length >= 10 && stored.slice(-10) === target.slice(-10));
          });
          if (diskUser) {
            this.users.set(diskUser.id, diskUser);
            return diskUser;
          }
        }
      }
    } catch (e) {}

    return null;
  }

  async findUserByEmailOrPhone(identifier) {
    if (!identifier) return null;
    const raw = identifier.toString().trim();
    if (raw.includes('@')) {
      const byEmail = await this.findUserByEmail(raw);
      if (byEmail) return byEmail;
    }
    const byPhone = await this.findUserByPhone(raw);
    if (byPhone) return byPhone;
    return this.findUserByEmail(raw);
  }

  async rehydrateUserFromToken(decoded) {
    if (!decoded || !decoded.userId) return null;
    const userId = decoded.userId;
    let user = this.users.get(userId);
    if (!user) {
      user = {
        id: userId,
        email: decoded.email || '',
        phone: decoded.phone || '',
        name: decoded.name || decoded.email?.split('@')[0] || 'Trader',
        minBalance: decoded.minBalance !== undefined ? decoded.minBalance : 100,
        createdAt: decoded.createdAt || new Date().toISOString()
      };
      this.users.set(userId, user);
      if (!this.portfolios.has(userId)) {
        this.portfolios.set(userId, {
          userId,
          cashBalance: 1000.00,
          holdings: [],
          transactions: []
        });
      }
      if (!this.watchlists.has(userId)) {
        this.watchlists.set(userId, new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOLD']));
      }
      this.save();
    }
    return user;
  }

  async restoreUserFromVault(vault) {
    if (!vault || !vault.email) return null;
    const targetEmail = vault.email.trim().toLowerCase();
    let user = await this.findUserByEmail(targetEmail);
    if (!user) {
      const id = vault.id || ('usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
      user = {
        id,
        email: targetEmail,
        phone: vault.phone || '',
        passwordHash: vault.passwordHash || '',
        name: vault.name || targetEmail.split('@')[0],
        minBalance: vault.minBalance !== undefined ? parseFloat(vault.minBalance) : 100,
        traderProfile: null,
        createdAt: vault.createdAt || new Date().toISOString()
      };
      this.users.set(id, user);
      if (!this.portfolios.has(id)) {
        this.portfolios.set(id, {
          userId: id,
          cashBalance: 1000.00,
          holdings: [],
          transactions: []
        });
      }
      if (!this.watchlists.has(id)) {
        this.watchlists.set(id, new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOLD']));
      }
      this.save(true);
    } else if (vault.passwordHash && vault.passwordHash !== user.passwordHash) {
      user.passwordHash = vault.passwordHash;
      this.save(true);
    }
    return user;
  }

  async createUser(email, password, name, initialBalance, phone = '', minBalance = 100) {
    const existing = await this.findUserByEmail(email);
    if (existing) throw new Error('User already exists with this email.');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const user = {
      id,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      passwordHash: hash,
      name: name || email.split('@')[0],
      minBalance: minBalance !== undefined ? parseFloat(minBalance) : 100,
      traderProfile: null,
      createdAt: new Date().toISOString()
    };

    const startingCash = initialBalance && !isNaN(parseFloat(initialBalance)) && parseFloat(initialBalance) > 0
      ? parseFloat(initialBalance)
      : 1000.00;

    const portfolio = {
      userId: id,
      cashBalance: startingCash,
      holdings: [],
      transactions: []
    };

    const defaultWatchlist = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA']);

    // Commit to in-memory cache
    this.users.set(id, user);
    this.watchlists.set(id, defaultWatchlist);
    this.portfolios.set(id, portfolio);

    // Immediate atomic local save
    this.save(true);

    // Asynchronously replicate to MongoDB if connected
    if (this.isMongoConnected) {
      User.create(user).catch(e => console.error('[DataStore] Mongo User.create error:', e.message));
      Portfolio.create(portfolio).catch(e => console.error('[DataStore] Mongo Portfolio.create error:', e.message));
      Watchlist.create({ userId: id, symbols: Array.from(defaultWatchlist) }).catch(e => console.error('[DataStore] Mongo Watchlist.create error:', e.message));
    }

    return user;
  }

  // --- Multi-Channel OTP Operations (SMS & Email) ---
  async createOtp({ identifier, channel = 'email', purpose = 'login', name, email, phone, password }) {
    if (!identifier) throw new Error('Email or Mobile Number is required.');
    const rawId = identifier.toString().trim();
    const idKey = channel === 'sms' ? this.normalizePhone(rawId) : rawId.toLowerCase();

    // Check cooldown
    const existing = this.otps.get(idKey);
    const now = Date.now();
    if (existing && existing.resendAfter && now < existing.resendAfter) {
      const waitSec = Math.ceil((existing.resendAfter - now) / 1000);
      throw new Error(`Please wait ${waitSec}s before requesting a new verification code.`);
    }

    // Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const destinationTarget = channel === 'sms' ? (phone || rawId) : (email || rawId);
    const masked = this.maskDestination(destinationTarget, channel);

    const otpRecord = {
      code,
      channel,
      identifier: rawId,
      maskedDestination: masked,
      purpose,
      name: name || '',
      email: email ? email.trim() : (rawId.includes('@') ? rawId : ''),
      phone: phone ? phone.trim() : (channel === 'sms' ? rawId : ''),
      password: password || '',
      expiresAt: now + 5 * 60 * 1000,
      resendAfter: now + 30 * 1000,
      attempts: 0
    };

    this.otps.set(idKey, otpRecord);

    if (channel === 'sms' && email && email.includes('@')) {
      this.otps.set(email.trim().toLowerCase(), otpRecord);
    } else if (channel === 'email' && phone) {
      this.otps.set(this.normalizePhone(phone), otpRecord);
    }

    return {
      code,
      channel,
      maskedDestination: masked,
      expiresIn: 300,
      resendCooldown: 30
    };
  }

  async verifyOtp({ identifier, code }) {
    if (!identifier || !code) throw new Error('Identifier and OTP code are required.');
    const rawId = identifier.toString().trim();
    const idKey = rawId.includes('@') ? rawId.toLowerCase() : this.normalizePhone(rawId);

    const record = this.otps.get(idKey) || this.otps.get(rawId.toLowerCase());
    if (!record) {
      throw new Error('No active verification code found for this destination. Please request a new OTP.');
    }

    if (Date.now() > record.expiresAt) {
      this.otps.delete(idKey);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      this.otps.delete(idKey);
      throw new Error('Too many incorrect attempts. For security, please request a new verification code.');
    }

    if (record.code !== code.toString().trim()) {
      const remaining = 5 - record.attempts;
      throw new Error(`Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // Clean up OTP record
    this.otps.delete(idKey);
    if (record.email) this.otps.delete(record.email.toLowerCase());
    if (record.phone) this.otps.delete(this.normalizePhone(record.phone));

    return await this.verifyOtpWithPayload(record);
  }

  async verifyOtpWithPayload(record) {
    if (!record || !record.identifier) throw new Error('Invalid OTP record.');

    // Find or create user
    let user = await this.findUserByEmailOrPhone(record.identifier);
    if (!user && record.email) user = await this.findUserByEmail(record.email);
    if (!user && record.phone) user = await this.findUserByPhone(record.phone);

    if (!user) {
      const autoEmail = record.email || (record.channel === 'sms' ? `${this.normalizePhone(record.phone || record.identifier)}@trader.aura` : record.identifier);
      const autoPhone = record.phone || (record.channel === 'sms' ? record.identifier : '');
      const autoName = record.name || (record.channel === 'sms' ? `Trader ${record.identifier.slice(-4)}` : autoEmail.split('@')[0]);

      const initialPassword = (record.password && record.password.length >= 6) ? record.password : ('otp_verified_' + Date.now());
      user = await this.createUser(autoEmail, initialPassword, autoName, 1000, autoPhone);
    } else {
      let updated = false;
      if (record.password && record.password.length >= 6) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(record.password, salt);
        updated = true;
      }
      if (record.phone && (!user.phone || user.phone === '')) {
        user.phone = record.phone;
        updated = true;
      }
      if (record.name && (!user.name || user.name === user.email.split('@')[0])) {
        user.name = record.name;
        updated = true;
      }
      if (updated) {
        this.save(true);
        if (this.isMongoConnected) {
          User.findOneAndUpdate({ id: user.id }, user).catch(e => console.error('[DataStore] Mongo user update error:', e.message));
        }
      }
    }

    return user;
  }

  // --- Watchlist Operations ---
  async getWatchlist(userId) {
    if (!this.watchlists.has(userId)) {
      this.watchlists.set(userId, new Set(['AAPL', 'MSFT', 'NVDA']));
      this.save();
    }
    return Array.from(this.watchlists.get(userId));
  }

  async addToWatchlist(userId, symbol) {
    const sym = symbol.toUpperCase().trim();
    if (!this.watchlists.has(userId)) {
      this.watchlists.set(userId, new Set());
    }
    const set = this.watchlists.get(userId);
    set.add(sym);
    this.save();

    if (this.isMongoConnected) {
      Watchlist.findOneAndUpdate({ userId }, { userId, symbols: Array.from(set) }, { upsert: true }).catch(e => console.error('[DataStore] Mongo addToWatchlist error:', e.message));
    }
    return Array.from(set);
  }

  async removeFromWatchlist(userId, symbol) {
    const sym = symbol.toUpperCase().trim();
    if (this.watchlists.has(userId)) {
      const set = this.watchlists.get(userId);
      set.delete(sym);
      this.save();

      if (this.isMongoConnected) {
        Watchlist.findOneAndUpdate({ userId }, { userId, symbols: Array.from(set) }, { upsert: true }).catch(e => console.error('[DataStore] Mongo removeFromWatchlist error:', e.message));
      }
      return Array.from(set);
    }
    return [];
  }

  // --- Alert Operations ---
  async getAlerts(userId) {
    return Array.from(this.alerts.values()).filter(a => a.userId === userId);
  }

  async getAllActiveAlerts() {
    return Array.from(this.alerts.values()).filter(a => a.status === 'ACTIVE');
  }

  async createAlert(userId, { symbol, targetPrice, condition, cooldownMinutes }) {
    const id = 'alt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const alert = {
      id,
      userId,
      symbol: symbol.toUpperCase().trim(),
      targetPrice: parseFloat(targetPrice),
      condition: condition || 'ABOVE',
      status: 'ACTIVE',
      cooldownMinutes: cooldownMinutes ? parseInt(cooldownMinutes, 10) : 30,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString()
    };
    this.alerts.set(id, alert);
    this.save();

    if (this.isMongoConnected) {
      Alert.create(alert).catch(e => console.error('[DataStore] Mongo createAlert error:', e.message));
    }
    return alert;
  }

  async updateAlert(id, updates) {
    const alert = this.alerts.get(id);
    if (!alert) return null;
    Object.assign(alert, updates);
    this.save();

    if (this.isMongoConnected) {
      Alert.findOneAndUpdate({ id }, alert).catch(e => console.error('[DataStore] Mongo updateAlert error:', e.message));
    }
    return alert;
  }

  async deleteAlert(id, userId) {
    const alert = this.alerts.get(id);
    if (alert && alert.userId === userId) {
      this.alerts.delete(id);
      this.save();

      if (this.isMongoConnected) {
        Alert.deleteOne({ id }).catch(e => console.error('[DataStore] Mongo deleteAlert error:', e.message));
      }
      return true;
    }
    return false;
  }

  // --- Notification Operations ---
  async addNotification(userId, notification) {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    const list = this.notifications.get(userId);
    const item = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      ...notification,
      read: false,
      timestamp: new Date().toISOString()
    };
    list.unshift(item);
    if (list.length > 50) list.pop();
    this.save();

    if (this.isMongoConnected) {
      Notification.findOneAndUpdate({ userId }, { userId, items: list }, { upsert: true }).catch(e => console.error('[DataStore] Mongo addNotification error:', e.message));
    }
    return item;
  }

  async getNotifications(userId) {
    return this.notifications.get(userId) || [];
  }

  async markNotificationsAsRead(userId) {
    const list = this.notifications.get(userId) || [];
    list.forEach(n => (n.read = true));
    this.save();

    if (this.isMongoConnected) {
      Notification.findOneAndUpdate({ userId }, { userId, items: list }).catch(e => console.error('[DataStore] Mongo markNotificationsAsRead error:', e.message));
    }
    return list;
  }

  async clearNotifications(userId) {
    this.notifications.set(userId, []);
    this.save();

    if (this.isMongoConnected) {
      Notification.findOneAndUpdate({ userId }, { userId, items: [] }).catch(e => console.error('[DataStore] Mongo clearNotifications error:', e.message));
    }
    return [];
  }

  async deleteNotification(userId, notifId) {
    const list = this.notifications.get(userId) || [];
    const filtered = list.filter(n => n.id !== notifId);
    this.notifications.set(userId, filtered);
    this.save();

    if (this.isMongoConnected) {
      Notification.findOneAndUpdate({ userId }, { userId, items: filtered }).catch(e => console.error('[DataStore] Mongo deleteNotification error:', e.message));
    }
    return filtered;
  }

  // --- Portfolio Operations ---
  async getPortfolio(userId) {
    let portfolio = this.portfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        userId,
        cashBalance: 1000.00,
        holdings: [],
        transactions: []
      };
      this.portfolios.set(userId, portfolio);
      this.save();

      if (this.isMongoConnected) {
        Portfolio.findOneAndUpdate({ userId }, portfolio, { upsert: true }).catch(e => console.error('[DataStore] Mongo getPortfolio upsert error:', e.message));
      }
    }
    return portfolio;
  }

  async resetPortfolio(userId, initialBalance = 1000.00) {
    const portfolio = {
      userId,
      cashBalance: initialBalance,
      holdings: [],
      transactions: []
    };
    this.portfolios.set(userId, portfolio);
    this.save(true);

    if (this.isMongoConnected) {
      Portfolio.findOneAndUpdate({ userId }, portfolio, { upsert: true }).catch(e => console.error('[DataStore] Mongo resetPortfolio error:', e.message));
    }
    return portfolio;
  }

  async depositFunds(userId, amount, paymentMethod = 'Instant Transfer', note = '') {
    const depositAmt = parseFloat(amount);
    if (isNaN(depositAmt) || depositAmt <= 0) {
      throw new Error('Deposit amount must be a positive number greater than 0.');
    }
    const portfolio = await this.getPortfolio(userId);
    portfolio.cashBalance = parseFloat((portfolio.cashBalance + depositAmt).toFixed(2));

    const tx = {
      id: 'dep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'DEPOSIT',
      symbol: 'USD',
      shares: 1,
      price: depositAmt,
      paymentMethod,
      note: note || `Purchased $${depositAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} trading cash via ${paymentMethod}`,
      timestamp: new Date().toISOString()
    };
    portfolio.transactions.unshift(tx);
    this.save(true);

    if (this.isMongoConnected) {
      Portfolio.findOneAndUpdate({ userId }, portfolio, { upsert: true }).catch(e => console.error('[DataStore] Mongo deposit error:', e.message));
    }

    return { portfolio, transaction: tx };
  }

  async executeTrade(userId, { symbol, type, shares, price, allowReserveBreach = false }) {
    const sym = symbol.toUpperCase().trim();
    const qty = parseInt(shares, 10);
    const cost = qty * price;
    const portfolio = await this.getPortfolio(userId);
    const user = await this.findUserById(userId);
    const minBalance = (user && user.minBalance !== undefined) ? Number(user.minBalance) : 0;

    if (qty <= 0) throw new Error('Shares must be greater than 0.');

    if (type === 'BUY') {
      if (portfolio.cashBalance < cost) {
        throw new Error(`Insufficient funds. Available: $${portfolio.cashBalance.toFixed(2)}, Required: $${cost.toFixed(2)}`);
      }
      if (!allowReserveBreach && (portfolio.cashBalance - cost) < minBalance) {
        const safeAvailable = Math.max(0, portfolio.cashBalance - minBalance);
        throw new Error(`Safe Zone Protection Active: Order of $${cost.toFixed(2)} leaves $${(portfolio.cashBalance - cost).toFixed(2)}, breaching your required safe reserve of $${minBalance.toFixed(2)}. Max safe purchase: $${safeAvailable.toFixed(2)}.`);
      }
      portfolio.cashBalance -= cost;

      const existingHolding = portfolio.holdings.find(h => h.symbol === sym);
      if (existingHolding) {
        const totalOldCost = existingHolding.shares * existingHolding.averagePrice;
        existingHolding.shares += qty;
        existingHolding.averagePrice = (totalOldCost + cost) / existingHolding.shares;
      } else {
        portfolio.holdings.push({ symbol: sym, shares: qty, averagePrice: price });
      }
    } else if (type === 'SELL') {
      const existingHolding = portfolio.holdings.find(h => h.symbol === sym);
      if (!existingHolding || existingHolding.shares < qty) {
        throw new Error(`Cannot sell ${qty} shares. Current position: ${existingHolding ? existingHolding.shares : 0} shares.`);
      }
      portfolio.cashBalance += cost;
      existingHolding.shares -= qty;
      if (existingHolding.shares === 0) {
        portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== sym);
      }
    } else {
      throw new Error('Invalid trade type. Must be BUY or SELL.');
    }

    const tx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type,
      symbol: sym,
      shares: qty,
      price,
      timestamp: new Date().toISOString()
    };
    portfolio.transactions.unshift(tx);

    this.save(true);

    if (this.isMongoConnected) {
      Portfolio.findOneAndUpdate({ userId }, portfolio, { upsert: true }).catch(e => console.error('[DataStore] Mongo executeTrade error:', e.message));
    }

    return { portfolio, transaction: tx };
  }

  // --- GDPR Account Deletion --- Permanently purges all data associated with a user
  async deleteUser(userId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');

    // Erase all user data from in-memory maps
    this.users.delete(userId);
    this.watchlists.delete(userId);
    this.portfolios.delete(userId);
    this.notifications.delete(userId);

    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.userId === userId) {
        this.alerts.delete(alertId);
      }
    }

    for (const [key, otp] of this.otps.entries()) {
      if (otp.email === user.email || otp.phone === user.phone) {
        this.otps.delete(key);
      }
    }

    // Immediate atomic local save
    this.save(true);

    // Purge from MongoDB Atlas if connected
    if (this.isMongoConnected) {
      Promise.all([
        User.deleteOne({ id: userId }),
        Portfolio.deleteOne({ userId }),
        Watchlist.deleteOne({ userId }),
        Alert.deleteMany({ userId }),
        Notification.deleteOne({ userId })
      ]).catch(e => console.error('[DataStore] Mongo deleteUser purge error:', e.message));
    }

    return true;
  }

  // Graceful shutdown: flush in-flight writes and disconnect database
  async close() {
    this.flush();
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    if (this.isMongoConnected) {
      await mongoose.disconnect();
      console.log('[DataStore] Disconnected from MongoDB cleanly.');
    }
  }
}

module.exports = new DataStore();
