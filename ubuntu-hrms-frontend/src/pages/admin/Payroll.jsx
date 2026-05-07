import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import api, { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const formatMoney = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0))

export default function Payroll() {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ employeeId: '', period: new Date().toISOString().slice(0, 7) });
  const [viewPayslip, setViewPayslip] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, payRes] = await Promise.all([
        employeeAPI.getAll(),
        api.get('/api/payroll')
      ]);
      setEmployees(empRes.data || []);
      setPayslips(payRes.data || []);
    } catch (err) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.period) return toast.error('Employee and Period are required');
    try {
      setGenerating(true);
      await api.post('/api/payroll/calculate', form);
      toast.success('Draft payslip generated successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate payslip');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/payroll/approve/${id}`);
      toast.success('Payslip approved for disbursement');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve payslip');
    }
  };

  const columns = [
    { key: 'employee', label: 'Employee', render: (_, row) => `${row.first_name} ${row.last_name}` },
    { key: 'period', label: 'Period' },
    { key: 'gross_pay', label: 'Gross Pay', render: (val) => formatMoney(val) },
    { key: 'net_pay', label: 'Net Pay', render: (val) => formatMoney(val) },
    { key: 'status', label: 'Status', render: (status) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'Draft' ? 'bg-slate-200 text-slate-800' : status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{status}</span>
    )},
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-2 items-center">
        <Button size="sm" variant="secondary" onClick={() => setViewPayslip(row)}>View</Button>
        {row.status === 'Draft' ? (
          <Button size="sm" variant="success" onClick={() => handleApprove(row.id)}>Approve</Button>
        ) : (
          <span className="text-sm text-slate-500 px-2">Locked</span>
        )}
      </div>
    )}
  ];

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Payroll Generation & Approvals</h1>
        <p className="page-subtitle">Calculate monthly wages from attendance/KPIs and approve them for disbursement.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-1 h-fit">
          <h2 className="text-lg font-bold mb-4">Calculate New Payslip</h2>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee</label>
              <select className="form-select w-full" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            <Input label="Period (YYYY-MM)" type="month" value={form.period} onChange={e => setForm({...form, period: e.target.value})} required />
            <Button type="submit" variant="primary" className="w-full" loading={generating}>Generate Draft</Button>
          </form>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
            <strong>How this works:</strong> The system will automatically fetch the employee's base rate, sum up their attendance hours for the selected month, apply any pending KPI bonuses, and deduct unpaid leaves.
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold">Drafts & History</h2>
              <p className="text-sm text-slate-500">Review calculated drafts before approving.</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/payroll/disburse')}>Proceed to Disbursement →</Button>
          </div>
          <Table columns={columns} data={payslips} loading={loading} />
        </Card>
      </div>

      <Modal isOpen={!!viewPayslip} onClose={() => setViewPayslip(null)} title="Payslip Breakdown">
        {viewPayslip && (
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Employee:</span>
              <span>{viewPayslip.first_name} {viewPayslip.last_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Period:</span>
              <span>{viewPayslip.period}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Gross Pay:</span>
              <span>{formatMoney(viewPayslip.gross_pay)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Overtime Pay:</span>
              <span>{formatMoney(viewPayslip.overtime_pay)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">KPI Bonus:</span>
              <span>{formatMoney(viewPayslip.kpi_bonus)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 text-rose-600 dark:text-rose-400">
              <span className="font-semibold">Deductions (Unpaid Leave):</span>
              <span>- {formatMoney(viewPayslip.deductions)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold text-emerald-700 dark:text-emerald-500">
              <span>Net Payout:</span>
              <span>{formatMoney(viewPayslip.net_pay)}</span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
