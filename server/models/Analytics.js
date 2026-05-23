const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  views: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 }
});

const searchHistorySchema = new mongoose.Schema({
  query: { type: String, required: true },
  count: { type: Number, default: 1 },
  lastSearched: { type: Date, default: Date.now }
});

const analyticsSchema = new mongoose.Schema({
  seoHealthScore: { type: Number, default: 100 },
  topContent: [{
    mediaId: { type: mongoose.Schema.Types.ObjectId },
    mediaType: { type: String, enum: ['Movie', 'Drama'] },
    title: { type: String },
    views: { type: Number, default: 0 }
  }],
  trafficLogs: [trafficLogSchema],
  trendingSearches: [searchHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
