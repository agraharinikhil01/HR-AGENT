import React from 'react';
import { useAuth } from '../auth/AuthProvider.js';
import { Bell, MessageSquare, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TopHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e8ecf2] bg-white/90 px-8 py-4 backdrop-blur-md">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-bold text-[#0e1017] flex items-center gap-2">
          Hello, {user?.name || 'Alex Watson'} <span className="text-xl">👋</span>
        </h1>
        <p className="text-xs text-[#5e6b7c]">
          Here's your recruitment status for today
        </p>
      </div>

      {/* Right-hand Pill Badges & Buttons */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-1.5 text-xs font-semibold text-[#0e1017] hover:bg-slate-100 transition-colors">
          <Bell className="h-3.5 w-3.5 text-[#729e18]" />
          <span>Notifications</span>
          <span className="rounded-full bg-lime-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-1.5 text-xs font-semibold text-[#0e1017] hover:bg-slate-100 transition-colors">
          <MessageSquare className="h-3.5 w-3.5 text-[#5e6b7c]" />
          <span>Messages</span>
          <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
            2
          </span>
        </button>

        <Link
          to="/jobs/create"
          className="flex items-center gap-1.5 rounded-full bg-lime-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-lime-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          <span>Post Job</span>
        </Link>
      </div>
    </header>
  );
};
