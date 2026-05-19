import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import DateDropdown from '../../components/common/DateDropdown';

import api from '../../services/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext';

const defaultProfile = {
  // Personal Info
  fullName: '',
  photoUrl: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  nationalId: '',
  emergencyContact: { name: '', phone: '', relation: '' },
  professionalHeadline: '',
  summary: '',
  // Employment/HR Header
  employeeId: '',
  jobTitle: '',
  department: '',
  status: '',
  dateOfJoining: '',
  employmentType: '',
  workLocation: '',
  reportingManager: '',
  // Certifications
  certifications: [],
  // Work History
  workHistory: [],
  // Education
  education: [],
  // Skills
  skills: [],
  // Projects
  projects: [],
  // Awards
  awards: [],
  // Languages
  languages: [],
  // Memberships
  memberships: [],
  // References
  references: [],
  // Volunteer
  volunteer: [],
  // Publications
  publications: [],
  // Interests
  interests: [],
  // HRMS-specific
  payroll: {},
  leaveInfo: {},
  contracts: [],
  performance: {},
  documents: [],
};

const normalizeProfile = (raw = {}) => ({
  ...raw,
  userId: raw.userId ?? raw.userid,
  fullName: raw.fullName ?? raw.fullname,
  photoUrl: raw.photoUrl ?? raw.photourl,
  dateOfBirth: raw.dateOfBirth ?? raw.dateofbirth,
  nationalId: raw.nationalId ?? raw.nationalid,
  emergencyContact: raw.emergencyContact ?? raw.emergencycontact,
  professionalHeadline: raw.professionalHeadline ?? raw.professionalheadline,
  employeeId: raw.employeeId ?? raw.employeeid,
  jobTitle: raw.jobTitle ?? raw.jobtitle,
  dateOfJoining: raw.dateOfJoining ?? raw.dateofjoining,
  employmentType: raw.employmentType ?? raw.employmenttype,
  workLocation: raw.workLocation ?? raw.worklocation,
  reportingManager: raw.reportingManager ?? raw.reportingmanager,
  workHistory: raw.workHistory ?? raw.workhistory,
  leaveInfo: raw.leaveInfo ?? raw.leaveinfo,
  createdAt: raw.createdAt ?? raw.createdat,
  updatedAt: raw.updatedAt ?? raw.updatedat,
});

