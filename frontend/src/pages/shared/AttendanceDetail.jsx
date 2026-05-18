import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsArrowLeft, BsCalendarEvent, BsClock, BsCheckCircle } from 'react-icons/bs';

export default function AttendanceDetail() {
  const { attendanceId } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance/record/${attendanceId}`);
        const attendanceRecord = Array.isArray(res.data) ? res.data[0] : res.data;
        setAttendance(attendanceRecord || null);
      } catch (err) {
        toast.error('Failed to fetch attendance details');
        navigate('/employee/attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [attendanceId, navigate]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    api.delete(`/attendance/${attendanceId}`)
      .then(() => {
        toast.success('Attendance record deleted successfully');
        navigate('/employee/attendance');
      })
      .catch(() => {
        toast.error('Failed to delete attendance record');
      });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!attendance) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <p className="text-center text-slate-500">Attendance record not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      leave: 'bg-yellow-100 text-yellow-800',
      late: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return time;
    }
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = (end - start) / (1000 * 60 * 60); // Convert to hours
      return diff.toFixed(2) + ' hours';
    } catch {
      return 'N/A';
    }
  };

  const attendanceDate = new Date(attendance.attendanceDate || attendance.date || attendance.createdAt).toLocaleDateString();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/employee/attendance')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Attendance Details</h1>
          </div>
        </div>

        {/* Main Attendance Card */}
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <BsCalendarEvent size={32} className="text-primary-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{attendanceDate}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(attendance.status)}`}>
                  {attendance.status || 'pending'}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Shift: {attendance.shift || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsCalendarEvent size={14} />
                Date
              </label>
              <p className="text-lg font-semibold mt-1">{attendanceDate}</p>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(attendance.status)}`}>
                  {attendance.status || 'N/A'}
                </span>
              </div>
            </div>

            {/* Shift */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Shift</label>
              <p className="text-lg font-semibold mt-1">{attendance.shift || 'N/A'}</p>
            </div>

            {/* Employee */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Employee</label>
              <p className="text-lg font-semibold mt-1">{attendance.employeeName || attendance.employeeId || 'N/A'}</p>
            </div>

            {/* Check In */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsClock size={14} />
                Check In
              </label>
              <p className="text-lg font-semibold mt-1">{formatTime(attendance.checkInTime || attendance.checkIn)}</p>
            </div>

            {/* Check Out */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsClock size={14} />
                Check Out
              </label>
              <p className="text-lg font-semibold mt-1">{formatTime(attendance.checkOutTime || attendance.checkOut)}</p>
            </div>

            {/* Hours Worked */}
            {(attendance.checkInTime || attendance.checkIn) && (attendance.checkOutTime || attendance.checkOut) && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsClock size={14} />
                  Hours Worked
                </label>
                <p className="text-lg font-semibold mt-1">
                  {calculateHours(attendance.checkInTime || attendance.checkIn, attendance.checkOutTime || attendance.checkOut)}
                </p>
              </div>
            )}

            {/* Notes */}
            {attendance.notes && (
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Notes</label>
                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{attendance.notes}</p>
              </div>
            )}
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Biometric */}
            {attendance.biometric !== undefined && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BsCheckCircle size={14} />
                  Biometric Verified
                </label>
                <p className="text-lg font-semibold mt-1">
                  {attendance.biometric ? 'Yes' : 'No'}
                </p>
              </div>
            )}

            {/* Location */}
            {attendance.location && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Location</label>
                <p className="text-lg font-semibold mt-1">{attendance.location}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => navigate('/employee/attendance')}
            >
              Back to Attendance
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Record
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
