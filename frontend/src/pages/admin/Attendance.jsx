import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { attendanceAPI, employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AdminAttendance = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [sortField, setSortField] = useState('attendanceDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkShift, setBulkShift] = useState('Morning');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // Fetch all today's attendance by default
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/attendance/today');
      setAttendance(response.data || []);
    } catch (error) {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance(selectedEmployee);
    } else {
      fetchTodayAttendance();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll();
      setEmployees(res.data || []);
    } catch (err) {
      setEmployees([]);
    }
  };

  const fetchAttendance = async (empId) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getByEmployeeId(empId);
      setAttendance(response.data || []);
    } catch (error) {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkCheckIn = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      setBulkProcessing(true);
      const results = await Promise.allSettled(
        selectedEmployees.map(empId =>
          attendanceAPI.managerManualPunch({
            employeeId: empId,
            type: 'check_in',
            timestamp: new Date().toISOString(),
            shift: bulkShift,
          })
        )
      );

      const success = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      toast.success(`Bulk check-in complete: ${success} successful, ${failed} failed`);
      setShowBulkModal(false);
      setSelectedEmployees([]);
      fetchTodayAttendance();
    } catch (err) {
      toast.error('Bulk check-in failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleEmployeeSelection = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const selectAllAbsent = () => {
    const presentIds = attendance.map(a => a.employee_id);
    const absentEmployees = employees.filter(e => !presentIds.includes(e._id) && !presentIds.includes(e.id));
    setSelectedEmployees(absentEmployees.map(e => e._id));
  };

  const columns = [
    {
      key: 'attendanceDate',
      label: 'Date',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => {
        const statusColor = {
          present: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
          absent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
          late: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
        };
        return (
          <button
            className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusColor[row.status] || 'bg-slate-100 text-slate-700'}`}
            onClick={() => toast.info(`Status: ${row.status}`)}
          >
            {row.status}
          </button>
        );
      }
    },
    { key: 'shift', label: 'Shift', sortable: true },
    {
      key: 'checkIn',
      label: 'Check In',
      sortable: true,
      render: (time) => time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-',
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      sortable: true,
      render: (time) => time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-',
    },
    {
      key: 'totalHoursWorked',
      label: 'Hours',
      sortable: true,
      render: (hours) => hours ? hours.toFixed(2) + ' hrs' : '-',
    },
    {
      key: 'employee',
      label: 'Employee',
      sortable: true,
      render: (_, row) => {
        const emp = employees.find(e => String(e._id) === String(row.employee_id) || String(e.id) === String(row.employee_id));
        const name = emp ? `${emp.firstName || emp.name || emp.username || emp.email}` : `Employee ${row.employee_id}`;
        return (
          <button
            onClick={() => navigate(`/admin/employees/${row.employee_id}`)}
            className="text-blue-500 hover:text-blue-700 hover:underline font-medium cursor-pointer"
          >
            {name}
          </button>
        );
      },
    },
  ];

  const sortedAttendance = [...attendance].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'attendanceDate' || sortField === 'checkIn' || sortField === 'checkOut') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    } else if (sortField === 'totalHoursWorked') {
      aVal = aVal || 0;
      bVal = bVal || 0;
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">View attendance records for all employees</p>
      </div>
      <Card>
        <div className="mb-4 flex gap-2 items-center flex-wrap">
          <label className="font-medium">Employee:</label>
          <select
            className="form-select bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select employee...</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.fullName || emp.name || emp.username || emp.email}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowBulkModal(true)}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Bulk Check-In
          </button>
        </div>
        <Table columns={columns} data={sortedAttendance.map(row => ({ ...row, employee_id: selectedEmployee }))} loading={loading} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
      </Card>

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Bulk Check-In</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Shift</label>
              <select
                className="form-select w-full"
                value={bulkShift}
                onChange={e => setBulkShift(e.target.value)}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={selectAllAbsent}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Select All Absent
                </button>
                <button
                  onClick={() => setSelectedEmployees([])}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Clear Selection
                </button>
              </div>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {employees.map(emp => {
                  const isPresent = attendance.some(a => String(a.employee_id) === String(emp._id) || String(a.employee_id) === String(emp.id));
                  return (
                    <div key={emp._id} className="flex items-center p-2 border-b last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp._id)}
                        onChange={() => toggleEmployeeSelection(emp._id)}
                        disabled={isPresent}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isPresent ? 'text-slate-400' : ''}`}>
                        {emp.fullName || emp.name || emp.username || emp.email}
                        {isPresent && ' (already checked in)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCheckIn}
                disabled={bulkProcessing || selectedEmployees.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Processing...' : `Check-In ${selectedEmployees.length} Employees`}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminAttendance;
