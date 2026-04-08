import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import ApplicationForm from './components/ApplicationForm'
import Settings from './components/Settings'
import ActivityLog from './components/ActivityLog'
import { ToastProvider } from './contexts/ToastContext'
import Toast from './components/Toast'

function App() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const addApplication = async (applicationData) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      })
      
      if (response.ok) {
        const newApplication = await response.json()
        setApplications(prev => [newApplication, ...prev])
        return { success: true }
      }
      return { success: false, error: 'Failed to add application' }
    } catch (error) {
      console.error('Error adding application:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const updateApplication = async (id, updateData) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        const updatedApplication = await response.json()
        setApplications(prev => 
          prev.map(app => app.id === id ? updatedApplication : app)
        )
        return { success: true }
      }
      return { success: false, error: 'Failed to update application' }
    } catch (error) {
      console.error('Error updating application:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const deleteApplication = async (id) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== id))
        return { success: true }
      }
      return { success: false, error: 'Failed to delete application' }
    } catch (error) {
      console.error('Error deleting application:', error)
      return { success: false, error: 'Network error' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    applications={applications}
                    onUpdateApplication={updateApplication}
                    onDeleteApplication={deleteApplication}
                    onRefresh={fetchApplications}
                  />
                } 
              />
              <Route 
                path="/add" 
                element={
                  <ApplicationForm 
                    onSubmit={addApplication}
                    onCancel={() => window.history.back()}
                  />
                } 
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="/activity" element={<ActivityLog />} />
            </Routes>
          </main>
          <Toast />
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App
