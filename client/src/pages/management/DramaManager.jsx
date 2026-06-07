import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import AdminSidebar from '../../components/layout/AdminSidebar';
import {
  TrendingUp, Film, Tv, Languages, Star, Users, Settings,
  Database, Trash2, Edit3, Plus, ShieldCheck, X, ChevronDown, ChevronRight
} from 'lucide-react';

export default function DramaManager() {
  const { admin } = useAuth();
  
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Expanded dramas for seasons/episodes rendering
  const [expandedDramaId, setExpandedDramaId] = useState(null);
  const [expandedData, setExpandedData] = useState({ seasons: [], episodes: [] });
  const [loadingExpansion, setLoadingExpansion] = useState(false);

  // Modals controllers
  const [showDramaModal, setShowDramaModal] = useState(false);
  const [editingDrama, setEditingDrama] = useState(null);

  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);

  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);

  // Drama Fields State
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
  const [tmdbRating, setTmdbRating] = useState('8.0');
  const [imdbRating, setImdbRating] = useState('8.0');
  const [isTrending, setIsTrending] = useState(false);
  const [isHistorical, setIsHistorical] = useState(false);
  const [status, setStatus] = useState('Published');
  const [savingDrama, setSavingDrama] = useState(false);

  // Season Fields State
  const [seasonNumber, setSeasonNumber] = useState('');
  const [seasonDescription, setSeasonDescription] = useState('');
  const [seasonPoster, setSeasonPoster] = useState('');
  const [savingSeason, setSavingSeason] = useState(false);

  // Episode Fields State
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeDescription, setEpisodeDescription] = useState('');
  const [episodeThumbnail, setEpisodeThumbnail] = useState('');
  const [epAirDate, setEpAirDate] = useState('');
  const [epRuntime, setEpRuntime] = useState('60');
  const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [savingEpisode, setSavingEpisode] = useState(false);

  const fetchDramas = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/media/dramas?status=Published&limit=100');
      setDramas(res.data.dramas);
    } catch (err) {
      setError('Failed to fetch dramas catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDramas();
  }, []);

  const handleExpandDrama = async (drama) => {
    if (expandedDramaId === drama._id) {
      setExpandedDramaId(null);
      return;
    }

    setExpandedDramaId(drama._id);
    setLoadingExpansion(true);
    try {
      const res = await apiClient.get(`/api/media/dramas/${drama.slug}`);
      setExpandedData({
        seasons: res.data.seasons || [],
        episodes: res.data.episodes || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExpansion(false);
    }
  };

  // --- DRAMA ACTIONS ---
  const handleOpenCreateDrama = () => {
    setEditingDrama(null);
    setTitle('');
    setDescription('');
    setPoster('');
    setBanner('');
    setReleaseDate('');
    setRuntime('60');
    setCountry('KR');
    setLanguage('ko');
    setDirector('');
    setTrailer('');
    setTmdbRating('8.0');
    setImdbRating('8.0');
    setIsTrending(false);
    setIsHistorical(false);
    setStatus('Published');
    setShowDramaModal(true);
  };

  const handleOpenEditDrama = (drama) => {
    setEditingDrama(drama);
    setTitle(drama.title || '');
    setDescription(drama.description || '');
    setPoster(drama.poster || '');
    setBanner(drama.banner || '');
    setReleaseDate(drama.releaseDate ? drama.releaseDate.split('T')[0] : '');
    setRuntime(drama.runtime ? String(drama.runtime) : '60');
    setCountry(drama.country || 'KR');
    setLanguage(drama.language || 'ko');
    setDirector(drama.director || '');
    setTrailer(drama.trailer || '');
    setTmdbRating(drama.tmdbRating ? String(drama.tmdbRating) : '8.0');
    setImdbRating(drama.imdbRating ? String(drama.imdbRating) : String(drama.tmdbRating || '8.0'));
    setIsTrending(Boolean(drama.isTrending));
    setIsHistorical(Boolean(drama.isHistorical));
    setStatus(drama.status || 'Published');
    setShowDramaModal(true);
  };

  const handleDramaSubmit = async (e) => {
    e.preventDefault();
    setSavingDrama(true);

    const payload = {
      title, description, poster, banner,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      runtime: Number(runtime), country, language, director, trailer,
      tmdbRating: Number(tmdbRating), imdbRating: Number(imdbRating), isTrending, status, isHistorical
    };

    try {
      if (editingDrama) {
        await apiClient.put(`/api/admin/dramas/${editingDrama._id}`, payload);
      } else {
        await apiClient.post('/api/admin/dramas', payload);
      }
      setShowDramaModal(false);
      fetchDramas();
    } catch (err) {
      alert('Error updating drama.');
    } finally {
      setSavingDrama(false);
    }
  };

  const handleDeleteDrama = async (id) => {
    if (!window.confirm('WARNING: Deleting a drama will delete all cascading seasons and episodes! Are you absolutely sure?')) return;
    try {

      await apiClient.delete(`/api/admin/dramas/${id}`);
      setExpandedDramaId(null);
      fetchDramas();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // --- SEASON ACTIONS ---
  const handleOpenAddSeason = () => {
    setEditingSeason(null);
    setSeasonNumber(String(expandedData.seasons.length + 1));
    setSeasonDescription('');
    setSeasonPoster('');
    setShowSeasonModal(true);
  };

  const handleOpenEditSeason = (season) => {
    setEditingSeason(season);
    setSeasonNumber(String(season.seasonNumber));
    setSeasonDescription(season.seasonDescription || '');
    setSeasonPoster(season.seasonPoster || '');
    setShowSeasonModal(true);
  };

  const handleSeasonSubmit = async (e) => {
    e.preventDefault();
    setSavingSeason(true);

    const payload = {
      dramaId: expandedDramaId,
      seasonNumber: Number(seasonNumber),
      seasonDescription,
      seasonPoster
    };

    try {
      if (editingSeason) {
        await apiClient.put(`/api/admin/seasons/${editingSeason._id}`, payload);
      } else {
        await apiClient.post('/api/admin/seasons', payload);
      }
      setShowSeasonModal(false);
      
      // Refresh current expanded drama
      const dramaObj = dramas.find(d => d._id === expandedDramaId);
      if (dramaObj) {
        setExpandedDramaId(null);
        handleExpandDrama(dramaObj);
      }
    } catch (err) {
      alert('Season processing failed');
    } finally {
      setSavingSeason(false);
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!window.confirm('Delete season and all its episodes?')) return;
    try {

      await apiClient.delete(`/api/admin/seasons/${seasonId}`);
      const dramaObj = dramas.find(d => d._id === expandedDramaId);
      if (dramaObj) {
        setExpandedDramaId(null);
        handleExpandDrama(dramaObj);
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  // --- EPISODE ACTIONS ---
  const handleOpenAddEpisode = (seasonId) => {
    setEditingEpisode(null);
    setSelectedSeasonId(seasonId);
    setEpisodeNumber('');
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeThumbnail('');
    setEpAirDate('');
    setEpRuntime('60');
    setVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    setShowEpisodeModal(true);
  };

  const handleOpenEditEpisode = (episode) => {
    setEditingEpisode(episode);
    setSelectedSeasonId(episode.seasonId);
    setEpisodeNumber(String(episode.episodeNumber));
    setEpisodeTitle(episode.episodeTitle || '');
    setEpisodeDescription(episode.episodeDescription || '');
    setEpisodeThumbnail(episode.episodeThumbnail || '');
    setEpAirDate(episode.airDate ? episode.airDate.split('T')[0] : '');
    setEpRuntime(episode.runtime ? String(episode.runtime) : '60');
    setVideoUrl(episode.videoUrl || '');
    setShowEpisodeModal(true);
  };

  const handleEpisodeSubmit = async (e) => {
    e.preventDefault();
    setSavingEpisode(true);

    const payload = {
      dramaId: expandedDramaId,
      seasonId: selectedSeasonId,
      episodeNumber: Number(episodeNumber),
      episodeTitle,
      episodeDescription,
      episodeThumbnail,
      airDate: epAirDate ? new Date(epAirDate) : null,
      runtime: Number(epRuntime),
      videoUrl
    };

    try {
      if (editingEpisode) {
        await apiClient.put(`/api/admin/episodes/${editingEpisode._id}`, payload);
      } else {
        await apiClient.post('/api/admin/episodes', payload);
      }
      setShowEpisodeModal(false);
      const dramaObj = dramas.find(d => d._id === expandedDramaId);
      if (dramaObj) {
        setExpandedDramaId(null);
        handleExpandDrama(dramaObj);
      }
    } catch (err) {
      alert('Episode processing failed');
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleDeleteEpisode = async (epId) => {
    if (!window.confirm('Delete this episode?')) return;
    try {

      await apiClient.delete(`/api/admin/episodes/${epId}`);
      const dramaObj = dramas.find(d => d._id === expandedDramaId);
      if (dramaObj) {
        setExpandedDramaId(null);
        handleExpandDrama(dramaObj);
      }
    } catch (err) {
      alert('Delete failed');
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
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Manage K-Dramas</h1>
              <p className="text-slate-400 text-xs mt-1">Manage series settings, seasons metadata, and episode subtitle targets</p>
            </div>
            
            <button
              onClick={handleOpenCreateDrama}
              className="px-4 py-2.5 bg-brand-primary hover:bg-opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Drama Series
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading catalog...</div>
            ) : dramas.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm bg-luxury-900 border border-white/5 rounded-2xl">
                No drama series imported yet. Build a platform using TMDB importer!
              </div>
            ) : (
              dramas.map((drama) => {
                const isExpanded = expandedDramaId === drama._id;
                return (
                  <div key={drama._id} className="bg-luxury-900 border border-white/5 rounded-2xl overflow-hidden shadow-md">
                    {/* Header bar */}
                    <div 
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-white/5 transition"
                      onClick={() => handleExpandDrama(drama)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-slate-400">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </span>
                        <img src={drama.poster} alt={drama.title} className="w-8 h-12 object-cover rounded bg-luxury-950 flex-shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-200">{drama.title}</h4>
                          {drama.isTrending && (
                            <span className="inline-flex mt-1 px-1.5 py-0.5 rounded bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-[9px] font-bold uppercase tracking-wider">
                              Trending
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 truncate">{drama.studio} • {drama.director}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs self-end sm:self-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <div className="text-slate-400">
                          IMDb: <span className="text-brand-accent font-bold">{drama.imdbRating || drama.tmdbRating || '0.0'}</span>
                        </div>
                        <div className="text-slate-400">
                          TMDB: <span className="text-slate-100 font-bold">{drama.tmdbRating || '0.0'}</span>
                        </div>
                        <div className="text-slate-400">
                          VIEWS: <span className="text-slate-100 font-bold">{drama.viewCount}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditDrama(drama)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDrama(drama._id)}
                            className="p-1.5 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-collapsible (Seasons & Episodes list) */}
                    {isExpanded && (
                      <div className="bg-luxury-950/50 p-6 border-t border-white/5 space-y-6">
                        {loadingExpansion ? (
                          <div className="text-xs text-slate-500 text-center py-4">Checking season details...</div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-brand-primary">Seasons Content Catalog</h5>
                              <button 
                                onClick={handleOpenAddSeason}
                                className="px-3 py-1 bg-brand-primary hover:bg-opacity-95 text-white font-bold rounded text-[10px] uppercase tracking-wider"
                              >
                                + Add Season
                              </button>
                            </div>

                            {expandedData.seasons.length === 0 ? (
                              <p className="text-xs text-slate-500 py-4 text-center">No seasons defined.</p>
                            ) : (
                              expandedData.seasons.map((season) => {
                                const seasonEpisodes = expandedData.episodes.filter(ep => ep.seasonId === season._id);
                                return (
                                  <div key={season._id} className="border border-white/5 rounded-xl p-4 bg-luxury-900 bg-opacity-25 space-y-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h6 className="font-extrabold text-xs text-slate-200">Season {season.seasonNumber}</h6>
                                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 max-w-xl">{season.seasonDescription}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleOpenAddEpisode(season._id)}
                                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-[9px] font-bold uppercase"
                                        >
                                          + Add Ep
                                        </button>
                                        <button 
                                          onClick={() => handleOpenEditSeason(season)}
                                          className="p-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteSeason(season._id)}
                                          className="p-1 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary rounded"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Episode List */}
                                    <div className="pl-4 border-l border-white/5 space-y-2.5">
                                      {seasonEpisodes.length === 0 ? (
                                        <p className="text-[10px] text-slate-500">No episodes created.</p>
                                      ) : (
                                        seasonEpisodes.map((ep) => (
                                          <div key={ep._id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-white/5 text-slate-300">
                                            <div className="flex items-center gap-2 overflow-hidden mr-4">
                                              <Languages className="w-3 h-3 text-brand-primary flex-shrink-0" />
                                              <span className="font-bold font-mono text-[10px]">EP {ep.episodeNumber}:</span>
                                              <span className="truncate">{ep.episodeTitle}</span>
                                            </div>
                                            <div className="flex items-center gap-3 font-mono text-[10px] flex-shrink-0">
                                              <span className="text-slate-500">{ep.runtime}m</span>
                                              <button 
                                                onClick={() => handleOpenEditEpisode(ep)}
                                                className="text-slate-400 hover:text-white"
                                              >
                                                Edit
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteEpisode(ep._id)}
                                                className="text-brand-secondary hover:text-red-400"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </main>

      {/* MODAL: DRAMA CREATE/EDIT */}
      {showDramaModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-luxury-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
            <button onClick={() => setShowDramaModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">&times;</button>
            <h2 className="text-lg font-bold text-white mb-6 uppercase">
              {editingDrama ? 'Modify Drama Series' : 'Create Drama Series'}
            </h2>
            <form onSubmit={handleDramaSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Drama Title</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Director</label>
                  <input type="text" value={director} onChange={e => setDirector(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Synoptical Overview</label>
                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Poster URL</label>
                  <input type="text" value={poster} onChange={e => setPoster(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Banner URL</label>
                  <input type="text" value={banner} onChange={e => setBanner(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Release Date</label>
                  <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ep Runtime (mins)</label>
                  <input type="number" value={runtime} onChange={e => setRuntime(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">TMDB Rating</label>
                  <input type="text" value={tmdbRating} onChange={e => setTmdbRating(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">IMDb Rating</label>
                  <input type="text" value={imdbRating} onChange={e => setImdbRating(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={e => setIsTrending(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  Show this drama in Trending
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isHistorical}
                    onChange={e => setIsHistorical(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  Mark as Historical Drama
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowDramaModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" disabled={savingDrama} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-xl text-xs">{savingDrama ? 'Saving...' : 'Save Series'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEASON CREATE/EDIT */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-luxury-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowSeasonModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">&times;</button>
            <h2 className="text-lg font-bold text-white mb-6 uppercase">
              {editingSeason ? 'Modify Season' : 'Create Season'}
            </h2>
            <form onSubmit={handleSeasonSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Season Number</label>
                <input type="number" required value={seasonNumber} onChange={e => setSeasonNumber(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Season Description</label>
                <textarea rows="3" value={seasonDescription} onChange={e => setSeasonDescription(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Season Poster (Optional)</label>
                <input type="text" value={seasonPoster} onChange={e => setSeasonPoster(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowSeasonModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-slate-300">Cancel</button>
                <button type="submit" disabled={savingSeason} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-xl text-xs">{savingSeason ? 'Saving...' : 'Save Season'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EPISODE CREATE/EDIT */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-luxury-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button onClick={() => setShowEpisodeModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">&times;</button>
            <h2 className="text-lg font-bold text-white mb-6 uppercase">
              {editingEpisode ? 'Modify Episode' : 'Create Episode'}
            </h2>
            <form onSubmit={handleEpisodeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Episode Number</label>
                  <input type="number" required value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Episode Title</label>
                  <input type="text" required value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Synopsis</label>
                <textarea rows="3" value={episodeDescription} onChange={e => setEpisodeDescription(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Thumbnail URL</label>
                  <input type="text" value={episodeThumbnail} onChange={e => setEpisodeThumbnail(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Video Stream URL</label>
                  <input type="text" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Air Date</label>
                  <input type="date" value={epAirDate} onChange={e => setEpAirDate(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Runtime (mins)</label>
                  <input type="number" value={epRuntime} onChange={e => setEpRuntime(e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowEpisodeModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-slate-300">Cancel</button>
                <button type="submit" disabled={savingEpisode} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-xl text-xs">{savingEpisode ? 'Saving...' : 'Save Episode'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
