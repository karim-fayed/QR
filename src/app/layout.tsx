import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Optimized font loading
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Load only when needed
  fallback: ['Courier New', 'monospace'],
});

// Lazy load performance optimizer
const PerformanceOptimizer = dynamic(() => import('@/components/performance/PerformanceOptimizer'), {
  loading: () => null,
});

export const metadata: Metadata = {
  title: {
    default: 'CodeSafe QR - Secure QR Code Platform',
    template: '%s | CodeSafe QR',
  },
  description: 'Create, manage, and verify encrypted QR codes with advanced security features and AI analysis.',
  keywords: ['QR codes', 'security', 'encryption', 'verification', 'AI analysis', 'tamper-proof', 'secure'],
  authors: [{ name: 'CodeSafe Team' }],
  creator: 'CodeSafe',
  publisher: 'CodeSafe',
  metadataBase: new URL('https://qr-safe.vercel.app'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://qr-safe.vercel.app',
    title: 'CodeSafe QR - Secure QR Code Platform',
    description: 'Create, manage, and verify encrypted QR codes with advanced security features.',
    siteName: 'CodeSafe QR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeSafe QR - Secure QR Code Platform',
    description: 'Create, manage, and verify encrypted QR codes with advanced security features.',
  },
};

// Viewport configuration moved from metadata
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />
        <meta name="theme-color" content="#6366f1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
              
              // Critical CSS loading indicator
              const criticalCSS = document.createElement('style');
              criticalCSS.textContent = \`
                .loading-spinner {
                  width: 40px;
                  height: 40px;
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #6366f1;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              \`;
              document.head.appendChild(criticalCSS);
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>
        }>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
