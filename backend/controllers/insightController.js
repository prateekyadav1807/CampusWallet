const { generateInsights } = require('../services/insightService');

// @desc    Get AI spending insights
// @route   GET /api/insights
// @access  Private
const getInsights = async (req, res) => {
  const insights = await generateInsights(req.user._id);
  res.status(200).json({ success: true, insights });
};

module.exports = { getInsights };
