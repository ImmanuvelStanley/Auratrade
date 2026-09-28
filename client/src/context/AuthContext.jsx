import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auratrade_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to restore auth session:', e);
        }
        // Token invalid or expired
        localStorage.removeItem('auratrade_token');
        setToken(null);
      }

      setUser(null);
      setLoading(false);
    }

    initAuth();
  }, []);

  // Request 6-Digit OTP via SMS or Email
  const sendOtp = async ({ identifier, channel = 'email', purpose = 'login', name = '', email = '', phone = '', password = '' }) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, channel, purpose, name, email, phone, password })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to dispatch verification code.');
    }
    return data;
  };

  // Verify 6-Digit OTP and Establish Authenticated Session
  const verifyOtp = async ({ identifier, code }) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Verification failed. Please check the 6-digit code.');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auratrade_token', data.token);
    localStorage.removeItem('auratrade_logged_out');
    return data.user;
  };

  const login = async (identifier, password) => {
    // Password is always required for the password-login flow
    if (!password || !password.trim()) {
      throw new Error('Password is required. Use the OTP sign-in option if you registered without a password.');
    }
    let res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, password })
    });
    let data = await res.json();

    // If serverless container restarted and lost in-memory state (without MongoDB),
    // automatically re-provision the account if registered from this client
    if (!data.success && data.userNotFound && identifier.includes('@')) {
      try {
        const savedAccounts = JSON.parse(localStorage.getItem('auratrade_local_accounts') || '{}');
        const accountData = savedAccounts[identifier.trim().toLowerCase()];
        if (accountData) {
          const autoRegRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: identifier.trim().toLowerCase(),
              password,
              name: accountData.name || identifier.split('@')[0],
              initialBalance: 1000,
              phone: accountData.phone || ''
            })
          });
          const autoRegData = await autoRegRes.json();
          if (autoRegData.success) {
            data = autoRegData;
          }
        }
      } catch (e) {
        // Fall through to standard error handling
      }
    }

    if (!data.success) {
      const err = new Error(data.error || 'Login failed');
      if (data.userNotFound) err.userNotFound = true;
      if (data.requiresPassword) err.requiresPassword = true;
      throw err;
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auratrade_token', data.token);
    localStorage.removeItem('auratrade_logged_out');
    return data.user;
  };

  const register = async (email, password, name, initialBalance, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, initialBalance, phone })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');

    // Save metadata locally for seamless serverless cold-start resilience
    try {
      const savedAccounts = JSON.parse(localStorage.getItem('auratrade_local_accounts') || '{}');
      savedAccounts[email.trim().toLowerCase()] = { name, phone };
      localStorage.setItem('auratrade_local_accounts', JSON.stringify(savedAccounts));
    } catch (e) {}

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auratrade_token', data.token);
    localStorage.removeItem('auratrade_logged_out');
    return data.user;
  };

  const updateProfile = async (payload) => {
    if (!token) throw new Error('Not authenticated');
    const body = typeof payload === 'string' ? { name: payload } : (payload || {});
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update profile');
    setUser(data.user);
    window.dispatchEvent(new CustomEvent('auratrade_user_updated', { detail: data.user }));
    return data.user;
  };

  // Forgot Password — sends reset OTP to email
  const forgotPassword = async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to send reset code.');
    return data;
  };

  // Reset Password — verify Token or OTP from email then set new password & auto-login
  const resetPassword = async (email, code, newPassword, resetToken = null) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword, token: resetToken })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Password reset failed.');

    if (data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('auratrade_token', data.token);
      localStorage.removeItem('auratrade_logged_out');
    }
    return data;
  };

  const verifyResetToken = async (resetToken) => {
    const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(resetToken)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Reset link is invalid or expired.');
    return data;
  };

  // Change Password — for logged-in users
  const changePassword = async (currentPassword, newPassword) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to change password.');
    return data;
  };

  // Delete Account — GDPR erasure, logs user out after deletion
  const deleteAccount = async (password, confirmPhrase) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password, confirmPhrase })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Account deletion failed.');
    // Clear session
    setUser(null);
    setToken(null);
    localStorage.removeItem('auratrade_token');
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auratrade_token');
    localStorage.setItem('auratrade_logged_out', 'true');
    window.dispatchEvent(new CustomEvent('auratrade_logout'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOtp,
        verifyOtp,
        login,
        register,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
        verifyResetToken,
        changePassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from './useAuth';
