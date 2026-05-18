import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI, kpiAPI } from '../../services/api'

export default function MyGoals() {
  const [employee, setEmployee] = useState(null)
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const totalScores = useMemo(() => {
    return kpis.reduce((accumulator, kpi) => {
      accumulator.completed += kpi.final_score ? 1 : 0
      accumulator.items += 1
      accumulator.average += Number(kpi.final_score || 0)
      return accumulator
    }, { completed: 0, items: 0, average: 0 })
  }, [kpis])

  const loadData = async () => {
    try {
      setLoading(true)
      const employeeResponse = await employeeAPI.getMe()
      const currentEmployee = employeeResponse.data
      setEmployee(currentEmployee)
      const kpiResponse = await kpiAPI.getEmployeeKPIs(currentEmployee.id || currentEmployee._id)
      setKpis(kpiResponse.data || [])
      setError('')
    } catch (loadError) {
      console.error('Failed to load my KPI goals', loadError)
      setError(loadError.response?.data?.error || 'Failed to load KPI dashboard')
      toast.error('Failed to load KPI dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">My KPI Goals</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Read-only dashboard showing your current targets, progress, and past score history.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.75fr,1.25fr]">
          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Employee</div>
              <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {[employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || employee?.email || 'Employee'}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active goals</div>
              <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{kpis.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed</div>
              <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{totalScores.completed}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Average score</div>
              <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {totalScores.items ? Math.round(totalScores.average / totalScores.items) : 0}%
              </div>
            </div>
          </aside>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Current Targets</h2>
            {kpis.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No KPI targets have been assigned yet.
              </div>
            ) : (
              kpis.map((kpi) => {
                const progress = Math.max(0, Math.min(Number(kpi.final_score || 0), 100))
                return (
                  <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-950 dark:text-white">{kpi.definition_title}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{kpi.definition_description || 'No description supplied'}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                        {kpi.period}
                      </span>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Target {kpi.target_value}</span>
                      <span>Score {progress}%</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                      <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Achieved</div>
                        <div className="mt-1 font-semibold text-slate-950 dark:text-white">{kpi.achieved_value ?? 'Pending'}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Final score</div>
                        <div className="mt-1 font-semibold text-slate-950 dark:text-white">{kpi.final_score ?? 'N/A'}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Bonus status</div>
                        <div className="mt-1 font-semibold text-slate-950 dark:text-white">{kpi.bonus_status || 'None'}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
