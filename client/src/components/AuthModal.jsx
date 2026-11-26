import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+81', country: 'JP', flag: '🇯🇵' }
];

function GoogleSvg() {
  return (
    <svg className="auth-social-icon auth-social-icon--google" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </svg>
  );
}

function AppleSvg() {
  return (
    <svg className="auth-social-icon auth-social-icon--apple" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.18c.63-.78 1.06-1.86.94-2.94-.92.04-2.02.61-2.68 1.39-.58.68-1.1 1.77-.96 2.83 1.03.08 2.07-.5 2.7-1.28z" />
    </svg>
  );
}

export function AuthModal({ onClose, closable = true, initialResetData = null }) {
  const { login, register, forgotPassword, resetPassword, loginWithOAuthToken } = useAuth();

  // Mode: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'apple' | null
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Register Form State (One-step standard registration)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regCountryCode, setRegCountryCode] = useState('+91');
  const [regPhone, setRegPhone] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState(initialResetData?.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Handle password reset email link payload
  useEffect(() => {
    if (initialResetData && initialResetData.token) {
      setMode('forgot');
      setResetToken(initialResetData.token);
      setResetSent(true);
      if (initialResetData.email) {
        setForgotEmail(initialResetData.email);
      }
    }
  }, [initialResetData]);

  // Listen for OAuth completion from official popup window
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'AURATRADE_OAUTH_SUCCESS') {
        const { user, token, vaultToken, provider } = event.data;
        if (user && token) {
          loginWithOAuthToken(user, token, vaultToken);
          setSuccessMsg(`Welcome back, ${user.name || 'Trader'}! Authenticated with ${provider === 'apple' ? 'Apple ID' : 'Google'}.`);
          setTimeout(() => {
            if (onClose) onClose();
          }, 350);
        }
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [loginWithOAuthToken, onClose]);

  // Mode switcher helper
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    if (newMode === 'forgot' && signInEmail && signInEmail.includes('@')) {
      setForgotEmail(signInEmail.trim());
    }
  };

  // 1. Standard Sign In Handler
  const handleSignIn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const email = signInEmail.trim().toLowerCase();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, signInPassword);
      setSuccessMsg('Signed in successfully! Loading workstation...');
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    } catch (err) {
      if (err.userNotFound) {
        setError('No account found with this email. Please check your spelling or create an account.');
      } else {
        setError(err.message || 'Incorrect email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Standard Create Account Handler
  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const password = regPassword;

    if (!name || name.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const fullPhone = regPhone.trim() ? `${regCountryCode} ${regPhone.trim()}` : '';

    setLoading(true);
    try {
      await register(email, password, name, 1000, fullPhone);
      setSuccessMsg('Account created successfully! Loading workstation...');
      setTimeout(() => {
        if (onClose) onClose();
      }, 350);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password Request Handler
  const handleForgotPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(targetEmail);
      setResetSent(true);
      setSuccessMsg(`Recovery code sent to ${targetEmail}. Please check your inbox.`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password Confirmation Handler
  const handleResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetCode && !resetToken) {
      setError('Please enter the 6-digit verification code from your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(forgotEmail.trim().toLowerCase(), resetCode.trim() || null, newPassword, resetToken || null);
      setSuccessMsg('Password updated successfully! Logged in.');
      setTimeout(() => {
        if (onClose) onClose();
      }, 400);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Standard Social OAuth 2.0 Popup Window (Google & Apple)
  const startSocialOAuthPopup = (provider) => {
    setError('');
    setSuccessMsg('');
    setSocialLoading(provider);

    const width = 500;
    const height = 620;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

    const popupUrl = `/api/auth/oauth/popup?provider=${encodeURIComponent(provider)}&mode=${encodeURIComponent(mode)}&origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(
      popupUrl,
      `auratrade_oauth_${provider}`,
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=no,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setError(`Pop-up was blocked by your browser. Please allow pop-ups for AuraTrade to continue with ${provider === 'apple' ? 'Apple' : 'Google'}.`);
      setSocialLoading(null);
      return;
    }

    const checkPopupInterval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopupInterval);
          setSocialLoading(null);
        }
      } catch (e) {
        clearInterval(checkPopupInterval);
        setSocialLoading(null);
      }
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={closable ? onClose : undefined} id="auth-modal-overlay">
      <div
        className="modal-card auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '430px',
          width: '94vw',
          maxHeight: 'min(94vh, 700px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.18))',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box'
        }}
        id="auth-modal-dialog"
      >
        {/* Accent Top Border */}
        <div
          style={{
            height: '2px',
            width: '100%',
            background: 'var(--accent-primary, #2563eb)'
          }}
        />

        {/* Close Button */}
        {closable && (
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-secondary, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close"
            id="auth-close-btn"
          >
            <X size={15} />
          </button>
        )}

        {/* Header Branding */}
        <div
          style={{
            padding: '0.85rem 1.25rem 0.65rem',
            background: 'radial-gradient(ellipse 85% 65% at 50% 0%, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 85%)',
            borderBottom: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.12))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.25rem',
            position: 'relative',
            flexShrink: 0
          }}
        >
          <BrandLogo size="portal" layout="vertical" subtitle="Institutional Trading Portal" />
        </div>

        {/* Modal Content */}
        <div
          className="auth-modal-body"
          style={{
            padding: '0.85rem clamp(1rem, 3.5vw, 1.25rem) 0.95rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            boxSizing: 'border-box',
            overflowY: 'auto',
            flex: 1
          }}
        >

          {/* Subview Navigation Header (for Register mode) */}
          {mode === 'register' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.1rem' }}>
              <button
                type="button"
                onClick={() => handleSwitchMode('signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserPlus size={15} color="var(--accent-cyan, #06b6d4)" /> Create Account
              </span>
            </div>
          )}

          {/* Subview Navigation Header (for Forgot mode) */}
          {mode === 'forgot' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.1rem' }}>
              <button
                type="button"
                onClick={() => handleSwitchMode('signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={15} color="var(--accent-cyan, #06b6d4)" /> Reset Password
              </span>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '8px',
                fontSize: '0.78rem',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                borderRadius: '8px',
                fontSize: '0.78rem',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 1: SIGN IN FORM                                             */}
          {/* ================================================================= */}
          {mode === 'signin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Email Address */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.22rem', display: 'block' }}>
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={15} className="auth-input-icon" />
                    <input
                      type="email"
                      id="auth-signin-email"
                      name="email"
                      autoComplete="email"
                      required
                      className="auth-input-field"
                      placeholder="name@domain.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.22rem' }}>
                    <label className="input-label" style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-cyan, #06b6d4)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                      id="auth-forgot-password-link"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-input-icon" />
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      id="auth-signin-password"
                      name="password"
                      autoComplete="current-password"
                      required
                      className="auth-input-field"
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                      title={showSignInPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignInPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !signInEmail.trim() || !signInPassword.trim()}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginTop: '0.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                  id="auth-submit-signin-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={15} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Standard Divider */}
              <div className="auth-social-divider" role="separator" aria-label="Sign-in alternatives">
                <span className="auth-social-divider-line" />
                <span className="auth-social-divider-text">OR CONTINUE WITH</span>
                <span className="auth-social-divider-line" />
              </div>

              {/* Social Login Options */}
              <div className="auth-social-stack">
                <button
                  type="button"
                  className="auth-social-btn auth-social-btn--google"
                  id="auth-social-google-btn"
                  disabled={loading || !!socialLoading}
                  onClick={() => startSocialOAuthPopup('google')}
                  aria-label="Continue with Google"
                >
                  {socialLoading === 'google' ? (
                    <RefreshCw size={15} className="spin" />
                  ) : (
                    <GoogleSvg />
                  )}
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  className="auth-social-btn auth-social-btn--apple"
                  id="auth-social-apple-btn"
                  disabled={loading || !!socialLoading}
                  onClick={() => startSocialOAuthPopup('apple')}
                  aria-label="Continue with Apple"
                >
                  {socialLoading === 'apple' ? (
                    <RefreshCw size={15} className="spin" />
                  ) : (
                    <AppleSvg />
                  )}
                  <span>Continue with Apple</span>
                </button>
              </div>

              {/* Switch Prompt */}
              <div style={{ textAlign: 'center', marginTop: '0.15rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  id="auth-switch-to-register-btn"
                  onClick={() => handleSwitchMode('register')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-cyan, #06b6d4)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Create one now
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: CREATE ACCOUNT FORM (Standard 1-Step Registration)       */}
          {/* ================================================================= */}
          {mode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {/* Full Name */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.2rem', display: 'block' }}>
                    Full Name
                  </label>
                  <div className="auth-input-wrapper">
                    <User size={15} className="auth-input-icon" />
                    <input
                      type="text"
                      id="auth-register-name"
                      name="name"
                      autoComplete="name"
                      required
                      className="auth-input-field"
                      placeholder="Enter your full name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.2rem', display: 'block' }}>
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={15} className="auth-input-icon" />
                    <input
                      type="email"
                      id="auth-register-email"
                      name="email"
                      autoComplete="email"
                      required
                      className="auth-input-field"
                      placeholder="name@domain.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.2rem', display: 'block' }}>
                    Password (min. 6 characters)
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-input-icon" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="auth-register-password"
                      name="new-password"
                      autoComplete="new-password"
                      required
                      className="auth-input-field"
                      placeholder="Create a secure password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                      title={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Mobile Number (Optional) */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.2rem', display: 'block' }}>
                    Mobile Number <span style={{ color: 'var(--text-muted, #64748b)' }}>(Optional)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <select
                      value={regCountryCode}
                      onChange={(e) => setRegCountryCode(e.target.value)}
                      style={{
                        width: '85px',
                        background: 'var(--bg-input, #090e1b)',
                        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                        borderRadius: 'var(--radius-md, 8px)',
                        color: 'var(--text-primary, #ffffff)',
                        fontSize: '0.82rem',
                        padding: '0.55rem 0.4rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="auth-input-wrapper" style={{ flex: 1 }}>
                      <Smartphone size={15} className="auth-input-icon" />
                      <input
                        type="tel"
                        id="auth-register-phone"
                        name="tel"
                        autoComplete="tel"
                        className="auth-input-field"
                        placeholder="Mobile number"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !regName.trim() || !regEmail.trim() || !regPassword.trim()}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginTop: '0.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                  id="auth-submit-register-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Standard Divider */}
              <div className="auth-social-divider" role="separator" aria-label="Registration alternatives">
                <span className="auth-social-divider-line" />
                <span className="auth-social-divider-text">OR SIGN UP WITH</span>
                <span className="auth-social-divider-line" />
              </div>

              {/* Social Registration Options (Side-by-side to prevent overflow) */}
              <div className="auth-social-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="auth-social-btn auth-social-btn--google"
                  id="auth-social-google-reg-btn"
                  disabled={loading || !!socialLoading}
                  onClick={() => startSocialOAuthPopup('google')}
                  aria-label="Continue with Google"
                  style={{ height: '38px', fontSize: '0.82rem', padding: '0 0.5rem', gap: '0.45rem' }}
                >
                  {socialLoading === 'google' ? (
                    <RefreshCw size={14} className="spin" />
                  ) : (
                    <GoogleSvg />
                  )}
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  className="auth-social-btn auth-social-btn--apple"
                  id="auth-social-apple-reg-btn"
                  disabled={loading || !!socialLoading}
                  onClick={() => startSocialOAuthPopup('apple')}
                  aria-label="Continue with Apple"
                  style={{ height: '38px', fontSize: '0.82rem', padding: '0 0.5rem', gap: '0.45rem' }}
                >
                  {socialLoading === 'apple' ? (
                    <RefreshCw size={14} className="spin" />
                  ) : (
                    <AppleSvg />
                  )}
                  <span>Apple</span>
                </button>
              </div>

              {/* Switch Prompt */}
              <div style={{ textAlign: 'center', marginTop: '0.15rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  id="auth-switch-to-signin-btn"
                  onClick={() => handleSwitchMode('signin')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-cyan, #06b6d4)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 3: FORGOT / RESET PASSWORD                                  */}
          {/* ================================================================= */}
          {mode === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {!resetSent ? (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: 0 }}>
                    Enter your registered email address and we'll send a 6-digit verification code to reset your password.
                  </p>

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.35rem', display: 'block' }}>
                      Registered Email
                    </label>
                    <div className="auth-input-wrapper">
                      <Mail size={15} className="auth-input-icon" />
                      <input
                        type="email"
                        id="auth-forgot-email"
                        required
                        className="auth-input-field"
                        placeholder="name@domain.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !forgotEmail.trim()}
                    style={{
                      width: '100%',
                      padding: '0.72rem',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                    id="auth-send-forgot-btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        <span>Send Recovery Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: 0 }}>
                    Enter the code sent to <strong style={{ color: 'var(--text-primary, #fff)' }}>{forgotEmail}</strong> and choose a new password.
                  </p>

                  {/* 6-Digit Code */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.35rem', display: 'block' }}>
                      6-Digit Code
                    </label>
                    <div className="auth-input-wrapper">
                      <KeyRound size={15} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        className="auth-input-field"
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', fontSize: '1rem', fontWeight: 700 }}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.35rem', display: 'block' }}>
                      New Password
                    </label>
                    <div className="auth-input-wrapper">
                      <Lock size={15} className="auth-input-icon" />
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        className="auth-input-field"
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted, #64748b)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                      >
                        {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.35rem', display: 'block' }}>
                      Confirm Password
                    </label>
                    <div className="auth-input-wrapper">
                      <Lock size={15} className="auth-input-icon" />
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        className="auth-input-field"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !newPassword || !confirmPassword}
                    style={{
                      width: '100%',
                      padding: '0.72rem',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                    id="auth-submit-reset-btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} />
                        <span>Update Password & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Virtual Balance Notice Footer */}
          <div style={{ textAlign: 'center', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.1))', flexShrink: 0 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.4 }}>
              Virtual balance $1,000 credited on registration.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
