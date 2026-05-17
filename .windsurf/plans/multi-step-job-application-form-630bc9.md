# Multi-Step Job Application Form Implementation Plan

Implement a 7-part multi-step wizard job application form based on the provided design, replacing the existing single-page form with a structured data collection system that integrates with the onboarding process.

## Overview

The new form will collect comprehensive applicant data across 7 sections, store it in a structured format, and enable seamless data transfer to employee profiles during onboarding.

## Form Structure (7 Steps)

Based on the provided images:

1. **Personal Information**
   - First Name, Last Name
   - Date of Birth
   - Gender (dropdown)
   - Marital Status (dropdown)
   - Nationality (dropdown)
   - National ID Number
   - Phone Number
   - Email Address

2. **Address & Contact**
   - Residential Address (street, city, postal code)
   - Postal Address (if different)
   - Emergency Contact Name
   - Emergency Contact Phone
   - Emergency Contact Relationship

3. **Position Details**
   - Position Applied For (auto-populated from job)
   - Department (auto-populated from job)
   - Expected Salary
   - Date Available to Start
   - Type of Employment (auto-populated from job)
   - Willing to Relocate (yes/no)
   - Willing to Travel (yes/no)

4. **Education**
   - Primary Education (school, year completed, certificate)
   - Secondary Education (school, year completed, certificate, grade)
   - Further Education (dynamic list: institution, qualification, field of study, start year, end year)
   - Certifications (dynamic list: name, issuing body, date obtained, expiry date)

5. **Employment History**
   - Dynamic list of previous employment:
     - Company Name
     - Position/Role
     - Start Date
     - End Date
     - Reason for Leaving
     - Key Responsibilities/Duties
     - Salary (optional)

6. **References**
   - Dynamic list of references:
     - Name
     - Position/Title
     - Company/Organization
     - Phone Number
     - Email Address
     - Relationship to Applicant

7. **Skills & Declaration**
   - Languages Spoken (dynamic list: language, proficiency level)
   - Computer Skills (dynamic list: skill, proficiency level)
   - Other Skills (dynamic list)
   - Cover Letter/Statement of Interest
   - Declaration checkbox (confirm information is accurate)
   - Consent to background check (checkbox)
   - CV Upload (PDF/DOCX)
   - Signature (digital or typed name)

## Backend Changes

### 1. Update JobApplication Model

Add new columns to `job_applications` table:

```sql
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS personal_info JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS address_info JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS position_details JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS education JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employment_history JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS references JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS skills JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS declaration JSONB;
```

### 2. Update Employee Model

Add columns to `employees` table to store detailed applicant data:

```sql
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS residential_address JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS education_history JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_history JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certifications JSONB;
```

### 3. Create Application Import Helper

Add a function in `job.controller.js` to import application data to employee profile:

```javascript
async importApplicationToProfile(applicationId, employeeId) {
  const application = await JobApplication.findById(applicationId);
  const employee = await Employee.findById(employeeId);
  
  // Map application data to employee fields
  const updateData = {
    dateOfBirth: application.personalInfo.dateOfBirth,
    gender: application.personalInfo.gender,
    maritalStatus: application.personalInfo.maritalStatus,
    nationality: application.personalInfo.nationality,
    nationalId: application.personalInfo.nationalId,
    residentialAddress: application.addressInfo.residentialAddress,
    emergencyContact: application.addressInfo.emergencyContact,
    educationHistory: application.education,
    employmentHistory: application.employmentHistory,
    skills: application.skills,
    certifications: application.education.certifications
  };
  
  return await Employee.findByIdAndUpdate(employeeId, updateData);
}
```

### 4. Update Job Controller

Add endpoint to import application data:
```javascript
router.post('/applications/:id/import-to-employee/:employeeId', authMiddleware, roleMiddleware(['admin', 'manager', 'owner']), jobController.importApplicationToEmployee);
```

## Frontend Changes

### 1. Create Multi-Step Wizard Component

Create new file: `src/pages/recruitment/MultiStepJobApplicationForm.jsx`

Features:
- Step indicator showing current step (1-7)
- Progress bar
- Next/Back navigation
- Form validation per step
- Save draft functionality (localStorage or API)
- Auto-save on step completion
- Review step before final submission

### 2. Step Components

