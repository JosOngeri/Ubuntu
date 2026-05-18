const pool = require('../config/db');

const getContractorStats = async (req, res) => {
  try {
    const contractorId = req.user.id; // Assuming user is authenticated

    // Fetch active projects count
    const activeProjectsQuery = `
      SELECT COUNT(*) as count
      FROM projects
      WHERE contractor_id = $1 AND status = 'active'
    `;
    const activeProjectsResult = await pool.query(activeProjectsQuery, [contractorId]);
    const activeProjects = parseInt(activeProjectsResult.rows[0].count);

    // Fetch pending invoices count
    const pendingInvoicesQuery = `
      SELECT COUNT(*) as count
      FROM invoices
      WHERE contractor_id = $1 AND status = 'pending'
    `;
    const pendingInvoicesResult = await pool.query(pendingInvoicesQuery, [contractorId]);
    const pendingInvoices = parseInt(pendingInvoicesResult.rows[0].count);

    // Fetch delivery rate (assuming a delivery_rate table or calculation)
    const deliveryRateQuery = `
      SELECT AVG(delivery_rate) as rate
      FROM contractor_performance
      WHERE contractor_id = $1
    `;
    const deliveryRateResult = await pool.query(deliveryRateQuery, [contractorId]);
    const deliveryRate = Math.round(parseFloat(deliveryRateResult.rows[0].rate) || 0);

    res.json({
      activeProjects,
      pendingInvoices,
      deliveryRate,
    });
  } catch (error) {
    console.error('Error fetching contractor stats:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getContractorProjects = async (req, res) => {
  try {
    const contractorId = req.user.id;

    const query = `
      SELECT id, name, status, due_date as due
      FROM projects
      WHERE contractor_id = $1
      ORDER BY due_date ASC
    `;
    const result = await pool.query(query, [contractorId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contractor projects:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getContractorInvoices = async (req, res) => {
  try {
    const contractorId = req.user.id;

    const query = `
      SELECT id, amount, status, due_date as due
      FROM invoices
      WHERE contractor_id = $1
      ORDER BY due_date ASC
    `;
    const result = await pool.query(query, [contractorId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contractor invoices:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getContractorStats,
  getContractorProjects,
  getContractorInvoices,
};