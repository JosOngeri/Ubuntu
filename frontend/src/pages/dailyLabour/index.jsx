import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsPersonPlus, BsCalendarCheck, BsCash, BsCheckCircle, BsTrash, BsPeople } from 'react-icons/bs'

export default function DailyLabourPage() {
  const [labourers, setLabourers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [wages, setWages] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('labourers')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', idNumber: '', dailyRate: 500, skills: '' })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [lRes, aRes, wRes] = await Promise.all([
        api.get('/daily-labourers'), api.get('/daily-labourers/attendance'), api.get('/daily-labourers/wages')
      ])
      setLabourers(lRes.data || [])
      setAttendance(aRes.data || [])
      setWages(wRes.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])
  
  const create = async () => {
    try {
      await api.post('/daily-labourers', { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) })
      toast.success('Registered')
      setShowForm(false)
      setForm({ firstName: '', lastName: '', phone: '', idNumber: '', dailyRate: 500, skills: '' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  const markPresent = async (labourerId, assignedTo) => {
    try { await api.post('/daily-labourers/attendance', { labourerId, assignedTo }); toast.success('Recorded'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const convert = async (id) => {
    const dept = prompt('Department:'), pos = prompt('Position:')
    if (!dept) return
    try { await api.post('/daily-labourers/' + id + '/convert', { department: dept, position: pos }); toast.success('Converted'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const remove = async (id) => {
    if (!confirm('Remove?')) return
    try { await api.delete('/daily-labourers/' + id); toast.success('Removed'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const activeCount = labourers.filter(l => l.status === 'active').length
  const todayCount = attendance.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length
  const wageBill = wages?.summary?.reduce((s, w) => s + w.totalWage, 0) || 0

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Daily Labour</h1>
        <p className="page-subtitle">Register, track attendance, and manage casual labourers.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><div className="stat-card"><span className="stat-label">Active</span><span className="stat-value">{activeCount}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Today</span><span className="stat-value">{todayCount}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Wage Bill</span><span className="stat-value">KSh {wageBill.toLocaleString()}</span></div></Card>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant={tab==='labourers'?'primary':'secondary'} size="sm" onClick={()=>setTab('labourers')}>Labourers</Button>
        <Button variant={tab==='attendance'?'primary':'secondary'} size="sm" onClick={()=>setTab('attendance')}>Attendance</Button>
        <Button variant={tab==='wages'?'primary':'secondary'} size="sm" onClick={()=>setTab('wages')}>Wages</Button>
        <Button variant="primary" size="sm" className="ml-auto" onClick={()=>setShowForm(!showForm)}>+ Register</Button>
      </div>
      {showForm && (
        <Card className="mb-4">
          <h3 className="font-bold mb-3">Register Labourer</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="form-input text-sm" placeholder="First Name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/>
            <input className="form-input text-sm" placeholder="Last Name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/>
            <input className="form-input text-sm" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
            <input className="form-input text-sm" placeholder="ID Number" value={form.idNumber} onChange={e=>setForm({...form,idNumber:e.target.value})}/>
            <input className="form-input text-sm" placeholder="Daily Rate (KSh)" type="number" value={form.dailyRate} onChange={e=>setForm({...form,dailyRate:+e.target.value})}/>
            <input className="form-input text-sm" placeholder="Skills (comma separated)" value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})}/>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={create}>Save</Button>
            <Button variant="outline" size="sm" onClick={()=>setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      
      {loading ? <div className="grid gap-4">{[1,2,3].map(i=><div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
      : tab === 'labourers' ? (
        labourers.length === 0 ? <Card><div className="text-center py-8 text-slate-500">No labourers.</div></Card>
        : <div className="grid gap-3">{labourers.map(l=>(
          <Card key={l._id} className="flex items-center justify-between">
            <div><h4 className="font-bold">{l.firstName} {l.lastName}</h4><p className="text-xs text-slate-500">KSh {l.dailyRate}/day · {l.skills?.join(', ')||'—'} · {l.status}</p></div>
            <div className="flex gap-2">
              <select className="form-select text-xs py-1" onChange={e=>{if(e.target.value){markPresent(l._id,e.target.value);e.target.value=''}}}>
                <option value="">Mark Present →</option>
                <option value="farm">Farm</option><option value="housekeeping">Housekeeping</option>
                <option value="grounds">Grounds</option><option value="construction">Construction</option>
                <option value="kitchen">Kitchen</option><option value="other">Other</option>
              </select>
              <Button variant="outline" size="sm" onClick={()=>convert(l._id)} disabled={l.status!=='active'}><BsCheckCircle/>Convert</Button>
              <Button variant="outline" size="sm" onClick={()=>remove(l._id)}><BsTrash/></Button>
            </div>
          </Card>
        ))}</div>
      ) : tab === 'attendance' ? (
        attendance.length === 0 ? <Card><div className="text-center py-8 text-slate-500">No records.</div></Card>
        : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 px-3">Labourer</th><th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Status</th><th className="text-left py-2 px-3">Assigned</th><th className="text-left py-2 px-3">Wage</th></tr></thead><tbody>{attendance.slice(0,50).map(a=><tr key={a._id} className="border-b hover:bg-slate-50"><td className="py-2 px-3">{a.labourerId?.firstName} {a.labourerId?.lastName}</td><td className="py-2 px-3">{new Date(a.date).toLocaleDateString()}</td><td className="py-2 px-3">{a.status}</td><td className="py-2 px-3">{a.assignedTo}</td><td className="py-2 px-3">KSh {a.wageForDay}</td></tr>)}</tbody></table></div>
      ) : (
        wages?.summary?.length ? <Card><h3 className="font-bold mb-3">Wage Summary</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 px-3">Labourer</th><th className="text-left py-2 px-3">Days</th><th className="text-left py-2 px-3">Total</th></tr></thead><tbody>{wages.summary.map((s,i)=><tr key={i} className="border-b"><td className="py-2 px-3">{s.name}</td><td className="py-2 px-3">{s.days}</td><td className="py-2 px-3">KSh {s.totalWage.toLocaleString()}</td></tr>)}</tbody></table></div></Card> : <Card><div className="text-center py-8 text-slate-500">No wage data.</div></Card>
      )}
    </DashboardLayout>
  )
}