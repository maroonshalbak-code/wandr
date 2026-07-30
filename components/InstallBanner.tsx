'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Check if dismissed before
    if (localStorage.getItem('itravel-install-dismissed')) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    setIsIOS(ios);
    if (ios) setShowIOSHint(true);

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSHint(false);
    try { localStorage.setItem('itravel-install-dismissed', '1'); } catch { }
  };

  if (dismissed) return null;

  // Android Chrome banner
  if (prompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">iT</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Install i-Travel</p>
          <p className="text-xs text-gray-500">Add to home screen for the best experience</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDismiss} className="text-xs text-gray-400 px-2 py-1.5 rounded-lg hover:bg-gray-100">
            Later
          </button>
          <button onClick={handleInstall} className="text-xs font-semibold text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600">
            Install
          </button>
        </div>
      </div>
    );
  }

  // iOS hint banner
  if (showIOSHint && isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">iT</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Install i-Travel</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Tap the <span className="font-semibold">Share</span> button{' '}
              <svg className="inline w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
              </svg>{' '}
              then <span className="font-semibold">"Add to Home Screen"</span>
            </p>
          </div>
          <button onClick={handleDismiss} className="text-gray-300 hover:text-gray-400 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {/* Arrow pointing down to Safari toolbar */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
      </div>
    );
  }

  return null;
}
