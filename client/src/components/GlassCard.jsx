import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Play } from 'lucide-react';

export default function GlassCard({ item, type }) {
  const mediaType = type || (item.seasons ? 'drama' : 'movie');
  const detailsUrl = `/${mediaType}/${item.slug}`;

  return (
    <Link to={detailsUrl} className="block relative group">
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl glass-panel aspect-[2/3] border border-white/5 shadow-lg group-hover:shadow-glass-neon group-hover:border-brand-primary/25"
      >
        {/* Poster Image */}
        <img
          src={item.poster}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Backdrop Dark Filter */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-left" />

        {/* Hover details overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 text-left">
          
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="px-2 py-0.5 bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-[9px] font-black rounded-md flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" /> {item.tmdbRating ? item.tmdbRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-[10px] text-slate-400 capitalize font-medium">
              {item.country || 'KR'} • {item.language || 'ko'}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">
            {item.title}
          </h3>
          
          {/* Subtitle tag */}
          <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">
            {mediaType === 'drama' ? 'TV Drama' : 'Movie'}
          </p>

          {/* Play Circle Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg transform scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </div>

        </div>

        {/* Default top/right score badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 opacity-100 group-hover:opacity-0 transition-opacity duration-200">
          <Star className="w-2.5 h-2.5 text-brand-accent fill-current" />
          <span className="text-[10px] font-black text-white">{item.tmdbRating ? item.tmdbRating.toFixed(1) : '0.0'}</span>
        </div>

      </motion.div>
    </Link>
  );
}
