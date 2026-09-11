import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
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
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Mode: 'login' (returning users) or 'register' (new users)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoBox, setShowDemoBox] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  // Quick login helper
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

  // Standard Login Submit
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

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex rounded-2xl bg-[#f4f6f8] p-1 border border-[#edf2f7]">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              authMode === 'login'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              authMode === 'register'
                ? 'bg-[#84b81b] text-white shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* -------------------- SIGN IN FORM -------------------- */}
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
              {loading ? 'Signing In...' : 'Sign In to Workspace'}
            </button>

            <div className="text-center text-xs text-[#5e6b7c]">
              First time visiting?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                className="font-bold text-[#84b81b] hover:underline"
              >
                Register a new account
              </button>
            </div>
          </form>
        )}

        {/* -------------------- REGISTER / SIGN UP FORM -------------------- */}
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
    </div>
  );
};
