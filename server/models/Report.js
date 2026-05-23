const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['Subtitle', 'Comment', 'Review'], required: true },
  reason: { type: String, required: true }, // e.g. "Spam", "Wrong Sync", "Inappropriate Language"
  details: { type: String },
  status: { type: String, enum: ['Pending', 'Resolved', 'Dismissed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
