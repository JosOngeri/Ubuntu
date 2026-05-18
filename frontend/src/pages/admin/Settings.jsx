import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import DashboardLayout from '../../components/DashboardLayout'
import ColorPalettePicker from '../../components/common/ColorPalettePicker'
import api from '../../services/api'
import { BsGeoAlt, BsShieldCheck, BsGear, BsClockHistory, BsPalette, BsBuilding, BsPeople, BsFileText, BsBriefcase, BsChat, BsCamera, BsHouse } from 'react-icons/bs'

const AdminSettings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshSettings } = useSettings()
  const [activeSection, setActiveSection] = useState('profile')
  const [selectedColor, setSelectedColor] = useState(null)

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
  
  // System values state
  const [systemSettings, setSystemSettings] = useState({})
  const [editingSetting, setEditingSetting] = useState(null)
  const [newSettingForm, setNewSettingForm] = useState({ setting_key: '', category: '', setting_value: '', description: '', data_type: 'string' })
  
  // Audit log state
  const [auditLogs, setAuditLogs] = useState([])

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

      // Fetch system settings
      const settingsResponse = await api.get('/settings')
      if (settingsResponse.data.settings) {
        const settingsMap = {}
        settingsResponse.data.settings.forEach(setting => {
          let value = setting.setting_value
          if (setting.data_type === 'array') {
            try {
              value = JSON.parse(value)
            } catch (e) {
              console.error(`Failed to parse setting ${setting.setting_key}:`, e)
            }
          }
          settingsMap[setting.setting_key] = { ...setting, parsedValue: value }
        })
        setSystemSettings(settingsMap)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get('/settings/audit/all')
      setAuditLogs(response.data.audit_logs || [])
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      toast.error('Failed to load audit logs')
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

  const handleUpdateSetting = async (e) => {
    e.preventDefault()
    if (!editingSetting) return

    try {
      setUpdating(true)
      const { setting_value, reason } = editingSetting

      await api.put(`/settings/${editingSetting.setting_key}`, { setting_value, reason })
      
      toast.success('Setting updated successfully')
      setEditingSetting(null)
      fetchData()
      refreshSettings()
    } catch (err) {
      console.error('Error updating setting:', err)
      toast.error(err.response?.data?.msg || 'Failed to update setting')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateSetting = async (e) => {
    e.preventDefault()
    try {
      setUpdating(true)

      await api.post('/settings', newSettingForm)
      
      toast.success('Setting created successfully')
      setNewSettingForm({ setting_key: '', category: '', setting_value: '', description: '', data_type: 'string' })
      fetchData()
      refreshSettings()
    } catch (err) {
      console.error('Error creating setting:', err)
      toast.error(err.response?.data?.msg || 'Failed to create setting')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteSetting = async (key) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) return

    try {
      await api.delete(`/settings/${key}`)
      toast.success('Setting deleted successfully')
      fetchData()
      refreshSettings()
    } catch (err) {
      console.error('Error deleting setting:', err)
      toast.error(err.response?.data?.msg || 'Failed to delete setting')
    }
  }

  const renderSystemSettingsContent = (settingKey) => {
    const setting = systemSettings[settingKey]
    if (!setting) {
      return <p className="text-slate-500 dark:text-slate-400">No settings found</p>
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-slate-100">{setting.setting_key}</p>
            <p className="text-sm text-slate-500">{setting.description}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {Array.isArray(setting.parsedValue) ? setting.parsedValue.join(', ') : setting.parsedValue}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setEditingSetting({ ...setting, setting_value: setting.setting_value })}>
              Edit
            </Button>
          </div>
        </div>

        {editingSetting && editingSetting.setting_key === settingKey && (
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900">
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Edit Setting: {editingSetting.setting_key}</h3>
            <form onSubmit={handleUpdateSetting} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Value</label>
                {editingSetting.data_type === 'array' ? (
                  <textarea
                    value={editingSetting.setting_value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, setting_value: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    rows="4"
                    placeholder='["value1", "value2", "value3"]'
                  />
                ) : (
                  <Input
                    value={editingSetting.setting_value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, setting_value: e.target.value })}
                    className="mt-1"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for change</label>
                <input
                  type="text"
                  value={editingSetting.reason || ''}
                  onChange={(e) => setEditingSetting({ ...editingSetting, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  placeholder="Why are you changing this value?"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updating} variant="primary">
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingSetting(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    if (activeSection === 'audit') {
      fetchAuditLogs()
    }
  }, [activeSection])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar Navigation - WhatsApp/Spotify style */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your system preferences</p>
          </div>
          
          <nav className="px-2">
            {/* Profile Section */}
            <div className="mb-6">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Profile</p>
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'profile'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsPeople className="w-5 h-5" />
                <span className="font-medium">Account</span>
              </button>
            </div>

            {/* Location Section */}
            <div className="mb-6">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</p>
              <button
                onClick={() => setActiveSection('location')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'location'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsGeoAlt className="w-5 h-5" />
                <span className="font-medium">Office Location</span>
              </button>
            </div>

            {/* Permissions Section */}
            <div className="mb-6">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Permissions</p>
              <button
                onClick={() => setActiveSection('permissions')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'permissions'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsShieldCheck className="w-5 h-5" />
                <span className="font-medium">Employee Permissions</span>
              </button>
            </div>

            {/* System Section */}
            <div className="mb-6">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System</p>
              <button
                onClick={() => setActiveSection('departments')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'departments'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsBuilding className="w-5 h-5" />
                <span className="font-medium">Departments</span>
              </button>
              <button
                onClick={() => setActiveSection('employment')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'employment'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsBriefcase className="w-5 h-5" />
                <span className="font-medium">Employment Types</span>
              </button>
              <button
                onClick={() => setActiveSection('leave')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'leave'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsFileText className="w-5 h-5" />
                <span className="font-medium">Leave Types</span>
              </button>
              <button
                onClick={() => setActiveSection('dashboard-colors')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'dashboard-colors'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsPalette className="w-5 h-5" />
                <span className="font-medium">Dashboard Colors</span>
              </button>
            </div>

            {/* Audit Section */}
            <div className="mb-6">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">History</p>
              <button
                onClick={() => setActiveSection('audit')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === 'audit'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BsClockHistory className="w-5 h-5" />
                <span className="font-medium">Audit Log</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">

          {activeSection === 'profile' && (
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-2xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-slate-900 dark:text-white font-medium">{user?.email}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                  <p className="text-slate-900 dark:text-white font-medium capitalize">{user?.role}</p>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'location' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BsGeoAlt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Office Location</h2>
                  <p className="text-sm text-slate-500">Configure office location and attendance radius</p>
                </div>
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
      )}

          {activeSection === 'permissions' && (
            <>
              <Card className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <BsShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employee Permissions</h2>
                    <p className="text-sm text-slate-500">Manage employee attendance recording permissions</p>
                  </div>
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
        </>
      )}

          {activeSection === 'departments' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BsBuilding className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Departments</h2>
                  <p className="text-sm text-slate-500">Manage organization departments</p>
                </div>
              </div>
              {renderSystemSettingsContent('DEPARTMENTS')}
            </Card>
          )}

          {activeSection === 'employment' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <BsBriefcase className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employment Types</h2>
                  <p className="text-sm text-slate-500">Manage employment type categories</p>
                </div>
              </div>
              {renderSystemSettingsContent('EMPLOYMENT_TYPES')}
            </Card>
          )}

          {activeSection === 'leave' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <BsFileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leave Types</h2>
                  <p className="text-sm text-slate-500">Manage leave type categories</p>
                </div>
              </div>
              {renderSystemSettingsContent('LEAVE_TYPES')}
            </Card>
          )}

          {activeSection === 'dashboard-colors' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <BsPalette className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Colors</h2>
                  <p className="text-sm text-slate-500">Customize dashboard card colors</p>
                </div>
              </div>
              <ColorPalettePicker
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
                title="Select Dashboard Card Colors"
              />
              {selectedColor && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Selected Color:</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${selectedColor.bg}`} />
                    <span className="font-medium text-slate-900 dark:text-white">{selectedColor.name}</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeSection === 'audit' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <BsClockHistory className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Audit Log</h2>
                  <p className="text-sm text-slate-500">History of all setting changes</p>
                </div>
              </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Setting Key</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Old Value</th>
                  <th className="text-left px-4 py-3 font-medium">New Value</th>
                  <th className="text-left px-4 py-3 font-medium">Changed By</th>
                  <th className="text-left px-4 py-3 font-medium">Changed At</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{log.setting_key}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.category}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{log.old_value || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{log.new_value || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {log.first_name} {log.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(log.changed_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.reason || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminSettings
