import React, { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorInvoices = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await contractorAPI.getInvoices()
        setInvoices(response.data)
      } catch (error) {
        console.error('Failed to fetch contractor invoices', error)
        toast.error('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
  const approvedCount = invoices.filter(inv => inv.status === 'Approved').length
  const draftCount = invoices.filter(inv => inv.status === 'Draft').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <p className="page-subtitle">Review and manage your contractor invoice submissions.</p>
      </div>

      <div className="grid-3 gap-6">
        <Card>
          <div className="invoice-summary">
            <h3 className="text-lg font-bold">Pending Amount</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">KES {pendingAmount.toLocaleString()}</p>
          </div>
        </Card>

        <Card>
          <div className="invoice-summary">
            <h3 className="text-lg font-bold">Approved Invoices</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{approvedCount}</p>
          </div>
        </Card>

        <Card>
          <div className="invoice-summary">
            <h3 className="text-lg font-bold">Drafts</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{draftCount}</p>
          </div>
        </Card>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{invoice.id}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">KES {Number(invoice.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{invoice.status}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{invoice.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

export default ContractorInvoices
