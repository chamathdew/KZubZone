import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, UserX, UserCheck, ShieldAlert
} from 'lucide-react';

export default function UserManager() {
  const { admin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('kd_admin_token');
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch user accounts logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change user status to ${nextStatus}?`)) return;

    const token = localStorage.getItem('kd_admin_token');
    try {
      await axios.put(`/api/admin/users/${id}/status`, {
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh local list
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
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
            className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-brand-primary text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition"
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
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">User Account Registry</h1>
            <p className="text-slate-400 text-xs mt-1">Review active member accounts, verify authentication statuses, and toggle suspends</p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* User Table grid */}
          <div className="bg-luxury-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="text-center py-16 text-slate-500">Retrieving user accounts logs...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No user accounts registered on front-end.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-luxury-950/30">
                      <th className="p-4">Username</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right">Moderator Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/5 transition">
                        <td className="p-4 font-bold text-slate-200">
                          {u.username}
                        </td>
                        <td className="p-4 text-slate-400 font-mono">
                          {u.email}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            u.status === 'active' 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/10 border border-red-500/20 text-red-400'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u._id, u.status || 'active')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              u.status === 'suspended' 
                                ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-opacity-25' 
                                : 'bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-opacity-25'
                            }`}
                          >
                            {u.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}
