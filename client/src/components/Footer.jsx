import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, Facebook, Instagram, Mail, MapPin, MessageCircle, Play, Search, Send, Youtube } from 'lucide-react';

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'Explore Catalog', to: '/search' },
  { label: 'K-Dramas', to: '/search?category=drama' },
  { label: 'Movies', to: '/search?category=movie' }
];

const socialLinks = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' }
];

export default function Footer() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/management') || location.pathname.includes('/episode-');

  if (hideFooter) return null;

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-luxury-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent" />
      <div className="bg-luxury-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1fr_0.9fr]">
            <div className="space-y-5">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-primary/30 bg-brand-primary/10 shadow-glass-neon">
                  <Clapperboard className="h-7 w-7 text-brand-primary" />
                </span>
                <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                  KDRAMAVERSE
                </span>
              </Link>
              <p className="max-w-sm text-sm leading-7 text-slate-400">
                Discover Korean dramas, movies, episode guides, community subtitles, and reviews in one elegant streaming-inspired space.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">HD Catalog</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Community Subs</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">K-Drama Watchlist</span>
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-extrabold uppercase tracking-wider text-white">
                Quick Links
                <span className="mt-2 block h-0.5 w-8 rounded-full bg-brand-accent" />
              </h3>
              <nav className="flex flex-col gap-3 text-sm text-slate-400">
                {footerLinks.map((link) => (
                  <Link key={link.label} to={link.to} className="transition hover:text-brand-primary">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-extrabold uppercase tracking-wider text-white">
                Contact
                <span className="mt-2 block h-0.5 w-8 rounded-full bg-brand-secondary" />
              </h3>
              <div className="space-y-4 text-sm text-slate-400">
                <p className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent" />
                  Seoul-curated Korean entertainment catalog for global fans.
                </p>
                <a href="mailto:hello@kdramaverse.com" className="flex gap-3 transition hover:text-brand-primary">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-secondary" />
                  hello@kdramaverse.com
                </a>
                <a href="/search" className="flex gap-3 transition hover:text-brand-primary">
                  <Search className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-primary" />
                  Request a title or subtitle sync
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-extrabold uppercase tracking-wider text-white">
                Follow Us
                <span className="mt-2 block h-0.5 w-8 rounded-full bg-brand-primary" />
              </h3>
              <div className="mb-5 flex gap-3">
                {socialLinks.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-brand-primary/60 hover:bg-brand-primary/15 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              <form
                onSubmit={(event) => event.preventDefault()}
                className="flex h-11 overflow-hidden rounded-xl border border-white/10 bg-luxury-950/70"
              >
                <input
                  type="email"
                  aria-label="Email for updates"
                  placeholder="Get release alerts"
                  className="min-w-0 flex-1 bg-transparent px-3 text-xs text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex w-11 items-center justify-center bg-brand-primary text-white transition hover:bg-brand-primary/80"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

         <div className="mt-10 border-t border-white/10 pt-6 flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
  
  <div>
    <p className="font-medium text-slate-300">
      © {new Date().getFullYear()} KDramaVerse. All rights reserved.
    </p>
    <p className="mt-1 text-xs text-slate-500">
      Your ultimate destination for Korean dramas, movies, reviews, and streaming updates.
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-5">
    <span className="inline-flex items-center gap-2">
      <Play className="h-4 w-4 text-brand-primary" />
      HD Streaming Guides
    </span>

    <span className="inline-flex items-center gap-2">
      <MessageCircle className="h-4 w-4 text-brand-secondary" />
      Fan Community
    </span>

    <span className="inline-flex items-center gap-2">
      <Star className="h-4 w-4 text-yellow-400" />
      Latest K-Content
    </span>
  </div>
</div>
        </div>
      </div>
    </footer>
  );
}
