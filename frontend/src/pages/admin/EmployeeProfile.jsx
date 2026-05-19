import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { employeeAPI, attendanceAPI, payrollAPI, leaveAPI, kpiAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { BsPerson, BsEnvelope, BsPhone, BsBriefcase, BsGeoAlt, BsClock, BsChevronDown, BsChevronUp, BsClipboardCheck, BsFileText, BsGraphUp, BsCalendarCheck } from 'react-icons/bs';

const formatMoney = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0));

export default function EmployeeProfile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    attendance: false,
    payslips: false,
    kpi: false,
    leave: false,
  });

  // Data states
  const [attendance, setAttendance] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [sectionLoading, setSectionLoading] = useState({});

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getById(employeeId);
      setEmployee(res.data);
    } catch (err) {
      toast.error('Failed to fetch employee details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    
    // Fetch data when expanding
    if (!expandedSections[section]) {
      switch(section) {
        case 'attendance':
          fetchAttendance();
          break;
        case 'payslips':
          fetchPayslips();
          break;
        case 'kpi':
          fetchKPIs();
          break;
        case 'leave':
          fetchLeaves();
          break;
      }
    }
  };

  const fetchAttendance = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, attendance: true }));
      const res = await attendanceAPI.getByEmployeeId(employeeId);
      setAttendance(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    } finally {
      setSectionLoading(prev => ({ ...prev, attendance: false }));
    }
  };

  const fetchPayslips = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, payslips: true }));
      const res = await payrollAPI.getPayslips();
      setPayslips((res.data || []).filter(p => p.employee_id === employeeId));
    } catch (err) {
      toast.error('Failed to fetch payslips');
    } finally {
      setSectionLoading(prev => ({ ...prev, payslips: false }));
    }
  };

  const fetchKPIs = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, kpi: true }));
      const res = await kpiAPI.getEmployeeKPIs(employeeId);
      setKpis(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch KPIs');
    } finally {
      setSectionLoading(prev => ({ ...prev, kpi: false }));
    }
  };

  const fetchLeaves = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, leave: true }));
      const res = await leaveAPI.getAll();
      setLeaves((res.data || []).filter(l => l.employee_id === employeeId));
    } catch (err) {
      toast.error('Failed to fetch leaves');
    } finally {
      setSectionLoading(prev => ({ ...prev, leave: false }));
    }
  };

  const attendanceColumns = [
    { key: 'attendanceDate', label: 'Date', sortable: true, render: (date) => new Date(date).toLocaleDateString() },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'shift', label: 'Shift', sortable: true },
    { key: 'checkIn', label: 'Check In', sortable: true, render: (time) => time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-' },
    { key: 'checkOut', label: 'Check Out', sortable: true, render: (time) => time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-' },
    { key: 'totalHoursWorked', label: 'Hours', sortable: true, render: (hours) => hours ? hours.toFixed(2) + ' hrs' : '-' },
  ];

  const payslipColumns = [
    { key: 'period', label: 'Period', sortable: true },
    { key: 'gross_pay', label: 'Gross Pay', sortable: true, render: (val) => formatMoney(val) },
    { key: 'net_pay', label: 'Net Pay', sortable: true, render: (val) => formatMoney(val) },
    { key: 'status', label: 'Status', sortable: true, render: (status) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        status === 'Draft' ? 'bg-slate-200 text-slate-800' : 
        status === 'Approved' ? 'bg-blue-100 text-blue-800' : 
        'bg-green-100 text-green-800'
      }`}>{status}</span>
    )},
    { key: 'payment_method', label: 'Payment Method', sortable: true },
  ];

  const kpiColumns = [
    { key: 'definition_title', label: 'KPI Title', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'target_value', label: 'Target', sortable: true },
    { key: 'achieved_value', label: 'Achieved', sortable: true },
    { key: 'final_score', label: 'Score', sortable: true, render: (score) => `${score}%` },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const leaveColumns = [
    { key: 'type', label: 'Type', sortable: true },
    { key: 'start_date', label: 'Start Date', sortable: true },
    { key: 'end_date', label: 'End Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'reason', label: 'Reason', sortable: true },
  ];

  const SectionHeader = ({ title, icon: Icon, section, count }) => (
    <div 
      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
          <Icon size={20} className="text-slate-600 dark:text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {count !== undefined && <span className="text-sm text-slate-500">({count})</span>}
      </div>
      {expandedSections[section] ? <BsChevronUp size={20} /> : <BsChevronDown size={20} />}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <p className="text-center text-slate-500">Employee not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Employee Profile</h1>
          </div>
        </div>

        {/* Profile Section */}
        <Card>
          <SectionHeader title="Profile Information" icon={BsPerson} section="profile" />
          {expandedSections.profile && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">First Name</label>
                <p className="text-lg font-semibold mt-1">{employee.firstName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Name</label>
                <p className="text-lg font-semibold mt-1">{employee.lastName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsEnvelope size={14} /> Email
                </label>
                <p className="text-lg font-semibold mt-1">{employee.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsPhone size={14} /> Phone
                </label>
                <p className="text-lg font-semibold mt-1">{employee.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsBriefcase size={14} /> Department
                </label>
                <p className="text-lg font-semibold mt-1">{employee.department || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Employment Type</label>
                <p className="text-lg font-semibold mt-1">{employee.employmentType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Wage Rate</label>
                <p className="text-lg font-semibold mt-1">
                  {employee.wageRate ? `KES ${parseFloat(employee.wageRate).toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsClock size={14} /> Created At
                </label>
                <p className="text-lg font-semibold mt-1">
                  {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Attendance Section */}
        <Card>
          <SectionHeader title="Attendance Records" icon={BsClipboardCheck} section="attendance" count={attendance.length} />
          {expandedSections.attendance && (
            <div className="p-6">
              {sectionLoading.attendance ? (
                <div className="text-center py-8">Loading attendance...</div>
              ) : attendance.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No attendance records found</div>
              ) : (
                <Table columns={attendanceColumns} data={attendance} />
              )}
            </div>
          )}
        </Card>

        {/* Payslips Section */}
        <Card>
          <SectionHeader title="Payslip History" icon={BsFileText} section="payslips" count={payslips.length} />
          {expandedSections.payslips && (
            <div className="p-6">
              {sectionLoading.payslips ? (
                <div className="text-center py-8">Loading payslips...</div>
              ) : payslips.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No payslips found</div>
              ) : (
                <Table columns={payslipColumns} data={payslips} />
              )}
            </div>
          )}
        </Card>

        {/* KPI Section */}
        <Card>
          <SectionHeader title="KPI Performance" icon={BsGraphUp} section="kpi" count={kpis.length} />
          {expandedSections.kpi && (
            <div className="p-6">
              {sectionLoading.kpi ? (
                <div className="text-center py-8">Loading KPIs...</div>
              ) : kpis.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No KPI records found</div>
              ) : (
                <Table columns={kpiColumns} data={kpis} />
              )}
            </div>
          )}
        </Card>

        {/* Leave Section */}
        <Card>
          <SectionHeader title="Leave History" icon={BsCalendarCheck} section="leave" count={leaves.length} />
          {expandedSections.leave && (
            <div className="p-6">
              {sectionLoading.leave ? (
                <div className="text-center py-8">Loading leaves...</div>
              ) : leaves.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No leave records found</div>
              ) : (
                <Table columns={leaveColumns} data={leaves} />
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
