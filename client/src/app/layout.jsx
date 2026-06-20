import { Inter, Outfit } from 'next/font/google';
import localFont from 'next/font/local';
import Providers from './Providers';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import '@/index.css';

const ParticleBackground = dynamic(() => import('@/components/layout/ParticleBackground'), { ssr: false });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const milker = localFont({
  src: '../../public/fonts/Milker.otf',
  variable: '--font-milker',
  display: 'swap',
});

export const metadata = {
  title: 'KSubZone - Premium Korean Entertainment Platform',
  description: 'Watch the latest Korean dramas and movies with synchronized Sinhala and English subtitles. Discover, review, and enjoy premium K-entertainment.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
};

export default async function RootLayout({ children }) {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
  let initialSiteContent = null;
  try {
    const res = await fetch(`${backendUrl}/api/site-content`, { next: { revalidate: 60 } });
    if (res.ok) {
      initialSiteContent = await res.json();
    }
  } catch (error) {
    console.error("Error fetching site content on root layout:", error);
  }

  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable} ${milker.variable}`}>
      <body className="bg-luxury-950 text-slate-100 font-sans selection:bg-brand-primary selection:text-white antialiased overflow-x-hidden">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5YK4V61YQ6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-5YK4V61YQ6');
          `}
        </Script>
        <Providers initialSiteContent={initialSiteContent}>
          <div className="flex flex-col min-h-screen bg-transparent text-slate-100 selection:bg-brand-primary selection:text-white relative">
            <ParticleBackground />
            <div className="relative z-10 flex flex-col min-h-screen">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
