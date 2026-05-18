import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

const selectClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 transition-all duration-200';
const textareaClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 transition-all duration-200 resize-vertical';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
const sectionClass = 'border-b border-slate-200 dark:border-slate-700 pb-6';
const sectionTitle = 'text-base font-semibold text-slate-800 dark:text-slate-100 mb-4';

const CreateJobAdvertisement = () => {
  const navigate = useNavigate();
  const { getDepartments, getEmploymentTypes, getJobStatuses } = useSettings();

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    employmentType: '',
    status: 'open',
    salaryRange: '',
    applicationDeadline: '',
    responsibilities: '',
    requirements: '',
    qualifications: '',
    benefits: '',
  });

  const [loading, setLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState({ pdf: null, jpeg: null });
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);

  const departments = getDepartments();
  const employmentTypes = getEmploymentTypes();
  const jobStatuses = getJobStatuses();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLetterheadChange = (e) => {
    const file = e.target.files[0];
    if (file) setLetterheadFile(file);
  };

  const handleLetterheadUpload = async () => {
    if (!letterheadFile) { toast.error('Please select a letterhead file'); return; }
    const formData = new FormData();
    formData.append('letterhead', letterheadFile);
    try {
      setUploadingLetterhead(true);
      await api.post('/advertisements/upload-letterhead', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Letterhead uploaded successfully');
      setLetterheadFile(null);
    } catch (err) {
      toast.error('Failed to upload letterhead');
    } finally {
      setUploadingLetterhead(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const jobData = {
        title: form.title,
        description: form.description,
        department: form.department,
        location: form.location,
        employmentType: form.employmentType,
        status: form.status,
        salaryRange: form.salaryRange,
        applicationDeadline: form.applicationDeadline || undefined,
        responsibilities: form.responsibilities,
        requirements: form.requirements,
        qualifications: form.qualifications ? [form.qualifications] : [],
        benefits: form.benefits,
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('authToken'),
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to create job');
      }

      const job = await response.json();
      await generateAdvertisement(job);
      toast.success('Job created successfully');
      navigate('/recruitment/jobs');
    } catch (err) {
      toast.error(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const generateAdvertisement = async (job) => {
    try {
      const response = await fetch(`/api/advertisements/generate/${job.id}`, {
        method: 'POST',
        headers: { 'x-auth-token': localStorage.getItem('authToken') },
      });
      if (!response.ok) return;
      const data = await response.json();
      setGeneratedFiles({ pdf: data.pdfUrl, jpeg: data.jpegUrl });
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Create Job Posting</h1>
          <p className="page-subtitle">Fill in all details to create a new job advertisement</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Section: Core Details */}
            <div className={sectionClass}>
              <h2 className={sectionTitle}>Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Job Title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior Toll Attendant"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Department</label>
                  <select name="department" value={form.department} onChange={handleChange} className={selectClass} required>
                    <option value="">Select department...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi, Kenya"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Employment Type</label>
                  <select name="employmentType" value={form.employmentType} onChange={handleChange} className={selectClass} required>
                    <option value="">Select type...</option>
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={selectClass} required>
                    {jobStatuses.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Salary Range"
                    name="salaryRange"
                    value={form.salaryRange}
                    onChange={handleChange}
                    placeholder="e.g., KES 25,000 – 35,000 / month"
                  />
                </div>

                <div>
                  <Input
                    label="Application Deadline"
                    name="applicationDeadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Description */}
            <div className={sectionClass}>
              <h2 className={sectionTitle}>Job Description</h2>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={textareaClass}
                placeholder="Provide an overview of the role and what the organisation does..."
                required
              />
            </div>

            {/* Section: Responsibilities */}
            <div className={sectionClass}>
              <h2 className={sectionTitle}>Responsibilities</h2>
              <textarea
                name="responsibilities"
                value={form.responsibilities}
                onChange={handleChange}
                rows={5}
                className={textareaClass}
                placeholder="List key responsibilities, one per line..."
                required
              />
            </div>

            {/* Section: Requirements */}
            <div className={sectionClass}>
              <h2 className={sectionTitle}>Requirements & Skills</h2>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={5}
                className={textareaClass}
                placeholder="List required skills and experience, one per line..."
                required
              />
            </div>

            {/* Section: Qualifications & Benefits */}
            <div className={sectionClass}>
              <h2 className={sectionTitle}>Qualifications & Benefits</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Minimum Qualifications</label>
                  <textarea
                    name="qualifications"
                    value={form.qualifications}
                    onChange={handleChange}
                    rows={3}
                    className={textareaClass}
                    placeholder="e.g., Diploma in Business Administration, KCSE C Plain..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Benefits Offered</label>
                  <textarea
                    name="benefits"
                    value={form.benefits}
                    onChange={handleChange}
                    rows={3}
                    className={textareaClass}
                    placeholder="e.g., Medical cover, pension scheme, transport allowance..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Letterhead */}
            <div className={sectionClass}>
              <h2 className={sectionTitle}>Letterhead (Optional)</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Upload Letterhead Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLetterheadChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                  />
                </div>
                {letterheadFile && (
                  <div className="flex gap-3 items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{letterheadFile.name}</span>
                    <Button type="button" variant="outline" onClick={handleLetterheadUpload} disabled={uploadingLetterhead}>
                      {uploadingLetterhead ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Files */}
            {(generatedFiles.pdf || generatedFiles.jpeg) && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2">Advertisement Generated</h3>
                <div className="flex gap-3 mt-2">
                  {generatedFiles.pdf && <Button type="button" variant="primary" onClick={() => window.open(generatedFiles.pdf, '_blank')}>Download PDF</Button>}
                  {generatedFiles.jpeg && <Button type="button" variant="outline" onClick={() => window.open(generatedFiles.jpeg, '_blank')}>Download JPEG</Button>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Job Posting'}
              </Button>
              <Button variant="outline" type="button" onClick={() => navigate('/recruitment/jobs')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateJobAdvertisement;
