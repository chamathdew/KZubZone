const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const analyticsController = require('../controllers/analyticsController');
const tmdbController = require('../controllers/tmdbController');
const movieController = require('../controllers/movieController');
const dramaController = require('../controllers/dramaController');
const subtitleController = require('../controllers/subtitleController');
const commentController = require('../controllers/commentController');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { protectAdmin, hasPermission } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

// Admin Authentication Paths
router.post('/login', authLimiter, authController.adminLogin);
router.get('/me', protectAdmin, authController.getAdminMe);

// Analytics dashboard
router.get('/dashboard', protectAdmin, hasPermission('view_analytics'), analyticsController.getDashboardStats);

// TMDB Importer routes
router.get('/tmdb/search', protectAdmin, hasPermission('manage_movies'), tmdbController.searchTmdb);
router.post('/tmdb/import', protectAdmin, hasPermission('manage_movies'), tmdbController.importFromTmdb);

// CRUD movies
router.post('/movies', protectAdmin, hasPermission('manage_movies'), movieController.createMovie);
router.put('/movies/:id', protectAdmin, hasPermission('manage_movies'), movieController.updateMovie);
router.delete('/movies/:id', protectAdmin, hasPermission('manage_movies'), movieController.deleteMovie);

// CRUD dramas
router.post('/dramas', protectAdmin, hasPermission('manage_dramas'), dramaController.createDrama);
router.put('/dramas/:id', protectAdmin, hasPermission('manage_dramas'), dramaController.updateDrama);
router.delete('/dramas/:id', protectAdmin, hasPermission('manage_dramas'), dramaController.deleteDrama);

// CRUD seasons
router.post('/seasons', protectAdmin, hasPermission('manage_dramas'), dramaController.addSeason);
router.put('/seasons/:id', protectAdmin, hasPermission('manage_dramas'), dramaController.editSeason);
router.delete('/seasons/:id', protectAdmin, hasPermission('manage_dramas'), dramaController.deleteSeason);

// CRUD episodes
router.post('/episodes', protectAdmin, hasPermission('manage_dramas'), dramaController.addEpisode);
router.put('/episodes/:id', protectAdmin, hasPermission('manage_dramas'), dramaController.editEpisode);
router.delete('/episodes/:id', protectAdmin, hasPermission('manage_dramas'), dramaController.deleteEpisode);

// Subtitle approval queue
router.get('/subtitles', protectAdmin, hasPermission('approve_subtitles'), subtitleController.getModerationQueue);
router.put('/subtitles/:id/approve', protectAdmin, hasPermission('approve_subtitles'), subtitleController.updateApprovalStatus);

// Comments & Reviews moderation
router.get('/reviews', protectAdmin, hasPermission('manage_comments'), commentController.adminGetAllReviews);
router.delete('/reviews/:id', protectAdmin, hasPermission('manage_comments'), commentController.adminDeleteReview);
router.get('/comments', protectAdmin, hasPermission('manage_comments'), commentController.adminGetAllComments);
router.delete('/comments/:id', protectAdmin, hasPermission('manage_comments'), commentController.adminDeleteComment);

// Admin: User status toggles
router.get('/users', protectAdmin, hasPermission('manage_users'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/status', protectAdmin, hasPermission('manage_users'), async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: `User status changed to ${status}`, user });
  } catch (error) {
    next(error);
  }
});

// Admin: Settings management
router.get('/settings', protectAdmin, hasPermission('manage_settings'), async (req, res, next) => {
  try {
    const settings = await Setting.find();
    return res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
});

router.post('/settings', protectAdmin, hasPermission('manage_settings'), async (req, res, next) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ message: 'Key and Value are required' });
  }

  try {
    const setting = await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
    return res.status(200).json({ message: 'Settings saved successfully', setting });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
