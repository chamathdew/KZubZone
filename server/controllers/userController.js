const User = require('../models/User');
const Notification = require('../models/Notification');
const Movie = require('../models/Movie');
const Drama = require('../models/Drama');

// GET USER PROFILE
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// UPDATE USER SETTINGS
exports.updateUserProfile = async (req, res, next) => {
  const { username, email, avatar, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (password) user.password = password; // pre-save hooks will encrypt

    await user.save();
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// TOGGLE WATCHLIST
exports.toggleWatchlist = async (req, res, next) => {
  const { mediaId, mediaType } = req.body; // mediaType: 'Movie' or 'Drama'

  if (!mediaId || !mediaType) {
    return res.status(400).json({ message: 'mediaId and mediaType are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    const existingIndex = user.watchlist.findIndex(w => w.mediaId.toString() === mediaId.toString());

    if (existingIndex > -1) {
      // Remove from watchlist
      user.watchlist.splice(existingIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Removed from Watchlist', watchlist: user.watchlist });
    } else {
      // Add to watchlist
      user.watchlist.push({ mediaId, mediaType });
      await user.save();
      return res.status(200).json({ message: 'Added to Watchlist', watchlist: user.watchlist });
    }
  } catch (error) {
    next(error);
  }
};

// TOGGLE FAVORITES
exports.toggleFavorites = async (req, res, next) => {
  const { mediaId, mediaType } = req.body;

  if (!mediaId || !mediaType) {
    return res.status(400).json({ message: 'mediaId and mediaType are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    const existingIndex = user.favorites.findIndex(f => f.mediaId.toString() === mediaId.toString());

    if (existingIndex > -1) {
      user.favorites.splice(existingIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Removed from Favorites', favorites: user.favorites });
    } else {
      user.favorites.push({ mediaId, mediaType });
      await user.save();
      return res.status(200).json({ message: 'Added to Favorites', favorites: user.favorites });
    }
  } catch (error) {
    next(error);
  }
};

// TRACK CONTINUE WATCHING
exports.updateContinueWatching = async (req, res, next) => {
  const { mediaId, mediaType, seasonNumber, episodeNumber, progress, duration } = req.body;
  if (!mediaId || !mediaType) {
    return res.status(400).json({ message: 'mediaId and mediaType are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    const existingIndex = user.continueWatching.findIndex(item => item.mediaId.toString() === mediaId.toString());

    const record = {
      mediaId,
      mediaType,
      seasonNumber,
      episodeNumber,
      progress,
      duration,
      updatedAt: new Date()
    };

    if (existingIndex > -1) {
      user.continueWatching[existingIndex] = record;
    } else {
      user.continueWatching.push(record);
    }

    // Sort to keep newest updates first
    user.continueWatching.sort((a, b) => b.updatedAt - a.updatedAt);
    // Keep max 20 continue watching entries
    if (user.continueWatching.length > 20) {
      user.continueWatching.pop();
    }

    await user.save();
    return res.status(200).json({ message: 'Play progress updated', continueWatching: user.continueWatching });
  } catch (error) {
    next(error);
  }
};

// GET USER NOTIFICATIONS
exports.getUserNotifications = async (req, res, next) => {
  try {
    // Return system broadcasts (recipient: null) and direct user alerts
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user.id },
        { recipient: null, recipientType: 'User' }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

// MARK NOTIFICATION READ
exports.markNotificationRead = async (req, res, next) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.status(200).json({ message: 'Notification marked read', notification });
  } catch (error) {
    next(error);
  }
};
