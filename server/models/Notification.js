const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // null means broadcast to all users
  recipientType: { type: String, enum: ['User', 'Admin'], default: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['system', 'subtitle_approved', 'subtitle_rejected', 'comment_reply', 'alert'], default: 'system' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
