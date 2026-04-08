import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Filter, Edit, Trash2, ExternalLink, Mail } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const statusColors = {
  Applied: 'bg-blue-900 text-blue-200',
  Screening: 'bg-yellow-900 text-yellow-200',
  Interview: 'bg-purple-900 text-purple-200',
  Offer: 'bg-green-900 text-green-200',
  Rejected: 'bg-red-900 text-red-200',
  Withdrawn: 'bg-gray-900 text-gray-200',
  'No Response': 'bg-gray-800 text-gray-300'
}

const Dashboard = ({ applications, onUpdateApplication, onDeleteApplication, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const { addToast } = useToast()

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (id, newStatus) => {
    const result = await onUpdateApplication(id, { status: newStatus })
    if (result.success) {
      addToast('Status updated successfully', 'success')
    } else {
      addToast('Failed to update status', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      const result = await onDeleteApplication(id)
      if (result.success) {
        addToast('Application deleted successfully', 'success')
      } else {
        addToast('Failed to delete application', 'error')
      }
    }
  }

  const startEdit = (application) => {
    setEditingId(application.id)
    setEditForm({
      company: application.company,
      role: application.role,
      status: application.status,
      job_url: application.job_url || '',
      notes: application.notes || ''
    })
  }

  const saveEdit = async () => {
    const result = await onUpdateApplication(editingId, editForm)
    if (result.success) {
      addToast('Application updated successfully', 'success')
      setEditingId(null)
      setEditForm({})
    } else {
      addToast('Failed to update application', 'error')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const stats = {
    total: applications.length,
    thisMonth: applications.filter(app => {
      const appliedDate = new Date(app.date_applied)
      const thisMonth = new Date()
      return appliedDate.getMonth() === thisMonth.getMonth() && 
             appliedDate.getFullYear() === thisMonth.getFullYear()
    }).length,
    interviews: applications.filter(app => app.status === 'Interview').length,
    offers: applications.filter(app => app.status === 'Offer').length
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Mail className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-4">No job applications yet</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start tracking your job applications by adding your first one manually, or connect Gmail to automatically detect applications from your emails.
        </p>
        <a
          href="/add"
          className="btn btn-primary btn-lg"
        >
          Add Your First Application
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Applications</h3>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">This Month</h3>
          <p className="text-3xl font-bold">{stats.thisMonth}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Interviews</h3>
          <p className="text-3xl font-bold">{stats.interviews}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Offers</h3>
          <p className="text-3xl font-bold">{stats.offers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="No Response">No Response</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          className="btn btn-outline btn-sm"
        >
          Refresh
        </button>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Company</th>
                <th className="text-left p-4 font-medium text-sm">Role</th>
                <th className="text-left p-4 font-medium text-sm">Date Applied</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Source</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id} className="border-t border-border">
                  {editingId === application.id ? (
                    <>
                      <td className="p-4">
                        <input
                          type="text"
                          value={editForm.company}
                          onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                          className="input w-full"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="input w-full"
                        />
                      </td>
                      <td className="p-4">{format(new Date(application.date_applied), 'MMM dd, yyyy')}</td>
                      <td className="p-4">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
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
                      </td>
                      <td className="p-4">
                        <span className="badge bg-muted text-muted-foreground">
                          {application.source === 'gmail' ? '📧 Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveEdit}
                            className="btn btn-primary btn-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn btn-outline btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-medium">{application.company}</td>
                      <td className="p-4">{application.role}</td>
                      <td className="p-4">{format(new Date(application.date_applied), 'MMM dd, yyyy')}</td>
                      <td className="p-4">
                        <span className={`badge ${statusColors[application.status]}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="badge bg-muted text-muted-foreground">
                          {application.source === 'gmail' ? '📧 Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(application)}
                            className="btn btn-outline btn-sm"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {application.job_url && (
                            <a
                              href={application.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                              title="View Job Posting"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(application.id)}
                            className="btn btn-outline btn-sm text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