Create individual step components for better organization:
- `Step1_PersonalInfo.jsx`
- `Step2_Address.jsx`
- `Step3_Position.jsx`
- `Step4_Education.jsx`
- `Step5_EmploymentHistory.jsx`
- `Step6_References.jsx`
- `Step7_SkillsDeclaration.jsx`

### 3. Replace Existing Form

Replace `JobApplicationForm.jsx` with the new multi-step wizard:
- Keep the same route
- Maintain backward compatibility with existing applications
- Update the form submission handler to send structured JSON data

### 4. Update Onboarding Flow

Modify `src/pages/onboarding/index.jsx` to:
- Add "Import from Application" button when applicationId is present
- Call the new import endpoint
- Pre-fill employee profile with application data
- Allow manual editing after import

## Data Structure

### Application Data Format

```javascript
{
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: String (ISO date),
    gender: String,
    maritalStatus: String,
    nationality: String,
    nationalId: String,
    phone: String,
    email: String
  },
  addressInfo: {
    residentialAddress: {
      street: String,
      city: String,
      postalCode: String
    },
    postalAddress: {
      street: String,
      city: String,
      postalCode: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  positionDetails: {
    position: String,
    department: String,
    expectedSalary: String,
    dateAvailable: String (ISO date),
    employmentType: String,
    willingToRelocate: Boolean,
    willingToTravel: Boolean
  },
  education: {
    primary: {
      school: String,
      yearCompleted: String,
      certificate: String
    },
    secondary: {
      school: String,
      yearCompleted: String,
      certificate: String,
      grade: String
    },
    furtherEducation: [{
      institution: String,
      qualification: String,
      fieldOfStudy: String,
      startYear: String,
      endYear: String
    }],
    certifications: [{
      name: String,
      issuingBody: String,
      dateObtained: String,
      expiryDate: String
    }]
  },
  employmentHistory: [{
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    reasonForLeaving: String,
    duties: String,
    salary: String
  }],
  references: [{
    name: String,
    position: String,
    company: String,
    phone: String,
    email: String,
    relationship: String
  }],
  skills: {
    languages: [{
      language: String,
      proficiency: String
    }],
    computerSkills: [{
      skill: String,
      proficiency: String
    }],
    otherSkills: [String]
  },
  declaration: {
    coverLetter: String,
    declarationConfirmed: Boolean,
    backgroundCheckConsent: Boolean,
    signature: String
  }
}
```

## Implementation Steps

1. **Backend Schema Updates**
   - Update `config/db.js` to add new columns to job_applications table
   - Update `config/db.js` to add new columns to employees table
   - Run migration script

2. **Backend API Updates**
   - Update `models/JobApplication.model.js` to handle new JSONB fields
   - Update `models/Employee.model.js` to handle new fields
   - Add import function in `controllers/job.controller.js`
   - Add route in `routes/job.routes.js`

3. **Frontend Component Creation**
   - Create `MultiStepJobApplicationForm.jsx` with wizard structure
   - Create 7 step components
   - Implement state management for multi-step form
   - Add validation per step

4. **Frontend Integration**
   - Replace `JobApplicationForm.jsx` with new multi-step form
   - Update routing if needed
   - Test form submission

5. **Onboarding Integration**
   - Update onboarding page to show application data
   - Add import button
   - Test data flow from application to employee profile

6. **Testing**
   - Test multi-step form navigation
   - Test form validation
   - Test data submission
   - Test application to employee profile import
   - Test with existing applications (backward compatibility)

## Files to Modify

### Backend
- `config/db.js` - Add new columns to tables
- `models/JobApplication.model.js` - Handle new JSONB fields
- `models/Employee.model.js` - Handle new fields
- `controllers/job.controller.js` - Add import function
- `routes/job.routes.js` - Add import route

### Frontend
- `src/pages/recruitment/JobApplicationForm.jsx` - Replace with multi-step form
- `src/pages/recruitment/MultiStepJobApplicationForm.jsx` - New file
- `src/pages/recruitment/steps/` - New directory for step components
- `src/pages/onboarding/index.jsx` - Add import functionality

## Notes

- Use dynamic settings for dropdowns (gender, marital status, nationality) from the settings system
- Implement draft saving to localStorage for better UX
- Add progress indicator to show completion status
- Ensure mobile responsiveness for all steps
- Add file upload validation for CV
- Consider adding a review step before final submission
