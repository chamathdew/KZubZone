'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import apiClient from '@/services/api/apiClient';
import { Bell, X, Languages, RefreshCw, AlertCircle } from 'lucide-react';

const CACHE_KEY = 'admin_notif_v2';
const CACHE_TTL = 5 * 60 * 1000;

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
  const [toasts, setToasts] = useState([]);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const fetchMissing = useCallback(async (force = false) => {
    const cached = !force ? getCache() : null;
    if (cached) { setAlerts(cached); return; }

    setLoading(true);
    try {
      const res = await apiClient.get('/api/media/dramas?status=All&limit=50');
      const dramas = res.data.dramas || res.data || [];
      const missing = [];

      // Check up to 15 dramas (performance)
      await Promise.all(
        dramas.slice(0, 15).map(async (drama) => {
          try {
            const detail = await apiClient.get(`/api/media/dramas/${drama.slug}`);
            const episodes = detail.data.episodes || [];
            episodes.forEach((ep) => {
              const subCount = ep.subtitleCount ?? ep.subtitles?.length ?? 0;
              if (subCount === 0) {
                missing.push({
                  id: ep._id || `${drama._id}-s${ep.seasonNumber}e${ep.episodeNumber}`,
                  dramaTitle: drama.title,
                  dramaSlug: drama.slug,
                  season: ep.seasonNumber || 1,
                  episode: ep.episodeNumber || '?',
                  episodeTitle: ep.episodeTitle || ep.title || '',
                  poster: drama.poster || null,
                });
              }
            });
          } catch (_) {}
        })
      );

      // Sort: most recent episodes first (higher ep numbers)
      missing.sort((a, b) => Number(b.episode) - Number(a.episode));

      setAlerts(missing);
      setCache(missing);

      // Show toast for first 2 new alerts
      if (missing.length > 0) {
        missing.slice(0, 2).forEach((alert, i) => {
          setTimeout(() => {
            setToasts(prev => {
              if (prev.find(t => t.id === alert.id)) return prev;
              return [...prev, alert];
            });
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== alert.id));
            }, 7000);
          }, i * 700);
        });
      }
    } catch (err) {
      console.error('Notification fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissing();
    const iv = setInterval(() => fetchMissing(true), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchMissing]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      {/* Bell Button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/10 transition text-slate-400 hover:text-white flex-shrink-0"
        title="Subtitle Notifications"
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center leading-none shadow-lg">
            {alerts.length > 99 ? '99+' : alerts.length}
          </span>
        )}
      </button>

      {/* Notification Panel — FIXED position, always fully visible */}
      {open && (
        <div
          ref={panelRef}
          className="fixed z-[9999] w-[340px] max-h-[520px] bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/70 flex flex-col overflow-hidden"
          style={{
            top: btnRef.current
              ? btnRef.current.getBoundingClientRect().bottom + 8
              : 80,
            left: btnRef.current
              ? Math.min(
                  btnRef.current.getBoundingClientRect().left,
                  window.innerWidth - 356
                )
              : 16,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-white/[0.03] flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs font-black text-white uppercase tracking-wider">Subtitle Alerts</p>
                {alerts.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black">
                    {alerts.length} missing
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 ml-6">Episodes without Sinhala subtitles</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchMissing(true)}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : ''}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-grow">
            {loading && alerts.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
                <p className="text-xs">Scanning episodes...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <span className="text-3xl">✅</span>
                <p className="text-xs text-slate-400 font-bold">All episodes have subtitles!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition">
                    {/* Poster */}
                    {alert.poster ? (
                      <img
                        src={alert.poster}
                        alt=""
                        className="w-10 h-14 object-cover rounded-lg bg-white/5 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
                        <Languages className="w-4 h-4 text-brand-primary" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <p className="text-[11px] font-bold text-white leading-tight truncate">
                        {alert.dramaTitle}
                      </p>
                      <p className="text-[11px] font-black text-brand-secondary font-mono mt-0.5">
                        Season {alert.season} · Episode {alert.episode}
                      </p>
                      {alert.episodeTitle && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          "{alert.episodeTitle}"
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider">
                        <Languages className="w-2.5 h-2.5" />
                        No Subtitles
                      </span>
                    </div>

                    {/* Action */}
                    <Link
                      href="/management/subtitles"
                      onClick={() => setOpen(false)}
                      className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-primary text-[9px] font-black uppercase tracking-wider transition"
                    >
                      Import
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {alerts.length > 0 && (
            <div className="px-4 py-3 border-t border-white/8 bg-white/[0.02] flex-shrink-0">
              <Link
                href="/management/subtitles"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-8 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-wider transition"
              >
                <Languages className="w-3.5 h-3.5" />
                Go to Subtitle Import Panel
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Toast Bubbles — bottom right corner */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col-reverse gap-3 items-end pointer-events-none">
        {toasts.map((toast, i) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 bg-[#0f0f1a] border border-red-500/25 rounded-2xl shadow-2xl shadow-black/60 w-[300px]"
            style={{ animation: 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            {toast.poster && (
              <img src={toast.poster} alt="" className="w-9 h-12 object-cover rounded-lg flex-shrink-0" />
            )}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-wider text-red-400">Sub Needed</p>
              </div>
              <p className="text-xs font-bold text-white truncate leading-tight">{toast.dramaTitle}</p>
              <p className="text-[10px] text-brand-secondary font-mono font-bold mt-0.5">
                Season {toast.season} · Ep {toast.episode} — No subs yet
              </p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(32px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
