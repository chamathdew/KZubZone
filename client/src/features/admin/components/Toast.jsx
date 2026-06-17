'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      
      {/* Toast Portal/Overlay Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertCircle : Info;
            const borderColors = {
              success: 'border-l-emerald-500 border-emerald-500/10',
              error: 'border-l-red-500 border-red-500/10',
              info: 'border-l-blue-500 border-blue-500/10'
            };
            const iconColors = {
              success: 'text-emerald-400 bg-emerald-500/10',
              error: 'text-red-400 bg-red-500/10',
              info: 'text-blue-400 bg-blue-500/10'
            };

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto w-full bg-luxury-900 border border-white/5 border-l-4 rounded-xl p-4 shadow-glass-neon flex gap-3.5 items-start justify-between select-none relative overflow-hidden ${borderColors[t.type] || borderColors.success}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors[t.type] || iconColors.success}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                
                <div className="flex-1 min-w-0 pr-2 pt-0.5">
                  <p className="text-xs font-bold text-slate-100 leading-relaxed break-words">
                    {t.message}
                  </p>
                </div>

                <button
                  onClick={() => remove(t.id)}
                  className="text-slate-500 hover:text-slate-300 transition p-1 hover:bg-white/5 rounded-lg flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Shimmer countdown progress bar */}
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: t.duration / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-0.5 ${
                    t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
