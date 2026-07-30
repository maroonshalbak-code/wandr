'use client';

import { ReactNode } from 'react';

export default function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center md:py-8 md:px-4">
      <div className="w-full md:max-w-sm bg-white md:rounded-3xl md:shadow-2xl md:min-h-[780px] min-h-screen flex flex-col relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
