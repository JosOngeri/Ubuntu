import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import api, { payrollAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import { downloadPdfReport } from '../../utils/reportExport'

const formatMoney = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0))

export default function PayrollDisburse() {
  const [activeTab, setActiveTab] = useState('disbursements')
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [viewPayslip, setViewPayslip] = useState(null)
  const [disbursingId, setDisbursingId] = useState(null)

  const activePayslips = useMemo(() => {
    return payslips.filter((payslip) => ['approved', 'processing', 'paid', 'failed'].includes(String(payslip.status).toLowerCase()))
  }, [payslips])

  const readyToDisburseCount = activePayslips.filter(p => String(p.status).toLowerCase() === 'approved').length;

  const stats = useMemo(() => {
    return {
      total: activePayslips.length,
      paid: activePayslips.filter(c => String(c.status).toLowerCase() === 'paid').length,
      failed: activePayslips.filter(c => String(c.status).toLowerCase() === 'failed').length,
      processing: activePayslips.filter(c => String(c.status).toLowerCase() === 'processing').length,
      approved: activePayslips.filter(c => String(c.status).toLowerCase() === 'approved').length,
    };
  }, [activePayslips]);

  const paidPct = stats.total > 0 ? (stats.paid / stats.total) * 100 : 0;
  const failedPct = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
  const processingPct = stats.total > 0 ? (stats.processing / stats.total) * 100 : 0;
  const approvedPct = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

  const pieGradient = `conic-gradient(
    #22c55e 0% ${paidPct}%,
    #ef4444 ${paidPct}% ${paidPct + failedPct}%,
    #f59e0b ${paidPct + failedPct}% ${paidPct + failedPct + processingPct}%,
    #3b82f6 ${paidPct + failedPct + processingPct}% 100%
  )`;

  const handleExportReport = async () => {
    await downloadPdfReport({
      fileName: 'disbursement-report.pdf',
      title: 'Payroll Disbursement Report',
      rows: activePayslips,
      columns: [
        { label: 'Employee', getValue: (row) => [row.first_name, row.last_name].filter(Boolean).join(' ') || `Emp ${row.employee_id}` },
        { label: 'Period', getValue: (row) => row.period },
        { label: 'Method', getValue: (row) => row.payment_method },
        { label: 'Net Pay', getValue: (row) => row.net_pay },
        { label: 'Status', getValue: (row) => row.status },
        { label: 'Reference', getValue: (row) => row.mpesa_transaction_id || row.payment_reference || 'N/A' },
      ],
      metadata: [
        { label: 'Total Payslips', value: String(activePayslips.length) },
      ],
    });
  };

  const totalsByPeriod = useMemo(() => {
    return activePayslips.reduce((accumulator, payslip) => {
      const period = payslip.period || 'Unknown'
      if (!accumulator[period]) {
        accumulator[period] = { count: 0, netPay: 0 }
      }
      accumulator[period].count += 1
      accumulator[period].netPay += Number(payslip.net_pay || 0)
      return accumulator
    }, {})
  }, [activePayslips])

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await payrollAPI.getPayslips()
      setPayslips(response.data || [])
      if (!silent) setError('')
    } catch (loadError) {
      console.error('Failed to load payroll data', loadError)
      if (!silent) {
        setError(loadError.response?.data?.error || 'Failed to load payroll data')
        toast.error('Failed to load payroll data')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Silent Polling for M-Pesa Callbacks
  useEffect(() => {
    let interval;
    const hasProcessing = payslips.some(p => String(p.status).toLowerCase() === 'processing');
    
    if (hasProcessing) {
      interval = setInterval(() => {
        loadData(true); // Silently poll every 5 seconds
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [payslips]);

  const initiateDisbursement = async () => {
    try {
      setSubmitting(true)
      const response = await payrollAPI.disburse()
      setSummary(response.data?.summary || null)
      toast.success(response.data?.message || 'Payroll disbursement started')
      await loadData()
    } catch (disburseError) {
      const message = disburseError.response?.data?.error || disburseError.message || 'Failed to start disbursement'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const initiateSingleDisbursement = async (id) => {
    try {
      setDisbursingId(id)
      const response = await api.post('/api/payroll/disburse', { payslipId: id })
      toast.success(response.data?.message || 'Payment initiated for employee')
      await loadData()
    } catch (disburseError) {
      const message = disburseError.response?.data?.error || disburseError.message || 'Failed to initiate payment'
      toast.error(message)
    } finally {
      setDisbursingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Payroll Disbursement</h1>
        <p className="page-subtitle">Review approved payslips, trigger payouts, and view reports.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'disbursements' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('disbursements')}
        >
          Disbursements
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics & Reports
        </button>
      </div>

      {activeTab === 'disbursements' && (
      <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
          >
            Export Report
          </button>
        </div>
        <button
          onClick={initiateDisbursement}
          disabled={submitting || readyToDisburseCount === 0}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
        >
          {submitting ? 'Initiating Disbursement...' : `Disburse ${readyToDisburseCount} Approved Payslip(s)`}
        </button>
      </div>

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['Total', summary.total],
            ['Paid', summary.paid],
            ['Processing', summary.processing],
            ['Failed', summary.failed],
            ['M-Pesa / Bank', `${summary.mpesa || 0} / ${summary.bank || 0}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Approved Payslips</h2>
          </div>

          {loading && activePayslips.length === 0 ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : activePayslips.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No active payslip records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Net Pay</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activePayslips.map((payslip) => {
                    const statusLower = String(payslip.status).toLowerCase();
                    const statusColor = 
                      statusLower === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                      statusLower === 'failed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' :
                      statusLower === 'processing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                      
                    return (
                      <tr key={payslip.id}>
                        <td className="px-4 py-4 text-slate-950 dark:text-white">
                          {[payslip.first_name, payslip.last_name].filter(Boolean).join(' ') || `Employee ${payslip.employee_id}`}
                        </td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{payslip.period}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{payslip.payment_method}</td>
                        <td className="px-4 py-4 font-semibold text-slate-950 dark:text-white">{formatMoney(payslip.net_pay)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                            {payslip.status === 'Processing' ? '⏳ Processing' : payslip.status}
                          </span>
                        </td>
                          <td className="px-4 py-4 flex gap-2">
                            <button
                              onClick={() => setViewPayslip(payslip)}
                              className="text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg transition dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            >
                              View
                            </button>
                            {(statusLower === 'approved' || statusLower === 'failed') && (
                              <button
                                onClick={() => initiateSingleDisbursement(payslip.id)}
                                disabled={disbursingId === payslip.id || submitting}
                                className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                              >
                                {disbursingId === payslip.id ? '...' : (statusLower === 'failed' ? 'Retry Pay' : 'Pay Now')}
                              </button>
                            )}
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Monthly Payroll Summary</h3>
            <div className="mt-4 space-y-3">
              {Object.keys(totalsByPeriod).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Approved payroll totals will appear here.
                </div>
              ) : (
                Object.entries(totalsByPeriod).map(([period, metrics]) => (
                  <div key={period} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">{period}</div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{metrics.count} payslip(s)</div>
                    <div className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{formatMoney(metrics.netPay)}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm dark:bg-white dark:text-slate-950">
            <h3 className="text-lg font-semibold">Disbursement Status</h3>
            <p className="mt-2 text-sm text-slate-300 dark:text-slate-700">
              M-Pesa disbursements move to Processing first and are finalized by the callback webhook.
            </p>
            <p className="mt-2 text-sm text-slate-300 dark:text-slate-700">
              Bank transfers are marked Paid immediately after the mock EFT batch is generated.
            </p>
          </section>
        </aside>
      </div>
      </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Payslips</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Approved</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">{stats.approved}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Paid</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">{stats.paid}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Failed</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-2">{stats.failed}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 w-full text-left">Status Distribution</h3>
              {stats.total === 0 ? (
                <div className="text-slate-500 py-12">No data available</div>
              ) : (
                <>
                  <div className="w-48 h-48 rounded-full shadow-inner mb-6" style={{ background: pieGradient }} />
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Paid</span></div>
                      <span className="text-sm font-bold">{paidPct.toFixed(1)}% ({stats.paid})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Failed</span></div>
                      <span className="text-sm font-bold">{failedPct.toFixed(1)}% ({stats.failed})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing</span></div>
                      <span className="text-sm font-bold">{processingPct.toFixed(1)}% ({stats.processing})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Approved</span></div>
                      <span className="text-sm font-bold">{approvedPct.toFixed(1)}% ({stats.approved})</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Totals by Period</h3>
              <div className="space-y-6">
                {Object.keys(totalsByPeriod).length === 0 ? (
                   <p className="text-slate-500 py-4">No period data available.</p>
                ) : (
                  Object.entries(totalsByPeriod).map(([period, metrics]) => (
                    <div key={period} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{period}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatMoney(metrics.netPay)}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{metrics.count} payslips</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={!!viewPayslip} onClose={() => setViewPayslip(null)} title="M-Pesa / Bank Details">
        {viewPayslip && (
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Employee:</span>
              <span>{viewPayslip.first_name} {viewPayslip.last_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Method:</span>
              <span className="font-mono">{viewPayslip.payment_method}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Transaction ID / Ref:</span>
              <span className="font-mono text-sm">{viewPayslip.mpesa_transaction_id || viewPayslip.payment_reference || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Payment Error:</span>
              <span className="text-rose-500 text-sm">{viewPayslip.payment_error || 'None'}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold text-emerald-700 dark:text-emerald-500">
              <span>Net Payout:</span>
              <span>{formatMoney(viewPayslip.net_pay)}</span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
