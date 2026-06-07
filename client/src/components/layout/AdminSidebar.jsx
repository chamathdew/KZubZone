import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Film, Tv, Users, Languages, Star, TrendingUp,
  Settings, Database, LogOut, BookOpenText, Wand2, Server
} from 'lucide-react';

export default function AdminSidebar() {
  const { admin, logoutAdmin } = useAuth();
  const { pathname } = useLocation();

  const links = [
    { to: '/management/dashboard', label: 'Dashboard Metrics', icon: TrendingUp, color: 'text-brand-primary' },
    { to: '/management/import', label: 'One-Click TMDB Importer', icon: Database, color: 'text-brand-accent' },
    { to: '/management/movies', label: 'Manage Movies', icon: Film, color: 'text-brand-primary' },
    { to: '/management/dramas', label: 'Manage Dramas', icon: Tv, color: 'text-brand-primary' },
    { to: '/management/articles', label: 'Manage Articles', icon: BookOpenText, color: 'text-brand-primary' },
    { to: '/management/subtitles', label: 'Subtitles Moderation', icon: Languages, color: 'text-emerald-400' },
    { to: '/management/comments', label: 'Comments & Reviews', icon: Star, color: 'text-yellow-400' },
    { to: '/management/users', label: 'Member Control', icon: Users, color: 'text-blue-400' },
    { to: '/management/settings', label: 'Site Builder', icon: Wand2, color: 'text-brand-accent' },
    { to: '/management/database', label: 'Database Browser', icon: Server, color: 'text-amber-400' },
    { to: '/management/seo', label: 'Raw Config Keys', icon: Settings, color: 'text-slate-400' },
  ];

  const adminRoleName = admin?.role?.name || (typeof admin?.role === 'object' ? admin.role.name : String(admin?.role || 'Admin'));

  return (
    <aside className="w-full md:w-72 bg-luxury-900 border-r border-white/5 p-6 flex flex-col gap-6 md:sticky md:top-0 md:h-screen overflow-y-auto flex-shrink-0">
      <div className="pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-pulse" />
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">KSubZone Admins</h3>
        </div>
        <p className="text-[11px] text-slate-400 capitalize">{adminRoleName} • {admin?.username}</p>
      </div>

      <nav className="flex flex-col gap-1.5 flex-grow">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition border-l-[3px] ${
                isActive
                  ? 'bg-brand-primary/10 border-brand-primary text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`w-4 h-4 ${link.color}`} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logoutAdmin}
        className="flex items-center gap-3 p-3 mt-auto rounded-xl text-xs font-bold uppercase tracking-wider border border-white/5 hover:bg-brand-secondary/10 text-brand-secondary hover:border-brand-secondary/20 transition text-left flex-shrink-0"
      >
        <LogOut className="w-4 h-4" /> Terminate Session
      </button>
    </aside>
  );
}
