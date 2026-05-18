import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsFlag, BsPerson, BsBuilding, BsClock } from 'react-icons/bs'

const CATS = {
  guest: ['Service Quality','Food Quality','Room Condition','Billing','Noise','Theft/Loss','Other'],
  employee: ['Colleague Grievance','Supervisor Grievance','Harassment','Discrimination','Working Conditions','Pay Dispute','Other'],
}
const UC = { critical:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-slate-100 text-slate-600' }
const SC = { open:'bg-red-100 text-red-700', acknowledged:'bg-blue-100 text-blue-700', investigating:'bg-purple-100 text-purple-700', resolved:'bg-green-100 text-green-700', closed:'bg-slate-100 text-slate-600' }

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ type:'guest', category:'', description:'', urgency:'medium', guestName:'', guestRoom:'', department:'' })

  const fetchAll = async () => {
    setLoading(true)
    try { const r = await api.get('/complaints'); setComplaints(r.data||[]) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])
  
  const create = async () => {
    try { await api.post('/complaints', form); toast.success('Filed'); setShowForm(false); setForm({...form, category:'', description:''}); fetchAll() }
    catch(e) { toast.error(e.response?.data?.msg||'Failed') }
  }
  const updateStatus = async (id, status) => {
    try { await api.put('/complaints/'+id+'/status', { status }); toast.success('Updated'); fetchAll() }
    catch { toast.error('Failed') }
  }
  const resolve = async (id) => {
    const r = prompt('Resolution:')
    if (!r) return
    try { await api.put('/complaints/'+id+'/resolve', { resolution: r }); toast.success('Resolved'); fetchAll() }
    catch { toast.error('Failed') }
  }
  const close = async (id) => {
    try { await api.put('/complaints/'+id+'/close'); toast.success('Closed'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const filtered = filter==='all' ? complaints : complaints.filter(c=>c.status===filter)
  const openCount = complaints.filter(c=>['open','acknowledged','investigating'].includes(c.status)).length

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Complaints & Conflicts</h1>
        <p className="page-subtitle">Manage guest complaints and employee grievances with SLA tracking.</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{complaints.length}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Open</span><span className="stat-value text-red-600">{openCount}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Resolved</span><span className="stat-value text-green-600">{complaints.filter(c=>c.status==='resolved').length}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Closed</span><span className="stat-value">{complaints.filter(c=>c.status==='closed').length}</span></div></Card>
      </div>
      <div className="flex gap-2 mb-4">
        {['all','open','investigating','resolved'].map(f=><Button key={f} variant={filter===f?'primary':'secondary'} size="sm" onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</Button>)}
        <Button variant="primary" size="sm" className="ml-auto" onClick={()=>setShowForm(!showForm)}><BsFlag className="mr-1"/>File Complaint</Button>
      </div>
      {showForm && (
        <Card className="mb-4">
          <h3 className="font-bold mb-3">File Complaint</h3>
          <div className="grid grid-cols-2 gap-3">
            <select className="form-select text-sm" value={form.type} onChange={e=>setForm({...form,type:e.target.value,category:''})}>
              <option value="guest">Guest</option><option value="employee">Employee</option>
            </select>
            <select className="form-select text-sm" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">Category</option>
              {CATS[form.type].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select text-sm" value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
            {form.type==='guest'?<>
              <input className="form-input text-sm" placeholder="Guest Name" value={form.guestName} onChange={e=>setForm({...form,guestName:e.target.value})}/>
              <input className="form-input text-sm" placeholder="Room" value={form.guestRoom} onChange={e=>setForm({...form,guestRoom:e.target.value})}/>
            </>:<input className="form-input text-sm" placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/>}
          </div>
          <textarea className="form-input text-sm w-full mt-3" rows={3} placeholder="Describe the complaint..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={create}>Submit</Button>
            <Button variant="secondary" size="sm" onClick={()=>setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      
      {loading ? <div className="grid gap-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
      : filtered.length===0 ? <Card><div className="text-center py-8 text-slate-500">No complaints.</div></Card>
      : <div className="grid gap-3">{filtered.map(c=>(
        <Card key={c._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={()=>setSelected(selected===c._id?null:c._id)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={'px-2 py-0.5 rounded text-xs font-medium '+(c.type==='guest'?'bg-purple-100 text-purple-700':'bg-indigo-100 text-indigo-700')}>{c.type}</span>
                <span className={'px-2 py-0.5 rounded text-xs font-medium '+UC[c.urgency]}>{c.urgency}</span>
                <span className={'px-2 py-0.5 rounded text-xs font-medium '+SC[c.status]}>{c.status}</span>
                {c.slaDeadline && new Date(c.slaDeadline)<new Date() && c.status!=='closed' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">OVERDUE</span>}
              </div>
              <h4 className="font-bold">{c.category}</h4>
              <p className="text-sm text-slate-600 mt-1">{c.description?.slice(0,120)}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                {c.guestName && <span><BsPerson className="inline mr-1" size={10}/>{c.guestName}{c.guestRoom&&' · Rm '+c.guestRoom}</span>}
                {c.department && <span><BsBuilding className="inline mr-1" size={10}/>{c.department}</span>}
                <span><BsClock className="inline mr-1" size={10}/>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {selected===c._id && (
            <div className="mt-4 pt-4 border-t" onClick={e=>e.stopPropagation()}>
              <h4 className="font-semibold text-sm mb-2">Timeline</h4>
              <div className="space-y-2 mb-4">
                {(c.timeline||[]).map((t,i)=><div key={i} className="flex gap-2 text-xs"><span className="text-slate-400 w-20 flex-shrink-0">{new Date(t.timestamp).toLocaleString()}</span><span className="font-medium">{t.action}</span>{t.notes&&<span className="text-slate-500"> — {t.notes}</span>}</div>)}
              </div>
              <div className="flex gap-2">
                {c.status==='open' && <Button variant="primary" size="sm" onClick={()=>updateStatus(c._id,'acknowledged')}>Acknowledge</Button>}
                {(c.status==='open'||c.status==='acknowledged') && <Button variant="secondary" size="sm" onClick={()=>updateStatus(c._id,'investigating')}>Investigate</Button>}
                {c.status==='investigating' && <Button variant="primary" size="sm" onClick={()=>resolve(c._id)}>Resolve</Button>}
                {c.status==='resolved' && <Button variant="secondary" size="sm" onClick={()=>close(c._id)}>Close</Button>}
              </div>
            </div>
          )}
        </Card>
      ))}</div>}
    </DashboardLayout>
  )
}