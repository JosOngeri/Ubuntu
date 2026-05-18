# Sample Documents Directory

This directory contains sample documents used for testing the HRMS application.

## Document Types

### Leave Documentation
- **maternity_certification_*.pdf** - Medical certificates for maternity leave requests
- **paternity_birth_cert_*.pdf** - Birth certificates for paternity leave requests
- **medical_report_*.pdf** - Medical reports for sick leave documentation
- **death_cert_*.pdf** - Death certificates for compassionate leave requests

### Employee Documents
- **cv_*.pdf** - Curriculum Vitae files for job applications
- **passport_scan.pdf** - Scanned passport for employee records
- **nida_scan.pdf** - Scanned National ID for employee records

### HR Documents
- **employment_letter.pdf** - Employment offer letters
- **contract_agreement.pdf** - Employment contracts
- **performance_review.pdf** - Performance review documents
- **training_certificate.pdf** - Professional training certificates

### Benefits & Finance
- **insurance_form.pdf** - Insurance enrollment forms
- **tax_certificate.pdf** - Tax compliance certificates
- **benefits_enrollment.pdf** - Benefits enrollment documents

## Usage

These documents are used during:
1. **Leave Requests** - When employees submit leave requests requiring documentation (maternity, paternity)
2. **Job Applications** - When applicants submit CVs
3. **Employee Onboarding** - When processing employee documents

## Adding Real Documents

To use real documents in production:
1. Replace the sample PDFs with actual scanned documents
2. Ensure files are in PDF or allowed formats
3. Update file paths in the seeding scripts as needed
4. Run `node scripts/seed-documents.js` to regenerate the sample documents

## File Size Limits

- Maximum file size: 10MB per document
- Allowed formats: PDF, JPG, PNG

Generated: 2026-05-07T11:46:28.502Z
