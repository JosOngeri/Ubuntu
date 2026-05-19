import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import DateDropdown from '../../components/common/DateDropdown';
import api, { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const formatMoney = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0))

export default function Payroll() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ employeeId: '', period: new Date().toISOString().slice(0, 7) });
  const [viewPayslip, setViewPayslip] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    employeeType: state?.filterType || '',
    status: state?.filterStatus || '',
    period: '',
    search: ''
  });
  const [selectedPeriodDate, setSelectedPeriodDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'period', direction: 'desc' });

  const applyFiltersAndSort = (payslips) => {
    let filtered = [...payslips];
    
    // Apply filters
    if (filters.employeeType) {
      filtered = filtered.filter(payslip => {
        const employee = employees.find(emp => emp.id === payslip.employee_id);
        if (!employee) return false;
        
        switch (filters.employeeType) {
          case 'daily_worker':
            return employee.employment_type === 'Daily Worker';
          case 'monthly_employee':
            return employee.employment_type === 'Monthly';
          case 'contractor':
            return employee.employment_type === 'Contractor';
          default:
            return true;
        }
      });
    }
    
    if (filters.status) {
      filtered = filtered.filter(payslip => payslip.status === filters.status);
    }
    
    if (filters.period) {
      filtered = filtered.filter(payslip => payslip.period === filters.period);
    }
    
    if (filters.search) {
      filtered = filtered.filter(payslip => {
        const employee = employees.find(emp => emp.id === payslip.employee_id);
        const employeeName = employee ? `${employee.first_name} ${employee.last_name}`.toLowerCase() : '';
        return employeeName.includes(filters.search.toLowerCase()) ||
               payslip.period.toLowerCase().includes(filters.search.toLowerCase());
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'employee') {
          const empA = employees.find(emp => emp.id === a.employee_id);
          const empB = employees.find(emp => emp.id === b.employee_id);
          aValue = empA ? `${empA.first_name} ${empA.last_name}` : '';
          bValue = empB ? `${empB.first_name} ${empB.last_name}` : '';
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredPayslips(filtered);
  };

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
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payslips.length > 0 && employees.length > 0) {
      applyFiltersAndSort(payslips);
    }
  }, [payslips, employees, filters, sortConfig]);

  const handlePeriodDateChange = (date) => {
    setSelectedPeriodDate(date);
    const periodString = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : '';
    setFilters({...filters, period: periodString});
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

  const handleBatchGenerate = async () => {
    const period = new Date().toISOString().slice(0, 7);
    if (!confirm(`Generate draft payslips for all monthly employees for period ${period}?`)) return;
    try {
      setGenerating(true);
      const res = await api.post('/api/payroll/batch-generate', { period });
      toast.success(`Generated ${res.data.generated} draft payslips, skipped ${res.data.skipped}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Batch generation failed');
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

  const handleSort = (field) => {
    setSortConfig(prev => ({
      key: field,
      direction: prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      sortable: true,
      render: (_, row) => {
        const empId = row.employee_id || row.id;
        const empName = `${row.first_name} ${row.last_name}`;
        return (
          <button
            onClick={() => navigate(`/admin/employees/${empId}`)}
            className="text-blue-500 hover:text-blue-700 hover:underline font-medium cursor-pointer"
          >
            {empName}
          </button>
        );
      }
    },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'gross_pay', label: 'Gross Pay', sortable: true, render: (val) => formatMoney(val) },
    { key: 'net_pay', label: 'Net Pay', sortable: true, render: (val) => formatMoney(val) },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <button
          onClick={() => setFilters({...filters, status: status === filters.status ? '' : status})}
          className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${status === 'Draft' ? 'bg-slate-200 text-slate-800' : status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
        >
          {status}
        </button>
      )
    },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-2 items-center">
        <Button size="sm" variant="outline" onClick={() => setViewPayslip(row)}>View</Button>
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
              <select className="form-select w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required>
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
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleBatchGenerate} loading={generating}>Batch Generate</Button>
              <Button variant="outline" onClick={() => navigate('/payroll/disburse')}>Proceed to Disbursement →</Button>
            </div>
          </div>
          
          {/* Filter Headers */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.employeeType}
                  onChange={(e) => setFilters({...filters, employeeType: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="daily_worker">Daily Workers</option>
                  <option value="monthly_employee">Monthly Employees</option>
                  <option value="contractor">Contractors</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              
              <DateDropdown 
                selectedDate={selectedPeriodDate}
                onDateChange={handlePeriodDateChange}
                label="Period"
                showYear={true}
                showMonth={true}
                showDay={false}
                yearRange={10}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input 
                  type="text"
                  placeholder="Search employee..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <Table columns={columns} data={filteredPayslips} loading={loading} sortField={sortConfig.key} sortDirection={sortConfig.direction} onSort={handleSort} />
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
