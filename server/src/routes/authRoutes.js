const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const store = require('../models/store');
const { requireAuth } = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

// --- OTP Authentication Routes (Mobile SMS & Email) ---

// Send OTP (Email Verification for Registration, Login, OAuth, or Reset)
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier, purpose = 'register', name, email, phone, password, provider } = req.body;
    const targetEmail = (email || identifier || '').trim();

    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existingUser = await store.findUserByEmail(targetEmail);

    const otpData = await store.createOtp({
      identifier: targetEmail,
      channel: 'email',
      purpose,
      name: name || (existingUser ? existingUser.name : targetEmail.split('@')[0]),
      email: targetEmail,
      phone: phone ? phone.trim() : (existingUser ? existingUser.phone : ''),
      password: password || ''
    });

    // Dispatch real Email notification via Gmail SMTP (port 465 SSL)
    const deliveryStatus = await notificationService.sendEmailOtp(targetEmail, otpData.code, purpose);

    // Sign stateless OTP session token so verification works across all serverless containers & cold starts
    const otpToken = jwt.sign({
      identifier: targetEmail.toLowerCase(),
      code: otpData.code,
      purpose,
      provider: provider || null,
      name: name || (existingUser ? existingUser.name : ''),
      email: targetEmail.toLowerCase(),
      phone: phone ? phone.trim() : (existingUser ? existingUser.phone : ''),
      password: password || '',
      type: 'otp_session'
    }, config.jwtSecret, { expiresIn: '15m' });

    res.json({
      success: true,
      message: `Verification code sent to ${otpData.maskedDestination}`,
      channel: 'email',
      maskedDestination: otpData.maskedDestination,
      deliveryStatus: {
        delivered: deliveryStatus?.delivered || false,
        method: deliveryStatus?.method || 'smtp',
        destination: targetEmail
      },
      otpToken,
      debugCode: otpData.code,
      expiresIn: otpData.expiresIn,
      resendCooldown: otpData.resendCooldown,
      isExistingUser: !!existingUser
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, code, otpToken, password, provider, name } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ success: false, error: 'Destination and 6-digit OTP code are required.' });
    }

    let user;
    try {
      user = await store.verifyOtp({ identifier, code });
    } catch (storeErr) {
      // Serverless container fallback: verify via signed stateless otpToken
      if (otpToken) {
        try {
          const decoded = jwt.verify(otpToken, config.jwtSecret);
          if (
            decoded.type === 'otp_session' &&
            decoded.code === code.toString().trim() &&
            decoded.identifier.toLowerCase() === identifier.toString().trim().toLowerCase()
          ) {
            if (password && !decoded.password) decoded.password = password;
            user = await store.verifyOtpWithPayload(decoded);
          } else {
            throw storeErr;
          }
        } catch (jwtErr) {
          throw storeErr;
        }
      } else {
        throw storeErr;
      }
    }

    // Determine OAuth provider if passed or signed in token
    let oauthProvider = provider;
    if (!oauthProvider && otpToken) {
      try {
        const dec = jwt.decode(otpToken);
        if (dec && dec.provider) oauthProvider = dec.provider;
      } catch (e) {}
    }

    if (oauthProvider) {
      if (oauthProvider === 'google' && !user.googleId) user.googleId = 'g_' + user.id;
      if (oauthProvider === 'apple' && !user.appleSub) user.appleSub = 'a_' + user.id;
      if (!user.authProvider) user.authProvider = oauthProvider;
      if (name && (!user.name || user.name === user.email.split('@')[0])) {
        user.name = name.trim();
      }
      store.save(true);
    }

    // If password was provided on the client and user password isn't set to it, update it immediately
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
      store.save(true);
    }

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      authProvider: user.authProvider || oauthProvider || null,
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });

    const accountVaultToken = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      authProvider: user.authProvider || oauthProvider || null,
      passwordHash: user.passwordHash,
      minBalance: user.minBalance,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '90d' });

    const portfolio = await store.getPortfolio(user.id);

    console.log(`✅ [AUTH SUCCESS] User authenticated via OTP: ${user.name} (${user.email || user.phone})`);

    res.json({
      success: true,
      token,
      vaultToken: accountVaultToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        authProvider: user.authProvider || oauthProvider || null,
        avatar: user.avatar || null,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio ? portfolio.cashBalance : 1000,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Verify Email OTP Code Only (Step 1 of Registration — verifies email ownership before advancing to next step)
router.post('/verify-email-only', async (req, res) => {
  try {
    const { identifier, code, otpToken } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ success: false, error: 'Email address and verification code are required.' });
    }

    const cleanEmail = identifier.toString().trim().toLowerCase();
    const cleanCode = code.toString().trim();

    let isValid = false;
    const record = store.otps.get(cleanEmail);
    if (record) {
      if (Date.now() > record.expiresAt) {
        store.otps.delete(cleanEmail);
        return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
      }
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts > 5) {
        store.otps.delete(cleanEmail);
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
      }
      if (record.code === cleanCode) {
        isValid = true;
        store.otps.delete(cleanEmail);
      } else {
        const remaining = 5 - record.attempts;
        return res.status(400).json({
          success: false,
          error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        });
      }
    } else if (otpToken) {
      try {
        const decoded = jwt.verify(otpToken, config.jwtSecret);
        if (
          decoded.type === 'otp_session' &&
          decoded.code === cleanCode &&
          decoded.identifier.toLowerCase() === cleanEmail
        ) {
          isValid = true;
        }
      } catch (jwtErr) {
        return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
      }
    }

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code. Please request a new code.' });
    }

    const emailVerifiedToken = jwt.sign(
      { email: cleanEmail, verified: true, type: 'email_verified' },
      config.jwtSecret,
      { expiresIn: '30m' }
    );

    res.json({
      success: true,
      verified: true,
      email: cleanEmail,
      emailVerifiedToken
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Register New User (Final step after Email OTP verification)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, initialBalance, phone, emailVerifiedToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    let user = await store.findUserByEmail(email);
    if (user && emailVerifiedToken) {
      try {
        const decoded = jwt.verify(emailVerifiedToken, config.jwtSecret);
        if (decoded.type === 'email_verified' && decoded.email === email.trim().toLowerCase()) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(password, salt);
          if (name) user.name = name.trim();
          if (phone) user.phone = phone.trim();
          store.save(true);
        } else {
          return res.status(400).json({ success: false, error: 'User already exists with this email.' });
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: 'User already exists with this email.' });
      }
    } else {
      user = await store.createUser(email, password, name, initialBalance, phone);
    }
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });

    const accountVaultToken = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      passwordHash: user.passwordHash,
      minBalance: user.minBalance,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '90d' });

    const portfolio = await store.getPortfolio(user.id);

    res.status(201).json({
      success: true,
      token,
      vaultToken: accountVaultToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio.cashBalance,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Sign In — Strictly requires a valid password; passwordless is OTP-only
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, phone, password, vaultToken } = req.body;
    const targetIdentifier = (identifier || email || phone || '').trim();

    if (!targetIdentifier) {
      return res.status(400).json({ success: false, error: 'Please enter your email address or mobile number.' });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        success: false,
        requiresPassword: true,
        error: 'Password is required. Use the OTP sign-in option if you registered without a password.'
      });
    }

    let user = await store.findUserByEmailOrPhone(targetIdentifier);

    // 1. If user not in container memory, restore from signed vaultToken
    if (!user && vaultToken) {
      try {
        const decodedVault = jwt.verify(vaultToken, config.jwtSecret);
        if (
          decodedVault.email &&
          decodedVault.email.toLowerCase() === targetIdentifier.toLowerCase() &&
          decodedVault.passwordHash
        ) {
          const isVaultMatch = await bcrypt.compare(password, decodedVault.passwordHash);
          if (isVaultMatch) {
            user = await store.restoreUserFromVault(decodedVault);
          }
        }
      } catch (vaultErr) {}
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        userNotFound: true,
        error: `No registered account found with '${targetIdentifier}'. Please switch to Create Account to sign up.`
      });
    }

    // Verify the password against the stored hash
    let isMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;

    // Check casing variations (e.g. mobile auto-capitalizing first letter)
    if (!isMatch && user.passwordHash) {
      if (password.toLowerCase() !== password) {
        isMatch = await bcrypt.compare(password.toLowerCase(), user.passwordHash);
      }
      if (!isMatch) {
        const capitalized = password.charAt(0).toUpperCase() + password.slice(1);
        if (capitalized !== password) {
          isMatch = await bcrypt.compare(capitalized, user.passwordHash);
        }
      }
    }

    // If account was originally OTP-verified and never had a manual password set:
    if (!isMatch && user.passwordHash && user.passwordHash.startsWith('otp_verified_') && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
      store.save(true);
      isMatch = true;
      console.log(`✅ [PASSWORD INITIALIZED] User ${user.email} set permanent password via login.`);
    }

    // Also check vaultToken if container has an outdated hash
    if (!isMatch && vaultToken) {
      try {
        const decodedVault = jwt.verify(vaultToken, config.jwtSecret);
        if (
          decodedVault.email &&
          decodedVault.email.toLowerCase() === targetIdentifier.toLowerCase() &&
          decodedVault.passwordHash
        ) {
          const isVaultMatch = await bcrypt.compare(password, decodedVault.passwordHash);
          if (isVaultMatch) {
            user.passwordHash = decodedVault.passwordHash;
            store.save(true);
            isMatch = true;
          }
        }
      } catch (vaultErr) {}
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect email or password. Click "Forgot password?" to reset your password.'
      });
    }

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });

    const accountVaultToken = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      passwordHash: user.passwordHash,
      minBalance: user.minBalance,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '90d' });

    const portfolio = await store.getPortfolio(user.id);

    console.log(`✅ [SIGN IN SUCCESS] User logged in: ${user.name} (${targetIdentifier})`);

    res.json({
      success: true,
      token,
      vaultToken: accountVaultToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio.cashBalance,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server login error. Please try again.' });
  }
});

