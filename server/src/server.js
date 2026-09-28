require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const path = require('path');
const fs = require('fs');

const config = require('./config');
const { setupSocketManager } = require('./socket/socketManager');
const alertEngine = require('./services/alertEngine');
const ingestionWorker = require('./services/ingestionWorker');
const securitySentinel = require('./services/securitySentinel');
const securityMiddleware = require('./middleware/securityMiddleware');
const store = require('./models/store');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const alertRoutes = require('./routes/alertRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const aiRoutes = require('./routes/aiRoutes');
const securityRoutes = require('./routes/securityRoutes');

const app = express();
const server = http.createServer(app);

// Enable reverse proxy support (essential for Render, Heroku, Railway, Cloudflare, AWS ALB)
app.set('trust proxy', 1);

// 1. Enterprise Security Headers (Anti-Clickjacking, Anti-Sniffing, XSS Filter)
app.use(securityMiddleware.hardenHeaders);

// 2. Real-Time IP Firewall (Immediately drops banned attacker IPs)
app.use(securityMiddleware.ipFirewall);

// Dynamic & Resilient CORS configuration
const rawClientUrl = process.env.CLIENT_URL || '';
const configuredOrigins = rawClientUrl
  .split(',')
  .map(u => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000'
];

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;
  // If in development, or if wildcard is explicitly enabled, or if CLIENT_URL is not set at all in production
  if (process.env.NODE_ENV !== 'production' || rawClientUrl === '*' || configuredOrigins.length === 0) {
    return true;
  }
  const cleanOrigin = origin.replace(/\/$/, '');
  if (defaultDevOrigins.includes(cleanOrigin) || configuredOrigins.includes(cleanOrigin)) {
    return true;
  }
  // Allow subdomains if configured with wildcard (e.g. *.vercel.app)
  const isWildcardMatch = configuredOrigins.some(allowed => {
    if (allowed.startsWith('*.')) {
      const suffix = allowed.slice(1);
      return cleanOrigin.endsWith(suffix);
    }
    return false;
  });
  if (isWildcardMatch) return true;

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Rejected unpermitted origin: ${origin}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Limit incoming body size to prevent memory-exhaustion DoS attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 3. Deep Request & Payload Threat Scanner (SQLi, NoSQLi, XSS, Path Traversal, RCE)
app.use(securityMiddleware.threatDetector);

// 4. Adaptive Rate Limiter & Anti-Scraping Defense
app.use(securityMiddleware.adaptiveRateLimiter);

// Real-Time Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

// Attach io to engines
alertEngine.setSocketServer(io);
ingestionWorker.setSocketServer(io);
securitySentinel.setSocketServer(io);
setupSocketManager(io);

// Clean response for /socket.io in serverless mode (prevents index.html rewrite or JSON parse error)
app.all('/socket.io*', (req, res) => {
  res.status(200).json({
    status: 'serverless_stream_active',
    message: 'AuraTrade real-time streaming is active via serverless live ticks.',
    upgrade: false
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    pollerActive: ingestionWorker.isRunning
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/market', stockRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/security', securityRoutes);

// Client Static Files & Single Page App (SPA) Handling
const candidatePaths = [
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../../client/dist')
];
const clientDistPath = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
const hasClientDist = fs.existsSync(clientDistPath);

if (hasClientDist) {
  app.use(express.static(clientDistPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Ensure index.html is never cached so that client deployments update instantly
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
}

// Fallback Route for SPA and Root Path
app.get('*', (req, res) => {
  // If API route was not found, return clean structured JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Endpoint not found',
      message: `The API route ${req.method} ${req.path} does not exist.`,
      availableRoutes: [
        '/api/health',
        '/api/stocks',
        '/api/watchlist',
        '/api/alerts',
        '/api/portfolio',
        '/api/ai/analyze',
        '/api/security/status'
      ]
    });
  }

  // If production client build exists, serve the main single-page application
  const indexPath = path.join(clientDistPath, 'index.html');
  if (hasClientDist && fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(indexPath);
  }

  // If client dist has not been compiled yet, render an institutional Gateway & Status page
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AuraTrade™ Institutional Workstation API Gateway</title>
  <style>
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.35);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 580px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.15);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.75rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 9999px;
      color: #34d399;
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.6rem;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 0.92rem;
      line-height: 1.6;
      margin: 0 0 1.5rem;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #06b6d4, #6366f1);
      color: #ffffff;
      padding: 0.75rem 1.6rem;
      border-radius: 8px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 18px rgba(6, 182, 212, 0.35);
      transition: transform 0.2s ease;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .meta-box {
      margin-top: 1.75rem;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-around;
      font-size: 0.8rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span>CORE API & WEBSOCKET ENGINE ONLINE</div>
    <h1>AuraTrade™ Backend Gateway</h1>
    <p>The institutional real-time market server, WebSocket streaming engine, and AI advisor services are running healthy on port 5000.</p>
    <a href="http://localhost:5173" class="btn">Launch Web Workstation (Port 5173)</a>
    <div class="meta-box">
      <div><strong>Health:</strong> <a href="/api/health" style="color: #38bdf8;">/api/health</a></div>
      <div><strong>WebSocket:</strong> ws://localhost:5000</div>
      <div><strong>Quotes:</strong> <a href="/api/stocks" style="color: #38bdf8;">/api/stocks</a></div>
    </div>
  </div>
</body>
</html>`);
});

// 5. Data Leakage & Information Disclosure Prevention Error Boundary
app.use(securityMiddleware.dataLeakagePreventer);

// Start Server if run directly from CLI (e.g. node server/src/server.js)
if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Real-Time Stock Market Server running on port ${config.port}`);
    console.log(`📡 WebSocket Gateway ready at ws://localhost:${config.port}`);
    console.log(`📊 Health check: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);

    // Start background shared poller & ingestion worker
    ingestionWorker.start();

    // Start autonomous backend intrusion defense daemon
    securitySentinel.start();
  });
}

// Export Express app for Vercel Serverless Functions
module.exports = app;

// Graceful shutdown (SIGINT for local dev, SIGTERM for cloud platforms)
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received. Gracefully shutting down...`);
  ingestionWorker.stop();
  securitySentinel.stop();
  try {
    await store.close();
  } catch (err) {
    console.error('[Server] Store shutdown error:', err.message);
  }
  server.close(() => {
    console.log('[Server] Closed all connections.');
    process.exit(0);
  });
  // Force exit if server doesn't close within 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Prevent server crash on unhandled errors in production
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  // Give time to flush logs before exit
  setTimeout(() => process.exit(1), 1000);
});
