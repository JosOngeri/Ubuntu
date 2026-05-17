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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
        </div>
        <Table
          columns={[
            { key: 'applicantName', label: 'Name' },
            { key: 'applicantEmail', label: 'Email' },
            { key: 'applicantPhone', label: 'Phone' },
            { key: 'status', label: 'Status' },
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
              key: 'actions',
              label: '',
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => navigate(`/recruitment/jobs/${jobId}/applicants/${row.id}`)}>View Details</Button>
                  <Button size="sm" onClick={() => openModal(row)}>Review</Button>
                </div>
              ),
            },
          ]}
          data={filteredApplications}
          loading={loading}
        />
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
    </div>
    </DashboardLayout>
  );
}