import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function HeroSlider({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="w-full h-[70vh] bg-luxury-900 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">No featured titles available...</span>
      </div>
    );
  }

  const current = items[currentIndex];
  const type = current.seasons ? 'drama' : 'movie';

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden group">
      
      {/* Backdrops */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current._id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={current.banner}
            alt={current.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-luxury-950 via-luxury-950/70 to-transparent w-full md:w-[60%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-transparent to-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl md:max-w-2xl text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={current._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
              >
                {/* Background glow card effect */}
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-brand-primary/20 rounded-full blur-2xl glow-pulsing" />

                {/* Score badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-brand-accent/20 border border-brand-accent/50 text-brand-accent text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" /> {current.tmdbRating.toFixed(1)} TMDB
                  </span>
                  {current.country && (
                    <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-semibold uppercase tracking-wider rounded-full">
                      {current.country}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-brand-primary/20 border border-brand-primary/50 text-brand-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {type}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                  {current.title}
                </h1>
                {current.originalTitle && current.originalTitle !== current.title && (
                  <p className="text-sm font-semibold text-slate-400 mb-4">{current.originalTitle}</p>
                )}

                {/* Synopsis AI generated */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 line-clamp-3">
                  {current.synopsisRewrite || current.description}
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/${type}/${current.slug}`)}
                    className="h-11 px-6 bg-white text-black hover:bg-brand-primary hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition shadow-xl"
                  >
                    <Play className="w-4 h-4 fill-current" /> Watch Info
                  </button>
                  <button
                    onClick={() => navigate(`/${type}/${current.slug}#reviews`)}
                    className="h-11 px-5 border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center transition"
                  >
                    Read Reviews
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Nav Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/5 bg-black/30 hover:bg-brand-primary/80 text-white transition z-25 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/5 bg-black/30 hover:bg-brand-primary/80 text-white transition z-25 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-25">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-6 bg-brand-primary' : 'w-1.5 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
