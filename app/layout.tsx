import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { TripsProvider } from '@/context/TripsContext';
import { LanguageProvider } from '@/context/LanguageContext';
import RegisterSW from '@/components/RegisterSW';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'i-Travel — Travel Manager',
  description: 'Plan and share trips with your crew.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'i-Travel',
  },
  icons: {
    icon: '/icons/favicon-32.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-100 min-h-screen`}>
        <RegisterSW />
        <LanguageProvider>
          <TripsProvider>{children}</TripsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
