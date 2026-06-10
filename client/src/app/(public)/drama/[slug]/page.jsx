import React from 'react';
import Detail from '@/features/media/pages/Detail';

export async function generateMetadata({ params }) {
  const { slug } = params;
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  try {
    const res = await fetch(`${backendUrl}/api/media/dramas/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const media = data?.drama;
      if (media) {
        return {
          title: media.metaTitle || `${media.title} Sinhala & English Subtitles | KSubZone`,
          description: media.metaDescription || `${media.description || media.title} Sinhala and English subtitle downloads.`,
          keywords: media.seoKeywords || [media.title.toLowerCase()],
          alternates: {
            canonical: `https://ksubzone.com/drama/${slug}`,
          },
          openGraph: {
            title: media.metaTitle || media.title,
            description: media.metaDescription || media.description,
            url: `https://ksubzone.com/drama/${slug}`,
            images: media.poster ? [{ url: media.poster }] : [],
            type: 'video.tv_show',
          },
          twitter: {
            card: 'summary_large_image',
            title: media.metaTitle || media.title,
            description: media.metaDescription || media.description,
            images: media.poster ? [media.poster] : [],
          },
        };
      }
    }
  } catch (e) {
    console.error('Error fetching drama metadata:', e);
  }
  return {
    title: 'TV Drama Subtitles | KSubZone',
    description: 'Download synchronized Sinhala & English subtitles.',
  };
}

export default async function DramaDetailPage({ params }) {
  const { slug } = params;
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  let initialData = null;
  try {
    const res = await fetch(`${backendUrl}/api/media/dramas/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (e) {
    console.error('Error fetching drama details for page:', e);
  }

  return <Detail type="Drama" initialData={initialData} />;
}
