'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock3, Download, Film, Globe2, Info, Star } from 'lucide-react';
import { permalinkSlug } from '@/utils/slug';
import { getMediaImage, imageFallbackFor } from '@/utils/mediaImages';

const EMPTY_ITEMS = [];

export default function HeroSlider({ items = EMPTY_ITEMS, loading = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // Adjust state inline during render if items change
  const [prevItemsLength, setPrevItemsLength] = useState(items.length);
  if (items.length !== prevItemsLength) {
    setPrevItemsLength(items.length);
    setCurrentIndex(0);
  }

  useEffect(() => {
    if (items.length === 0) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [items]);

  const currentItem = items[currentIndex] || items[0] || {};
  const initialBackdrop = getMediaImage(currentItem, 'backdrop');
  const initialPoster = getMediaImage(currentItem, 'poster');

  const [backdropUrl, setBackdropUrl] = useState(initialBackdrop);
  const [posterUrl, setPosterUrl] = useState(initialPoster);

  useEffect(() => {
    setBackdropUrl(initialBackdrop);
    setPosterUrl(initialPoster);
  }, [initialBackdrop, initialPoster]);

  if (loading || items.length === 0) {
    return (
      <section className="relative w-full min-h-[86vh] overflow-hidden bg-luxury-950 flex items-center pt-24 lg:pt-32 pb-12 sm:pb-20 -mt-20">
        {/* Background placeholder animation */}
        <div className="absolute inset-0 bg-luxury-900/60 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(124,58,237,0.08),transparent_34%),linear-gradient(90deg,#030008_0%,rgba(3,0,8,0.72)_34%,rgba(3,0,8,0.24)_68%,rgba(3,0,8,0.42)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/10 to-black/25" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-luxury-950 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 items-center">
            {/* Left Column (Meta & Info Skeleton) */}
            <div className="max-w-3xl text-left flex flex-col gap-6">
              {/* Badge */}
              <div className="h-6 w-28 bg-white/5 border border-white/10 rounded-full animate-pulse" />

              {/* Title */}
              <div className="flex flex-col gap-3">
                <div className="h-12 sm:h-16 w-3/4 bg-white/10 rounded-2xl animate-pulse" />
                <div className="h-6 sm:h-8 w-1/3 bg-white/5 rounded-xl animate-pulse" />
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="h-7 w-20 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-7 w-16 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-7 w-24 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-7 w-16 bg-white/5 rounded-xl animate-pulse" />
              </div>

              {/* Synopsis lines */}
              <div className="flex flex-col gap-2.5 mt-2">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-white/5 rounded animate-pulse" />
              </div>

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 gap-3 max-w-xl text-xs mt-2">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2 h-20 animate-pulse">
                  <div className="h-3 w-16 bg-white/5 rounded" />
                  <div className="h-4 w-24 bg-white/10 rounded" />
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2 h-20 animate-pulse">
                  <div className="h-3 w-16 bg-white/5 rounded" />
                  <div className="h-4 w-28 bg-white/10 rounded" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <div className="h-11 sm:h-12 w-32 bg-white/10 rounded-xl sm:rounded-2xl animate-pulse" />
                <div className="h-11 sm:h-12 w-28 bg-white/5 rounded-xl sm:rounded-2xl animate-pulse" />
              </div>
            </div>

            {/* Right Column (Poster Card Skeleton) */}
            <div className="flex justify-center w-full lg:block order-first lg:order-none">
              <div className="relative rounded-[2rem] border border-white/5 bg-white/[0.02] p-3 sm:p-4 max-w-[180px] sm:max-w-[260px] lg:max-w-none mx-auto w-full animate-pulse">
                <div className="relative overflow-hidden rounded-[1.5rem] aspect-[2/3] bg-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const current = items[currentIndex] || items[0] || {};
  const type = current.mediaType || (current.seasons ? 'drama' : 'movie');
  const currentSlug = permalinkSlug(current);
  const releaseYear = current.releaseDate ? new Date(current.releaseDate).getFullYear() : 'TBA';
  const releaseDate = current.releaseDate
    ? new Date(current.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Coming soon';
  const genres = current.genres || current.genre || current.keywords || [];
  const primaryGenre = Array.isArray(genres) ? genres[0] : genres;
  const rating = current.imdbRating || current.tmdbRating || 0;
  const backdrop = getMediaImage(current, 'backdrop');
  const poster = getMediaImage(current, 'poster');

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  const openDetails = () => router.push(`/${type}/${currentSlug}`);
  const openDownloads = () => router.push(`/${type}/${currentSlug}?scrollTo=subtitles`);

  return (
    <section className="relative w-full min-h-[86vh] overflow-hidden group bg-luxury-950 -mt-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={current._id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={backdropUrl}
            alt={current.title || 'Backdrop'}
            fill
            priority={currentIndex === 0}
            sizes="100vw"
            className="w-full h-full object-cover object-center"
            onError={() => {
              const fallback = imageFallbackFor(current, 'backdrop');
              if (backdropUrl !== fallback) {
                setBackdropUrl(fallback);
              }
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(124,58,237,0.18),transparent_34%),linear-gradient(90deg,#030008_0%,rgba(3,0,8,0.72)_34%,rgba(3,0,8,0.24)_68%,rgba(3,0,8,0.42)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/10 to-black/25" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-luxury-950 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[86vh] items-center pt-24 lg:pt-32 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current._id}-content`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl text-left"
              >
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full border border-brand-primary/40 bg-brand-primary/15 text-brand-primary text-[10px] font-black uppercase tracking-[0.22em] shadow-lg shadow-brand-primary/10">
                    New Upload
                  </span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[0.92] text-glow">
                  {current.title}
                </h1>
                {current.originalTitle && current.originalTitle !== current.title && (
                  <p className="mt-3 text-lg sm:text-2xl font-extrabold text-violet-100/85 leading-snug">
                    {current.originalTitle}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1.5 bg-amber-400/15 border border-amber-300/40 text-amber-200 text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-current" /> {rating ? rating.toFixed(1) : 'NR'} IMDb
                  </span>
                  {current.country && (
                    <span className="px-3 py-1.5 bg-white/10 border border-white/10 text-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-brand-primary" />
                      {current.country}
                    </span>
                  )}
                  <span className="px-3 py-1.5 bg-white/10 border border-white/10 text-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-brand-secondary" />
                    {primaryGenre || type}
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 border border-white/10 text-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                    {releaseYear}
                  </span>
                </div>

                <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base text-slate-200/85 leading-6 sm:leading-7 line-clamp-3 sm:line-clamp-4">
                  {current.synopsisRewrite || current.description}
                </p>

                <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 max-w-xl text-xs text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                    <span className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                      <Clock3 className="w-3.5 h-3.5" /> Runtime
                    </span>
                    <p className="mt-1 text-white font-black">
                      {current.runtime 
                        ? (Math.floor(current.runtime / 60) > 0 
                          ? (current.runtime % 60 > 0 
                            ? `${Math.floor(current.runtime / 60)}h ${current.runtime % 60}m` 
                            : `${Math.floor(current.runtime / 60)}h`)
                          : `${current.runtime} min`)
                        : type === 'drama' ? 'Series Episodes' : 'Feature Length'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                    <span className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                      <Calendar className="w-3.5 h-3.5" /> Release
                    </span>
                    <p className="mt-1 text-white font-black">{releaseDate}</p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-7 grid grid-cols-2 sm:flex sm:flex-row items-center gap-3">
                  <button
                    onClick={openDownloads}
                    className="h-11 sm:h-12 px-4 sm:px-7 bg-gradient-to-r from-[#7c3aed] via-brand-primary to-brand-secondary hover:brightness-110 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-2xl shadow-brand-primary/30"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={openDetails}
                    className="h-11 sm:h-12 px-4 sm:px-6 border border-white/15 bg-white/[0.04] hover:bg-white/10 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition backdrop-blur-xl"
                  >
                    <Info className="w-3.5 h-3.5" /> More Info
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${current._id}-poster`}
                initial={{ opacity: 0, x: 30, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.55 }}
                className="flex justify-center w-full lg:block order-first lg:order-none"
              >
                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 sm:p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl max-w-[180px] sm:max-w-[260px] lg:max-w-none mx-auto w-full">
                  <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-br from-brand-primary/35 via-transparent to-brand-secondary/25 blur-xl opacity-80" />
                  <div className="relative overflow-hidden rounded-[1.5rem] aspect-[2/3] bg-luxury-900">
                    <Image
                      src={posterUrl}
                      alt={current.title || 'Poster'}
                      fill
                      priority={currentIndex === 0}
                      sizes="(max-width: 640px) 180px, (max-width: 1024px) 260px, 320px"
                      className="h-full w-full object-cover"
                      onError={() => {
                        const fallback = imageFallbackFor(current, 'poster');
                        if (posterUrl !== fallback) {
                          setPosterUrl(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="hidden sm:flex items-center justify-between rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-xl">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Now Featured</p>
                          <p className="mt-0.5 text-sm font-black text-white line-clamp-1">{current.title}</p>
                        </div>
                        <span className="rounded-xl bg-brand-primary px-2.5 py-1 text-[10px] font-black text-white">
                          {type === 'drama' ? 'TV' : 'MOVIE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/10 bg-black/35 hover:bg-brand-primary/80 text-white transition z-20 opacity-0 group-hover:opacity-100 backdrop-blur-xl"
        aria-label="Previous hero title"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/10 bg-black/35 hover:bg-brand-primary/80 text-white transition z-20 opacity-0 group-hover:opacity-100 backdrop-blur-xl"
        aria-label="Next hero title"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {items.map((item, i) => (
          <button
            key={item._id || i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-8 bg-brand-primary' : 'w-2 bg-white/25 hover:bg-white/50'}`}
            aria-label={`Show hero title ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
