const { Pool } = require('pg');
const pool = require('../config/db').pool;


const PROFILE_TABLE = 'profiles';

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${PROFILE_TABLE} (
      id SERIAL PRIMARY KEY,
      userId INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      -- Personal Info
      fullName VARCHAR(255),
      photoUrl TEXT,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      dateOfBirth DATE,
      nationalId VARCHAR(100),
      emergencyContact JSONB,
      professionalHeadline TEXT,
      summary TEXT,

      -- Employment/HR Header
      employeeId VARCHAR(50),
      jobTitle VARCHAR(100),
      department VARCHAR(100),
      status VARCHAR(50),
      dateOfJoining DATE,
      employmentType VARCHAR(50),
      workLocation TEXT,
      reportingManager VARCHAR(100),

      -- Certifications (array of objects)
      certifications JSONB,

      -- Work History (array of objects)
      workHistory JSONB,

      -- Education (array of objects)
      education JSONB,

      -- Skills (array of objects: name, proficiency)
      skills JSONB,

      -- Projects/Portfolio (array of objects)
      projects JSONB,

      -- Awards & Recognitions (array of objects)
      awards JSONB,

      -- Languages (array of objects: name, proficiency)
      languages JSONB,

      -- Professional Memberships (array of objects)
      memberships JSONB,

      -- References (array of objects)
      "references" JSONB,

      -- Volunteer Experience (array of objects)
      volunteer JSONB,

      -- Publications (array of objects)
      publications JSONB,

      -- Interests (array of strings)
      interests TEXT[],

      -- HRMS-specific
      payroll JSONB,
      leaveInfo JSONB,
      contracts JSONB,
      performance JSONB,
      documents JSONB,

      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const Profile = {
  async createOrUpdate(userId, data) {
    const res = await pool.query(
      `INSERT INTO ${PROFILE_TABLE} (
        userId, fullName, photoUrl, email, phone, address, dateOfBirth, nationalId, emergencyContact, professionalHeadline, summary,
        employeeId, jobTitle, department, status, dateOfJoining, employmentType, workLocation, reportingManager,
        certifications, workHistory, education, skills, projects, awards, languages, memberships, "references", volunteer, publications, interests,
        payroll, leaveInfo, contracts, performance, documents, updatedAt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, CURRENT_TIMESTAMP
      )
      ON CONFLICT (userId) DO UPDATE SET
        fullName = EXCLUDED.fullName,
        photoUrl = EXCLUDED.photoUrl,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        dateOfBirth = EXCLUDED.dateOfBirth,
        nationalId = EXCLUDED.nationalId,
        emergencyContact = EXCLUDED.emergencyContact,
        professionalHeadline = EXCLUDED.professionalHeadline,
        summary = EXCLUDED.summary,
        employeeId = EXCLUDED.employeeId,
        jobTitle = EXCLUDED.jobTitle,
        department = EXCLUDED.department,
        status = EXCLUDED.status,
        dateOfJoining = EXCLUDED.dateOfJoining,
        employmentType = EXCLUDED.employmentType,
        workLocation = EXCLUDED.workLocation,
        reportingManager = EXCLUDED.reportingManager,
        certifications = EXCLUDED.certifications,
        workHistory = EXCLUDED.workHistory,
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        projects = EXCLUDED.projects,
        awards = EXCLUDED.awards,
        languages = EXCLUDED.languages,
        memberships = EXCLUDED.memberships,
        "references" = EXCLUDED."references",
        volunteer = EXCLUDED.volunteer,
        publications = EXCLUDED.publications,
        interests = EXCLUDED.interests,
        payroll = EXCLUDED.payroll,
        leaveInfo = EXCLUDED.leaveInfo,
        contracts = EXCLUDED.contracts,
        performance = EXCLUDED.performance,
        documents = EXCLUDED.documents,
        updatedAt = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId, data.fullName, data.photoUrl, data.email, data.phone, data.address, data.dateOfBirth, data.nationalId, toJsonb(data.emergencyContact, {}), data.professionalHeadline, data.summary,
        data.employeeId, data.jobTitle, data.department, data.status, data.dateOfJoining, data.employmentType, data.workLocation, data.reportingManager,
        data.certifications, toJsonb(data.workHistory, []), toJsonb(data.education, []), data.skills, toJsonb(data.projects, []), toJsonb(data.awards, []), toJsonb(data.languages, []), toJsonb(data.memberships, []), toJsonb(data.references, []), toJsonb(data.volunteer, []), toJsonb(data.publications, []), data.interests,
        toJsonb(data.payroll, {}), toJsonb(data.leaveInfo, {}), toJsonb(data.contracts, []), toJsonb(data.performance, {}), toJsonb(data.documents, [])
      ]
    );
    return res.rows[0];
  },
  async findByUserId(userId) {
    const res = await pool.query(`SELECT * FROM ${PROFILE_TABLE} WHERE userId = $1`, [userId]);
    return res.rows[0];
  },
  async init() {
    await createTable();
  },
};

module.exports = Profile;
