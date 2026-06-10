'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import apiClient from '@/services/api/apiClient';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, Trash2, Edit3, Plus, ShieldCheck, X
} from 'lucide-react';

export default function MovieManager() {
  const { admin } = useAuth();
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form modal triggers
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [banner, setBanner] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [runtime, setRuntime] = useState('');
  const [country, setCountry] = useState('KR');
  const [language, setLanguage] = useState('ko');
  const [director, setDirector] = useState('');
  const [trailer, setTrailer] = useState('');
  const [tmdbRating, setTmdbRating] = useState('');
  const [imdbRating, setImdbRating] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [isHistorical, setIsHistorical] = useState(false);
  const [status, setStatus] = useState('Published');
  const [saving, setSaving] = useState(false);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/media/movies?status=Published&limit=100');
      // Also get drafts if any (in this case, just fetch all)
      setMovies(res.data.movies);
    } catch (err) {
      setError('Failed to fetch movies catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleOpenCreate = () => {
    setEditingMovie(null);
    setTitle('');
    setDescription('');
    setPoster('');
    setBanner('');
    setReleaseDate('');
    setRuntime('120');
    setCountry('KR');
    setLanguage('ko');
    setDirector('');
    setTrailer('');
    setTmdbRating('8.0');
    setImdbRating('8.0');
    setIsTrending(false);
    setIsHistorical(false);
    setStatus('Published');
    setShowModal(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setTitle(movie.title || '');
    setDescription(movie.description || '');
    setPoster(movie.poster || '');
    setBanner(movie.banner || '');
    setReleaseDate(movie.releaseDate ? movie.releaseDate.split('T')[0] : '');
    setRuntime(movie.runtime ? String(movie.runtime) : '120');
    setCountry(movie.country || 'KR');
    setLanguage(movie.language || 'ko');
    setDirector(movie.director || '');
    setTrailer(movie.trailer || '');
    setTmdbRating(movie.tmdbRating ? String(movie.tmdbRating) : '8.0');
    setImdbRating(movie.imdbRating ? String(movie.imdbRating) : String(movie.tmdbRating || '8.0'));
    setIsTrending(Boolean(movie.isTrending));
    setIsHistorical(Boolean(movie.isHistorical));
    setStatus(movie.status || 'Published');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      title,
      description,
      poster,
      banner,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      runtime: Number(runtime),
      country,
      language,
      director,
      trailer,
      tmdbRating: Number(tmdbRating),
      imdbRating: Number(imdbRating),
      isTrending,
      status,
      isHistorical
    };

    try {

      if (editingMovie) {
        // Edit Mode
        await apiClient.put(`/api/admin/movies/${editingMovie._id}`, payload);
      } else {
        // Create Mode
        await apiClient.post('/api/admin/movies', payload);
      }
      setShowModal(false);
      fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to persist movie record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolute sure you want to delete this movie record?')) return;
    try {

      await apiClient.delete(`/api/admin/movies/${id}`);
      fetchMovies();
    } catch (err) {
      alert('Delete operation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      {/* Primary Details Panel */}
      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Manage Movies</h1>
              <p className="text-slate-400 text-xs mt-1">Manual entry editing and content maintenance panel</p>
            </div>
            
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-brand-primary hover:bg-opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Movie Manually
            </button>
          </div>

          {/* Table display */}
          <div className="bg-luxury-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="text-center py-16 text-slate-500">Loading catalog...</div>
            ) : movies.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No movies found. Import some using the TMDB Importer!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-luxury-950/30">
                      <th className="p-4">Movie Title</th>
                      <th className="p-4">Release Year</th>
                      <th className="p-4">IMDb</th>
                      <th className="p-4">TMDB</th>
                      <th className="p-4">Views</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {movies.map((movie) => (
                      <tr key={movie._id} className="hover:bg-white/5 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={movie.poster || 'https://placehold.co/40x60'}
                            alt={movie.title}
                            className="w-8 h-12 object-cover rounded bg-luxury-950 border border-white/5 flex-shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-slate-200 block text-sm">{movie.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{movie.director || 'Unknown Director'}</span>
                            {movie.isTrending && (
                              <span className="inline-flex mt-1 px-1.5 py-0.5 rounded bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-[9px] font-bold uppercase tracking-wider">
                                Trending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono">
                          {movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A'}
                        </td>
                        <td className="p-4 font-mono font-bold text-brand-primary">
                          {movie.imdbRating || movie.tmdbRating || '0.0'}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {movie.tmdbRating || '0.0'}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {movie.viewCount || 0}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            movie.status === 'Published' 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                          }`}>
                            {movie.status || 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => handleOpenEdit(movie)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded transition"
                              title="Edit Movie"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(movie._id)}
                              className="p-1.5 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary rounded transition"
                              title="Delete Movie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Manual Creation / Edit Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-luxury-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
              {editingMovie ? 'Modify Movie Record' : 'Add New Movie Entry'}
            </h2>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500 bg-opacity-10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Director</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Synoptical Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Poster Image URL</label>
                  <input
                    type="text"
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    placeholder="https://image.tmdb.org/..."
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Backdrop Banner URL</label>
                  <input
                    type="text"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Release Date</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Runtime (mins)</label>
                  <input
                    type="number"
                    value={runtime}
                    onChange={(e) => setRuntime(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">TMDB Rating Score</label>
                  <input
                    type="text"
                    value={tmdbRating}
                    onChange={(e) => setTmdbRating(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">IMDb Rating Score</label>
                  <input
                    type="text"
                    value={imdbRating}
                    onChange={(e) => setImdbRating(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Trailer URL</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/embed/..."
                    value={trailer}
                    onChange={(e) => setTrailer(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  Show this movie in Trending
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isHistorical}
                    onChange={(e) => setIsHistorical(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  Mark as Historical Drama
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand-primary hover:bg-opacity-95 text-white font-bold rounded-xl text-xs transition"
                >
                  {saving ? 'Saving...' : 'Save Movie Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
