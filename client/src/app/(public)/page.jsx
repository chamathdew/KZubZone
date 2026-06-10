import React from 'react';
import Home from '@/features/media/pages/Home';

export async function generateMetadata() {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  try {
    const res = await fetch(`${backendUrl}/api/site-content`, { next: { revalidate: 30 } });
    if (res.ok) {
      const data = await res.json();
      const seo = data.seo || {};
      const brand = data.brand || {};
      return {
        title: seo.homeTitle || `${brand.siteName || 'KSubZone'} - ${brand.tagline || 'K-Drama & Movie Subtitles'}`,
        description: seo.homeDescription || 'Download synchronized Sinhala and English subtitles for Korean dramas and movies.',
        keywords: seo.keywords || 'ksubzone, k-drama subtitles, sinhala subtitles, korean movies',
        alternates: {
          canonical: brand.primaryUrl || 'https://ksubzone.com',
        },
        openGraph: {
          title: seo.homeTitle || brand.siteName || 'KSubZone',
          description: seo.homeDescription,
          url: brand.primaryUrl || 'https://ksubzone.com',
          siteName: brand.siteName || 'KSubZone',
          images: seo.ogImage ? [{ url: seo.ogImage }] : [],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: seo.homeTitle || brand.siteName || 'KSubZone',
          description: seo.homeDescription,
          images: seo.ogImage ? [seo.ogImage] : [],
        },
      };
    }
  } catch (e) {
    console.error('Error generating home metadata:', e);
  }
  return {
    title: 'KSubZone - Sinhala & English K-Drama Subtitles',
    description: 'Download synchronized Sinhala and English SRT, VTT, and ASS community subtitles for Korean dramas and movies.',
  };
}

export default function HomePage() {
  return <Home />;
}
