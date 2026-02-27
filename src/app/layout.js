import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "QuickCourt - Book Sports Courts Online",
    template: "%s | QuickCourt"
  },
  description: "Find and book sports courts near you instantly. Tennis, badminton, basketball, and more. Easy online booking with instant confirmation.",
  keywords: ["sports booking", "court booking", "tennis court", "badminton court", "basketball court", "sports facilities", "book sports venue", "online booking"],
  authors: [{ name: "QuickCourt" }],
  creator: "QuickCourt",
  publisher: "QuickCourt",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "QuickCourt - Book Sports Courts Online",
    description: "Find and book sports courts near you instantly. Tennis, badminton, basketball, and more.",
    url: '/',
    siteName: 'QuickCourt',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuickCourt - Book Sports Courts Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "QuickCourt - Book Sports Courts Online",
    description: "Find and book sports courts near you instantly.",
    images: ['/og-image.png'],
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
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QuickCourt',
  },
  formatDetection: {
    telephone: true,
    date: false,
    address: false,
    email: true,
  },
};

export const viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
