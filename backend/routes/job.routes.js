const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/roleMiddleware');
const upload = require('../middleware/cvUpload');

// 3.4.1 Job Posting CRUD (protected)
router.post('/', auth, role(['admin', 'manager', 'hr']), jobController.createJob);
router.get('/', auth, jobController.getJobs);
// 3.4.4 Available Jobs Listing (public)
router.get('/public/list', jobController.listOpenJobs);
router.get('/my-applications', auth, jobController.getMyApplications);

router.get('/:id', auth, jobController.getJob);
router.put('/:id', auth, role(['admin', 'manager', 'hr']), jobController.updateJob);
router.delete('/:id', auth, role(['admin', 'manager', 'hr']), jobController.deleteJob);

// 3.4.5 Application Submission (public, with CV upload)
router.post('/:id/apply', upload.single('cv'), jobController.applyToJob);

// 3.4.6 Application Review (manager/HR)
router.get('/:id/applications', auth, role(['admin', 'manager', 'hr']), jobController.getApplications);
router.put('/applications/:appId/status', auth, role(['admin', 'manager', 'hr']), jobController.updateApplicationStatus);
router.get('/:jobId/applicants/:appId', auth, role(['admin', 'manager', 'hr']), jobController.getApplicant);
router.put('/:jobId/applicants/:appId', auth, role(['admin', 'manager', 'hr']), jobController.updateApplicant);
router.delete('/:jobId/applicants/:appId', auth, role(['admin', 'manager', 'hr']), jobController.deleteApplicant);

// Applicant scoring
router.post('/:id/score-applicants', auth, role(['admin', 'manager', 'hr']), jobController.scoreApplicants);

// Import application data to employee profile
router.post('/applications/:appId/import-to-employee/:employeeId', auth, role(['admin', 'manager', 'hr']), jobController.importApplicationToEmployee);

module.exports = router;
