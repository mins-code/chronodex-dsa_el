const AnalyticsEngine = require('../utils/AnalyticsEngine');

/**
 * Get comprehensive productivity insights for the authenticated user
 * GET /api/analytics/insights
 */
const getProductivityInsights = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        const insights = await AnalyticsEngine.getProductivityInsights(userId);

        res.status(200).json(insights);
    } catch (error) {
        console.error('Error fetching productivity insights:', error);
        res.status(500).json({
            error: 'Failed to fetch productivity insights',
            message: error.message
        });
    }
};

module.exports = {
    getProductivityInsights
};
