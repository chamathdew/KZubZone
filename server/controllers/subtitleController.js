const Subtitle = require('../models/Subtitle');
const Notification = require('../models/Notification');
const { uploadAsset } = require('../config/cloudinary');
const fs = require('fs');

// UPLOAD SUBTITLE (USER ACTION)
exports.uploadSubtitle = async (req, res, next) => {
  const { mediaId, mediaType, language, version, releaseNotes } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Subtitle file is required' });
  }

  if (!mediaId || !mediaType || !language) {
    // Clean up temp file
    try { fs.unlinkSync(req.file.path); } catch (err) {}
    return res.status(400).json({ message: 'Media ID, Media Type (Movie/Drama/Episode), and Language are required' });
  }

  // Verify file format
  const extension = req.file.originalname.split('.').pop().toLowerCase();
  if (!['srt', 'vtt', 'ass'].includes(extension)) {
    try { fs.unlinkSync(req.file.path); } catch (err) {}
    return res.status(400).json({ message: 'Invalid subtitle format. Supported formats: SRT, VTT, ASS' });
  }

  try {
    // Upload using Cloudinary or Local Fallback upload helper
    const fileUrl = await uploadAsset(req.file.path, 'subtitles');

    const subtitle = new Subtitle({
      mediaId,
      mediaType,
      language,
      version: version || '1.0',
      uploader: req.user.id,
      fileUrl,
      format: extension,
      releaseNotes
    });

    await subtitle.save();

    // Create a moderator alert/notification
    const adminNotification = new Notification({
      recipientType: 'Admin',
      title: 'New Subtitle Pending Approval',
      message: `User ${req.user.username} uploaded a new ${language} subtitle for ${mediaType} ID: ${mediaId}`,
      type: 'system'
    });
    await adminNotification.save();

    return res.status(201).json({
      message: 'Subtitle uploaded successfully. Pending moderator approval.',
      subtitle
    });
  } catch (error) {
    next(error);
  }
};

// GET SUBTITLES FOR A MEDIA (PUBLIC VIEW)
exports.getSubtitlesForMedia = async (req, res, next) => {
  const { mediaId } = req.params;
  try {
    const subtitles = await Subtitle.find({ mediaId, approvalStatus: 'Approved' })
      .populate('uploader', 'username avatar')
      .sort({ downloads: -1, rating: -1 });

    return res.status(200).json(subtitles);
  } catch (error) {
    next(error);
  }
};

// GET RECENT APPROVED SUBTITLES (PUBLIC HOME FEED)
exports.getRecentApprovedSubtitles = async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit) || 4, 20);

  try {
    const subtitles = await Subtitle.find({ approvalStatus: 'Approved' })
      .populate('uploader', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json(subtitles);
  } catch (error) {
    next(error);
  }
};

// DOWNLOAD SUBTITLE (INCREMENT TRACKER)
exports.trackDownload = async (req, res, next) => {
  const { id } = req.params;
  try {
    const subtitle = await Subtitle.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true });
    if (!subtitle) {
      return res.status(404).json({ message: 'Subtitle not found' });
    }
    return res.status(200).json({ message: 'Download tracked', downloads: subtitle.downloads });
  } catch (error) {
    next(error);
  }
};

// RATE SUBTITLE
exports.rateSubtitle = async (req, res, next) => {
  const { id } = req.params;
  const { score } = req.body; // 1 to 5

  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ message: 'Score must be between 1 and 5' });
  }

  try {
    const subtitle = await Subtitle.findById(id);
    if (!subtitle) {
      return res.status(404).json({ message: 'Subtitle not found' });
    }

    // Check if user already rated
    const existingIndex = subtitle.ratings.findIndex(r => r.userId.toString() === req.user.id.toString());
    if (existingIndex > -1) {
      subtitle.ratings[existingIndex].score = score;
    } else {
      subtitle.ratings.push({ userId: req.user.id, score });
    }

    // Recalculate average rating
    const sum = subtitle.ratings.reduce((acc, curr) => acc + curr.score, 0);
    subtitle.rating = parseFloat((sum / subtitle.ratings.length).toFixed(1));

    await subtitle.save();
    return res.status(200).json({ message: 'Subtitle rated successfully', rating: subtitle.rating });
  } catch (error) {
    next(error);
  }
};

// ADMIN: GET SUBTITLE MODERATION QUEUE
exports.getModerationQueue = async (req, res, next) => {
  try {
    const subtitles = await Subtitle.find()
      .populate('uploader', 'username email')
      .sort({ createdAt: -1 });
    return res.status(200).json(subtitles);
  } catch (error) {
    next(error);
  }
};

// ADMIN: UPDATE APPROVAL STATUS
exports.updateApprovalStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, moderatorNotes } = req.body; // Approved, Rejected

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected' });
  }

  try {
    const subtitle = await Subtitle.findById(id);
    if (!subtitle) {
      return res.status(404).json({ message: 'Subtitle not found' });
    }

    subtitle.approvalStatus = status;
    if (moderatorNotes) {
      subtitle.moderatorNotes = moderatorNotes;
    }
    await subtitle.save();

    // Notify the uploader
    const userNotification = new Notification({
      recipient: subtitle.uploader,
      title: `Subtitle Upload ${status}`,
      message: `Your subtitle upload for ${subtitle.language} was ${status.toLowerCase()}.${moderatorNotes ? ' Notes: ' + moderatorNotes : ''}`,
      type: status === 'Approved' ? 'subtitle_approved' : 'subtitle_rejected'
    });
    await userNotification.save();

    return res.status(200).json({ message: `Subtitle ${status.toLowerCase()} successfully`, subtitle });
  } catch (error) {
    next(error);
  }
};

// GET TRANSLATOR/UPLOADER HISTORY
exports.getUploaderHistory = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const uploads = await Subtitle.find({ uploader: userId })
      .sort({ createdAt: -1 });

    const totalDownloads = uploads.reduce((acc, curr) => acc + curr.downloads, 0);

    return res.status(200).json({
      uploads,
      totalUploads: uploads.length,
      totalDownloads
    });
  } catch (error) {
    next(error);
  }
};
