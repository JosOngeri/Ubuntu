const { query } = require('../config/db');

const formatContract = (r) => ({
  id: r.id,
  _id: r.id,
  employee: r.employee_id,
  title: r.title,
  startDate: r.start_date,
  endDate: r.end_date,
  terms: r.terms,
  status: r.status,
  documentPath: r.document_path,
  createdAt: r.created_at
});

exports.createContract = async (req, res) => {
  try {
    const { employee, title, startDate, endDate, terms, status } = req.body;
    
    let documentPath = null;
    if (req.file) {
      documentPath = `/uploads/contracts/${req.file.filename}`;
    }

    const { rows } = await query(
      `INSERT INTO contracts (employee_id, title, start_date, end_date, terms, status, document_path, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [employee, title, startDate, endDate || null, terms || null, status || 'active', documentPath]
    );
    res.status(201).json(formatContract(rows[0]));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getContracts = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM contracts ORDER BY created_at DESC');
    res.json(rows.map(formatContract));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const { employee, title, startDate, endDate, terms, status } = req.body;
    
    const { rows: existing } = await query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: "Contract not found" });

    let documentPath = existing[0].document_path;
    if (req.file) {
      documentPath = `/uploads/contracts/${req.file.filename}`;
    }

    const { rows } = await query(
      `UPDATE contracts 
       SET employee_id = COALESCE($1, employee_id),
           title = COALESCE($2, title),
           start_date = COALESCE($3, start_date),
           end_date = $4,
           terms = COALESCE($5, terms),
           status = COALESCE($6, status),
           document_path = $7,
           updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [employee || null, title || null, startDate || null, endDate || null, terms || null, status || null, documentPath, req.params.id]
    );
    res.json(formatContract(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    await query('DELETE FROM contracts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
