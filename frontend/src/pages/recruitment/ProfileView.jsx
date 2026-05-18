import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
// import Sidebar from '../../components/common/Sidebar';
// import Header from '../../components/common/Header';
import api from '../../services/api';
import { BsPerson, BsBriefcase, BsFileEarmarkText, BsEnvelope, BsPhone, BsLinkedin, BsCalendar, BsGeoAlt, BsUpload } from 'react-icons/bs';
import DashboardLayout from '../../components/DashboardLayout'

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


export default function ProfileView() {
  const [profile, setProfile] = useState(null);
  const [workProfile, setWorkProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const res = await api.get('/profile/me');
        const normalizedProfile = normalizeProfile(res.data || {});
        const hasProfile = Object.keys(normalizedProfile).length > 0;
        // The backend currently stores both portal and work fields in one profile record.
        setProfile(hasProfile ? normalizedProfile : null);
        setWorkProfile(hasProfile ? normalizedProfile : null);
      } catch {
        setProfile(null);
        setWorkProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  // If neither profile exists
  if (!profile && !workProfile) {
    return (
      <DashboardLayout>
        <div className="flex">

          <div className="flex-1 container mx-auto py-8">
            <Card>
              <h2 className="text-2xl font-bold mb-4">No profile found.</h2>
              <div className="mb-4">You have not created a portal or work profile yet.</div>
              <Button variant="primary" onClick={() => navigate('/profile/update')}>Create Profile</Button>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (

    <DashboardLayout>
    <div className="flex">

      <div className="flex-1 container mx-auto py-8 space-y-8">
        {/* Portal Profile (Basic) */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <BsPerson size={32} className="text-blue-600" />
            <h2 className="text-2xl font-bold">Portal Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>Name:</strong> {profile?.fullName || '-'}</div>
            <div><strong>Email:</strong> {profile?.email || '-'}</div>
            <div><strong>Phone:</strong> {profile?.phone || '-'}</div>
            <div><strong>LinkedIn:</strong> {profile?.linkedin ? <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">{profile.linkedin}</a> : '-'}</div>
            <div><strong>Address:</strong> {profile?.address || '-'}</div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={() => navigate('/profile/update')}>Edit Portal Profile</Button>
          </div>
        </Card>

        {/* Work Profile (Detailed) */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <BsBriefcase size={32} className="text-green-600" />
            <h2 className="text-2xl font-bold">Work Profile</h2>
          </div>
          <div className="mb-4"><strong>Professional Summary:</strong> {workProfile?.summary || '-'}</div>
          <div className="mb-4"><strong>Skills:</strong> {workProfile?.skills?.join(', ') || '-'}</div>
          <div className="mb-4"><strong>Languages:</strong> {workProfile?.languages?.join(', ') || '-'}</div>
          <div className="mb-4"><strong>Certifications:</strong>
            <ul className="list-disc ml-6">
              {workProfile?.certifications && Array.isArray(workProfile.certifications) && workProfile.certifications.length > 0
                ? workProfile.certifications.map((cert, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <BsFileEarmarkText />
                      {cert.name || cert}
                      {cert.fileUrl && (
                        <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View</a>
                      )}
                    </li>
                  ))
                : <li>-</li>}
            </ul>
          </div>
          <div className="mb-4"><strong>Work History:</strong>
            <ul className="list-disc ml-6">
              {workProfile?.workHistory && Array.isArray(workProfile.workHistory) && workProfile.workHistory.length > 0
                ? workProfile.workHistory.map((job, i) => (
                    <li key={i} className="mb-2">
                      <div><strong>Company:</strong> {job.company || '-'}</div>
                      <div><strong>Title:</strong> {job.title || '-'}</div>
                      <div><strong>Duration:</strong> {job.startDate || '-'} to {job.endDate || 'Present'}</div>
                      <div><strong>Description:</strong> {job.description || '-'}</div>
                    </li>
                  ))
                : <li>-</li>}
            </ul>
          </div>
          <div className="mb-4"><strong>Education:</strong>
            <ul className="list-disc ml-6">
              {workProfile?.education && Array.isArray(workProfile.education) && workProfile.education.length > 0
                ? workProfile.education.map((edu, i) => (
                    <li key={i} className="mb-2">
                      <div><strong>School:</strong> {edu.school || '-'}</div>
                      <div><strong>Degree:</strong> {edu.degree || '-'}</div>
                      <div><strong>Year:</strong> {edu.year || '-'}</div>
                    </li>
                  ))
                : <li>-</li>}
            </ul>
          </div>
          <div className="mb-4"><strong>References:</strong>
            <ul className="list-disc ml-6">
              {workProfile?.references && Array.isArray(workProfile.references) && workProfile.references.length > 0
                ? workProfile.references.map((ref, i) => (
                    <li key={i}>
                      {ref.name} ({ref.contact})
                    </li>
                  ))
                : <li>-</li>}
            </ul>
          </div>
          <div className="mb-4"><strong>Profile Photo:</strong> {workProfile?.photoUrl ? <img src={workProfile.photoUrl} alt="Profile" className="inline-block h-16 w-16 rounded-full border" /> : '-'}</div>
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={() => navigate('/profile/update')}>Edit Work Profile</Button>
          </div>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
