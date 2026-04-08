const express = require('express');
const syncService = require('../services/syncService');
const router = express.Router();

// POST manually trigger sync
router.post('/', async (req, res) => {
  try {
    const result = await syncService.syncGmail();
    res.json(result);
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

// GET recent activity
router.get('/activity', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const activity = syncService.getRecentActivity(parseInt(limit));
    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;
