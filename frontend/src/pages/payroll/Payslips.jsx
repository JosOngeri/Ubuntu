import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import api, { employeeAPI, payrollAPI } from '../../services/api'
import { toast } from 'react-toastify'

const formatMoney = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0))

export default function EmployeePayslips() {
  const [employee, setEmployee] = useState(null)
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const employeePayslips = useMemo(() => {
    const employeeId = String(employee?.id || employee?._id || '')
    return payslips.filter((payslip) => String(payslip.employee_id) === employeeId)
  }, [employee, payslips])

  const loadData = async () => {
    try {
      setLoading(true)
      const [employeeResponse, payslipsResponse] = await Promise.all([
        employeeAPI.getMe(),
        payrollAPI.getPayslips(),
      ])
      setEmployee(employeeResponse.data)
      setPayslips(payslipsResponse.data || [])
      setError('')
    } catch (loadError) {
      console.error('Failed to load payslips', loadError)
      setError(loadError.response?.data?.error || 'Failed to load payslips')
      toast.error('Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const downloadPdf = (payslip) => {
    const pdfUrl = payslip.pdf_url || `${api.defaults.baseURL}/api/payroll/payslips/${payslip.id}/pdf`
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">My Payslips</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Review historical payslips and download the PDF copy for each pay period.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : employeePayslips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">No payslips found for {[employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || 'your profile'}.</p>
        </div>
      ) : (
        <>
          {employeePayslips[0] && employeePayslips[0].status === 'Failed' && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
              <h3 className="font-bold text-base mb-1">⚠️ Payment Failed</h3>
              <p>Your recent M-Pesa disbursement failed ({employeePayslips[0].payment_error || 'Network Error'}). Please contact HR to verify your registered M-Pesa number.</p>
            </div>
          )}

          {employeePayslips[0] && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Current Period ({employeePayslips[0].period})</div>
                  <div className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">{formatMoney(employeePayslips[0].net_pay)}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${
                  employeePayslips[0].status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                  employeePayslips[0].status === 'Failed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' :
                  employeePayslips[0].status === 'Processing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                  'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {employeePayslips[0].status === 'Processing' ? '⏳ Processing' : employeePayslips[0].status}
                </span>
              </div>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-blue-200/50 dark:border-slate-700/50 pt-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Base Pay</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatMoney(employeePayslips[0].gross_pay)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Overtime & KPI Bonus</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatMoney(Number(employeePayslips[0].overtime_pay) + Number(employeePayslips[0].kpi_bonus))}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Deductions</div>
                  <div className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-400">{formatMoney(employeePayslips[0].deductions)}</div>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Past Payslips</h3>
          <div className="grid gap-4">
            {employeePayslips.slice(1).map((payslip) => (
            <article key={payslip.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Period {payslip.period}</div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{formatMoney(payslip.net_pay)}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Gross: {formatMoney(payslip.gross_pay)} · Deductions: {formatMoney(payslip.deductions)} · Method: {payslip.payment_method}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${String(payslip.status).toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>
                    {payslip.status}
                  </span>
                  <button
                    onClick={() => downloadPdf(payslip)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </article>
          ))}
          {employeePayslips.length === 1 && (
            <div className="p-4 text-center text-sm text-slate-500">No historical payslips yet.</div>
          )}
        </div>
        </>
      )}
    </DashboardLayout>
  )
}
