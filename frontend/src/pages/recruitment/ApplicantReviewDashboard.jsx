import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  Card  from '../../components/common/Card';
import  Table  from '../../components/common/Table';
import  Button  from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { downloadPdfReport } from '../../utils/reportExport';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://75.119.139.249';
const toCvUrl = (cvPath) => {
  if (!cvPath) return null;
  const normalized = String(cvPath).replace(/\\/g, '/');
  return `${API_BASE_URL}/${normalized.replace(/^\/+/, '')}`;
};

const normalizeApplication = (raw = {}) => ({
  ...raw,
  id: raw.id,
  applicantName: raw.applicantName ?? raw.applicantname ?? raw.fullName ?? raw.fullname ?? '',
  applicantEmail: raw.applicantEmail ?? raw.applicantemail ?? raw.email ?? '',
  applicantPhone: raw.applicantPhone ?? raw.applicantphone ?? raw.phone ?? '',
  cvPath: raw.cvPath ?? raw.cvpath ?? null,
  coverLetter: raw.coverLetter ?? raw.coverletter ?? '',
  status: raw.status ?? 'pending',
  applicationData: raw.applicationData ?? raw.applicationdata ?? null,
  appliedAt: raw.appliedAt ?? raw.appliedat ?? raw.createdAt ?? raw.createdat ?? null,
  autoScore: raw.autoScore ?? null,
});


