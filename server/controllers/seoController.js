const Movie = require('../models/Movie');
const Drama = require('../models/Drama');
const Season = require('../models/Season');
const Episode = require('../models/Episode');

const SITE_URL = 'https://kdramaverse.com';

// robots.txt
exports.getRobotsTxt = (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /management/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`);
};

// sitemap.xml (Index)
exports.getSitemapIndex = (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-movies.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-dramas.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-episodes.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/news-sitemap.xml</loc>
  </sitemap>
</sitemapindex>
`);
};

// sitemap-movies.xml
exports.getMoviesSitemap = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: 'Published' }).select('slug updatedAt');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    movies.forEach(movie => {
      xml += `
  <url>
    <loc>${SITE_URL}/movie/${movie.slug}</loc>
    <lastmod>${movie.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

// sitemap-dramas.xml
exports.getDramasSitemap = async (req, res, next) => {
  try {
    const dramas = await Drama.find({ status: 'Published' }).select('slug updatedAt');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    dramas.forEach(drama => {
      xml += `
  <url>
    <loc>${SITE_URL}/drama/${drama.slug}</loc>
    <lastmod>${drama.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/drama/${drama.slug}/season-1</loc>
    <lastmod>${drama.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

// sitemap-episodes.xml
exports.getEpisodesSitemap = async (req, res, next) => {
  try {
    const episodes = await Episode.find()
      .populate('dramaId', 'slug')
      .populate('seasonId', 'seasonNumber')
      .select('episodeNumber dramaId seasonId updatedAt');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    episodes.forEach(ep => {
      if (ep.dramaId && ep.seasonId) {
        xml += `
  <url>
    <loc>${SITE_URL}/drama/${ep.dramaId.slug}/season-${ep.seasonId.seasonNumber}/episode-${ep.episodeNumber}</loc>
    <lastmod>${ep.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
      }
    });

    xml += `\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

// news-sitemap.xml (Google News standard sitemap)
exports.getNewsSitemap = async (req, res, next) => {
  try {
    // Get movies/dramas updated in the last 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const recentMovies = await Movie.find({ status: 'Published', createdAt: { $gte: twoDaysAgo } }).limit(10);
    const recentDramas = await Drama.find({ status: 'Published', createdAt: { $gte: twoDaysAgo } }).limit(10);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

    recentMovies.forEach(movie => {
      xml += `
  <url>
    <loc>${SITE_URL}/movie/${movie.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>KDramaVerse News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${movie.createdAt.toISOString()}</news:publication_date>
      <news:title>${movie.title} - Imported and Available with Subtitles</news:title>
    </news:news>
  </url>`;
    });

    recentDramas.forEach(drama => {
      xml += `
  <url>
    <loc>${SITE_URL}/drama/${drama.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>KDramaVerse News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${drama.createdAt.toISOString()}</news:publication_date>
      <news:title>${drama.title} - Now Streaming on KDramaVerse</news:title>
    </news:news>
  </url>`;
    });

    xml += `\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};
