'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Calendar, Globe, Download, Languages } from 'lucide-react';
import { permalinkSlug } from '@/utils/slug';
import { getMediaImage, imageFallbackFor } from '@/utils/mediaImages';

export default function GlassCard({ item, type }) {
  const mediaType = type || (item.seasons ? 'drama' : 'movie');
  const detailsUrl = `/${mediaType}/${permalinkSlug(item)}`;
  const rating = item.imdbRating || item.tmdbRating || 0;
  const posterImage = getMediaImage(item, 'card');
  const [imgSrc, setImgSrc] = useState(posterImage);

  useEffect(() => {
    setImgSrc(posterImage);
  }, [posterImage]);

  const subtitleSummary = item.subtitleSummary || {};
  const subtitleLanguages = subtitleSummary.languages || [];
  const progressLabel = subtitleSummary.progressLabel || (subtitleSummary.totalSubtitles ? `${subtitleSummary.totalSubtitles} subs` : 'No subs');
  const hasSubtitles = (subtitleSummary.totalSubtitles || 0) > 0;
  
  // Extract year
  const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;

  // Rating color scheme
  const getRatingBadgeClass = (val) => {
    if (val >= 8.0) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 text-glow-emerald';
    if (val >= 7.0) return 'bg-amber-500/20 border-amber-500/50 text-amber-400 text-glow-amber';
    return 'bg-slate-500/20 border-slate-500/50 text-slate-300';
  };

  return (
    <Link href={detailsUrl} prefetch={false} className="block relative group w-full min-w-0">
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        className="relative flex w-full min-w-0 flex-col"
      >
        {/* Poster Image Container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-luxury-900 border border-white/5 shadow-md shadow-black/40 group-hover:shadow-brand-primary/20 group-hover:border-brand-primary/30 transition-all duration-300">
          
          {/* Glow effect backdrops */}
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-950/75 via-luxury-950/10 to-transparent z-10 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

          {/* Poster Image */}
          <Image
            src={imgSrc}
            alt={item.title || 'Media Poster'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-[0.25, 0.8, 0.25, 1]"
            priority={false}
            onError={() => {
              const fallback = imageFallbackFor(item, 'poster');
              if (imgSrc !== fallback) {
                setImgSrc(fallback);
              }
            }}
          />

          {/* Top Badges — single balanced row: left=episode progress / new tag, right=IMDb rating */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 z-20">
            {/* Left: Episode progress or New tag */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.isNew && (
                <span className="h-5 px-1.5 inline-flex items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/25 backdrop-blur-md text-purple-200 text-[9px] font-black uppercase tracking-wider">
                  New
                </span>
              )}
              {mediaType === 'drama' && hasSubtitles ? (
                <span className={`h-5 px-1.5 inline-flex items-center justify-center rounded-full border backdrop-blur-md text-[9px] font-black uppercase tracking-wider ${
                  subtitleSummary.seasonStatus === 'Complete'
                    ? 'bg-rose-500/25 border-rose-500/40 text-rose-200'
                    : 'bg-emerald-500/25 border-emerald-500/40 text-emerald-200'
                }`}>
                  {progressLabel}
                </span>
              ) : (
                /* Empty placeholder to keep justify-between working when no left badge is present */
                (!item.isNew ? <span /> : null)
              )}
            </div>

            {/* Right: IMDb rating badge only */}
            <div className={`h-5 px-1.5 inline-flex items-center justify-center gap-1 rounded-full border backdrop-blur-md text-[9px] font-black uppercase tracking-wider ${getRatingBadgeClass(rating)}`}>
              <Star className="w-2.5 h-2.5 fill-current flex-shrink-0" />
              <span>{rating > 0 ? rating.toFixed(1) : 'NR'}</span>
            </div>
          </div>

          {/* Drama / Movie label — bottom-right floating pill, fades out on hover */}
          <div className="absolute bottom-3 right-3 z-20 transition-opacity duration-200 group-hover:opacity-0">
            <span className="px-2 py-0.5 bg-black/55 border border-white/10 backdrop-blur-md rounded-md text-white text-[9px] font-extrabold uppercase tracking-wider">
              {mediaType === 'drama' ? 'Drama' : 'Movie'}
            </span>
          </div>

          {/* Hover Details Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out z-30 flex flex-col gap-2">
            
            {/* Genre / Keywords tags if available */}
            {item.keywords && item.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.keywords.slice(0, 2).map((kw, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-slate-300 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h3 className="text-sm font-extrabold text-white leading-snug tracking-tight drop-shadow-md line-clamp-2">
              {item.title}
            </h3>

            {/* Original Title (if available and different) */}
            {item.originalTitle && item.originalTitle !== item.title && (
              <p className="text-[10px] text-slate-400 font-medium font-sans leading-none -mt-1 line-clamp-1 italic">
                {item.originalTitle}
              </p>
            )}

            {/* Meta details (Year, Country) */}
            <div className="flex min-w-0 items-center gap-2.5 text-[10px] text-slate-300 font-semibold mt-1">
              {releaseYear && (
                <span className="flex flex-shrink-0 items-center gap-1">
                  <Calendar className="w-3 h-3 text-brand-secondary" />
                  {releaseYear}
                </span>
              )}
              <span className="flex min-w-0 items-center gap-1">
                <Globe className="w-3 h-3 text-brand-accent" />
                <span className="truncate">{item.country === 'KR' ? 'South Korea' : item.country || 'Asian'}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {subtitleLanguages.length > 0 ? subtitleLanguages.map((language) => (
                <span key={language} className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 text-[9px] font-black uppercase inline-flex items-center gap-1">
                  <Languages className="w-2.5 h-2.5" /> {language}
                </span>
              )) : (
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase">
                  Sinhala / English
                </span>
              )}
            </div>

            {/* Download CTA Overlay Button */}
            <div className="mt-2 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-primary/20 transition-all duration-200">
              <Download className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-wider">Download</span>
            </div>

          </div>

          {/* Bottom dark gradient overlay for text readability (only active on hover states) */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Default Title & Meta shown below the poster */}
        <div className="mt-3 px-1 flex flex-col gap-1 text-left">
          <h3 className="text-xs font-bold text-slate-100 group-hover:text-brand-primary transition-colors line-clamp-1 leading-tight">
            {item.title}
          </h3>
          <div className="flex min-w-0 items-center justify-between gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex-shrink-0">{releaseYear || 'TBA'}</span>
            <span className="truncate text-right">
              {hasSubtitles 
                ? (subtitleLanguages.length > 0 ? subtitleLanguages.join(' | ') : 'Sinhala | English') 
                : item.country || 'KR'}
            </span>
          </div>
        </div>

      </motion.div>
    </Link>
  );
}
