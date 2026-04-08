import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Briefcase, Plus, Settings, Activity, Mail } from 'lucide-react'

const Navbar = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold">Job Tracker</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Dashboard
            </Link>
            
            <Link
              to="/add"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/add') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Application
            </Link>
            
            <Link
              to="/activity"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/activity') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </Link>
            
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/settings') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