export default function ApplicantReviewDashboard({ jobId }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [recruiterAnnouncement, setRecruiterAnnouncement] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoring, setScoring] = useState(false)
  const [scores, setScores] = useState(null)
  const [scoreModal, setScoreModal] = useState(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [interviewScore, setInterviewScore] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])
  const [showDetailedView, setShowDetailedView] = useState(false)

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}/applications`);
      setApplications(Array.isArray(res.data) ? res.data.map(normalizeApplication) : []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const openModal = (app) => {
    setSelected(app);
    setStatus(app.status);
    setRecruiterAnnouncement(app.recruiterAnnouncement || '');
    setShowModal(true);
  };

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/jobs/applications/${selected.id}/status`, { status, recruiterAnnouncement });
      toast.success('Status updated');
      setShowModal(false);
      fetchApplications();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleScoreApplicants = async () => {
    setScoring(true)
    try {
      const res = await api.post(`/jobs/${jobId}/score-applicants`)
      setScores(res.data || [])
      toast.success('Scoring complete')
    } catch { toast.error('Scoring failed') }
    finally { setScoring(false) }
  }

  const handleShortlist = async (appId) => {
    try {
      await api.post(`/jobs/applications/${appId}/shortlist`)
      toast.success('Application shortlisted')
      fetchApplications()
    } catch {
      toast.error('Failed to shortlist application')
    }
  }

  const handleInterviewScore = async () => {
    try {
      await api.put(`/jobs/applications/${selected.id}/interview-score`, {
        score: interviewScore,
        notes: interviewNotes
      })
      toast.success('Interview score updated')
      setShowInterviewModal(false)
      setInterviewScore('')
      setInterviewNotes('')
      fetchApplications()
    } catch {
      toast.error('Failed to update interview score')
    }
  }

  const handleSendOffer = async () => {
    try {
      await api.post(`/jobs/applications/${selected.id}/send-offer`, {
        offerAmount
      })
      toast.success('Offer sent successfully')
      setShowOfferModal(false)
      setOfferAmount('')
      fetchApplications()
    } catch {
      toast.error('Failed to send offer')
    }
  }

  const openOfferModal = (app) => {
    setSelected(app)
    setOfferAmount(app.expectedSalary || '')
    setShowOfferModal(true)
  }

  const openInterviewModal = (app) => {
    setSelected(app)
    setInterviewScore(app.interviewScore || '')
    setInterviewNotes(app.interviewNotes || '')
    setShowInterviewModal(true)
  }

  const handleApplyFilters = async () => {
    if (activeFilters.length === 0) {
      fetchApplications()
      return
    }
    try {
      const res = await api.post(`/jobs/${jobId}/filter-applicants`, { filters: activeFilters })
      setApplications(Array.isArray(res.data) ? res.data.map(normalizeApplication) : [])
      toast.success('Filters applied')
    } catch {
      toast.error('Failed to apply filters')
    }
  }

  const toggleFilter = (field, operator, value, label) => {
    const exists = activeFilters.find(f => f.field === field && f.value === value)
    if (exists) {
      setActiveFilters(activeFilters.filter(f => !(f.field === field && f.value === value)))
    } else {
      setActiveFilters([...activeFilters, { field, operator, value, label }])
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredApplications = applications.filter((row) => {
    const matchesSearch =
      !normalizedSearch ||
      (row.applicantName || '').toLowerCase().includes(normalizedSearch) ||
      (row.applicantEmail || '').toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === 'all' || (row.status || '').toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportApplicationsReport = async () => {
    await downloadPdfReport({
      fileName: 'job-applications-report.pdf',
      title: 'Job Applications Report',
      rows: filteredApplications,
      columns: [
        { label: 'Name', getValue: (row) => row.applicantName || '' },
        { label: 'Email', getValue: (row) => row.applicantEmail || '' },
        { label: 'Phone', getValue: (row) => row.applicantPhone || '' },
        { label: 'Status', getValue: (row) => row.status || '' },
        { label: 'CV', getValue: (row) => (row.cvPath ? 'Submitted' : 'N/A') },
      ],
      metadata: [
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
      ],
    });
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto py-8">
      <Card>
        <h2 className="text-2xl font-bold mb-4">Job Applications</h2>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Input
            label="Search"
            placeholder="Search name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[240px]"
          />
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleExportApplicationsReport}>Export Report</Button>
          <Button type="button" variant="primary" onClick={handleScoreApplicants} disabled={scoring}>
            {scoring ? 'Scoring...' : 'Score Applicants'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowFilterPanel(!showFilterPanel)}>
            {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowDetailedView(!showDetailedView)}>
            {showDetailedView ? 'Simple View' : 'Detailed View'}
          </Button>
        </div>

        {showDetailedView && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Name</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Email</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Phone</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Gender</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">DOB</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Nationality</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">City</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Relocate</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Travel</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Expected Salary</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Qualification</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Years Exp</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Certs</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Status</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Progress</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-2">{row.applicantName}</td>
                    <td className="px-4 py-2">{row.applicantEmail}</td>
                    <td className="px-4 py-2">{row.applicantPhone}</td>
                    <td className="px-4 py-2">{row.personalInfo?.gender || '-'}</td>
                    <td className="px-4 py-2">{row.personalInfo?.dateOfBirth || '-'}</td>
                    <td className="px-4 py-2">{row.personalInfo?.nationality || '-'}</td>
                    <td className="px-4 py-2">{row.addressInfo?.residentialAddress?.city || '-'}</td>
                    <td className="px-4 py-2">{row.positionDetails?.willingToRelocate ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{row.positionDetails?.willingToTravel ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{row.positionDetails?.expectedSalary || '-'}</td>
                    <td className="px-4 py-2">{row.education?.furtherEducation?.[0]?.qualification || '-'}</td>
                    <td className="px-4 py-2">
                      {row.employmentHistory?.reduce((sum, work) => {
                        if (work.startDate && work.endDate) {
                          return sum + (new Date(work.endDate).getFullYear() - new Date(work.startDate).getFullYear());
                        }
                        return sum;
                      }, 0) || 0}
                    </td>
                    <td className="px-4 py-2">{row.education?.certifications?.length > 0 ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{row.status}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Applied" />
                        <div className={`w-2 h-2 rounded-full ${row.status === 'shortlisted' || row.status === 'offer_sent' || row.status === 'offer_accepted' || row.status === 'hired' ? 'bg-green-500' : 'bg-slate-300'}`} title="Shortlisted" />
                        <div className={`w-2 h-2 rounded-full ${row.interviewStatus === 'completed' ? 'bg-green-500' : 'bg-slate-300'}`} title="Interviewed" />
                        <div className={`w-2 h-2 rounded-full ${row.status === 'offer_sent' || row.status === 'offer_accepted' || row.status === 'hired' ? 'bg-green-500' : 'bg-slate-300'}`} title="Offer Sent" />
                        <div className={`w-2 h-2 rounded-full ${row.status === 'hired' ? 'bg-green-500' : 'bg-slate-300'}`} title="Hired" />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="xs" variant="primary" onClick={() => navigate(`/recruitment/jobs/${jobId}/applicants/${row.id}`)}>View</Button>
                        {row.status === 'pending' && <Button size="xs" variant="success" onClick={() => handleShortlist(row.id)}>Shortlist</Button>}
                        {row.status === 'shortlisted' && <Button size="xs" variant="outline" onClick={() => openInterviewModal(row)}>Score</Button>}
                        {row.status === 'shortlisted' && <Button size="xs" variant="primary" onClick={() => openOfferModal(row)}>Offer</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!showDetailedView && (
          <>
            {showFilterPanel && (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold mb-3">Filter Applicants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Personal Info</h5>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'gender' && f.value === 'Male')}
                          onChange={() => toggleFilter('gender', 'equals', 'Male', 'Gender: Male')}
                        />
                        Gender: Male
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'gender' && f.value === 'Female')}
                          onChange={() => toggleFilter('gender', 'equals', 'Female', 'Gender: Female')}
                        />
                        Gender: Female
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'age' && f.operator === 'gte' && f.value === 18)}
                          onChange={() => toggleFilter('age', 'gte', 18, 'Age: 18+')}
                        />
                        Age: 18+
                      </label>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Position Details</h5>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'willingToRelocate' && f.value === true)}
                          onChange={() => toggleFilter('willingToRelocate', 'equals', true, 'Willing to Relocate')}
                        />
                        Willing to Relocate
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'willingToTravel' && f.value === true)}
                          onChange={() => toggleFilter('willingToTravel', 'equals', true, 'Willing to Travel')}
                        />
                        Willing to Travel
                      </label>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Education</h5>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'qualification' && f.value === "Bachelor's")}
                          onChange={() => toggleFilter('qualification', 'equals', "Bachelor's", "Bachelor's Degree")}
                        />
                        Bachelor's Degree
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'qualification' && f.value === "Master's")}
                          onChange={() => toggleFilter('qualification', 'equals', "Master's", "Master's Degree")}
                        />
                        Master's Degree
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'hasCertifications')}
                          onChange={() => toggleFilter('hasCertifications', 'equals', true, 'Has Certifications')}
                        />
                        Has Certifications
                      </label>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Experience</h5>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'yearsExperience' && f.operator === 'gte' && f.value === 1)}
                          onChange={() => toggleFilter('yearsExperience', 'gte', 1, '1+ Years Experience')}
                        />
                        1+ Years Experience
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'yearsExperience' && f.operator === 'gte' && f.value === 3)}
                          onChange={() => toggleFilter('yearsExperience', 'gte', 3, '3+ Years Experience')}
                        />
                        3+ Years Experience
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.some(f => f.field === 'yearsExperience' && f.operator === 'gte' && f.value === 5)}
                          onChange={() => toggleFilter('yearsExperience', 'gte', 5, '5+ Years Experience')}
                        />
                        5+ Years Experience
                      </label>
                    </div>
                  </div>
                </div>

                {activeFilters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-sm font-medium">Active Filters:</span>
                      {activeFilters.map((f, i) => (
                        <span key={i} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                          {f.label}
                          <button
                            onClick={() => toggleFilter(f.field, f.operator, f.value, f.label)}
                            className="hover:text-blue-900 dark:hover:text-blue-100"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button type="button" variant="primary" onClick={handleApplyFilters}>Apply Filters</Button>
                  <Button type="button" variant="outline" onClick={() => { setActiveFilters([]); fetchApplications(); }}>Clear Filters</Button>
                </div>
              </div>
            )}
            <Table
          columns={[
            {
              key: 'applicantName',
              label: 'Name',
              render: (_, row) => (
                <button
                  onClick={() => navigate(`/recruitment/jobs/${jobId}/applicants/${row.id}`)}
                  className="text-blue-500 hover:text-blue-700 hover:underline font-medium cursor-pointer"
                >
                  {row.applicantName}
                </button>
              )
            },
            { key: 'applicantEmail', label: 'Email' },
            { key: 'applicantPhone', label: 'Phone' },
            {
              key: 'status',
              label: 'Status',
              render: (_, row) => {
                const statusColor = {
                  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
                  shortlisted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
                  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
                  hired: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                };
                return (
                  <button
                    onClick={() => setStatusFilter(row.status === statusFilter ? 'all' : row.status)}
                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusColor[row.status] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {row.status}
                  </button>
                );
              }
            },
            {
              key: 'cvPath',
              label: 'CV',
              render: (cvPath) => cvPath ? <a href={toCvUrl(cvPath)} target="_blank" rel="noopener noreferrer">Download</a> : '-',
            },
            {
              key: 'autoScore',
              label: 'Score',
              render: (val, row) => {
                const s = row.autoScore != null ? row.autoScore : (scores?.find(sc => sc.applicationId === row.id)?.autoScore)
                if (s == null) return <span className="text-xs text-slate-400">—</span>
                const color = s >= 70 ? 'text-green-600' : s >= 40 ? 'text-yellow-600' : 'text-red-600'
                return <span className={`font-bold cursor-pointer ${color}`} onClick={() => {
                  const detail = scores?.find(sc => sc.applicationId === row.id)
                  if (detail) setScoreModal(detail)
                }}>{s}%</span>
              },
            },
            {
              key: 'interviewScore',
              label: 'Interview Score',
              render: (val, row) => {
                const s = row.interviewScore
                if (s == null) return <span className="text-xs text-slate-400">—</span>
                return <span className="font-bold">{s}%</span>
              },
            },
            {
              key: 'milestone',
              label: 'Progress',
              render: (_, row) => {
                const steps = [
                  { key: 'applied', label: 'Applied', completed: true },
                  { key: 'shortlisted', label: 'Shortlisted', completed: row.status === 'shortlisted' || row.status === 'offer_sent' || row.status === 'offer_accepted' || row.status === 'hired' },
                  { key: 'interviewed', label: 'Interviewed', completed: row.interviewStatus === 'completed' },
                  { key: 'offer_sent', label: 'Offer Sent', completed: row.status === 'offer_sent' || row.status === 'offer_accepted' || row.status === 'hired' },
                  { key: 'hired', label: 'Hired', completed: row.status === 'hired' },
                ];
                return (
                  <div className="flex items-center gap-1">
                    {steps.map((step, i) => (
                      <React.Fragment key={step.key}>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            step.completed ? 'bg-green-500' : 'bg-slate-300'
                          }`}
                          title={step.label}
                        />
                        {i < steps.length - 1 && (
                          <div
                            className={`w-4 h-0.5 ${
                              step.completed && steps[i + 1].completed ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              },
            },
            {
              key: 'actions',
              label: '',
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => navigate(`/recruitment/jobs/${jobId}/applicants/${row.id}`)}>View Details</Button>
                  <Button size="sm" onClick={() => openModal(row)}>Review</Button>
                  {row.status === 'pending' && <Button size="sm" variant="success" onClick={() => handleShortlist(row.id)}>Shortlist</Button>}
                  {row.status === 'shortlisted' && <Button size="sm" variant="outline" onClick={() => openInterviewModal(row)}>Interview Score</Button>}
                  {row.status === 'shortlisted' && <Button size="sm" variant="primary" onClick={() => openOfferModal(row)}>Send Offer</Button>}
                </div>
              ),
            },
          ]}
          data={filteredApplications}
          loading={loading}
        />
          </>
        )}
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Review Application">
        {selected && (
          <div className="space-y-4">
            <div><strong>Name:</strong> {selected.applicantName}</div>
            <div><strong>Email:</strong> {selected.applicantEmail}</div>
            <div><strong>Phone:</strong> {selected.applicantPhone}</div>
            <div><strong>CV:</strong> {selected.cvPath ? <a href={toCvUrl(selected.cvPath)} target="_blank" rel="noopener noreferrer">Download CV</a> : '-'}</div>
            <div><strong>Cover Letter:</strong> {selected.coverLetter || '-'}</div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
            <div className="form-group">
              <label>Recruiter Announcement</label>
              <textarea className="form-input" rows={4} value={recruiterAnnouncement} onChange={(e) => setRecruiterAnnouncement(e.target.value)} placeholder="Add an update, interview note, or next-step instruction" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" onClick={handleStatusUpdate}>Update</Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={!!scoreModal} onClose={() => setScoreModal(null)} title="Score Breakdown">
        {scoreModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{scoreModal.applicantName}</span>
              <span className={`text-2xl font-bold ${scoreModal.autoScore >= 70 ? 'text-green-600' : scoreModal.autoScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{scoreModal.autoScore}%</span>
            </div>
            <div className="border-t pt-3">
              <h4 className="font-bold mb-2">Keyword Matches ({scoreModal.keywordScore}%)</h4>
              {scoreModal.keywordMatches?.length > 0 ? scoreModal.keywordMatches.map((m, i) => (
                <div key={i} className="flex justify-between text-sm py-1"><span>{m.keyword}</span><span className="text-slate-500">{m.matches} matches</span></div>
              )) : <p className="text-sm text-slate-400">No keyword matches found.</p>}
            </div>
            <div className="border-t pt-3">
              <h4 className="font-bold mb-2">Criteria Results ({scoreModal.criteriaScore}%)</h4>
              {scoreModal.criteriaResults?.length > 0 ? scoreModal.criteriaResults.map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{c.label}</span>
                  <span className={c.met ? 'text-green-600' : 'text-red-500'}>{c.met ? '✓ Met' : '✗ Not Met'}{c.detail ? ` (${c.detail})` : ''}</span>
                </div>
              )) : <p className="text-sm text-slate-400">No criteria evaluated.</p>}
            </div>
            <div className="flex gap-2 justify-end border-t pt-3">
              <Button variant="outline" onClick={() => setScoreModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={showInterviewModal} onClose={() => setShowInterviewModal(false)} title="Enter Interview Score">
        {selected && (
          <div className="space-y-4">
            <div><strong>Applicant:</strong> {selected.applicantName}</div>
            <div className="form-group">
              <label>Interview Score (%)</label>
              <input
                type="number"
                className="form-input"
                value={interviewScore}
                onChange={(e) => setInterviewScore(e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Interview Notes</label>
              <textarea
                className="form-input"
                rows={4}
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Enter interview notes..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" onClick={handleInterviewScore}>Save Score</Button>
              <Button variant="outline" onClick={() => setShowInterviewModal(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="Send Job Offer">
        {selected && (
          <div className="space-y-4">
            <div><strong>Applicant:</strong> {selected.applicantName}</div>
            <div><strong>Email:</strong> {selected.applicantEmail}</div>
            <div className="form-group">
              <label>Offer Amount</label>
              <input
                type="number"
                className="form-input"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter salary offer"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" onClick={handleSendOffer}>Send Offer</Button>
              <Button variant="outline" onClick={() => setShowOfferModal(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </DashboardLayout>
  );
}