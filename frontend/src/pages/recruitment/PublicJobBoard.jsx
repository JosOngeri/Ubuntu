import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { BsBriefcase, BsGeoAlt, BsClock, BsSearch, BsBuilding, BsFacebook, BsTwitter, BsInstagram, BsLinkedin, BsEnvelope, BsTelephone } from 'react-icons/bs'

export default function PublicJobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/jobs/public/list')
      .then(r => setJobs(r.data || []))
      .catch(err => {
        console.error('Failed to load jobs:', err)
        setError('Failed to load job listings. Please try again later.')
      })
      .finally(() => setLoading(false))
  }, [])

  // Fallback data to prevent white screen
  const fallbackJobs = [
    {
      id: 'fallback-1',
      title: 'Sample Job Position',
      department: 'Operations',
      location: 'Nairobi, Kenya',
      employmentType: 'Full-time',
      description: 'This is a sample job listing. The actual jobs will load shortly.'
    }
  ]

  const displayJobs = jobs.length > 0 ? jobs : (loading ? [] : fallbackJobs)

  const departments = [...new Set(displayJobs.map(j => j.department).filter(Boolean))]
  const types = [...new Set(displayJobs.map(j => j.employmentType).filter(Boolean))]

  const filtered = displayJobs.filter(j => {
    const s = search.toLowerCase()
    const ms = !search || (j.title||'').toLowerCase().includes(s) || (j.department||'').toLowerCase().includes(s)
    return ms && (deptFilter==='all'||j.department===deptFilter) && (typeFilter==='all'||j.employmentType===typeFilter)
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#CB7246] via-[#F27C12] to-[#CB7246] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="absolute top-4 right-6">
            <Link to="/login" className="text-white/90 hover:text-white text-sm font-medium px-4 py-2 border border-white/30 rounded-lg hover:bg-white/20 transition">Staff Login</Link>
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight font-serif">Join Ubuntu Ecolodge</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">Build your career with us. Explore open positions at our eco-friendly hotel, farm, and grounds.</p>
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
        {error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#CB7246] text-white rounded-lg hover:bg-[#F27C12] transition">Retry</button>
          </div>
        ) : loading ? (
          <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><BsBriefcase size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500 text-lg">No open positions match your filters</p></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map(job => (
              <div key={job.id||job._id} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-[#CB7246] hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div><h3 className="text-xl font-bold text-slate-900 group-hover:text-[#CB7246]">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm"><BsBuilding size={14}/><span>{job.department}</span><BsGeoAlt size={14}/><span>{job.location||'On-site'}</span></div></div>
                  <span className="px-3 py-1 bg-[#CB7246]/10 text-[#CB7246] rounded-full text-xs font-semibold">{job.employmentType}</span>
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{(job.description||'').slice(0,150)}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400"><BsClock size={12}/>{job.createdAt?new Date(job.createdAt).toLocaleDateString():'recently'}</span>
                  <Link to={'/recruitment/apply/'+(job.id||job._id)} className="px-5 py-2.5 bg-[#CB7246] text-white rounded-xl font-semibold text-sm hover:bg-[#F27C12] shadow-sm">Apply Now</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#373435] text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold font-serif mb-4">Ubuntu Ecolodge</h3>
              <p className="text-white/70 text-sm mb-4">Experience sustainable luxury in the heart of Kenya's beautiful landscapes.</p>
              <div className="flex gap-4">
                <a href="#" className="text-white/70 hover:text-white transition"><BsFacebook size={20} /></a>
                <a href="#" className="text-white/70 hover:text-white transition"><BsTwitter size={20} /></a>
                <a href="#" className="text-white/70 hover:text-white transition"><BsInstagram size={20} /></a>
                <a href="#" className="text-white/70 hover:text-white transition"><BsLinkedin size={20} /></a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#CB7246]">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/recruitment/jobs-board" className="hover:text-white transition">Job Openings</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Staff Login</Link></li>
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#CB7246]">Contact Us</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><BsEnvelope size={16} /> info@ubuntuecolodge.com</li>
                <li className="flex items-center gap-2"><BsTelephone size={16} /> +254 700 123 456</li>
                <li className="flex items-center gap-2"><BsGeoAlt size={16} /> Nairobi, Kenya</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#CB7246]">Newsletter</h4>
              <p className="text-white/70 text-sm mb-3">Subscribe for job updates and news.</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 rounded-l-lg text-slate-800 outline-none text-sm" />
                <button className="px-4 py-2 bg-[#CB7246] hover:bg-[#F27C12] rounded-r-lg text-sm font-semibold transition">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/50">
            <p>&copy; 2026 Ubuntu Ecolodge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}