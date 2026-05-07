import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsBriefcase, BsCalendar, BsChatDots, BsCheckCircle, BsClock, BsFileEarmarkText } from 'react-icons/bs';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ubuntu-hrms-epmc.onrender.com';

const toCvUrl = (cvPath) => {
  if (!cvPath) return null;
  const normalized = String(cvPath).replace(/\\/g, '/');
  return `${API_BASE_URL}/${normalized.replace(/^\/+/, '')}`;
};

const normalizeApplication = (raw = {}) => ({
  ...raw,
  applicantName: raw.applicantName ?? raw.applicantname ?? '',
  applicantEmail: raw.applicantEmail ?? raw.applicantemail ?? '',
  applicantPhone: raw.applicantPhone ?? raw.applicantphone ?? '',
  cvPath: raw.cvPath ?? raw.cvpath ?? null,
  coverLetter: raw.coverLetter ?? raw.coverletter ?? '',
  recruiterAnnouncement: raw.recruiterAnnouncement ?? raw.recruiterannouncement ?? '',
  applicationData: raw.applicationData ?? raw.applicationdata ?? null,
  appliedAt: raw.appliedAt ?? raw.appliedat ?? raw.createdAt ?? raw.createdat ?? null,
  jobId: raw.jobId ?? raw.jobid ?? null,
});

export default function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/jobs/my-applications');
        setApplications(Array.isArray(res.data) ? res.data.map(normalizeApplication) : []);
      } catch {
        toast.error('Failed to load your applications');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    if (filter === 'all') return applications;
    return applications.filter((item) => (item.status || 'pending') === filter);
  }, [applications, filter]);

  const getStatusClasses = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-green-100 text-green-800',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">My Applications</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Track every role you applied for, its status, and recruiter updates.</p>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'shortlisted', 'rejected', 'hired'].map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={filter === value ? 'primary' : 'secondary'}
                  onClick={() => setFilter(value)}
                >
                  {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-lg font-medium">No applications found</p>
              <p className="mt-2">Apply to a role from the job board to see it here.</p>
              <Button className="mt-4" variant="primary" onClick={() => navigate('/recruitment/jobs-board')}>
                Browse Jobs
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <BsBriefcase />
                        Application #{application.id}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Job ID: {application.jobId || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(application.status)}`}>
                      {application.status || 'pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 flex items-center gap-2"><BsCheckCircle /> Name</p>
                      <p className="font-semibold">{application.applicantName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 flex items-center gap-2"><BsClock /> Applied</p>
                      <p className="font-semibold">
                        {application.appliedAt ? new Date(application.appliedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-semibold">{application.applicantEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="font-semibold">{application.applicantPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 flex items-center gap-2"><BsFileEarmarkText /> CV</p>
                      <p className="font-semibold">
                        {application.cvPath ? (
                          <a className="text-primary-600 hover:underline" href={toCvUrl(application.cvPath)} target="_blank" rel="noreferrer">
                            Download CV
                          </a>
                        ) : 'Not submitted'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 flex items-center gap-2"><BsCalendar /> Application Type</p>
                      <p className="font-semibold">{application.applicationData?.applicationMode || 'scratch'}</p>
                    </div>
                  </div>

                  {application.coverLetter && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-500 mb-2">Cover Letter</p>
                      <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">{application.coverLetter}</p>
                    </div>
                  )}

                  {application.applicationData && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><BsBriefcase /> Extended Details</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Work History: {Array.isArray(application.applicationData.workHistory) && application.applicationData.workHistory.length ? application.applicationData.workHistory.join(', ') : '-'}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Education: {Array.isArray(application.applicationData.education) && application.applicationData.education.length ? application.applicationData.education.join(', ') : '-'}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        References: {Array.isArray(application.applicationData.references) && application.applicationData.references.length ? application.applicationData.references.join(', ') : '-'}
                      </p>
                    </div>
                  )}

                  {application.recruiterAnnouncement && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-2"><BsChatDots /> Recruiter Announcement</p>
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {application.recruiterAnnouncement}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/recruitment/jobs/${application.jobId}/applicants/${application.id}`)}>
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}