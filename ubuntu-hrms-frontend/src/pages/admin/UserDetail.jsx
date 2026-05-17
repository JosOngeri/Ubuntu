import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { BsArrowLeft, BsPerson, BsEnvelope, BsShieldCheck, BsClock } from 'react-icons/bs';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getById(userId);
        setUser(res.data);
      } catch (err) {
        toast.error('Failed to fetch user details');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    userAPI.delete(userId)
      .then(() => {
        toast.success('User deleted successfully');
        navigate('/admin/users');
      })
      .catch(() => {
        toast.error('Failed to delete user');
      });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <p className="text-center text-slate-500">User not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      hr: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <BsArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">User Details</h1>
          </div>
        </div>

        {/* Main User Card */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <BsPerson size={32} className="text-primary-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Username */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Username</label>
              <p className="text-lg font-semibold mt-1">{user.username}</p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsEnvelope size={14} />
                Email Address
              </label>
              <p className="text-lg font-semibold mt-1">{user.email}</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsShieldCheck size={14} />
                Role
              </label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(user.status)}`}>
                  {user.status}
                </span>
              </div>
            </div>

            {/* Created At */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BsClock size={14} />
                Created At
              </label>
              <p className="text-lg font-semibold mt-1">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Updated At */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Updated At</label>
              <p className="text-lg font-semibold mt-1">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              Back to Users
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete User
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
