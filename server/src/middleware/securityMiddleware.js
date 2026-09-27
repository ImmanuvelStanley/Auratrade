/**
 * AuraTrade™ Hardened Cybersecurity Middleware
 * 
 * Intercepts every incoming HTTP request to apply defensive security headers,
 * verify IP blacklist state, scan payloads for exploit signatures, and
 * enforce adaptive rate limiting to prevent data theft and scrapers.
 */

const securitySentinel = require('../services/securitySentinel');

/**
 * 1. Hardened Security Headers Middleware
 * Protects against Clickjacking, MIME-type sniffing, cross-site leaks, and server fingerprinting
 */
function hardenHeaders(req, res, next) {
  // Strip server fingerprint
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Powered-By', 'AuraTrade-Shield/2.4');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking (iframe embed defense)
  res.setHeader('X-Frame-Options', 'DENY');

  // Cross-Site Scripting Filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy: Send full URL on same origin, only origin on cross-origin
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy (allows necessary inline styles for high-frequency charts/WebSockets)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval';"
  );

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}

/**
 * 2. Real-Time Automated IP Firewall (Jail Enforcement)
 * Immediately rejects any request originating from an auto-banned attacker IP
 */
function ipFirewall(req, res, next) {
  securitySentinel.stats.totalInspectedRequests++;
  const clientIp = securitySentinel.getClientIp(req);

  // Allow security status & diagnostics routes through so metrics/dashboard/unban remain accessible
  if (req.path.startsWith('/api/security')) {
    return next();
  }

  if (securitySentinel.isIpBanned(clientIp)) {
    const remainingSeconds = securitySentinel.getRemainingBanSeconds(clientIp);
    const banInfo = securitySentinel.bannedIps.get(clientIp);

    res.setHeader('Retry-After', remainingSeconds);
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Your IP address has been automatically blocked by the AuraTrade Security Sentinel due to malicious activity.',
      code: 'IP_BLOCKED_BY_FIREWALL',
      threatType: banInfo?.threatType || 'SUSPICIOUS_ACTIVITY',
      unblockInSeconds: remainingSeconds,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * 3. Deep Request Payload & URL Threat Scanner
 * Inspects URL paths, query parameters, headers, and request body for SQLi, NoSQLi, XSS, Path Traversal, and RCE
 */
function threatDetector(req, res, next) {
  const clientIp = securitySentinel.getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  // 1. Inspect User-Agent for vulnerability scanners and penetration bots
  if (userAgent) {
    for (const pat of securitySentinel.patterns.scannerProbes) {
      if (pat.test(userAgent)) {
        const eventId = securitySentinel.recordThreat(
          clientIp,
          'SCANNER_PROBE',
          100, // Instant ban on aggressive scanner bots
          `Automated vulnerability scanner identified: ${userAgent.slice(0, 50)}`,
          { path: req.originalUrl, method: req.method, userAgent }
        );

        return res.status(403).json({
          success: false,
          error: 'Access Forbidden: Automated vulnerability scanner or reconnaissance bot detected.',
          code: 'SCANNER_BOT_INTERCEPTED',
          type: 'SCANNER_PROBE',
          incidentId: eventId
        });
      }
    }
  }

  // 2. Inspect URL Path for traversal, scanner probing, or sensitive file targeting
  const pathThreat = securitySentinel.detectPayloadThreats(req.originalUrl || req.url);
  if (pathThreat) {
    const eventId = securitySentinel.recordThreat(
      clientIp,
      pathThreat.threatType,
      pathThreat.score,
      pathThreat.reason,
      { path: req.originalUrl, method: req.method, userAgent }
    );

    return res.status(403).json({
      success: false,
      error: 'Access Forbidden: Malicious intrusion vector detected.',
      code: 'SECURITY_THREAT_INTERCEPTED',
      type: pathThreat.threatType,
      incidentId: eventId
    });
  }

  // 2. Inspect Query Parameters
  if (req.query && Object.keys(req.query).length > 0) {
    const queryThreat = securitySentinel.inspectStructure(req.query);
    if (queryThreat) {
      const eventId = securitySentinel.recordThreat(
        clientIp,
        queryThreat.threatType,
        queryThreat.score,
        queryThreat.reason,
        { path: req.originalUrl, method: req.method, userAgent }
      );

      return res.status(403).json({
        success: false,
        error: 'Access Forbidden: Malicious payload detected in request query string.',
        code: 'INJECTION_INTERCEPTED',
        type: queryThreat.threatType,
        incidentId: eventId
      });
    }
  }

  // 3. Inspect JSON Body (POST / PUT / PATCH)
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    const bodyThreat = securitySentinel.inspectStructure(req.body);
    if (bodyThreat) {
      const eventId = securitySentinel.recordThreat(
        clientIp,
        bodyThreat.threatType,
        bodyThreat.score,
        bodyThreat.reason,
        { path: req.originalUrl, method: req.method, userAgent }
      );

      return res.status(403).json({
        success: false,
        error: 'Access Forbidden: Malicious payload or illegal operator detected in request body.',
        code: 'PAYLOAD_INTERCEPTED',
        type: bodyThreat.threatType,
        incidentId: eventId
      });
    }
  }

  next();
}

/**
 * 4. Adaptive Rate Limiter & Anti-Scraping Shield
 * Prevents automated scrapers from stealing proprietary data and brute-forcing authentication
 */
function adaptiveRateLimiter(req, res, next) {
  const clientIp = securitySentinel.getClientIp(req);
  const path = req.path || '';

  // Sensitive paths: Authentication, OTP, Trading transactions
  const isSensitive =
    path.startsWith('/api/auth') ||
    path.startsWith('/api/portfolio/trade') ||
    path.startsWith('/api/portfolio/reset');

  const check = securitySentinel.checkRateLimit(clientIp, isSensitive);

  if (!check.allowed) {
    res.setHeader('Retry-After', check.retryAfterSec || 60);
    return res.status(429).json({
      success: false,
      error: isSensitive
        ? 'Too many authentication or trade attempts. Temporary cooldown initiated.'
        : 'Request rate limit exceeded. Automated scraping/flooding is strictly prohibited.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: check.retryAfterSec || 60
    });
  }

  next();
}

/**
 * 5. Data Leakage & Information Disclosure Prevention
 * Catches internal server errors and ensures stack traces and internal paths are never returned
 */
function dataLeakagePreventer(err, req, res, next) {
  const clientIp = securitySentinel.getClientIp(req);
  console.error(`[SECURITY ERROR INTERCEPT] IP: ${securitySentinel.maskIp(clientIp)} | Path: ${req.originalUrl} | Error:`, err.message);

  // Record if suspicious error
  if (err.message && (err.message.includes('syntax') || err.message.includes('unexpected') || err.message.includes('token'))) {
    securitySentinel.recordThreat(clientIp, 'MALFORMED_PAYLOAD', 15, `Malformed payload triggered server exception: ${err.message.slice(0, 60)}`, { path: req.originalUrl, method: req.method });
  }

  // Sanitize response: never leak internal file paths, module names, or DB structures
  res.status(err.status || 500).json({
    success: false,
    error: 'An internal error occurred. Request was safely halted by the security boundary.',
    code: 'SEC_SAFE_ERROR_INTERCEPT',
    reference: `ERR_${Date.now()}`
  });
}

module.exports = {
  hardenHeaders,
  ipFirewall,
  threatDetector,
  adaptiveRateLimiter,
  dataLeakagePreventer
};
