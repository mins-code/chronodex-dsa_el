const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET /api/notifications/recent-creations - Last 10 created tasks
router.get('/recent-creations', async (req, res) => {
  try {
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json(recentTasks);
  } catch (error) {
    console.error('Error fetching recent creations:', error);
    res.status(500).json({ error: 'Failed to fetch recent creations.' });
  }
});

// GET /api/notifications/upcoming-deadlines - Next 10 tasks by deadline
router.get('/upcoming-deadlines', async (req, res) => {
  try {
    const now = new Date();
    const upcomingTasks = await Task.find({
      deadline: { $gte: now },
      status: { $ne: 'completed' }
    })
      .sort({ deadline: 1 })
      .limit(10);
    
    res.status(200).json(upcomingTasks);
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines.' });
  }
});

// GET /api/notifications/recent-completions - Last 10 completed tasks
router.get('/recent-completions', async (req, res) => {
  try {
    const completedTasks = await Task.find({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(10);
    
    res.status(200).json(completedTasks);
  } catch (error) {
    console.error('Error fetching recent completions:', error);
    res.status(500).json({ error: 'Failed to fetch recent completions.' });
  }
});

module.exports = router;
