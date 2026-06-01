import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ApiProvider } from "@/contexts/ApiContext";
import { PushNotificationProvider } from "@/contexts/PushNotificationContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";

// Athletic Modernism type system — Inter (body) · Fraunces (display serif) ·
// JetBrains Mono (numbers/labels). Loaded at runtime via <link> in <head>
// (not next/font) so a flaky network never breaks the build, and the browser
// falls back to system fonts gracefully. The font-family CSS vars are defined
// in globals.css :root.

export const metadata = {
  title: {
    default: "QuickCourt - Built for athletes",
    template: "%s | QuickCourt"
  },
  description: "Find and book sports courts near you instantly. Tennis, badminton, basketball, and more. Easy online booking with instant confirmation.",
  keywords: ["sports booking", "court booking", "tennis court", "badminton court", "basketball court", "sports facilities", "book sports venue", "online booking"],
  authors: [{ name: "QuickCourt" }],
  creator: "QuickCourt",
  publisher: "QuickCourt",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: { canonical: '/' },
  openGraph: {
    title: "QuickCourt - Built for athletes",
    description: "Find and book sports courts near you instantly.",
    url: '/',
    siteName: 'QuickCourt',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "QuickCourt - Built for athletes",
    description: "Find and book sports courts near you instantly.",
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'QuickCourt' },
};

export const viewport = {
  themeColor: '#006b2c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container"
      >
        <ThemeProvider>
          <AuthProvider>
            <ApiProvider>
              <PushNotificationProvider>
                <Navbar />
                <main className="flex-grow flex flex-col">
                  {children}
                </main>
                <Footer />
                <ToastProvider />
                <ServiceWorkerRegistration />
              </PushNotificationProvider>
            </ApiProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
