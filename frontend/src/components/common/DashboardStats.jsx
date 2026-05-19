import React from 'react'
import DashboardCard from './DashboardCard'
import PayrollCard from './PayrollCard'
import { BsPeople, BsBriefcase, BsCalendarCheck, BsGraphUp } from 'react-icons/bs'

export default function DashboardStats({ stats = {}, onEmployeesClick = null, onProjectsClick = null, onAttendanceClick = null, onTasksClick = null, onPayrollClick = null }) {
  const defaultStats = {
    totalEmployees: stats.totalEmployees || 25,
    activeProjects: stats.activeProjects || 68,
    attendanceRate: stats.attendanceRate || 90,
    pendingTasks: stats.pendingTasks || 120,
    employeesTrend: stats.employeesTrend || 5.2,
    projectsTrend: stats.projectsTrend || 12.5,
    attendanceTrend: stats.attendanceTrend || -2.1,
    tasksTrend: stats.tasksTrend || 8.7
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#CB7246] to-[#F27C12] text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-white/90 mt-1">Overview of your HR Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <DashboardCard
          title="Total Employees"
          value={defaultStats.totalEmployees}
          icon={<BsPeople />}
          color="orange"
          trend={defaultStats.employeesTrend}
          onClick={onEmployeesClick}
        />
        
        <DashboardCard
          title="Active Projects"
          value={defaultStats.activeProjects}
          icon={<BsBriefcase />}
          color="green"
          trend={defaultStats.projectsTrend}
          onClick={onProjectsClick}
        />
        
        <DashboardCard
          title="Attendance Rate"
          value={`${defaultStats.attendanceRate}%`}
          icon={<BsCalendarCheck />}
          color="orange"
          trend={defaultStats.attendanceTrend}
          onClick={onAttendanceClick}
        />
        
        <DashboardCard
          title="Pending Tasks"
          value={defaultStats.pendingTasks}
          icon={<BsGraphUp />}
          color="gray"
          trend={defaultStats.tasksTrend}
          onClick={onTasksClick}
        />
      </div>

      {/* Payroll Card - Spans full width */}
      <PayrollCard 
        payrollData={{
          dailyWageBill: stats.dailyWageBill || 1250,
          monthlyWageBill: stats.monthlyWageBill || 28500,
          contractorPayments: stats.contractorPayments || 8750,
          dailyTrend: stats.dailyTrend || 2.5,
          monthlyTrend: stats.monthlyTrend || 8.2,
          contractorTrend: stats.contractorTrend || -3.1
        }}
        onClick={onPayrollClick}
      />
    </div>
  )
}
