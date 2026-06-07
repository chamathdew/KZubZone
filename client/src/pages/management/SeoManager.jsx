import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import AdminSidebar from '../../components/layout/AdminSidebar';
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

    try {
      const res = await apiClient.get('/api/admin/settings');
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

    try {
      await apiClient.post('/api/admin/settings', {
        key: key.trim(),
        value: value.trim()
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
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

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
