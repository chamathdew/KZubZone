import { Inter, Outfit } from 'next/font/google';
import Providers from './Providers';
import dynamic from 'next/dynamic';
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

export const metadata = {
  title: 'KSubZone - Premium Korean Entertainment Platform',
  description: 'Watch the latest Korean dramas and movies with synchronized Sinhala and English subtitles. Discover, review, and enjoy premium K-entertainment.',
  icons: {
    icon: [
      { url: '/main-logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/main-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/main-logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="bg-luxury-950 text-slate-100 font-sans selection:bg-brand-primary selection:text-white antialiased overflow-x-hidden">
        <Providers>
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
