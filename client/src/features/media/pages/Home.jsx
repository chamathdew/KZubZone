'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSlider from '@/features/media/components/HeroSlider';
import GlassCard from '@/components/ui/GlassCard';
import SeoTags from '@/components/seo/SeoTags';
import { useSiteContent } from '@/hooks/useSiteContent';
import { permalinkSlug } from '@/utils/slug';
import { 
  Sparkles, Film, Tv, Clock, Send, 
  Flame, Star, Calendar, Compass, 
  Layers, Filter, RefreshCw, ArrowRight
} from 'lucide-react';

export default function Home({ 
  initialHomeCatalog = {}, 
  initialSubtitles = [], 
  initialLibraryMovies = { movies: [] }, 
  initialLibraryDramas = { dramas: [] } 
}) {
  const { content } = useSiteContent();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'dramas' | 'movies'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'rating' | 'newest'
  const [country, setCountry] = useState(''); // '' | 'KR' | 'JP'

  // Fetch combined Home Catalog data (single API request)
  const { data: homeCatalog = initialHomeCatalog, isLoading: homeCatalogLoading } = useQuery({
    queryKey: ['homeCatalog'],
    queryFn: async () => {
      const res = await apiClient.get('/api/media/home');
      return res.data;
    },
    initialData: initialHomeCatalog,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const featuredItems = React.useMemo(() => {
    const movies = (homeCatalog.latestMovies || []).map(item => ({ ...item, mediaType: 'movie' }));
    const dramas = (homeCatalog.latestDramas || []).map(item => ({ ...item, mediaType: 'drama' }));
    return [...dramas, ...movies]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || b.releaseDate || 0) - new Date(a.createdAt || a.updatedAt || a.releaseDate || 0))
      .slice(0, 10);
  }, [homeCatalog.latestMovies, homeCatalog.latestDramas]);

  const featuredLoading = homeCatalogLoading;
  const categoryRowsLoading = homeCatalogLoading;

  // Fetch Library Movies (reactive to sort and country)
  const { data: moviesData = initialLibraryMovies, isLoading: moviesLoading } = useQuery({
    queryKey: ['libraryMovies', sortBy, country],
    queryFn: async () => {
      const res = await apiClient.get(`/api/media/movies?sort=${sortBy}&country=${country}&limit=12`);
      return res.data;
    },
    initialData: (sortBy === 'popular' && country === '') ? initialLibraryMovies : undefined,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch Library Dramas (reactive to sort and country)
  const { data: dramasData = initialLibraryDramas, isLoading: dramasLoading } = useQuery({
    queryKey: ['libraryDramas', sortBy, country],
    queryFn: async () => {
      const res = await apiClient.get(`/api/media/dramas?sort=${sortBy}&country=${country}&limit=12`);
      return res.data;
    },
    initialData: (sortBy === 'popular' && country === '') ? initialLibraryDramas : undefined,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch Subtitles (Recent Updates)
  const { data: subtitleQueue = initialSubtitles, isLoading: subsLoading } = useQuery({
    queryKey: ['homeSubtitles'],
    queryFn: async () => {
      const res = await apiClient.get('/api/subtitles/recent?limit=4');
      return res.data;
    },
    initialData: initialSubtitles,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false
  });

  const categoryRows = React.useMemo(() => {
    if (homeCatalogLoading || !homeCatalog) return [];

    const withType = (items, type) => (items || []).map(item => ({ ...item, mediaType: type }));
    const latestMovies = withType(homeCatalog.latestMovies, 'movie');
    const latestDramas = withType(homeCatalog.latestDramas, 'drama');
    
    const historicalTitles = [
      ...withType(homeCatalog.historicalDramas, 'drama'),
      ...withType(homeCatalog.historicalMovies, 'movie')
    ]
      .sort((a, b) => (b.imdbRating || b.tmdbRating || 0) - (a.imdbRating || a.tmdbRating || 0))
      .slice(0, 12);

    const trendingTitles = [
      ...withType(homeCatalog.trendingDramas, 'drama'),
      ...withType(homeCatalog.trendingMovies, 'movie')
    ]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 12);

    const popularTitles = [
      ...withType(homeCatalog.popularDramas, 'drama'),
      ...withType(homeCatalog.popularMovies, 'movie')
    ]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 12);

    return [
      {
        id: 'trending',
        title: 'Trending',
        description: 'Titles viewers are opening the most.',
        icon: Flame,
        link: '/search?category=all&trending=true&sort=views',
        items: trendingTitles.length > 0 ? trendingTitles : popularTitles
      },
      {
        id: 'latest-movies',
        title: 'Movies',
        description: 'Fresh movie additions from the catalog.',
        icon: Film,
        link: '/search?category=movie&sort=newest',
        items: latestMovies
      },
      {
        id: 'latest-tv-shows',
        title: 'TV Series',
        description: 'Newest drama and series updates.',
        icon: Tv,
        link: '/search?category=drama&sort=newest',
        items: latestDramas
      },
      {
        id: 'historical-drama',
        title: 'Historical Drama',
        description: 'Period pieces, royal court intrigue, and epic history.',
        icon: Star,
        link: '/search?category=all&isHistorical=true&sort=rating',
        items: historicalTitles
      }
    ];
  }, [homeCatalog, homeCatalogLoading]);

  const movies = (moviesData?.movies || []).map(item => ({ ...item, mediaType: 'movie' }));
  const dramas = (dramasData?.dramas || []).map(item => ({ ...item, mediaType: 'drama' }));

  // Combine and sort on the client if 'all' is selected
  let displayedItems = [];
  if (activeTab === 'all') {
    displayedItems = [...movies, ...dramas];
    // Apply sorting
    if (sortBy === 'rating') {
      displayedItems.sort((a, b) => (b.imdbRating || b.tmdbRating || 0) - (a.imdbRating || a.tmdbRating || 0));
    } else if (sortBy === 'newest') {
      displayedItems.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
    } else {
      displayedItems.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    displayedItems = displayedItems.slice(0, 12);
  } else if (activeTab === 'dramas') {
    displayedItems = dramas;
  } else {
    displayedItems = movies;
  }

  const librarySlides = [...dramas, ...movies]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || b.releaseDate || 0) - new Date(a.createdAt || a.updatedAt || a.releaseDate || 0))
    .slice(0, 10);

  // Handle slide fallbacks
  const slideItems = homeCatalogLoading
    ? []
    : (featuredItems.length > 0 ? featuredItems : librarySlides.length > 0 ? librarySlides : [
        {
          _id: "mock1",
          title: "Moving",
          originalTitle: "무빙",
          banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
          poster: "https://placehold.co/500x750/111/fff?text=Moving",
          tmdbRating: 8.4,
          imdbRating: 8.4,
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
          imdbRating: 8.0,
          country: "KR",
          description: "A zombie virus breaks out in South Korea, and passengers on a train from Seoul to Busan struggle to survive the outbreak.",
          slug: "train-to-busan"
        }
      ]);

  const isLibraryLoading = moviesLoading || dramasLoading;
  const brand = content?.brand || {};
  const seo = content?.seo || {};
  const home = content?.home || {};
  const seoKeywords = (seo.keywords || '').split(',').map((item) => item.trim()).filter(Boolean);
  const mediaGridClass = 'grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(150px,180px))] justify-center gap-x-3.5 sm:gap-x-5 gap-y-6 sm:gap-y-8 items-start';

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": brand.siteName || "KSubZone",
    "url": brand.primaryUrl || "https://ksubzone.com",
    "description": seo.homeDescription || "Premium Korean Entertainment Platform. Search and download Sinhala and English subtitles."
  };

  return (
    <div className="w-full flex flex-col gap-12 bg-transparent pb-16">
      
      {/* Dynamic SEO Tags */}
      <SeoTags
        title={seo.homeTitle || `${brand.siteName || 'KSubZone'} - ${brand.tagline || 'K-Drama & Movie Subtitles'}`}
        description={seo.homeDescription}
        keywords={seoKeywords}
        canonical={brand.primaryUrl || 'https://ksubzone.com'}
        image={seo.ogImage || slideItems[0]?.banner}
        schemaMarkup={homeSchema}
      />

      {/* Hero Banner Slider */}
      <HeroSlider items={slideItems} loading={homeCatalogLoading} />

      {/* Main Page Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-14 mt-6">
        
        {/* Permanent Category Rows */}
        <section className="flex flex-col gap-10 border-t border-white/5 pt-12">
          {categoryRowsLoading ? (
            <div className={mediaGridClass}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] w-full bg-luxury-900 rounded-lg border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            categoryRows.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="flex flex-col gap-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Icon className="w-5 h-5 text-brand-primary" /> {section.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{section.description}</p>
                    </div>
                    <Link
                      href={section.link}
                      className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-brand-primary/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition flex-shrink-0"
                    >
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {section.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/5 bg-luxury-900/40 py-8 text-center text-xs text-slate-500">
                      No titles added to this category yet.
                    </div>
                  ) : (
                    <div className={mediaGridClass}>
                      {section.items.map((item) => (
                        <GlassCard key={`${section.id}-${item.mediaType}-${item._id}`} item={item} type={item.mediaType} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

      {/* INTERACTIVE LIBRARY SHOWCASE */}
        <section className="flex flex-col gap-8 border-t border-white/5 pt-12">
          
          {/* Section Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Compass className="w-7 h-7 text-brand-primary animate-pulse" /> {home.catalogTitle || 'Explore Catalog'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{home.catalogDescription}</p>
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
              <div className={mediaGridClass}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex min-w-0 flex-col gap-3">
                    <div className="aspect-[2/3] w-full bg-luxury-900 rounded-lg relative overflow-hidden border border-white/5 animate-pulse">
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
                <h4 className="text-base font-bold text-white mb-1">{home.emptyTitle || 'No Titles Found'}</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  {home.emptyDescription}
                </p>
              </motion.div>
            ) : (
              // Beautiful dynamic grid with page transitions
              <motion.div 
                layout
                className={mediaGridClass}
              >
                <AnimatePresence mode="popLayout">
                  {displayedItems.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      className="min-w-0"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GlassCard item={item} type={item.mediaType} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

        </section>

        {/* BOTTOM COLUMN: SUBTITLES */}
        <div className="grid grid-cols-1 gap-8 border-t border-white/5 pt-12">
          
          {/* SUBTITLE UPDATES COLUMN (FULL WIDTH) */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4 text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-brand-accent" /> {home.subtitleTitle || 'Recent Subtitle Releases'}
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
                {home.subtitleEmpty}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {subtitleQueue.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition duration-300"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sub.media?.title ? (
                          <Link
                            href={`/${sub.media.type}/${permalinkSlug(sub.media)}`}
                            className="text-xs font-black text-white hover:text-brand-primary transition truncate max-w-[250px] sm:max-w-[400px]"
                          >
                            {sub.media.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-black text-white uppercase">Unknown Title</span>
                        )}
                        {(sub.seasonNumber || sub.episodeNumber) && (
                          <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[9px] font-black uppercase">
                            {sub.seasonNumber ? `S${sub.seasonNumber}` : ''} {sub.episodeNumber ? `EP${sub.episodeNumber}` : ''}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[9px] font-bold uppercase">
                          {sub.language} ({sub.format?.toUpperCase()})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Version: {sub.version} • {sub.uploaderRole === 'Admin' ? 'Admin' : 'User'}: {sub.adminUploader?.username || sub.uploader?.username || 'Translator'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-lg">
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        </div>
    </div>
  );
}
