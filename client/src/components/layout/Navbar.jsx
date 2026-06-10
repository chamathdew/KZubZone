'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSiteContent } from '@/hooks/useSiteContent';
import { permalinkSlug } from '@/utils/slug';
import { getMediaImage, handleImageFallback, resolveLogoUrl } from '@/utils/mediaImages';
import apiClient from '@/services/api/apiClient';

export default function Navbar() {
  const { user, admin, logoutUser, logoutAdmin } = useAuth();
  const { content } = useSiteContent();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const catalogLinks = (content?.navigation?.links || []).filter((item) => item.label && item.url);
  const searchPlaceholder = content?.navigation?.searchPlaceholder || 'Search...';
  const brand = content?.brand || {};

  // Fetch Autocomplete Suggestions
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const resMovies = await apiClient.get(`/api/media/movies?limit=3&search=${searchQuery}`);
          const resDramas = await apiClient.get(`/api/media/dramas?limit=3&search=${searchQuery}`);
          
          const combined = [
            ...resMovies.data.movies.map(m => ({ ...m, type: 'movie' })),
            ...resDramas.data.dramas.map(d => ({ ...d, type: 'drama' }))
          ];
          setSuggestions(combined);
          setShowSuggestions(true);
        } catch (error) {
          console.error(error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch Notifications
  useEffect(() => {
    if (user) {
      apiClient.get('/api/auth/notifications')
        .then(res => setNotifications(res.data.slice(0, 5)))
        .catch(err => console.error(err));
    }
  }, [user]);

  // Close search suggestions on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${searchQuery}`);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.put(`/api/auth/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex md:grid md:grid-cols-[auto_1fr_auto] items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 min-w-0">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src={resolveLogoUrl(brand.logoUrl) || "/main-logo.svg"}
              alt={brand.siteName || 'KSubZone'}
              className="h-9 w-auto object-contain"
            />
            <span className="text-xl xl:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent font-sans">
              {brand.logoText || brand.siteName || 'KSUBZONE'}
            </span>
          </Link>
        </div>

        {/* CENTER NAV LINKS */}
        <nav className="hidden xl:flex items-center justify-center gap-7">
          {catalogLinks.map((item) => (
            <Link key={`${item.label}-${item.url}`} href={item.url} className="text-slate-300 hover:text-white transition text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              {item.label}
            </Link>
          ))}
          <Link href="/search" className="text-slate-300 hover:text-white transition text-xs font-bold uppercase tracking-wider whitespace-nowrap">Explore</Link>
        </nav>

        {/* CONTROLS */}
        <nav className="flex items-center justify-end gap-5 min-w-0">
          {/* SEARCH BAR (AUTOCOMPLETE) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-40 lg:w-44 flex-shrink-0" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-full text-xs glass-input placeholder-slate-400 focus:bg-luxury-900 focus:border-brand-primary"
              />
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-12 right-0 w-72 glass-panel-heavy rounded-2xl p-2 shadow-2xl border border-white/10"
                >
                  {suggestions.map((item) => (
                    <Link
                      key={item._id}
                      href={`/${item.type}/${permalinkSlug(item)}`}
                      onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                    >
                      <img
                        src={getMediaImage(item, 'poster')}
                        alt={item.title}
                        className="w-8 h-12 object-cover rounded-md flex-shrink-0"
                        onError={(event) => handleImageFallback(event, item, 'poster')}
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-brand-primary uppercase tracking-wider">{item.type}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          
          {/* USER SECTION */}
          {user || admin ? (
            <div className="flex items-center gap-4">
              
              {/* NOTIFICATION ICON */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); }}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-300 hover:text-white transition"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-secondary rounded-full" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-12 w-80 glass-panel-heavy rounded-2xl p-3 shadow-2xl border border-white/10"
                      >
                        <p className="text-xs font-bold text-slate-300 mb-2 px-1">Notifications</p>
                        <hr className="border-white/5 mb-2" />
                        {notifications.length === 0 ? (
                          <p className="text-[11px] text-slate-500 text-center py-4">No notifications yet</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {notifications.map(n => (
                              <div
                                key={n._id}
                                onClick={() => handleMarkAsRead(n._id)}
                                className={`p-2 rounded-xl transition cursor-pointer text-left ${n.isRead ? 'bg-transparent' : 'bg-brand-primary/10 hover:bg-brand-primary/20'}`}
                              >
                                <p className="text-xs font-semibold text-white">{n.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* USER PROFILE DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-white/10 hover:bg-white/5 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white overflow-hidden">
                    {user?.avatar || admin?.avatar ? (
                      <img src={user?.avatar || admin?.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold hidden sm:inline">{user?.username || admin?.username || 'Admin'}</span>
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-48 glass-panel-heavy rounded-2xl p-1.5 shadow-2xl border border-white/10"
                    >
                      {user ? (
                        <>
                          <Link
                            href="/profile"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2 p-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition"
                          >
                            <User className="w-4 h-4 text-brand-primary" /> Profile Settings
                          </Link>
                          <hr className="border-white/5 my-1" />
                          <button
                            onClick={() => { setShowUserDropdown(false); logoutUser(); }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-semibold rounded-xl text-brand-secondary hover:bg-brand-secondary/10 transition text-left"
                          >
                            <LogOut className="w-4 h-4" /> Logout User
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/management/dashboard"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2 p-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition"
                          >
                            <User className="w-4 h-4 text-brand-primary" /> Admin Dashboard
                          </Link>
                          <hr className="border-white/5 my-1" />
                          <button
                            onClick={() => { setShowUserDropdown(false); logoutAdmin(); }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-semibold rounded-xl text-brand-secondary hover:bg-brand-secondary/10 transition text-left"
                          >
                            <LogOut className="w-4 h-4" /> Logout Admin
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <Link
              href="/auth"
              className="h-10 px-3 sm:pl-2 sm:pr-4 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-brand-primary/40 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-black/20"
            >
              <span className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </span>
              <span className="hidden sm:inline">{content?.navigation?.signInLabel || 'Sign In'}</span>
            </Link>
          )}

          {/* ADMIN IS ALREADY AUTHENTICATED DIRECT BUTTON OR USER WITH DASHBOARD ACCESS */}
          {(admin || (user && user.hasDashboardAccess)) && (
            <div className="hidden md:flex items-center gap-5 ml-4">
              <Link
                href="/management/dashboard"
                className="px-3 h-8 border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10 rounded-full flex items-center text-[11px] font-bold transition"
              >
                Dashboard
              </Link>
            </div>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-md md:hidden text-slate-400 hover:text-white transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-luxury-950 px-4 py-4 flex flex-col gap-3"
          >
            {/* Search Input for Mobile */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-full text-xs glass-input placeholder-slate-400"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </form>

            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">Home</Link>
            <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">Browse Catalog</Link>
            {catalogLinks.map((item) => (
              <Link key={`${item.label}-${item.url}`} href={item.url} onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">My Profile</Link>
                {user.hasDashboardAccess && (
                  <Link href="/management/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-brand-accent text-sm font-medium py-1">Admin Dashboard</Link>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); logoutUser(); }}
                  className="text-left text-brand-secondary text-sm font-medium py-1 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout User
                </button>
              </>
            )}
            {admin && (
              <>
                <Link href="/management/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-brand-accent text-sm font-medium py-1">Admin Dashboard</Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); logoutAdmin(); }}
                  className="text-left text-brand-secondary text-sm font-medium py-1 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout Admin
                </button>
              </>
            )}
            {!user && !admin && (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="text-brand-primary hover:text-white text-sm font-medium py-1">{content?.navigation?.signInLabel || 'Sign In'}</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
