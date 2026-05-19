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
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertId, setConvertId] = useState(null)
  const [convertForm, setConvertForm] = useState({ department: '', position: '', wageRate: '' })

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

  const openConvertModal = (id) => {
    setConvertId(id)
    setConvertForm({ department: '', position: '', wageRate: '' })
    setShowConvertModal(true)
  }
  const convert = async () => {
    if (!convertForm.department || !convertForm.position) { toast.error('Department and position are required'); return }
    try {
      await api.post('/daily-labourers/' + convertId + '/convert', convertForm)
      toast.success('Converted to employee')
      setShowConvertModal(false)
      setConvertId(null)
      fetchAll()
    } catch { toast.error('Failed') }
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
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => setTab('labourers')}><div className="stat-card"><span className="stat-label">Active</span><span className="stat-value">{activeCount}</span><p className="text-xs text-blue-500 mt-1">Click to view →</p></div></Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => setTab('attendance')}><div className="stat-card"><span className="stat-label">Today</span><span className="stat-value">{todayCount}</span><p className="text-xs text-blue-500 mt-1">Click to view →</p></div></Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => setTab('wages')}><div className="stat-card"><span className="stat-label">Wage Bill</span><span className="stat-value">KSh {wageBill.toLocaleString()}</span><p className="text-xs text-blue-500 mt-1">Click to view →</p></div></Card>
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
              <Button variant="outline" size="sm" onClick={()=>openConvertModal(l._id)} disabled={l.status!=='active'}><BsCheckCircle/>Convert</Button>
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
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowConvertModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Convert to Employee</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Department *</label>
                <select className="form-select text-sm w-full" value={convertForm.department} onChange={e=>setConvertForm({...convertForm, department: e.target.value})}>
                  <option value="">Select Department</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Farm">Farm</option>
                  <option value="Grounds">Grounds</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Security">Security</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <input className="form-input text-sm w-full" placeholder="e.g. Housekeeper, Cook" value={convertForm.position} onChange={e=>setConvertForm({...convertForm, position: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Wage Rate (KSh)</label>
                <input className="form-input text-sm w-full" type="number" placeholder="e.g. 15000" value={convertForm.wageRate} onChange={e=>setConvertForm({...convertForm, wageRate: e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="primary" size="sm" onClick={convert}>Convert</Button>
              <Button variant="outline" size="sm" onClick={()=>setShowConvertModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}