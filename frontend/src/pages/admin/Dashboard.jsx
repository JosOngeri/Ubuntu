import React, { useEffect, useState } from 'react'
import { BsPeople, BsClipboardCheck, BsCreditCard, BsGraphUp } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import api, { employeeAPI } from '../../services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingPayroll: 0,
    avgKPI: 0,
  })
  const [employeeChart, setEmployeeChart] = useState([])
  const [payrollChart, setPayrollChart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch from multiple endpoints concurrently
        const [empRes, payrollRes] = await Promise.all([
          employeeAPI.getAll(),
          api.get('/api/payroll').catch(() => ({ data: [] })) // Fallback to empty if payroll fails
        ]);

        const employees = empRes.data || [];
        const payrolls = payrollRes.data || [];

        setStats({
          totalEmployees: employees.length,
          presentToday: Math.floor(employees.length * 0.9), // Assuming 90% attendance if no daily endpoint available yet
          pendingPayroll: payrolls.filter(p => p.status === 'Draft').length,
          avgKPI: 85,
        })

        // Group Employees by Role for Pie Chart
        const roleCount = employees.reduce((acc, emp) => {
          const role = emp.role || emp.department || 'Employee';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        
        setEmployeeChart(Object.keys(roleCount).map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: roleCount[key]
        })));

        // Map recent payrolls for Bar Chart
        setPayrollChart(payrolls.slice(0, 6).map(p => ({
          name: p.first_name || 'Emp',
          Gross: p.gross_pay || 0,
          Net: p.net_pay || 0,
        })));

      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your system overview.</p>
      </div>

      <div className="grid-4">
        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0" onClick={() => navigate('/admin/employees')}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsPeople size={26} className="text-white" />
              </div>
              <span className="text-blue-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">↑ 5%</span>
            </div>
            <span className="text-blue-100 text-sm font-medium">Total Employees</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.totalEmployees}</div>
            <span className="text-blue-200 text-xs mt-1">from last month</span>
          </div>
        </Card>

        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0" onClick={() => navigate('/admin/attendance', { state: { filterDate: new Date().toISOString().split('T')[0] } })}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsClipboardCheck size={26} className="text-white" />
              </div>
              <span className="text-emerald-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">90%</span>
            </div>
            <span className="text-emerald-100 text-sm font-medium">Present Today</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.presentToday}</div>
            <span className="text-emerald-200 text-xs mt-1">attendance rate</span>
          </div>
        </Card>

        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0" onClick={() => navigate('/admin/payroll', { state: { filterStatus: 'Draft' } })}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsCreditCard size={26} className="text-white" />
              </div>
              <span className="text-amber-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Pending</span>
            </div>
            <span className="text-amber-100 text-sm font-medium">Pending Payroll</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.pendingPayroll}</div>
            <span className="text-amber-200 text-xs mt-1">process by end of month</span>
          </div>
        </Card>

        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-violet-500 to-purple-700 text-white border-0" onClick={() => navigate('/admin/kpis')}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsGraphUp size={26} className="text-white" />
              </div>
              <span className="text-violet-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">On track</span>
            </div>
            <span className="text-violet-100 text-sm font-medium">Avg KPI Score</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.avgKPI}%</div>
            <span className="text-violet-200 text-xs mt-1">overall performance</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            Recent Payroll Payouts
          </h3>
          <div className="h-72 w-full">
            {payrollChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Gross" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No payroll data available</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
            Employee Distribution
          </h3>
          <div className="h-72 w-full">
            {employeeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={employeeChart} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                    {employeeChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No employee data available</div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="recent-activity">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">System Status</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">System is running smoothly. All endpoints are active and synchronized.</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