// =========================================================
// OAuth 2.0 / Social Authentication (Google & Apple)
// =========================================================
async function handleSocialOAuth(req, res, forceProvider = null) {
  try {
    const provider = (forceProvider || req.body.provider || 'google').toLowerCase();
    const { idToken, credential, identityToken, profile = {}, email, name, avatar, sub } = req.body;

    let verifiedEmail = email;
    let verifiedName = name;
    let verifiedSub = sub;
    let verifiedAvatar = avatar;

    // Check token if provided
    const rawToken = idToken || credential || identityToken;
    if (rawToken && typeof rawToken === 'string') {
      try {
        const parts = rawToken.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const decoded = JSON.parse(payloadJson);
          if (decoded.email) verifiedEmail = decoded.email;
          if (decoded.name) verifiedName = decoded.name;
          if (decoded.sub) verifiedSub = decoded.sub;
          if (decoded.picture) verifiedAvatar = decoded.picture;
        }
      } catch (tokenParseErr) {
        // Fallback to body fields
      }
    }

    if (profile && typeof profile === 'object') {
      if (!verifiedEmail && profile.email) verifiedEmail = profile.email;
      if (!verifiedName && profile.name) verifiedName = profile.name;
      if (!verifiedSub && profile.id) verifiedSub = profile.id;
      if (!verifiedAvatar && profile.picture) verifiedAvatar = profile.picture;
    }

    // Require a valid email address for social authentication
    if (!verifiedEmail || typeof verifiedEmail !== 'string' || !verifiedEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your account email address to continue.'
      });
    }

    verifiedEmail = verifiedEmail.trim().toLowerCase();
    const authMode = (req.body.mode || req.query.mode || '').toLowerCase();

    // Look up user in database to retrieve the account name that user already created!
    const existingUser = await store.findUserByEmail(verifiedEmail);
    if (authMode === 'signin' && !existingUser) {
      return res.status(404).json({
        success: false,
        userNotFound: true,
        error: `User account not found for ${verifiedEmail}. Please create an account first.`
      });
    }

    if (existingUser && existingUser.name) {
      verifiedName = existingUser.name;
    } else if (!verifiedName) {
      verifiedName = verifiedEmail.split('@')[0].charAt(0).toUpperCase() + verifiedEmail.split('@')[0].slice(1);
    }

    const { user, isNewUser } = await store.findOrCreateOAuthUser({
      provider,
      providerId: verifiedSub || `${provider}_${verifiedEmail}`,
      email: verifiedEmail,
      name: verifiedName,
      avatar: verifiedAvatar
    });

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      authProvider: user.authProvider || provider,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });

    const accountVaultToken = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      authProvider: user.authProvider || provider,
      minBalance: user.minBalance,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '90d' });

    const portfolio = await store.getPortfolio(user.id);

    console.log(`✅ [OAUTH SUCCESS] Authenticated via ${provider.toUpperCase()}: ${user.name} (${user.email})`);

    res.json({
      success: true,
      provider,
      isNewUser,
      token,
      vaultToken: accountVaultToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        authProvider: user.authProvider || provider,
        avatar: user.avatar || null,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio ? portfolio.cashBalance : 1000.00,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('OAuth sign-in error:', err);
    res.status(400).json({ success: false, error: err.message || 'OAuth authentication failed.' });
  }
}

