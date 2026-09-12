import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileCheck,
  Settings,
  LogOut,
  Sparkles,
  BarChart3,
  UserCheck,
  Building2,
  ChevronDown,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, organization, logout } = useAuth();
  const location = useLocation();

  const isCandidate = user?.role === 'CANDIDATE';

  const candidateNavItems = [
    { label: 'My Applications', path: '/', icon: LayoutDashboard },
    { label: 'Explore Openings', path: '/careers', icon: Briefcase },
  ];

  const mainNavItems = isCandidate
    ? candidateNavItems
    : [
        { label: 'Overview', path: '/', icon: LayoutDashboard },
        { label: 'Job Openings', path: '/jobs', icon: Briefcase },
        { label: 'Candidates Pipeline', path: '/candidates', icon: Users },
        { label: 'Batch ATS Screener', path: '/ats-screener', icon: Sparkles, badge: 'NEW' },
        { label: 'Interviews', path: '/interviews', icon: Calendar },
      ];

  const recruitmentNavItems = isCandidate
    ? []
    : [
        { label: 'Offers & CTC', path: '/offers', icon: FileCheck },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];

  return (
    <aside className="w-64 shrink-0 border-r border-[#e8ecf2] bg-white flex flex-col justify-between min-h-screen py-5 px-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#84b81b] text-white shadow-sm font-black">
              H
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[#0e1017]">HireFlow</span>
              <span className="ml-1 text-[11px] font-bold text-[#567715] bg-[#edf7d2] px-1.5 py-0.5 rounded">
                {isCandidate ? 'PORTAL' : 'AI'}
              </span>
            </div>
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] p-2.5 border border-[#edf2f7]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative h-9 w-9 shrink-0 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#0e1017] truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-[#567715] truncate">
                {isCandidate ? 'Applicant / Candidate' : user?.role || 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-5">
          {/* Main Section */}
          <div>
            <span className="px-2 text-[11px] font-semibold text-[#8b98a9] uppercase tracking-wider">
              {isCandidate ? 'Applicant Portal' : 'Workspace'}
            </span>
            <nav className="mt-2 space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#edf7d2] text-[#567715] shadow-sm'
                        : 'text-[#5e6b7c] hover:bg-[#f6f8fa] hover:text-[#0e1017]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#729e18]' : 'text-[#8b98a9]'}`} />
                    <span>{item.label}</span>
                    {(item as any).badge && (
                      <span className="ml-auto rounded-full bg-[#84b81b] px-1.5 py-0.5 text-[9px] font-black text-white">
                        {(item as any).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Recruitment Section (Admins only) */}
          {!isCandidate && recruitmentNavItems.length > 0 && (
            <div>
              <span className="px-2 text-[11px] font-semibold text-[#8b98a9] uppercase tracking-wider">
                Recruitment
              </span>
              <nav className="mt-2 space-y-1">
                {recruitmentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#edf7d2] text-[#567715] shadow-sm'
                          : 'text-[#5e6b7c] hover:bg-[#f6f8fa] hover:text-[#0e1017]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#729e18]' : 'text-[#8b98a9]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-[#edf2f7] space-y-2">
        {organization && (
          <div className="px-2 py-1 text-[11px] font-medium text-[#5e6b7c] flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{organization.name}</span>
          </div>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
