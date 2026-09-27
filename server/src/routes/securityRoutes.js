/**
 * AuraTrade™ Security & Intrusion Defense Status API Routes
 * 
 * Provides endpoints to monitor backend automated shield metrics,
 * active IP jail entries, and real-time intrusion defense audit events.
 */

const express = require('express');
const router = express.Router();
const securitySentinel = require('../services/securitySentinel');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * GET /api/security/status
 * Returns current status of the automated backend security shield
 */
router.get('/status', (req, res) => {
  const stats = securitySentinel.getSecurityStats();
  res.json({
    success: true,
    data: {
      ...stats,
      shields: [
        { name: 'Anti-SQLi Sentinel', status: 'ACTIVE', desc: 'Real-time detection and blocking of SQL injection payloads' },
        { name: 'NoSQL Operator Shield', status: 'ACTIVE', desc: 'Blocks illegal MongoDB / NoSQL operator injections' },
        { name: 'Cross-Site Scripting (XSS) Filter', status: 'ACTIVE', desc: 'Sanitizes and blocks reflected and stored script tags' },
        { name: 'Path Traversal & LFI Firewall', status: 'ACTIVE', desc: 'Guards server filesystem from directory traversal attacks' },
        { name: 'Remote Code Execution (RCE) Guard', status: 'ACTIVE', desc: 'Intercepts OS command injections and reverse shell payloads' },
        { name: 'Vulnerability Scanner Honeypot', status: 'ACTIVE', desc: 'Auto-bans automated scanning tools (SQLmap, Nikto, DirBuster)' },
        { name: 'Adaptive Anti-Scraping Rate Limiter', status: 'ACTIVE', desc: 'Throttles and auto-jails scraping bots stealing market data' },
        { name: 'Credential Stuffing & Brute-Force Barrier', status: 'ACTIVE', desc: 'Protects user accounts and OTP endpoints against guessing' }
      ]
    }
  });
});

/**
 * GET /api/security/events
 * Returns recent blocked intrusion attempts (sanitized for audit)
 */
router.get('/events', optionalAuth, (req, res) => {
  res.json({
    success: true,
    events: securitySentinel.recentEvents.slice(0, 50)
  });
});

/**
 * GET /api/security/verify
 * Lightweight verification ping for frontend security badge
 */
router.get('/verify', (req, res) => {
  res.json({
    success: true,
    shield: 'ONLINE',
    mode: 'AUTONOMOUS_DEFENSE',
    threatsBlocked: securitySentinel.stats.totalBlockedAttacks
  });
});

/**
 * POST /api/security/unban
 * Unban an IP or clear all bans (Admin / diagnostic utility)
 */
router.post('/unban', (req, res) => {
  const { ip, clearAll } = req.body || {};
  if (clearAll) {
    securitySentinel.clearAllBans();
    return res.json({ success: true, message: 'All IP bans cleared successfully.' });
  }

  const targetIp = ip || securitySentinel.getClientIp(req);
  const unbanned = securitySentinel.unbanIp(targetIp);
  res.json({
    success: true,
    message: unbanned ? `IP ${targetIp} unbanned.` : `IP ${targetIp} was not in the ban list.`
  });
});

module.exports = router;
