const { Pool } = require('pg');
const path = require('path');

const pool = require('../config/db').pool;

const JOB_APPLICATION_TABLE = 'job_applications';
const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const APPLICATION_SELECT_COLUMNS = `
  id,
  user_id AS "userId",
  jobid AS "jobId",
  applicantname AS "applicantName",
  applicantemail AS "applicantEmail",
  applicantphone AS "applicantPhone",
  cvpath AS "cvPath",
  status,
  appliedat AS "appliedAt",
  coverletter AS "coverLetter",
  applicationdata AS "applicationData",
  recruiterannouncement AS "recruiterAnnouncement",
  auto_score AS "autoScore",
  manual_score AS "manualScore",
  score_breakdown AS "scoreBreakdown",
  reviewer_notes AS "reviewerNotes",
  personal_info AS "personalInfo",
  address_info AS "addressInfo",
  position_details AS "positionDetails",
  education AS "education",
  employment_history AS "employmentHistory",
  references AS "references",
  skills AS "skills",
  declaration AS "declaration"
`;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${JOB_APPLICATION_TABLE} (
      id SERIAL PRIMARY KEY,
      jobId INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      applicantName VARCHAR(255) NOT NULL,
      applicantEmail VARCHAR(255) NOT NULL,
      applicantPhone VARCHAR(50),
      cvPath VARCHAR(255),
      coverLetter TEXT,
      applicationData JSONB,
      recruiterAnnouncement TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureColumns = async () => {
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS coverletter TEXT`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS applicationdata JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS recruiterannouncement TEXT`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS auto_score DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS manual_score DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS score_breakdown JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS reviewer_notes TEXT`);
};

const JobApplication = {
  async create(data) {
    const { userId = null, jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter, applicationData, recruiterAnnouncement, status = 'pending' } = data;
    const res = await pool.query(
      `INSERT INTO ${JOB_APPLICATION_TABLE} (user_id, jobid, applicantname, applicantemail, applicantphone, cvpath, coverletter, applicationdata, recruiterannouncement, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${APPLICATION_SELECT_COLUMNS}`,
      [userId, jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter || null, toJsonb(applicationData, null), recruiterAnnouncement || null, status]
    );
    return res.rows[0];
  },
  async findByJob(jobId) {
    const res = await pool.query(
      `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE jobid = $1 ORDER BY appliedat DESC`,
      [jobId]
    );
    return res.rows;
  },
  async findByApplicantEmail(applicantEmail) {
    const res = await pool.query(
      `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE applicantemail = $1 ORDER BY appliedat DESC`,
      [applicantEmail]
    );
    return res.rows;
  },
  async findByUserId(userId) {
    const res = await pool.query(
      `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE user_id = $1 ORDER BY appliedat DESC`,
      [userId]
    );
    return res.rows;
  },
  async linkToUser(applicationId, userId, reason = 'manual') {
    const res = await pool.query(
      `
        UPDATE ${JOB_APPLICATION_TABLE}
        SET user_id = $1,
            linked_via = $3,
            linked_at = NOW()
        WHERE id = $2
        RETURNING ${APPLICATION_SELECT_COLUMNS}
      `,
      [userId, applicationId, reason]
    );
    await pool.query(
      `
        INSERT INTO application_user_links (application_id, user_id, link_reason, linked_by)
        VALUES ($1, $2, $3, 'manual')
        ON CONFLICT (application_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          link_reason = EXCLUDED.link_reason,
          linked_by = EXCLUDED.linked_by,
          updated_at = NOW()
      `,
      [applicationId, userId, reason]
    );
    return res.rows[0];
  },
  async backfillLinks() {
    const res = await pool.query(`SELECT id, applicantemail FROM ${JOB_APPLICATION_TABLE} WHERE user_id IS NULL`);
    const users = await pool.query(`SELECT id, email FROM users WHERE email IS NOT NULL`);
    const userEmailMap = new Map(users.rows.map((user) => [normalizeEmail(user.email), user.id]));

    for (const row of res.rows) {
      const matchedUserId = userEmailMap.get(normalizeEmail(row.applicantemail));
      if (!matchedUserId) continue;
      await this.linkToUser(row.id, matchedUserId, 'migration:email');
    }
  },
  async findById(id) {
    const res = await pool.query(`SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE id = $1`, [id]);
    return res.rows[0];
  },
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    values.push(id);
    const res = await pool.query(
      `UPDATE ${JOB_APPLICATION_TABLE} SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${APPLICATION_SELECT_COLUMNS}`,
      values
    );
    return res.rows[0];
  },
  async delete(id) {
    await pool.query(`DELETE FROM ${JOB_APPLICATION_TABLE} WHERE id = $1`, [id]);
    return true;
  },
  async init() {
    await createTable();
    await ensureColumns();
  },
};

module.exports = JobApplication;