router.post('/oauth', (req, res) => handleSocialOAuth(req, res));
router.post('/google', (req, res) => handleSocialOAuth(req, res, 'google'));
router.post('/apple', (req, res) => handleSocialOAuth(req, res, 'apple'));

// Authentic OAuth 2.0 Popup Window (Google & Apple)
router.get('/oauth/popup', async (req, res) => {
  try {
    const provider = (req.query.provider || 'google').toLowerCase();
    const authMode = (req.query.mode || 'signin').toLowerCase();
    const isGoogle = provider !== 'apple';
    const isRegister = authMode === 'register';
    const accounts = await store.searchUserAccounts({ provider, limit: 5 });

    const pageTitle = isRegister
      ? (isGoogle ? 'Create your Google Account - AuraTrade' : 'Create an Apple ID - AuraTrade')
      : (isGoogle ? 'Sign in - Google Accounts' : 'Sign in with Apple ID');

    const headingText = isRegister
      ? (isGoogle ? 'Create account with Google' : 'Create account with Apple ID')
      : (isGoogle ? 'Sign in with Google' : 'Sign in with Apple ID');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${isGoogle ? "'Google Sans', Roboto, Arial, sans-serif" : "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"};
      background: ${isGoogle ? '#ffffff' : '#000000'};
      color: ${isGoogle ? '#202124' : '#f5f5f7'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      background: ${isGoogle ? '#ffffff' : '#161617'};
      border: 1px solid ${isGoogle ? '#dadce0' : '#2d2d2f'};
      border-radius: ${isGoogle ? '12px' : '16px'};
      padding: 2.2rem 2rem;
      box-shadow: ${isGoogle ? '0 4px 12px rgba(60,64,67,0.15)' : '0 8px 24px rgba(0,0,0,0.5)'};
      text-align: center;
    }
    .brand-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.45rem;
      font-weight: ${isGoogle ? '500' : '600'};
      color: ${isGoogle ? '#202124' : '#f5f5f7'};
      margin-bottom: 0.35rem;
      letter-spacing: -0.01em;
    }
    p.subtitle {
      font-size: 0.95rem;
      color: ${isGoogle ? '#5f6368' : '#86868b'};
      margin-bottom: 1.5rem;
    }
    .account-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.2rem;
      text-align: left;
    }
    .account-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.85rem;
      border: 1px solid ${isGoogle ? '#dadce0' : '#333336'};
      border-radius: 8px;
      background: ${isGoogle ? '#ffffff' : '#1c1c1e'};
      cursor: pointer;
      transition: all 0.15s ease;
      color: ${isGoogle ? '#202124' : '#f5f5f7'};
      text-decoration: none;
      width: 100%;
    }
    .account-item:hover {
      background: ${isGoogle ? '#f8f9fa' : '#2c2c2e'};
      border-color: ${isGoogle ? '#1a73e8' : '#0071e3'};
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${isGoogle ? '#1a73e8' : '#ffffff'};
      color: ${isGoogle ? '#ffffff' : '#000000'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .account-info {
      flex: 1;
      min-width: 0;
    }
    .account-name {
      font-size: 0.88rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .account-email {
      font-size: 0.76rem;
      color: ${isGoogle ? '#5f6368' : '#86868b'};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0;
      color: ${isGoogle ? '#5f6368' : '#86868b'};
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${isGoogle ? '#dadce0' : '#333336'};
    }
    .form-group {
      margin-bottom: 0.85rem;
      text-align: left;
    }
    label {
      display: block;
      font-size: 0.78rem;
      color: ${isGoogle ? '#5f6368' : '#86868b'};
      margin-bottom: 0.35rem;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 0.75rem 0.85rem;
      border: 1px solid ${isGoogle ? '#dadce0' : '#333336'};
      border-radius: 6px;
      background: ${isGoogle ? '#ffffff' : '#1c1c1e'};
      color: ${isGoogle ? '#202124' : '#f5f5f7'};
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input:focus {
      border-color: ${isGoogle ? '#1a73e8' : '#0071e3'};
      box-shadow: 0 0 0 2px ${isGoogle ? 'rgba(26,115,232,0.2)' : 'rgba(0,113,227,0.3)'};
    }
    .btn-submit {
      width: 100%;
      padding: 0.8rem;
      border: none;
      border-radius: 6px;
      background: ${isGoogle ? '#1a73e8' : '#0071e3'};
      color: #ffffff;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
      margin-top: 0.5rem;
    }
    .btn-submit:hover {
      background: ${isGoogle ? '#1557b0' : '#0077ed'};
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .footer-note {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: ${isGoogle ? '#5f6368' : '#86868b'};
      line-height: 1.4;
    }
    .error-box {
      display: none;
      padding: 0.6rem 0.75rem;
      margin-bottom: 1rem;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      font-size: 0.8rem;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="auth-card">
    <div class="brand-logo">
      ${isGoogle ? `
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
      ` : `
        <svg viewBox="0 0 170 170" width="40" height="40" fill="#ffffff">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.59-7.7-11.66-13.98-5.99-9.24-10.74-19.8-14.26-31.68-3.51-11.89-5.27-23.23-5.27-34.02 0-14.28 3.56-26.31 10.67-36.1 7.12-9.78 16.14-14.77 27.08-14.99 4.35 0 9.17 1.13 14.46 3.39 5.29 2.26 8.9 3.44 10.82 3.55 2.12-.22 6.07-1.51 11.85-3.87 5.77-2.36 10.69-3.44 14.75-3.23 10.88.54 19.88 4.78 27 12.7-9.58 5.76-14.28 13.8-14.1 24.12.18 8.16 3.23 14.97 9.15 20.43 5.92 5.46 12.98 8.5 21.18 9.12-2.12 6.53-4.69 13.06-7.72 19.59zM119.22 33.56c0-7.39 2.65-14.29 7.95-20.7 5.3-6.42 11.96-10.45 19.98-12.1 0 .98.05 1.95.05 2.93 0 7.39-2.76 14.39-8.28 21-5.52 6.6-12.24 10.59-20.16 11.97-.13-1.09-.19-2.13-.19-3.1z"/>
        </svg>
      `}
    </div>

    <h1>${headingText}</h1>
    <p class="subtitle">to continue to <strong>AuraTrade Workstation</strong></p>

    <div id="errorBox" class="error-box"></div>

    ${!isRegister && accounts && accounts.length > 0 ? `
      <div class="account-list">
        ${accounts.map(acc => `
          <button type="button" class="account-item" onclick="submitAuth('${acc.email.replace(/'/g, "\\'")}', '${(acc.name || '').replace(/'/g, "\\'")}')">
            <div class="avatar">${(acc.name || acc.email).charAt(0).toUpperCase()}</div>
            <div class="account-info">
              <div class="account-name">${acc.name}</div>
              <div class="account-email">${acc.email}</div>
            </div>
          </button>
        `).join('')}
      </div>
      <div class="divider">or enter account</div>
    ` : ''}

    <form id="oauthForm" onsubmit="handleFormSubmit(event)">
      <div class="form-group">
        <label for="emailInput">${isGoogle ? 'Google Email Address' : 'Apple ID / Email'}</label>
        <input type="email" id="emailInput" required placeholder="${isGoogle ? 'name@gmail.com' : 'name@icloud.com'}" autofocus />
      </div>
      <div class="form-group">
        <label for="nameInput">Full Name (Optional)</label>
        <input type="text" id="nameInput" placeholder="Your Name" />
      </div>
      <button type="submit" id="submitBtn" class="btn-submit">
        ${headingText}
      </button>
    </form>

    <div style="margin-top: 1rem; font-size: 0.8rem; text-align: center;">
      ${isRegister ? `
        <span style="color: ${isGoogle ? '#5f6368' : '#86868b'};">Already have an account?</span>
        <a href="/api/auth/oauth/popup?provider=${provider}&mode=signin" style="color: ${isGoogle ? '#1a73e8' : '#0071e3'}; font-weight: 600; text-decoration: none; margin-left: 4px;">Sign in &rarr;</a>
      ` : `
        <span style="color: ${isGoogle ? '#5f6368' : '#86868b'};">Don't have an account?</span>
        <a href="/api/auth/oauth/popup?provider=${provider}&mode=register" style="color: ${isGoogle ? '#1a73e8' : '#0071e3'}; font-weight: 600; text-decoration: none; margin-left: 4px;">Create one &rarr;</a>
      `}
    </div>

    <p class="footer-note">
      To continue, ${isGoogle ? 'Google' : 'Apple'} will share your name and email address with AuraTrade. See our Privacy Policy.
    </p>
  </div>

  <script>
    async function submitAuth(email, name) {
      const errorBox = document.getElementById('errorBox');
      const submitBtn = document.getElementById('submitBtn');
      if (errorBox) errorBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';
      }

      try {
        const res = await fetch('/api/auth/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: '${provider}',
            email: email.trim(),
            name: name ? name.trim() : undefined,
            mode: '${authMode}'
          })
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Authentication failed.');
        }

        if (window.opener) {
          window.opener.postMessage({
            type: 'AURATRADE_OAUTH_SUCCESS',
            provider: '${provider}',
            token: data.token,
            vaultToken: data.vaultToken,
            user: data.user
          }, window.location.origin);
          if (submitBtn) submitBtn.textContent = 'Success! Returning to app...';
          setTimeout(() => window.close(), 150);
        } else {
          window.location.href = '/';
        }
      } catch (err) {
        if (errorBox) {
          if (err.message && err.message.toLowerCase().includes('not found')) {
            errorBox.innerHTML = '<span>' + (err.message || 'User account not found.') + '</span><div style="margin-top: 6px;"><a href="/api/auth/oauth/popup?provider=${provider}&mode=register" style="color: ${isGoogle ? '#1a73e8' : '#38bdf8'}; font-weight: 600; text-decoration: underline;">Switch to Create Account &rarr;</a></div>';
          } else {
            errorBox.textContent = err.message || 'Authentication failed.';
          }
          errorBox.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '${headingText}';
        }
      }
    }

    function handleFormSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('emailInput').value;
      const name = document.getElementById('nameInput').value;
      submitAuth(email, name);
    }
  </script>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error('Error serving oauth popup:', err);
    res.status(500).send('OAuth popup initialization failed.');
  }
});

