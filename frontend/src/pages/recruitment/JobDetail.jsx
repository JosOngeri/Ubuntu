import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsArrowLeft, BsBriefcase, BsGeoAlt, BsClock, BsCalendarEvent, BsTag, BsFileEarmarkText } from 'react-icons/bs';

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs/${jobId}`);
        setJob(res.data);
      } catch (err) {
        toast.error('Failed to fetch job details');
        navigate('/recruitment/jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, navigate]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    api.delete(`/jobs/${jobId}`)
      .then(() => {
        toast.success('Job posting deleted successfully');
        navigate('/recruitment/jobs');
      })
      .catch(() => {
        toast.error('Failed to delete job posting');
      });
  };

  const handleViewApplicants = () => {
    navigate(`/recruitment/jobs/${jobId}/applicants`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <p className="text-center text-slate-500">Job posting not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/recruitment/jobs')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Job Details</h1>
          </div>
        </div>

        {/* Main Job Card */}
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <BsBriefcase size={32} className="text-primary-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{job.title}</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-slate-600">
                <span className="flex items-center gap-1">
                  <BsGeoAlt size={14} />
                  {job.location || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            {/* Department */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Department</label>
              <p className="text-lg font-semibold mt-1">{job.department || 'N/A'}</p>
            </div>

            {/* Employment Type */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Employment Type</label>
              <p className="text-lg font-semibold mt-1">{job.employmentType || 'N/A'}</p>
            </div>

            {/* Salary Range */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsTag size={14} />
                Salary Range
              </label>
              <p className="text-lg font-semibold mt-1">{job.salaryRange || 'N/A'}</p>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsCalendarEvent size={14} />
                Application Deadline
              </label>
              <p className={`text-lg font-semibold mt-1 ${isDeadlinePassed ? 'text-red-600' : ''}`}>
                {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'N/A'}
                {isDeadlinePassed && <span className="text-red-600 text-sm ml-2">(Passed)</span>}
              </p>
            </div>

            {/* Posted At */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsClock size={14} />
                Posted At
              </label>
              <p className="text-lg font-semibold mt-1">
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsGeoAlt size={14} />
                Location
              </label>
              <p className="text-lg font-semibold mt-1">{job.location || 'N/A'}</p>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-2">
                <BsFileEarmarkText size={14} />
                Description
              </label>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Requirements</label>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Responsibilities</label>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{job.responsibilities}</p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Benefits</label>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{job.benefits}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => navigate('/recruitment/jobs')}
            >
              Back to Jobs
            </Button>
            <Button
              variant="primary"
              onClick={handleViewApplicants}
            >
              View Applicants
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Job
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
