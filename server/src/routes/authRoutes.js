const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const store = require('../models/store');
const { requireAuth } = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

// --- OTP Authentication Routes (Mobile SMS & Email) ---

// Send OTP (Email Verification for Registration, Login, or Reset)
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier, purpose = 'register', name, email, phone, password } = req.body;
    const targetEmail = (email || identifier || '').trim();

    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existingUser = await store.findUserByEmail(targetEmail);
    if (purpose === 'register' && existingUser) {
      return res.status(400).json({
        success: false,
        isExistingUser: true,
        error: 'An account with this email already exists. Please switch to Sign In to log in.'
      });
    }

    if (purpose === 'login' && !existingUser) {
      return res.status(404).json({
        success: false,
        userNotFound: true,
        error: `No registered account found with '${targetEmail}'. Please switch to Create Account to sign up.`
      });
    }

    const otpData = await store.createOtp({
      identifier: targetEmail,
      channel: 'email',
      purpose,
      name: name || (existingUser ? existingUser.name : ''),
      email: targetEmail,
      phone: phone ? phone.trim() : (existingUser ? existingUser.phone : ''),
      password: password || ''
    });

    // Dispatch real Email notification (Gmail SMTP)
    const deliveryStatus = await notificationService.sendEmailOtp(targetEmail, otpData.code, purpose);
    const isLocalOrNoSmtp = !process.env.SMTP_USER || deliveryStatus?.method === 'ethereal' || !deliveryStatus?.delivered;
    const sanitizedDelivery = {
      ...(deliveryStatus || {}),
      demoCode: isLocalOrNoSmtp ? otpData.code : undefined
    };

    res.json({
      success: true,
      message: `Verification code sent to ${otpData.maskedDestination}`,
      channel: 'email',
      maskedDestination: otpData.maskedDestination,
      deliveryStatus: sanitizedDelivery,
      demoCode: isLocalOrNoSmtp ? otpData.code : undefined,
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
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ success: false, error: 'Destination and 6-digit OTP code are required.' });
    }

    const user = await store.verifyOtp({ identifier, code });
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });
    const portfolio = await store.getPortfolio(user.id);

    console.log(`✅ [AUTH SUCCESS] User authenticated via OTP: ${user.name} (${user.email || user.phone})`);

    res.json({
      success: true,
      token,
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

// Register New User (Email + Password Direct or fallback)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, initialBalance, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const user = await store.createUser(email, password, name, initialBalance, phone);
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });
    const portfolio = await store.getPortfolio(user.id);

    res.status(201).json({
      success: true,
      token,
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
    const { identifier, email, phone, password } = req.body;
    const targetIdentifier = (identifier || email || phone || '').trim();

    if (!targetIdentifier) {
      return res.status(400).json({ success: false, error: 'Please enter your email address or mobile number.' });
    }

    const user = await store.findUserByEmailOrPhone(targetIdentifier);
    if (!user) {
      return res.status(404).json({
        success: false,
        userNotFound: true,
        error: `No registered account found with '${targetIdentifier}'. Please switch to Create Account to sign up.`
      });
    }

    // Password is MANDATORY for the password login flow
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        success: false,
        requiresPassword: true,
        error: 'Password is required. Use the OTP sign-in option if you registered without a password.'
      });
    }

    // Verify the password against the stored hash
    const isMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password. Please try again.' });
    }

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      minBalance: user.minBalance !== undefined ? user.minBalance : 100,
      createdAt: user.createdAt
    }, config.jwtSecret, { expiresIn: '7d' });
    const portfolio = await store.getPortfolio(user.id);

    console.log(`✅ [SIGN IN SUCCESS] User logged in: ${user.name} (${targetIdentifier})`);

    res.json({
      success: true,
      token,
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
// Forgot Password — Send OTP to registered email for reset
// =========================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const user = await store.findUserByEmail(targetEmail);
    // Always return the same response to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset code has been sent.'
      });
    }

    const otpData = await store.createOtp({
      identifier: targetEmail,
      channel: 'email',
      purpose: 'reset',
      name: user.name,
      email: targetEmail
    });

    const deliveryStatus = await notificationService.sendEmailOtp(targetEmail, otpData.code, 'reset');
    const isLocalOrNoSmtp = !process.env.SMTP_USER || deliveryStatus?.method === 'ethereal' || !deliveryStatus?.delivered;

    res.json({
      success: true,
      message: `Password reset code sent to ${otpData.maskedDestination}`,
      maskedDestination: otpData.maskedDestination,
      deliveryStatus: {
        ...(deliveryStatus || {}),
        demoCode: isLocalOrNoSmtp ? otpData.code : undefined
      },
      demoCode: isLocalOrNoSmtp ? otpData.code : undefined,
      expiresIn: otpData.expiresIn,
      resendCooldown: otpData.resendCooldown
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================
// Reset Password — Verify OTP then set a new password
// =========================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();

    if (!targetEmail || !code || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, verification code, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }

    // Verify OTP (this also auto-creates user if needed, but user must exist here)
    const user = await store.verifyOtp({ identifier: targetEmail, code });
    if (!user) {
      return res.status(400).json({ success: false, error: 'OTP verification failed.' });
    }

    // Hash and store the new password
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);
    const storedUser = await store.findUserById(user.id);
    if (!storedUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    storedUser.passwordHash = hash;
    store.save();

    console.log(`✅ [PASSWORD RESET] User reset password: ${storedUser.name} (${targetEmail})`);

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
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
