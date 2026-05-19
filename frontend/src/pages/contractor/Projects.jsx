import React, { useEffect, useState, useMemo } from 'react'
import { BsCalendarCheck, BsCheckCircle, BsClock } from 'react-icons/bs'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import Table from '../../components/common/Table'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await contractorAPI.getProjects()
        setProjects(response.data)
      } catch (error) {
        console.error('Failed to fetch contractor projects', error)
        toast.error('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'due_date') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [projects, sortField, sortDirection]);

  const columns = [
    { key: 'name', label: 'Project', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'due_date', label: 'Due Date', sortable: true, render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Contractor Projects</h1>
        <p className="page-subtitle">Review your milestone progress and upcoming delivery dates.</p>
      </div>

      <div className="grid-3 gap-6">
        <Card>
          <div className="project-card">
            <BsCalendarCheck size={28} />
            <h3 className="text-lg font-bold">Deadline Tracking</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Stay on top of each contract milestone with clear due dates.</p>
          </div>
        </Card>
        <Card>
          <div className="project-card">
            <BsCheckCircle size={28} />
            <h3 className="text-lg font-bold">Milestone Status</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Easily see what is ready for review and what needs attention.</p>
          </div>
        </Card>
        <Card>
          <div className="project-card">
            <BsClock size={28} />
            <h3 className="text-lg font-bold">Time Estimates</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Manage deliveries and time commitments for each contract.</p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Table columns={columns} data={sortedProjects} loading={loading} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
      </div>
    </DashboardLayout>
  )
}

export default ContractorProjects
