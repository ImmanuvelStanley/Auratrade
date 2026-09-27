/**
 * AuraTrade™ Automated Security Sentinel & Intrusion Defense Engine
 * 
 * Auto-running backend cybersecurity daemon that continuously inspects, detects,
 * and defends against hacking attempts, data theft, SQL/NoSQL injections, XSS,
 * directory traversal, scanner bot reconnaissance, and automated scraping floods.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecuritySentinel {
  constructor() {
    // In-memory blacklist of jailed/banned IP addresses: ip -> { bannedAt, expiresAt, reason, threatType, violationCount }
    this.bannedIps = new Map();

    // IP Threat tracking & scoring ledger: ip -> { score, violations: [], lastSeen, requestCount, windowStart }
    this.ipLedger = new Map();

    // Rate limiting tracking: ip -> { count, windowStart }
    this.rateLimitMap = new Map();

    // Sensitive endpoints rate limit: ip -> { count, windowStart }
    this.sensitiveRateLimitMap = new Map();

    // Cumulative Security Metrics
    this.stats = {
      startedAt: new Date().toISOString(),
      totalInspectedRequests: 0,
      totalBlockedAttacks: 0,
      threatsByType: {
        SQL_INJECTION: 0,
        NOSQL_INJECTION: 0,
        XSS_ATTACK: 0,
        PATH_TRAVERSAL: 0,
        COMMAND_INJECTION: 0,
        SCANNER_PROBE: 0,
        DATA_SCRAPING_FLOOD: 0,
        BRUTE_FORCE_AUTH: 0,
        MALFORMED_PAYLOAD: 0
      },
      currentBannedIpsCount: 0
    };

    // Immutable audit log of recent blocked intrusions (max 100 in memory)
    this.recentEvents = [];

    // WebSocket server reference for real-time security alerts
    this.io = null;

    // Background maintenance worker timer
    this.daemonTimer = null;
    this.isRunning = false;

    // Path to persistent security audit log file
    this.auditLogPath = path.join(__dirname, '../../security-audit.log');

    // Thresholds
    this.BAN_THRESHOLD_SCORE = 100;
    this.DEFAULT_BAN_DURATION_MS = 60 * 60 * 1000; // 1 Hour
    this.REPEAT_OFFENDER_BAN_MS = 24 * 60 * 60 * 1000; // 24 Hours
    this.RATE_LIMIT_GLOBAL_MAX = 200; // max requests per minute
    this.RATE_LIMIT_SENSITIVE_MAX = 20; // max auth/trade requests per minute

    // Attack Signatures & Heuristic Patterns
    this.patterns = {
      // SQL Injection patterns (UNION, SELECT, DROP, SLEEP, comment sequences, tautologies)
      sqlInjection: [
        /(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC(UTE)?)\b\s+.*\b(FROM|INTO|TABLE|DATABASE|WHERE)\b)/i,
        /(\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
        /(\bAND\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
        /(;\s*--|;\s*\/\*|--\s*$|\/\*.*?\*\/)/i,
        /(\b(SLEEP|BENCHMARK|WAITFOR\s+DELAY|PG_SLEEP)\s*\()/i,
        /('\s*OR\s*'\d+'\s*=\s*'\d+)/i,
        /(";\s*DROP\s+TABLE)/i
      ],

      // NoSQL / Mongo operator injections
      noSqlInjection: [
        /\$(where|gt|gte|lt|lte|ne|in|nin|regex|exists|or|and|nor|all|elemMatch)/i
      ],

      // Cross-Site Scripting (XSS)
      xss: [
        /<script\b[^>]*>([\s\S]*?)<\/script>/i,
        /javascript\s*:\s*[^\s]+/i,
        /\bon(load|error|click|mouseover|focus|blur|change|submit)\s*=/i,
        /<(iframe|embed|object|svg|img|body|meta|link)\b[^>]*\bon[a-z]+\s*=/i,
        /<iframe\b[^>]*>/i,
        /\beval\s*\(/i,
        /\bdocument\.(cookie|location|write)/i
      ],

      // Path Traversal & Local File Inclusion
      pathTraversal: [
        /(\.\.[\/\\]|\.\.%2f|\.\.%5c)/i,
        /(\/|\\)(etc|proc|var|windows|winnt|system32)(\/|\\)(passwd|shadow|hosts|boot\.ini|cmd\.exe)/i,
        /(%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
        /(\.env|\.git\/config|\.aws\/credentials|\.bash_history)/i
      ],

      // Remote Code Execution / Shell Command Injection
      commandInjection: [
        /(;\s*|\b(curl|wget|bash|sh|zsh|powershell|cmd\.exe)\b\s+.*http)/i,
        /(\b(whoami|id|cat\s+\/etc\/passwd|uname\s+-a|dir\s+c:)\b)/i,
        /(`[^`]+`|\$\([^)]+\))/
      ],

      // Known scanner probes & vulnerability bots
      scannerProbes: [
        /(\.env|\.git|\.svn|wp-admin|wp-login\.php|phpmyadmin|pma|cgi-bin|xmlrpc\.php|aws-credentials|config\.json|\.DS_Store|actuator\/health)/i,
        /\b(sqlmap|nikto|dirbuster|nmap|acunetix|masscan|zgrab|gobuster)\b/i
      ]
    };
  }

  /**
   * Initialize and start the background auto-defense daemon
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🛡️  [SecuritySentinel] Initializing Autonomous Backend Intrusion Defense Daemon...');
    console.log('🛡️  [SecuritySentinel] Active Shields: SQLi, NoSQLi, XSS, Path Traversal, RCE, Bot Probes, Rate Shields.');

    // Run periodic cleanup and security audit every 60 seconds
    this.daemonTimer = setInterval(() => {
      this.maintain();
    }, 60 * 1000);

    // Initial audit log check
    try {
      if (!fs.existsSync(this.auditLogPath)) {
        fs.writeFileSync(
          this.auditLogPath,
          `# AuraTrade Security Audit Ledger - Initialized at ${new Date().toISOString()}\n`,
          'utf8'
        );
      }
    } catch (e) {
      console.warn('[SecuritySentinel] Could not create audit log file:', e.message);
    }
  }

  /**
   * Stop daemon (for graceful server shutdown)
   */
  stop() {
    if (this.daemonTimer) {
      clearInterval(this.daemonTimer);
      this.daemonTimer = null;
    }
    this.isRunning = false;
    console.log('🛡️  [SecuritySentinel] Intrusion Defense Daemon stopped.');
  }

  /**
   * Attach Socket.io server to stream real-time security alerts
   */
  setSocketServer(io) {
    this.io = io;
  }

  /**
   * Extract standardized Client IP address from request (handles reverse proxies & cloud load balancers)
   */
  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',').map(s => s.trim());
      if (ips[0]) return ips[0];
    }
    return req.headers['x-real-ip'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }

  /**
   * Check if an IP is currently banned / jailed
   */
  isIpBanned(ip) {
    const banInfo = this.bannedIps.get(ip);
    if (!banInfo) return false;

    if (Date.now() > banInfo.expiresAt) {
      // Ban has expired, remove from blacklist
      this.bannedIps.delete(ip);
      this.stats.currentBannedIpsCount = this.bannedIps.size;
      this.logAudit('AUTO_UNBAN', ip, 'Ban expired naturally.');
      return false;
    }

    return true;
  }

  /**
   * Get remaining ban time in seconds
   */
  getRemainingBanSeconds(ip) {
    const banInfo = this.bannedIps.get(ip);
    if (!banInfo) return 0;
    return Math.max(0, Math.ceil((banInfo.expiresAt - Date.now()) / 1000));
  }

  /**
   * Ban an IP address immediately
   */
  banIp(ip, reason, threatType = 'UNKNOWN', durationMs = null) {
    const ledger = this.getOrCreateLedger(ip);
    ledger.violationCount = (ledger.violationCount || 0) + 1;

    const duration = durationMs || (ledger.violationCount > 1 ? this.REPEAT_OFFENDER_BAN_MS : this.DEFAULT_BAN_DURATION_MS);
    const bannedAt = Date.now();
    const expiresAt = bannedAt + duration;

    const banRecord = {
      ip,
      bannedAt,
      expiresAt,
      reason,
      threatType,
      violationCount: ledger.violationCount
    };

    this.bannedIps.set(ip, banRecord);
    this.stats.currentBannedIpsCount = this.bannedIps.size;

    console.warn(`🚨 [SECURITY ALERT] AUTO-BANNED IP: ${ip} | Reason: ${reason} | Duration: ${Math.round(duration / 60000)}m`);
    this.logAudit('AUTO_BAN', ip, `${reason} (Type: ${threatType}, Violations: ${ledger.violationCount})`);

    // Broadcast live security alert to connected admin workstations
    if (this.io) {
      this.io.emit('security_alert', {
        type: 'IP_BANNED',
        threatType,
        ip: this.maskIp(ip),
        reason,
        timestamp: new Date().toISOString()
      });
    }

    return banRecord;
  }

  /**
   * Manually unban an IP address (Admin override)
   */
  unbanIp(ip) {
    const existed = this.bannedIps.delete(ip);
    if (this.ipLedger.has(ip)) {
      const ledger = this.ipLedger.get(ip);
      ledger.score = 0;
    }
    this.stats.currentBannedIpsCount = this.bannedIps.size;
    this.logAudit('MANUAL_UNBAN', ip, 'IP manually unbanned by administrator');
    return existed;
  }

  /**
   * Clear all banned IPs (Maintenance reset)
   */
  clearAllBans() {
    this.bannedIps.clear();
    this.stats.currentBannedIpsCount = 0;
    this.logAudit('SYSTEM_RESET', 'ALL', 'All IP bans cleared by administrator');
  }

  /**
   * Record a threat violation for an IP and evaluate automated blocking
   */
  recordThreat(ip, threatType, scoreIncrement, reason, reqDetails = {}) {
    this.stats.totalBlockedAttacks++;
    if (this.stats.threatsByType[threatType] !== undefined) {
      this.stats.threatsByType[threatType]++;
    }

    const ledger = this.getOrCreateLedger(ip);
    ledger.score += scoreIncrement;
    ledger.lastSeen = Date.now();

    const eventId = `SEC_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const eventRecord = {
      id: eventId,
      timestamp: new Date().toISOString(),
      ip: this.maskIp(ip),
      rawIp: ip,
      threatType,
      reason,
      path: reqDetails.path || '',
      method: reqDetails.method || '',
      score: ledger.score,
      userAgent: reqDetails.userAgent || 'Unknown'
    };

    // Store in recent events buffer (capped at 100)
    this.recentEvents.unshift(eventRecord);
    if (this.recentEvents.length > 100) {
      this.recentEvents.pop();
    }

    this.logAudit(threatType, ip, `${reason} | URL: ${reqDetails.method} ${reqDetails.path} | Score: ${ledger.score}`);

    // Check if score warrants auto-banning
    if (ledger.score >= this.BAN_THRESHOLD_SCORE) {
      this.banIp(ip, `Threat score ${ledger.score} exceeded limit (${reason})`, threatType);
    }

    return eventId;
  }

  /**
   * Deep Inspection: Scans a given string for hacking/exploit signatures
   */
  detectPayloadThreats(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') return null;

    // 1. Check SQL Injection
    for (const pat of this.patterns.sqlInjection) {
      if (pat.test(inputStr)) {
        return { threatType: 'SQL_INJECTION', score: 100, reason: 'Detected SQL injection payload pattern' };
      }
    }

    // 2. Check Path Traversal
    for (const pat of this.patterns.pathTraversal) {
      if (pat.test(inputStr)) {
        return { threatType: 'PATH_TRAVERSAL', score: 100, reason: 'Detected directory traversal / system file access pattern' };
      }
    }

    // 3. Check XSS
    for (const pat of this.patterns.xss) {
      if (pat.test(inputStr)) {
        return { threatType: 'XSS_ATTACK', score: 100, reason: 'Detected cross-site scripting (XSS) script injection' };
      }
    }

    // 4. Check Command Injection / RCE
    for (const pat of this.patterns.commandInjection) {
      if (pat.test(inputStr)) {
        return { threatType: 'COMMAND_INJECTION', score: 100, reason: 'Detected system command injection syntax' };
      }
    }

    // 5. Check Scanner Probes
    for (const pat of this.patterns.scannerProbes) {
      if (pat.test(inputStr)) {
        return { threatType: 'SCANNER_PROBE', score: 80, reason: 'Detected automated vulnerability reconnaissance probe' };
      }
    }

    return null;
  }

  /**
   * Recursively inspect an object or array (e.g. JSON request body, query parameters)
   */
  inspectStructure(obj, depth = 0) {
    if (depth > 12) return null; // Avoid deep recursion denial-of-service
    if (!obj) return null;

    if (typeof obj === 'string') {
      return this.detectPayloadThreats(obj);
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        const threat = this.inspectStructure(item, depth + 1);
        if (threat) return threat;
      }
      return null;
    }

    if (typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        // Inspect object key for NoSQL injection (e.g. { $where: "..." })
        if (key.startsWith('$')) {
          for (const pat of this.patterns.noSqlInjection) {
            if (pat.test(key)) {
              return { threatType: 'NOSQL_INJECTION', score: 100, reason: `Detected illegal NoSQL injection operator (${key})` };
            }
          }
        }

        // Inspect key name for payloads
        const keyThreat = this.detectPayloadThreats(key);
        if (keyThreat) return keyThreat;

        // Inspect value
        const valThreat = this.inspectStructure(val, depth + 1);
        if (valThreat) return valThreat;
      }
    }

    return null;
  }

  /**
   * Check Rate Limit for an IP
   */
  checkRateLimit(ip, isSensitive = false) {
    const now = Date.now();
    const map = isSensitive ? this.sensitiveRateLimitMap : this.rateLimitMap;
    const maxLimit = isSensitive ? this.RATE_LIMIT_SENSITIVE_MAX : this.RATE_LIMIT_GLOBAL_MAX;

    let record = map.get(ip);
    if (!record || now - record.windowStart > 60000) {
      record = { count: 1, windowStart: now };
      map.set(ip, record);
      return { allowed: true, count: 1, limit: maxLimit };
    }

    record.count++;

    if (record.count > maxLimit) {
      // If extreme flooding (2.5x the limit), auto-ban for scraping/flood abuse
      if (record.count > maxLimit * 2.5) {
        this.banIp(ip, `Excessive automated scraping/flooding (${record.count} req/min)`, 'DATA_SCRAPING_FLOOD', 30 * 60 * 1000);
      } else {
        this.recordThreat(ip, 'DATA_SCRAPING_FLOOD', 25, `Rate limit exceeded: ${record.count}/${maxLimit} req/min`, { path: isSensitive ? 'Sensitive' : 'General' });
      }

      return {
        allowed: false,
        count: record.count,
        limit: maxLimit,
        retryAfterSec: Math.ceil((60000 - (now - record.windowStart)) / 1000)
      };
    }

    return { allowed: true, count: record.count, limit: maxLimit };
  }

  /**
   * Internal Helper: Get or create IP ledger
   */
  getOrCreateLedger(ip) {
    let ledger = this.ipLedger.get(ip);
    if (!ledger) {
      ledger = {
        score: 0,
        violationCount: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      };
      this.ipLedger.set(ip, ledger);
    }
    return ledger;
  }

  /**
   * Periodic background maintenance: clean expired bans and decay threat scores
   */
  maintain() {
    const now = Date.now();

    // 1. Clean expired bans
    for (const [ip, ban] of this.bannedIps.entries()) {
      if (now > ban.expiresAt) {
        this.bannedIps.delete(ip);
        this.logAudit('AUTO_UNBAN', ip, 'Ban expired naturally.');
      }
    }
    this.stats.currentBannedIpsCount = this.bannedIps.size;

    // 2. Decay threat scores for non-banned IPs (decay by 15 points every minute)
    for (const [ip, ledger] of this.ipLedger.entries()) {
      if (!this.bannedIps.has(ip)) {
        ledger.score = Math.max(0, ledger.score - 15);
        if (ledger.score === 0 && now - ledger.lastSeen > 2 * 60 * 60 * 1000) {
          this.ipLedger.delete(ip); // Purge dormant IPs
        }
      }
    }

    // 3. Clean old rate-limit entries
    for (const [ip, record] of this.rateLimitMap.entries()) {
      if (now - record.windowStart > 120000) {
        this.rateLimitMap.delete(ip);
      }
    }
    for (const [ip, record] of this.sensitiveRateLimitMap.entries()) {
      if (now - record.windowStart > 120000) {
        this.sensitiveRateLimitMap.delete(ip);
      }
    }
  }

  /**
   * Write an audit entry to the persistent log file
   */
  logAudit(action, ip, details) {
    try {
      const line = `[${new Date().toISOString()}] [${action}] IP: ${this.maskIp(ip)} | ${details}\n`;
      fs.appendFileSync(this.auditLogPath, line, 'utf8');
    } catch (e) {}
  }

  /**
   * Mask IP address for privacy in public interfaces (e.g. 192.168.1.50 -> 192.168.1.***)
   */
  maskIp(ip) {
    if (!ip) return '***';
    if (ip === '127.0.0.1' || ip === '::1') return '127.0.0.1';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
    return ip.slice(0, Math.min(ip.length, 12)) + '***';
  }

  /**
   * Public stats for administrative auditing
   */
  getSecurityStats() {
    return {
      status: 'ONLINE',
      shieldActive: true,
      daemonRunning: this.isRunning,
      uptimeSeconds: Math.floor(process.uptime()),
      totalInspectedRequests: this.stats.totalInspectedRequests,
      totalBlockedAttacks: this.stats.totalBlockedAttacks,
      activeJailedIps: this.bannedIps.size,
      threatBreakdown: this.stats.threatsByType,
      recentThreats: this.recentEvents.slice(0, 15)
    };
  }
}

// Export singleton instance
const securitySentinel = new SecuritySentinel();
module.exports = securitySentinel;
