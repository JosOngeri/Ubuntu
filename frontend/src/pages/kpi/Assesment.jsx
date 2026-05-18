import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI, kpiAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { BsCheckCircle, BsClock, BsPerson, BsGraphUp } from 'react-icons/bs'

export default function KPIAssessment() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeKPIs, setEmployeeKPIs] = useState([])
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)

  const selectedEmployee = employees.find(emp => String(emp.id || emp._id) === String(selectedEmployeeId))

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeKPIs(selectedEmployeeId)
    }
  }, [selectedEmployeeId])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await employeeAPI.getAll()
      const allEmployees = response.data || []
      
      // Filter based on user role and hierarchy
      let filteredEmployees = []
      if (user?.role === 'admin') {
        filteredEmployees = allEmployees.filter(emp => emp.role === 'manager')
      } else if (user?.role === 'manager') {
        filteredEmployees = allEmployees.filter(emp => emp.role === 'supervisor')
      } else if (user?.role === 'supervisor') {
        filteredEmployees = allEmployees.filter(emp => emp.role === 'employee')
      }
      
      setEmployees(filteredEmployees)
      if (filteredEmployees.length > 0) {
        setSelectedEmployeeId(String(filteredEmployees[0].id || filteredEmployees[0]._id))
      }
    } catch (error) {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeKPIs = async (employeeId) => {
    try {
      const response = await kpiAPI.getEmployeeKPIs(employeeId)
      setEmployeeKPIs(response.data || [])
    } catch (error) {
      toast.error('Failed to load employee KPIs')
    }
  }

  const updateKPIEvaluation = async (kpiId, achievedValue) => {
    try {
      setEvaluating(true)
      await kpiAPI.evaluateKPI(kpiId, { achievedValue })
      toast.success('KPI evaluation updated')
      await loadEmployeeKPIs(selectedEmployeeId)
    } catch (error) {
      toast.error('Failed to update evaluation')
    } finally {
      setEvaluating(false)
    }
  }

  const getEvaluationInfo = () => {
    if (user?.role === 'admin') {
      return "Evaluate Managers on organizational leadership and strategic planning"
    } else if (user?.role === 'manager') {
      return "Evaluate Supervisors on team leadership and resource management"
    } else if (user?.role === 'supervisor') {
      return "Evaluate Employees on task management and work quality"
    }
    return "No evaluation permissions"
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <BsCheckCircle className="text-green-500" />
      case 'Pending':
        return <BsClock className="text-yellow-500" />
      default:
        return <BsClock className="text-gray-500" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading KPI assessments...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">KPI Assessment</h1>
        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {getEvaluationInfo()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        {/* Employee Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Employee</h2>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="">Choose employee to evaluate</option>
            {employees.map(employee => (
              <option key={employee.id || employee._id} value={employee.id || employee._id}>
                {employee.firstName ? `${employee.firstName} ${employee.lastName || ''}` : employee.email || `Employee ${employee.id}`}
              </option>
            ))}
          </select>

          {selectedEmployee && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <BsPerson className="text-slate-500" size={24} />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedEmployee.firstName ? `${selectedEmployee.firstName} ${selectedEmployee.lastName || ''}` : selectedEmployee.email}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedEmployee.role} • {employeeKPIs.length} KPIs
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPI Evaluations */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Performance Evaluations</h2>
            <BsGraphUp className="text-slate-500" size={24} />
          </div>

          {employeeKPIs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                No KPIs found for this employee
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {employeeKPIs.map(kpi => (
                <div key={kpi.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {kpi.definition_title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Target: {kpi.target_value} • Period: {kpi.period}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(kpi.status)}
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {kpi.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Achieved Value
                      </label>
                      <input
                        type="number"
                        value={kpi.achieved_value || ''}
                        onChange={(e) => {
                          const updatedKPIs = employeeKPIs.map(empKPI => 
                            empKPI.id === kpi.id 
                              ? { ...empKPI, achieved_value: e.target.value }
                              : empKPI
                          )
                          setEmployeeKPIs(updatedKPIs)
                        }}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        placeholder="Enter achieved value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Score
                      </label>
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-slate-900 dark:text-white">
                          {kpi.final_score ? `${kpi.final_score}%` : 'Not calculated'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateKPIEvaluation(kpi.id, kpi.achieved_value)}
                    disabled={evaluating || !kpi.achieved_value}
                    className="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {evaluating ? 'Updating...' : 'Update Evaluation'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}