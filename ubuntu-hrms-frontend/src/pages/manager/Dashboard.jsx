import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsPeople, BsClipboardCheck, BsHandThumbsUp, BsGraphUp, BsCheckCircle, BsCreditCard } from 'react-icons/bs'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI } from '../../services/api'

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    pendingApprovals: 0,
    avgKPI: 0,
  })
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await employeeAPI.getAll()
        const employees = response.data || []
        setStats({
          teamSize: employees.length,
          presentToday: Math.floor(employees.length * 0.85),
          pendingApprovals: 3,
          avgKPI: 82,
        })
        setTeamMembers(employees.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch stats', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Manager Dashboard</h1>
        <p className="page-subtitle">Manage your team and day-to-day operations</p>
      </div>

      <div className="grid-4">
        <Card>
          <div className="stat-card">
            <div className="stat-icon">
              <BsPeople size={28} />
            </div>
            <span className="stat-label">Team Size</span>
            <span className="stat-value">{stats.teamSize}</span>
            <span className="stat-change">Active members</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon present">
              <BsClipboardCheck size={28} />
            </div>
            <span className="stat-label">Present Today</span>
            <span className="stat-value">{stats.presentToday}</span>
            <span className="stat-change">{stats.teamSize > 0 ? Math.round((stats.presentToday / stats.teamSize) * 100) : 0}% attendance</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon pending">
              <BsHandThumbsUp size={28} />
            </div>
            <span className="stat-label">Pending Approvals</span>
            <span className="stat-value">{stats.pendingApprovals}</span>
            <span className="stat-change">Leave requests</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon success">
              <BsGraphUp size={28} />
            </div>
            <span className="stat-label">Team Avg KPI</span>
            <span className="stat-value">{stats.avgKPI}%</span>
            <span className="stat-change">Performing well</span>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="recent-activity">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary dark:bg-primary-light rounded-full"></span>
              Quick Actions
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="secondary" className="justify-start py-3" onClick={() => navigate('/leave/approvals')}>
                <BsCheckCircle className="text-blue-500" size={18} />
                Review Leaves
              </Button>
              <Button variant="secondary" className="justify-start py-3" onClick={() => navigate('/manager/attendance')}>
                <BsClipboardCheck className="text-green-500" size={18} />
                Manage Attendance
              </Button>
              <Button variant="secondary" className="justify-start py-3" onClick={() => navigate('/kpi/manage')}>
                <BsGraphUp className="text-purple-500" size={18} />
                Set KPI Goals
              </Button>
              <Button variant="secondary" className="justify-start py-3" onClick={() => navigate('/payroll/disburse')}>
                <BsCreditCard className="text-amber-500" size={18} />
                Disburse Payroll
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="recent-activity">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <span className="w-1 h-6 bg-primary dark:bg-primary-light rounded-full"></span>
              Team Overview
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-3 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                ))}
              </div>
            ) : teamMembers.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamMembers.map(member => (
                  <li key={member.id || member._id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold uppercase">
                        {(member.firstName?.[0] || '') + (member.lastName?.[0] || '') || 'E'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{member.department || 'General'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                      {member.employmentType || 'Permanent'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 mt-4">No team members found.</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ManagerDashboard
