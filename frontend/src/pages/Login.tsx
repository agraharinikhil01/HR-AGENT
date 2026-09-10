import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { AlertCircle, Lock, Mail, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

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
          ? 'Cannot reach backend server. Please check your internet connection.'
          : 'Login failed. Please check your credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginWith(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-sm border border-[#edf2f7]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#84b81b] text-white shadow-sm font-black text-xl">
            H
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#0e1017]">
            HireFlow <span className="text-[#84b81b]">AI</span>
          </h2>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Intelligent ATS, recruitment management & HR offer automation
          </p>
        </div>

        {/* 1-Click Fast Login Shortcuts */}
        <div className="rounded-2xl bg-[#edf7d2]/60 p-3.5 border border-[#edf7d2] text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#567715] text-[11px] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-[#84b81b]" />
            <span>1-Click Quick Login</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('agraharinikhil999@gmail.com');
                setPassword('admin123');
                handleLoginWith('agraharinikhil999@gmail.com', 'admin123');
              }}
              className="flex items-center justify-center gap-1 rounded-xl bg-white px-2.5 py-1.5 font-bold text-[#0e1017] shadow-xs border border-[#edf2f7] hover:bg-[#84b81b] hover:text-white transition-all text-[11px]"
            >
              <CheckCircle2 className="h-3 w-3 text-[#84b81b]" />
              <span>Nikhil (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@techscale.io');
                setPassword('admin123');
                handleLoginWith('admin@techscale.io', 'admin123');
              }}
              className="flex items-center justify-center gap-1 rounded-xl bg-white px-2.5 py-1.5 font-bold text-[#0e1017] shadow-xs border border-[#edf2f7] hover:bg-[#84b81b] hover:text-white transition-all text-[11px]"
            >
              <CheckCircle2 className="h-3 w-3 text-[#84b81b]" />
              <span>Demo TechScale</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
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
                placeholder="agraharinikhil999@gmail.com"
                className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Password</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b98a9]">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
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
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="text-center text-xs text-[#5e6b7c]">
          Need a workspace for your company?{' '}
          <Link to="/register" className="font-bold text-[#84b81b] hover:underline">
            Register Organization
          </Link>
        </div>
      </div>
    </div>
  );
};
