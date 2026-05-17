import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { attendanceAPI, employeeAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { BsPencil, BsClock } from 'react-icons/bs'
import { downloadPdfReport } from '../../utils/reportExport'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../../components/ui/select'
// import './Attendance.css'

const Attendance = ({ role = 'employee' }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isEmployee = role === 'employee'
  const canManageAttendance = role === 'admin' || role === 'manager'

  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPunchModal, setShowPunchModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [punchData, setPunchData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    punchState: 'checkIn',
    employeeId: '',
  })
  const [adjustData, setAdjustData] = useState({
    id: '',
    attendanceDate: '',
    status: 'Present',
    shift: 'Morning',
    checkIn: '',
    breakOut: '',
    breakIn: '',
    checkOut: '',
  })
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [biometricDeviceId, setBiometricDeviceId] = useState(localStorage.getItem('biometricDeviceId') || 'BIO-001')
  const [employees, setEmployees] = useState([])
  const [employeeProfile, setEmployeeProfile] = useState(null)


  // Fetch employee profile for status and privacy
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!isEmployee) return
        const res = await employeeAPI.getMe()
        setEmployeeProfile(res.data)
      } catch {
        setEmployeeProfile(null)
      }
    }
    fetchProfile()
  }, [isEmployee, user?.userId, user?.id])

  useEffect(() => {
    if (canManageAttendance) {
      fetchEmployees()
      return
    }

    if (isEmployee && !employeeProfile?.id && !employeeProfile?._id) {
      return
    }

    fetchAttendance()
  }, [user?.id, user?.userId, role, isEmployee, employeeProfile?.id, employeeProfile?._id])

  useEffect(() => {
    if (canManageAttendance) {
      if (selectedEmployee) {
        fetchAttendance(selectedEmployee)
      } else {
        setAttendance([])
      }
    }
  }, [selectedEmployee])

  useEffect(() => {
    localStorage.setItem('biometricDeviceId', biometricDeviceId || '')
  }, [biometricDeviceId])

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll()
      const items = res.data || []
      setEmployees(items)

      if (items.length > 0 && !selectedEmployee) {
        setSelectedEmployee(items[0]._id || items[0].id)
      }
    } catch (err) {
      setEmployees([])
      toast.error('Failed to fetch employees')
    }
  }

  const fetchAttendance = async (empId) => {
    try {
      setLoading(true)

      const employeeId = canManageAttendance
        ? empId
        : (empId || employeeProfile?.id || employeeProfile?._id || user?.userId || user?.id)

      if (!employeeId) {
        setAttendance([])
        return
      }

      const response = await attendanceAPI.getByEmployeeId(employeeId)
      setAttendance(response.data || [])
    } catch (error) {
      console.error('Failed to fetch attendance', error)
      toast.error('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleSelfPunch = async (state) => {
    try {
      // Get geolocation
      const getPosition = () =>
        new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
      let geo = null;
      try {
        const pos = await getPosition();
        geo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      } catch (geoErr) {
        toast.error('Location required to log attendance');
        return;
      }

      await attendanceAPI.manualSelfPunch({
        biometricDeviceId,
        punchState: state,
        geolocation: geo,
      });
      toast.success('Attendance logged');
      fetchAttendance();
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to log attendance');
    }
  } 

  const handleManagerPunch = async (e) => {
    e.preventDefault()

    try {
      if (!punchData.employeeId) {
        toast.error('Please select an employee')
        return
      }
      await attendanceAPI.managerManualPunch({
        ...punchData,
      })
      toast.success('Attendance recorded successfully')
      setShowPunchModal(false)
      setPunchData({
        timestamp: new Date().toISOString().slice(0, 16),
        punchState: 'checkIn',
        employeeId: selectedEmployee || '',
      })
      fetchAttendance(punchData.employeeId)
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to record attendance')
    }
  }

  const openAdjustmentModal = (row) => {
    const toLocalInput = (value) => {
      if (!value) return ''
      const date = new Date(value)
      const offset = date.getTimezoneOffset() * 60000
      return new Date(date.getTime() - offset).toISOString().slice(0, 16)
    }

    setAdjustData({
      id: row._id || row.id,
      attendanceDate: row.attendanceDate ? String(row.attendanceDate).slice(0, 10) : '',
      status: row.status || 'Present',
      shift: row.shift || 'Morning',
      checkIn: toLocalInput(row.checkIn),
      breakOut: toLocalInput(row.breakOut),
      breakIn: toLocalInput(row.breakIn),
      checkOut: toLocalInput(row.checkOut),
    })
    setShowAdjustModal(true)
  }

  const handleAdjustmentSave = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        attendanceDate: adjustData.attendanceDate || undefined,
        status: adjustData.status,
        shift: adjustData.shift,
        checkIn: adjustData.checkIn || undefined,
        breakOut: adjustData.breakOut || undefined,
        breakIn: adjustData.breakIn || undefined,
        checkOut: adjustData.checkOut || undefined,
      }

      await attendanceAPI.update(adjustData.id, payload)
      toast.success('Attendance updated successfully')
      setShowAdjustModal(false)
      fetchAttendance(selectedEmployee)
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to adjust attendance')
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return new Date(time).toLocaleTimeString('en-US', { hour12: true })
  }

  const formatHours = (hours) => {
    if (!hours) return '-'
    return hours.toFixed(2) + ' hrs'
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredAttendance = attendance.filter((row) => {
    const dateText = row.attendanceDate ? new Date(row.attendanceDate).toLocaleDateString().toLowerCase() : ''
    const matchesSearch =
      !normalizedSearch ||
      dateText.includes(normalizedSearch) ||
      (row.status || '').toLowerCase().includes(normalizedSearch) ||
      (row.shift || '').toLowerCase().includes(normalizedSearch)
    const matchesStatus = statusFilter === 'all' || (row.status || '').toLowerCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleExportAttendanceReport = async () => {
    await downloadPdfReport({
      fileName: 'attendance-report.pdf',
      title: 'Attendance Report',
      rows: filteredAttendance,
      columns: [
        { label: 'Date', getValue: (row) => (row.attendanceDate ? new Date(row.attendanceDate).toLocaleDateString() : '') },
        { label: 'Status', getValue: (row) => row.status || '' },
        { label: 'Shift', getValue: (row) => row.shift || '' },
        { label: 'Check In', getValue: (row) => formatTime(row.checkIn) },
        { label: 'Check Out', getValue: (row) => formatTime(row.checkOut) },
        { label: 'Hours', getValue: (row) => formatHours(row.totalHoursWorked) },
      ],
      metadata: [
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
        { label: 'Scope', value: canManageAttendance ? 'Managed Employee' : 'Self' },
      ],
    })
  }

  const columns = [
    {
      key: 'attendanceDate',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    { key: 'status', label: 'Status' },
    { key: 'shift', label: 'Shift' },
    {
      key: 'checkIn',
      label: 'Check In',
      render: formatTime,
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: formatTime,
    },
    {
      key: 'totalHoursWorked',
      label: 'Hours',
      render: formatHours,
    },
    ...(canManageAttendance
      ? [
          {
            key: 'id',
            label: 'Actions',
            render: (_, row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => navigate(`/${role}/attendance/${row.id}`)}>View Details</Button>
                <button className="btn-icon edit" onClick={() => openAdjustmentModal(row)} title="Adjust Attendance">
                  <BsPencil size={16} />
                </button>
              </div>
            ),
          },
        ]
      : [{ key: 'id', label: 'Actions', render: (_, row) => (
          <Button size="sm" variant="primary" onClick={() => navigate(`/${role}/attendance/${row.id}`)}>View Details</Button>
        )}]),
  ]

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          {isEmployee ? 'Daily logging and history' : 'Daily logging, history, and adjustment'}
        </p>
      </div>

      {canManageAttendance && (
        <Card>
          <div className="attendance-actions flex flex-wrap gap-3 items-center">
            <label className="font-medium">Employee</label>
            <select
              className="form-select"
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value)
                setPunchData((prev) => ({ ...prev, employeeId: e.target.value }))
              }}
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              onClick={() => {
                if (!selectedEmployee) {
                  toast.error('Select an employee first')
                  return
                }

                setPunchData((prev) => ({
                  ...prev,
                  employeeId: selectedEmployee,
                }))
                setShowPunchModal(true)
              }}
            >
              <BsClock size={18} />
              Log Daily Attendance
            </Button>
          </div>
        </Card>
      )}

      {isEmployee && employeeProfile && (
        <Card>
          <div className="mb-2 flex flex-wrap gap-4 items-center">
            <span className="font-semibold">Status:</span>
            <span className={`px-3 py-1 rounded-full text-white ${employeeProfile.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>{employeeProfile.status}</span>
          </div>
          {employeeProfile.status === 'active' && (
            <div className="attendance-actions flex flex-wrap gap-3 items-end">
              {/* Only show biometric input if user is the employee */}
              {user?.userId === employeeProfile.userId || user?.id === employeeProfile.userId ? (
                <Input
                  label="Biometric Device ID"
                  value={biometricDeviceId}
                  onChange={(e) => setBiometricDeviceId(e.target.value)}
                  placeholder="BIO-001"
                />
              ) : null}
              <Button variant="outline" onClick={() => handleSelfPunch('checkIn')}>
                Check In
              </Button>
              <Button variant="outline" onClick={() => handleSelfPunch('breakOut')}>
                Break Out
              </Button>
              <Button variant="outline" onClick={() => handleSelfPunch('breakIn')}>
                Break In
              </Button>
              <Button variant="primary" onClick={() => handleSelfPunch('checkOut')}>
                Check Out
              </Button>
            </div>
          )}
          {employeeProfile.status !== 'active' && (
            <div className="text-red-600 font-medium mt-2">You are not allowed to log attendance (status: {employeeProfile.status})</div>
          )}
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Input
            label="Search"
            placeholder="Search by date, status, or shift"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[240px]"
          />
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleExportAttendanceReport}>Export Report</Button>
        </div>
        <Table columns={columns} data={filteredAttendance} loading={loading} />
      </Card>

      {canManageAttendance && (
        <Modal isOpen={showPunchModal} onClose={() => setShowPunchModal(false)} title="Manager Manual Punch">
          <form onSubmit={handleManagerPunch} className="punch-form space-y-4">
            <div className="form-group">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee</label>
              <Select
                value={punchData.employeeId}
                onValueChange={(val) => setPunchData({ ...punchData, employeeId: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Punch Type</label>
              <select
                value={punchData.punchState}
                onChange={(e) => setPunchData({ ...punchData, punchState: e.target.value })}
                className="form-select w-full"
              >
                <option value="checkIn">Check In</option>
                <option value="checkOut">Check Out</option>
              </select>
            </div>
            <Input
              label="Date & Time"
              type="datetime-local"
              value={punchData.timestamp}
              onChange={(e) => setPunchData({ ...punchData, timestamp: e.target.value })}
              required
            />
            <div className="form-actions flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                Record Punch
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPunchModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {canManageAttendance && (
        <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust Attendance">
          <form onSubmit={handleAdjustmentSave} className="space-y-4">
            <div className="form-row">
              <Input
                label="Attendance Date"
                type="date"
                value={adjustData.attendanceDate}
                onChange={(e) => setAdjustData({ ...adjustData, attendanceDate: e.target.value })}
              />
              <div className="form-group">
                <label>Status</label>
                <select
                  value={adjustData.status}
                  onChange={(e) => setAdjustData({ ...adjustData, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Shift</label>
              <select
                value={adjustData.shift}
                onChange={(e) => setAdjustData({ ...adjustData, shift: e.target.value })}
                className="form-select"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
              </select>
            </div>

            <div className="form-row">
              <Input
                label="Check In"
                type="datetime-local"
                value={adjustData.checkIn}
                onChange={(e) => setAdjustData({ ...adjustData, checkIn: e.target.value })}
              />
              <Input
                label="Break Out"
                type="datetime-local"
                value={adjustData.breakOut}
                onChange={(e) => setAdjustData({ ...adjustData, breakOut: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Break In"
                type="datetime-local"
                value={adjustData.breakIn}
                onChange={(e) => setAdjustData({ ...adjustData, breakIn: e.target.value })}
              />
              <Input
                label="Check Out"
                type="datetime-local"
                value={adjustData.checkOut}
                onChange={(e) => setAdjustData({ ...adjustData, checkOut: e.target.value })}
              />
            </div>

            <div className="form-actions flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                Save Adjustment
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAdjustModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}

export default Attendance
