const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const continueWatchingSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, required: true },
  mediaType: { type: String, enum: ['Movie', 'Drama'], required: true },
  seasonNumber: { type: Number },
  episodeNumber: { type: Number },
  progress: { type: Number, default: 0 }, // in seconds or percentage
  duration: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  favorites: [{
    mediaId: { type: mongoose.Schema.Types.ObjectId, required: true },
    mediaType: { type: String, enum: ['Movie', 'Drama'], required: true }
  }],
  watchlist: [{
    mediaId: { type: mongoose.Schema.Types.ObjectId, required: true },
    mediaType: { type: String, enum: ['Movie', 'Drama'], required: true }
  }],
  continueWatching: [continueWatchingSchema],
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
