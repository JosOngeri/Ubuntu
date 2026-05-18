import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'

const STORAGE_KEY = 'ubuntu-contractor-milestones'

const readMilestones = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const saveMilestones = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function ContractReview() {
  const [backendInvoices, setBackendInvoices] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [invoicesResponse] = await Promise.all([
        contractorAPI.getInvoices(),
      ])
      setBackendInvoices(invoicesResponse.data || [])
      setMilestones(readMilestones())
    } catch (loadError) {
      console.error('Failed to load contract review data', loadError)
      toast.error('Failed to load contractor submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const approveForPayment = (milestoneId) => {
    const next = readMilestones().map((milestone) => {
      if (milestone.id !== milestoneId) return milestone
      return { ...milestone, status: 'Approved for Payment', reviewedAt: new Date().toISOString() }
    })
    saveMilestones(next)
    setMilestones(next)
    setSelectedMilestone(next.find((milestone) => milestone.id === milestoneId) || null)
    toast.success('Milestone approved for payment')
  }

  const approveInvoice = (id) => {
    const next = backendInvoices.map((inv) => {
      if (inv.id !== id) return inv;
      return { ...inv, status: 'Approved' };
    });
    setBackendInvoices(next);
    toast.success('Invoice approved for payment');
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Contract Review</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Review contractor submissions, inspect proof files, and approve items for payment.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Submitted Milestones</h2>
            </div>
            <div className="space-y-4 p-6">
            {milestones.length === 0 && backendInvoices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No milestones or invoices have been submitted yet.
                </div>
              ) : (
              <>
                {backendInvoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-white">Invoice #{invoice.id}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Due: {invoice.due ? new Date(invoice.due).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${['approved', 'paid'].includes(String(invoice.status).toLowerCase()) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">KES {Number(invoice.amount).toLocaleString()}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelectedMilestone({ type: 'invoice', ...invoice })}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                      >
                        View Invoice
                      </button>
                      {!['approved', 'paid'].includes(String(invoice.status).toLowerCase()) && (
                        <button
                          onClick={() => approveInvoice(invoice.id)}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                        >
                          Approve for Payment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-white">{milestone.projectName}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{milestone.createdAt ? new Date(milestone.createdAt).toLocaleString() : 'Recent submission'}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${String(milestone.status).toLowerCase().includes('approved') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{milestone.description}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Proof file: {milestone.proofName}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelectedMilestone(milestone)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                      >
                        View Invoice
                      </button>
                      <button
                        onClick={() => approveForPayment(milestone.id)}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                      >
                        Approve for Payment
                      </button>
                    </div>
                  </div>
                ))
                }
              </>
            )}
            </div>
          </section>

          <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Selected Invoice</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Preview the file or invoice information before payment approval.
              </p>
            </div>

          {selectedMilestone && selectedMilestone.type === 'invoice' ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice ID</div>
                <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{selectedMilestone.id}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</div>
                <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">KES {Number(selectedMilestone.amount).toLocaleString()}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Due Date</div>
                <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{selectedMilestone.due ? new Date(selectedMilestone.due).toLocaleDateString() : 'N/A'}</div>
              </div>
              <button
                onClick={() => approveInvoice(selectedMilestone.id)}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Approve for Payment
              </button>
            </div>
          ) : selectedMilestone ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Project</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{selectedMilestone.projectName}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</div>
                  <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{selectedMilestone.description}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Proof file</div>
                  <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{selectedMilestone.proofName}</div>
                </div>
                <button
                  onClick={() => approveForPayment(selectedMilestone.id)}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Approve for Payment
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Click a milestone to preview the invoice details.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
              <div className="text-sm font-semibold">Invoices </div>
              <div className="mt-1 text-sm text-slate-300 dark:text-slate-700">{backendInvoices.length} invoice record(s) loaded.</div>
            </div>
          </aside>
        </div>
      )}
    </DashboardLayout>
  )
}
