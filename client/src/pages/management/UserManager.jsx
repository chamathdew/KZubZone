import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import AdminSidebar from '../../components/layout/AdminSidebar';
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

    try {
      const res = await apiClient.get('/api/admin/users');
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

    try {
      await apiClient.put(`/api/admin/users/${id}/status`, {
        status: nextStatus
      });
      // Refresh local list
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleToggleDashboardAccess = async (id, currentAccess) => {
    const nextAccess = !currentAccess;
    if (!window.confirm(`Are you sure you want to ${nextAccess ? 'grant' : 'revoke'} dashboard access for this user?`)) return;

    try {
      await apiClient.put(`/api/admin/users/${id}/dashboard-access`, {
        hasDashboardAccess: nextAccess
      });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, hasDashboardAccess: nextAccess } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle dashboard access');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

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
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleDashboardAccess(u._id, u.hasDashboardAccess)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              u.hasDashboardAccess 
                                ? 'bg-brand-primary/20 border border-brand-primary/30 text-brand-primary hover:bg-opacity-30' 
                                : 'bg-slate-500/15 border border-slate-500/20 text-slate-400 hover:bg-opacity-25'
                            }`}
                          >
                            {u.hasDashboardAccess ? 'Revoke Admin' : 'Make Admin'}
                          </button>
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
