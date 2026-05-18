import React, { useState } from 'react'
import { BsClipboardCheck, BsCalendarCheck, BsFileText, BsPersonCircle, BsPersonCheck, BsCalendarX, BsBullseye, BsHandThumbsUp, BsClipboard, BsBriefcase } from 'react-icons/bs'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Header from '../../components/common/Header'
import { attendanceAPI } from '../../services/api'
import { toast } from 'react-toastify'

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const firstName = user?.firstName || 'Welcome'
  const [punchLoading, setPunchLoading] = useState(false)

  const handleQuickPunch = async () => {
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="page-header">
            <h1 className="page-title">{firstName}'s Dashboard</h1>
            <p className="page-subtitle">Welcome! Here's your personal overview.</p>
          </div>

          <div className="grid-2">
            <Card className="!bg-blue-600/20 dark:!bg-blue-500/20 !border-2 !border-blue-600/30 dark:!border-blue-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-blue-600 dark:text-blue-400">
                  <BsPersonCheck size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">Quick Punch</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Record your attendance</p>
                <Button variant="primary" onClick={handleQuickPunch} loading={punchLoading} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  Punch Now
                </Button>
              </div>
            </Card>

            <Card className="!bg-green-600/20 dark:!bg-green-500/20 !border-2 !border-green-600/30 dark:!border-green-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-green-600 dark:text-green-400">
                  <BsClipboardCheck size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">My Attendance</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">View attendance records</p>
                <a href="/employee/attendance" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">View Details</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-orange-600/20 dark:!bg-orange-500/20 !border-2 !border-orange-600/30 dark:!border-orange-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-orange-600 dark:text-orange-400">
                  <BsCalendarCheck size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">My Leave and Off-days</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Manage leave and off-day requests</p>
                <a href="/employee/leaves" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">Manage Leave and Off-days</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-purple-600/20 dark:!bg-purple-500/20 !border-2 !border-purple-600/30 dark:!border-purple-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-purple-600 dark:text-purple-400">
                  <BsPersonCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">My Profile</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">View and update profile</p>
                <a href="/employee/profile" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">View Profile</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-red-600/20 dark:!bg-red-500/20 !border-2 !border-red-600/30 dark:!border-red-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-red-600 dark:text-red-400">
                  <BsCalendarX size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">Request Leave and Off-days</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Submit leave and off-day request</p>
                <a href="/leave/request" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">Request Leave and Off-days</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-blue-500/20 dark:!bg-blue-400/20 !border-2 !border-blue-500/30 dark:!border-blue-400/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-blue-500 dark:text-blue-400">
                  <BsBullseye size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">My Goals</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">View KPI goals</p>
                <a href="/kpi/my-goals" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">View Goals</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-teal-600/20 dark:!bg-teal-500/20 !border-2 !border-teal-600/30 dark:!border-teal-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-teal-600 dark:text-teal-400">
                  <BsFileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">My Payslips</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">View payslip history</p>
                <a href="/payroll/payslips" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white">View Payslips</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-amber-600/20 dark:!bg-amber-500/20 !border-2 !border-amber-600/30 dark:!border-amber-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-amber-600 dark:text-amber-400">
                  <BsHandThumbsUp size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">Submit Complaint</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Report issue or concern</p>
                <a href="/admin/complaints" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white">Submit</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-indigo-600/20 dark:!bg-indigo-500/20 !border-2 !border-indigo-600/30 dark:!border-indigo-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-indigo-600 dark:text-indigo-400">
                  <BsClipboard size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">Job Board</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">View job openings</p>
                <a href="/recruitment/jobs-board" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">View Jobs</Button>
                </a>
              </div>
            </Card>

            <Card className="!bg-pink-600/20 dark:!bg-pink-500/20 !border-2 !border-pink-600/30 dark:!border-pink-500/30 shadow-md">
              <div className="quick-action p-5">
                <div className="quick-action-icon text-3xl text-pink-600 dark:text-pink-400">
                  <BsBriefcase size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3">My Applications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">View job applications</p>
                <a href="/recruitment/my-applications" className="w-full">
                  <Button variant="primary" className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white">View Applications</Button>
                </a>
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <div className="info-box">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
                  <span className="w-1 h-6 bg-primary dark:bg-primary-light rounded-full"></span>
                  Quick Tips
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-light font-bold mt-1">•</span>
                    <span>Use the Quick Punch button above to record your attendance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-light font-bold mt-1">•</span>
                    <span>Check My Attendance to view your attendance history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-light font-bold mt-1">•</span>
                    <span>Submit leave requests under My Leave and Off-days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-light font-bold mt-1">•</span>
                    <span>Update your profile information anytime</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EmployeeDashboard
