import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Star, Play, Plus, Check, Heart, Upload, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SeoTags from '../components/SeoTags';
import SubtitleUploadModal from '../components/SubtitleUploadModal';

export default function Detail({ type = 'Movie' }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(10);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Fetch Media Details
  const endpoint = type === 'Drama' ? `/api/media/dramas/${slug}` : `/api/media/movies/${slug}`;
  const { data, isLoading, error } = useQuery({
    queryKey: ['mediaDetails', slug, type],
    queryFn: async () => {
      const res = await axios.get(endpoint);
      return res.data;
    }
  });

  const media = type === 'Drama' ? data?.drama : data?.movie;
  const seasons = data?.seasons || [];
  const episodes = data?.episodes || [];
  const related = data?.related || [];

  const getId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.$oid || String(value);
  };

  useEffect(() => {
    if (type === 'Drama' && seasons.length > 0 && !seasons.some(s => s.seasonNumber === selectedSeason)) {
      setSelectedSeason(seasons[0].seasonNumber);
    }
  }, [seasons, selectedSeason, type]);

  // Fetch Subtitles
  const { data: subtitles = [], refetch: refetchSubtitles } = useQuery({
    queryKey: ['mediaSubtitles', media?._id],
    queryFn: async () => {
      const res = await axios.get(`/api/subtitles/media/${media._id}`);
      return res.data;
    },
    enabled: !!media?._id
  });

  // Fetch Reviews
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['mediaReviews', media?._id],
    queryFn: async () => {
      const res = await axios.get(`/api/media/${media._id}/reviews`);
      return res.data;
    },
    enabled: !!media?._id
  });

  // Check Watchlist / Favorites states
  const inWatchlist = user?.watchlist?.some(w => w.mediaId === media?._id);
  const inFavorites = user?.favorites?.some(f => f.mediaId === media?._id);

  // Mutations
  const toggleWatchlistMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/media/watchlist', { mediaId: media._id, mediaType: type });
    },
    onSuccess: () => {
      refreshProfile();
    }
  });

  const toggleFavoritesMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/media/favorites', { mediaId: media._id, mediaType: type });
    },
    onSuccess: () => {
      refreshProfile();
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      await axios.post('/api/media/reviews', reviewData);
    },
    onSuccess: () => {
      setReviewText('');
      setReviewRating(10);
      refetchReviews();
      queryClient.invalidateQueries(['mediaDetails', slug, type]);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Error submitting review.');
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-luxury-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Title File...</span>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="h-screen w-full bg-luxury-950 flex flex-col items-center justify-center gap-3">
        <p className="text-brand-secondary text-sm">Failed to retrieve media entry.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl">Go Home</button>
      </div>
    );
  }

  const handleDownloadSubtitle = async (subId, fileUrl) => {
    try {
      await axios.post(`/api/subtitles/${subId}/download`);
      refetchSubtitles();
      // Open file in new tab or trigger direct download
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!reviewText.trim()) {
      setReviewError('Review content is required');
      return;
    }
    submitReviewMutation.mutate({
      mediaId: media._id,
      mediaType: type,
      rating: reviewRating,
      content: reviewText
    });
  };

  // Filter episodes by selected season
  const activeSeasonDoc = seasons.find(s => s.seasonNumber === selectedSeason);
  const activeEpisodes = episodes.filter(ep => getId(ep.seasonId) === getId(activeSeasonDoc?._id));

  return (
    <div className="w-full flex flex-col gap-12 bg-luxury-950 text-left pb-16">
      
      {/* Dynamic AI SEO Optimization tags */}
      <SeoTags
        title={media.metaTitle || `${media.title} Watch Online | KDramaVerse`}
        description={media.metaDescription || media.description}
        keywords={media.seoKeywords || [media.title.toLowerCase()]}
        canonical={`https://kdramaverse.com/${type.toLowerCase()}/${media.slug}`}
        image={media.poster}
        schemaMarkup={media.schemaMarkup}
      />

      {/* Cinematic Banner Backdrop Header */}
      <div className="relative w-full h-[40vh] sm:h-[55vh] overflow-hidden">
        <img
          src={media.banner}
          alt={media.title}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Media Metadata Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-24 sm:-mt-48 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* LEFT: POSTER CARD */}
          <div className="flex flex-col gap-4">
            <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-2xl aspect-[2/3]">
              <img
                src={media.poster}
                alt={media.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Watchlist & Favorites Toggles */}
            {user && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleWatchlistMutation.mutate()}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${inWatchlist ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                >
                  {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} Watchlist
                </button>
                <button
                  onClick={() => toggleFavoritesMutation.mutate()}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${inFavorites ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" /> Favorite
                </button>
              </div>
            )}

            {/* Subtitle Uploader Trigger */}
            <button
              onClick={() => {
                if (!user) { navigate('/auth'); } else { setUploadModalOpen(true); }
              }}
              className="w-full h-11 bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-brand-primary/10"
            >
              <Upload className="w-4 h-4" /> Upload Subtitle
            </button>
          </div>

          {/* RIGHT: DETAILS CONTROLLER */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <div>
              {/* TMDB Badge */}
              <span className="px-2.5 py-0.5 bg-brand-accent/20 border border-brand-accent/50 text-brand-accent text-[10px] font-extrabold uppercase tracking-widest rounded-full inline-flex items-center gap-1 mb-3">
                <Star className="w-2.5 h-2.5 fill-current" /> {media.tmdbRating.toFixed(1)} TMDB Rating
              </span>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{media.title}</h1>
              {media.originalTitle && media.originalTitle !== media.title && (
                <p className="text-lg font-semibold text-slate-400 mt-1">{media.originalTitle}</p>
              )}

              {/* Tag Metadata Row */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs font-semibold text-slate-400">
                <span>{media.releaseDate ? new Date(media.releaseDate).getFullYear() : '2026'}</span>
                <span>•</span>
                <span>{type === 'Drama' ? 'TV Show' : `${media.runtime} Min`}</span>
                <span>•</span>
                <span className="uppercase">{media.country}</span>
                <span>•</span>
                <span className="uppercase">{media.language}</span>
              </div>
            </div>

            {/* AI SEO Unique Rewrite Block */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 text-slate-300 flex flex-col gap-4 text-xs sm:text-sm">
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-wider mb-2">Synopsis</h3>
                <p className="leading-relaxed">{media.synopsisRewrite || media.description}</p>
              </div>
              <hr className="border-white/5" />
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider mb-2">Story Deep-Dive</h3>
                <p className="leading-relaxed text-slate-400">{media.storyOverview}</p>
              </div>
            </div>

            {/* Casting / Studio Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <p className="text-slate-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">Director</p>
                <p className="text-white font-bold">{media.director || 'Unknown'}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <p className="text-slate-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">Production Company</p>
                <p className="text-white font-bold">{media.studio || 'N/A'}</p>
              </div>
            </div>

            {/* Drama Season / Episode Drawer */}
            {type === 'Drama' && seasons.length > 0 && (
              <div className="flex flex-col gap-4 text-left">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider font-sans">Seasons & Episodes</h3>
                
                {/* Season selection pills */}
                <div className="flex gap-2">
                  {seasons.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSeason(s.seasonNumber)}
                      className={`px-4 h-9 rounded-xl text-xs font-bold transition ${selectedSeason === s.seasonNumber ? 'bg-brand-primary text-white shadow-lg' : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'}`}
                    >
                      Season {s.seasonNumber}
                    </button>
                  ))}
                </div>

                {/* Season description info */}
                {activeSeasonDoc && (
                  <p className="text-xs text-slate-400 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                    {activeSeasonDoc.seasonDescription}
                  </p>
                )}

                {/* Episode listing blocks */}
                <div className="flex flex-col gap-2">
                  {activeEpisodes.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4">No episodes added for this season yet.</p>
                  ) : (
                    activeEpisodes.map((ep) => (
                      <div
                        key={ep._id}
                        onClick={() => navigate(`/drama/${media.slug}/season-${selectedSeason}/episode-${ep.episodeNumber}`)}
                        className="glass-panel p-3 rounded-2xl border border-white/5 flex items-center justify-between hover:border-brand-primary/30 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary text-xs font-black">
                            EP {ep.episodeNumber}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{ep.episodeTitle}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ep.episodeDescription}</p>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-brand-primary fill-current flex-shrink-0 mr-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Subtitle Downloads list */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Subtitles</h3>
              {subtitles.length === 0 ? (
                <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl text-center text-xs text-slate-500">
                  No community subtitles uploaded for this title yet. Be the first to upload one!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {subtitles.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{sub.language} ({sub.format.toUpperCase()})</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Version: {sub.version} • Sync target: WEB-DL • Downloads: {sub.downloads}
                        </p>
                        {sub.releaseNotes && <p className="text-[10px] text-slate-500 mt-1">Note: {sub.releaseNotes}</p>}
                      </div>
                      <button
                        onClick={() => handleDownloadSubtitle(sub._id, sub.fileUrl)}
                        className="h-9 px-4 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Community reviews */}
            <div className="flex flex-col gap-4 text-left" id="reviews">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Reviews ({reviews.length})</h3>
              
              {/* Form upload review */}
              <form onSubmit={handleSubmitReview} className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
                {reviewError && (
                  <div className="p-2 bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl text-brand-secondary text-xs font-bold">
                    {reviewError}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rating (1-10):</span>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="h-8 px-2 rounded-lg bg-luxury-800 border border-white/5 text-xs font-bold text-brand-accent focus:outline-none"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Stars</option>
                    ))}
                  </select>
                </div>

                <textarea
                  required
                  placeholder={user ? "Write your community review here..." : "Please log in to submit a review."}
                  disabled={!user}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-2xl bg-luxury-800 border border-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary resize-none"
                />

                <button
                  type="submit"
                  disabled={!user || submitReviewMutation.isPending}
                  className="h-9 px-4 self-end bg-brand-primary hover:bg-brand-primary/80 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center transition"
                >
                  Submit Review
                </button>
              </form>

              {/* Reviews list */}
              <div className="flex flex-col gap-3">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-black uppercase text-brand-primary">
                          {rev.user?.username.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rev.user?.username}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{new Date(rev.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[10px] font-black rounded-lg flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" /> {rev.rating}/10
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{rev.content}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Subtitle Uploader Modal Box */}
      <SubtitleUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        mediaId={media._id}
        mediaType={type}
        onUploadSuccess={refetchSubtitles}
      />

    </div>
  );
}
