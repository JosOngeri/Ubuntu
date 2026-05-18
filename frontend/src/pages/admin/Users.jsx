import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import api, { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout'
import { downloadPdfReport } from '../../utils/reportExport'
import { BsEye, BsPencil, BsTrash, BsCheckCircle } from 'react-icons/bs';


const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', role: 'employee' });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveUser, setApproveUser] = useState(null);
  const [approveDetails, setApproveDetails] = useState({ wageRate: '', department: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({ username: '', email: '', role: 'employee', status: 'active' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      setUsers(res.data || []);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await userAPI.register(registerData);
      toast.success('User registered');
      setShowRegisterModal(false);
      setRegisterData({ username: '', email: '', password: '', role: 'employee' });
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Registration failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await userAPI.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await userAPI.approve(approveUser._id || approveUser.id, approveDetails);
      toast.success('User approved');
      setShowApproveModal(false);
      setApproveUser(null);
      fetchUsers();
    } catch {
      toast.error('Approval failed');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      // Fallback in case userAPI.update is not explicitly defined in api.js
      if (userAPI.update) {
        await userAPI.update(editUser._id || editUser.id, editData);
      } else {
        await api.put(`/api/users/${editUser._id || editUser.id}`, editData);
      }
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.msg || err?.response?.data?.error || 'Update failed');
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2 items-center">
          <button 
            type="button"
            className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded dark:bg-blue-900/30 dark:text-blue-400 transition" 
            title="View Details" 
            onClick={(e) => {
              e.preventDefault();
              const userId = row._id || row.id || row.user_id || row.userId;
              if (!userId) {
                toast.error('User ID is missing from this record');
                return;
              }
              navigate(`/admin/users/${userId}`);
            }}
          >
            <BsEye size={16} />
          </button>
          <button className="p-1.5 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded dark:bg-amber-900/30 dark:text-amber-400 transition" title="Edit User" onClick={() => { 
            setEditUser(row); 
            setEditData({ username: row.username, email: row.email, role: row.role, status: row.status });
            setShowEditModal(true); 
          }}>
            <BsPencil size={16} />
          </button>
          {row.status !== 'active' && (
            <button className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded dark:bg-green-900/30 dark:text-green-400 transition" title="Approve User" onClick={() => { setApproveUser(row); setShowApproveModal(true); }}>
              <BsCheckCircle size={16} />
            </button>
          )}
          <button className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded dark:bg-red-900/30 dark:text-red-400 transition" title="Delete User" onClick={() => handleDelete(row._id || row.id)}>
            <BsTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  const filteredUsers = users.filter((row) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      (row.username || '').toLowerCase().includes(normalizedSearch) ||
      (row.email || '').toLowerCase().includes(normalizedSearch);
    const matchesRole = roleFilter === 'all' || (row.role || '').toLowerCase() === roleFilter;
    const matchesStatus = statusFilter === 'all' || (row.status || '').toLowerCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleExportUsersReport = async () => {
    await downloadPdfReport({
      fileName: 'users-report.pdf',
      title: 'Users Report',
      rows: filteredUsers,
      columns: [
        { label: 'Username', getValue: (row) => row.username || '' },
        { label: 'Email', getValue: (row) => row.email || '' },
        { label: 'Role', getValue: (row) => row.role || '' },
        { label: 'Status', getValue: (row) => row.status || '' },
        { label: 'Created At', getValue: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '') },
      ],
      metadata: [
        { label: 'Role Filter', value: roleFilter === 'all' ? 'All' : roleFilter },
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
      ],
    });
  };

  return (
    <DashboardLayout>
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <Button variant="primary" onClick={() => setShowRegisterModal(true)}>Register User</Button>
      </div>
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Input
            label="Search"
            placeholder="Search by username or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[240px]"
          />
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All roles</option>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleExportUsersReport}>Export Report</Button>
        </div>
        <Table columns={columns} data={filteredUsers} loading={loading} />
      </Card>
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Register User">
        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Username" value={registerData.username} onChange={e => setRegisterData({ ...registerData, username: e.target.value })} required />
          <Input label="Email" value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} required />
          <Input label="Password" type="password" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} required />
          <div>
            <label className="block mb-1">Role</label>
            <select value={registerData.role} onChange={e => setRegisterData({ ...registerData, role: e.target.value })} className="form-select w-full">
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" variant="primary">Register</Button>
            <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve User">
        <form onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block mb-1">Wage Rate</label>
            <Input value={approveDetails.wageRate} onChange={e => setApproveDetails({ ...approveDetails, wageRate: e.target.value })} required />
          </div>
          <div>
            <label className="block mb-1">Department</label>
            <Input value={approveDetails.department} onChange={e => setApproveDetails({ ...approveDetails, department: e.target.value })} required />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" variant="primary">Approve</Button>
            <Button type="button" variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Username" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} required />
          <Input label="Email" type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} required />
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} className="form-select w-full">
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} className="form-select w-full">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button type="submit" variant="primary">Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
