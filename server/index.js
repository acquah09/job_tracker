require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initializeDatabase } = require('./db/database');
const syncService = require('./services/syncService');

// Import routes
const applicationsRouter = require('./routes/applications');
const authRouter = require('./routes/auth');
const syncRouter = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/applications', applicationsRouter);
app.use('/auth', authRouter);
app.use('/api/sync', syncRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database
initializeDatabase();

// Schedule Gmail sync every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled Gmail sync...');
  await syncService.syncGmail();
}, {
  scheduled: true,
  timezone: 'UTC'
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL}`);
});
