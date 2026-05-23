const Movie = require('../models/Movie');
const Drama = require('../models/Drama');
const Episode = require('../models/Episode');
const User = require('../models/User');
const Subtitle = require('../models/Subtitle');
const Review = require('../models/Review');
const Analytics = require('../models/Analytics');

// FETCH ALL ANALYTICS COUNTERS & HEALTH SCORES
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalDramas = await Drama.countDocuments();
    const totalEpisodes = await Episode.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalSubtitles = await Subtitle.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Fetch or generate SEO health score
    let analyticsRecord = await Analytics.findOne();
    if (!analyticsRecord) {
      analyticsRecord = new Analytics({
        seoHealthScore: 98,
        trafficLogs: [
          { date: '2026-05-18', views: 120, uniqueVisitors: 80 },
          { date: '2026-05-19', views: 240, uniqueVisitors: 150 },
          { date: '2026-05-20', views: 310, uniqueVisitors: 190 },
          { date: '2026-05-21', views: 420, uniqueVisitors: 280 },
          { date: '2026-05-22', views: 530, uniqueVisitors: 360 }
        ]
      });
      await analyticsRecord.save();
    }

    // Top viewed items
    const topMovies = await Movie.find().sort({ viewCount: -1 }).limit(3).select('title slug viewCount tmdbRating');
    const topDramas = await Drama.find().sort({ viewCount: -1 }).limit(3).select('title slug viewCount tmdbRating');

    const topContent = [...topMovies.map(m => ({ ...m._doc, type: 'Movie' })), ...topDramas.map(d => ({ ...d._doc, type: 'Drama' }))]
      .sort((a, b) => b.viewCount - a.viewCount);

    return res.status(200).json({
      counts: {
        totalMovies,
        totalDramas,
        totalEpisodes,
        totalUsers,
        totalSubtitles,
        totalReviews
      },
      seoHealthScore: analyticsRecord.seoHealthScore,
      trafficLogs: analyticsRecord.trafficLogs,
      trendingSearches: analyticsRecord.trendingSearches || [],
      topContent
    });
  } catch (error) {
    next(error);
  }
};

// LOG TRAFFIC (MIDDELWARE-LIKE HOOK FOR VIEW COUNTER)
exports.logPageVisit = async (req, res, next) => {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    let record = await Analytics.findOne();
    if (!record) {
      record = new Analytics();
    }

    const logIndex = record.trafficLogs.findIndex(log => log.date === todayStr);
    if (logIndex > -1) {
      record.trafficLogs[logIndex].views += 1;
    } else {
      record.trafficLogs.push({ date: todayStr, views: 1, uniqueVisitors: 1 });
    }

    await record.save();
    if (res) return res.status(200).json({ message: 'Visit logged successfully' });
  } catch (error) {
    console.error('Error logging visit:', error);
    if (next) next(error);
  }
};

// RECORD SEARCH HISTORY
exports.logSearchQuery = async (queryStr) => {
  if (!queryStr || queryStr.trim() === '') return;
  try {
    let record = await Analytics.findOne();
    if (!record) {
      record = new Analytics();
    }

    const searchIndex = record.trendingSearches.findIndex(s => s.query.toLowerCase() === queryStr.toLowerCase());
    if (searchIndex > -1) {
      record.trendingSearches[searchIndex].count += 1;
      record.trendingSearches[searchIndex].lastSearched = new Date();
    } else {
      record.trendingSearches.push({ query: queryStr, count: 1 });
    }

    // Sort to keep most searched items
    record.trendingSearches.sort((a, b) => b.count - a.count);
    // Keep max 10 keywords
    if (record.trendingSearches.length > 15) {
      record.trendingSearches.pop();
    }

    await record.save();
  } catch (error) {
    console.error('Error logging search query:', error);
  }
};

// PUBLIC SEARCH ANALYTICS ENDPOINT
exports.logSearchQueryRequest = async (req, res, next) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    await exports.logSearchQuery(query.trim());
    return res.status(200).json({ message: 'Search query logged' });
  } catch (error) {
    next(error);
  }
};
