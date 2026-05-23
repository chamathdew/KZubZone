const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const dramaController = require('../controllers/dramaController');
const userController = require('../controllers/userController');
const commentController = require('../controllers/commentController');
const { protectUser } = require('../middleware/auth');

// Public Movies lists & details
router.get('/movies', movieController.getAllMovies);
router.get('/movies/:slug', movieController.getMovieBySlug);

// Public Dramas lists & details
router.get('/dramas', dramaController.getAllDramas);
router.get('/dramas/:slug', dramaController.getDramaBySlug);

// Protected Favorites & Watchlist & Playback tracking
router.post('/watchlist', protectUser, userController.toggleWatchlist);
router.post('/favorites', protectUser, userController.toggleFavorites);
router.post('/continue-watching', protectUser, userController.updateContinueWatching);

// Community Reviews & Feedback
router.post('/reviews', protectUser, commentController.addReview);
router.get('/:mediaId/reviews', commentController.getReviewsForMedia);
router.post('/reviews/:id/like', protectUser, commentController.likeReview);

// Discussion comments threads
router.post('/comments', protectUser, commentController.addComment);
router.get('/comments/target/:targetId', commentController.getCommentsForTarget);
router.post('/comments/:commentId/reply', protectUser, commentController.addReply);
router.post('/comments/:id/like', protectUser, commentController.likeComment);

module.exports = router;
