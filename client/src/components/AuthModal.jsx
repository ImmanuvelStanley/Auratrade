import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  LogIn,
  UserPlus,
  Smartphone,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck
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

export function AuthModal({ onClose, closable = true, initialResetData = null }) {
  const { sendOtp, verifyOtp, login, register, forgotPassword, resetPassword, verifyResetToken } = useAuth();

  // Mode: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState('signin');
  // Step: 1 = Details / Form, 2 = 6-digit OTP verification
  const [step, setStep] = useState(1);
  // Purpose for OTP step: 'register' | 'login' | 'reset'
  const [otpPurpose, setOtpPurpose] = useState('register');
  const [resetToken, setResetToken] = useState(initialResetData?.token || '');

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  // Register State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // OTP Verification State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [maskedDestination, setMaskedDestination] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [otpToken, setOtpToken] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const digitInputRefs = useRef([]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Handle initialResetData (e.g. from password reset link in email)
  useEffect(() => {
    if (initialResetData && initialResetData.token) {
      setMode('forgot');
      setStep(2);
      setOtpPurpose('reset');
      setResetToken(initialResetData.token);
      if (initialResetData.email) {
        setForgotEmail(initialResetData.email);
        setMaskedDestination(initialResetData.email);
      }
    }
  }, [initialResetData]);

  // Focus first OTP digit box when advancing to step 2
  useEffect(() => {
    if (step === 2 && !resetToken) {
      setTimeout(() => {
        if (digitInputRefs.current[0]) {
          digitInputRefs.current[0].focus();
        }
      }, 80);
    }
  }, [step, resetToken]);

  const getFullPhone = () => {
    if (!phoneNumber || !phoneNumber.trim()) return '';
    return `${phoneCountryCode} ${phoneNumber.trim()}`;
  };

  // Switch between main modes
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setStep(1);
    setError('');
    setSuccessMsg('');
    setUserNotFound(false);
    if (newMode === 'forgot' && signInIdentifier.includes('@')) {
      setForgotEmail(signInIdentifier.trim());
    }
  };

  // 1. Password Sign In
  const handlePasswordSignIn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUserNotFound(false);

    const identifier = signInIdentifier.trim();
    if (!identifier) {
      setError('Please enter your registered email address or mobile number.');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, signInPassword);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
      if (err.userNotFound) {
        setUserNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP for Passwordless Sign In
  const handleRequestSignInOtp = async () => {
    setError('');
    setSuccessMsg('');
    setUserNotFound(false);

    const identifier = signInIdentifier.trim();
    if (!identifier) {
      setError('Please enter your registered email address first.');
      return;
    }
    if (!identifier.includes('@')) {
      setError('OTP sign-in currently requires your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const resp = await sendOtp({
        identifier,
        channel: 'email',
        purpose: 'login',
        email: identifier
      });

      if (resp.otpToken) setOtpToken(resp.otpToken);
      setOtpPurpose('login');
      setMaskedDestination(resp.maskedDestination || identifier);
      setDeliveryInfo(resp.deliveryStatus || {});
      setCooldown(resp.resendCooldown || 30);
      setOtpDigits(['', '', '', '', '', '']);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
      if (err.userNotFound) {
        setUserNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3a. Direct Account Creation (Recommended: instant creation & auto-login)
  const handleRegisterDirect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetEmail = email.trim();
    if (!name.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!registerPassword || registerPassword.length < 8) {
      setError('Please create a secure password with at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(targetEmail, registerPassword, name.trim(), 1000, getFullPhone());
      setSuccessMsg('Account created successfully! Loading your trading dashboard...');
      setTimeout(() => {
        if (onClose) onClose();
      }, 400);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // 3b. Register: Send OTP to verify and create account
  const handleRegisterSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetEmail = email.trim();
    if (!name.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!registerPassword || registerPassword.length < 8) {
      setError('Please create a secure password with at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const resp = await sendOtp({
        identifier: targetEmail,
        channel: 'email',
        purpose: 'register',
        name: name.trim(),
        email: targetEmail,
        phone: getFullPhone(),
        password: registerPassword
      });

      if (resp.otpToken) setOtpToken(resp.otpToken);
      setOtpPurpose('register');
      setMaskedDestination(resp.maskedDestination || targetEmail);
      setDeliveryInfo(resp.deliveryStatus || {});
      setCooldown(resp.resendCooldown || 30);
      setOtpDigits(['', '', '', '', '', '']);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password: Send Reset Code
  const handleForgotSendCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetEmail = forgotEmail.trim();
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const resp = await forgotPassword(targetEmail);
      if (resp.otpToken) setOtpToken(resp.otpToken);
      setOtpPurpose('reset');
      setMaskedDestination(resp.maskedDestination || targetEmail);
      setDeliveryInfo(resp.deliveryStatus || {});
      setCooldown(resp.resendCooldown || 30);
      setOtpDigits(['', '', '', '', '', '']);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      if (otpPurpose === 'register') {
        const resp = await sendOtp({
          identifier: email.trim(),
          channel: 'email',
          purpose: 'register',
          name: name.trim(),
          email: email.trim(),
          phone: getFullPhone(),
          password: registerPassword
        });
        if (resp.otpToken) setOtpToken(resp.otpToken);
        setMaskedDestination(resp.maskedDestination || email.trim());
        setDeliveryInfo(resp.deliveryStatus || {});
        setCooldown(resp.resendCooldown || 30);
        setOtpDigits(['', '', '', '', '', '']);
      } else if (otpPurpose === 'login') {
        const resp = await sendOtp({
          identifier: signInIdentifier.trim(),
          channel: 'email',
          purpose: 'login',
          email: signInIdentifier.trim()
        });
        if (resp.otpToken) setOtpToken(resp.otpToken);
        setMaskedDestination(resp.maskedDestination || signInIdentifier.trim());
        setDeliveryInfo(resp.deliveryStatus || {});
        setCooldown(resp.resendCooldown || 30);
        setOtpDigits(['', '', '', '', '', '']);
      } else if (otpPurpose === 'reset') {
        const resp = await forgotPassword(forgotEmail.trim());
        if (resp.otpToken) setOtpToken(resp.otpToken);
        setMaskedDestination(resp.maskedDestination || forgotEmail.trim());
        setDeliveryInfo(resp.deliveryStatus || {});
        setCooldown(resp.resendCooldown || 30);
        setOtpDigits(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 6-Digit PIN input
  const handleDigitChange = (index, value) => {
    const numeric = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!numeric) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (numeric.length > 1) {
      const pasted = numeric.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      if (digitInputRefs.current[nextIdx]) {
        digitInputRefs.current[nextIdx].focus();
      }
      return;
    }

    newDigits[index] = numeric.slice(-1);
    setOtpDigits(newDigits);

    if (index < 5 && numeric) {
      if (digitInputRefs.current[index + 1]) {
        digitInputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      if (digitInputRefs.current[index - 1]) {
        digitInputRefs.current[index - 1].focus();
      }
    }
  };

  // Step 2: Verification Submit
  const handleVerifySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const fullCode = otpDigits.join('');

    // If resetting via email link with verified resetToken, 6-digit code is optional
    if (otpPurpose !== 'reset' || !resetToken) {
      if (fullCode.length !== 6) {
        setError('Please enter the complete 6-digit code.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      if (otpPurpose === 'register') {
        await verifyOtp({
          identifier: email.trim(),
          code: fullCode,
          otpToken,
          name: name.trim(),
          phone: getFullPhone()
        });
        setSuccessMsg('Account verified & created successfully! Welcome to AuraTrade.');
        setTimeout(() => {
          if (onClose) onClose();
        }, 500);
      } else if (otpPurpose === 'login') {
        await verifyOtp({
          identifier: signInIdentifier.trim(),
          code: fullCode,
          otpToken
        });
        if (onClose) onClose();
      } else if (otpPurpose === 'reset') {
        if (!resetNewPassword || resetNewPassword.length < 8) {
          setError('New password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        if (resetNewPassword !== resetConfirmPassword) {
          setError('New passwords do not match. Please re-check.');
          setLoading(false);
          return;
        }

        // Reset password via API (supports token from link OR 6-digit code)
        await resetPassword(forgotEmail.trim(), fullCode || null, resetNewPassword, resetToken || null);
        setSuccessMsg('Password reset successfully! Logged in.');

        // Clean query params from URL
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setTimeout(() => {
          if (onClose) onClose();
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closable ? onClose : undefined} id="auth-modal-overlay">
      <div
        className="modal-card auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '435px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          position: 'relative'
        }}
        id="auth-modal-dialog"
      >
        {/* Top Glowing Brand Accent Stripe */}
        <div
          style={{
            height: '3.5px',
            width: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #6366f1 100%)'
          }}
        />

        {/* Floating Close Button */}
        {closable && (
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
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

        {/* Hero Brand Header Area */}
        <div
          style={{
            padding: '1.45rem 1.4rem 1.15rem',
            background: 'radial-gradient(ellipse 85% 65% at 50% 0%, rgba(16, 185, 129, 0.13) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 85%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.45rem',
            position: 'relative'
          }}
        >
          <BrandLogo size="portal" layout="vertical" subtitle="Institutional Trading Portal" />
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.15rem clamp(0.85rem, 3vw, 1.4rem) 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.95rem', boxSizing: 'border-box' }}>
          
          {/* Step 1: Input Credentials / Selection */}
          {step === 1 && (
            <>
              {/* Segmented Mode Switcher (Visible when not in forgot password mode) */}
              {mode !== 'forgot' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    background: 'var(--bg-card-hover)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <button
                    type="button"
                    id="auth-tab-signin"
                    onClick={() => handleSwitchMode('signin')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: mode === 'signin' ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      boxShadow: mode === 'signin' ? '0 2px 8px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <LogIn size={14} color={mode === 'signin' ? 'var(--accent-cyan)' : 'currentColor'} />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    id="auth-tab-register"
                    onClick={() => handleSwitchMode('register')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: mode === 'register' ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <UserPlus size={14} color={mode === 'register' ? 'var(--accent-cyan)' : 'currentColor'} />
                    <span>Create Account</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signin')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: 0
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KeyRound size={14} color="var(--accent-cyan)" /> Reset Password
                  </span>
                </div>
              )}

              {/* Dynamic Subtitle */}
              <div style={{ textAlign: 'center', marginTop: '-0.2rem', marginBottom: '0.1rem' }}>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {mode === 'signin' && 'Sign in to access your trading workstation & sandbox portfolio'}
                  {mode === 'register' && 'Open a zero-commission institutional sandbox account'}
                  {mode === 'forgot' && 'Enter your registered email to receive a secure 6-digit reset code'}
                </p>
              </div>

              {/* Error Message Banner */}
              {error && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    lineHeight: 1.4
                  }}
                >
                  {error}
                </div>
              )}

              {/* Success Message Banner */}
              {successMsg && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    lineHeight: 1.4
                  }}
                >
                  {successMsg}
                </div>
              )}

              {/* MODE 1: SIGN IN FORM */}
              {mode === 'signin' && (
                <form onSubmit={handlePasswordSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Email Address or Mobile Number
                    </label>
                    <div className="auth-input-wrapper">
                      {signInIdentifier.replace(/\s+/g, '').match(/^\+?\d+$/) ? (
                        <Smartphone size={15} className="auth-input-icon" />
                      ) : (
                        <Mail size={15} className="auth-input-icon" />
                      )}
                      <input
                        type="text"
                        required
                        className="auth-input-field"
                        placeholder="e.g. name@domain.com"
                        value={signInIdentifier}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                        id="auth-identifier-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('forgot')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#06b6d4',
                          fontSize: '0.72rem',
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
                        required
                        className="auth-input-field"
                        placeholder="Enter account password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        style={{ paddingRight: '2.5rem' }}
                        id="auth-password-input"
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
                          color: 'var(--text-muted)',
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

                  {userNotFound && (
                    <div style={{ textAlign: 'center', marginTop: '-0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                          setUserNotFound(false);
                          if (signInIdentifier.includes('@')) {
                            setEmail(signInIdentifier);
                          } else {
                            setPhoneNumber(signInIdentifier.replace(/\D/g, ''));
                          }
                        }}
                        style={{
                          background: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          color: '#06b6d4',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <UserPlus size={13} />
                        <span>New trader? Switch to Create Account</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !signInIdentifier.trim()}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                    id="auth-submit-direct-login-btn"
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

                  {/* Or Sign In with OTP */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                    <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      or passwordless
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestSignInOtp}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease'
                    }}
                    id="auth-otp-signin-btn"
                  >
                    <Mail size={14} color="var(--accent-cyan)" />
                    <span>Sign in with 6-Digit Email OTP</span>
                  </button>
                </form>
              )}

              {/* MODE 2: CREATE ACCOUNT FORM */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Full Name */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Full Name</label>
                    <div className="auth-input-wrapper">
                      <User size={15} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        className="auth-input-field"
                        placeholder="e.g. Alex Mercer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        id="auth-name-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Email Address</label>
                      <span style={{ fontSize: '0.68rem', color: '#06b6d4', fontWeight: 600 }}>Receives Verification OTP</span>
                    </div>
                    <div className="auth-input-wrapper">
                      <Mail size={15} className="auth-input-icon" />
                      <input
                        type="email"
                        required
                        className="auth-input-field"
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        id="auth-email-input"
                      />
                    </div>
                  </div>

                  {/* Account Password */}
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Create Password</label>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Min. 8 characters</span>
                    </div>
                    <div className="auth-input-wrapper">
                      <Lock size={15} className="auth-input-icon" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        className="auth-input-field"
                        placeholder="At least 8 characters"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        style={{ paddingRight: '2.5rem' }}
                        id="auth-register-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                        title={showRegisterPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mobile Number</label>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Optional contact</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          padding: '0 0.5rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                          minWidth: '85px'
                        }}
                        id="auth-country-code-select"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                            {c.code} ({c.country})
                          </option>
                        ))}
                      </select>

                      <div className="auth-input-wrapper" style={{ flex: 1, minWidth: 0 }}>
                        <Phone size={15} className="auth-input-icon" />
                        <input
                          type="tel"
                          className="auth-input-field"
                          placeholder="Phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          id="auth-phone-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary: Send OTP to Email */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginTop: '0.2rem',
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
                        <span>Sending OTP to your Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        <span>Send 6-Digit Email OTP & Create Account</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  {/* Secondary: Instant Demo Sandbox Access */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.1rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                    <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      or fast track
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegisterDirect}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease'
                    }}
                    id="auth-instant-register-btn"
                  >
                    <UserPlus size={13} color="var(--accent-cyan)" />
                    <span>Instant Sandbox Registration (Skip Email OTP)</span>
                  </button>
                </form>
              )}

              {/* MODE 3: FORGOT PASSWORD REQUEST FORM */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Registered Email Address
                    </label>
                    <div className="auth-input-wrapper">
                      <Mail size={15} className="auth-input-icon" />
                      <input
                        type="email"
                        required
                        className="auth-input-field"
                        placeholder="name@domain.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        id="auth-forgot-email-input"
                        autoFocus
                      />
                    </div>
                    <p style={{ fontSize: '0.71rem', color: '#64748b', margin: '4px 0 0 2px' }}>
                      A single-use 6-digit verification code will be dispatched to this email address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !forgotEmail.trim()}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                    id="auth-forgot-submit-btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Sending Reset Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Reset Code</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Step 2: OTP Verification & Final Entry */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0,
                  alignSelf: 'flex-start'
                }}
                id="auth-back-to-step1-btn"
              >
                <ArrowLeft size={13} />
                <span>Change destination</span>
              </button>

              {/* Delivery Status Info */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Mail size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{maskedDestination}</strong>
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '0.73rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  ✉️ Please check your email inbox (and spam or junk folder) for your 6-digit verification code.
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    lineHeight: 1.4
                  }}
                >
                  {error}
                </div>
              )}

              {/* Form for OTP input and (if reset) New Password */}
              <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {resetToken ? (
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    color: '#34d399',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}>
                    <CheckCircle2 size={16} />
                    <span>Security link verified for <strong>{forgotEmail}</strong>. Enter your new password below:</span>
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      Enter 6-Digit Code
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (digitInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          id={`otp-box-${idx}`}
                          style={{
                            width: '100%',
                            height: '46px',
                            textAlign: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            borderRadius: '8px',
                            border: digit ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                            background: digit ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Fields if Resetting Password */}
                {otpPurpose === 'reset' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        New Password (min 8 characters)
                      </label>
                      <div className="auth-input-wrapper">
                        <Lock size={15} className="auth-input-icon" />
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          className="auth-input-field"
                          placeholder="Enter new password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          style={{ paddingRight: '2.5rem' }}
                          id="auth-reset-password-input"
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
                            color: 'var(--text-muted)',
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

                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Confirm New Password
                      </label>
                      <div className="auth-input-wrapper">
                        <ShieldCheck size={15} className="auth-input-icon" />
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          className="auth-input-field"
                          placeholder="Re-enter new password"
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          id="auth-reset-confirm-password-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Resend Cooldown */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ color: '#64748b' }}>Didn't receive code?</span>
                  {cooldown > 0 ? (
                    <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#06b6d4',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                      id="resend-otp-btn"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || (!resetToken && otpDigits.join('').length !== 6)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                  id="auth-verify-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>{otpPurpose === 'reset' ? 'Saving Password...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>
                        {otpPurpose === 'reset'
                          ? 'Save New Password & Enter'
                          : otpPurpose === 'login'
                          ? 'Verify & Sign In'
                          : 'Verify & Complete Registration'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
