import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI, kpiAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const currentQuarter = () => {
  const month = new Date().getMonth()
  return `Q${Math.floor(month / 3) + 1}`
}

export default function KpiManage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingGoal, setSavingGoal] = useState(false)
  const [savingScore, setSavingScore] = useState(false)
  const [error, setError] = useState('')
  const [activeKpi, setActiveKpi] = useState(null)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', targetValue: '', maxScore: '100', period: currentQuarter() })
  const [scoreForm, setScoreForm] = useState({ achievedValue: '' })

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id || employee._id) === String(selectedEmployeeId)),
    [employees, selectedEmployeeId],
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await employeeAPI.getAll()
      const employeeList = response.data || []
      setEmployees(employeeList)
      if (employeeList.length > 0) {
        const firstEmployeeId = String(employeeList[0].id || employeeList[0]._id)
        setSelectedEmployeeId((currentValue) => currentValue || firstEmployeeId)
      }
      setError('')
    } catch (loadError) {
      console.error('Failed to load KPI manage data', loadError)
      setError(loadError.response?.data?.error || 'Failed to load employees')
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeKpis = async (employeeId) => {
    if (!employeeId) return
    try {
      const response = await kpiAPI.getEmployeeKPIs(employeeId)
      setKpis(response.data || [])
    } catch (loadError) {
      console.error('Failed to load employee KPIs', loadError)
      toast.error('Failed to load KPI assignments')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeKpis(selectedEmployeeId)
    }
  }, [selectedEmployeeId])

  const handleGoalChange = (event) => {
    const { name, value } = event.target
    setGoalForm((current) => ({ ...current, [name]: value }))
  }

  const handleScoreChange = (event) => {
    const { name, value } = event.target
    setScoreForm((current) => ({ ...current, [name]: value }))
  }

  const assignGoal = async (event) => {
    event.preventDefault()
    if (!selectedEmployeeId) {
      toast.error('Select a team member first')
      return
    }

    try {
      setSavingGoal(true)
      await kpiAPI.assignKPI({
        employeeId: selectedEmployeeId,
        evaluatorId: user?.id,
        period: `${new Date().getFullYear()}-${goalForm.period}`,
        targetValue: goalForm.targetValue,
        title: goalForm.title,
        description: goalForm.description,
        maxScore: goalForm.maxScore,
      })
      toast.success('KPI goal assigned')
      setGoalForm({ title: '', description: '', targetValue: '', maxScore: '100', period: currentQuarter() })
      await loadEmployeeKpis(selectedEmployeeId)
    } catch (assignError) {
      const message = assignError.response?.data?.error || assignError.message || 'Failed to assign KPI'
      toast.error(message)
    } finally {
      setSavingGoal(false)
    }
  }

  const openScoreModal = (kpi) => {
    setActiveKpi(kpi)
    setScoreForm({ achievedValue: kpi.achieved_value ?? '' })
  }

  const evaluateGoal = async (event) => {
    event.preventDefault()
    if (!activeKpi) return

    try {
      setSavingScore(true)
      await kpiAPI.evaluateKPI(activeKpi.id, { achievedValue: scoreForm.achievedValue })
      toast.success('KPI score updated')
      setActiveKpi(null)
      setScoreForm({ achievedValue: '' })
      await loadEmployeeKpis(selectedEmployeeId)
    } catch (evaluateError) {
      const message = evaluateError.response?.data?.error || evaluateError.message || 'Failed to update score'
      toast.error(message)
    } finally {
      setSavingScore(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">KPI Management</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Select a team member, assign quarterly goals, and record achieved metrics at the end of the cycle.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Assign Goal</h2>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Team member</span>
              <select
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id || employee._id} value={employee.id || employee._id}>
                    {[employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email || employee.id}
                  </option>
                ))}
              </select>
            </label>

            <form onSubmit={assignGoal} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Title</span>
                  <input
                    name="title"
                    value={goalForm.title}
                    onChange={handleGoalChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Improve guest response time"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Target metric</span>
                  <input
                    name="targetValue"
                    value={goalForm.targetValue}
                    onChange={handleGoalChange}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="100"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Quarter</span>
                  <select
                    name="period"
                    value={goalForm.period}
                    onChange={handleGoalChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                      <option key={quarter} value={quarter}>{quarter}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Max score</span>
                  <input
                    name="maxScore"
                    value={goalForm.maxScore}
                    onChange={handleGoalChange}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
                <textarea
                  name="description"
                  value={goalForm.description}
                  onChange={handleGoalChange}
                  rows="4"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Add context for the target metric"
                />
              </label>

              <button
                type="submit"
                disabled={savingGoal}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950"
              >
                {savingGoal ? 'Saving...' : 'Assign Goal'}
              </button>
            </form>
          </section>

          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Current Goals</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedEmployee ? `Showing goals for ${[selectedEmployee.firstName, selectedEmployee.lastName].filter(Boolean).join(' ')}` : 'Select a team member'}
                </p>
              </div>
              <button
                onClick={() => selectedEmployeeId && loadEmployeeKpis(selectedEmployeeId)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {kpis.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No KPI assignments found for this employee.
                </div>
              ) : (
                kpis.map((kpi) => {
                  const progress = Math.max(0, Math.min(Number(kpi.final_score || 0), 100))
                  return (
                    <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-950 dark:text-white">{kpi.definition_title}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.period} · Target {kpi.target_value}</div>
                        </div>
                        <button
                          onClick={() => openScoreModal(kpi)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                        >
                          Add Achieved Metric
                        </button>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Score: {progress}%</span>
                        <span>Status: {kpi.status || 'Pending'}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>
      )}

      {activeKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Record Achieved Metric</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activeKpi.definition_title}</p>
              </div>
              <button onClick={() => setActiveKpi(null)} className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                Close
              </button>
            </div>

            <form onSubmit={evaluateGoal} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Achieved metric</span>
                <input
                  name="achievedValue"
                  value={scoreForm.achievedValue}
                  onChange={handleScoreChange}
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveKpi(null)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  {savingScore ? 'Saving...' : 'Save Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
