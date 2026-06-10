import React from 'react';
import ArticleDetail from '@/features/articles/pages/ArticleDetail';

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/articles/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const article = data?.article;
      if (article) {
        return {
          title: article.metaTitle || `${article.title} | KSubZone Articles`,
          description: article.metaDescription || article.excerpt || 'Read this article on KSubZone.',
          keywords: article.seoKeywords || article.tags || [],
          alternates: {
            canonical: `https://ksubzone.com/articles/${slug}`,
          },
          openGraph: {
            title: article.metaTitle || article.title,
            description: article.metaDescription || article.excerpt,
            url: `https://ksubzone.com/articles/${slug}`,
            images: article.coverImage ? [{ url: article.coverImage }] : [],
            type: 'article',
          },
          twitter: {
            card: 'summary_large_image',
            title: article.metaTitle || article.title,
            description: article.metaDescription || article.excerpt,
            images: article.coverImage ? [article.coverImage] : [],
          },
        };
      }
    }
  } catch (e) {
    console.error('Error generating article metadata:', e);
  }
  return {
    title: 'KSubZone Article Details',
    description: 'Read the latest K-drama guides and reviews.',
  };
}

export default async function ArticleDetailPage({ params }) {
  const { slug } = params;
  let initialData = null;
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/articles/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (e) {
    console.error('Error fetching article details for page:', e);
  }

  return <ArticleDetail initialData={initialData} />;
}
