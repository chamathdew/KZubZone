const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/search', analyticsController.logSearchQueryRequest);

module.exports = router;
