# Job Application Tracker

A full-stack web application that automatically tracks job applications from your Gmail inbox and provides a comprehensive dashboard for managing your job search.

## Features

### 📧 Gmail Auto-Detection
- Automatically scans Gmail for job application emails
- Detects applications from major ATS platforms (Greenhouse, Lever, Workday, etc.)
- Identifies status changes (interviews, offers, rejections)
- Runs automatically every 15 minutes
- Smart duplicate prevention using thread IDs

### 📊 Dashboard
- Clean, modern dark theme UI
- Real-time statistics (total applications, interviews, offers)
- Sortable and filterable application table
- Color-coded status badges
- Search by company or role
- Edit, delete, and update applications inline

### ✏️ Manual Entry
- Add applications manually
- Edit existing applications
- Track job URLs and notes
- Status management (Applied, Screening, Interview, Offer, Rejected, etc.)

### 🔔 Activity Log
- View recent auto-detections
- Track status updates
- Sync history and results
- Real-time notifications

## Tech Stack

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- React Router for navigation
- Lucide React for icons
- date-fns for date handling

**Backend:**
- Node.js with Express
- SQLite with better-sqlite3
- Gmail API with Google OAuth 2.0
- node-cron for scheduled tasks
- dotenv for environment management

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Google Cloud account for Gmail API setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd job-application-tracker
npm run install-all
```

### 2. Gmail API Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project

2. **Enable Gmail API**
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Gmail API" and enable it

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application" type
   - Add `http://localhost:3000/auth/callback` as an authorized redirect URI

4. **Download Credentials**
   - Download the JSON file and rename it to `credentials.json`
   - Place it in the `/server` directory

5. **Configure Environment**
   - Copy `/server/.env.example` to `/server/.env`
   - Add your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   SESSION_SECRET=your_random_secret_here
   ```

### 3. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run server  # Backend on port 3001
npm run client  # Frontend on port 3000
```

### 4. Connect Gmail

1. Open http://localhost:3000 in your browser
2. Go to Settings → Gmail Integration
3. Click "Connect Gmail" and complete the OAuth flow
4. Grant read-only access to your Gmail
5. The system will automatically start scanning for job applications

## Usage

### Manual Entry
- Click "Add Application" in the navbar
- Fill in the job details
- Applications are saved immediately

### Gmail Auto-Detection
- Once connected, the system scans your Gmail every 15 minutes
- New applications are automatically added with "📧 Auto" badge
- Status updates are applied to existing applications
- View all activity in the Activity Log

### Managing Applications
- **Edit**: Click the edit icon in the dashboard
- **Update Status**: Use the dropdown to change application status
- **Delete**: Click the trash icon to remove an application
- **View Job Posting**: Click the external link icon if URL is provided

## Project Structure

```
job-application-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                # Express backend
│   ├── db/               # Database setup
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── credentials.json  # Google OAuth credentials (gitignored)
│   ├── .env             # Environment variables (gitignored)
│   └── index.js         # Server entry point
├── package.json          # Root package.json
└── README.md
```

## API Endpoints

### Applications
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create new application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `GET /api/applications/stats/summary` - Get statistics

### Authentication
- `GET /auth/google` - Start OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/status` - Check connection status
- `POST /auth/disconnect` - Disconnect Gmail

### Sync
- `POST /api/sync` - Manually trigger Gmail sync
- `GET /api/sync/activity` - Get recent activity log

## Database Schema

### applications table
- `id` - Primary key
- `company` - Company name
- `role` - Job position
- `date_applied` - Application date
- `status` - Current status
- `source` - 'manual' or 'gmail'
- `job_url` - Job posting URL
- `notes` - Additional notes
- `gmail_thread_id` - Gmail thread ID (for duplicate prevention)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### oauth_tokens table
- `id` - Primary key
- `access_token` - Gmail access token
- `refresh_token` - Gmail refresh token
- `expiry_date` - Token expiry time
- `email` - Connected email address

### activity_log table
- `id` - Primary key
- `type` - Activity type
- `message` - Activity description
- `details` - Additional details (JSON)
- `created_at` - Timestamp

## Gmail Detection Logic

The system scans for job application emails using:

### Subject Keywords
- "application received"
- "thank you for applying"
- "we received your application"
- "application confirmation"
- "your application to"
- "application for"
- "applied to"

### ATS Domains
- greenhouse.io
- lever.co
- workday.com
- myworkdayjobs.com
- taleo.net
- smartrecruiters.com
- icims.com
- jobvite.com
- ashbyhq.com
- bamboohr.com

### Status Detection
- **Interview**: emails containing "interview"
- **Offer**: emails containing "offer"
- **Rejected**: emails containing "unfortunately", "not moving forward", "regret to inform"
- **Screening**: emails containing "screening", "phone screen"

## Environment Variables

Create `/server/.env` with:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_session_secret

# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:3000
```

## Development

### Running Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test
```

### Building for Production
```bash
npm run build
npm start
```

## Troubleshooting

### Gmail Connection Issues
1. Ensure `credentials.json` is in the `/server` directory
2. Check that redirect URI matches `http://localhost:3000/auth/callback`
3. Verify Gmail API is enabled in your Google Cloud project
4. Make sure environment variables are correctly set

### Sync Not Working
1. Check Gmail connection status in Settings
2. Manually trigger sync to see error messages
3. Check server logs for detailed error information
4. Ensure tokens haven't expired (system should auto-refresh)

### Database Issues
- SQLite database file (`job_tracker.db`) is created automatically
- Delete `.db` file to reset database
- Check file permissions if database creation fails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Privacy & Security

- Gmail access is read-only
- Tokens are stored securely in local SQLite database
- No data is shared with third parties
- All email processing happens locally
- You can disconnect Gmail at any time