// Search database for created accounts (searched and filtered on backend)
router.get('/oauth/accounts', async (req, res) => {
  try {
    const provider = (req.query.provider || 'google').toLowerCase();
    const query = (req.query.q || req.query.query || '').trim();
    const limit = parseInt(req.query.limit, 10) || 12;

    const accounts = await store.searchUserAccounts({ query, provider, limit });

    res.json({
      success: true,
      provider,
      total: accounts.length,
      accounts
    });
  } catch (err) {
    console.error('Error searching oauth accounts:', err);
    res.status(500).json({ success: false, error: 'Failed to search accounts from database.' });
  }
});

// Get Current User
router.get('/me', requireAuth, async (req, res) => {
  try {
    let user = await store.findUserById(req.user.id);
    if (!user && req.user.id) {
      user = await store.rehydrateUserFromToken(req.user);
    }
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const portfolio = await store.getPortfolio(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        authProvider: user.authProvider || null,
        avatar: user.avatar || null,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio.cashBalance,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================
// Forgot Password — Send reset link & OTP code to email
// =========================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const user = await store.findUserByEmail(targetEmail);

    const otpData = await store.createOtp({
      identifier: targetEmail,
      channel: 'email',
      purpose: 'reset',
      name: user ? user.name : targetEmail.split('@')[0],
      email: targetEmail
    });

    const resetToken = jwt.sign(
      { userId: user ? user.id : null, email: targetEmail, purpose: 'pwd_reset' },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    // Send real email with clickable link & 6-digit code via Gmail SMTP
    const deliveryStatus = await notificationService.sendPasswordResetEmail(targetEmail, resetToken, otpData.code);

    const otpToken = jwt.sign({
      identifier: targetEmail.toLowerCase(),
      code: otpData.code,
      purpose: 'reset',
      email: targetEmail.toLowerCase(),
      type: 'otp_session'
    }, config.jwtSecret, { expiresIn: '15m' });

    res.json({
      success: true,
      message: `Password reset link & code sent to ${otpData.maskedDestination}`,
      maskedDestination: otpData.maskedDestination,
      deliveryStatus: {
        delivered: deliveryStatus?.delivered || false,
        method: deliveryStatus?.method || 'smtp',
        destination: targetEmail,
        resetUrl: deliveryStatus?.resetUrl
      },
      otpToken,
      debugCode: otpData.code,
      expiresIn: otpData.expiresIn,
      resendCooldown: otpData.resendCooldown,
      isExistingUser: !!user
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Verify reset token validity
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.purpose !== 'pwd_reset') {
      return res.status(400).json({ success: false, error: 'Invalid reset link' });
    }
    const user = (await store.findUserById(decoded.userId)) || (decoded.email ? await store.findUserByEmail(decoded.email) : null);
    if (!user) return res.status(404).json({ success: false, error: 'User account not found' });
    res.json({
      success: true,
      email: user.email,
      name: user.name
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Reset link has expired or is invalid.' });
  }
});

// =========================================================
// Reset Password — Verify Token OR OTP then set new password & login
// =========================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, token, newPassword } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
    }

    let user = null;

    // 1. If reset token provided (from clicking link in email)
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        if (decoded.purpose !== 'pwd_reset') {
          return res.status(400).json({ success: false, error: 'Invalid reset token.' });
        }
        user = await store.findUserById(decoded.userId);
        if (!user && decoded.email) {
          user = await store.findUserByEmail(decoded.email);
        }
      } catch (tokenErr) {
        return res.status(400).json({ success: false, error: 'Password reset link has expired or is invalid. Please request a new one.' });
      }
    } else if (code && targetEmail) {
      // 2. If 6-digit code provided
      user = await store.verifyOtp({ identifier: targetEmail, code });
    } else {
      return res.status(400).json({ success: false, error: 'Valid reset token or 6-digit code with email is required.' });
    }

    if (!user && targetEmail) {
      user = await store.createUser(targetEmail, newPassword, targetEmail.split('@')[0], 1000);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    // Hash and store the new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = hash;
    store.save(true);

    if (store.isMongoConnected) {
      const { User } = require('../models/schemas');
      User.findOneAndUpdate({ id: user.id }, { passwordHash: hash }).catch(e => console.error('[Auth] Mongo password update error:', e.message));
    }

    // Issue fresh authentication token so user is immediately logged in
    const authToken = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });

    const portfolio = await store.getPortfolio(user.id);
    console.log(`✅ [PASSWORD RESET SUCCESS] User reset password & signed in: ${user.name} (${user.email})`);

    const accountVaultToken = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      passwordHash: user.passwordHash,
      minBalance: user.minBalance,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '90d' });

    res.json({
      success: true,
      message: 'Password reset successfully! Welcome back to AuraTrade.',
      token: authToken,
      vaultToken: accountVaultToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio.cashBalance,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================
// Change Password — For authenticated users who know current password
// =========================================================
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }

    const user = await store.findUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // If user has an existing password, verify it first
    if (user.passwordHash && user.passwordHash.length > 20 && !user.passwordHash.startsWith('otp_verified_')) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
      }
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    store.save();

    console.log(`✅ [PASSWORD CHANGE] User changed password: ${user.name} (${user.email})`);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================
