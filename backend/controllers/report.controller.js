const Employee = require('../models/Employee.model');
const Attendance = require('../models/Attendance.model');
const Leave = require('../models/Leave.model');
const Payment = require('../models/Payment.model');
const KPI = require('../models/KPI.model');
const User = require('../models/User.model');
const Job = require('../models/Job.model');
const JobApplication = require('../models/JobApplication.model');

const populateEmployeeForAttendance = async (record) => {
  if (!record.employeeId) return record;
  const employee = await Employee.findById(record.employeeId);
  if (employee) {
    record.employeeId = employee.toJSON();
  }
  return record;
};

const populateEmployeeForLeave = async (record) => {
  if (!record.employee) return record;
  const employee = await Employee.findById(record.employee);
  if (employee) {
    record.employee = employee.toJSON();
  }
  return record;
};

const populateEmployeeForPayment = async (record) => {
  if (!record.employee) return record;
  const employee = await Employee.findById(record.employee);
  if (employee) {
    record.employee = employee.toJSON();
  }
  return record;
};

const parseDateRange = (range, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 86400000);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'this_week':
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + 7 * 86400000);
      break;
    case 'last_week':
      const lastWeekDay = now.getDay();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay);
      end.setHours(0, 0, 0, 0);
      start = new Date(end.getTime() - 7 * 86400000);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = customEnd ? new Date(customEnd) : new Date();
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  return { start, end };
};

