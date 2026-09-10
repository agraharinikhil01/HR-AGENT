import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { Building2, AlertCircle } from 'lucide-react';

export const RegisterOrg: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    organizationName: '',
    industry: 'Technology & SaaS',
    adminName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await client.post('/auth/register', {
        ...formData,
        email: formData.email.trim().toLowerCase(),
      });
      const { accessToken, user, organization } = res.data.data;
      login(accessToken, user, organization);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please check your internet connection.'
          : 'Registration failed. Please check your details.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 shadow-sm border border-[#edf2f7]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#84b81b] text-white shadow-sm font-black text-xl">
            H
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#0e1017]">
            Create Company Workspace
          </h2>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Start screening candidates with explainable AI and generate statutory Indian offer letters
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
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Company Name</label>
            <input
              type="text"
              required
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              placeholder="e.g. TechScale Innovations India"
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            >
              <option value="Technology & SaaS">Technology & SaaS</option>
              <option value="Fintech & Banking">Fintech & Banking</option>
              <option value="E-Commerce & D2C">E-Commerce & D2C</option>
              <option value="Healthcare & HealthTech">Healthcare & HealthTech</option>
              <option value="Consulting & Agency">Consulting & Agency</option>
              <option value="Manufacturing & Supply Chain">Manufacturing & Supply Chain</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Your Full Name</label>
              <input
                type="text"
                required
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Alex Watson"
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@techscale.io"
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting Up Workspace...' : 'Register Company Workspace'}
          </button>
        </form>

        <div className="text-center text-xs text-[#5e6b7c]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#84b81b] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