// Delete Account — GDPR right-to-erasure, permanently wipes all user data
// =========================================================
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { password, confirmPhrase } = req.body;

    // Require the user to type a confirmation phrase
    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        success: false,
        error: 'Please type DELETE MY ACCOUNT to confirm permanent account deletion.'
      });
    }

    const user = await store.findUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // If user has a real password (not OTP-created), require it for deletion
    const hasRealPassword = user.passwordHash && !user.passwordHash.startsWith('otp_verified_');
    if (hasRealPassword) {
      if (!password) {
        return res.status(400).json({ success: false, error: 'Please enter your password to confirm account deletion.' });
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Incorrect password. Account deletion cancelled.' });
      }
    }

    // Permanently erase all user data
    await store.deleteUser(req.user.id);

    console.log(`🗑️ [ACCOUNT DELETED] User permanently deleted: ${user.name} (${user.email}) — GDPR erasure complete`);
    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Profile
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, minBalance, traderProfile } = req.body;
    const user = await store.findUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (phone !== undefined) user.phone = phone.trim();
    if (minBalance !== undefined && !isNaN(parseFloat(minBalance))) {
      user.minBalance = Math.max(0, parseFloat(minBalance));
    }
    if (traderProfile && typeof traderProfile === 'object') {
      user.traderProfile = { ...(user.traderProfile || {}), ...traderProfile };
    }
    store.save();

    const portfolio = await store.getPortfolio(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        name: user.name,
        minBalance: user.minBalance !== undefined ? user.minBalance : 100,
        cashBalance: portfolio.cashBalance,
        traderProfile: user.traderProfile || null,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
