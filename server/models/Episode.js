const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  dramaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drama', required: true, index: true },
  seasonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true, index: true },
  episodeNumber: { type: Number, required: true },
  episodeTitle: { type: String, required: true },
  episodeDescription: { type: String },
  episodeThumbnail: { type: String },
  airDate: { type: Date },
  runtime: { type: Number },
  trailer: { type: String },
  videoUrl: { type: String, default: '' }, // Source URL for video playback
  
  // AI Generated fields
  aiEpisodeSummary: { type: String },
  episodeSchemaMarkup: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Composite index to ensure uniqueness per season
episodeSchema.index({ seasonId: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.model('Episode', episodeSchema);
