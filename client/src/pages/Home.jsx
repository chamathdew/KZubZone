import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import HeroSlider from '../components/HeroSlider';
import GlassCard from '../components/GlassCard';
import SeoTags from '../components/SeoTags';
import { Sparkles, Film, Tv, Clock, Send } from 'lucide-react';

export default function Home() {
  
  // Fetch Movies
  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ['homeMovies'],
    queryFn: async () => {
      const res = await axios.get('/api/media/movies?limit=6');
      return res.data;
    }
  });

  // Fetch Dramas
  const { data: dramasData, isLoading: dramasLoading } = useQuery({
    queryKey: ['homeDramas'],
    queryFn: async () => {
      const res = await axios.get('/api/media/dramas?limit=6');
      return res.data;
    }
  });

  // Fetch Subtitles (Recent Updates)
  const { data: subtitleQueue, isLoading: subsLoading } = useQuery({
    queryKey: ['homeSubtitles'],
    queryFn: async () => {
      const res = await axios.get('/api/subtitles/recent?limit=4');
      return res.data;
    },
    retry: false,
    initialData: []
  });

  const allMovies = moviesData?.movies || [];
  const allDramas = dramasData?.dramas || [];

  // Combine featured elements for Slider
  const featured = [
    ...allDramas.filter(d => d.isFeatured || d.isTrending),
    ...allMovies.filter(m => m.isFeatured || m.isTrending)
  ];

  // If no items, fallback with simulated featured titles
  const slideItems = featured.length > 0 ? featured : [
    {
      _id: "mock1",
      title: "Moving",
      originalTitle: "무빙",
      banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
      poster: "https://placehold.co/500x750/111/fff?text=Moving",
      tmdbRating: 8.4,
      country: "KR",
      description: "Children with secret superpowers and their parents who harbor painful secrets from the past face a massive imminent danger together.",
      synopsisRewrite: "Explore the secret superhuman project. KDramaVerse covers Moving (2023) - the premier sci-fi action series taking the world by storm.",
      seasons: true,
      slug: "moving"
    },
    {
      _id: "mock2",
      title: "Train to Busan",
      originalTitle: "부산행",
      banner: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop",
      poster: "https://placehold.co/500x750/111/fff?text=Train+To+Busan",
      tmdbRating: 8.0,
      country: "KR",
      description: "A zombie virus breaks out in South Korea, and passengers on a train from Seoul to Busan struggle to survive the outbreak.",
      synopsisRewrite: "Re-experience the zombie masterpiece. Join Seok-woo and his daughter on a thrilling high-speed survival ride on the Train to Busan.",
      slug: "train-to-busan"
    }
  ];

  // Main page schema
  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KDramaVerse",
    "url": "https://kdramaverse.com",
    "description": "Premium Korean Entertainment Platform. Search, stream, and download multi-language subtitles."
  };

  return (
    <div className="w-full flex flex-col gap-12 bg-luxury-950">
      
      {/* Dynamic SEO Tags */}
      <SeoTags
        title="KDramaVerse - Watch K-Dramas & Movies with Subtitles"
        description="Stream popular Korean Dramas & Movies with synchronized SRT, VTT, and ASS community subtitles. Explore Moving, Goblin, and more!"
        keywords={['kdramaverse', 'k-drama subtitles', 'train to busan sub', 'moving eng sub', 'goblin subtitles']}
        canonical="https://kdramaverse.com"
        image={slideItems[0]?.banner}
        schemaMarkup={homeSchema}
      />

      {/* Hero Banner Slider */}
      <HeroSlider items={slideItems} />

      {/* Page Body Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-14">
        
        {/* ROW 1: TRENDING DRAMAS */}
        <section className="flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-sans tracking-tight">
              <Sparkles className="w-5 h-5 text-brand-primary text-glow" /> Trending K-Dramas
            </h2>
          </div>

          {dramasLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-luxury-800 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : allDramas.length === 0 ? (
            <p className="text-xs text-slate-500 py-6">No dramas imported yet. Go to management dashboard to import via TMDB!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {allDramas.map((drama) => (
                <GlassCard key={drama._id} item={drama} type="drama" />
              ))}
            </div>
          )}
        </section>

        {/* ROW 2: LATEST MOVIES */}
        <section className="flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-sans tracking-tight">
              <Film className="w-5 h-5 text-brand-secondary" /> Hot Korean Movies
            </h2>
          </div>

          {moviesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-luxury-800 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : allMovies.length === 0 ? (
            <p className="text-xs text-slate-500 py-6">No movies imported yet. Use TMDB Import Center to load movies with one click!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {allMovies.map((movie) => (
                <GlassCard key={movie._id} item={movie} type="movie" />
              ))}
            </div>
          )}
        </section>

        {/* BOTTOM DOUBLE COLUMN: SUBTITLES & NEWSLETTER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* SUBTITLE UPDATES COLUMN (2 COLS) */}
          <div className="md:col-span-2 glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-accent" /> Recent Subtitle Releases
            </h3>
            <hr className="border-white/5" />
            
            {subsLoading ? (
              <div className="flex flex-col gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-luxury-800 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : subtitleQueue.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Community subtitles are pending uploader approvals. Check back later!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {subtitleQueue.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{sub.language} ({sub.format.toUpperCase()})</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Version: {sub.version} • Contributed by {sub.uploader?.username || 'Translator'}</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-lg">
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NEWSLETTER COLUMN (1 COL) */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col justify-between text-left relative overflow-hidden">
            {/* Glow circle */}
            <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-brand-secondary/15 rounded-full blur-2xl" />

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Subscribe to Releases</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Receive weekly digests containing fresh Korean drama imports, subtitle sync patches, and custom reviews direct to your inbox.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="flex flex-col gap-2 relative z-10">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="w-full h-10 px-4 rounded-xl text-xs bg-luxury-800 border border-white/5 text-white focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="h-10 w-full bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Send className="w-3.5 h-3.5" /> Join Newsletter
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
