import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BsBriefcase, 
  BsFileEarmarkText, 
  BsGraphUp, 
  BsClockHistory,
  BsCurrencyDollar,
  BsCalendarCheck,
  BsExclamationTriangle,
  BsCheckCircle,
  BsArrowUp,
  BsArrowDown,
  BsPerson
} from 'react-icons/bs'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorDashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingInvoices: 0,
    deliveryRate: 0,
    totalEarnings: 0,
    upcomingDeadlines: 0,
    completedProjects: 0,
    averageRating: 0,
    pendingPayments: 0
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, projectsResponse, invoicesResponse] = await Promise.all([
          contractorAPI.getStats(),
          contractorAPI.getRecentProjects(),
          contractorAPI.getRecentInvoices()
        ])
        
        setStats(statsResponse.data)
        setRecentProjects(projectsResponse.data || [])
        setRecentInvoices(invoicesResponse.data || [])
      } catch (error) {
        console.error('Failed to fetch contractor dashboard data', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatIcon = (label, value) => {
    const icons = {
      'Active Projects': <BsBriefcase size={28} />,
      'Pending Invoices': <BsFileEarmarkText size={28} />,
      'Delivery Rate': <BsGraphUp size={28} />,
      'Total Earnings': <BsCurrencyDollar size={28} />,
      'Upcoming Deadlines': <BsCalendarCheck size={28} />,
      'Completed Projects': <BsCheckCircle size={28} />,
      'Average Rating': <BsPerson size={28} />,
      'Pending Payments': <BsClockHistory size={28} />
    }
    return icons[label] || <BsBriefcase size={28} />
  }

  const getStatColor = (label) => {
    const colors = {
      'Active Projects': 'primary',
      'Pending Invoices': 'warning',
      'Delivery Rate': 'success',
      'Total Earnings': 'success',
      'Upcoming Deadlines': 'danger',
      'Completed Projects': 'success',
      'Average Rating': 'info',
      'Pending Payments': 'warning'
    }
    return colors[label] || 'primary'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading contractor dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  const StatCard = ({ label, value, change, icon }) => (
    <Card>
      <div className="stat-card">
        <div className={`stat-icon ${getStatColor(label)}`}>
          {icon}
        </div>
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        <span className="stat-change">{change}</span>
      </div>
    </Card>
  )

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Contractor Dashboard</h1>
        <p className="page-subtitle">Manage your projects, track earnings, and monitor deliverables.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid-4">
        <StatCard 
          label="Active Projects" 
          value={stats.activeProjects} 
          change="Ongoing contracts"
          icon={<BsBriefcase size={28} />}
        />
        <StatCard 
          label="Pending Invoices" 
          value={stats.pendingInvoices} 
          change="Awaiting approval"
          icon={<BsFileEarmarkText size={28} />}
        />
        <StatCard 
          label="Delivery Rate" 
          value={`${stats.deliveryRate}%`} 
          change="On time delivery"
          icon={<BsGraphUp size={28} />}
        />
        <StatCard 
          label="Total Earnings" 
          value={`KES ${stats.totalEarnings?.toLocaleString() || 0}`} 
          change="Lifetime earnings"
          icon={<BsCurrencyDollar size={28} />}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="mt-6 grid-4">
        <StatCard 
          label="Upcoming Deadlines" 
          value={stats.upcomingDeadlines} 
          change="Next 7 days"
          icon={<BsCalendarCheck size={28} />}
        />
        <StatCard 
          label="Completed Projects" 
          value={stats.completedProjects} 
          change="Successfully delivered"
          icon={<BsCheckCircle size={28} />}
        />
        <StatCard 
          label="Average Rating" 
          value={`${stats.averageRating}/5`} 
          change="Client satisfaction"
          icon={<BsPerson size={28} />}
        />
        <StatCard 
          label="Pending Payments" 
          value={`KES ${stats.pendingPayments?.toLocaleString() || 0}`} 
          change="Awaiting payment"
          icon={<BsClockHistory size={28} />}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 grid-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <div className="project-overview">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Recent Projects</h3>
              <Link to="/contractor/projects" className="text-sm text-primary hover:text-primary-dark">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentProjects.length > 0 ? (
                recentProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{project.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{project.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{project.due_date}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">{project.progress}% complete</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No recent projects</p>
              )}
            </div>
            
            <Link to="/contractor/projects" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark w-full">
              Manage Projects
            </Link>
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <div className="project-overview">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Recent Invoices</h3>
              <Link to="/contractor/invoices" className="text-sm text-primary hover:text-primary-dark">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentInvoices.length > 0 ? (
                recentInvoices.slice(0, 3).map(invoice => (
                  <div key={invoice.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">#{invoice.invoice_number}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.project_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">KES {invoice.amount?.toLocaleString() || 0}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No recent invoices</p>
              )}
            </div>
            
            <Link to="/contractor/invoices" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark w-full">
              Manage Invoices
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <div className="project-overview">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">Quick Actions</h3>
          <div className="grid-4 gap-4">
            <Link to="/contractor/projects/new" className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <BsBriefcase size={24} className="text-primary mb-2" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">New Project</span>
            </Link>
            <Link to="/contractor/invoices/new" className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <BsFileEarmarkText size={24} className="text-primary mb-2" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Create Invoice</span>
            </Link>
            <Link to="/contractor/portal" className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <BsPerson size={24} className="text-primary mb-2" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Update Profile</span>
            </Link>
            <Link to="/contractor/reports" className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <BsGraphUp size={24} className="text-primary mb-2" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">View Reports</span>
            </Link>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  )
}

export default ContractorDashboard
