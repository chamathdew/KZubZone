const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');

router.get('/robots.txt', seoController.getRobotsTxt);
router.get('/sitemap.xml', seoController.getSitemapIndex);
router.get('/sitemap-movies.xml', seoController.getMoviesSitemap);
router.get('/sitemap-dramas.xml', seoController.getDramasSitemap);
router.get('/sitemap-episodes.xml', seoController.getEpisodesSitemap);
router.get('/news-sitemap.xml', seoController.getNewsSitemap);

module.exports = router;
