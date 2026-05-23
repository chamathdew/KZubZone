const mongoose = require('mongoose');

const subtitleRatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, min: 1, max: 5, required: true }
});

const subtitleSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  mediaType: { type: String, enum: ['Movie', 'Drama', 'Episode'], required: true },
  language: { type: String, required: true }, // e.g. "English", "Spanish"
  version: { type: String, default: '1.0' },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileUrl: { type: String, required: true }, // URL to storage/Cloudinary
  format: { type: String, enum: ['srt', 'vtt', 'ass', 'SRT', 'VTT', 'ASS'], required: true },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratings: [subtitleRatingSchema],
  approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  releaseNotes: { type: String },
  moderatorNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Subtitle', subtitleSchema);
