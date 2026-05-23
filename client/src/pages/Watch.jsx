import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import SeoTags from '../components/SeoTags';

export default function Watch() {
  const { slug, seasonPart, episodePart } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [selectedSubTrack, setSelectedSubTrack] = useState('');
  const seasonNumber = Number(String(seasonPart || '').replace('season-', ''));
  const episodeNumber = Number(String(episodePart || '').replace('episode-', ''));
  
  // 1. Fetch Drama Details to identify Episode and Season IDs
  const { data: dramaData, isLoading: dramaLoading } = useQuery({
    queryKey: ['dramaDetails', slug],
    queryFn: async () => {
      const res = await axios.get(`/api/media/dramas/${slug}`);
      return res.data;
    }
  });

  const drama = dramaData?.drama;
  const seasons = dramaData?.seasons || [];
  const episodes = dramaData?.episodes || [];
  const getId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.$oid || String(value);
  };

  // Identify active season and episode
  const activeSeasonDoc = seasons.find(s => s.seasonNumber === seasonNumber);
  const activeEpisodeDoc = episodes.find(
    ep => getId(ep.seasonId) === getId(activeSeasonDoc?._id) && ep.episodeNumber === episodeNumber
  );

  // 2. Fetch Approved Subtitles for this episode
  const { data: subtitles = [] } = useQuery({
    queryKey: ['episodeSubtitles', activeEpisodeDoc?._id],
    queryFn: async () => {
      const res = await axios.get(`/api/subtitles/media/${activeEpisodeDoc._id}`);
      return res.data;
    },
    enabled: !!activeEpisodeDoc?._id
  });

  // Track user viewing progress (Continue Watching sync)
  useEffect(() => {
    if (!activeEpisodeDoc?._id || !videoRef.current) return;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        try {
          await axios.post('/api/media/continue-watching', {
            mediaId: drama._id,
            mediaType: 'Drama',
            seasonNumber: Number(seasonNumber),
            episodeNumber: Number(episodeNumber),
            progress: Math.floor(video.currentTime),
            duration: Math.floor(video.duration || 0)
          });
        } catch (err) {
          console.error('Error logging continue watching progress:', err);
        }
      }
    }, 15000); // sync every 15 seconds

    return () => clearInterval(interval);
  }, [activeEpisodeDoc, drama, seasonNumber, episodeNumber]);

  if (dramaLoading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opening Player...</span>
      </div>
    );
  }

  if (!drama || !activeEpisodeDoc) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-brand-secondary" />
        <p className="text-slate-400 text-sm">Requested episode is not imported yet.</p>
        <Link to={`/drama/${slug}`} className="px-4 py-2 bg-brand-primary rounded-xl text-xs font-bold text-white">Back to Details</Link>
      </div>
    );
  }

  // Prev / Next episodes buttons
  const prevEp = episodes.find(
    ep => getId(ep.seasonId) === getId(activeSeasonDoc?._id) && ep.episodeNumber === episodeNumber - 1
  );
  const nextEp = episodes.find(
    ep => getId(ep.seasonId) === getId(activeSeasonDoc?._id) && ep.episodeNumber === episodeNumber + 1
  );

  return (
    <div className="w-full bg-luxury-950 min-h-screen text-left pb-16 flex flex-col gap-6">
      
      {/* Episode dynamic SEO tags & schema */}
      <SeoTags
        title={`${drama.title} Season ${seasonNumber} Episode ${episodeNumber} Online | KDramaVerse`}
        description={activeEpisodeDoc.episodeDescription || `Watch ${drama.title} S${seasonNumber}E${episodeNumber} with subtitles.`}
        canonical={`https://kdramaverse.com/drama/${drama.slug}/season-${seasonNumber}/episode-${episodeNumber}`}
        schemaMarkup={activeEpisodeDoc.episodeSchemaMarkup}
      />

      {/* Top Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 flex items-center justify-between">
        <Link
          to={`/drama/${drama.slug}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Details
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Streaming: {drama.title} • Season {seasonNumber} • Episode {episodeNumber}
        </span>
      </div>

      {/* Main Video Cinema Wrapper */}
      <div className="w-full bg-black border-y border-white/5 flex items-center justify-center relative aspect-video max-h-[70vh]">
        
        {/* Render HTML5 video player with dynamic subtitles */}
        <video
          ref={videoRef}
          controls
          crossOrigin="anonymous"
          src={activeEpisodeDoc.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
          className="w-full h-full object-contain max-h-[70vh] focus:outline-none"
        >
          {subtitles.map((sub) => (
            <track
              key={sub._id}
              kind="subtitles"
              src={sub.fileUrl}
              srcLang={sub.language.slice(0, 2).toLowerCase()}
              label={sub.language}
              default={selectedSubTrack === sub._id}
            />
          ))}
          Your browser does not support HTML5 video player playback.
        </video>
      </div>

      {/* Player Meta Controls Box */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT: TITLE METADATA */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Episode {episodeNumber}: {activeEpisodeDoc.episodeTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {activeEpisodeDoc.episodeDescription || `Season ${seasonNumber} Episode ${episodeNumber} is now available on KDramaVerse. Contributors have uploaded multiple synced subtitles.`}
          </p>
          {activeEpisodeDoc.aiEpisodeSummary && (
            <p className="text-xs text-brand-primary mt-2 bg-brand-primary/10 border border-brand-primary/20 p-3 rounded-xl">
              <strong>AI Episode Synopsis:</strong> {activeEpisodeDoc.aiEpisodeSummary}
            </p>
          )}
        </div>

        {/* RIGHT: TRACK CONTROL & NAVIGATION */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col gap-4">
          
          {/* Subtitle track chooser */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Select Subtitle Track</label>
            <select
              value={selectedSubTrack}
              onChange={(e) => setSelectedSubTrack(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-luxury-800 border border-white/5 text-xs text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="">Off (Native Subtitle tracks)</option>
              {subtitles.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.language} ({sub.format.toUpperCase()})
                </option>
              ))}
            </select>
            {subtitles.length === 0 && (
              <p className="text-[10px] text-slate-500 mt-1">No community track files loaded yet.</p>
            )}
          </div>

          {/* Prev/Next Episode trigger */}
          <div className="flex gap-2">
            {prevEp ? (
              <button
                onClick={() => navigate(`/drama/${slug}/season-${seasonNumber}/episode-${prevEp.episodeNumber}`)}
                className="flex-1 h-10 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
              >
                Previous Episode
              </button>
            ) : (
              <div className="flex-1 h-10 border border-white/5 text-slate-600 rounded-xl flex items-center justify-center text-xs font-bold pointer-events-none">
                Start of Season
              </div>
            )}
            
            {nextEp ? (
              <button
                onClick={() => navigate(`/drama/${slug}/season-${seasonNumber}/episode-${nextEp.episodeNumber}`)}
                className="flex-1 h-10 bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
              >
                Next Episode
              </button>
            ) : (
              <div className="flex-1 h-10 border border-white/5 text-slate-600 rounded-xl flex items-center justify-center text-xs font-bold pointer-events-none">
                End of Season
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
