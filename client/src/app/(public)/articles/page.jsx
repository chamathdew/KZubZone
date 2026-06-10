import React from 'react';
import Articles from '@/features/articles/pages/Articles';

export const metadata = {
  title: 'KSubZone Articles - K-Drama Guides, Reviews & Sinhala Subtitle Notes',
  description: 'Read Korean drama articles, watch guides, character analysis, Sinhala subtitle notes, and movie recommendations on KSubZone.',
  keywords: ['kdrama articles', 'korean drama guides', 'sinhala subtitles', 'ksubzone articles'],
  alternates: {
    canonical: 'https://ksubzone.com/articles',
  },
};

export default async function ArticlesPage() {
  let initialData = null;
  try {
    const res = await fetch('http://127.0.0.1:5000/api/articles?limit=30', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      initialData = data.articles || [];
    }
  } catch (e) {
    console.error('Error fetching articles for page:', e);
  }

  return <Articles initialData={initialData} />;
}
