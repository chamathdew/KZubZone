import React from 'react';
import { cache } from 'react';
import Detail from '@/features/media/pages/Detail';

const getMovie = cache(async (slug) => {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  try {
    const res = await fetch(`${backendUrl}/api/media/movies/${slug}`, { next: { revalidate: 86400 } });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.error('Error fetching movie details for cache:', e);
  }
  return null;
});

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const data = await getMovie(slug);
    const media = data?.movie;
    if (media) {
      return {
        title: media.metaTitle || `${media.title} Sinhala & English Subtitles | KSubZone`,
        description: media.metaDescription || `${media.description || media.title} Sinhala and English subtitle downloads.`,
        keywords: media.seoKeywords || (media.title ? [media.title.toLowerCase()] : []),
        alternates: {
          canonical: `https://www.ksubzone.com/movie/${slug}`,
        },
        openGraph: {
          title: media.metaTitle || media.title,
          description: media.metaDescription || media.description,
          url: `https://www.ksubzone.com/movie/${slug}`,
          images: media.poster ? [{ url: media.poster }] : [],
          type: 'video.movie',
        },
        twitter: {
          card: 'summary_large_image',
          title: media.metaTitle || media.title,
          description: media.metaDescription || media.description,
          images: media.poster ? [media.poster] : [],
        },
      };
    }
  } catch (e) {
    console.error('Error generating movie metadata:', e);
  }
  return {
    title: 'Movie Subtitles | KSubZone',
    description: 'Download synchronized Sinhala & English subtitles.',
  };
}

export default async function MovieDetailPage({ params }) {
  const { slug } = params;
  const initialData = await getMovie(slug);
  const media = initialData?.movie;

  const breadcrumbs = media ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "KSubZone",
        "item": "https://www.ksubzone.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Movies",
        "item": "https://www.ksubzone.com/movies"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": media.title,
        "item": `https://www.ksubzone.com/movie/${slug}`
      }
    ]
  } : null;

  return (
    <>
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      )}
      <Detail type="Movie" initialData={initialData} />
    </>
  );
}
