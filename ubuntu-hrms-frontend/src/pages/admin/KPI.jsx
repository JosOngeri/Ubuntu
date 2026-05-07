import React, { useEffect, useState, useMemo } from 'react';
import { getKPIs, createKPI, updateKPI, deleteKPI } from '../../services/kpi';
import api, { employeeAPI } from '../../services/api';
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import { toast } from 'react-toastify'
import { downloadPdfReport } from '../../utils/reportExport'

export default function KPI() {
  const [kpis, setKpis] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'definitions', 'reports'
  const [kpiDefs, setKpiDefs] = useState([]);
  const [employeeKpis, setEmployeeKpis] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Definitions Form State
  const [showDefModal, setShowDefModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', target: '' });
  const [editing, setEditing] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Safely fetch data across existing endpoints
      const [defsRes, empRes, globalRes] = await Promise.allSettled([
        getKPIs(),
        employeeAPI.getAll(),
        api.get('/api/kpis').catch(() => ({ data: [] })) // Fallback if global endpoint doesn't exist yet
      ]);

      if (defsRes.status === 'fulfilled') setKpiDefs(defsRes.value.data || []);
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.data || []);
      if (globalRes.status === 'fulfilled') setEmployeeKpis(globalRes.value.data || []);
      
    } catch (error) {
      console.error('Failed to load KPI data:', error);
      toast.error('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // Transform the form state to match what the backend expects
      const apiPayload = {
        title: form.name,
        description: form.description,
        maxScore: Number(form.target)
      };

      if (editing) {
        await updateKPI(editing, apiPayload);
        toast.success('KPI definition updated');
      } else {
        await createKPI(apiPayload);
        toast.success('KPI definition created');
      }
      
      // Reset form
      setForm({ name: '', description: '', target: '' });
      setEditing(null);
      setShowDefModal(false);
      
      // Refresh data
      const res = await getKPIs();
      setKpiDefs(res.data || []);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to save KPI definition');
    }
  };

  const handleEdit = kpi => { 
    setForm({
      name: kpi.title || kpi.name || '',
      description: kpi.description || '',
      target: kpi.maxScore || kpi.max_score || kpi.target || ''
    }); 
    setEditing(kpi._id || kpi.id); 
    setShowDefModal(true);
  };

  const handleDelete = async id => { 
    if (!window.confirm('Are you sure you want to delete this KPI definition?')) return;
    try {
      await deleteKPI(id); 
      toast.success('KPI deleted');
      const res = await getKPIs();
      setKpiDefs(res.data || []);
    } catch (err) {
      toast.error('Failed to delete KPI');
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => String(e.id) === String(empId) || String(e._id) === String(empId));
    return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : empId;
  };

  const filteredEmployeeKpis = useMemo(() => {
    return employeeKpis.filter(kpi => {
      const empName = String(getEmployeeName(kpi.employee_id)).toLowerCase();
      const kpiTitle = String(kpi.definition_title || kpi.title || '').toLowerCase();
      const search = searchQuery.toLowerCase();
      
      const matchesSearch = !search || empName.includes(search) || kpiTitle.includes(search);
      const matchesStatus = statusFilter === 'all' || (kpi.status || 'Pending') === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [employeeKpis, searchQuery, statusFilter, employees]);

  const handleExportGlobalReport = async () => {
    await downloadPdfReport({
      fileName: 'company-kpi-report.pdf',
      title: 'Company Global KPI Performance Report',
      rows: filteredEmployeeKpis,
      columns: [
        { label: 'Employee', getValue: (row) => getEmployeeName(row.employee_id) },
        { label: 'KPI Title', getValue: (row) => row.definition_title || row.title || 'N/A' },
        { label: 'Period', getValue: (row) => row.period || '' },
        { label: 'Target', getValue: (row) => String(row.target_value || '') },
        { label: 'Achieved', getValue: (row) => String(row.achieved_value || '0') },
        { label: 'Score (%)', getValue: (row) => String(row.final_score || '0') },
        { label: 'Status', getValue: (row) => row.status || 'Pending' }
      ],
      metadata: [
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
        { label: 'Total Records', value: String(filteredEmployeeKpis.length) }
      ],
    });
  };

  const defColumns = [
    { key: 'name', label: 'KPI Name / Title', render: (_, row) => row.name || row.title },
    { key: 'description', label: 'Description' },
    { key: 'target', label: 'Target Metric', render: (_, row) => row.target || row.maxScore || row.max_score },
    { key: 'actions', label: 'Actions', render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id || row.id)}>Delete</Button>
        </div>
    )}
  ];

  const globalKpiColumns = [
    { key: 'employee', label: 'Employee', render: (_, row) => getEmployeeName(row.employee_id) },
    { key: 'title', label: 'Goal Title', render: (_, row) => row.definition_title || row.title || 'N/A' },
    { key: 'period', label: 'Quarter', render: (_, row) => row.period },
    { key: 'target_value', label: 'Target', render: (_, row) => row.target_value },
    { key: 'achieved_value', label: 'Achieved', render: (_, row) => row.achieved_value ?? '-' },
    { key: 'score', label: 'Score', render: (_, row) => {
        const score = Number(row.final_score ?? 0);
        return (
           <div className="flex items-center gap-2 min-w-[100px]">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div className={`h-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
              </div>
              <span className="text-xs font-semibold">{score}%</span>
           </div>
        );
    }},
    { key: 'status', label: 'Status', render: (_, row) => (
       <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'}`}>
          {row.status || 'Pending'}
       </span>
    )}
  ];

  // Analytics Calculations
  const evaluatedKpis = employeeKpis.filter(k => k.final_score !== null && k.final_score !== undefined);
  const avgScore = evaluatedKpis.length > 0 
    ? Math.round(evaluatedKpis.reduce((sum, k) => sum + Number(k.final_score), 0) / evaluatedKpis.length) 
    : 0;
  const completedCount = employeeKpis.filter(k => k.status === 'Completed').length;

  const scoreDistribution = {
    excellent: evaluatedKpis.filter(k => Number(k.final_score) >= 85).length,
    average: evaluatedKpis.filter(k => Number(k.final_score) >= 50 && Number(k.final_score) < 85).length,
    poor: evaluatedKpis.filter(k => Number(k.final_score) < 50).length,
  };
  const maxDist = Math.max(...Object.values(scoreDistribution), 1);

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Global KPIs & Performance</h1>
        <p className="page-subtitle">Track company-wide goals, manage KPI definitions, and view performance reports.</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('all')}
        >
          Global Assigned KPIs
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'definitions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('definitions')}
        >
          KPI Definitions Library
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'reports' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          onClick={() => setActiveTab('reports')}
        >
          Analytics & Reports
        </button>
      </div>

      {activeTab === 'all' && (
        <Card>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Input
              label="Search Employee or Goal"
              placeholder="Name or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-[240px]"
            />
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Evaluated">Evaluated</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <Button type="button" variant="secondary" onClick={handleExportGlobalReport}>
              Export Report
            </Button>
          </div>
          {employeeKpis.length === 0 && !loading ? (
            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
              No global KPI tracking endpoints active. Assignments are currently visible inside the Manager view.
            </div>
          ) : (
            <Table columns={globalKpiColumns} data={filteredEmployeeKpis} loading={loading} />
          )}
        </Card>
      )}

      {activeTab === 'definitions' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">KPI Library</h2>
            <Button variant="primary" onClick={() => { setForm({name:'', description:'', target:''}); setEditing(null); setShowDefModal(true); }}>
              + Create New Definition
            </Button>
          </div>
          <Table columns={defColumns} data={kpiDefs} loading={loading} />
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Goals Assigned</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{employeeKpis.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">{completedCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Average Global Score</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">{avgScore}%</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Score Distribution</h3>
            <div className="space-y-6">
              {[
                { label: 'Excellent (85%+)', count: scoreDistribution.excellent, color: 'bg-green-500' },
                { label: 'Average (50-84%)', count: scoreDistribution.average, color: 'bg-yellow-500' },
                { label: 'Needs Improvement (<50%)', count: scoreDistribution.poor, color: 'bg-red-500' },
              ].map((tier, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium text-slate-700 dark:text-slate-300">{tier.label}</div>
                  <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${tier.color}`} style={{ width: `${(tier.count / maxDist) * 100}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{tier.count}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal isOpen={showDefModal} onClose={() => setShowDefModal(false)} title={editing ? "Edit KPI Definition" : "Create KPI Definition"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="KPI Name / Title" name="name" value={form.name} onChange={handleChange} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea name="description" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" value={form.description} onChange={handleChange} rows={3} required />
          </div>
          <Input label="Target Metric" name="target" type="number" value={form.target} onChange={handleChange} required />
          <div className="flex gap-2 justify-end mt-4">
             <Button type="submit" variant="primary">{editing ? 'Update' : 'Create'}</Button>
             <Button type="button" variant="ghost" onClick={() => setShowDefModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}