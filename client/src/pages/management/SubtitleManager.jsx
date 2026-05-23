import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, Check, X, Clipboard, ExternalLink, Download
} from 'lucide-react';

export default function SubtitleManager() {
  const { admin } = useAuth();
  
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Note inputs
  const [moderatorNotes, setModeratorNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kd_admin_token');
      const res = await axios.get('/api/admin/subtitles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubtitles(res.data);
    } catch (err) {
      setError('Failed to fetch subtitles queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id);
    const notes = moderatorNotes[id] || '';
    
    try {
      const token = localStorage.getItem('kd_admin_token');
      await axios.put(`/api/admin/subtitles/${id}/approve`, {
        status,
        moderatorNotes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update locally
      setSubtitles(prev => prev.map(sub => 
        sub._id === id ? { ...sub, approvalStatus: status, moderatorNotes: notes } : sub
      ));
      
      // Clear notes field
      setModeratorNotes(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      alert('Failed to update subtitle approval state.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleNoteChange = (id, val) => {
    setModeratorNotes(prev => ({
      ...prev,
      [id]: val
    }));
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
            className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-brand-primary text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
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
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Subtitles Approvals Queue</h1>
            <p className="text-slate-400 text-xs mt-1">Review community subtitle uploads, verify formatting, and approve for live catalog stream</p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* List queue */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 text-slate-500">Checking pending streams...</div>
            ) : subtitles.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-luxury-900 border border-white/5 rounded-2xl">
                No community subtitle uploads found in database.
              </div>
            ) : (
              subtitles.map((sub) => (
                <div 
                  key={sub._id}
                  className="bg-luxury-900 border border-white/5 p-5 rounded-2xl flex flex-col lg:flex-row justify-between gap-6 hover:border-white/10 transition-colors"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold uppercase text-[9px] tracking-wider">
                        {sub.language}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono text-[9px] uppercase tracking-wider">
                        Format: {sub.format}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[9px]">
                        Ver: {sub.version}
                      </span>
                      
                      {/* Status indicator badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        sub.approvalStatus === 'Approved' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : sub.approvalStatus === 'Rejected' 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                            : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                      }`}>
                        {sub.approvalStatus}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 font-mono">MEDIA TARGET REF:</p>
                      <p className="text-sm font-extrabold text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-brand-primary" />
                        {sub.mediaType} ID: {sub.mediaId}
                      </p>
                    </div>

                    {sub.releaseNotes && (
                      <div className="bg-luxury-950/40 p-3 rounded-xl border border-white/5 text-xs text-slate-400">
                        <span className="font-bold text-slate-300 block mb-1">Uploader Notes:</span>
                        {sub.releaseNotes}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex gap-4">
                      <span>UPLOADER: <b className="text-slate-300">{sub.uploader?.username || 'Unknown'}</b> ({sub.uploader?.email || 'N/A'})</span>
                      <span>DATE: <b>{new Date(sub.createdAt).toLocaleString()}</b></span>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex flex-col justify-between w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Moderator Remarks</label>
                      <input
                        type="text"
                        placeholder="Add reason for approval/rejection..."
                        value={moderatorNotes[sub._id] || sub.moderatorNotes || ''}
                        disabled={sub.approvalStatus !== 'Pending'}
                        onChange={(e) => handleNoteChange(sub._id, e.target.value)}
                        className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary disabled:opacity-60"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-grow p-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-bold text-center border border-white/10 transition flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </a>
                      
                      {sub.approvalStatus === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            disabled={processingId === sub._id}
                            onClick={() => handleUpdateStatus(sub._id, 'Approved')}
                            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl transition"
                            title="Approve Subtitle"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            disabled={processingId === sub._id}
                            onClick={() => handleUpdateStatus(sub._id, 'Rejected')}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl transition"
                            title="Reject Subtitle"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      </main>

    </div>
  );
}
