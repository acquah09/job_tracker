import React, { useState } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const ApplicationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    date_applied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    job_url: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.company || !formData.role || !formData.date_applied) {
      addToast('Please fill in all required fields', 'error')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(formData)
    setIsSubmitting(false)

    if (result.success) {
      addToast('Application added successfully', 'success')
    } else {
      addToast(result.error || 'Failed to add application', 'error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold">Add Job Application</h1>
        <p className="text-muted-foreground mt-2">
          Add a new job application to track your progress
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="company" className="block text-sm font-medium mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., Google, Microsoft, StartupXYZ"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2">
                Role/Position *
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., Software Engineer, Product Manager"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date_applied" className="block text-sm font-medium mb-2">
                Date Applied *
              </label>
              <input
                type="date"
                id="date_applied"
                name="date_applied"
                value={formData.date_applied}
                onChange={handleChange}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
                <option value="No Response">No Response</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="job_url" className="block text-sm font-medium mb-2">
              Job Posting URL
            </label>
            <input
              type="url"
              id="job_url"
              name="job_url"
              value={formData.job_url}
              onChange={handleChange}
              className="input w-full"
              placeholder="https://example.com/job-posting"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="input w-full resize-none"
              placeholder="Add any additional notes about this application..."
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Application'}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline btn-md flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplicationForm
