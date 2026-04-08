const { db } = require('../db/database');
const gmailService = require('./gmailService');

class SyncService {
  // Log activity
  logActivity(type, message, details = null) {
    const stmt = db.prepare(`
      INSERT INTO activity_log (type, message, details)
      VALUES (?, ?, ?)
    `);
    stmt.run(type, message, JSON.stringify(details));
  }

  // Check if application already exists
  findExistingApplication(company, role) {
    const stmt = db.prepare(`
      SELECT * FROM applications 
      WHERE LOWER(company) = LOWER(?) AND LOWER(role) = LOWER(?)
    `);
    return stmt.get(company, role);
  }

  // Check if thread was already processed
  isThreadProcessed(threadId) {
    const stmt = db.prepare('SELECT id FROM applications WHERE gmail_thread_id = ?');
    return stmt.get(threadId);
  }

  // Create new application
  createApplication(applicationData) {
    const stmt = db.prepare(`
      INSERT INTO applications (
        company, role, date_applied, status, source, 
        job_url, notes, gmail_thread_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      applicationData.company,
      applicationData.role,
      applicationData.dateApplied,
      applicationData.status,
      applicationData.source,
      applicationData.jobUrl || null,
      applicationData.notes || null,
      applicationData.gmailThreadId || null
    );

    return result.lastInsertRowid;
  }

  // Update existing application
  updateApplication(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.status) {
      fields.push('status = ?');
      values.push(updateData.status);
    }
    if (updateData.notes) {
      fields.push('notes = ?');
      values.push(updateData.notes);
    }
    if (updateData.jobUrl) {
      fields.push('job_url = ?');
      values.push(updateData.jobUrl);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = datetime("now")');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE applications 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
  }

  // Sync Gmail for new applications and status updates
  async syncGmail() {
    try {
      const connectionStatus = gmailService.getConnectionStatus();
      if (!connectionStatus.connected) {
        this.logActivity('sync', 'Gmail not connected - skipping sync');
        return { success: false, message: 'Gmail not connected' };
      }

      console.log('Starting Gmail sync...');
      const messages = await gmailService.searchJobEmails();
      console.log(`Found ${messages.length} potential job emails`);

      let newApplications = 0;
      let updatedApplications = 0;
      let skippedDuplicates = 0;

      for (const message of messages) {
        try {
          // Skip if thread was already processed
          if (this.isThreadProcessed(message.threadId)) {
            continue;
          }

          const fullMessage = await gmailService.getMessage(message.id);
          const parsedData = gmailService.parseJobEmail(fullMessage);

          // Skip if we couldn't extract basic info
          if (!parsedData.company || !parsedData.role) {
            continue;
          }

          const existing = this.findExistingApplication(parsedData.company, parsedData.role);

          if (existing) {
            // Update status if different
            if (existing.status !== parsedData.status) {
              this.updateApplication(existing.id, {
                status: parsedData.status,
                notes: `Status auto-updated from Gmail: ${parsedData.subject}`
              });

              this.logActivity('status_update', 
                `Status updated: ${parsedData.role} @ ${parsedData.company} → ${parsedData.status}`,
                { applicationId: existing.id, oldStatus: existing.status, newStatus: parsedData.status }
              );

              updatedApplications++;
            }
          } else {
            // Create new application
            const applicationId = this.createApplication({
              company: parsedData.company,
              role: parsedData.role,
              dateApplied: parsedData.dateApplied,
              status: parsedData.status,
              source: 'gmail',
              gmailThreadId: parsedData.gmailThreadId,
              notes: `Auto-detected from Gmail: ${parsedData.subject}`
            });

            this.logActivity('new_application',
              `New application detected: ${parsedData.role} @ ${parsedData.company}`,
              { applicationId, company: parsedData.company, role: parsedData.role }
            );

            newApplications++;
          }

        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
        }
      }

      const result = {
        success: true,
        newApplications,
        updatedApplications,
        skippedDuplicates,
        totalProcessed: messages.length
      };

      this.logActivity('sync_complete', 
        `Gmail sync completed: ${newApplications} new, ${updatedApplications} updated`,
        result
      );

      console.log('Gmail sync completed:', result);
      return result;

    } catch (error) {
      console.error('Error during Gmail sync:', error);
      this.logActivity('sync_error', `Gmail sync failed: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // Get recent activity
  getRecentActivity(limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM activity_log 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit).map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null
    }));
  }
}

module.exports = new SyncService();
