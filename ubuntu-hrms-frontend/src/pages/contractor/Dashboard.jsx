import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BsBriefcase, BsFileEarmarkText, BsGraphUp } from 'react-icons/bs'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorDashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingInvoices: 0,
    deliveryRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await contractorAPI.getStats()
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch contractor stats', error)
        toast.error('Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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
        <h1 className="page-title">Contractor Dashboard</h1>
        <p className="page-subtitle">Track your project milestones, invoices, and deliverables.</p>
      </div>

      <div className="grid-3">
        <Card>
          <div className="stat-card">
            <div className="stat-icon">
              <BsBriefcase size={28} />
            </div>
            <span className="stat-label">Active Projects</span>
            <span className="stat-value">{stats.activeProjects}</span>
            <span className="stat-change">Ongoing contracts</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon success">
              <BsFileEarmarkText size={28} />
            </div>
            <span className="stat-label">Pending Invoices</span>
            <span className="stat-value">{stats.pendingInvoices}</span>
            <span className="stat-change">Awaiting approval</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon pending">
              <BsGraphUp size={28} />
            </div>
            <span className="stat-label">Delivery Rate</span>
            <span className="stat-value">{stats.deliveryRate}%</span>
            <span className="stat-change">On time</span>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid-2 gap-6">
        <Card>
          <div className="project-overview">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Project Milestones</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Monitor deadlines and deliverable status for your current contractor engagements.</p>
            <Link to="/contractor/projects" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              View Projects
            </Link>
          </div>
        </Card>

        <Card>
          <div className="project-overview">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Invoices & Payments</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Submit and track invoices for contract work from one place.</p>
            <Link to="/contractor/invoices" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Review Invoices
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ContractorDashboard
