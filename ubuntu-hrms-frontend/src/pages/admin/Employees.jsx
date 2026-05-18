import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsPlus, BsTrash, BsPencil, BsSearch } from 'react-icons/bs'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { employeeAPI, userAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { toast } from 'react-toastify'
import { downloadPdfReport } from '../../utils/reportExport'
// import './Employees.css'

const Employees = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getDepartments, getEmploymentTypes, refreshSettings } = useSettings()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [changingRoleFor, setChangingRoleFor] = useState(null)
  const [newRole, setNewRole] = useState('employee')
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [departments, setDepartments] = useState([])
  const [employmentTypes, setEmploymentTypes] = useState([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mpesaPhoneNumber: '',
    employmentType: 'Permanent',
    wageRate: '',
    department: '',
  })

  const canManageEmployees = user?.role === 'admin' || user?.role === 'manager'
  const canDeleteEmployees = user?.role === 'admin'

  useEffect(() => {
    fetchEmployees()
    fetchUsers()
    setDepartments(getDepartments() || [])
    setEmploymentTypes(getEmploymentTypes() || [])
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll()
      setUsers(res.data || [])
    } catch {}
  }

  const handleRoleChange = async () => {
    if (!changingRoleFor) return
    try {
      await userAPI.assignRole(changingRoleFor.userId, newRole)
      toast.success(`Role updated to ${newRole}`)
      setChangingRoleFor(null)
      fetchUsers()
    } catch {
      toast.error('Failed to update role')
    }
  }

  const getUserForEmployee = (emp) => {
    return users.find(u =>
      u.email && emp.email && u.email.toLowerCase() === emp.email.toLowerCase()
    )
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await employeeAPI.getAll()
      setEmployees(response.data || [])
    } catch (error) {
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mpesaPhoneNumber: '',
      employmentType: 'Permanent',
      wageRate: '',
      department: '',
    })
    setEditingEmployee(null)
  }

  const openAddModal = async () => {
    await refreshSettings()
    resetForm()
    setDepartments(getDepartments() || [])
    setEmploymentTypes(getEmploymentTypes() || [])
    setShowModal(true)
  }

  const openEditModal = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      mpesaPhoneNumber: employee.mpesaPhoneNumber || '',
      employmentType: employee.employmentType || 'Permanent',
      wageRate: employee.wageRate ?? '',
      department: employee.department || '',
    })
    setShowModal(true)
  }

  const handleSaveEmployee = async (e) => {
    e.preventDefault()

    if (!canManageEmployees) {
      toast.error('You are not allowed to manage employees')
      return
    }

    try {
      if (editingEmployee) {
        await employeeAPI.update(editingEmployee._id || editingEmployee.id, formData)
        toast.success('Employee updated successfully')
      } else {
        await employeeAPI.create(formData)
        toast.success('Employee added successfully')
      }

      setShowModal(false)
      resetForm()
      fetchEmployees()
    } catch (error) {
      const errors = error?.response?.data?.errors || []
      const msg = error?.response?.data?.msg || (editingEmployee ? 'Failed to update employee' : 'Failed to add employee')

      if (errors.length > 0) {
        // Display each validation error in a user-friendly way
        errors.forEach(err => {
          toast.error(err)
        })
      } else {
        toast.error(msg)
      }
    }
  }

  const handleDelete = async (id) => {
    if (!canDeleteEmployees) {
      toast.error('Only admins can delete employees')
      return
    }

    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id)
        toast.success('Employee deleted successfully')
        fetchEmployees()
      } catch (error) {
        toast.error('Failed to delete employee')
      }
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const departmentOptions = [...new Set(employees.map((emp) => emp.department).filter(Boolean))]
  const employmentTypeOptions = [...new Set(employees.map((emp) => emp.employmentType).filter(Boolean))]

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !normalizedSearch ||
      (emp.firstName || '').toLowerCase().includes(normalizedSearch) ||
      (emp.lastName || '').toLowerCase().includes(normalizedSearch) ||
      (emp.email || '').toLowerCase().includes(normalizedSearch)

    const matchesDepartment = departmentFilter === 'all' || (emp.department || '') === departmentFilter
    const matchesEmploymentType = employmentTypeFilter === 'all' || (emp.employmentType || '') === employmentTypeFilter
    const linkedUser = getUserForEmployee(emp)
    const matchesRole = roleFilter === 'all' || (linkedUser?.role || '').toLowerCase() === roleFilter

    return matchesSearch && matchesDepartment && matchesEmploymentType && matchesRole
  })

  const handleExportEmployeesReport = async () => {
    await downloadPdfReport({
      fileName: 'employees-report.pdf',
      title: 'Employees Report',
      rows: filteredEmployees,
      columns: [
        { label: 'First Name', getValue: (row) => row.firstName || '' },
        { label: 'Last Name', getValue: (row) => row.lastName || '' },
        { label: 'Email', getValue: (row) => row.email || '' },
        { label: 'Phone', getValue: (row) => row.phone || '' },
        { label: 'Department', getValue: (row) => row.department || '' },
        { label: 'Employment Type', getValue: (row) => row.employmentType || '' },
        { label: 'Wage Rate', getValue: (row) => row.wageRate ?? '' },
        { label: 'Status', getValue: (row) => row.status || '' },
      ],
      metadata: [
        { label: 'Department Filter', value: departmentFilter === 'all' ? 'All' : departmentFilter },
        { label: 'Type Filter', value: employmentTypeFilter === 'all' ? 'All' : employmentTypeFilter },
      ],
    })
  }

  const columns = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'department', label: 'Department' },
    { key: 'employmentType', label: 'Type' },
    {
      key: 'role',
      label: 'Role',
      render: (_, row) => {
        const linkedUser = getUserForEmployee(row)
        if (!linkedUser) return <span className="text-slate-400 text-xs">No account</span>
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              linkedUser.role === 'admin' ? 'bg-red-100 text-red-700' :
              linkedUser.role === 'manager' ? 'bg-blue-100 text-blue-700' :
              linkedUser.role === 'supervisor' ? 'bg-purple-100 text-purple-700' :
              'bg-slate-100 text-slate-600'
            }`}>{linkedUser.role}</span>
            {canManageEmployees && (
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => { setChangingRoleFor({ userId: linkedUser._id || linkedUser.id, username: linkedUser.username }); setNewRole(linkedUser.role) }}
              >change</button>
            )}
          </div>
        )
      }
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => {
        const rowId = row._id || row.id

        return (
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => navigate(`/admin/employees/${rowId}`)}>View Details</Button>
            {canManageEmployees && (
              <button className="btn-icon edit" onClick={() => openEditModal(row)} title="Edit">
                <BsPencil size={16} />
              </button>
            )}
            {canDeleteEmployees && (
              <button className="btn-icon delete" onClick={() => handleDelete(rowId)} title="Delete">
                <BsTrash size={16} />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <p className="page-subtitle">Manage all employees in the system</p>
      </div>

      <Card>
        <div className="employees-header flex flex-wrap items-end gap-3 mb-4">
          <div className="search-box">
            <BsSearch size={18} />
            <Input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
            <select className="form-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="all">All departments</option>
              {departmentOptions.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employment Type</label>
            <select className="form-select" value={employmentTypeFilter} onChange={(e) => setEmploymentTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              {employmentTypeOptions.map((empType) => (
                <option key={empType} value={empType}>{empType}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All roles</option>
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button variant="secondary" onClick={handleExportEmployeesReport}>Export Report</Button>
          {canManageEmployees && (
            <Button variant="primary" onClick={openAddModal}>
              <BsPlus size={20} />
              Add Employee
            </Button>
          )}
        </div>

        <Table columns={columns} data={filteredEmployees} loading={loading} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        size="md"
      >
        <form onSubmit={handleSaveEmployee} className="employee-form">
          <div className="form-row">
            <Input
              label="First Name"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone"
            placeholder="+254123456789"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <div className="form-row">
            <Input
              label="M-Pesa Number"
              placeholder="254700000000"
              value={formData.mpesaPhoneNumber}
              onChange={(e) => setFormData({ ...formData, mpesaPhoneNumber: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="form-select"
              >
                <option value="">Select type...</option>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Wage Rate"
              type="number"
              placeholder="100"
              value={formData.wageRate}
              onChange={(e) => setFormData({ ...formData, wageRate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Select department...</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="submit" variant="primary">
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      {changingRoleFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-1">Change Role</h3>
            <p className="text-sm text-slate-500 mb-4">User: <strong>{changingRoleFor.username}</strong></p>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="form-select w-full mb-4">
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleRoleChange}>Save</Button>
              <Button variant="outline" onClick={() => setChangingRoleFor(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Employees
