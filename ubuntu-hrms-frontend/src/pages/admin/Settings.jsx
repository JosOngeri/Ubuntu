import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'

const AdminSettings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [officeLocation, setOfficeLocation] = useState({
    latitude: -1.19293,
    longitude: 36.93057,
    radius_meters: 1000,
    name: 'Main Office',
  })

  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [canSelfRecord, setCanSelfRecord] = useState(true)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch office location
      const locResponse = await api.get('/api/settings/location/office')
      if (locResponse.data.location) {
        setOfficeLocation(locResponse.data.location)
      }

      // Fetch employees
      const empResponse = await api.get('/api/settings/attendance/employees')
      if (empResponse.data.employees) {
        setEmployees(empResponse.data.employees)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLocation = async (e) => {
    e.preventDefault()
    try {
      setUpdating(true)

      await api.put('/api/settings/location/office', officeLocation)

      toast.success('Office location updated successfully')
    } catch (err) {
      console.error('Error updating location:', err)
      toast.error(err.response?.data?.msg || 'Failed to update location')
    } finally {
      setUpdating(false)
    }
  }

  const handleEmployeeSelect = (emp) => {
    setSelectedEmployee(emp)
    setCanSelfRecord(emp.can_self_record_attendance)
  }

  const handleUpdateEmployeePermission = async (e) => {
    e.preventDefault()
    if (!selectedEmployee) return

    try {
      setUpdating(true)

      await api.put(`/api/settings/attendance/employee/${selectedEmployee.id}`, { can_self_record_attendance: canSelfRecord })

      // Update the employee in the list
      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id
            ? { ...emp, can_self_record_attendance: canSelfRecord }
            : emp
        )
      )
      setSelectedEmployee({ ...selectedEmployee, can_self_record_attendance: canSelfRecord })

      toast.success('Employee permission updated successfully')
    } catch (err) {
      console.error('Error updating permission:', err)
      toast.error(err.response?.data?.msg || 'Failed to update permission')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">System Settings</h1>
        <p className="page-subtitle">Manage office location and employee permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Office Location Card */}
        <Card>
          <div className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Office Location Settings</h2>
            <p className="text-sm text-slate-500">Configure your office location and allowed radius for attendance</p>
          </div>
          
            <form onSubmit={handleUpdateLocation} className="space-y-4">
                <Input
                  label="Office Name"
                  id="office-name"
                  type="text"
                  value={officeLocation.name}
                  onChange={(e) =>
                    setOfficeLocation({ ...officeLocation, name: e.target.value })
                  }
                  placeholder="e.g., Main Office"
                />

              <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    id="latitude"
                    type="number"
                    step="0.00001"
                    value={officeLocation.latitude}
                    onChange={(e) =>
                      setOfficeLocation({
                        ...officeLocation,
                        latitude: parseFloat(e.target.value),
                      })
                    }
                    placeholder="-1.19293"
                  />

                  <Input
                    label="Longitude"
                    id="longitude"
                    type="number"
                    step="0.00001"
                    value={officeLocation.longitude}
                    onChange={(e) =>
                      setOfficeLocation({
                        ...officeLocation,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                    placeholder="36.93057"
                  />
              </div>

                <Input
                  label="Allowed Radius (meters)"
                  id="radius"
                  type="number"
                  value={officeLocation.radius_meters}
                  onChange={(e) =>
                    setOfficeLocation({
                      ...officeLocation,
                      radius_meters: parseInt(e.target.value),
                    })
                  }
                  placeholder="1000"
                />

              <Button type="submit" disabled={updating} className="w-full" variant="primary">
                {updating ? 'Updating...' : 'Update Location Settings'}
              </Button>
            </form>
        </Card>

        {/* Employee Permissions Card */}
        <Card>
          <div className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Employee Attendance Permissions</h2>
            <p className="text-sm text-slate-500">Manage which employees can self-record attendance</p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="employee-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Employee</label>
              <select
                id="employee-select"
                value={selectedEmployee?.id || ''}
                onChange={(e) => {
                  const emp = employees.find(
                    (e) => e.id === parseInt(e.currentTarget.value)
                  )
                  if (emp) handleEmployeeSelect(emp)
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Select an employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employment_type})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg space-y-3 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Name</p>
                    <p className="text-slate-900 dark:text-slate-100">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Employment Type</p>
                    <p className="text-slate-900 dark:text-slate-100">{selectedEmployee.employment_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Department</p>
                    <p className="text-slate-900 dark:text-slate-100">{selectedEmployee.department}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateEmployeePermission} className="space-y-4">
                  <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
                    <input
                      type="checkbox"
                      id="can-self-record"
                      checked={canSelfRecord}
                      onChange={(e) => setCanSelfRecord(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <label htmlFor="can-self-record" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                      Allow self-recording of attendance
                    </label>
                  </div>

                  {!canSelfRecord && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
                      This employee will not be able to manually record their own attendance and
                      must have attendance recorded by a manager.
                    </div>
                  )}

                  <Button type="submit" disabled={updating} className="w-full" variant="primary">
                    {updating ? 'Updating...' : 'Update Permission'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <div className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">All Employees Attendance Status</h2>
          <p className="text-sm text-slate-500">Overview of all employees and their attendance recording permissions</p>
        </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Department</th>
                  <th className="text-center px-4 py-3 font-medium">Can Self-Record</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => handleEmployeeSelect(emp)}
                    >
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.employment_type}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.department}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            emp.can_self_record_attendance
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {emp.can_self_record_attendance ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </Card>
    </DashboardLayout>
  )
}

export default AdminSettings
