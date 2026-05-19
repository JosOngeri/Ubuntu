const pool = require('../config/db').pool;

const JOB_TABLE = 'jobs';

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${JOB_TABLE} (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      department VARCHAR(100),
      location VARCHAR(100),
      employmenttype VARCHAR(50),
      status VARCHAR(20) DEFAULT 'open',
      salaryrange VARCHAR(100),
      requirements TEXT,
      responsibilities TEXT,
      benefits TEXT,
      applicationdeadline DATE,
      postedby INTEGER,
      createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureColumns = async () => {
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS employmenttype VARCHAR(50)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS salaryrange VARCHAR(100)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS requirements TEXT`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS responsibilities TEXT`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS benefits TEXT`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS applicationdeadline DATE`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS postedby INTEGER`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS qualifications JSONB`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS evaluationparams JSONB`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS numberofpositions INTEGER DEFAULT 1`);
};

const JOB_SELECT_COLUMNS = `
  id,
  title,
  description,
  department,
  location,
  employmenttype AS "employmentType",
  status,
  salaryrange AS "salaryRange",
  requirements,
  responsibilities,
  benefits,
  applicationdeadline AS "applicationDeadline",
  postedby AS "postedBy",
  qualifications,
  evaluationparams AS "evaluationParams",
  advertisement_data AS "advertisementData",
  numberofpositions AS "numberOfPositions",
  createdat AS "createdAt",
  updatedat AS "updatedAt"
`;

const Job = {
  async create(data) {
    const { title, description, department, location, employmentType, status = 'open', salaryRange, requirements, responsibilities, benefits, applicationDeadline, postedBy, qualifications, evaluationParams, advertisementData, numberOfPositions = 1 } = data;
    const res = await pool.query(
      `
        INSERT INTO ${JOB_TABLE} (
          title,
          description,
          department,
          location,
          employmenttype,
          status,
          salaryrange,
          requirements,
          responsibilities,
          benefits,
          applicationdeadline,
          postedby,
          qualifications,
          evaluationparams,
          advertisement_data,
          numberofpositions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING ${JOB_SELECT_COLUMNS}
      `,
      [title, description, department, location, employmentType, status, salaryRange, requirements, responsibilities, benefits, applicationDeadline, postedBy, JSON.stringify(qualifications || []), JSON.stringify(evaluationParams || {}), JSON.stringify(advertisementData || {}), numberOfPositions]
    );
    return res.rows[0];
  },
  async findAll({ onlyOpen = false } = {}) {
    const res = await pool.query(
      `
        SELECT ${JOB_SELECT_COLUMNS}
        FROM ${JOB_TABLE}
        ${onlyOpen ? "WHERE status = 'open'" : ''}
        ORDER BY createdat DESC
      `
    );
    return res.rows;
  },
  async findById(id) {
    const res = await pool.query(`SELECT ${JOB_SELECT_COLUMNS} FROM ${JOB_TABLE} WHERE id = $1`, [id]);
    return res.rows[0];
  },
  async update(id, data) {
    const allowed = {
      title: 'title',
      description: 'description',
      department: 'department',
      location: 'location',
      employmentType: 'employmenttype',
      status: 'status',
      salaryRange: 'salaryrange',
      requirements: 'requirements',
      responsibilities: 'responsibilities',
      benefits: 'benefits',
      applicationDeadline: 'applicationdeadline',
      postedBy: 'postedby',
      qualifications: 'qualifications',
      evaluationParams: 'evaluationparams',
      numberOfPositions: 'numberofpositions',
    };
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, column] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    if (!fields.length) {
      return this.findById(id);
    }

    values.push(id);
    const res = await pool.query(
      `UPDATE ${JOB_TABLE} SET ${fields.join(', ')}, updatedat = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING ${JOB_SELECT_COLUMNS}`,
      values
    );
    return res.rows[0];
  },
  async delete(id) {
    await pool.query(`DELETE FROM ${JOB_TABLE} WHERE id = $1`, [id]);
    return true;
  },
  async init() {
    await createTable();
    await ensureColumns();
  },
};

module.exports = Job;
