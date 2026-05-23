import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSlider from '../components/HeroSlider';
import GlassCard from '../components/GlassCard';
import SeoTags from '../components/SeoTags';
import { 
  Sparkles, Film, Tv, Clock, Send, 
  Flame, Star, Calendar, Compass, 
  Layers, Filter, RefreshCw
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'dramas' | 'movies'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'rating' | 'newest'
  const [country, setCountry] = useState(''); // '' | 'KR' | 'JP'

  // Fetch Featured Items for Hero Slider (stable, stays at top)
  const { data: featuredItems = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['homeFeatured'],
    queryFn: async () => {
      const [moviesRes, dramasRes] = await Promise.all([
        axios.get('/api/media/movies?limit=8'),
        axios.get('/api/media/dramas?limit=8')
      ]);
      const movies = moviesRes.data.movies || [];
      const dramas = dramasRes.data.dramas || [];
      return [
        ...dramas.filter(d => d.isFeatured || d.isTrending),
        ...movies.filter(m => m.isFeatured || m.isTrending)
      ];
    }
  });

  // Fetch Library Movies (reactive to sort and country)
  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ['libraryMovies', sortBy, country],
    queryFn: async () => {
      const res = await axios.get(`/api/media/movies?sort=${sortBy}&country=${country}&limit=12`);
      return res.data;
    }
  });

  // Fetch Library Dramas (reactive to sort and country)
  const { data: dramasData, isLoading: dramasLoading } = useQuery({
    queryKey: ['libraryDramas', sortBy, country],
    queryFn: async () => {
      const res = await axios.get(`/api/media/dramas?sort=${sortBy}&country=${country}&limit=12`);
      return res.data;
    }
  });

  // Fetch Subtitles (Recent Updates)
  const { data: subtitleQueue = [], isLoading: subsLoading } = useQuery({
    queryKey: ['homeSubtitles'],
    queryFn: async () => {
      const res = await axios.get('/api/subtitles/recent?limit=4');
      return res.data;
    },
    retry: false
  });

  const movies = moviesData?.movies || [];
  const dramas = dramasData?.dramas || [];

  // Combine and sort on the client if 'all' is selected
  let displayedItems = [];
  if (activeTab === 'all') {
    displayedItems = [...movies, ...dramas];
    // Apply sorting
    if (sortBy === 'rating') {
      displayedItems.sort((a, b) => (b.tmdbRating || 0) - (a.tmdbRating || 0));
    } else if (sortBy === 'newest') {
      displayedItems.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
    } else {
      displayedItems.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
  } else if (activeTab === 'dramas') {
    displayedItems = dramas;
  } else {
    displayedItems = movies;
  }

  // Handle slide fallbacks
  const slideItems = featuredItems.length > 0 ? featuredItems : [
    {
      _id: "mock1",
      title: "Moving",
      originalTitle: "무빙",
      banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
      poster: "https://placehold.co/500x750/111/fff?text=Moving",
      tmdbRating: 8.4,
      country: "KR",
      description: "Children with secret superpowers and their parents who harbor painful secrets from the past face a massive imminent danger together.",
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
      slug: "train-to-busan"
    }
  ];

  const isLibraryLoading = moviesLoading || dramasLoading;

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KDramaVerse",
    "url": "https://kdramaverse.com",
    "description": "Premium Korean Entertainment Platform. Search, stream, and download multi-language subtitles."
  };

  return (
    <div className="w-full flex flex-col gap-12 bg-luxury-950 pb-16">
      
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

      {/* Main Page Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-14 mt-6">
        
        {/* INTERACTIVE LIBRARY SHOWCASE */}
        <section className="flex flex-col gap-8">
          
          {/* Section Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Compass className="w-7 h-7 text-brand-primary animate-pulse" /> Explore Catalog
              </h2>
              <p className="text-xs text-slate-400 mt-1">Discover popular Asian dramas and movies with translations.</p>
            </div>

            {/* Content Type Tabs */}
            <div className="bg-luxury-900 border border-white/5 p-1 rounded-2xl flex items-center gap-1 self-start md:self-auto">
              {[
                { id: 'all', label: 'All Media', icon: Layers },
                { id: 'dramas', label: 'TV Shows', icon: Tv },
                { id: 'movies', label: 'Movies', icon: Film }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                      active ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-brand-primary rounded-xl shadow-lg shadow-brand-primary/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Filtering Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 -mt-2">
            
            {/* Sort pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-brand-secondary" /> Sort By:
              </span>
              {[
                { id: 'popular', label: 'Popular', icon: Flame },
                { id: 'rating', label: 'Top Rated', icon: Star },
                { id: 'newest', label: 'New Releases', icon: Calendar }
              ].map((pill) => {
                const Icon = pill.icon;
                const active = sortBy === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSortBy(pill.id)}
                    className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      active 
                        ? 'bg-brand-secondary/15 border-brand-secondary/30 text-brand-secondary' 
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Country Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Region:</span>
              <div className="bg-luxury-900 border border-white/5 p-1 rounded-xl flex items-center gap-1">
                {[
                  { id: '', label: 'All' },
                  { id: 'KR', label: '🇰🇷 South Korea' },
                  { id: 'JP', label: '🇯🇵 Japan' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCountry(c.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 ${
                      country === c.id 
                        ? 'bg-white/10 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Library Media Grid */}
          <div className="relative min-h-[400px]">
            {isLibraryLoading ? (
              // Premium Pulsing Shimmer grid
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="aspect-[2/3] bg-luxury-900 rounded-2xl relative overflow-hidden border border-white/5 animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                    <div className="h-4 bg-luxury-900 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-3 bg-luxury-900 rounded-lg w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : displayedItems.length === 0 ? (
              // Empty State
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-3xl bg-luxury-900/50"
              >
                <RefreshCw className="w-10 h-10 text-slate-600 mb-3 animate-spin" />
                <h4 className="text-base font-bold text-white mb-1">No Titles Found</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  We couldn't find any items matching these filters. Try changing your search options or check the admin manager.
                </p>
              </motion.div>
            ) : (
              // Beautiful dynamic grid with page transitions
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {displayedItems.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GlassCard item={item} type={item.seasons ? 'drama' : 'movie'} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

        </section>

        {/* BOTTOM COLUMN: SUBTITLES & NEWSLETTER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-12">
          
          {/* SUBTITLE UPDATES COLUMN (2 COLS) */}
          <div className="md:col-span-2 glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-brand-accent" /> Recent Subtitle Releases
            </h3>
            <hr className="border-white/5" />
            
            {subsLoading ? (
              <div className="flex flex-col gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-luxury-900 animate-pulse rounded-xl" />
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
                    className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition duration-300"
                  >
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">{sub.language} ({sub.format.toUpperCase()})</p>
                      <p className="text-[10px] text-slate-400 mt-1">Version: {sub.version} • Contributed by {sub.uploader?.username || 'Translator'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-lg">
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

            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="flex flex-col gap-2.5 relative z-10">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="w-full h-10 px-4 rounded-xl text-xs bg-luxury-900 border border-white/5 text-white focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="h-10 w-full bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition duration-300"
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

