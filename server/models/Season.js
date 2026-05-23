const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  dramaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drama', required: true, index: true },
  seasonNumber: { type: Number, required: true },
  seasonDescription: { type: String },
  seasonPoster: { type: String },
  airDate: { type: Date }
}, { timestamps: true });

// Composite index to ensure uniqueness per drama
seasonSchema.index({ dramaId: 1, seasonNumber: 1 }, { unique: true });

module.exports = mongoose.model('Season', seasonSchema);