// Attendance Report
const attendanceReport = async (req, res) => {
  try {
    const { range = 'this_month', startDate, endDate, department, employeeId } = req.query;
    const { start, end } = parseDateRange(range, startDate, endDate);

    const filter = { date: { $gte: start, $lt: end } };
    if (employeeId) filter.employee_id = employeeId;

    let records = await Attendance.find(filter).lean();
    records = await Promise.all(records.map(populateEmployeeForAttendance));

    if (department) {
      records = records.filter(r => r.employeeId?.department === department);
    }

    const summary = {
      totalRecords: records.length,
      present: records.filter(r => r.status === 'present' || r.checkIn).length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
    };

    const dailyBreakdown = {};
    records.forEach(r => {
      const day = new Date(r.date).toISOString().split('T')[0];
      if (!dailyBreakdown[day]) dailyBreakdown[day] = { present: 0, absent: 0, late: 0, total: 0 };
      dailyBreakdown[day].total++;
      if (r.status === 'present' || r.checkIn) dailyBreakdown[day].present++;
      else if (r.status === 'absent') dailyBreakdown[day].absent++;
      else if (r.status === 'late') dailyBreakdown[day].late++;
    });

    res.json({ summary, dailyBreakdown, records, dateRange: { start, end } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Leave Report
const leaveReport = async (req, res) => {
  try {
    const { range = 'this_year', startDate, endDate, department, status, type } = req.query;
    const { start, end } = parseDateRange(range, startDate, endDate);

    const filter = { createdAt: { $gte: start, $lt: end } };
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;

    let records = await Leave.find(filter).lean();
    records = await Promise.all(records.map(populateEmployeeForLeave));

    if (department && department !== 'all') {
      records = records.filter(r => r.employee?.department === department);
    }

    const summary = {
      totalRequests: records.length,
      approved: records.filter(r => r.status === 'approved').length,
      rejected: records.filter(r => r.status === 'rejected').length,
      pending: records.filter(r => r.status === 'pending').length,
    };

    const byType = {};
    records.forEach(r => {
      const t = r.type || 'other';
      if (!byType[t]) byType[t] = 0;
      byType[t]++;
    });

    const byMonth = {};
    records.forEach(r => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      byMonth[month].total++;
      if (r.status === 'approved') byMonth[month].approved++;
      else if (r.status === 'rejected') byMonth[month].rejected++;
      else byMonth[month].pending++;
    });

    res.json({ summary, byType, byMonth, records, dateRange: { start, end } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Payroll Report
const payrollReport = async (req, res) => {
  try {
    const { range = 'this_year', startDate, endDate, department, status } = req.query;
    const { start, end } = parseDateRange(range, startDate, endDate);

    const filter = { createdAt: { $gte: start, $lt: end } };
    if (status && status !== 'all') filter.status = status;

    let records = await Payment.find(filter).lean();
    records = await Promise.all(records.map(populateEmployeeForPayment));

    if (department && department !== 'all') {
      records = records.filter(r => r.employee?.department === department);
    }

    const summary = {
      totalPayments: records.length,
      totalGross: records.reduce((sum, r) => sum + (Number(r.gross_pay) || 0), 0),
      totalNet: records.reduce((sum, r) => sum + (Number(r.net_pay) || 0), 0),
      totalDeductions: records.reduce((sum, r) => sum + (Number(r.total_deductions) || 0), 0),
      disbursed: records.filter(r => r.status === 'Disbursed').length,
      draft: records.filter(r => r.status === 'Draft').length,
    };

    const byMonth = {};
    records.forEach(r => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { gross: 0, net: 0, count: 0 };
      byMonth[month].gross += Number(r.gross_pay) || 0;
      byMonth[month].net += Number(r.net_pay) || 0;
      byMonth[month].count++;
    });

    res.json({ summary, byMonth, records, dateRange: { start, end } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// KPI Report
const kpiReport = async (req, res) => {
  try {
    const { range = 'this_year', startDate, endDate, department, status } = req.query;
    const { start, end } = parseDateRange(range, startDate, endDate);

    const filter = { createdAt: { $gte: start, $lt: end } };
    if (status && status !== 'all') filter.status = status;

    let records = await KPI.find(filter).lean();

    if (department && department !== 'all') {
      records = records.filter(r => r.department === department);
    }

    const evaluated = records.filter(r => r.final_score != null);
    const summary = {
      totalKPIs: records.length,
      evaluated: evaluated.length,
      avgScore: evaluated.length ? Math.round(evaluated.reduce((s, r) => s + Number(r.final_score), 0) / evaluated.length) : 0,
      excellent: evaluated.filter(r => Number(r.final_score) >= 85).length,
      average: evaluated.filter(r => Number(r.final_score) >= 50 && Number(r.final_score) < 85).length,
      poor: evaluated.filter(r => Number(r.final_score) < 50).length,
    };

    res.json({ summary, records, dateRange: { start, end } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Employee Demographics Report
const employeeReport = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department && department !== 'all') filter.department = department;

    const employees = await Employee.find(filter).lean();

    const byDepartment = {};
    const byEmploymentType = {};
    const byGender = {};
    const byStatus = {};

    employees.forEach(e => {
      const dept = e.department || 'Unassigned';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;

      const empType = e.employmentType || 'Permanent';
      byEmploymentType[empType] = (byEmploymentType[empType] || 0) + 1;

      const gender = e.gender || 'Not Specified';
      byGender[gender] = (byGender[gender] || 0) + 1;

      const status = e.status || 'Active';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    const summary = {
      totalEmployees: employees.length,
      byDepartment,
      byEmploymentType,
      byGender,
      byStatus,
    };

    res.json({ summary, employees });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Recruitment Report
const recruitmentReport = async (req, res) => {
  try {
    const { range = 'this_year', startDate, endDate, status } = req.query;
    const { start, end } = parseDateRange(range, startDate, endDate);

    const jobFilter = { createdAt: { $gte: start, $lt: end } };
    if (status && status !== 'all') jobFilter.status = status;

    const [jobs, applications] = await Promise.all([
      Job.find(jobFilter).lean(),
      JobApplication.find({ createdAt: { $gte: start, $lt: end } }).lean(),
    ]);

    const summary = {
      totalJobs: jobs.length,
      openJobs: jobs.filter(j => j.status === 'open').length,
      closedJobs: jobs.filter(j => j.status === 'closed').length,
      totalApplications: applications.length,
      hired: applications.filter(a => a.status === 'hired').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      pending: applications.filter(a => a.status === 'pending').length,
    };

    const applicationsByJob = {};
    applications.forEach(a => {
      const jobId = a.job_id || a.jobId || 'unknown';
      if (!applicationsByJob[jobId]) applicationsByJob[jobId] = 0;
      applicationsByJob[jobId]++;
    });

    res.json({ summary, applicationsByJob, jobs, applications, dateRange: { start, end } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Dashboard Summary (aggregated overview)
const dashboardSummary = async (req, res) => {
  try {
    const [employees, attendance, leaves, payments, kpis, jobs, applications] = await Promise.all([
      Employee.countDocuments(),
      Attendance.countDocuments({ date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Leave.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'Draft' }),
      KPI.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      JobApplication.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      totalEmployees: employees,
      presentToday: attendance,
      pendingLeaves: leaves,
      pendingPayroll: payments,
      totalKPIs: kpis,
      openJobs: jobs,
      pendingApplications: applications,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

module.exports = {
  attendanceReport,
  leaveReport,
  payrollReport,
  kpiReport,
  employeeReport,
  recruitmentReport,
  dashboardSummary,
};
