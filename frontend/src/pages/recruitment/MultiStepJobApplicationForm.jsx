import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import DateDropdown from '../../components/common/DateDropdown'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useSettings } from '../../contexts/SettingsContext'

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Basic details about yourself' },
  { id: 2, title: 'Address & Contact', description: 'Your location and emergency contact' },
  { id: 3, title: 'Position Details', description: 'Job preferences and availability' },
  { id: 4, title: 'Education', description: 'Academic qualifications and certifications' },
  { id: 5, title: 'Employment History', description: 'Previous work experience' },
  { id: 6, title: 'References', description: 'Professional references' },
  { id: 7, title: 'Skills & Declaration', description: 'Skills and final submission' },
]

const emptyWork = { company: '', position: '', startDate: '', endDate: '', reasonForLeaving: '', duties: '', salary: '' }
const emptyEdu = { institution: '', qualification: '', fieldOfStudy: '', startYear: '', endYear: '' }
const emptyCert = { name: '', issuingBody: '', dateObtained: '', expiryDate: '' }
const emptyRef = { name: '', position: '', company: '', phone: '', email: '', relationship: '' }
const emptySkill = { name: '', proficiency: '' }
const emptyLanguage = { language: '', proficiency: '' }

export default function MultiStepJobApplicationForm() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { getDepartments, getEmploymentTypes } = useSettings()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Date states for DateDropdown components
  const [dateOfBirth, setDateOfBirth] = useState(null)
  const [dateAvailable, setDateAvailable] = useState(null)

  const departments = getDepartments()
  const employmentTypes = getEmploymentTypes()

  const [form, setForm] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    nationalId: '',
    phone: '',
    email: '',

    // Step 2: Address & Contact
    residentialAddress: { street: '', city: '', postalCode: '' },
    postalAddress: { street: '', city: '', postalCode: '' },
    emergencyContact: { name: '', phone: '', relationship: '' },

    // Step 3: Position Details
    expectedSalary: '',
    dateAvailable: '',
    willingToRelocate: false,
    willingToTravel: false,

    // Step 4: Education
    primaryEducation: { school: '', yearCompleted: '', certificate: '' },
    secondaryEducation: { school: '', yearCompleted: '', certificate: '', grade: '' },
    furtherEducation: [],
    certifications: [],

    // Step 5: Employment History
    employmentHistory: [],

    // Step 6: References
    references: [],

    // Step 7: Skills & Declaration
    languages: [],
    computerSkills: [],
    otherSkills: [],
    coverLetter: '',
    declarationConfirmed: false,
    backgroundCheckConsent: false,
    signature: '',

    // CV Upload
    cv: null,
  })

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/jobs/public/list`)
        const matched = (res.data || []).find(item => String(item.id) === String(jobId))
        setJob(matched || null)
      } catch { setJob(null) }
      setLoading(false)
    })()
  }, [jobId])

  useEffect(() => {
    // Save draft to localStorage
    localStorage.setItem(`jobApplication_${jobId}`, JSON.stringify(form))
  }, [form, jobId])

  useEffect(() => {
    // Load draft from localStorage
    const saved = localStorage.getItem(`jobApplication_${jobId}`)
    if (saved) {
      try {
        setForm(JSON.parse(saved))
      } catch { }
    }
  }, [jobId])

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))
  }

  const handleNestedChange = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }))
  }

  const addEmployment = () => setForm(prev => ({ ...prev, employmentHistory: [...prev.employmentHistory, { ...emptyWork }] }))
  const updateEmployment = (i, field, value) => {
    const e = [...form.employmentHistory]; e[i][field] = value; setForm(prev => ({ ...prev, employmentHistory: e }))
  }
  const removeEmployment = (i) => setForm(prev => ({ ...prev, employmentHistory: prev.employmentHistory.filter((_, j) => j !== i) }))

  const addFurtherEdu = () => setForm(prev => ({ ...prev, furtherEducation: [...prev.furtherEducation, { ...emptyEdu }] }))
  const updateFurtherEdu = (i, field, value) => {
    const e = [...form.furtherEducation]; e[i][field] = value; setForm(prev => ({ ...prev, furtherEducation: e }))
  }
  const removeFurtherEdu = (i) => setForm(prev => ({ ...prev, furtherEducation: prev.furtherEducation.filter((_, j) => j !== i) }))

  const addCert = () => setForm(prev => ({ ...prev, certifications: [...prev.certifications, { ...emptyCert }] }))
  const updateCert = (i, field, value) => {
    const c = [...form.certifications]; c[i][field] = value; setForm(prev => ({ ...prev, certifications: c }))
  }
  const removeCert = (i) => setForm(prev => ({ ...prev, certifications: prev.certifications.filter((_, j) => j !== i) }))

  const addRef = () => setForm(prev => ({ ...prev, references: [...prev.references, { ...emptyRef }] }))
  const updateRef = (i, field, value) => {
    const r = [...form.references]; r[i][field] = value; setForm(prev => ({ ...prev, references: r }))
  }
  const removeRef = (i) => setForm(prev => ({ ...prev, references: prev.references.filter((_, j) => j !== i) }))

  const addLanguage = () => setForm(prev => ({ ...prev, languages: [...prev.languages, { ...emptyLanguage }] }))
  const updateLanguage = (i, field, value) => {
    const l = [...form.languages]; l[i][field] = value; setForm(prev => ({ ...prev, languages: l }))
  }
  const removeLanguage = (i) => setForm(prev => ({ ...prev, languages: prev.languages.filter((_, j) => j !== i) }))

  const addComputerSkill = () => setForm(prev => ({ ...prev, computerSkills: [...prev.computerSkills, { ...emptySkill }] }))
  const updateComputerSkill = (i, field, value) => {
    const s = [...form.computerSkills]; s[i][field] = value; setForm(prev => ({ ...prev, computerSkills: s }))
  }
  const removeComputerSkill = (i) => setForm(prev => ({ ...prev, computerSkills: prev.computerSkills.filter((_, j) => j !== i) }))

  const [otherSkillInput, setOtherSkillInput] = useState('')
  const addOtherSkill = () => {
    if (!otherSkillInput.trim()) return
    setForm(prev => ({ ...prev, otherSkills: [...prev.otherSkills, otherSkillInput.trim()] }))
    setOtherSkillInput('')
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return form.firstName && form.lastName && form.email && form.phone
      case 2:
        return form.residentialAddress.street && form.emergencyContact.name && form.emergencyContact.phone
      case 3:
        return true
      case 4:
        return true
      case 5:
        return true
      case 6:
        return true
      case 7:
        return form.declarationConfirmed && form.backgroundCheckConsent && form.signature
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7))
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(7)) {
      toast.error('Please complete all required fields')
      return
    }

    setSubmitting(true)
    try {
      const data = new FormData()
      
      // Basic info
      data.append('applicantName', `${form.firstName} ${form.lastName}`)
      data.append('applicantEmail', form.email)
      data.append('applicantPhone', form.phone)
      data.append('coverLetter', form.coverLetter)
      data.append('applicationMode', 'structured')

      // Multi-step form data
      data.append('personal_info', JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        nationality: form.nationality,
        nationalId: form.nationalId,
        phone: form.phone,
        email: form.email,
      }))

      data.append('address_info', JSON.stringify({
        residentialAddress: form.residentialAddress,
        postalAddress: form.postalAddress,
        emergencyContact: form.emergencyContact,
      }))

      data.append('position_details', JSON.stringify({
        position: job?.title,
        department: job?.department,
        expectedSalary: form.expectedSalary,
        dateAvailable: form.dateAvailable,
        employmentType: job?.employmentType,
        willingToRelocate: form.willingToRelocate,
        willingToTravel: form.willingToTravel,
      }))

      data.append('education', JSON.stringify({
        primary: form.primaryEducation,
        secondary: form.secondaryEducation,
        furtherEducation: form.furtherEducation,
        certifications: form.certifications,
      }))

      data.append('employment_history', JSON.stringify(form.employmentHistory))
      data.append('references', JSON.stringify(form.references))
      data.append('skills', JSON.stringify({
        languages: form.languages,
        computerSkills: form.computerSkills,
        otherSkills: form.otherSkills,
      }))
      data.append('declaration', JSON.stringify({
        coverLetter: form.coverLetter,
        declarationConfirmed: form.declarationConfirmed,
        backgroundCheckConsent: form.backgroundCheckConsent,
        signature: form.signature,
      }))

      if (form.cv) data.append('cv', form.cv)

      await api.post(`/jobs/${jobId}/apply`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      
      // Clear draft
      localStorage.removeItem(`jobApplication_${jobId}`)
      setShowSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      firstName: '', lastName: '', dateOfBirth: '', gender: '', maritalStatus: '', nationality: '', nationalId: '', phone: '', email: '',
      residentialAddress: { street: '', city: '', postalCode: '' },
      postalAddress: { street: '', city: '', postalCode: '' },
      emergencyContact: { name: '', phone: '', relationship: '' },
      expectedSalary: '', dateAvailable: '', willingToRelocate: false, willingToTravel: false,
      primaryEducation: { school: '', yearCompleted: '', certificate: '' },
      secondaryEducation: { school: '', yearCompleted: '', certificate: '', grade: '' },
      furtherEducation: [], certifications: [], employmentHistory: [], references: [],
      languages: [], computerSkills: [], otherSkills: [],
      coverLetter: '', declarationConfirmed: false, backgroundCheckConsent: false, signature: '', cv: null,
    })
    setCurrentStep(1)
  }

  if (loading) return <DashboardLayout><div className="text-center py-8">Loading...</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
            {job && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h2 className="text-xl font-bold">{job.title}</h2>
                <p className="text-sm text-slate-600">{job.department} · {job.location} · {job.employmentType}</p>
                {job.salaryRange && <p className="text-sm text-slate-500">Salary: {job.salaryRange}</p>}
              </div>
            )}
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="relative">
              {/* Background bar */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 rounded-full"></div>
              {/* Filled bar */}
              <div className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
              {/* Steps */}
              <div className="relative flex justify-between">
                {STEPS.map((step) => (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: '14.28%' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                      currentStep >= step.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <div className="text-xs text-center mt-2 text-slate-600 leading-tight">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="First Name *" name="firstName" value={form.firstName} onChange={handleChange} required />
                  <Input label="Last Name *" name="lastName" value={form.lastName} onChange={handleChange} required />
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <select className="form-input w-full" name="gender" value={form.gender} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Marital Status</label>
                    <select className="form-input w-full" name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <Input label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
                  <Input label="National ID Number" name="nationalId" value={form.nationalId} onChange={handleChange} />
                  <Input label="Phone Number *" name="phone" value={form.phone} onChange={handleChange} required />
                  <Input label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Step 2: Address & Contact */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Address & Contact Information</h3>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Residential Address *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Street Address" value={form.residentialAddress.street} onChange={(e) => handleNestedChange('residentialAddress', 'street', e.target.value)} required />
                    <Input label="City" value={form.residentialAddress.city} onChange={(e) => handleNestedChange('residentialAddress', 'city', e.target.value)} required />
                    <Input label="Postal Code" value={form.residentialAddress.postalCode} onChange={(e) => handleNestedChange('residentialAddress', 'postalCode', e.target.value)} />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Postal Address (if different)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Street Address" value={form.postalAddress.street} onChange={(e) => handleNestedChange('postalAddress', 'street', e.target.value)} />
                    <Input label="City" value={form.postalAddress.city} onChange={(e) => handleNestedChange('postalAddress', 'city', e.target.value)} />
                    <Input label="Postal Code" value={form.postalAddress.postalCode} onChange={(e) => handleNestedChange('postalAddress', 'postalCode', e.target.value)} />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Emergency Contact *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Name *" value={form.emergencyContact.name} onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)} required />
                    <Input label="Phone *" value={form.emergencyContact.phone} onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)} required />
                    <Input label="Relationship" value={form.emergencyContact.relationship} onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Position Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Position Details</h3>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-slate-600 mb-2">Position: <strong>{job?.title || 'N/A'}</strong></p>
                  <p className="text-sm text-slate-600 mb-2">Department: <strong>{job?.department || 'N/A'}</strong></p>
                  <p className="text-sm text-slate-600 mb-2">Employment Type: <strong>{job?.employmentType || 'N/A'}</strong></p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Expected Salary" name="expectedSalary" value={form.expectedSalary} onChange={handleChange} />
                  <DateDropdown 
                  selectedDate={dateAvailable}
                  onDateChange={(date) => {
                    setDateAvailable(date);
                    setForm({...form, dateAvailable: date ? date.toISOString().split('T')[0] : ''});
                  }}
                  label="Date Available to Start"
                  showYear={true}
                  showMonth={true}
                  showDay={true}
                  yearRange={5}
                />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="willingToRelocate" checked={form.willingToRelocate} onChange={handleChange} className="w-4 h-4" />
                    <label className="text-sm">Willing to Relocate</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="willingToTravel" checked={form.willingToTravel} onChange={handleChange} className="w-4 h-4" />
                    <label className="text-sm">Willing to Travel</label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Education */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Education</h3>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Primary Education</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="School" value={form.primaryEducation.school} onChange={(e) => handleNestedChange('primaryEducation', 'school', e.target.value)} />
                    <Input label="Year Completed" value={form.primaryEducation.yearCompleted} onChange={(e) => handleNestedChange('primaryEducation', 'yearCompleted', e.target.value)} />
                    <Input label="Certificate" value={form.primaryEducation.certificate} onChange={(e) => handleNestedChange('primaryEducation', 'certificate', e.target.value)} />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Secondary Education</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input label="School" value={form.secondaryEducation.school} onChange={(e) => handleNestedChange('secondaryEducation', 'school', e.target.value)} />
                    <Input label="Year Completed" value={form.secondaryEducation.yearCompleted} onChange={(e) => handleNestedChange('secondaryEducation', 'yearCompleted', e.target.value)} />
                    <Input label="Certificate" value={form.secondaryEducation.certificate} onChange={(e) => handleNestedChange('secondaryEducation', 'certificate', e.target.value)} />
                    <Input label="Grade" value={form.secondaryEducation.grade} onChange={(e) => handleNestedChange('secondaryEducation', 'grade', e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Further Education</h4>
                    <Button type="button" size="sm" onClick={addFurtherEdu}>+ Add</Button>
                  </div>
                  {form.furtherEducation.map((edu, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg mb-2 border">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <input className="form-input text-sm" placeholder="Institution" value={edu.institution} onChange={e => updateFurtherEdu(i, 'institution', e.target.value)} />
                        <select className="form-input text-sm" value={edu.qualification} onChange={e => updateFurtherEdu(i, 'qualification', e.target.value)}>
                          <option value="">Qualification</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's">Bachelor's</option>
                          <option value="Master's">Master's</option>
                          <option value="PhD">PhD</option>
                        </select>
                        <input className="form-input text-sm" placeholder="Field of Study" value={edu.fieldOfStudy} onChange={e => updateFurtherEdu(i, 'fieldOfStudy', e.target.value)} />
                        <input className="form-input text-sm" placeholder="Start Year" value={edu.startYear} onChange={e => updateFurtherEdu(i, 'startYear', e.target.value)} />
                        <input className="form-input text-sm" placeholder="End Year" value={edu.endYear} onChange={e => updateFurtherEdu(i, 'endYear', e.target.value)} />
                      </div>
                      <button type="button" className="text-red-500 text-xs mt-1" onClick={() => removeFurtherEdu(i)}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Certifications</h4>
                    <Button type="button" size="sm" onClick={addCert}>+ Add</Button>
                  </div>
                  {form.certifications.map((cert, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg mb-2 border">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input className="form-input text-sm" placeholder="Certificate Name" value={cert.name} onChange={e => updateCert(i, 'name', e.target.value)} />
                        <input className="form-input text-sm" placeholder="Issuing Body" value={cert.issuingBody} onChange={e => updateCert(i, 'issuingBody', e.target.value)} />
                        <input className="form-input text-sm" type="date" placeholder="Date Obtained" value={cert.dateObtained} onChange={e => updateCert(i, 'dateObtained', e.target.value)} />
                        <input className="form-input text-sm" type="date" placeholder="Expiry Date" value={cert.expiryDate} onChange={e => updateCert(i, 'expiryDate', e.target.value)} />
                      </div>
                      <button type="button" className="text-red-500 text-xs mt-1" onClick={() => removeCert(i)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Employment History */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Employment History</h3>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-slate-500">Add your previous work experience</p>
                  <Button type="button" size="sm" onClick={addEmployment}>+ Add Employment</Button>
                </div>
                {form.employmentHistory.map((work, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-lg mb-3 border">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                      <input className="form-input text-sm" placeholder="Company Name" value={work.company} onChange={e => updateEmployment(i, 'company', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Position/Role" value={work.position} onChange={e => updateEmployment(i, 'position', e.target.value)} />
                      <input className="form-input text-sm" type="date" placeholder="Start Date" value={work.startDate} onChange={e => updateEmployment(i, 'startDate', e.target.value)} />
                      <input className="form-input text-sm" type="date" placeholder="End Date" value={work.endDate} onChange={e => updateEmployment(i, 'endDate', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Reason for Leaving" value={work.reasonForLeaving} onChange={e => updateEmployment(i, 'reasonForLeaving', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Salary (optional)" value={work.salary} onChange={e => updateEmployment(i, 'salary', e.target.value)} />
                    </div>
                    <textarea className="form-input text-sm" placeholder="Key Responsibilities/Duties" value={work.duties} onChange={e => updateEmployment(i, 'duties', e.target.value)} rows={2} />
                    <button type="button" className="text-red-500 text-xs mt-1" onClick={() => removeEmployment(i)}>Remove</button>
                  </div>
                ))}
                {form.employmentHistory.length === 0 && <p className="text-sm text-slate-400">No employment history added. Click the button above to add.</p>}
              </div>
            )}

            {/* Step 6: References */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">References</h3>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-slate-500">Add professional references (at least 2 recommended)</p>
                  <Button type="button" size="sm" onClick={addRef}>+ Add Reference</Button>
                </div>
                {form.references.map((ref, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-lg mb-3 border">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <input className="form-input text-sm" placeholder="Name" value={ref.name} onChange={e => updateRef(i, 'name', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Position/Title" value={ref.position} onChange={e => updateRef(i, 'position', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Company/Organization" value={ref.company} onChange={e => updateRef(i, 'company', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Phone Number" value={ref.phone} onChange={e => updateRef(i, 'phone', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Email" type="email" value={ref.email} onChange={e => updateRef(i, 'email', e.target.value)} />
                      <input className="form-input text-sm" placeholder="Relationship" value={ref.relationship} onChange={e => updateRef(i, 'relationship', e.target.value)} />
                    </div>
                    <button type="button" className="text-red-500 text-xs mt-1" onClick={() => removeRef(i)}>Remove</button>
                  </div>
                ))}
                {form.references.length === 0 && <p className="text-sm text-slate-400">No references added. Click the button above to add.</p>}
              </div>
            )}

            {/* Step 7: Skills & Declaration */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Skills & Declaration</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Languages Spoken</h4>
                    <Button type="button" size="sm" onClick={addLanguage}>+ Add</Button>
                  </div>
                  {form.languages.map((lang, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg mb-2 border flex gap-3">
                      <input className="form-input text-sm flex-1" placeholder="Language" value={lang.language} onChange={e => updateLanguage(i, 'language', e.target.value)} />
                      <select className="form-input text-sm" value={lang.proficiency} onChange={e => updateLanguage(i, 'proficiency', e.target.value)}>
                        <option value="">Proficiency</option>
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Native">Native</option>
                      </select>
                      <button type="button" className="text-red-500 text-xs" onClick={() => removeLanguage(i)}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Computer Skills</h4>
                    <Button type="button" size="sm" onClick={addComputerSkill}>+ Add</Button>
                  </div>
                  {form.computerSkills.map((skill, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg mb-2 border flex gap-3">
                      <input className="form-input text-sm flex-1" placeholder="Skill (e.g., Microsoft Excel)" value={skill.name} onChange={e => updateComputerSkill(i, 'name', e.target.value)} />
                      <select className="form-input text-sm" value={skill.proficiency} onChange={e => updateComputerSkill(i, 'proficiency', e.target.value)}>
                        <option value="">Proficiency</option>
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <button type="button" className="text-red-500 text-xs" onClick={() => removeComputerSkill(i)}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="mb-4 bg-slate-50 p-3 rounded-lg border">
                  <h4 className="font-medium mb-2">Other Skills</h4>
                  <div className="flex gap-2 mb-2">
                    <input className="form-input text-sm flex-1" placeholder="e.g., Project Management" value={otherSkillInput} onChange={e => setOtherSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOtherSkill() } }} />
                    <Button type="button" size="sm" onClick={addOtherSkill}>Add</Button>
                  </div>
                  {form.otherSkills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs mr-1 mb-1">
                      {skill} <button type="button" onClick={() => setForm(prev => ({ ...prev, otherSkills: prev.otherSkills.filter((_, j) => j !== i) }))}>x</button>
                    </span>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="font-medium mb-2 block">Cover Letter / Statement of Interest</label>
                  <textarea className="form-input" value={form.coverLetter} onChange={handleChange} name="coverLetter" rows={4} placeholder="Tell us why you're a great fit for this role..." />
                </div>
                <div className="mb-4">
                  <label className="font-medium mb-2 block">Upload CV (PDF/DOCX)</label>
                  <input type="file" name="cv" accept=".pdf,.docx" onChange={handleChange} />
                  {form.cv && <p className="text-sm text-slate-500 mt-1">Selected: {form.cv.name}</p>}
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="declarationConfirmed" checked={form.declarationConfirmed} onChange={handleChange} className="w-4 h-4" required />
                    <span className="font-medium">I declare that all information provided is accurate and complete *</span>
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="backgroundCheckConsent" checked={form.backgroundCheckConsent} onChange={handleChange} className="w-4 h-4" required />
                    <span className="font-medium">I consent to a background check being conducted *</span>
                  </label>
                </div>
                <div className="mb-4">
                  <label className="font-medium mb-2 block">Signature (Type your full name) *</label>
                  <input className="form-input" name="signature" value={form.signature} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>Back</Button>
              {currentStep < 7 ? (
                <Button type="button" variant="primary" onClick={nextStep}>Next</Button>
              ) : (
                <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Button>
              )}
            </div>
          </form>

          <Modal isOpen={showSuccess} onClose={() => { setShowSuccess(false); resetForm(); navigate('/jobs') }} title="Application Submitted">
            <div className="p-4 text-center">
              <p className="mb-4">Thank you for your application! We will review your submission and contact you if shortlisted.</p>
              <Button variant="primary" onClick={() => { setShowSuccess(false); resetForm(); navigate('/jobs') }}>Okay</Button>
            </div>
          </Modal>
        </Card>
      </div>
    </DashboardLayout>
  )
}
