const express = require('express');
const router = express.Router();
const { getProductivityInsights } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/analytics/insights - Get comprehensive productivity insights
router.get('/insights', authMiddleware, getProductivityInsights);

module.exports = router;
