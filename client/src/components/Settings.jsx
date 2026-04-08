import React, { useState, useEffect } from 'react'
import { Mail, Link, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const Settings = () => {
  const [authStatus, setAuthStatus] = useState({ connected: false })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    checkAuthStatus()
    
    // Check for OAuth callback in URL
    const urlParams = new URLSearchParams(window.location.search)
    const authResult = urlParams.get('auth')
    const email = urlParams.get('email')
    const message = urlParams.get('message')
    
    if (authResult === 'success') {
      addToast(`Successfully connected Gmail: ${email}`, 'success')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      checkAuthStatus()
    } else if (authResult === 'error') {
      addToast(`Failed to connect Gmail: ${message}`, 'error')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/auth/status')
      if (response.ok) {
        const status = await response.json()
        setAuthStatus(status)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    }
  }

  const connectGmail = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/auth/google')
      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
      } else {
        addToast('Failed to get authorization URL', 'error')
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      addToast('Error connecting Gmail', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect Gmail? This will stop automatic email scanning.')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const response = await fetch('/auth/disconnect', {
        method: 'POST'
      })
      if (response.ok) {
        addToast('Gmail disconnected successfully', 'success')
        setAuthStatus({ connected: false })
      } else {
        addToast('Failed to disconnect Gmail', 'error')
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error)
      addToast('Error disconnecting Gmail', 'error')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const triggerSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync', {
        method: 'POST'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          addToast(
            `Sync completed: ${result.newApplications} new, ${result.updatedApplications} updated`,
            'success'
          )
        } else {
          addToast(result.message || 'Sync failed', 'error')
        }
      } else {
        addToast('Failed to trigger sync', 'error')
      }
    } catch (error) {
      console.error('Error triggering sync:', error)
      addToast('Error triggering sync', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Gmail integration and application preferences
        </p>
      </div>

      {/* Gmail Integration */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Gmail Integration</h2>
        </div>

        {authStatus.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Connected to Gmail</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p><strong>Email:</strong> {authStatus.email}</p>
              <p><strong>Status:</strong> {authStatus.expired ? 'Token expired' : 'Connected'}</p>
              <p className="text-sm text-muted-foreground">
                <Clock className="w-4 h-4 inline mr-1" />
                Automatic sync runs every 15 minutes
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
              
              <button
                onClick={disconnectGmail}
                disabled={isDisconnecting}
                className="btn btn-outline btn-md flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Not connected to Gmail</span>
            </div>
            
            <p className="text-muted-foreground">
              Connect your Gmail account to automatically detect job applications from your emails. 
              The system will scan for application confirmations, interview invites, and status updates.
            </p>

            <button
              onClick={connectGmail}
              disabled={isConnecting}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <Link className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Gmail'}
            </button>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Gmail Setup Instructions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">1. Create Google Cloud Project</h3>
            <p className="text-muted-foreground">
              Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a> and create a new project.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. Enable Gmail API</h3>
            <p className="text-muted-foreground">
              In your project, enable the Gmail API from the API Library.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Create OAuth Credentials</h3>
            <p className="text-muted-foreground">
              Go to Credentials → Create Credentials → OAuth 2.0 Client ID. Select "Web application" type.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">4. Configure Redirect URI</h3>
            <p className="text-muted-foreground">
              Add <code className="bg-muted px-2 py-1 rounded">http://localhost:3000/auth/callback</code> as an authorized redirect URI.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">5. Download Credentials</h3>
            <p className="text-muted-foreground">
              Download the credentials JSON file and place it in the server folder as <code className="bg-muted px-2 py-1 rounded">credentials.json</code>.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">6. Configure Environment</h3>
            <p className="text-muted-foreground">
              Copy the Client ID and Client Secret to your server's <code className="bg-muted px-2 py-1 rounded">.env</code> file.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Auto-Detection Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Email Sources</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• ATS platforms (Greenhouse, Lever, Workday)</li>
              <li>• Application confirmation emails</li>
              <li>• Interview invitations</li>
              <li>• Status update notifications</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Extracted Information</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Company name and role</li>
              <li>• Application date</li>
              <li>• Current status</li>
              <li>• Email thread tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
