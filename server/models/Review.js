const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  mediaType: { type: String, enum: ['Movie', 'Drama'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  content: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Approved' }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
