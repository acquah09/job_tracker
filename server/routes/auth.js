const express = require('express');
const gmailService = require('../services/gmailService');
const router = express.Router();

// GET OAuth authorization URL
router.get('/google', (req, res) => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// GET OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`${process.env.CLIENT_URL}?auth=error&message=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}?auth=error&message=${encodeURIComponent('No authorization code received')}`);
    }
    
    const result = await gmailService.handleCallback(code);
    
    if (result.success) {
      res.redirect(`${process.env.CLIENT_URL}?auth=success&email=${encodeURIComponent(result.email)}`);
    } else {
      res.redirect(`${process.env.CLIENT_URL}?auth=error&message=${encodeURIComponent(result.error)}`);
    }
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`${process.env.CLIENT_URL}?auth=error&message=${encodeURIComponent('Internal server error')}`);
  }
});

// GET connection status
router.get('/status', (req, res) => {
  try {
    const status = gmailService.getConnectionStatus();
    res.json(status);
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

// POST disconnect
router.post('/disconnect', (req, res) => {
  try {
    const result = gmailService.disconnect();
    res.json(result);
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

module.exports = router;
