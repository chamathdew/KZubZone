const Review = require('../models/Review');
const Comment = require('../models/Comment');
const Movie = require('../models/Movie');
const Drama = require('../models/Drama');

/* --- REVIEWS --- */

exports.addReview = async (req, res, next) => {
  const { mediaId, mediaType, rating, content } = req.body;
  if (!mediaId || !mediaType || !rating || !content) {
    return res.status(400).json({ message: 'mediaId, mediaType, rating (1-10), and content are required' });
  }

  try {
    // Check if user already reviewed
    const existing = await Review.findOne({ mediaId, user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a review for this content' });
    }

    const review = new Review({
      mediaId,
      mediaType,
      user: req.user.id,
      rating,
      content
    });

    await review.save();

    // Dynamically update average rating of Movie or Drama
    const Model = mediaType === 'Movie' ? Movie : Drama;
    const allReviews = await Review.find({ mediaId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Model.findByIdAndUpdate(mediaId, { imdbRating: parseFloat(avgRating.toFixed(1)) });

    return res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    next(error);
  }
};

exports.getReviewsForMedia = async (req, res, next) => {
  const { mediaId } = req.params;
  try {
    const reviews = await Review.find({ mediaId, status: 'Approved' })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

exports.likeReview = async (req, res, next) => {
  const { id } = req.params;
  try {
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const likeIndex = review.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      review.likes.splice(likeIndex, 1); // Unlike
    } else {
      review.likes.push(req.user.id); // Like
    }

    await review.save();
    return res.status(200).json({ message: 'Review liked/unliked', likes: review.likes.length });
  } catch (error) {
    next(error);
  }
};

/* --- COMMENTS & NESTED REPLIES --- */

exports.addComment = async (req, res, next) => {
  const { targetId, targetType, content } = req.body;
  if (!targetId || !targetType || !content) {
    return res.status(400).json({ message: 'targetId, targetType, and content are required' });
  }

  try {
    const comment = new Comment({
      targetId,
      targetType,
      user: req.user.id,
      content
    });

    await comment.save();
    return res.status(201).json({ message: 'Comment posted', comment });
  } catch (error) {
    next(error);
  }
};

exports.getCommentsForTarget = async (req, res, next) => {
  const { targetId } = req.params;
  try {
    const comments = await Comment.find({ targetId })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

exports.addReply = async (req, res, next) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Reply content is required' });
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({
      user: req.user.id,
      content,
      likes: []
    });

    await comment.save();
    return res.status(201).json({ message: 'Reply added successfully', comment });
  } catch (error) {
    next(error);
  }
};

exports.likeComment = async (req, res, next) => {
  const { id } = req.params;
  try {
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const likeIndex = comment.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.user.id);
    }

    await comment.save();
    return res.status(200).json({ message: 'Comment liked/unliked', comment });
  } catch (error) {
    next(error);
  }
};

/* --- ADMIN MODULES --- */

exports.adminGetAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteReview = async (req, res, next) => {
  const { id } = req.params;
  try {
    const review = await Review.findByIdAndDelete(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    return res.status(200).json({ message: 'Review deleted by administrator' });
  } catch (error) {
    next(error);
  }
};

exports.adminGetAllComments = async (req, res, next) => {
  try {
    const comments = await Comment.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    return res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteComment = async (req, res, next) => {
  const { id } = req.params;
  try {
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    return res.status(200).json({ message: 'Comment deleted by administrator' });
  } catch (error) {
    next(error);
  }
};
