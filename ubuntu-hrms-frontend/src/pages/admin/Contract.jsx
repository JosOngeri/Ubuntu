import React, { useEffect, useState, useMemo } from 'react';
import { getContracts, createContract, updateContract, deleteContract } from '../../services/contract';
import { employeeAPI } from '../../services/api';
import Card from '../../components/common/Card';
import DashboardLayout from '../../components/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';
import { downloadPdfReport } from '../../utils/reportExport';

export default function Contract() {
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts', 'analytics'
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({ employee: '', title: '', startDate: '', endDate: '', terms: '', status: 'active', document: null });

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractRes, empRes] = await Promise.allSettled([
        getContracts(),
        employeeAPI.getAll()
      ]);
      
      if (contractRes.status === 'fulfilled') setContracts(contractRes.value.data || []);
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.data || []);
    } catch (err) {
      console.error('Failed to load contract data:', err);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async e => {
    e.preventDefault();
    try {

      if (editing) {
        await updateContract(editing, form);
        toast.success('Contract updated successfully');
      } else {
        await createContract(form);
        toast.success('Contract created successfully');
      }
      setForm({ employee: '', title: '', startDate: '', endDate: '', terms: '', status: 'active', document: null });
      setEditing(null);
      setShowFormModal(false);
      
      const res = await getContracts();
      setContracts(res.data || []);
    } catch (err) {
      toast.error('Failed to save contract');
    }
  };

  const handleEdit = contract => { 
    setForm({
      employee: contract.employee || contract.employee_id || '',
      title: contract.title || '',
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
      terms: contract.terms || '',
      status: contract.status || 'active',
      document: null
    }); 
    setEditing(contract._id || contract.id); 
    setShowFormModal(true);
  };

  const handleDelete = async id => { 
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    try {
      await deleteContract(id); 
      toast.success('Contract deleted');
      const res = await getContracts();
      setContracts(res.data || []);
    } catch (err) {
      toast.error('Failed to delete contract');
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => String(e.id) === String(empId) || String(e._id) === String(empId));
    return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : empId;
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const empName = String(getEmployeeName(contract.employee || contract.employee_id)).toLowerCase();
      const contractTitle = String(contract.title || '').toLowerCase();
      const search = searchQuery.toLowerCase();
      
      const matchesSearch = !search || empName.includes(search) || contractTitle.includes(search);
      const matchesStatus = statusFilter === 'all' || (contract.status || 'active') === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchQuery, statusFilter, employees]);

  const stats = useMemo(() => {
    return {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      terminated: contracts.filter(c => c.status === 'terminated').length,
      expired: contracts.filter(c => c.status === 'expired').length,
    };
  }, [contracts]);

  // Analytics Calculations & Chart Data
  const activePct = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;
  const expiredPct = stats.total > 0 ? (stats.expired / stats.total) * 100 : 0;
  const terminatedPct = stats.total > 0 ? (stats.terminated / stats.total) * 100 : 0;

  const pieGradient = `conic-gradient(
    #22c55e 0% ${activePct}%,
    #eab308 ${activePct}% ${activePct + expiredPct}%,
    #ef4444 ${activePct + expiredPct}% 100%
  )`;

  const contractsByDept = useMemo(() => {
    const deptCounts = {};
    contracts.forEach(c => {
      const emp = employees.find(e => String(e.id) === String(c.employee || c.employee_id) || String(e._id) === String(c.employee || c.employee_id));
      const dept = emp?.department || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    return Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5
  }, [contracts, employees]);

  const maxDeptCount = Math.max(...contractsByDept.map(d => d[1]), 1);

  const handleExportReport = async () => {
    await downloadPdfReport({
      fileName: 'contracts-report.pdf',
      title: 'Company Contracts Report',
      rows: filteredContracts,
      columns: [
        { label: 'Employee', getValue: (row) => getEmployeeName(row.employee || row.employee_id) },
        { label: 'Title', getValue: (row) => row.title },
        { label: 'Start Date', getValue: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '' },
        { label: 'End Date', getValue: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A' },
        { label: 'Status', getValue: (row) => row.status?.toUpperCase() || 'ACTIVE' }
      ],
      metadata: [
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
        { label: 'Total Records', value: String(filteredContracts.length) }
      ],
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'terminated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const columns = [
    { key: 'employee', label: 'Employee', render: (_, row) => getEmployeeName(row.employee || row.employee_id) },
    { key: 'title', label: 'Contract Title' },
    { key: 'startDate', label: 'Start Date', render: (_, row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : 'N/A' },
    { key: 'endDate', label: 'End Date', render: (_, row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A' },
    { key: 'status', label: 'Status', render: (_, row) => (
       <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(row.status)}`}>
          {row.status || 'active'}
       </span>
    )},
    { key: 'actions', label: 'Actions', render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setSelectedContract(row); setShowViewModal(true); }}>View</Button>
          <Button size="sm" variant="primary" onClick={() => handleEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id || row.id)}>Delete</Button>
        </div>
    )}
  ];

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Contract Management</h1>
        <p className="page-subtitle">Track employee contracts, view terms, and generate compliance reports.</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'contracts' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('contracts')}
        >
          All Contracts
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics & Reports
        </button>
      </div>

      {activeTab === 'contracts' && (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Search Employee or Title"
                placeholder="Name or Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-[240px]"
              />
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleExportReport}>Export Report</Button>
              <Button variant="primary" onClick={() => { setForm({employee:'', title:'', startDate:'', endDate:'', terms:'', status:'active', document: null}); setEditing(null); setShowFormModal(true); }}>
                + Add Contract
              </Button>
            </div>
          </div>
          <Table columns={columns} data={filteredContracts} loading={loading} />
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Contracts</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.total}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Active</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">{stats.active}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Expired</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">{stats.expired}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Terminated</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-2">{stats.terminated}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 w-full text-left">Status Distribution</h3>
              {stats.total === 0 ? (
                <div className="text-slate-500 py-12">No data available</div>
              ) : (
                <>
                  <div className="w-48 h-48 rounded-full shadow-inner mb-6" style={{ background: pieGradient }} />
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span></div>
                      <span className="text-sm font-bold">{activePct.toFixed(1)}% ({stats.active})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Expired</span></div>
                      <span className="text-sm font-bold">{expiredPct.toFixed(1)}% ({stats.expired})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Terminated</span></div>
                      <span className="text-sm font-bold">{terminatedPct.toFixed(1)}% ({stats.terminated})</span>
                    </div>
                  </div>
                </>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Top Departments</h3>
              <div className="space-y-6">
                {contractsByDept.length === 0 ? (
                   <p className="text-slate-500 py-4">No department data available.</p>
                ) : (
                  contractsByDept.map(([dept, count]) => (
                    <div key={dept} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={dept}>{dept}</div>
                      <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(count / maxDeptCount) * 100}%` }} />
                      </div>
                      <div className="w-12 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{count}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing Contract */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editing ? "Edit Contract" : "Create Contract"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee</label>
              <select name="employee" className="form-select" value={form.employee} onChange={handleChange} required>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Contract Title" name="title" value={form.title} onChange={handleChange} required />
            <Input label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
            <Input label="End Date" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Terms & Conditions</label>
            <textarea name="terms" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" value={form.terms} onChange={handleChange} rows={5} placeholder="Specify the terms of the contract..." />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contract Document (Optional)</label>
            <input type="file" name="document" accept=".pdf,.doc,.docx" onChange={(e) => setForm({ ...form, document: e.target.files[0] })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm" />
            <p className="text-xs text-slate-500 mt-1">Attach a signed copy of the contract (PDF, DOC, DOCX).</p>
          </div>
          <div className="flex gap-2 justify-end mt-4">
             <Button type="submit" variant="primary">{editing ? 'Update Contract' : 'Create Contract'}</Button>
             <Button type="button" variant="ghost" onClick={() => setShowFormModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Viewing a Contract */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Contract Details" size="md">
        {selectedContract && (
          <div className="space-y-4">
            <div><strong className="text-slate-600 dark:text-slate-400">Employee:</strong> <span className="block mt-1 text-lg">{getEmployeeName(selectedContract.employee || selectedContract.employee_id)}</span></div>
            <div><strong className="text-slate-600 dark:text-slate-400">Title:</strong> <span className="block mt-1">{selectedContract.title}</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong className="text-slate-600 dark:text-slate-400">Start Date:</strong> <span className="block mt-1">{selectedContract.startDate ? new Date(selectedContract.startDate).toLocaleDateString() : 'N/A'}</span></div>
              <div><strong className="text-slate-600 dark:text-slate-400">End Date:</strong> <span className="block mt-1">{selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString() : 'N/A'}</span></div>
            </div>
            <div><strong className="text-slate-600 dark:text-slate-400">Status:</strong> <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(selectedContract.status)}`}>{selectedContract.status || 'active'}</span></div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <strong className="text-slate-600 dark:text-slate-400">Terms & Conditions:</strong>
              <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg whitespace-pre-wrap text-sm">{selectedContract.terms || 'No terms specified.'}</div>
            </div>
            {selectedContract.documentPath && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <strong className="text-slate-600 dark:text-slate-400">Attached Document:</strong>
                <a href={`${import.meta.env.VITE_API_URL || 'https://ubuntu-hrms-epmc.onrender.com'}${selectedContract.documentPath.startsWith('/') ? '' : '/'}${selectedContract.documentPath}`} target="_blank" rel="noopener noreferrer" className="block mt-2 text-sm text-primary hover:underline">
                  📄 View Contract Document
                </a>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
