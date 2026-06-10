export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/management', '/profile', '/auth'],
      },
    ],
    sitemap: 'https://ksubzone.com/sitemap.xml',
  };
}
