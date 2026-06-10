import React from 'react';
   import Detail from '@/features/media/pages/Detail';

   export async function generateMetadata({ params }) {
     const { slug } = params;
     try {
       const res = await fetch(`http://127.0.0.1:5000/api/media/movies/${slug}`, { cache: 'no-store' });
       if (res.ok) {
         const data = await res.json();
         const media = data?.movie;
         if (media) {
           return {
             title: media.metaTitle || `${media.title} Sinhala & English Subtitles | KSubZone`,
             description: media.metaDescription || `${media.description || media.title} Sinhala and English subtitle downloads.`,
             keywords: media.seoKeywords || [media.title.toLowerCase()],
             alternates: {
               canonical: `https://ksubzone.com/movie/${slug}`,
             },
             openGraph: {
               title: media.metaTitle || media.title,
               description: media.metaDescription || media.description,
               url: `https://ksubzone.com/movie/${slug}`,
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
       }
     } catch (e) {
       console.error('Error fetching movie metadata:', e);
     }
     return {
       title: 'Movie Subtitles | KSubZone',
       description: 'Download synchronized Sinhala & English subtitles.',
     };
   }

   export default async function MovieDetailPage({ params }) {
     const { slug } = params;
     let initialData = null;
     try {
       const res = await fetch(`http://127.0.0.1:5000/api/media/movies/${slug}`, { cache: 'no-store' });
       if (res.ok) {
         initialData = await res.json();
       }
     } catch (e) {
       console.error('Error fetching movie details for page:', e);
     }

     return <Detail type="Movie" initialData={initialData} />;
   }
