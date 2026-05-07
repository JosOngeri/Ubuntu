const { query } = require('../config/db');
const { normalizeId, toOptionalText } = require('../utils/postgres');

const createKPI = async (req, res) => {
  try {
    const title = toOptionalText(req.body.title);
    const description = toOptionalText(req.body.description);
    const maxScore = Number(req.body.maxScore);

    if (!title || Number.isNaN(maxScore) || maxScore <= 0) {
      return res.status(400).json({ error: 'title and maxScore are required and maxScore must be a positive number' });
    }

    const { rows } = await query(
      `INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [title, description, maxScore]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getKPIs = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM kpi_definitions ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateKPI = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid KPI definition id' });
    }

    const title = toOptionalText(req.body.title);
    const description = toOptionalText(req.body.description);
    const maxScore = req.body.maxScore !== undefined ? Number(req.body.maxScore) : undefined;

    const fields = [];
    const values = [];

    if (title) {
      values.push(title);
      fields.push(`title = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      fields.push(`description = $${values.length}`);
    }
    if (maxScore !== undefined) {
      if (Number.isNaN(maxScore) || maxScore <= 0) {
        return res.status(400).json({ error: 'maxScore must be a positive number' });
      }
      values.push(maxScore);
      fields.push(`max_score = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    values.push(id);
    const { rows } = await query(
      `UPDATE kpi_definitions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'KPI definition not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteKPI = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid KPI definition id' });
    }

    const { rows } = await query('DELETE FROM kpi_definitions WHERE id = $1 RETURNING *', [id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'KPI definition not found' });
    }

    return res.json({ success: true, deleted: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const assignKPI = async (req, res) => {
  try {
    const employeeId = normalizeId(req.body.employeeId);
    const evaluatorId = normalizeId(req.body.evaluatorId);
    const period = toOptionalText(req.body.period);
    const targetValue = Number(req.body.targetValue);
    const title = toOptionalText(req.body.title);
    const description = toOptionalText(req.body.description);
    const maxScore = Number(req.body.maxScore);
    const definitionId = normalizeId(req.body.definitionId);

    if (!employeeId || !evaluatorId || !period || Number.isNaN(targetValue) || targetValue <= 0) {
      return res.status(400).json({ error: 'employeeId, evaluatorId, period, and targetValue are required' });
    }

    const employeeResult = await query('SELECT id FROM employees WHERE id = $1 LIMIT 1', [employeeId]);
    if (!employeeResult.rows[0]) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const evaluatorResult = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [evaluatorId]);
    if (!evaluatorResult.rows[0]) {
      return res.status(404).json({ error: 'Evaluator not found' });
    }

    let usedDefinitionId = null;

    if (definitionId) {
      const definitionResult = await query('SELECT id FROM kpi_definitions WHERE id = $1 LIMIT 1', [definitionId]);
      if (!definitionResult.rows[0]) {
        return res.status(404).json({ error: 'KPI definition not found' });
      }
      usedDefinitionId = definitionId;
    } else {
      if (!title || Number.isNaN(maxScore) || maxScore <= 0) {
        return res.status(400).json({ error: 'title and maxScore are required when definitionId is not provided' });
      }
      const definitionInsert = await query(
        `INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
        [title, description, maxScore]
      );
      usedDefinitionId = definitionInsert.rows[0].id;
    }

    const { rows } = await query(
      `INSERT INTO employee_kpis (employee_id, evaluator_id, definition_id, period, target_value, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'Pending', NOW(), NOW()) RETURNING *`,
      [employeeId, evaluatorId, usedDefinitionId, period, targetValue]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const processPendingBonuses = async () => {
  try {
    const { rows } = await query(
      `SELECT ek.id, ek.employee_id, ek.period, ek.final_score, kd.max_score
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       WHERE ek.final_score > 90
         AND NOT EXISTS (
           SELECT 1 FROM pending_bonuses pb WHERE pb.employee_kpi_id = ek.id
         )`
    );

    for (const row of rows) {
      const bonusAmount = Number(
        ((Number(row.final_score) / 100) * Number(row.max_score) * 0.1).toFixed(2)
      );
      await query(
        `INSERT INTO pending_bonuses (employee_id, employee_kpi_id, period, bonus_type, bonus_amount, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'KPI Raise', $4, 'pending', NOW(), NOW())
         ON CONFLICT (employee_kpi_id, period) DO NOTHING`,
        [row.employee_id, row.id, row.period, bonusAmount]
      );
    }
  } catch (err) {
    console.error('KPI bonus processor error:', err);
  }
};

const evaluateKPI = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    const achievedValue = Number(req.body.achievedValue);

    if (!id || Number.isNaN(achievedValue) || achievedValue < 0) {
      return res.status(400).json({ error: 'A valid KPI id and achievedValue are required' });
    }

    const { rows } = await query(
      `SELECT ek.*, kd.max_score
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       WHERE ek.id = $1 LIMIT 1`,
      [id]
    );

    const kpi = rows[0];
    if (!kpi) {
      return res.status(404).json({ error: 'Employee KPI assignment not found' });
    }

    const finalScore = kpi.target_value > 0
      ? Number(((achievedValue / Number(kpi.target_value)) * 100).toFixed(2))
      : 0;

    const status = 'Completed';
    const updateResult = await query(
      `UPDATE employee_kpis
       SET achieved_value = $1, final_score = $2, status = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [achievedValue, finalScore, status, id]
    );

    await processPendingBonuses();

    return res.json(updateResult.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getEmployeeKPIs = async (req, res) => {
  try {
    const employeeId = normalizeId(req.params.id);
    if (!employeeId) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const { rows } = await query(
      `SELECT ek.id,
              ek.employee_id,
              ek.evaluator_id,
              ek.period,
              ek.target_value,
              ek.achieved_value,
              ek.final_score,
              ek.status,
              ek.created_at,
              ek.updated_at,
              kd.title AS definition_title,
              kd.description AS definition_description,
              kd.max_score AS definition_max_score,
              pb.bonus_amount,
              pb.status AS bonus_status
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       LEFT JOIN pending_bonuses pb ON pb.employee_kpi_id = ek.id
       WHERE ek.employee_id = $1
       ORDER BY ek.created_at DESC`,
      [employeeId]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createKPI,
  getKPIs,
  updateKPI,
  deleteKPI,
  assignKPI,
  evaluateKPI,
  getEmployeeKPIs,
  startKpiBonusProcessor: (intervalMs = 60 * 60 * 1000) => {
    setInterval(processPendingBonuses, intervalMs);
  },
};
