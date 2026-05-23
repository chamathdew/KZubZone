import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, Trash2, MessageSquare, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function ReviewManager() {
  const { admin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'comments'
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('kd_admin_token');
    
    try {
      if (activeTab === 'reviews') {
        const res = await axios.get('/api/admin/reviews', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(res.data);
      } else {
        const res = await axios.get('/api/admin/comments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComments(res.data);
      }
    } catch (err) {
      setError('Failed to fetch discussion queue records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this user review permanently?')) return;
    try {
      const token = localStorage.getItem('kd_admin_token');
      await axios.delete(`/api/admin/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Delete operation failed.');
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Delete this comment and its replies permanently?')) return;
    try {
      const token = localStorage.getItem('kd_admin_token');
      await axios.delete(`/api/admin/comments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Delete operation failed.');
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
            className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-brand-primary text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
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
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Discussions & Reviews</h1>
              <p className="text-slate-400 text-xs mt-1">Review community star feedback logs and purge inappropriate discussion elements</p>
            </div>

            {/* Selector tabs */}
            <div className="flex bg-luxury-900 border border-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === 'reviews' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                User Reviews
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === 'comments' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comments
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* List display */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 text-slate-500">Checking records...</div>
            ) : activeTab === 'reviews' ? (
              // Reviews loop
              reviews.length === 0 ? (
                <p className="text-center py-16 text-slate-500 text-sm bg-luxury-900 border border-white/5 rounded-2xl">
                  No ratings or reviews submitted yet.
                </p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="bg-luxury-900 border border-white/5 p-5 rounded-2xl flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-[9px]">
                          SCORE: {rev.rating}/10
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">TARGET ID: {rev.mediaId}</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-serif italic">"{rev.content}"</p>
                      <div className="text-xs text-slate-500">
                        Submitted by: <b className="text-slate-400">{rev.user?.username || 'Unknown'}</b> ({rev.user?.email || 'N/A'}) on {new Date(rev.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(rev._id)}
                      className="p-2 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary rounded-xl transition flex-shrink-0"
                      title="Purge Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )
            ) : (
              // Comments loop
              comments.length === 0 ? (
                <p className="text-center py-16 text-slate-500 text-sm bg-luxury-900 border border-white/5 rounded-2xl">
                  No comments logged in target feeds.
                </p>
              ) : (
                comments.map((comm) => (
                  <div key={comm._id} className="bg-luxury-900 border border-white/5 p-5 rounded-2xl flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] uppercase font-bold tracking-wider">
                          Type: {comm.targetType}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">TARGET ID: {comm.targetId}</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">"{comm.content}"</p>
                      
                      {comm.replies && comm.replies.length > 0 && (
                        <div className="pl-4 border-l border-white/5 space-y-1.5 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Replies:</span>
                          {comm.replies.map((rep, rIdx) => (
                            <p key={rIdx} className="text-xs text-slate-400">
                              <span className="font-bold text-slate-300">User:</span> "{rep.content}"
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-slate-500">
                        Author: <b className="text-slate-400">{comm.user?.username || 'Unknown'}</b> ({comm.user?.email || 'N/A'}) on {new Date(comm.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comm._id)}
                      className="p-2 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary rounded-xl transition flex-shrink-0"
                      title="Purge Comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )
            )}
          </div>

        </div>
      </main>

    </div>
  );
}
