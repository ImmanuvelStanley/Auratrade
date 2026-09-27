# 📈 AuraTrade — Real-Time Stock Market Workstation

A production-grade, highly responsive, real-time stock market price tracker and financial workstation built on modern full-stack web technologies.

![AuraTrade Banner](https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80)

---

## ⚡ Key Highlights & Architecture

Based on the refined real-time architecture blueprint, AuraTrade solves the critical scalability and rate-limiting traps common in basic stock trackers:

1. **Centralized Ingestion & Cache Shielding**:
   - Replaces naive per-client polling loops with a shared background poller.
   - Hot-cache layer (Redis with 4s TTL) shields against external API rate limits (Alpha Vantage / Finnhub / Yahoo Finance).
2. **Dynamic Subscription Fan-Out**:
   - Only polls symbols with active socket viewers or registered user alerts.
   - Sockets join symbol rooms (`socket.join('AAPL')`); incoming ticks broadcast in real-time across Socket.io and Redis Pub/Sub.
3. **Server-Side Alert Engine with Anti-Spam Hysteresis**:
   - Evaluates alerts continuously on the server regardless of whether browser tabs are open.
   - Directional crossing (`Rises Above`, `Drops Below`), state tracking (`ACTIVE`, `TRIGGERED`), and configurable cooldown intervals (5m - 24h) prevent alert spam.
4. **Paper Trading Simulator & Instant Cash Deposit**:
   - Virtual $1,000.00 cash balance for new accounts with a safe reserve protection floor.
   - Built-in "Purchase Trading Cash / Add Funds" modal with instant crediting and transaction auditing.
5. **Interactive Financial Charting**:
   - Dual-mode Canvas chart: Area with smooth gradient fill or Candlestick (OHLC).
   - Timeframe presets: `1D`, `1W`, `1M`, `1Y` with crosshair hover tooltip and seamless live tick appending.
6. **Zero-Friction Local Execution & Cloud Ready**:
   - Built-in automatic fallback adapters for Redis and MongoDB: works instantly on any machine with zero external daemons needed, while seamlessly scaling to Redis Cloud and MongoDB Atlas when configured in `.env`.
   - Unified single-process production build: Express serves the production React SPA bundle and WebSocket gateway simultaneously on a single port.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 19, Vite, Lucide Icons, Vanilla CSS FinTech Design System |
| **Real-time Protocol** | WebSockets via Socket.io 4.x |
| **Backend API** | Node.js, Express |
| **Auth & Security** | JWT (JSON Web Tokens), bcryptjs, Sentinel Intrusion Shield |
| **Caching & Pub/Sub** | Redis (ioredis) with automatic In-Memory fallback |
| **Persistence** | MongoDB (Mongoose) with automatic JSON-backed store fallback |
| **Market Feeds** | Yahoo Finance, Finnhub, Alpha Vantage, Stochastic Brownian Motion Simulator |

---

## 🚀 Quick Start

### 1. Installation
Run from the root directory:
```bash
npm install
```
This automatically installs dependencies for root, `/server`, and `/client`.

### 2. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```

* **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
* **Backend API & WebSockets**: [http://localhost:5000](http://localhost:5000)
* **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🌐 Production Deployment Guide

AuraTrade is pre-configured for 1-click zero-downtime deployment on any cloud provider:

### Option 1: Render (Recommended - Free Tier Available)
1. Push your repository to GitHub or GitLab.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Select your repository.
4. Render automatically detects `render.yaml` or use these settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, set:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `(generate random string)`
6. Click **Deploy Web Service**. Your app is live!

### Option 2: Railway / Heroku / DigitalOcean App Platform
1. Connect your GitHub repository.
2. Build command: `npm run build`
3. Start command: `npm start` (or automatically runs via `Procfile`).

### Option 3: Docker (Any VPS, AWS ECS, GCP Cloud Run)
```bash
docker build -t auratrade .
docker run -p 5000:5000 -e NODE_ENV=production -e JWT_SECRET=your_secret auratrade
```

For advanced configuration (MongoDB Atlas, Twilio, SMTP, external stock feeds), refer to `DEPLOYMENT.md`.
