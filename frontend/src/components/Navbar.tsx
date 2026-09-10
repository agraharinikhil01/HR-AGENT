import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Briefcase,
  Users,
  Calendar,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Building2,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, organization, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Candidates & Pipeline', path: '/candidates', icon: Users },
    { label: 'Interviews', path: '/interviews', icon: Calendar },
    { label: 'Offers & CTC', path: '/offers', icon: FileCheck },
    { label: 'Settings', path: '/settings', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">HireFlow</span>
              <span className="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
                AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {organization && (
            <div className="hidden lg:flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {organization.name}
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                <span className="inline-block text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
