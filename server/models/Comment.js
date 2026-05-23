const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  targetType: { type: String, enum: ['Movie', 'Drama', 'Episode', 'Review', 'Subtitle'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
