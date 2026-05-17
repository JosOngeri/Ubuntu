const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Job = require('../models/Job.model');

const advertisementController = {
  async uploadLetterhead(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
      }

      const letterheadPath = path.join(__dirname, '../public/letterhead.png');
      
      // Ensure public directory exists
      const publicDir = path.join(__dirname, '../public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Copy uploaded file to letterhead location
      fs.copyFileSync(req.file.path, letterheadPath);

      // Clean up temp file
      fs.unlinkSync(req.file.path);

      res.json({ success: true, message: 'Letterhead uploaded successfully' });
    } catch (err) {
      console.error('Letterhead upload error:', err);
      res.status(500).json({ msg: 'Failed to upload letterhead', error: err.message });
    }
  },

  async generateAdvertisement(req, res) {
    try {
      const { jobId } = req.params;
      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ msg: 'Job not found' });
      }

      const adData = job.advertisementData || {};
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const pdfPath = path.join(__dirname, '../tmp', `job-ad-${jobId}.pdf`);
      
      // Ensure tmp directory exists
      const tmpDir = path.join(__dirname, '../tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Pipe PDF to file
      doc.pipe(fs.createWriteStream(pdfPath));

      // Add letterhead image if provided
      const letterheadPath = path.join(__dirname, '../public/letterhead.png');
      if (fs.existsSync(letterheadPath)) {
        doc.image(letterheadPath, 50, 50, { width: 500, align: 'center' });
        doc.moveDown(3);
      }

      // Title
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e3a5f')
        .text(job.title, { align: 'center' });
      doc.moveDown(1);

      // Key Job Details box
      doc.fontSize(12).font('Helvetica').fillColor('#333');
      doc.rect(50, doc.y, 500, 80).fill('#f8f9fa');
      doc.fillColor('#333');
      doc.text('Key Job Details', 60, doc.y - 70, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Role: ${adData.role || job.title}`, 60);
      doc.text(`Location: ${job.location}`, 60);
      doc.text(`Vacancies: ${adData.vacancies || 'Not specified'}`, 60);
      doc.text(`Gender: ${adData.gender || 'Equal Opportunity'}`, 60);
      doc.text(`Application Deadline: ${new Date(job.applicationDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 60);
      doc.moveDown(1);

      // Introduction
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f')
        .text('Introduction');
      doc.fontSize(11).font('Helvetica').fillColor('#333')
        .text(job.description || adData.introduction || '', { align: 'justify' });
      doc.moveDown(1);

      // Responsibilities
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f')
        .text('Your Responsibilities');
      doc.fontSize(11).font('Helvetica').fillColor('#333');
      const responsibilities = (job.responsibilities || adData.responsibilities || '').split('\n').filter(r => r.trim());
      responsibilities.forEach((resp, idx) => {
        doc.text(`${idx + 1}. ${resp.trim()}`, { continued: false });
      });
      doc.moveDown(1);

      // Required Skills
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f')
        .text('Required Skills and Experience');
      doc.fontSize(11).font('Helvetica').fillColor('#333');
      const skills = (job.requirements || adData.requiredSkills || '').split('\n').filter(s => s.trim());
      skills.forEach((skill, idx) => {
        doc.text(`${idx + 1}. ${skill.trim()}`, { continued: false });
      });
      doc.moveDown(1);

      // Salary and Benefits
      if (job.salaryRange) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f')
          .text('Salary Range');
        doc.fontSize(11).font('Helvetica').fillColor('#333')
          .text(job.salaryRange);
        doc.moveDown(1);
      }

      if (job.benefits) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f')
          .text('Benefits');
        doc.fontSize(11).font('Helvetica').fillColor('#333')
          .text(job.benefits);
        doc.moveDown(1);
      }

      // Apply section
      doc.rect(50, doc.y, 500, 50).fill('#1e3a5f');
      doc.fillColor('#fff').fontSize(14).font('Helvetica-Bold')
        .text('Apply Now', { align: 'center' });
      doc.fillColor('#fff').fontSize(11).font('Helvetica')
        .text('Visit our careers portal to apply online', { align: 'center' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(9).font('Helvetica').fillColor('#666')
        .text('Generated by Ubuntu HRMS', { align: 'center' });

      doc.end();

      // Wait for PDF to finish writing
      doc.on('end', async () => {
        // Generate JPEG from PDF
        const jpegPath = path.join(__dirname, '../tmp', `job-ad-${jobId}.jpeg`);
        await sharp(pdfPath)
          .resize(1200, 1697, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
          .jpeg({ quality: 90 })
          .toFile(jpegPath);

        res.json({
          success: true,
          pdfUrl: `/api/advertisements/download/${jobId}/pdf`,
          jpegUrl: `/api/advertisements/download/${jobId}/jpeg`
        });
      });
    } catch (err) {
      console.error('Advertisement generation error:', err);
      res.status(500).json({ msg: 'Failed to generate advertisement', error: err.message });
    }
  },

  async downloadAdvertisement(req, res) {
    try {
      const { jobId, format } = req.params;
      const ext = format === 'jpeg' ? 'jpeg' : 'pdf';
      const filePath = path.join(__dirname, '../tmp', `job-ad-${jobId}.${ext}`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ msg: 'Advertisement file not found' });
      }

      res.download(filePath, `job-advertisement.${ext}`);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to download advertisement', error: err.message });
    }
  }
};

module.exports = advertisementController;
