import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsClipboardCheck, BsCalendarCheck, BsFileText, BsPersonCircle, BsPersonCheck, BsCalendarX, BsBullseye, BsHandThumbsUp, BsClipboard, BsBriefcase } from 'react-icons/bs'
import DashboardLayout from '../../components/DashboardLayout'
import { attendanceAPI, employeeAPI, leaveAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const EmployeeDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.firstName || 'Welcome'
  const [punchLoading, setPunchLoading] = useState(false)
  const [stats, setStats] = useState({
    attendanceCount: 0,
    leaveBalance: 0,
    pendingLeaves: 0,
    kpiScore: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, leaveRes] = await Promise.all([
          employeeAPI.getMe().catch(() => ({ data: null })),
          leaveAPI.getBalance().catch(() => ({ data: { annual: 0 } })),
        ])
        setStats({
          attendanceCount: empRes.data?.attendanceCount || 0,
          leaveBalance: leaveRes.data?.annual || 0,
          pendingLeaves: leaveRes.data?.pending || 0,
          kpiScore: empRes.data?.kpiScore || 85,
        })
      } catch (e) {
        console.error('Failed to fetch stats', e)
      }
    }
    fetchStats()
  }, [])

  const handleQuickPunch = async (e) => {
    e.stopPropagation()
    setPunchLoading(true)
    try {
      const deviceId = localStorage.getItem('biometricDeviceId') || 'BIO-001'
      await attendanceAPI.manualSelfPunch({
        biometricDeviceId: deviceId,
        punchState: 'checkOut',
      })
      toast.success('Punch recorded successfully')
    } catch (error) {
      toast.error('Failed to record punch')
    } finally {
      setPunchLoading(false)
    }
  }

  const goTo = (path) => {
    window.scrollTo(0, 0)
    navigate(path)
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{firstName}'s Dashboard</h1>
        <p className="page-subtitle">Welcome! Here's your personal overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Quick Punch */}
        <div 
          onClick={handleQuickPunch}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsPersonCheck size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{punchLoading ? '...' : 'Tap'}</span>
          </div>
          <h3 className="text-lg font-bold">Quick Punch</h3>
          <p className="text-blue-100 text-sm mt-1">Record attendance now</p>
          <p className="text-xs text-blue-200 mt-3">Click to punch →</p>
        </div>

        {/* My Attendance */}
        <div 
          onClick={() => goTo('/employee/attendance')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsClipboardCheck size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stats.attendanceCount} days</span>
          </div>
          <h3 className="text-lg font-bold">My Attendance</h3>
          <p className="text-emerald-100 text-sm mt-1">View attendance records</p>
          <p className="text-xs text-emerald-200 mt-3">Click to view →</p>
        </div>

        {/* My Leave */}
        <div 
          onClick={() => goTo('/employee/leaves')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsCalendarCheck size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stats.leaveBalance} days left</span>
          </div>
          <h3 className="text-lg font-bold">My Leave</h3>
          <p className="text-orange-100 text-sm mt-1">Manage leave requests</p>
          <p className="text-xs text-orange-200 mt-3">Click to manage →</p>
        </div>

        {/* Request Leave */}
        <div 
          onClick={() => goTo('/leave/request')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsCalendarX size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stats.pendingLeaves} pending</span>
          </div>
          <h3 className="text-lg font-bold">Request Leave</h3>
          <p className="text-red-100 text-sm mt-1">Submit new leave request</p>
          <p className="text-xs text-red-200 mt-3">Click to request →</p>
        </div>

        {/* My Profile */}
        <div 
          onClick={() => goTo('/employee/profile')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsPersonCircle size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 className="text-lg font-bold">My Profile</h3>
          <p className="text-purple-100 text-sm mt-1">View & update profile</p>
          <p className="text-xs text-purple-200 mt-3">Click to edit →</p>
        </div>

        {/* My Goals */}
        <div 
          onClick={() => goTo('/kpi/my-goals')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsBullseye size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stats.kpiScore}%</span>
          </div>
          <h3 className="text-lg font-bold">My Goals</h3>
          <p className="text-cyan-100 text-sm mt-1">Track KPI performance</p>
          <p className="text-xs text-cyan-200 mt-3">Click to view →</p>
        </div>

        {/* My Payslips */}
        <div 
          onClick={() => goTo('/payroll/payslips')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsFileText size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Latest</span>
          </div>
          <h3 className="text-lg font-bold">My Payslips</h3>
          <p className="text-teal-100 text-sm mt-1">View salary history</p>
          <p className="text-xs text-teal-200 mt-3">Click to view →</p>
        </div>

        {/* Submit Complaint */}
        <div 
          onClick={() => goTo('/admin/complaints')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsHandThumbsUp size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Report</span>
          </div>
          <h3 className="text-lg font-bold">Submit Complaint</h3>
          <p className="text-amber-100 text-sm mt-1">Report issue or concern</p>
          <p className="text-xs text-amber-200 mt-3">Click to submit →</p>
        </div>

        {/* Job Board */}
        <div 
          onClick={() => goTo('/recruitment/jobs-board')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsClipboard size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Open</span>
          </div>
          <h3 className="text-lg font-bold">Job Board</h3>
          <p className="text-indigo-100 text-sm mt-1">View job openings</p>
          <p className="text-xs text-indigo-200 mt-3">Click to browse →</p>
        </div>

        {/* My Applications */}
        <div 
          onClick={() => goTo('/recruitment/my-applications')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 text-white p-6 shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl"><BsBriefcase size={28} /></div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Track</span>
          </div>
          <h3 className="text-lg font-bold">My Applications</h3>
          <p className="text-pink-100 text-sm mt-1">Track job applications</p>
          <p className="text-xs text-pink-200 mt-3">Click to view →</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EmployeeDashboard
