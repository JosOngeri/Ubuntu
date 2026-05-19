import React, { useEffect, useState, useMemo } from 'react'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import Table from '../../components/common/Table'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorInvoices = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('invoice_number')
  const [sortDirection, setSortDirection] = useState('asc')

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'amount') {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else if (sortField === 'due_date') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sortField, sortDirection]);

  const pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
  const approvedCount = invoices.filter(inv => inv.status === 'Approved').length
  const draftCount = invoices.filter(inv => inv.status === 'Draft').length

  const columns = [
    { key: 'invoice_number', label: 'Invoice', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (val) => `KES ${Number(val || 0).toLocaleString()}` },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'due_date', label: 'Due Date', sortable: true, render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
  ];

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

      <div className="mt-8">
        <Table columns={columns} data={sortedInvoices} loading={loading} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
      </div>
    </DashboardLayout>
  )
}

export default ContractorInvoices
