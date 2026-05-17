import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

const CreateJobAdvertisement = () => {
  const navigate = useNavigate();
  const { getDepartments, getEmploymentTypes } = useSettings();
  
  const [form, setForm] = useState({
    title: '',
    role: '',
    department: '',
    location: '',
    employmentType: 'Full-Time',
    vacancies: 1,
    gender: 'Equal Opportunity',
    applicationDeadline: '',
    salaryRange: '',
    introduction: '',
    responsibilities: '',
    requiredSkills: '',
    qualifications: '',
    benefits: '',
  });

  const [loading, setLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState({ pdf: null, jpeg: null });
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);

  const departments = getDepartments();
  const employmentTypes = getEmploymentTypes();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLetterheadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLetterheadFile(file);
    }
  };

  const handleLetterheadUpload = async () => {
    if (!letterheadFile) {
      toast.error('Please select a letterhead file');
      return;
    }

    const formData = new FormData();
    formData.append('letterhead', letterheadFile);

    try {
      setUploadingLetterhead(true);
      const response = await api.post('/advertisements/upload-letterhead', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Letterhead uploaded successfully');
      setLetterheadFile(null);
    } catch (err) {
      toast.error('Failed to upload letterhead');
      console.error('Upload error:', err);
    } finally {
      setUploadingLetterhead(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create job posting first
      const jobData = {
        title: form.title,
        description: form.introduction,
        department: form.department,
        location: form.location,
        employmentType: form.employmentType,
        status: 'open',
        salaryRange: form.salaryRange,
        requirements: form.requiredSkills,
        responsibilities: form.responsibilities,
        benefits: form.benefits,
        applicationDeadline: form.applicationDeadline,
        qualifications: form.qualifications,
        // Extended fields for advertisement
        advertisementData: {
          role: form.role,
          vacancies: form.vacancies,
          gender: form.gender,
          introduction: form.introduction,
          responsibilities: form.responsibilities,
          requiredSkills: form.requiredSkills,
        },
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('authToken'),
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) throw new Error('Failed to create job');

      const job = await response.json();

      // Generate advertisement files
      await generateAdvertisement(job);

      toast.success('Job created and advertisement generated successfully');
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
        headers: {
          'x-auth-token': localStorage.getItem('authToken'),
        },
      });

      if (!response.ok) throw new Error('Failed to generate advertisement');

      const data = await response.json();
      setGeneratedFiles({ pdf: data.pdfUrl, jpeg: data.jpegUrl });
    } catch (err) {
      console.error('Advertisement generation error:', err);
      toast.error('Failed to generate advertisement files');
    }
  };

  const downloadPDF = () => {
    if (generatedFiles.pdf) {
      window.open(generatedFiles.pdf, '_blank');
    }
  };

  const downloadJPEG = () => {
    if (generatedFiles.jpeg) {
      window.open(generatedFiles.jpeg, '_blank');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Job Advertisement</h1>
          <p className="text-gray-600 mt-1">Create a job posting and generate marketing materials</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Letterhead Upload */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4">Letterhead (Optional)</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Letterhead Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLetterheadChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {letterheadFile && (
                  <div className="flex gap-3 items-center">
                    <span className="text-sm text-gray-600">{letterheadFile.name}</span>
                    <Button variant="primary" onClick={handleLetterheadUpload} disabled={uploadingLetterhead}>
                      {uploadingLetterhead ? 'Uploading...' : 'Upload Letterhead'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Key Job Details */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4">Key Job Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role / Position Title</label>
                  <Input
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    placeholder="e.g., Toll Attendant"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Title</label>
                  <Input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi Expressway Hiring Toll Attendants"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <Input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi, Kenya"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies</label>
                  <Input
                    name="vacancies"
                    type="number"
                    value={form.vacancies}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Equal Opportunity">Equal Opportunity</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <Input
                    name="applicationDeadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                  <Input
                    name="salaryRange"
                    value={form.salaryRange}
                    onChange={handleChange}
                    placeholder="e.g., KES 25,000 - 30,000 per month"
                  />
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4">Introduction</h2>
              <textarea
                name="introduction"
                value={form.introduction}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Provide an overview of the role and what the organization does..."
                required
              />
            </div>

            {/* Responsibilities */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4">Your Responsibilities</h2>
              <textarea
                name="responsibilities"
                value={form.responsibilities}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="List the key responsibilities (one per line or numbered)..."
                required
              />
            </div>

            {/* Required Skills */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4">Required Skills and Experience</h2>
              <textarea
                name="requiredSkills"
                value={form.requiredSkills}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="List the required skills, experience, qualifications (one per line or numbered)..."
                required
              />
            </div>

            {/* Additional Details */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                  <textarea
                    name="qualifications"
                    value={form.qualifications}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Minimum educational requirements..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                  <textarea
                    name="benefits"
                    value={form.benefits}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="List benefits offered..."
                  />
                </div>
              </div>
            </div>

            {/* Generated Files */}
            {generatedFiles.pdf && generatedFiles.jpeg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 mb-3">Advertisement Generated Successfully</h3>
                <p className="text-sm text-emerald-700 mb-3">Download the advertisement files for marketing channels:</p>
                <div className="flex gap-3">
                  <Button variant="primary" onClick={downloadPDF}>
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={downloadJPEG}>
                    Download JPEG
                  </Button>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Job & Generate Advertisement'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/recruitment/jobs')}>
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
