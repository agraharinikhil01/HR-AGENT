import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await client.post('/auth/login', { email, password });
      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
                placeholder="recruiter@techscale.io"
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
              />
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
