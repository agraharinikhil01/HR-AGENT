import React from 'react';
import { Sidebar } from './Sidebar.js';
import { TopHeader } from './TopHeader.js';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#f6f8fa] text-[#0e1017]">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Dynamic View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
