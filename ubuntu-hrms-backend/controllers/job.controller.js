const Job = require('../models/Job.model');
const JobApplication = require('../models/JobApplication.model');
const User = require('../models/User.model');
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
      } = req.body;
      const jobId = req.params.id;
      const cvPath = req.file
        ? path.relative(path.join(__dirname, '../'), req.file.path).split(path.sep).join('/')
        : null;

      const applicationData = {
        applicationMode: applicationMode || 'scratch',
        workHistory: parseJsonField(workHistory, []),
        education: parseJsonField(education, []),
        references: parseJsonField(references, []),
        additionalInfo: additionalInfo || '',
      };

      const { rows } = await query(
        `INSERT INTO job_applications 
         (jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter, applicationData, user_id, status, appliedAt) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
        [jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter, applicationData, userId, 'pending']
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
};

module.exports = jobController;
