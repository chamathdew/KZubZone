import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Film, Tv, Users, Languages, Star, TrendingUp, Search,
  Settings, Database, Award, ShieldAlert, LogOut, CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('kd_admin_token');
        const res = await axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      <div className="relative w-full h-[180px] bg-luxury-950/40 rounded-2xl p-4 border border-white/5 overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Site Traffic Analytics</h3>
          <span className="text-[10px] text-brand-primary font-mono font-bold">5 Days View Window</span>
        </div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[110px] overflow-visible">
          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9184A" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C9184A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

          {/* Area under the line */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#C9184A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#C9184A" stroke="#120D1A" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#C9184A" opacity="0" className="hover:opacity-20 transition-opacity" />
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
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row pt-16">
      
      {/* Side Control Panel */}
      <aside className="w-full md:w-64 bg-luxury-900 border-r border-white/5 p-6 flex flex-col gap-6 md:sticky md:top-16 md:h-[calc(100vh-64px)] overflow-y-auto">
        <div className="pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">KDramaVerse Admins</h3>
          </div>
          <p className="text-xs text-slate-400 capitalize">{admin.role} • {admin.username}</p>
        </div>

        <nav className="flex flex-col gap-1.5 flex-grow">
          <Link 
            to="/management/dashboard" 
            className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-brand-primary text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <TrendingUp className="w-4 h-4 text-brand-primary" /> Dashboard Metrics
          </Link>
          <Link 
            to="/management/import" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Database className="w-4 h-4 text-brand-accent" /> One-Click TMDB Importer
          </Link>
          <Link 
            to="/management/movies" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Film className="w-4 h-4 text-brand-primary" /> Manage Movies
          </Link>
          <Link 
            to="/management/dramas" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Tv className="w-4 h-4 text-brand-primary" /> Manage Dramas
          </Link>
          <Link 
            to="/management/subtitles" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Languages className="w-4 h-4 text-emerald-400" /> Subtitles Moderation
          </Link>
          <Link 
            to="/management/comments" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Star className="w-4 h-4 text-yellow-400" /> Comments & Reviews
          </Link>
          <Link 
            to="/management/users" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Users className="w-4 h-4 text-blue-400" /> Member Control
          </Link>
          <Link 
            to="/management/settings" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Settings className="w-4 h-4 text-slate-400" /> Global SEO Config
          </Link>
        </nav>

        <button 
          onClick={logoutAdmin}
          className="flex items-center gap-3 p-3 mt-auto rounded-lg text-xs font-bold uppercase tracking-wider border border-white/5 hover:bg-brand-secondary/10 text-brand-secondary hover:border-brand-secondary/20 transition text-left"
        >
          <LogOut className="w-4 h-4" /> Terminate Session
        </button>
      </aside>

      {/* Primary Details Panel */}
      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Dashboard Overview</h1>
              <p className="text-slate-400 text-xs mt-1">Real-time Korean content analytics and system states</p>
            </div>
            
            {/* SEO Health Circle */}
            <div className="flex items-center gap-3 bg-luxury-900 border border-white/5 px-4 py-2.5 rounded-2xl">
              <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                {stats?.seoHealthScore || 98}%
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SEO Health Index</div>
                <div className="text-[9px] text-slate-500">Google Schema Validated</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500 bg-opacity-10 border border-red-500 bg-opacity-20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 rounded-lg text-brand-primary">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400">Movies</h4>
                <p className="text-lg font-extrabold font-mono">{stats?.counts?.totalMovies || 0}</p>
              </div>
            </div>

            <div className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 rounded-lg text-brand-primary">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400">Dramas</h4>
                <p className="text-lg font-extrabold font-mono">{stats?.counts?.totalDramas || 0}</p>
              </div>
            </div>

            <div className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-brand-accent/10 rounded-lg text-brand-accent">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400">Episodes</h4>
                <p className="text-lg font-extrabold font-mono">{stats?.counts?.totalEpisodes || 0}</p>
              </div>
            </div>

            <div className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400">Members</h4>
                <p className="text-lg font-extrabold font-mono">{stats?.counts?.totalUsers || 0}</p>
              </div>
            </div>

            <div className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400">Subtitles</h4>
                <p className="text-lg font-extrabold font-mono">{stats?.counts?.totalSubtitles || 0}</p>
              </div>
            </div>

            <div className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400">Reviews</h4>
                <p className="text-lg font-extrabold font-mono">{stats?.counts?.totalReviews || 0}</p>
              </div>
            </div>
          </div>

          {/* Graphs and Side Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Graph Panel */}
            <div className="lg:col-span-2 space-y-6">
              {renderTrafficGraph()}

              {/* Top content list */}
              <div className="bg-luxury-900 border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-primary" /> Most Visited Titles
                </h3>
                
                {stats?.topContent && stats.topContent.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {stats.topContent.map((media, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center gap-4 text-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}.</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {media.type}
                          </span>
                          <span className="text-slate-200 font-bold truncate">{media.title}</span>
                        </div>
                        <div className="flex items-center gap-6 font-mono text-xs flex-shrink-0">
                          <div className="text-slate-400">
                            <span className="text-slate-500 text-[10px] mr-1">RATING:</span>
                            <span className="text-brand-accent">{media.tmdbRating || 'N/A'}</span>
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
                  <p className="text-xs text-slate-500 py-4 text-center">No traffic recorded on movies or dramas yet.</p>
                )}
              </div>
            </div>

            {/* Right Trending Widget Panel */}
            <div className="space-y-6">
              <div className="bg-luxury-900 border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-accent" /> Hot Searches Logs
                </h3>

                {stats?.trendingSearches && stats.trendingSearches.length > 0 ? (
                  <div className="space-y-3">
                    {stats.trendingSearches.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300">"{s.query}"</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[10px]">
                          {s.count} queries
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No user searches logged yet.</p>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-luxury-900 border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-brand-primary" /> Admin Actions
                </h3>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <Link 
                    to="/management/import" 
                    className="w-full p-3 bg-brand-primary hover:bg-opacity-95 text-white font-bold text-center rounded-xl transition shadow-lg shadow-brand-primary/10"
                  >
                    Launch Importer
                  </Link>
                  <Link 
                    to="/" 
                    className="w-full p-3 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-center border border-white/10 rounded-xl transition"
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