export default function ProfileUpdateForm() {
  const { refreshPortalProfile } = useAuth();
  const [form, setForm] = useState(defaultProfile);
  const [dateOfBirth, setDateOfBirth] = useState(form.dateOfBirth ? new Date(form.dateOfBirth) : null);
  const [dateOfJoining, setDateOfJoining] = useState(form.dateOfJoining ? new Date(form.dateOfJoining) : null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savingPortal, setSavingPortal] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/profile/me');
        setForm({ ...defaultProfile, ...normalizeProfile(res.data || {}) });
      } catch {
        setForm(defaultProfile);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // For array fields (skills, interests, etc.)
  const handleArrayChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value.split(',').map((v) => v.trim()).filter(Boolean) }));
  };

  // For nested objects (emergencyContact, payroll, etc.)
  const handleNestedChange = (section, key, value) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const handleSavePortal = async (e) => {
    e.preventDefault();
    if (!form.fullName?.trim()) {
      toast.error('Full name is required to save your portal profile');
      return;
    }
    if (!form.email?.trim()) {
      toast.error('Email is required to save your portal profile');
      return;
    }
    setSavingPortal(true);
    try {
      await api.post('/profile/me', form);
      await refreshPortalProfile();
      toast.success('Portal profile saved');
    } catch {
      toast.error('Could not save portal profile');
    } finally {
      setSavingPortal(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingAll(true);
    try {
      await api.post('/profile/me', form);
      await refreshPortalProfile();
      setShowSuccess(true);
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingAll(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="flex">
        <div className="flex-1 container mx-auto py-8">
          <Card>
            <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info — portal profile */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Portal profile</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Name and contact shown across the app use this section. Save it separately from the rest of your profile if you only need to update these details.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required />
                <Input label="Email" name="email" value={form.email} onChange={handleChange} required />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                <Input label="Address" name="address" value={form.address} onChange={handleChange} />
                <DateDropdown 
                  selectedDate={dateOfBirth}
                  onDateChange={(date) => {
                    setDateOfBirth(date);
                    setForm({...form, dateOfBirth: date ? date.toISOString().split('T')[0] : ''});
                  }}
                  label="Date of Birth"
                  showYear={true}
                  showMonth={true}
                  showDay={true}
                  yearRange={50}
                />
                <Input label="National ID/Passport" name="nationalId" value={form.nationalId} onChange={handleChange} />
                <Input label="Professional Headline" name="professionalHeadline" value={form.professionalHeadline} onChange={handleChange} />
                <Input label="Profile Photo URL" name="photoUrl" value={form.photoUrl} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <Input label="Emergency Contact Name" name="emergencyContactName" value={form.emergencyContact?.name || ''} onChange={e => handleNestedChange('emergencyContact', 'name', e.target.value)} />
                <Input label="Emergency Contact Phone" name="emergencyContactPhone" value={form.emergencyContact?.phone || ''} onChange={e => handleNestedChange('emergencyContact', 'phone', e.target.value)} />
                <Input label="Emergency Contact Relation" name="emergencyContactRelation" value={form.emergencyContact?.relation || ''} onChange={e => handleNestedChange('emergencyContact', 'relation', e.target.value)} />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Professional Summary</label>
                <textarea className="form-input w-full" name="summary" value={form.summary} onChange={handleChange} rows={3} />
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" variant="primary" onClick={handleSavePortal} disabled={savingPortal || savingAll}>
                  {savingPortal ? 'Saving…' : 'Save portal profile'}
                </Button>
              </div>
            </div>

            {/* Employment/HR Header */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} />
                <Input label="Job Title" name="jobTitle" value={form.jobTitle} onChange={handleChange} />
                <Input label="Department" name="department" value={form.department} onChange={handleChange} />
                <Input label="Status" name="status" value={form.status} onChange={handleChange} />
                <DateDropdown 
                  selectedDate={dateOfJoining}
                  onDateChange={(date) => {
                    setDateOfJoining(date);
                    setForm({...form, dateOfJoining: date ? date.toISOString().split('T')[0] : ''});
                  }}
                  label="Date of Joining"
                  showYear={true}
                  showMonth={true}
                  showDay={true}
                  yearRange={20}
                />
                <Input label="Employment Type" name="employmentType" value={form.employmentType} onChange={handleChange} />
                <Input label="Work Location" name="workLocation" value={form.workLocation} onChange={handleChange} />
                <Input label="Reporting Manager" name="reportingManager" value={form.reportingManager} onChange={handleChange} />
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Certifications</h3>
              <div className="mb-2">
                {/* TODO: Add dynamic fields and file upload for certifications */}
                <Input label="Certifications (comma separated)" name="certifications" value={form.certifications?.map(c => c.name || c).join(', ')} onChange={e => handleArrayChange('certifications', e.target.value)} />
                <div className="text-xs text-slate-500 mt-1">(You will be able to upload certificates in the next step.)</div>
              </div>
            </div>

            {/* Work History */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Work History</h3>
              <div className="mb-2">
                {/* TODO: Add dynamic fields for multiple jobs */}
                <Input label="Work History (comma separated)" name="workHistory" value={form.workHistory?.map(j => j.company || j).join(', ')} onChange={e => handleArrayChange('workHistory', e.target.value)} />
              </div>
            </div>

            {/* Education */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Education</h3>
              <div className="mb-2">
                {/* TODO: Add dynamic fields for multiple degrees */}
                <Input label="Education (comma separated)" name="education" value={form.education?.map(e => e.degree || e).join(', ')} onChange={e => handleArrayChange('education', e.target.value)} />
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Skills</h3>
              <Input label="Skills (comma separated)" name="skills" value={form.skills?.map(s => s.name || s).join(', ')} onChange={e => handleArrayChange('skills', e.target.value)} />
            </div>

            {/* Projects */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Projects / Portfolio</h3>
              <Input label="Projects (comma separated)" name="projects" value={form.projects?.map(p => p.title || p).join(', ')} onChange={e => handleArrayChange('projects', e.target.value)} />
            </div>

            {/* Awards */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Awards & Recognitions</h3>
              <Input label="Awards (comma separated)" name="awards" value={form.awards?.map(a => a.name || a).join(', ')} onChange={e => handleArrayChange('awards', e.target.value)} />
            </div>

            {/* Languages */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Languages</h3>
              <Input label="Languages (comma separated)" name="languages" value={form.languages?.map(l => l.name || l).join(', ')} onChange={e => handleArrayChange('languages', e.target.value)} />
            </div>

            {/* Memberships */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Professional Memberships</h3>
              <Input label="Memberships (comma separated)" name="memberships" value={form.memberships?.map(m => m.organization || m).join(', ')} onChange={e => handleArrayChange('memberships', e.target.value)} />
            </div>

            {/* References */}
            <div>
              <h3 className="text-xl font-semibold mb-2">References</h3>
              <Input label="References (comma separated)" name="references" value={form.references?.map(r => r.name || r).join(', ')} onChange={e => handleArrayChange('references', e.target.value)} />
            </div>

            {/* Volunteer, Publications, Interests */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Additional Information</h3>
              <Input label="Volunteer Experience (comma separated)" name="volunteer" value={form.volunteer?.map(v => v.organization || v).join(', ')} onChange={e => handleArrayChange('volunteer', e.target.value)} />
              <Input label="Publications (comma separated)" name="publications" value={form.publications?.map(p => p.title || p).join(', ')} onChange={e => handleArrayChange('publications', e.target.value)} />
              <Input label="Interests (comma separated)" name="interests" value={form.interests?.join(', ')} onChange={e => handleArrayChange('interests', e.target.value)} />
            </div>

            {/* HRMS-specific (payroll, leave, contracts, performance, documents) - for admin/HR only, can be hidden for regular users */}
            {/* ... */}

            <div className="flex gap-2 justify-end">
              <Button type="submit" variant="primary" disabled={savingAll || savingPortal}>
                {savingAll ? 'Saving…' : 'Save entire profile'}
              </Button>
            </div>
          </form>
          <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Profile Updated">
            <div className="p-4 text-center">
              <p className="mb-4">Your profile has been updated successfully.</p>
              <Button variant="primary" onClick={() => setShowSuccess(false)}>Close</Button>
            </div>
          </Modal>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
