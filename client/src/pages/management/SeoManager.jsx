import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, ShieldCheck, CheckCircle
} from 'lucide-react';

export default function SeoManager() {
  const { admin } = useAuth();
  
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom setting form fields
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('kd_admin_token');
    try {
      const res = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      setError('Failed to fetch settings record list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('kd_admin_token');
    try {
      await axios.post('/api/admin/settings', {
        key: key.trim(),
        value: value.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Setting saved successfully!');
      setKey('');
      setValue('');
      fetchSettings();
    } catch (err) {
      setError('Failed to save settings to database.');
    } finally {
      setSaving(false);
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
            className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-brand-primary text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            <Settings className="w-4 h-4 text-slate-400" /> Global SEO Config
          </Link>
        </nav>
      </aside>

      {/* Primary Details Panel */}
      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">System Settings & API Keys</h1>
            <p className="text-slate-400 text-xs mt-1">Configure global platform attributes, TMDB API endpoints, and dynamic metadata attributes</p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Input Form */}
            <div className="bg-luxury-900 border border-white/5 p-6 rounded-2xl h-fit">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Configure Key-Value
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Setting Key Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TMDB_API_KEY, AI_MODEL_FLAG"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Setting Value</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter configuration value..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-brand-primary hover:bg-opacity-95 text-white font-bold rounded-xl text-xs transition"
                >
                  {saving ? 'Saving...' : 'Save Config Key'}
                </button>
              </form>
            </div>

            {/* Right: Active Settings */}
            <div className="lg:col-span-2 bg-luxury-900 border border-white/5 p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Active System Setting Parameter Registers
              </h3>

              {loading ? (
                <div className="text-slate-500 text-xs text-center py-6">Checking settings...</div>
              ) : settings.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">No custom configurations registered. Use the left panel to seed settings!</p>
              ) : (
                <div className="space-y-4 font-mono text-xs">
                  {settings.map((item) => (
                    <div 
                      key={item._id}
                      className="p-3 bg-luxury-950/60 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                    >
                      <div>
                        <span className="text-brand-accent font-bold block sm:inline">{item.key}:</span>
                        <span className="text-slate-300 ml-0 sm:ml-2 break-all">{item.value}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        Updated: {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
