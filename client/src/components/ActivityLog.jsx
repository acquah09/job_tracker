import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { RefreshCw, Mail, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const ActivityLog = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sync/activity?limit=50')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
      addToast('Failed to fetch activity log', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_application':
        return <Plus className="w-4 h-4 text-green-400" />
      case 'status_update':
        return <ArrowRight className="w-4 h-4 text-blue-400" />
      case 'sync_complete':
        return <Mail className="w-4 h-4 text-purple-400" />
      case 'sync_error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Mail className="w-4 h-4 text-gray-400" />
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'new_application':
        return 'border-green-800 bg-green-950'
      case 'status_update':
        return 'border-blue-800 bg-blue-950'
      case 'sync_complete':
        return 'border-purple-800 bg-purple-950'
      case 'sync_error':
        return 'border-red-800 bg-red-950'
      default:
        return 'border-gray-800 bg-gray-950'
    }
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return format(date, 'MMM dd, yyyy')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground mt-2">
            Recent automatic detections and sync activities
          </p>
        </div>
        
        <button
          onClick={fetchActivity}
          className="btn btn-outline btn-md flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Mail className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">No activity yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect Gmail to start seeing automatic job application detections here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`card p-4 border-l-4 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1">
                  <p className="text-foreground font-medium">{activity.message}</p>
                  
                  {activity.details && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {activity.type === 'new_application' && activity.details && (
                        <div>
                          <span className="font-medium">Company:</span> {activity.details.company}<br />
                          <span className="font-medium">Role:</span> {activity.details.role}
                        </div>
                      )}
                      
                      {activity.type === 'status_update' && activity.details && (
                        <div>
                          <span className="font-medium">Status Change:</span> {activity.details.oldStatus} → {activity.details.newStatus}
                        </div>
                      )}
                      
                      {activity.type === 'sync_complete' && activity.details && (
                        <div>
                          <span className="font-medium">Results:</span> {activity.details.newApplications} new, {activity.details.updatedApplications} updated
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivityLog
