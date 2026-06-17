'use client';

/**
 * AdminNotifications - Client-side notification system
 * Checks for recently released episodes without subtitles
 * using only existing public API endpoints (no PHP changes needed)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import apiClient from '@/services/api/apiClient';
import { Bell, X, Languages, ChevronRight, RefreshCw } from 'lucide-react';

const CACHE_KEY = 'admin_notif_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
}

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]); // floating bubbles
  const panelRef = useRef(null);
  const prevCountRef = useRef(0);

  const fetchMissingSubtitles = useCallback(async (force = false) => {
    const cached = !force ? getCache() : null;
    if (cached) { setAlerts(cached); return; }

    setLoading(true);
    try {
      // Get all dramas (public endpoint — no auth needed)
      const res = await apiClient.get('/api/media/dramas?status=All&limit=100');
      const dramas = res.data.dramas || res.data || [];

      const missing = [];

      // Check each drama for episodes without subtitles
      await Promise.all(
        dramas.slice(0, 20).map(async (drama) => {
          try {
            const detail = await apiClient.get(`/api/media/dramas/${drama.slug}`);
            const episodes = detail.data.episodes || [];
            // Look for episodes with no subtitles
            episodes.forEach((ep) => {
              const hasSub = ep.subtitleCount > 0 || (ep.subtitles && ep.subtitles.length > 0);
              if (!hasSub) {
                missing.push({
                  id: ep._id || `${drama._id}_ep${ep.episodeNumber}`,
                  dramaTitle: drama.title,
                  dramaSlug: drama.slug,
                  season: ep.seasonNumber || 1,
                  episode: ep.episodeNumber,
                  episodeTitle: ep.episodeTitle || ep.title || `Episode ${ep.episodeNumber}`,
                  poster: drama.poster,
                });
              }
            });
          } catch (_) {}
        })
      );

      // Sort: higher episode numbers first (most recent)
      missing.sort((a, b) => b.episode - a.episode);
      setAlerts(missing);
      setCache(missing);

      // Show toast bubbles for NEW alerts (not seen before)
      const newCount = missing.length;
      if (newCount > 0 && newCount > prevCountRef.current) {
        const newOnes = missing.slice(0, Math.min(3, newCount - prevCountRef.current));
        newOnes.forEach((alert, i) => {
          setTimeout(() => {
            setToasts(prev => [...prev.filter(t => t.id !== alert.id), { ...alert, shown: true }]);
            // Auto-dismiss after 6s
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== alert.id));
            }, 6000);
          }, i * 600);
        });
      }
      prevCountRef.current = newCount;
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissingSubtitles();
    // Poll every 5 minutes
    const interval = setInterval(() => fetchMissingSubtitles(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMissingSubtitles]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <>
      {/* Bell trigger button */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => { setOpen(o => !o); }}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] transition text-slate-400 hover:text-white"
          title="Subtitle Notifications"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-secondary text-[9px] font-black text-white flex items-center justify-center leading-none animate-pulse">
              {alerts.length > 99 ? '99+' : alerts.length}
            </span>
          )}
        </button>

        {/* Dropdown notification panel */}
        {open && (
          <div className="absolute left-0 top-11 w-80 max-h-[420px] bg-luxury-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-[200] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-luxury-950/40">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Subtitle Alerts</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Episodes missing Sinhala subs</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchMissingSubtitles(true)}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Alert List */}
            <div className="overflow-y-auto flex-grow">
              {loading && alerts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
                  Checking episodes...
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <span className="text-2xl">✅</span>
                  All episodes have subtitles!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href="/management/subtitles"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition group"
                    >
                      {alert.poster ? (
                        <img src={alert.poster} alt="" className="w-8 h-11 object-cover rounded bg-luxury-950 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-11 rounded bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
                          <Languages className="w-3.5 h-3.5 text-brand-primary" />
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{alert.dramaTitle}</p>
                        <p className="text-[10px] text-brand-secondary font-mono mt-0.5">
                          S{String(alert.season).padStart(2,'0')}E{String(alert.episode).padStart(2,'0')} · {alert.episodeTitle}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider">
                          <Languages className="w-2.5 h-2.5" /> No Subs
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/5 bg-luxury-950/20">
                <Link
                  href="/management/subtitles"
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 transition uppercase tracking-wider"
                >
                  Import Subtitles →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Toast Bubbles (bottom-right) */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-luxury-900 border border-brand-secondary/30 rounded-2xl shadow-2xl shadow-black/60 max-w-sm"
            style={{ animation: 'slideInToast 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            {toast.poster && (
              <img src={toast.poster} alt="" className="w-8 h-11 object-cover rounded flex-shrink-0" />
            )}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse flex-shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-secondary">Subtitle Needed</p>
              </div>
              <p className="text-xs font-bold text-white truncate">{toast.dramaTitle}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                S{String(toast.season).padStart(2,'0')}E{String(toast.episode).padStart(2,'0')} released · No subs yet
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </>
  );
}
