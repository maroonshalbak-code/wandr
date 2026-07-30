'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ href, label = 'Back' }: { href?: string; label?: string }) {
  const router = useRouter();
  const handleClick = () => (href ? router.push(href) : router.back());
  return (
    <button onClick={handleClick} className="flex items-center gap-1 text-blue-500 text-sm font-medium">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
      </svg>
      {label}
    </button>
  );
}
