#!/usr/bin/env node

/**
 * Document Seeding Script
 * Creates sample documents for testing leave requests with attachments (maternity, paternity, etc.)
 * Usage: node scripts/seed-documents.js
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads/leave_docs');
const cvDir = path.join(__dirname, '../uploads/cvs');

// Create directories if they don't exist
function ensureDirectoriesExist() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created directory: ${uploadsDir}`);
  } else {
    console.log(`📁 Directory exists: ${uploadsDir}`);
  }

  if (!fs.existsSync(cvDir)) {
    fs.mkdirSync(cvDir, { recursive: true });
    console.log(`✅ Created directory: ${cvDir}`);
  } else {
    console.log(`📁 Directory exists: ${cvDir}`);
  }
}

/**
 * Create sample PDF content (simple text-based PDF)
 * For production, replace with actual PDF files
 */
function createSamplePDFContent() {
  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
50 700 Td
(SAMPLE DOCUMENTATION) Tj
0 -30 Td
(This is a sample document for testing.) Tj
0 -20 Td
(Date: 2024-01-15) Tj
0 -20 Td
(Status: Approved) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000273 00000 n 
0000000521 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
625
%%EOF
`, 'latin1');
}

/**
 * Create sample documents for different leave types
 */
function createSampleDocuments() {
  const documents = [
    {
      name: 'maternity_certification_001.pdf',
      type: 'Maternity Certificate',
      description: 'Medical certification for maternity leave',
    },
    {
      name: 'paternity_birth_cert_001.pdf',
      type: 'Birth Certificate',
      description: 'Birth certificate for paternity leave',
    },
    {
      name: 'medical_report_001.pdf',
      type: 'Medical Report',
      description: 'Doctor\'s medical report for sick leave documentation',
    },
    {
      name: 'death_cert_001.pdf',
      type: 'Death Certificate',
      description: 'Death certificate for compassionate leave',
    },
    {
      name: 'cv_john_smith.pdf',
      type: 'Curriculum Vitae',
      description: 'CV for job application',
    },
    {
      name: 'cv_jane_doe.pdf',
      type: 'Curriculum Vitae',
      description: 'CV for job application',
    },
    {
      name: 'employment_letter.pdf',
      type: 'Employment Letter',
      description: 'Offer letter for new employee',
    },
    {
      name: 'contract_agreement.pdf',
      type: 'Contract',
      description: 'Employment contract agreement',
    },
    {
      name: 'performance_review.pdf',
      type: 'Performance Review',
      description: 'Annual performance review document',
    },
    {
      name: 'training_certificate.pdf',
      type: 'Training Certificate',
      description: 'Professional training certificate',
    },
    {
      name: 'passport_scan.pdf',
      type: 'Identification',
      description: 'Scanned passport for employee records',
    },
    {
      name: 'nida_scan.pdf',
      type: 'Identification',
      description: 'Scanned National ID for employee records',
    },
    {
      name: 'tax_certificate.pdf',
      type: 'Tax Document',
      description: 'Tax compliance certificate',
    },
    {
      name: 'insurance_form.pdf',
      type: 'Insurance',
      description: 'Insurance enrollment form',
    },
    {
      name: 'benefits_enrollment.pdf',
      type: 'Benefits',
      description: 'Employee benefits enrollment document',
    },
  ];

  const pdfContent = createSamplePDFContent();

  documents.forEach((doc, index) => {
    let directory = uploadsDir;
    
    // Put CV samples in cvs folder
    if (doc.type === 'Curriculum Vitae') {
      directory = cvDir;
    }

    const filePath = path.join(directory, doc.name);
    
    try {
      fs.writeFileSync(filePath, pdfContent);
      console.log(`✅ Created: ${path.relative(__dirname, filePath)}`);
    } catch (err) {
      console.error(`❌ Error creating ${doc.name}:`, err.message);
    }
  });

  console.log(`\n✨ Created ${documents.length} sample documents`);
}

/**
 * Create a README for the uploads directory
 */
function createDocumentationReadme() {
  const readme = `# Sample Documents Directory

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
4. Run \`node scripts/seed-documents.js\` to regenerate the sample documents

## File Size Limits

- Maximum file size: 10MB per document
- Allowed formats: PDF, JPG, PNG

Generated: ${new Date().toISOString()}
`;

  try {
    fs.writeFileSync(path.join(uploadsDir, '..', 'README.md'), readme);
    console.log('\n✅ Created README.md for uploads directory');
  } catch (err) {
    console.error('❌ Error creating README:', err.message);
  }
}

// Main execution
console.log('🌱 Starting document seeding...\n');

ensureDirectoriesExist();
console.log('\n📄 Creating sample documents...');
createSampleDocuments();
createDocumentationReadme();

console.log('\n✨ Document seeding completed!');
console.log('\n📂 Sample documents ready at:');
console.log(`   - Leave documents: uploads/leave_docs/`);
console.log(`   - CV documents: uploads/cvs/`);
