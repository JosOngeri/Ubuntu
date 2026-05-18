import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { attendanceAPI, employeeAPI } from '../../services/api';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance(selectedEmployee);
    } else {
      setAttendance([]);
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

  const columns = [
    {
      key: 'attendanceDate',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    { key: 'status', label: 'Status' },
    { key: 'shift', label: 'Shift' },
    {
      key: 'checkIn',
      label: 'Check In',
      render: (time) => time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-',
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: (time) => time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-',
    },
    {
      key: 'totalHoursWorked',
      label: 'Hours',
      render: (hours) => hours ? hours.toFixed(2) + ' hrs' : '-',
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">View attendance records for all employees</p>
      </div>
      <Card>
        <div className="mb-4 flex gap-2 items-center">
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
        </div>
        <Table columns={columns} data={attendance} loading={loading} />
      </Card>
    </DashboardLayout>
  );
};

export default AdminAttendance;
