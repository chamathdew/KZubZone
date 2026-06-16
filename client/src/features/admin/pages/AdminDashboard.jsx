'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import apiClient from '@/services/api/apiClient';
import {
  Film, Tv, Users, Languages, Star, TrendingUp, Search,
  Settings, Database, Award, ShieldAlert, LogOut, CheckCircle, BookOpenText, Bell, Clapperboard, CalendarCheck2, AlertTriangle
} from 'lucide-react';
import AdminSidebar from '@/features/admin/components/AdminSidebar';

export default function AdminDashboard() {
  const { admin, logoutAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {

        const res = await apiClient.get('/api/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-950 flex items-center justify-center text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Control Dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate coordinates for a custom SVG line graph of traffic views
  const renderTrafficGraph = () => {
    if (!stats || !stats.trafficLogs || stats.trafficLogs.length === 0) return null;
    
    const logs = stats.trafficLogs;
    const maxVal = Math.max(...logs.map(l => l.views), 100);
    const height = 140;
    const width = 500;
    const padding = 20;

    const points = logs.map((log, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (logs.length - 1);
      const y = height - padding - ((log.views / maxVal) * (height - padding * 2));
      return { x, y, ...log };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative w-full h-[180px] glass-panel rounded-2xl p-4 border border-white/5 overflow-hidden bg-white/[0.02] shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Site Traffic Analytics</h3>
          <span className="text-[10px] text-brand-primary font-mono font-bold">5 Days View Window</span>
        </div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[110px] overflow-visible">
          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#c9184a" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

          {/* Area under the line */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#c9184a" stroke="#120D1A" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#7c3aed" opacity="0" className="hover:opacity-20 transition-opacity" />
              <title>{`${p.date}: ${p.views} views (${p.uniqueVisitors} unique)`}</title>
            </g>
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-500 px-3">
          {logs.map((l, i) => (
            <span key={i}>{l.date.split('-').slice(1).join('/')}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      
      <AdminSidebar />

      {/* Primary Details Panel */}
      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Dashboard Overview</h1>
              <p className="text-slate-400 text-xs mt-1 font-medium">Real-time Korean content analytics and system states</p>
            </div>
            
            {/* SEO Health Circle */}
            <div className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-2xl shadow-md border border-white/5 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                {stats?.seoHealthScore || 98}%
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-300">SEO Health Index</div>
                <div className="text-[9px] text-slate-500 font-medium">Google Schema Validated</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* Movies */}
            <div className="glass-panel hover:border-violet-500/35 hover:bg-white/[0.04] transition-all duration-300 p-4 rounded-2xl flex items-center gap-3 group border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 group-hover:scale-110 transition-transform duration-300">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Movies</h4>
                <p className="text-lg font-black font-mono text-white mt-0.5">{stats?.counts?.totalMovies || 0}</p>
              </div>
            </div>

            {/* Dramas */}
            <div className="glass-panel hover:border-fuchsia-500/35 hover:bg-white/[0.04] transition-all duration-300 p-4 rounded-2xl flex items-center gap-3 group border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="p-2.5 bg-fuchsia-500/10 rounded-xl text-fuchsia-400 group-hover:scale-110 transition-transform duration-300">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Dramas</h4>
                <p className="text-lg font-black font-mono text-white mt-0.5">{stats?.counts?.totalDramas || 0}</p>
              </div>
            </div>

            {/* Episodes */}
            <div className="glass-panel hover:border-sky-500/35 hover:bg-white/[0.04] transition-all duration-300 p-4 rounded-2xl flex items-center gap-3 group border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Episodes</h4>
                <p className="text-lg font-black font-mono text-white mt-0.5">{stats?.counts?.totalEpisodes || 0}</p>
              </div>
            </div>

            {/* Members */}
            <div className="glass-panel hover:border-indigo-500/35 hover:bg-white/[0.04] transition-all duration-300 p-4 rounded-2xl flex items-center gap-3 group border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Members</h4>
                <p className="text-lg font-black font-mono text-white mt-0.5">{stats?.counts?.totalUsers || 0}</p>
              </div>
            </div>

            {/* Subtitles */}
            <div className="glass-panel hover:border-emerald-500/35 hover:bg-white/[0.04] transition-all duration-300 p-4 rounded-2xl flex items-center gap-3 group border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Subtitles</h4>
                <p className="text-lg font-black font-mono text-white mt-0.5">{stats?.counts?.totalSubtitles || 0}</p>
              </div>
            </div>

            {/* Reviews */}
            <div className="glass-panel hover:border-amber-500/35 hover:bg-white/[0.04] transition-all duration-300 p-4 rounded-2xl flex items-center gap-3 group border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Reviews</h4>
                <p className="text-lg font-black font-mono text-white mt-0.5">{stats?.counts?.totalReviews || 0}</p>
              </div>
            </div>
          </div>

          {/* Episode Subtitle Notification Panel */}
          {stats?.upcomingEpisodes && stats.upcomingEpisodes.length > 0 && (() => {
            const urgentEps = stats.upcomingEpisodes.filter(ep => !ep.hasSubtitles);
            return (
              <div className="mb-8 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/8 via-orange-500/5 to-amber-500/8 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-amber-500/15">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">Episode Subtitle Status</span>
                    {urgentEps.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-[9px] font-black uppercase tracking-wider animate-pulse">
                        {urgentEps.length} Missing Subtitles
                      </span>
                    )}
                  </div>
                  <Link href="/management/dramas" className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition uppercase tracking-wider">
                    Manage Dramas →
                  </Link>
                </div>
                <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
                  {stats.upcomingEpisodes.map((ep) => {
                    const now = new Date();
                    const airDate = ep.airDate ? new Date(ep.airDate) : null;
                    const daysUntil = airDate ? Math.ceil((airDate - now) / (1000 * 60 * 60 * 24)) : null;
                    const formattedDate = airDate
                      ? airDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No date set';

                    let countdownLabel = '';
                    let countdownClass = 'bg-white/5 text-slate-500';
                    if (daysUntil !== null) {
                      if (ep.isUpcoming) {
                        countdownLabel = daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `In ${daysUntil}d`;
                        countdownClass = daysUntil <= 1 ? 'bg-red-500/20 text-red-300' : daysUntil <= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-violet-500/15 text-violet-300';
                      } else {
                        const daysAgo = Math.abs(daysUntil);
                        countdownLabel = daysAgo === 0 ? 'TODAY' : `${daysAgo}d ago`;
                        countdownClass = daysAgo <= 3 ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-slate-400';
                      }
                    }

                    return (
                      <div key={ep._id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${!ep.hasSubtitles ? 'bg-red-500/[0.04] hover:bg-red-500/[0.07]' : 'hover:bg-white/[0.02]'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ep.hasSubtitles ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          <Clapperboard className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {ep.dramaTitle} — <span className="text-slate-400">Ep {ep.episodeNumber}</span>
                            {ep.episodeTitle && ep.episodeTitle.toLowerCase() !== `episode ${ep.episodeNumber}`.toLowerCase() && (
                              <span className="text-slate-500"> ({ep.episodeTitle})</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <CalendarCheck2 className="w-3 h-3" />
                            {ep.isUpcoming ? '🔵 Upcoming — ' : '⚡ Aired — '}{formattedDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!ep.hasSubtitles ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-[9px] font-black uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5" /> Add Subs
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                              <CheckCircle className="w-2.5 h-2.5" /> Ready
                            </span>
                          )}
                          {countdownLabel && (
                            <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg ${countdownClass}`}>
                              {countdownLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Graphs and Side Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Graph Panel */}
            <div className="lg:col-span-2 space-y-6">
              {renderTrafficGraph()}

              {/* Top content list */}
              <div className="glass-panel rounded-2xl p-6 shadow-md border border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-primary" /> Most Visited Titles
                </h3>
                
                {stats?.topContent && stats.topContent.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {stats.topContent.map((media, idx) => (
                      <div key={idx} className="py-3.5 flex justify-between items-center gap-4 text-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}.</span>
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {media.type}
                          </span>
                          <span className="text-slate-200 font-bold truncate">{media.title}</span>
                        </div>
                        <div className="flex items-center gap-6 font-mono text-xs flex-shrink-0">
                          <div className="text-slate-400">
                            <span className="text-slate-500 text-[10px] mr-1">RATING:</span>
                            <span className="text-brand-accent font-bold">{media.tmdbRating || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] mr-1">VIEWS:</span>
                            <span className="text-slate-100 font-bold">{media.viewCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No traffic recorded on movies or dramas yet.</p>
                )}
              </div>
            </div>

            {/* Right Trending Widget Panel */}
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6 shadow-md border border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-accent" /> Hot Searches Logs
                </h3>

                {stats?.trendingSearches && stats.trendingSearches.length > 0 ? (
                  <div className="space-y-3">
                    {stats.trendingSearches.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-mono py-1">
                        <span className="text-slate-300 font-medium">"{s.query}"</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold">
                          {s.count} queries
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-8 text-center">No user searches logged yet.</p>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-md border border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-brand-primary" /> Admin Actions
                </h3>
                
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <Link 
                    href="/management/import" 
                    className="w-full p-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:brightness-110 text-white font-black text-center rounded-xl transition shadow-lg shadow-brand-primary/15 uppercase tracking-wider"
                  >
                    Launch Importer
                  </Link>
                  <Link 
                    href="/management/articles" 
                    className="w-full p-3.5 bg-white/[0.03] hover:bg-white/[0.07] text-slate-200 font-bold text-center border border-white/10 rounded-xl transition uppercase tracking-wider"
                  >
                    Write Article
                  </Link>
                  <Link 
                    href="/" 
                    className="w-full p-3.5 bg-white/[0.03] hover:bg-white/[0.07] text-slate-200 font-bold text-center border border-white/10 rounded-xl transition uppercase tracking-wider"
                  >
                    View Frontend Main App
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
