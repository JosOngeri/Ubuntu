import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import DateDropdown from '../../components/common/DateDropdown';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { downloadPdfReport } from '../../utils/reportExport';

const defaultJob = {
  title: '',
  description: '',
  department: '',
  location: '',
  employmentType: '',
  status: 'open',
  salaryRange: '',
  requirements: '',
  responsibilities: '',
  benefits: '',
  applicationDeadline: '',
  qualifications: [],
  evaluationParams: { keywords: [], criteria: [] },
  numberOfPositions: 1,
};

export default function JobPostingManagement() {
  const navigate = useNavigate();
  const { getDepartments, getEmploymentTypes, getJobStatuses } = useSettings();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultJob);
  const [applicationDeadline, setApplicationDeadline] = useState(form.applicationDeadline ? new Date(form.applicationDeadline) : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [qualInput, setQualInput] = useState('');
  const [kwInput, setKwInput] = useState('');

  const departments = getDepartments();
  const employmentTypes = getEmploymentTypes();
  const jobStatuses = getJobStatuses();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs');
      setJobs(res.data || []);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openModal = (job = null) => {
    setEditing(job);
    if (job) {
      setForm({
        ...job,
        qualifications: job.qualifications || [],
        evaluationParams: job.evaluationParams || { keywords: [], criteria: [] },
      });
    } else {
      setForm(defaultJob);
    }
    setQualInput('');
    setKwInput('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/jobs/${editing.id}`, form);
        toast.success('Job updated');
      } else {
        await api.post('/jobs', form);
        toast.success('Job created');
      }
      setShowModal(false);
      fetchJobs();
    } catch {
      toast.error('Save failed');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'applicationDeadline') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    const comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleExportJobsReport = async () => {
    await downloadPdfReport({
      fileName: 'job-postings-report.pdf',
      title: 'Job Postings Report',
      rows: filteredJobs,
      columns: [
        { label: 'Title', getValue: (row) => row.title || '' },
        { label: 'Department', getValue: (row) => row.department || '' },
        { label: 'Location', getValue: (row) => row.location || '' },
        { label: 'Type', getValue: (row) => row.employmentType || '' },
        { label: 'Status', getValue: (row) => row.status || '' },
        { label: 'Deadline', getValue: (row) => row.applicationDeadline || '' },
      ],
      metadata: [
        { label: 'Department', value: departmentFilter === 'all' ? 'All' : departmentFilter },
        { label: 'Status', value: statusFilter === 'all' ? 'All' : statusFilter },
      ],
    });
  };

  const addQualification = () => {
    if (qualInput.trim()) {
      setForm({
        ...form,
        qualifications: [...form.qualifications, { name: qualInput.trim(), type: 'required', weight: 5 }],
      });
      setQualInput('');
    }
  };

  const handleQualKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addQualification();
    }
  };

  const updateQualType = (i, value) => {
    const n = [...form.qualifications];
    n[i].type = value;
    setForm({ ...form, qualifications: n });
  };

  const updateQualWeight = (i, value) => {
    const n = [...form.qualifications];
    n[i].weight = Number(value);
    setForm({ ...form, qualifications: n });
  };

  const removeQualification = (i) => {
    const n = form.qualifications.filter((_, j) => j !== i);
    setForm({ ...form, qualifications: n });
  };

  const handleKwKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (kwInput.trim()) {
        setForm({
          ...form,
          evaluationParams: {
            ...form.evaluationParams,
            keywords: [...form.evaluationParams.keywords, kwInput.trim()],
          },
        });
        setKwInput('');
      }
    }
  };

  const removeKeyword = (i) => {
    const k = form.evaluationParams.keywords.filter((_, j) => j !== i);
    setForm({
      ...form,
      evaluationParams: {
        ...form.evaluationParams,
        keywords: k,
      },
    });
  };

  const addCriterion = () => {
    setForm({
      ...form,
      evaluationParams: {
        ...form.evaluationParams,
        criteria: [...form.evaluationParams.criteria, { name: '', label: '', weight: 5, operator: '>=', value: 0 }],
      },
    });
  };

  const updateCriterionName = (i, value) => {
    const n = [...form.evaluationParams.criteria];
    n[i].name = value;
    n[i].label = value;
    setForm({
      ...form,
      evaluationParams: {
        ...form.evaluationParams,
        criteria: n,
      },
    });
  };

  const updateCriterionLabel = (i, value) => {
    const n = [...form.evaluationParams.criteria];
    n[i].label = value;
    setForm({
      ...form,
      evaluationParams: {
        ...form.evaluationParams,
        criteria: n,
      },
    });
  };

  const updateCriterionWeight = (i, value) => {
    const n = [...form.evaluationParams.criteria];
    n[i].weight = Number(value);
    setForm({
      ...form,
      evaluationParams: {
        ...form.evaluationParams,
        criteria: n,
      },
    });
  };

  const removeCriterion = (i) => {
    const n = form.evaluationParams.criteria.filter((_, j) => j !== i);
    setForm({
      ...form,
      evaluationParams: {
        ...form.evaluationParams,
        criteria: n,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Job Postings</h2>
            <Button variant="primary" onClick={() => openModal()}>Create Job</Button>
          </div>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Input
              label="Search"
              placeholder="Search title or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[240px]"
            />
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <select className="form-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">All departments</option>
                {departments.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <Button type="button" variant="outline" onClick={handleExportJobsReport}>Export Report</Button>
          </div>
          <Table
            columns={[
              {
                key: 'title',
                label: 'Title',
                sortable: true,
                render: (_, row) => (
                  <button
                    onClick={() => navigate(`/recruitment/jobs/${row.id}`)}
                    className="text-blue-500 hover:text-blue-700 hover:underline font-medium cursor-pointer"
                  >
                    {row.title}
                  </button>
                )
              },
              { key: 'department', label: 'Department', sortable: true },
              { key: 'location', label: 'Location', sortable: true },
              { key: 'employmentType', label: 'Type', sortable: true },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (_, row) => (
                  <button
                    onClick={() => setStatusFilter(row.status === statusFilter ? 'all' : row.status)}
                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${row.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {row.status}
                  </button>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (_, row) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => navigate(`/recruitment/jobs/${row.id}`)}>View Details</Button>
                    <Button size="sm" onClick={() => openModal(row)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
                  </div>
                ),
              },
            ]}
            data={filteredJobs}
            loading={loading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </Card>
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Job' : 'Create Job'} size="3xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group md:col-span-2">
              <label>Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                <option value="">Select</option>
                {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select className="form-input" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                <option value="">Select</option>
                {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Number of Positions</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                  onClick={() => setForm({ ...form, numberOfPositions: Math.max(1, (form.numberOfPositions || 1) - 1) })}
                >
                  -
                </button>
                <input
                  type="number"
                  className="form-input w-20 text-center"
                  value={form.numberOfPositions || 1}
                  onChange={e => setForm({ ...form, numberOfPositions: Math.max(1, parseInt(e.target.value) || 1) })}
                  min="1"
                />
                <button
                  type="button"
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                  onClick={() => setForm({ ...form, numberOfPositions: (form.numberOfPositions || 1) + 1 })}
                >
                  +
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {jobStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Salary Range</label>
              <input className="form-input" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Application Deadline</label>
              <DateDropdown 
                  selectedDate={applicationDeadline}
                  onDateChange={(date) => {
                    setApplicationDeadline(date);
                    setForm({...form, applicationDeadline: date ? date.toISOString().split('T')[0] : ''});
                  }}
                  label="Application Deadline"
                  showYear={true}
                  showMonth={true}
                  showDay={true}
                  yearRange={5}
                />
            </div>
            <div className="form-group md:col-span-2">
              <label>Description</label>
              <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group md:col-span-2">
              <label>Requirements</label>
              <textarea className="form-input" value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="List requirements, separated by commas or lines" />
            </div>
            <div className="form-group md:col-span-2">
              <label>Responsibilities</label>
              <textarea className="form-input" value={form.responsibilities} onChange={e => setForm({ ...form, responsibilities: e.target.value })} placeholder="List responsibilities, separated by commas or lines" />
            </div>
            <div className="form-group md:col-span-2">
              <label>Benefits</label>
              <textarea className="form-input" value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} placeholder="List benefits, separated by commas or lines" />
            </div>
            <div className="form-group md:col-span-2 border-t pt-4">
              <label className="font-bold text-lg mb-2 block">Qualifications (for scoring)</label>
              <p className="text-xs text-slate-500 mb-3">Add qualifications that applicants must meet. These are used to auto-score applications.</p>
              <div className="flex gap-2 mb-2">
                <input className="form-input flex-1" placeholder="Qualification name" value={qualInput} onChange={e => setQualInput(e.target.value)} onKeyDown={handleQualKeyDown} />
                <Button type="button" size="sm" onClick={addQualification}>Add</Button>
              </div>
              {form.qualifications.map((q, i) => (
                <div key={i} className="flex items-center gap-3 mb-2 border border-slate-200 bg-white p-3 rounded-lg">
                  <span className="flex-1 text-sm font-medium">{q.name}</span>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs text-slate-500">Type</label>
                    <select className="form-input text-xs w-32" value={q.type} onChange={e => updateQualType(i, e.target.value)}>
                      <option value="required">Required</option>
                      <option value="preferred">Preferred</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs text-slate-500">Weight (1-10)</label>
                    <input className="form-input text-xs w-20" type="number" min="1" max="10" value={q.weight} onChange={e => updateQualWeight(i, e.target.value)} />
                  </div>
                  <button type="button" className="text-red-500 text-sm p-2 hover:bg-red-50 rounded" onClick={() => removeQualification(i)}>✕</button>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-1 italic">Weight: Higher values give this qualification more importance in the scoring algorithm (1 = low, 10 = high).</p>
            </div>
            <div className="form-group md:col-span-2 border-t pt-4">
              <label className="font-bold text-lg mb-2 block">Evaluation Parameters</label>
              <p className="text-xs text-slate-500 mb-3">Configure how applicants are auto-scored. Keywords (40%) + Criteria (60%) = Total Score.</p>
              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">Keywords</label>
                <p className="text-xs text-slate-400 mb-2">Words or phrases that indicate a good match (e.g., "React", "project management")</p>
                <div className="flex gap-2">
                  <input className="form-input flex-1" placeholder="Type keyword, press Enter" value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={handleKwKeyDown} />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.evaluationParams.keywords.map((kw, i) => (
                    <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-blue-200">
                      {kw} <button type="button" className="hover:text-blue-900" onClick={() => removeKeyword(i)}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Criteria</label>
                <p className="text-xs text-slate-400 mb-2">Rules that applicants must satisfy (e.g., minimum years of experience, having a degree)</p>
                <Button type="button" size="sm" onClick={addCriterion}>+ Add Criterion</Button>
                {form.evaluationParams.criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 mt-2 border border-slate-200 bg-white p-3 rounded-lg">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs text-slate-500">Type</label>
                      <select className="form-input text-xs w-40" value={c.name} onChange={e => updateCriterionName(i, e.target.value)}>
                        <option value="">Custom</option>
                        <option value="yearsExperience">Years Experience</option>
                        <option value="hasDegree">Has Degree</option>
                        <option value="hasCertification">Has Certification</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs text-slate-500">Label</label>
                      <input className="form-input text-xs w-40" placeholder="Display name" value={c.label} onChange={e => updateCriterionLabel(i, e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs text-slate-500">Weight (1-10)</label>
                      <input className="form-input text-xs w-20" type="number" min="1" max="10" value={c.weight} onChange={e => updateCriterionWeight(i, e.target.value)} />
                    </div>
                    <button type="button" className="text-red-500 text-sm p-2 hover:bg-red-50 rounded" onClick={() => removeCriterion(i)}>✕</button>
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-1 italic">Weight: Higher values give this criterion more importance in the scoring (1 = low, 10 = high).</p>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button type="submit" variant="primary">Save</Button>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}