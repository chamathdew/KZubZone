import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api/apiClient';
import { ArrowLeft, AlertTriangle, Download, Languages, ShieldCheck } from 'lucide-react';
import SeoTags from '../../components/seo/SeoTags';
import { permalinkSlug } from '../../utils/slug';

export default function Watch() {
  const { slug, seasonPart, episodePart } = useParams();
  const navigate = useNavigate();

  const seasonNumber = Number(String(seasonPart || '').replace('season-', ''));
  const episodeNumber = Number(String(episodePart || '').replace('episode-', ''));
  
  // 1. Fetch Drama Details to identify Episode and Season IDs
  const { data: dramaData, isLoading: dramaLoading } = useQuery({
    queryKey: ['dramaDetails', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/api/media/dramas/${slug}`);
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
      const res = await apiClient.get(`/api/subtitles/media/${activeEpisodeDoc._id}`);
      return res.data;
    },
    enabled: !!activeEpisodeDoc?._id
  });
  const sortedSubtitles = [...subtitles].sort((a, b) => {
    const aSinhala = a.language?.toLowerCase() === 'sinhala' ? 0 : 1;
    const bSinhala = b.language?.toLowerCase() === 'sinhala' ? 0 : 1;
    return aSinhala - bSinhala;
  });

  if (dramaLoading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opening Subtitles...</span>
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
  const dramaPermalink = permalinkSlug(drama);
  const handleDownloadSubtitle = async (subId, fileUrl) => {
    try {
      await apiClient.post(`/api/subtitles/${subId}/download`);
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error(err);
    }
  };
  const getUploaderLabel = (sub) => {
    if (sub.uploaderRole === 'Admin') return `Admin: ${sub.adminUploader?.username || 'Admin'}`;
    return `User: ${sub.uploader?.username || 'Translator'}`;
  };

  return (
    <div className="w-full bg-transparent min-h-screen text-left pb-16 flex flex-col gap-6">
      
      {/* Episode dynamic SEO tags & schema */}
      <SeoTags
        title={`${drama.title} Season ${seasonNumber} Episode ${episodeNumber} Subtitles | KSubZone`}
        description={activeEpisodeDoc.episodeDescription || `Download Sinhala and English subtitles for ${drama.title} S${seasonNumber}E${episodeNumber}.`}
        canonical={`https://ksubzone.com/drama/${dramaPermalink}/season-${seasonNumber}/episode-${episodeNumber}`}
        schemaMarkup={activeEpisodeDoc.episodeSchemaMarkup}
      />

      {/* Top Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 flex items-center justify-between">
        <Link
          to={`/drama/${dramaPermalink}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Details
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Subtitles: {drama.title} • Season {seasonNumber} • Episode {episodeNumber}
        </span>
      </div>

      {/* Episode Subtitle Controls Box */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT: TITLE METADATA */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Episode {episodeNumber}: {activeEpisodeDoc.episodeTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {activeEpisodeDoc.episodeDescription || `Season ${seasonNumber} Episode ${episodeNumber} subtitle files are collected here. Sinhala and English releases are supported.`}
          </p>
          {activeEpisodeDoc.aiEpisodeSummary && (
            <p className="text-xs text-brand-primary mt-2 bg-brand-primary/10 border border-brand-primary/20 p-3 rounded-xl">
              <strong>AI Episode Synopsis:</strong> {activeEpisodeDoc.aiEpisodeSummary}
            </p>
          )}
        </div>

        {/* RIGHT: SUBTITLE DOWNLOADS & NAVIGATION */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col gap-4">
          
          {/* Subtitle file list */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 block">Episode Subtitle Files</label>
            {subtitles.length === 0 && (
              <p className="text-[10px] text-slate-500 mt-1">No Sinhala or English subtitles uploaded for this episode yet.</p>
            )}
            {sortedSubtitles.length > 0 && (
              <div className="flex flex-col gap-2">
                {sortedSubtitles.map((sub) => (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => handleDownloadSubtitle(sub._id, sub.fileUrl)}
                    className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-brand-primary/30 hover:bg-white/[0.06] transition text-left"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-white uppercase inline-flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-emerald-300" /> {sub.language} ({sub.format.toUpperCase()})
                      </span>
                      <Download className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      Version {sub.version} • {getUploaderLabel(sub)} • {sub.downloads || 0} downloads
                    </span>
                    {sub.uploaderRole === 'Admin' && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-sky-300">
                        <ShieldCheck className="w-3 h-3" /> Admin upload
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prev/Next Episode trigger */}
          <div className="flex gap-2">
            {prevEp ? (
              <button
                onClick={() => navigate(`/drama/${dramaPermalink}/season-${seasonNumber}/episode-${prevEp.episodeNumber}`)}
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
                onClick={() => navigate(`/drama/${dramaPermalink}/season-${seasonNumber}/episode-${nextEp.episodeNumber}`)}
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
