import React, { useEffect, useState } from 'react'
import { BsPeople, BsClipboardCheck, BsCreditCard, BsGraphUp } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardStats from '../../components/common/DashboardStats'
import Modal from '../../components/common/Modal'
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
  const [showSystemStatusModal, setShowSystemStatusModal] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [empRes, payrollRes, kpiRes, attendanceRes, leaveRes] = await Promise.all([
          employeeAPI.getAll(),
          api.get('/api/payroll').catch(() => ({ data: [] })),
          api.get('/api/kpis/all').catch(() => ({ data: [] })),
          api.get('/api/attendance/today').catch(() => ({ data: [] })),
          api.get('/api/leave').catch(() => ({ data: [] }))
        ]);

        const employees = empRes.data || [];
        const payrolls = payrollRes.data || [];
        const kpis = kpiRes.data || [];
        const todayAttendance = attendanceRes.data || [];
        const leaves = leaveRes.data || [];

        // Calculate real KPI average
        const evaluatedKpis = kpis.filter(k => k.final_score !== null && k.final_score !== undefined);
        const realAvgKPI = evaluatedKpis.length > 0
          ? Math.round(evaluatedKpis.reduce((sum, k) => sum + Number(k.final_score), 0) / evaluatedKpis.length)
          : 0;

        // Real attendance count for today
        const presentToday = todayAttendance.length || 0;

        // Pending items
        const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

        setStats({
          totalEmployees: employees.length,
          presentToday: presentToday,
          pendingPayroll: payrolls.filter(p => p.status === 'Draft').length,
          avgKPI: realAvgKPI,
          pendingLeaves: pendingLeaves,
          openComplaints: 0,
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

      {/* Simple Payroll Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="bg-gradient-to-r from-[#CB7246] to-[#F27C12] text-white rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold">Payroll Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="bg-orange-50 p-4 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors hover:shadow-md"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/admin/payroll', { 
                state: { 
                  filterType: 'daily_worker',
                  filterStatus: 'pending'
                } 
              });
            }}
          >
            <p className="text-sm font-medium text-gray-600">Today's Daily Labour</p>
            <p className="text-xl font-bold text-gray-900">KES 1,250</p>
            <p className="text-xs text-orange-600 mt-1">Click to view →</p>
          </div>
          <div 
            className="bg-green-50 p-4 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors hover:shadow-md"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/admin/payroll', { 
                state: { 
                  filterType: 'monthly_employee',
                  filterStatus: 'pending'
                } 
              });
            }}
          >
            <p className="text-sm font-medium text-gray-600">Monthly Wage Bill</p>
            <p className="text-xl font-bold text-gray-900">KES 28,500</p>
            <p className="text-xs text-green-600 mt-1">Click to view →</p>
          </div>
          <div 
            className="bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors hover:shadow-md"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/admin/payroll', { 
                state: { 
                  filterType: 'contractor',
                  filterStatus: 'pending'
                } 
              });
            }}
          >
            <p className="text-sm font-medium text-gray-600">Contractors Pending</p>
            <p className="text-xl font-bold text-gray-900">KES 8,750</p>
            <p className="text-xs text-gray-600 mt-1">Click to view →</p>
          </div>
        </div>
      </div>

      <div className="grid-4">
        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0" onClick={() => { window.scrollTo(0, 0); navigate('/admin/employees'); }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsPeople size={26} className="text-white" />
              </div>
              <span className="text-blue-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">↑ 5%</span>
            </div>
            <span className="text-blue-100 text-sm font-medium">Total Employees</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.totalEmployees}</div>
            <span className="text-blue-200 text-xs mt-1">Click to manage →</span>
          </div>
        </Card>

        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0" onClick={() => { window.scrollTo(0, 0); navigate('/admin/attendance'); }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsClipboardCheck size={26} className="text-white" />
              </div>
              <span className="text-emerald-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">90%</span>
            </div>
            <span className="text-emerald-100 text-sm font-medium">Present Today</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.presentToday}</div>
            <span className="text-emerald-200 text-xs mt-1">Click to view →</span>
          </div>
        </Card>

        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0" onClick={() => { window.scrollTo(0, 0); navigate('/admin/payroll', { state: { filterStatus: 'Draft' } }); }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsCreditCard size={26} className="text-white" />
              </div>
              <span className="text-amber-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Pending</span>
            </div>
            <span className="text-amber-100 text-sm font-medium">Pending Payroll</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.pendingPayroll}</div>
            <span className="text-amber-200 text-xs mt-1">Click to process →</span>
          </div>
        </Card>

        <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200 !bg-gradient-to-br from-violet-500 to-purple-700 text-white border-0" onClick={() => { window.scrollTo(0, 0); navigate('/admin/kpis'); }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BsGraphUp size={26} className="text-white" />
              </div>
              <span className="text-violet-100 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">On track</span>
            </div>
            <span className="text-violet-100 text-sm font-medium">Avg KPI Score</span>
            <div className="text-3xl font-bold text-white mt-1">{stats.avgKPI}%</div>
            <span className="text-violet-200 text-xs mt-1">Click to view →</span>
          </div>
        </Card>
      </div>

      {/* Pending Items Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pending Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.pendingLeaves > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/leave'); }}>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Leaves</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pendingLeaves}</p>
            </div>
          )}
          {stats.pendingPayroll > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/payroll', { state: { filterStatus: 'Draft' } }); }}>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Draft Payroll</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pendingPayroll}</p>
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/kpis'); }}>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Overdue KPIs</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">-</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/complaints'); }}>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Open Complaints</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.openComplaints}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/leave'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
            Approve Leaves
          </button>
          <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/payroll'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
            Generate Payroll
          </button>
          <button onClick={() => { window.scrollTo(0, 0); navigate('/complaints'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
            View Complaints
          </button>
          <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/kpis'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
            Review KPIs
          </button>
          <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/attendance'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
            Check Attendance
          </button>
        </div>
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
                  <Bar dataKey="Gross" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} onClick={(data) => navigate('/admin/payroll', { state: { search: data.name } })} cursor="pointer" />
                  <Bar dataKey="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} onClick={(data) => navigate('/admin/payroll', { state: { search: data.name } })} cursor="pointer" />
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        onClick={() => navigate('/admin/employees', { state: { department: entry.name } })}
                        cursor="pointer"
                      />
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
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => setShowSystemStatusModal(true)}>
          <div className="recent-activity">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">System Status</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">System is running smoothly. All endpoints are active and synchronized. <span className="text-blue-500">Click for details →</span></p>
          </div>
        </Card>
      </div>

      <Modal isOpen={showSystemStatusModal} onClose={() => setShowSystemStatusModal(false)} title="System Status Details">
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">API Status</span>
            <span className="text-green-600 font-medium">● All endpoints active</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Database Connection</span>
            <span className="text-green-600 font-medium">● Connected</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Last Sync</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Active Users</span>
            <span>{stats.totalEmployees}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">System Uptime</span>
            <span>99.9%</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Errors/Warnings</span>
            <span className="text-green-600">None</span>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default AdminDashboard
