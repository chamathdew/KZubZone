import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, Search, Download, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function TmdbImport() {
  const { admin } = useAuth();
  
  const [query, setQuery] = useState('');
  const [type, setType] = useState('movie'); // 'movie' or 'tv'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Import state
  const [importingId, setImportingId] = useState(null);
  const [importSuccess, setImportSuccess] = useState('');
  const [importError, setImportError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setImportSuccess('');
    setImportError('');
    setResults([]);

    try {
      const token = localStorage.getItem('kd_admin_token');
      const res = await axios.get(`/api/admin/tmdb/search`, {
        params: { query, type },
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data);
      if (res.data.length === 0) {
        setError('No items found matching search terms.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (tmdbId) => {
    setImportingId(tmdbId);
    setImportSuccess('');
    setImportError('');

    try {
      const token = localStorage.getItem('kd_admin_token');
      const res = await axios.post(`/api/admin/tmdb/import`, 
        { id: tmdbId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImportSuccess(res.data.message || 'Import operation completed successfully!');
      
      // Remove imported item from search list
      setResults(prev => prev.filter(item => item.id !== tmdbId));
    } catch (err) {
      setImportError(err.response?.data?.message || 'Cascading import failed.');
    } finally {
      setImportingId(null);
    }
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
          <p className="text-xs text-slate-400 capitalize">{admin?.role} • {admin?.username}</p>
        </div>

        <nav className="flex flex-col gap-1.5">
          <Link 
            to="/management/dashboard" 
            className="flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <TrendingUp className="w-4 h-4 text-brand-primary" /> Dashboard Metrics
          </Link>
          <Link 
            to="/management/import" 
            className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-brand-primary text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
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
      </aside>

      {/* Primary Details Panel */}
      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">TMDB Metadata Importer</h1>
            <p className="text-slate-400 text-xs mt-1">Search TMDB Korean catalog to seed records with complete details instantly</p>
          </div>

          {/* Form */}
          <div className="bg-luxury-900 border border-white/5 p-6 rounded-2xl mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow relative">
                <input
                  type="text"
                  required
                  placeholder={type === 'movie' ? "Search K-Movies (e.g. Train to Busan, Parasite)..." : "Search K-Dramas (e.g. Moving, Goblin)..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-12 bg-luxury-950 border border-white/10 rounded-xl focus:border-brand-primary outline-none text-slate-200 text-sm transition"
                />
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              </div>

              {/* Selector */}
              <div className="flex bg-luxury-950 border border-white/10 p-1.5 rounded-xl self-start sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setType('movie')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    type === 'movie' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Movies
                </button>
                <button
                  type="button"
                  onClick={() => setType('tv')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    type === 'tv' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TV Series
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 h-12 bg-brand-primary hover:bg-opacity-90 disabled:bg-opacity-50 text-white font-bold rounded-xl text-sm transition self-stretch flex items-center justify-center gap-2"
              >
                {loading ? 'Searching...' : 'Find Matches'}
              </button>
            </form>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="p-4 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-4 mb-6 rounded-xl bg-emerald-500 bg-opacity-10 border border-emerald-500 border-opacity-20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {importError && (
            <div className="p-4 mb-6 rounded-xl bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Results grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Results</h3>
            
            {loading ? (
              <div className="text-center py-16 text-slate-500">Querying metadata provider...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 bg-luxury-900/20 rounded-2xl border border-white/5 text-slate-500 text-sm">
                Matches from TMDB will appear here. If the TMDB API is offline or key is missing, premium simulated matches will automatically load!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-luxury-900 border border-white/5 p-4 rounded-xl flex gap-4 transition-all hover:border-brand-primary/20"
                  >
                    <img
                      src={item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w185${item.poster_path}`) : 'https://placehold.co/120x180/111/fff?text=No+Photo'}
                      alt={item.title}
                      className="w-20 h-28 object-cover rounded-lg bg-luxury-950 flex-shrink-0 border border-white/5"
                    />
                    
                    <div className="flex-grow flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-sm text-slate-100 truncate">{item.title}</h4>
                          <span className="text-[10px] text-brand-primary font-mono bg-brand-primary/10 px-1.5 py-0.5 rounded border border-brand-primary/20 flex-shrink-0 uppercase">
                            Rating: {item.vote_average || 'N/A'}
                          </span>
                        </div>
                        
                        {item.original_title && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.original_title}</p>
                        )}
                        
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {item.overview || 'No description available from TMDB.'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono">
                          RELEASE: {item.release_date || 'Unknown'}
                        </span>
                        
                        <button
                          onClick={() => handleImport(item.id)}
                          disabled={importingId === item.id}
                          className="px-3.5 py-1.5 bg-brand-primary hover:bg-opacity-95 disabled:bg-opacity-50 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1.5"
                        >
                          {importingId === item.id ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Cascading...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              One-Click Import
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}
