const Job = require('../models/Job.model');
const JobApplication = require('../models/JobApplication.model');
const User = require('../models/User.model');
const Employee = require('../models/Employee.model');
const path = require('path');
const { query } = require('../config/db');

const parseJsonField = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const jobController = {
  // 3.4.1 Job Posting CRUD
  async createJob(req, res) {
    try {
      const job = await Job.create({ ...req.body, postedBy: req.user?.id });
      res.status(201).json(job);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to create job', error: err.message });
    }
  },
  async getJobs(req, res) {
    try {
      const onlyOpen = req.query.open === 'true';
      const jobs = await Job.findAll({ onlyOpen });
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch jobs', error: err.message });
    }
  },
  async getJob(req, res) {
    try {
      if (!/^\d+$/.test(String(req.params.id))) {
        return res.status(404).json({ msg: 'Job not found' });
      }
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ msg: 'Job not found' });
      res.json(job);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch job', error: err.message });
    }
  },
  async updateJob(req, res) {
    try {
      const job = await Job.update(req.params.id, req.body);
      res.json(job);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update job', error: err.message });
    }
  },
  async deleteJob(req, res) {
    try {
      await Job.delete(req.params.id);
      res.json({ msg: 'Job deleted' });
    } catch (err) {
      res.status(400).json({ msg: 'Failed to delete job', error: err.message });
    }
  },

  // 3.4.4 Available Jobs Listing (public)
  async listOpenJobs(req, res) {
    try {
      const jobs = await Job.findAll({ onlyOpen: true });
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch open jobs', error: err.message });
    }
  },

  // 3.4.5 Application Submission
  async applyToJob(req, res) {
    try {
      const userId = req.user?.id || null;
      const {
        applicantName,
        applicantEmail,
        applicantPhone,
        coverLetter,
        applicationMode,
        workHistory,
        education,
        references,
        additionalInfo,
        personal_info,
        address_info,
        position_details,
        employment_history,
        skills,
        declaration,
      } = req.body;
      const jobId = req.params.id;
      const cvPath = req.file
        ? path.relative(path.join(__dirname, '../'), req.file.path).split(path.sep).join('/')
        : null;

      // Validation
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ msg: 'Job not found' });

      // Check if job is still open
      const now = new Date();
      if (job.applicationClosingDate && new Date(job.applicationClosingDate) < now) {
        return res.status(400).json({ msg: 'Application deadline has passed' });
      }

      // Validate date of birth (must be at least 18 years ago)
      if (personal_info && personal_info.dateOfBirth) {
        const dob = new Date(personal_info.dateOfBirth);
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
        if (dob > minAgeDate) {
          return res.status(400).json({ msg: 'Applicant must be at least 18 years old' });
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (applicantEmail && !emailRegex.test(applicantEmail)) {
        return res.status(400).json({ msg: 'Invalid email format' });
      }

      const applicationData = {
        applicationMode: applicationMode || 'structured',
        workHistory: parseJsonField(workHistory, []),
        education: parseJsonField(education, []),
        references: parseJsonField(references, []),
        additionalInfo: additionalInfo || '',
      };

      const { rows } = await query(
        `INSERT INTO job_applications 
         (jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter, applicationData, user_id, status, appliedAt, personal_info, address_info, position_details, education, employment_history, skills, declaration) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter || null, applicationData, userId, 'pending',
         toJsonb(personal_info, null),
         toJsonb(address_info, null),
         toJsonb(position_details, null),
         toJsonb(education, null),
         toJsonb(employment_history, null),
         toJsonb(skills, null),
         toJsonb(declaration, null)]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to apply', error: err.message });
    }
  },

  // 3.4.6 Application Review (manager)
  async getApplications(req, res) {
    try {
      const jobId = req.params.id;
      const applications = await JobApplication.findByJob(jobId);
      res.json(applications);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch applications', error: err.message });
    }
  },

  async getMyApplications(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

      // Fallback: check if the user is an employee and has an email there
      const { rows: userRows } = await query(
        `SELECT u.email as user_email, e.email as employee_email 
         FROM users u 
         LEFT JOIN employees e ON e.user_id = u.id 
         WHERE u.id = $1`,
        [userId]
      );
      const email = userRows[0]?.user_email || userRows[0]?.employee_email;

      // Fetch applications matching user_id OR their registered email
      const queryText = email
        ? `SELECT * FROM job_applications WHERE user_id = $1 OR LOWER(applicantEmail) = LOWER($2) ORDER BY appliedAt DESC`
        : `SELECT * FROM job_applications WHERE user_id = $1 ORDER BY appliedAt DESC`;
      
      const params = email ? [userId, email] : [userId];
      const { rows } = await query(queryText, params);

      // Automatically link unlinked applications found by email
      if (email) {
        const unlinkedIds = rows.filter(r => !r.user_id).map(r => r.id);
        if (unlinkedIds.length > 0) {
          await query(
            `UPDATE job_applications SET user_id = $1, linked_via = 'login_fetch', linked_at = NOW() WHERE id = ANY($2::int[])`,
            [userId, unlinkedIds]
          ).catch(err => console.warn('Failed to backfill application links:', err));
        }
      }

      res.json(rows);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch your applications', error: err.message });
    }
  },
  async updateApplicationStatus(req, res) {
    try {
      const { status, recruiterAnnouncement } = req.body;
      const updates = {};
      if (status !== undefined) updates.status = status;
      if (recruiterAnnouncement !== undefined) updates.recruiterAnnouncement = recruiterAnnouncement;
      const application = await JobApplication.update(req.params.appId, updates);
      res.json(application);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update application', error: err.message });
    }
  },

  async getApplicant(req, res) {
    try {
      const application = await JobApplication.findById(req.params.appId);
      if (!application || String(application.jobId) !== String(req.params.jobId)) {
        return res.status(404).json({ msg: 'Application not found' });
      }
      res.json(application);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch application', error: err.message });
    }
  },

  async updateApplicant(req, res) {
    try {
      const { status, recruiterAnnouncement } = req.body;
      const existing = await JobApplication.findById(req.params.appId);
      if (!existing || String(existing.jobId) !== String(req.params.jobId)) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      const updates = {};
      if (status) updates.status = status;
      if (recruiterAnnouncement !== undefined) updates.recruiterAnnouncement = recruiterAnnouncement;

      const updated = await JobApplication.update(req.params.appId, updates);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update application', error: err.message });
    }
  },

  async deleteApplicant(req, res) {
    try {
      const existing = await JobApplication.findById(req.params.appId);
      if (!existing || String(existing.jobId) !== String(req.params.jobId)) {
        return res.status(404).json({ msg: 'Application not found' });
      }
      await JobApplication.delete(req.params.appId);
      res.json({ msg: 'Application deleted' });
    } catch (err) {
      res.status(400).json({ msg: 'Failed to delete application', error: err.message });
    }
  },

  async shortlistApplication(req, res) {
    try {
      const applicationId = req.params.appId;
      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const updated = await JobApplication.update(applicationId, {
        status: 'shortlisted',
        interview_status: 'scheduled',
        interview_date: new Date(),
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to shortlist application', error: err.message });
    }
  },

  async updateInterviewScore(req, res) {
    try {
      const { score, notes } = req.body;
      const applicationId = req.params.appId;
      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const updated = await JobApplication.update(applicationId, {
        interview_score: score,
        interview_notes: notes,
        interview_status: 'completed',
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to update interview score', error: err.message });
    }
  },

  async validateOffer(req, res) {
    try {
      const { token } = req.body;
      const application = await JobApplication.findByOfferToken(token);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer token' });
      }

      if (application.offer_status === 'accepted') {
        return res.status(400).json({ msg: 'Offer has already been accepted' });
      }

      res.json(application);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to validate offer', error: err.message });
    }
  },

  async acceptOffer(req, res) {
    try {
      const { token } = req.body;
      const application = await JobApplication.findByOfferToken(token);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer token' });
      }

      const applicantPhone = application.applicantPhone;
      const applicantNationalId = application.personalInfo?.nationalId;

      if (!applicantPhone && !applicantNationalId) {
        return res.status(400).json({ msg: 'No phone or national ID found for verification' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_accepted',
        offer_status: 'accepted',
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to accept offer', error: err.message });
    }
  },

  async acceptOfferWithVerification(req, res) {
    try {
      const { offerToken, verificationToken } = req.body;
      const application = await JobApplication.findByOfferToken(offerToken);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer link' });
      }

      const applicantPhone = application.applicantPhone;
      const applicantNationalId = application.personalInfo?.nationalId;

      const phoneLast4 = applicantPhone ? applicantPhone.slice(-4) : null;
      const nationalIdLast4 = applicantNationalId ? applicantNationalId.slice(-4) : null;

      if (verificationToken !== phoneLast4 && verificationToken !== nationalIdLast4) {
        return res.status(400).json({ msg: 'Invalid verification token' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_accepted',
        offer_status: 'accepted',
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to accept offer', error: err.message });
    }
  },

  async negotiateSalary(req, res) {
    try {
      const { token, counterOfferSalary } = req.body;
      const application = await JobApplication.findByOfferToken(token);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer token' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_sent',
        offer_status: 'negotiating',
        counter_offer_salary: counterOfferSalary,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to negotiate salary', error: err.message });
    }
  },

  async negotiateSalaryWithVerification(req, res) {
    try {
      const { offerToken, verificationToken, counterOfferSalary } = req.body;
      const application = await JobApplication.findByOfferToken(offerToken);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer link' });
      }

      const applicantPhone = application.applicantPhone;
      const applicantNationalId = application.personalInfo?.nationalId;

      const phoneLast4 = applicantPhone ? applicantPhone.slice(-4) : null;
      const nationalIdLast4 = applicantNationalId ? applicantNationalId.slice(-4) : null;

      if (verificationToken !== phoneLast4 && verificationToken !== nationalIdLast4) {
        return res.status(400).json({ msg: 'Invalid verification token' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_sent',
        offer_status: 'negotiating',
        counter_offer_salary: counterOfferSalary,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to negotiate salary', error: err.message });
    }
  },

  async extendDeadline(req, res) {
    try {
      const { newDeadline } = req.body;
      const jobId = req.params.id;

      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ msg: 'Job not found' });

      const updated = await Job.update(jobId, {
        applicationDeadline: newDeadline,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to extend deadline', error: err.message });
    }
  },

  async sendOffer(req, res) {
    try {
      const { offerAmount } = req.body;
      const applicationId = req.params.appId;
      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const crypto = require('crypto');
      const offerToken = crypto.randomBytes(32).toString('hex');

      const updated = await JobApplication.update(applicationId, {
        status: 'offer_sent',
        offered_salary: offerAmount,
        offer_token: offerToken,
        offer_sent_at: new Date(),
        offer_status: 'pending',
      });

      // Send email to applicant
      const { sendEmail } = require('../utils/email');
      const offerLink = `${process.env.FRONTEND_URL || 'http://localhost:5177'}/offer-response?token=${offerToken}`;
      await sendEmail({
        to: application.applicantEmail,
        subject: 'Job Offer - Ubuntu HRMS',
        text: `Dear ${application.applicantName},\n\nWe are pleased to offer you the position. Please review the offer details at: ${offerLink}\n\nSalary Offer: ${offerAmount}\n\nYou can accept the offer or negotiate the salary through the link above.`,
        html: `<p>Dear ${application.applicantName},</p><p>We are pleased to offer you the position.</p><p><strong>Salary Offer:</strong> ${offerAmount}</p><p>Please review the offer details at: <a href="${offerLink}">${offerLink}</a></p><p>You can accept the offer or negotiate the salary through the link above.</p>`,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to send offer', error: err.message });
    }
  },

  async filterApplicants(req, res) {
    try {
      const { jobId } = req.params;
      const { filters } = req.body;

      const applications = await JobApplication.findByJob(jobId);
      const job = await Job.findById(jobId);

      let filtered = applications;

      if (filters && Array.isArray(filters)) {
        filtered = applications.filter(app => {
          const personalInfo = app.personalInfo || {};
          const addressInfo = app.addressInfo || {};
          const positionDetails = app.positionDetails || {};
          const education = app.education || {};
          const employmentHistory = app.employmentHistory || [];
          const skills = app.skills || {};

          return filters.every(filter => {
            const { field, operator, value } = filter;

            switch (field) {
              case 'gender':
                if (operator === 'equals') return personalInfo.gender === value;
                if (operator === 'not_equals') return personalInfo.gender !== value;
                return false;

              case 'nationality':
                if (operator === 'equals') return personalInfo.nationality === value;
                if (operator === 'not_equals') return personalInfo.nationality !== value;
                return false;

              case 'age':
                const dob = personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : null;
                if (!dob) return false;
                const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
                if (operator === 'gte') return age >= value;
                if (operator === 'lte') return age <= value;
                if (operator === 'equals') return age === value;
                return false;

              case 'location':
                const city = addressInfo.residentialAddress?.city || '';
                if (operator === 'equals') return city.toLowerCase() === value.toLowerCase();
                if (operator === 'contains') return city.toLowerCase().includes(value.toLowerCase());
                return false;

              case 'willingToRelocate':
                return positionDetails.willingToRelocate === value;

              case 'willingToTravel':
                return positionDetails.willingToTravel === value;

              case 'expectedSalary':
                const salary = parseFloat(positionDetails.expectedSalary) || 0;
                const filterSalary = parseFloat(value) || 0;
                if (operator === 'lte') return salary <= filterSalary;
                if (operator === 'gte') return salary >= filterSalary;
                return false;

              case 'qualification':
                const qualifications = education.furtherEducation || [];
                const hasQualification = qualifications.some(edu => 
                  edu.qualification?.toLowerCase() === value.toLowerCase()
                );
                return hasQualification;

              case 'yearsExperience':
                const totalYears = employmentHistory.reduce((sum, work) => {
                  if (work.startDate && work.endDate) {
                    const start = new Date(work.startDate);
                    const end = new Date(work.endDate);
                    return sum + (end.getFullYear() - start.getFullYear());
                  }
                  return sum;
                }, 0);
                if (operator === 'gte') return totalYears >= value;
                if (operator === 'lte') return totalYears <= value;
                return false;

              case 'hasCertifications':
                const certs = education.certifications || [];
                return certs.length > 0;

              case 'language':
                const languages = skills.languages || [];
                return languages.some(lang => 
                  lang.language?.toLowerCase().includes(value.toLowerCase())
                );

              default:
                return true;
            }
          });
        });
      }

      res.json(filtered);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to filter applicants', error: err.message });
    }
  },

  async scoreApplicants(req, res) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ msg: 'Job not found' });

      const applications = await JobApplication.findByJob(req.params.id);
      const evalParams = job.evaluationParams || {};
      const keywords = evalParams.keywords || [];
      const criteria = evalParams.criteria || [];

      const scored = applications.map(app => {
        const appData = app.applicationData || {};
        const workHistory = appData.workHistory || [];
        const education = appData.education || [];
        const coverLetter = app.coverLetter || '';

        // Build searchable text
        const workText = workHistory.map(w => `${w.role||''} ${w.company||''} ${w.description||''}`).join(' ');
        const eduText = education.map(e => `${e.institution||''} ${e.qualification||''} ${e.fieldOfStudy||''}`).join(' ');
        const searchText = `${workText} ${eduText} ${coverLetter}`.toLowerCase();

        // Keyword scoring (40%)
        let keywordScore = 0;
        const keywordMatches = [];
        keywords.forEach(kw => {
          const regex = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = (searchText.match(regex) || []).length;
          if (matches > 0) keywordMatches.push({ keyword: kw, matches });
          keywordScore += matches * 10;
        });
        keywordScore = Math.min(100, keywordScore);

        // Criteria scoring (60%)
        let criteriaScore = 0;
        let totalWeight = 0;
        const criteriaResults = [];
        criteria.forEach(c => {
          let met = false;
          if (c.name === 'yearsExperience') {
            const totalYears = workHistory.reduce((sum, w) => {
              if (w.startDate && w.endDate) {
                return sum + (new Date(w.endDate).getFullYear() - new Date(w.startDate).getFullYear());
              }
              return sum;
            }, 0);
            met = c.operator === '>=' ? totalYears >= (c.value || 0) : totalYears <= (c.value || 0);
            criteriaResults.push({ name: c.name, label: c.label, met, detail: `${totalYears} years` });
          } else if (c.name === 'hasDegree') {
            met = education.some(e => ['degree','bachelor','master','phd','diploma'].includes((e.qualification||'').toLowerCase()));
            criteriaResults.push({ name: c.name, label: c.label, met });
          } else if (c.name === 'hasCertification') {
            const otherQuals = appData.otherQualifications || [];
            met = otherQuals.length > 0;
            criteriaResults.push({ name: c.name, label: c.label, met, detail: `${otherQuals.length} certifications` });
          } else {
            criteriaResults.push({ name: c.name, label: c.label, met: false });
          }
          if (met) criteriaScore += (c.weight || 5);
          totalWeight += (c.weight || 5);
        });
        criteriaScore = totalWeight > 0 ? Math.round((criteriaScore / totalWeight) * 100) : 0;

        const autoScore = Math.round((keywordScore * 0.4) + (criteriaScore * 0.6));
        return {
          applicationId: app.id,
          applicantName: app.applicantName,
          applicantEmail: app.applicantEmail,
          autoScore,
          keywordScore,
          criteriaScore,
          keywordMatches,
          criteriaResults,
        };
      });

      scored.sort((a, b) => b.autoScore - a.autoScore);

      // Save scores to DB
      for (const scoredApp of scored) {
        await JobApplication.update(scoredApp.applicationId, {
          autoScore: scoredApp.autoScore,
          scoreBreakdown: {
            keywordScore: scoredApp.keywordScore,
            criteriaScore: scoredApp.criteriaScore,
            keywordMatches: scoredApp.keywordMatches,
            criteriaResults: scoredApp.criteriaResults,
          },
        });
      }

      res.json(scored);
    } catch (err) {
      res.status(500).json({ msg: 'Scoring failed', error: err.message });
    }
  },

  async importApplicationToEmployee(req, res) {
    try {
      const { appId, employeeId } = req.params;

      const application = await JobApplication.findById(appId);
      if (!application) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' });
      }

      // Map application data to employee fields
      const updateData = {};

      if (application.personalInfo) {
        updateData.dateOfBirth = application.personalInfo.dateOfBirth;
        updateData.gender = application.personalInfo.gender;
        updateData.maritalStatus = application.personalInfo.maritalStatus;
        updateData.nationality = application.personalInfo.nationality;
        updateData.nationalId = application.personalInfo.nationalId;
      }

      if (application.addressInfo) {
        updateData.residentialAddress = application.addressInfo.residentialAddress;
        updateData.emergencyContact = application.addressInfo.emergencyContact;
      }

      if (application.education) {
        updateData.educationHistory = application.education;
        updateData.certifications = application.education.certifications || [];
      }

      if (application.employmentHistory) {
        updateData.employmentHistory = application.employmentHistory;
      }

      if (application.skills) {
        updateData.skills = application.skills;
      }

      const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData);

      res.json({
        msg: 'Application data imported successfully',
        employee: updatedEmployee,
      });
    } catch (err) {
      res.status(500).json({ msg: 'Import failed', error: err.message });
    }
  },
};

module.exports = jobController;
