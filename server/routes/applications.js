const express = require('express');
const { db } = require('../db/database');
const router = express.Router();

// GET all applications
router.get('/', (req, res) => {
  try {
    const { status, company, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (company) {
      query += ' AND LOWER(company) LIKE LOWER(?)';
      params.push(`%${company}%`);
    }
    
    if (startDate) {
      query += ' AND date_applied >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date_applied <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date_applied DESC';
    
    const stmt = db.prepare(query);
    const applications = stmt.all(...params);
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST create new application
router.post('/', (req, res) => {
  try {
    const { company, role, date_applied, status, job_url, notes } = req.body;
    
    if (!company || !role || !date_applied) {
      return res.status(400).json({ 
        error: 'Company, role, and date applied are required' 
      });
    }
    
    const stmt = db.prepare(`
      INSERT INTO applications (company, role, date_applied, status, job_url, notes, source)
      VALUES (?, ?, ?, ?, ?, ?, 'manual')
    `);
    
    const result = stmt.run(company, role, date_applied, status || 'Applied', job_url, notes);
    
    const newApplication = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newApplication);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PUT update application
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { company, role, date_applied, status, job_url, notes } = req.body;
    
    const stmt = db.prepare(`
      UPDATE applications 
      SET company = ?, role = ?, date_applied = ?, status = ?, 
          job_url = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    const result = stmt.run(company, role, date_applied, status, job_url, notes, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const updatedApplication = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// DELETE application
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM applications WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// GET application statistics
router.get('/stats/summary', (req, res) => {
  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM applications');
    const total = totalStmt.get().count;
    
    const statusStmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `);
    const byStatus = statusStmt.all();
    
    const sourceStmt = db.prepare(`
      SELECT source, COUNT(*) as count 
      FROM applications 
      GROUP BY source
    `);
    const bySource = sourceStmt.all();
    
    const recentStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM applications 
      WHERE date_applied >= date('now', '-30 days')
    `);
    const thisMonth = recentStmt.get().count;
    
    res.json({
      total,
      thisMonth,
      byStatus,
      bySource
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
