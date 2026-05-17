import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout'
import { downloadPdfReport } from '../../utils/reportExport'


const Permissions = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

  const handleRoleChange = async (user) => {
    try {
      await userAPI.assignRole(user._id || user.id, newRole);
      toast.success('Role updated');
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={(e) => {
            e.preventDefault();
            const userId = row._id || row.id || row.user_id || row.userId;
            if (!userId) {
              toast.error('User ID is missing');
              return;
            }
            navigate(`/admin/users/${userId}`);
          }}>
            View Details
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditingUser(row); setNewRole(row.role); }}>Change Role</Button>
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

    return matchesSearch && matchesRole;
  });

  const handleExportRolesReport = async () => {
    await downloadPdfReport({
      fileName: 'roles-permissions-report.pdf',
      title: 'Roles and Permissions Report',
      rows: filteredUsers,
      columns: [
        { label: 'Username', getValue: (row) => row.username || '' },
        { label: 'Email', getValue: (row) => row.email || '' },
        { label: 'Role', getValue: (row) => row.role || '' },
        { label: 'Status', getValue: (row) => row.status || '' },
      ],
      metadata: [
        { label: 'Role Filter', value: roleFilter === 'all' ? 'All' : roleFilter },
      ],
    });
  };

  return (
    <DashboardLayout>
    <div>
      <h2 className="text-xl font-bold mb-4">Permissions & Roles Management</h2>
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
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleExportRolesReport}>Export Report</Button>
        </div>
        <Table columns={columns} data={filteredUsers} loading={loading} />
      </Card>
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Change Role for {editingUser.username}</h3>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="form-select w-full mb-4">
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => handleRoleChange(editingUser)}>Save</Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default Permissions;
