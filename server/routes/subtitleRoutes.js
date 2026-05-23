const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const subtitleController = require('../controllers/subtitleController');
const { protectUser } = require('../middleware/auth');

// Ensure upload directory exists
const tempUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload a subtitle file
router.post('/upload', protectUser, upload.single('subtitle'), subtitleController.uploadSubtitle);

// Recent approved subtitles for public discovery surfaces
router.get('/recent', subtitleController.getRecentApprovedSubtitles);

// Fetch subtitles for specific video
router.get('/media/:mediaId', subtitleController.getSubtitlesForMedia);

// Rating & Downloads tracking
router.post('/:id/rate', protectUser, subtitleController.rateSubtitle);
router.post('/:id/download', subtitleController.trackDownload);

// Translator Profile stats and history
router.get('/translator/:userId', subtitleController.getUploaderHistory);

module.exports = router;
