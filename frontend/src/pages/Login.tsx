import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { frontendEnv } from '../lib/env.js';
import { sendOtpViaEmailJS } from '../lib/emailjs.js';
import {
  AlertCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  User,
  Phone,
  Building2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Mode: 'otp' (Fast Email OTP), 'login' (Password), 'register' (New account with password)
  const [authMode, setAuthMode] = useState<'otp' | 'login' | 'register'>('otp');
  const [selectedRole, setSelectedRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');

  // OTP Specific Fields
  const [otpStep, setOtpStep] = useState<'input_email' | 'verify_otp'>('input_email');
  const [otp, setOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [devOtpHelper, setDevOtpHelper] = useState<string | null>(null);

  // Google Login State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoBox, setShowDemoBox] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Google Identity Services (GIS) Initialization
  useEffect(() => {
    const googleClientId = frontendEnv.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) return;
    setLoading(true);
    setError(null);
    try {
      const res = await client.post('/auth/google', {
        credential: response.credential,
      });
      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Trigger
  const handleGoogleSignInClick = () => {
    setError(null);
    const googleClientId = frontendEnv.VITE_GOOGLE_CLIENT_ID;

    if (googleClientId && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt blocked or unsupported, open modal
          setShowGoogleModal(true);
        }
      });
    } else {
      // Immediate seamless Google Account Chooser
      setShowGoogleModal(true);
    }
  };

  const handleExecuteGoogleLogin = async (chosenEmail: string, chosenName: string) => {
    setShowGoogleModal(false);
    setError(null);
    setLoading(true);

    try {
      const res = await client.post('/auth/google', {
        email: chosenEmail.trim().toLowerCase(),
        name: chosenName.trim(),
      });
      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick login helper (for demo buttons)
  const handleLoginWith = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await client.post('/auth/login', {
        email: loginEmail.trim().toLowerCase(),
        password: loginPass.trim(),
      });
      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please check your connection.'
          : 'Sign In failed. Please check your email and password.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP: Send Code Handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address to receive your OTP.');
      return;
    }

    setError(null);
    setLoading(true);
    setOtpSuccessMessage(null);
    setDevOtpHelper(null);

    try {
      const res = await client.post('/auth/otp/send', { email: cleanEmail });
      const data = res.data.data;

      // Also trigger EmailJS from browser if frontend keys configured
      if (frontendEnv.VITE_EMAILJS_SERVICE_ID && frontendEnv.VITE_EMAILJS_TEMPLATE_ID && data.devPreviewOtp) {
        sendOtpViaEmailJS({
          toEmail: cleanEmail,
          otp: data.devPreviewOtp,
          serviceId: frontendEnv.VITE_EMAILJS_SERVICE_ID,
          templateId: frontendEnv.VITE_EMAILJS_TEMPLATE_ID,
          publicKey: frontendEnv.VITE_EMAILJS_PUBLIC_KEY,
        });
      }

      setOtpStep('verify_otp');
      setOtpCountdown(45);
      setOtpSuccessMessage(`Verification code sent to ${cleanEmail}`);
      if (data.devPreviewOtp) {
        setDevOtpHelper(data.devPreviewOtp);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please check your connection.'
          : 'Could not send verification code. Please check your email.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP: Verify Code Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await client.post('/auth/otp/verify', {
        email: cleanEmail,
        otp: cleanOtp,
        role: selectedRole,
        name: name.trim() || undefined,
      });

      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Invalid or expired verification code. Please request a new one.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Standard Password Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }
    handleLoginWith(email, password);
  };

  // New User Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/auth/register-user', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: selectedRole,
        phone: phone.trim() || undefined,
        organizationName: selectedRole === 'RECRUITER' ? companyName.trim() || undefined : undefined,
      });

      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please try again.'
          : 'Registration failed. Please verify your details.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-7 sm:p-8 shadow-sm border border-[#edf2f7]">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#84b81b] text-white shadow-sm font-black text-xl">
            H
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0e1017]">
            HireFlow <span className="text-[#84b81b]">AI</span>
          </h2>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Intelligent ATS, recruitment management & HR offer automation
          </p>
        </div>

        {/* Continue with Google Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#e2e8f0] bg-white py-2.5 px-4 text-xs font-bold text-[#0e1017] shadow-xs hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#edf2f7]" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider text-[#8b98a9]">
              <span className="bg-white px-2">or sign in with email</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Email OTP vs Password Sign In vs Create Account */}
        <div className="flex rounded-2xl bg-[#f4f6f8] p-1 border border-[#edf2f7]">
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              authMode === 'otp'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              authMode === 'login'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              authMode === 'register'
                ? 'bg-[#84b81b] text-white shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {otpSuccessMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-[#edf7d2] p-3 text-xs text-[#567715] border border-[#d6ec9d]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#84b81b]" />
            <span>{otpSuccessMessage}</span>
          </div>
        )}

        {/* Developer Sandbox/Testing OTP Helper */}
        {devOtpHelper && (
          <div className="rounded-2xl bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
            <span>
              🔑 <strong>EmailJS / Sandbox Code:</strong> <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{devOtpHelper}</code>
            </span>
            <button
              type="button"
              onClick={() => setOtp(devOtpHelper)}
              className="text-[10px] font-bold text-amber-900 bg-white border border-amber-300 px-2 py-0.5 rounded-lg hover:bg-amber-100"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* -------------------- 1. EMAIL OTP SIGN IN / SIGN UP -------------------- */}
        {authMode === 'otp' && (
          <div>
            {otpStep === 'input_email' ? (
              <form className="space-y-4" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                    Your Email Address
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#8b98a9]">
                    We will send a 6-digit verification code directly to this email via EmailJS.
                  </p>
                </div>

                {/* Role selection if new user */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5e6b7c] mb-1.5">
                    Account Type (If new user):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('CANDIDATE')}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold border transition-all ${
                        selectedRole === 'CANDIDATE'
                          ? 'border-[#84b81b] bg-[#edf7d2] text-[#567715] shadow-xs'
                          : 'border-[#edf2f7] bg-white text-[#5e6b7c] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Candidate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('RECRUITER')}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold border transition-all ${
                        selectedRole === 'RECRUITER'
                          ? 'border-[#84b81b] bg-[#edf7d2] text-[#567715] shadow-xs'
                          : 'border-[#edf2f7] bg-white text-[#5e6b7c] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Recruiter / HR</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending OTP Code...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Get Verification OTP</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div className="rounded-2xl bg-[#f8fafc] p-3 border border-[#edf2f7]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#5e6b7c]">Code sent to:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('input_email');
                        setOtp('');
                        setError(null);
                      }}
                      className="text-[11px] font-bold text-[#84b81b] hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="text-xs font-bold text-[#0e1017] mt-0.5">{email}</div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                    Enter 6-Digit Code
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="block w-full text-center tracking-[0.5em] text-lg font-mono font-black rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2.5 text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying & Signing In...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>

                <div className="text-center text-xs">
                  {otpCountdown > 0 ? (
                    <span className="text-[#8b98a9]">
                      Resend code in <strong className="text-[#0e1017]">{otpCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="inline-flex items-center gap-1 font-bold text-[#84b81b] hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* -------------------- 2. PASSWORD SIGN IN FORM -------------------- */}
        {authMode === 'login' && (
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Email Address</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Password</label>
              </div>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2.5 pl-9 pr-10 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8b98a9] hover:text-[#0e1017]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In with Password'}
            </button>

            <div className="text-center text-xs text-[#5e6b7c]">
              Prefer passwordless?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setError(null);
                }}
                className="font-bold text-[#84b81b] hover:underline"
              >
                Sign in with Email OTP
              </button>
            </div>
          </form>
        )}

        {/* -------------------- 3. REGISTER / SIGN UP FORM -------------------- */}
        {authMode === 'register' && (
          <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c] mb-1.5">
                I am signing up as:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('CANDIDATE')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold border transition-all ${
                    selectedRole === 'CANDIDATE'
                      ? 'border-[#84b81b] bg-[#edf7d2] text-[#567715] shadow-xs'
                      : 'border-[#edf2f7] bg-white text-[#5e6b7c] hover:bg-[#f8fafc]'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Candidate / Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('RECRUITER')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold border transition-all ${
                    selectedRole === 'RECRUITER'
                      ? 'border-[#84b81b] bg-[#edf7d2] text-[#567715] shadow-xs'
                      : 'border-[#edf2f7] bg-white text-[#5e6b7c] hover:bg-[#f8fafc]'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Recruiter / HR</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Full Name</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selectedRole === 'CANDIDATE' ? 'e.g. Rahul Sharma' : 'e.g. Priya Nair'}
                  className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Email Address</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Company Name (Only if Recruiter) */}
            {selectedRole === 'RECRUITER' && (
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Company / Organization</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Tech Innovations"
                    className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Set Password</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2 pl-9 pr-10 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8b98a9] hover:text-[#0e1017]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account & Get Started'}
            </button>

            <div className="text-center text-xs text-[#5e6b7c]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className="font-bold text-[#84b81b] hover:underline"
              >
                Sign in with existing credentials
              </button>
            </div>
          </form>
        )}

        {/* Optional Collapsible Demo Shortcuts for quick testing */}
        <div className="pt-2 border-t border-[#edf2f7]">
          <button
            type="button"
            onClick={() => setShowDemoBox(!showDemoBox)}
            className="flex w-full items-center justify-between text-[11px] font-bold text-[#5e6b7c] hover:text-[#0e1017] transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#84b81b]" />
              <span>1-Click Demo Accounts (For Instant Testing)</span>
            </span>
            {showDemoBox ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showDemoBox && (
            <div className="mt-2.5 rounded-2xl bg-[#edf7d2]/60 p-3 border border-[#edf7d2] text-xs space-y-1.5 animate-fadeIn">
              <p className="text-[10px] text-[#567715] font-semibold">
                Click any profile below to auto-fill and test immediately:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleLoginWith('agraharinikhil999@gmail.com', 'admin123');
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-white px-2 py-1.5 font-bold text-[#0e1017] shadow-xs border border-[#edf2f7] hover:bg-[#84b81b] hover:text-white transition-all text-[10px]"
                >
                  <CheckCircle2 className="h-3 w-3 text-[#84b81b]" />
                  <span>Admin Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLoginWith('admin@techscale.io', 'admin123');
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-white px-2 py-1.5 font-bold text-[#0e1017] shadow-xs border border-[#edf2f7] hover:bg-[#84b81b] hover:text-white transition-all text-[10px]"
                >
                  <CheckCircle2 className="h-3 w-3 text-[#84b81b]" />
                  <span>Recruiter Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLoginWith('neha.patel@example.com', 'admin123');
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#0e1017] px-2 py-1.5 font-bold text-white shadow-xs border border-[#0e1017] hover:bg-[#84b81b] transition-all text-[10px]"
                >
                  <CheckCircle2 className="h-3 w-3 text-[#84b81b]" />
                  <span>Candidate Demo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Public Careers Board Link */}
        <div className="pt-2 text-center">
          <Link
            to="/careers"
            className="inline-flex items-center gap-1.5 font-bold text-[#0e1017] hover:text-[#84b81b] transition-colors py-2 px-4 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-xs shadow-2xs"
          >
            <Briefcase className="h-3.5 w-3.5 text-[#84b81b]" />
            <span>Looking for Jobs or Internships? Explore Openings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Google Account Selector Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <h3 className="text-sm font-bold text-gray-900">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Choose an active Google account to continue to <strong>HireFlow AI</strong>:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleExecuteGoogleLogin('agraharinikhil999@gmail.com', 'Nikhil Agrahari')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  N
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-gray-900">Nikhil Agrahari</div>
                  <div className="text-[11px] text-gray-500 truncate">agraharinikhil999@gmail.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteGoogleLogin('google_candidate@example.com', 'Candidate Seeker')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  C
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-gray-900">Candidate Seeker</div>
                  <div className="text-[11px] text-gray-500 truncate">google_candidate@example.com</div>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Or use any custom Google Email:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="your.google@gmail.com"
                  className="flex-1 text-xs border rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#84b81b]"
                />
                <button
                  type="button"
                  disabled={!googleCustomEmail.includes('@')}
                  onClick={() =>
                    handleExecuteGoogleLogin(
                      googleCustomEmail,
                      googleCustomEmail.split('@')[0]
                    )
                  }
                  className="bg-[#0e1017] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#84b81b] transition-colors disabled:opacity-40"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Login;
