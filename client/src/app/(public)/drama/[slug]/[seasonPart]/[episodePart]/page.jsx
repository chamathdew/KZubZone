import React from 'react';
import Watch from '@/features/media/pages/Watch';

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.$oid || String(value);
};

export async function generateMetadata({ params }) {
  const { slug, seasonPart, episodePart } = params;
  const seasonNumber = Number(String(seasonPart || '').replace('season-', ''));
  const episodeNumber = Number(String(episodePart || '').replace('episode-', ''));
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

  try {
    const res = await fetch(`${backendUrl}/api/media/dramas/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const drama = data?.drama;
      const episodes = data?.episodes || [];
      const activeSeasonDoc = data?.seasons?.find(s => s.seasonNumber === seasonNumber);
      const activeEpisodeDoc = episodes.find(
        ep => getId(ep.seasonId) === getId(activeSeasonDoc?._id) && ep.episodeNumber === episodeNumber
      );

      if (drama && activeEpisodeDoc) {
        return {
          title: `${drama.title} Season ${seasonNumber} Episode ${episodeNumber} Subtitles | KSubZone`,
          description: activeEpisodeDoc.episodeDescription || `Download Sinhala and English subtitles for ${drama.title} S${seasonNumber}E${episodeNumber}.`,
          alternates: {
            canonical: `https://ksubzone.com/drama/${slug}/season-${seasonNumber}/episode-${episodeNumber}`,
          },
          openGraph: {
            title: `${drama.title} S${seasonNumber}E${episodeNumber} Subtitles`,
            description: activeEpisodeDoc.episodeDescription,
            url: `https://ksubzone.com/drama/${slug}/season-${seasonNumber}/episode-${episodeNumber}`,
            images: drama.poster ? [{ url: drama.poster }] : [],
            type: 'video.episode',
          },
        };
      }
    }
  } catch (e) {
    console.error('Error generating episode watch metadata:', e);
  }

  return {
    title: 'Watch Episode Subtitles | KSubZone',
    description: 'Download synchronized Sinhala & English subtitles.',
  };
}

export default async function EpisodeWatchPage({ params }) {
  const { slug } = params;
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  let initialDramaData = null;

  try {
    const res = await fetch(`${backendUrl}/api/media/dramas/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      initialDramaData = await res.json();
    }
  } catch (e) {
    console.error('Error fetching drama details for watch page:', e);
  }

  return <Watch initialDramaData={initialDramaData} />;
}
