import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { BsArrowLeft, BsPerson, BsEnvelope, BsPhone, BsBriefcase, BsGeoAlt, BsClock } from 'react-icons/bs';

export default function EmployeeDetail() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const res = await employeeAPI.getById(employeeId);
        setEmployee(res.data);
      } catch (err) {
        toast.error('Failed to fetch employee details');
        navigate('/admin/employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, navigate]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    employeeAPI.delete(employeeId)
      .then(() => {
        toast.success('Employee deleted successfully');
        navigate('/admin/employees');
      })
      .catch(() => {
        toast.error('Failed to delete employee');
      });
  };

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

  const getEmploymentTypeBadgeColor = (type) => {
    const colors = {
      'Permanent': 'bg-green-100 text-green-800',
      'Contract': 'bg-blue-100 text-blue-800',
      'Temporary': 'bg-yellow-100 text-yellow-800',
      'Intern': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/employees')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Employee Details</h1>
          </div>
        </div>

        {/* Main Employee Card */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <BsPerson size={32} className="text-primary-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{fullName}</h2>
              <p className="text-slate-500">{employee.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* First Name */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">First Name</label>
              <p className="text-lg font-semibold mt-1">{employee.firstName || 'N/A'}</p>
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Name</label>
              <p className="text-lg font-semibold mt-1">{employee.lastName || 'N/A'}</p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsEnvelope size={14} />
                Email
              </label>
              <p className="text-lg font-semibold mt-1">{employee.email || 'N/A'}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsPhone size={14} />
                Phone
              </label>
              <p className="text-lg font-semibold mt-1">{employee.phone || 'N/A'}</p>
            </div>

            {/* Department */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsBriefcase size={14} />
                Department
              </label>
              <p className="text-lg font-semibold mt-1">{employee.department || 'N/A'}</p>
            </div>

            {/* Employment Type */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Employment Type</label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEmploymentTypeBadgeColor(employee.employmentType)}`}>
                  {employee.employmentType || 'N/A'}
                </span>
              </div>
            </div>

            {/* Wage Rate */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Wage Rate</label>
              <p className="text-lg font-semibold mt-1">
                {employee.wageRate ? `KES ${parseFloat(employee.wageRate).toLocaleString()}` : 'N/A'}
              </p>
            </div>

            {/* Biometric Device ID */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Biometric Device ID</label>
              <p className="text-lg font-semibold mt-1">{employee.biometricDeviceId || 'N/A'}</p>
            </div>

            {/* M-Pesa Phone Number */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">M-Pesa Phone</label>
              <p className="text-lg font-semibold mt-1">{employee.mpesaPhoneNumber || 'N/A'}</p>
            </div>

            {/* Created At */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsClock size={14} />
                Created At
              </label>
              <p className="text-lg font-semibold mt-1">
                {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Updated At */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Updated At</label>
              <p className="text-lg font-semibold mt-1">
                {employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/employees')}
            >
              Back to Employees
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Employee
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
