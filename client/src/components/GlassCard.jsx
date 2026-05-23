import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Play, Calendar, Globe } from 'lucide-react';

export default function GlassCard({ item, type }) {
  const mediaType = type || (item.seasons ? 'drama' : 'movie');
  const detailsUrl = `/${mediaType}/${item.slug}`;
  const rating = item.tmdbRating || 0;
  
  // Extract year
  const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;

  // Rating color scheme
  const getRatingBadgeClass = (val) => {
    if (val >= 8.0) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 text-glow-emerald';
    if (val >= 7.0) return 'bg-amber-500/20 border-amber-500/50 text-amber-400 text-glow-amber';
    return 'bg-slate-500/20 border-slate-500/50 text-slate-300';
  };

  return (
    <Link to={detailsUrl} className="block relative group w-full">
      <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        className="relative overflow-hidden rounded-2xl aspect-[2/3] bg-luxury-900 border border-white/5 shadow-md shadow-black/40 group-hover:shadow-brand-primary/20 group-hover:border-brand-primary/30 transition-shadow duration-300 flex flex-col"
      >
        {/* Glow effect backdrops */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/40 to-transparent z-10 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Poster Image */}
        <img
          src={item.poster}
          alt={item.title}
          className="w-full h-full object-cover transform scale-100 group-hover:scale-108 transition-transform duration-700 ease-[0.25, 0.8, 0.25, 1]"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 transition-all duration-300">
          {/* Rating Badge */}
          <div className={`px-2 py-0.5 border backdrop-blur-md rounded-lg flex items-center gap-1 font-sans ${getRatingBadgeClass(rating)}`}>
            <Star className="w-2.5 h-2.5 fill-current" />
            <span className="text-[10px] font-black">{rating > 0 ? rating.toFixed(1) : 'NR'}</span>
          </div>

          {/* Subtitle / Quality Badge */}
          <div className="px-2 py-0.5 bg-black/60 border border-white/10 backdrop-blur-md rounded-lg text-white text-[9px] font-extrabold uppercase tracking-wider">
            {mediaType === 'drama' ? 'Drama' : 'Movie'}
          </div>
        </div>

        {/* Hover Details Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20 flex flex-col gap-2">
          
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
          <div className="flex items-center gap-2.5 text-[10px] text-slate-300 font-semibold mt-1">
            {releaseYear && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-secondary" />
                {releaseYear}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-brand-accent" />
              {item.country === 'KR' ? 'South Korea' : item.country || 'Asian'}
            </span>
          </div>

          {/* Play CTA Overlay Button */}
          <div className="mt-2 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-primary/20 transition-all duration-200">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Watch Now</span>
          </div>

        </div>

        {/* Default Title & Meta shown before hover (fades out on hover) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-15 flex flex-col gap-1 transition-opacity duration-200 group-hover:opacity-0 text-left">
          <h4 className="text-xs font-bold text-white line-clamp-1 leading-tight">
            {item.title}
          </h4>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span>{releaseYear || 'TBA'}</span>
            <span>{item.country || 'KR'}</span>
          </div>
        </div>

      </motion.div>
    </Link>
  );
}

