import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import api, { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';

const KPIAssessment = () => {
  const [kpis, setKpis] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Evaluation Form State
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [evalForm, setEvalForm] = useState({ achievedValue: '', comments: '' });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [kpiRes, empRes] = await Promise.all([
        api.get('/api/kpis'),
        employeeAPI.getAll()
      ]);
      setKpis(kpiRes.data || []);
      setEmployees(empRes.data || []);
    } catch (error) {
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getEmployeeName = (empId) => {
    if (!empId) return 'Unknown';
    const emp = employees.find(e => String(e.id) === String(empId) || String(e._id) === String(empId));
    return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || emp.email : empId;
  };

  const pendingKpis = useMemo(() => {
    // Show only KPIs that are pending or require updates (hide completed ones)
    return kpis.filter(k => k.status !== 'Completed');
  }, [kpis]);

  const handleEvaluateClick = (kpi) => {
    setSelectedKpi(kpi);
    setEvalForm({
      achievedValue: kpi.achieved_value || kpi.achievedValue || '',
      comments: kpi.evaluator_comments || kpi.comments || ''
    });
    setShowEvalModal(true);
  };

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    try {
      const kpiId = selectedKpi._id || selectedKpi.id;
      // Submits the evaluation using standard PUT pattern
      await api.put(`/api/kpis/${kpiId}/evaluate`, {
        achievedValue: Number(evalForm.achievedValue),
        comments: evalForm.comments
      });
      
      toast.success('KPI evaluated successfully');
      setShowEvalModal(false);
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.msg || 'Failed to evaluate KPI');
    }
  };

  const columns = [
    { key: 'employee', label: 'Employee', render: (_, row) => getEmployeeName(row.employee_id || row.employeeId || row.user_id) },
    { key: 'title', label: 'KPI Title', render: (_, row) => row.definition_title || row.title || 'N/A' },
    { key: 'period', label: 'Period', render: (_, row) => row.period },
    { key: 'target', label: 'Target', render: (_, row) => row.target_value || row.targetValue },
    { key: 'status', label: 'Status', render: (_, row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'}`}>
        {row.status || 'Pending'}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <Button size="sm" variant="primary" onClick={() => handleEvaluateClick(row)}>
        Evaluate
      </Button>
    )}
  ];

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">KPI Assessments</h1>
        <p className="page-subtitle">Evaluate employee performance against assigned targets and provide feedback.</p>
      </div>

      <Card>
        <Table columns={columns} data={pendingKpis} loading={loading} />
      </Card>

      <Modal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} title="Evaluate Employee KPI">
        {selectedKpi && (
          <form onSubmit={handleEvalSubmit} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4 text-sm text-slate-700 dark:text-slate-300">
              <p className="mb-1"><strong>Employee:</strong> {getEmployeeName(selectedKpi.employee_id || selectedKpi.employeeId || selectedKpi.user_id)}</p>
              <p className="mb-1"><strong>Goal:</strong> {selectedKpi.definition_title || selectedKpi.title}</p>
              <p><strong>Target Value:</strong> {selectedKpi.target_value || selectedKpi.targetValue}</p>
            </div>
            <Input label="Achieved Value" type="number" value={evalForm.achievedValue} onChange={(e) => setEvalForm({...evalForm, achievedValue: e.target.value})} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Comments / Feedback</label>
              <textarea className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} value={evalForm.comments} onChange={(e) => setEvalForm({...evalForm, comments: e.target.value})} placeholder="Provide constructive feedback on performance..." required />
            </div>
            <div className="flex gap-2 justify-end mt-4">
               <Button type="submit" variant="primary">Submit Evaluation</Button>
               <Button type="button" variant="ghost" onClick={() => setShowEvalModal(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default KPIAssessment;