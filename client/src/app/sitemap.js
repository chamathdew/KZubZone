import { permalinkSlug } from '@/utils/slug';

export default async function sitemap() {
  const baseUrl = 'https://ksubzone.com';

  const defaultUrls = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/search`, lastModified: new Date() },
    { url: `${baseUrl}/articles`, lastModified: new Date() },
    { url: `${baseUrl}/auth`, lastModified: new Date() },
  ];

  let movieUrls = [];
  let dramaUrls = [];
  let articleUrls = [];

  try {
    const moviesRes = await fetch('http://127.0.0.1:5000/api/media/movies?limit=500', { cache: 'no-store' });
    if (moviesRes.ok) {
      const data = await moviesRes.json();
      movieUrls = (data.movies || []).map((m) => ({
        url: `${baseUrl}/movie/${permalinkSlug(m)}`,
        lastModified: new Date(m.updatedAt || m.createdAt || Date.now()),
      }));
    }
  } catch (e) {
    console.error('Sitemap movies fetch failed:', e);
  }

  try {
    const dramasRes = await fetch('http://127.0.0.1:5000/api/media/dramas?limit=500', { cache: 'no-store' });
    if (dramasRes.ok) {
      const data = await dramasRes.json();
      dramaUrls = (data.dramas || []).map((d) => ({
        url: `${baseUrl}/drama/${permalinkSlug(d)}`,
        lastModified: new Date(d.updatedAt || d.createdAt || Date.now()),
      }));
    }
  } catch (e) {
    console.error('Sitemap dramas fetch failed:', e);
  }

  try {
    const articlesRes = await fetch('http://127.0.0.1:5000/api/articles?limit=500', { cache: 'no-store' });
    if (articlesRes.ok) {
      const data = await articlesRes.json();
      articleUrls = (data.articles || []).map((a) => ({
        url: `${baseUrl}/articles/${a.slug}`,
        lastModified: new Date(a.publishedAt || a.updatedAt || Date.now()),
      }));
    }
  } catch (e) {
    console.error('Sitemap articles fetch failed:', e);
  }

  return [...defaultUrls, ...movieUrls, ...dramaUrls, ...articleUrls];
}
