import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BsBriefcase, 
  BsFileEarmarkText, 
  BsGraphUp, 
  BsClockHistory,
  BsCurrencyDollar,
  BsCalendarCheck,
  BsCheckCircle,
  BsPerson
} from 'react-icons/bs'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorDashboard = () => {
  const navigate = useNavigate()
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await contractorAPI.getStats()
        setStats(statsResponse.data)
      } catch (error) {
        console.error('Failed to fetch contractor dashboard data', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const goTo = (path) => {
    window.scrollTo(0, 0)
    navigate(path)
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

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Contractor Dashboard</h1>
        <p className="page-subtitle">Manage your projects, track earnings, and monitor deliverables.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Projects */}
        <div 
          onClick={() => goTo('/contractor/projects')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsBriefcase size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Active</span>
          </div>
          <div className="text-3xl font-bold">{stats.activeProjects}</div>
          <h3 className="text-sm font-medium text-blue-100 mt-1">Active Projects</h3>
          <p className="text-xs text-blue-200 mt-2">Click to manage →</p>
        </div>

        {/* Pending Invoices */}
        <div 
          onClick={() => goTo('/contractor/invoices')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsFileEarmarkText size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          </div>
          <div className="text-3xl font-bold">{stats.pendingInvoices}</div>
          <h3 className="text-sm font-medium text-amber-100 mt-1">Pending Invoices</h3>
          <p className="text-xs text-amber-200 mt-2">Click to view →</p>
        </div>

        {/* Delivery Rate */}
        <div 
          onClick={() => goTo('/contractor/reports')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsGraphUp size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">On time</span>
          </div>
          <div className="text-3xl font-bold">{stats.deliveryRate}%</div>
          <h3 className="text-sm font-medium text-emerald-100 mt-1">Delivery Rate</h3>
          <p className="text-xs text-emerald-200 mt-2">Click for reports →</p>
        </div>

        {/* Total Earnings */}
        <div 
          onClick={() => goTo('/contractor/invoices')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsCurrencyDollar size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Lifetime</span>
          </div>
          <div className="text-3xl font-bold">KES {stats.totalEarnings?.toLocaleString() || 0}</div>
          <h3 className="text-sm font-medium text-teal-100 mt-1">Total Earnings</h3>
          <p className="text-xs text-teal-200 mt-2">Click to view →</p>
        </div>

        {/* Upcoming Deadlines */}
        <div 
          onClick={() => goTo('/contractor/projects')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsCalendarCheck size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">7 days</span>
          </div>
          <div className="text-3xl font-bold">{stats.upcomingDeadlines}</div>
          <h3 className="text-sm font-medium text-red-100 mt-1">Upcoming Deadlines</h3>
          <p className="text-xs text-red-200 mt-2">Click to view →</p>
        </div>

        {/* Completed Projects */}
        <div 
          onClick={() => goTo('/contractor/projects')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsCheckCircle size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Done</span>
          </div>
          <div className="text-3xl font-bold">{stats.completedProjects}</div>
          <h3 className="text-sm font-medium text-green-100 mt-1">Completed Projects</h3>
          <p className="text-xs text-green-200 mt-2">Click to view →</p>
        </div>

        {/* Average Rating */}
        <div 
          onClick={() => goTo('/contractor/portal')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsPerson size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Rating</span>
          </div>
          <div className="text-3xl font-bold">{stats.averageRating}/5</div>
          <h3 className="text-sm font-medium text-purple-100 mt-1">Average Rating</h3>
          <p className="text-xs text-purple-200 mt-2">Click for profile →</p>
        </div>

        {/* Pending Payments */}
        <div 
          onClick={() => goTo('/contractor/invoices')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsClockHistory size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Awaiting</span>
          </div>
          <div className="text-3xl font-bold">KES {stats.pendingPayments?.toLocaleString() || 0}</div>
          <h3 className="text-sm font-medium text-orange-100 mt-1">Pending Payments</h3>
          <p className="text-xs text-orange-200 mt-2">Click to view →</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ContractorDashboard
