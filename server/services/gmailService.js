const { google } = require('googleapis');
const { db } = require('../db/database');

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.CLIENT_URL}/auth/callback`
    );
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Get authorization URL for OAuth flow
  getAuthUrl() {
    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange code for tokens and store in database
  async handleCallback(code) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      
      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      // Store tokens in database
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO oauth_tokens 
        (id, access_token, refresh_token, expiry_date, email)
        VALUES (1, ?, ?, ?, ?)
      `);

      const expiryDate = Date.now() + (tokens.expiry_date || 3600000);
      stmt.run(tokens.access_token, tokens.refresh_token, expiryDate, data.email);

      return { success: true, email: data.email };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if Gmail is connected
  getConnectionStatus() {
    const stmt = db.prepare('SELECT * FROM oauth_tokens WHERE id = 1');
    const tokens = stmt.get();
    
    if (!tokens) {
      return { connected: false };
    }

    const isExpired = Date.now() > tokens.expiry_date;
    return {
      connected: true,
      email: tokens.email,
      expired: isExpired,
      lastSync: null // We'll track this separately
    };
  }

  // Refresh access token if needed
  async refreshAccessToken() {
    const stmt = db.prepare('SELECT * FROM oauth_tokens WHERE id = 1');
    const tokens = stmt.get();
    
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update tokens in database
      const updateStmt = db.prepare(`
        UPDATE oauth_tokens 
        SET access_token = ?, expiry_date = ?
        WHERE id = 1
      `);
      
      const expiryDate = Date.now() + (credentials.expiry_date || 3600000);
      updateStmt.run(credentials.access_token, expiryDate);

      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  // Set credentials for API calls
  async setCredentials() {
    const stmt = db.prepare('SELECT * FROM oauth_tokens WHERE id = 1');
    const tokens = stmt.get();
    
    if (!tokens) {
      throw new Error('No OAuth tokens found');
    }

    // Check if token is expired and refresh if needed
    if (Date.now() > tokens.expiry_date) {
      const newAccessToken = await this.refreshAccessToken();
      this.oauth2Client.setCredentials({ access_token: newAccessToken });
    } else {
      this.oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
    }
  }

  // Search for job application emails
  async searchJobEmails() {
    await this.setCredentials();

    const searchQueries = [
      'subject:"application received"',
      'subject:"thank you for applying"',
      'subject:"we received your application"',
      'subject:"application confirmation"',
      'subject:"your application to"',
      'subject:"application for"',
      'subject:"applied to"',
      'from:greenhouse.io',
      'from:lever.co',
      'from:workday.com',
      'from:myworkdayjobs.com',
      'from:taleo.net',
      'from:smartrecruiters.com',
      'from:icims.com',
      'from:jobvite.com',
      'from:ashbyhq.com',
      'from:bamboohr.com',
      'subject:interview',
      'subject:"unfortunately"',
      'subject:"not moving forward"',
      'subject:offer'
    ];

    const allMessages = [];
    
    for (const query of searchQueries) {
      try {
        const response = await this.gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 50
        });

        if (response.data.messages) {
          allMessages.push(...response.data.messages);
        }
      } catch (error) {
        console.error(`Error searching for query "${query}":`, error);
      }
    }

    // Remove duplicates by ID
    const uniqueMessages = Array.from(
      new Map(allMessages.map(msg => [msg.id, msg])).values()
    );

    return uniqueMessages;
  }

  // Get full message details
  async getMessage(messageId) {
    await this.setCredentials();
    
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return response.data;
  }

  // Parse email to extract job application details
  parseJobEmail(message) {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Extract email body
    let body = '';
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString();
          break;
        }
      }
    } else if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    }

    // Extract company name
    let company = '';
    const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
    if (senderMatch) {
      company = senderMatch[1].trim();
    } else {
      // Extract from email domain
      const domainMatch = from.match(/@(.+?)$/);
      if (domainMatch) {
        company = domainMatch[1].split('.')[0];
      }
    }

    // Extract role from subject
    let role = '';
    const rolePatterns = [
      /(?:application for|your application to|applied to)\s+(.+?)(?:\s+at|\s+with|\s+-|$)/i,
      /(.+?)\s+(?:position|role|job)/i,
      /software engineer|frontend developer|backend developer|full stack developer|product manager|data scientist|designer|ui\/ux|devops|sre/i
    ];

    for (const pattern of rolePatterns) {
      const match = subject.match(pattern);
      if (match) {
        role = match[1] || match[0];
        role = role.replace(/^(the|a|an)\s+/i, '').trim();
        break;
      }
    }

    // Infer status from content
    let status = 'Applied'; // Default
    const content = (subject + ' ' + body).toLowerCase();
    
    if (content.includes('interview')) {
      status = 'Interview';
    } else if (content.includes('offer')) {
      status = 'Offer';
    } else if (content.includes('unfortunately') || content.includes('not moving forward') || content.includes('regret to inform')) {
      status = 'Rejected';
    } else if (content.includes('screening') || content.includes('phone screen')) {
      status = 'Screening';
    }

    // Parse date
    const dateApplied = new Date(date).toISOString().split('T')[0];

    return {
      company,
      role,
      dateApplied,
      status,
      source: 'gmail',
      gmailThreadId: message.threadId,
      subject,
      from,
      body: body.substring(0, 500) // Store first 500 chars for reference
    };
  }

  // Disconnect Gmail
  disconnect() {
    const stmt = db.prepare('DELETE FROM oauth_tokens WHERE id = 1');
    stmt.run();
    return { success: true };
  }
}

module.exports = new GmailService();
