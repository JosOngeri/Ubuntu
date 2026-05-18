import React, { useEffect, useState } from 'react'
import { BsCalendarCheck, BsCheckCircle, BsClock } from 'react-icons/bs'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{project.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{project.status}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{project.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ContractorProjects
