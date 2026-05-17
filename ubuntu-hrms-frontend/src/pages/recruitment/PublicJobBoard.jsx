import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { BsBriefcase, BsGeoAlt, BsClock, BsSearch, BsBuilding } from 'react-icons/bs'

export default function PublicJobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    api.get('/jobs/public/list').then(r => setJobs(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const departments = [...new Set(jobs.map(j => j.department).filter(Boolean))]
  const types = [...new Set(jobs.map(j => j.employmentType).filter(Boolean))]

  const filtered = jobs.filter(j => {
    const s = search.toLowerCase()
    const ms = !search || (j.title||'').toLowerCase().includes(s) || (j.department||'').toLowerCase().includes(s)
    return ms && (deptFilter==='all'||j.department===deptFilter) && (typeFilter==='all'||j.employmentType===typeFilter)
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="absolute top-4 right-6">
            <Link to="/login" className="text-emerald-100 hover:text-white text-sm font-medium px-4 py-2 border border-emerald-400 rounded-lg hover:bg-emerald-600 transition">Staff Login</Link>
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Join Ubuntu Ecolodge</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-8">Build your career with us. Explore open positions at our eco-friendly hotel, farm, and grounds.</p>
          <div className="flex items-center max-w-md mx-auto bg-white rounded-full overflow-hidden shadow-lg">
            <BsSearch className="ml-4 text-slate-400" size={20} />
            <input type="text" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-3 text-slate-800 outline-none" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-slate-500">Filter:</span>
        <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} position{filtered.length!==1?'s':''} available</span>
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><BsBriefcase size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500 text-lg">No open positions match your filters</p></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map(job => (
              <div key={job.id||job._id} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div><h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm"><BsBuilding size={14}/><span>{job.department}</span><BsGeoAlt size={14}/><span>{job.location||'On-site'}</span></div></div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">{job.employmentType}</span>
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{(job.description||'').slice(0,150)}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400"><BsClock size={12}/>{job.createdAt?new Date(job.createdAt).toLocaleDateString():'recently'}</span>
                  <Link to={'/recruitment/apply/'+(job.id||job._id)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 shadow-sm">Apply Now</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}