'use client';

import { ReactNode } from 'react';

export default function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[780px] flex flex-col relative">
        {/* Status bar */}
        <div className="flex justify-between items-center px-5 pt-4 pb-1 text-xs text-gray-400 flex-shrink-0">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
            <svg className="w-4 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="0" y="6" width="18" height="12" rx="2" opacity="0.3"/><rect x="0" y="6" width="14" height="12" rx="2"/><rect x="19" y="9" width="2" height="6" rx="1"/></svg>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
