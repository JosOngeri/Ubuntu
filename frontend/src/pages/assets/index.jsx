import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsBox, BsPerson, BsArrowReturnLeft, BsPlus } from 'react-icons/bs'

export default function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'equipment', serialNumber: '', condition: 'good' })
  const [assignId, setAssignId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try { const r = await api.get('/assets'); setAssets(r.data||[]) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const create = async () => {
    try { await api.post('/assets', form); toast.success('Added'); setShowForm(false); setForm({ name: '', type: 'equipment', serialNumber: '', condition: 'good' }); fetchAll() }
    catch(e) { toast.error(e.response?.data?.msg||'Failed') }
  }
  const assign = async () => {
    const empId = prompt('Employee ID:')
    if (!empId) return
    try { await api.put('/assets/'+assignId+'/assign', { employeeId: empId }); toast.success('Assigned'); setAssignId(null); fetchAll() }
    catch { toast.error('Failed') }
  }
  const returnAsset = async (id) => {
    try { await api.put('/assets/'+id+'/return'); toast.success('Returned'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const totalAssigned = assets.filter(a=>a.status==='assigned').length
  const totalAvailable = assets.filter(a=>a.status==='available').length

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Asset Management</h1>
        <p className="page-subtitle">Register, assign, and track hotel assets and equipment.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{assets.length}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Assigned</span><span className="stat-value text-blue-600">{totalAssigned}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Available</span><span className="stat-value text-green-600">{totalAvailable}</span></div></Card>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant="primary" size="sm" onClick={()=>setShowForm(!showForm)}>+ Add Asset</Button>
      </div>
      {showForm && (
        <Card className="mb-4">
          <h3 className="font-bold mb-3">Register Asset</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="form-input text-sm" placeholder="Asset Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <select className="form-select text-sm" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="equipment">Equipment</option><option value="furniture">Furniture</option>
              <option value="electronics">Electronics</option><option value="vehicle">Vehicle</option>
              <option value="tool">Tool</option><option value="other">Other</option>
            </select>
            <input className="form-input text-sm" placeholder="Serial Number" value={form.serialNumber} onChange={e=>setForm({...form,serialNumber:e.target.value})}/>
            <select className="form-select text-sm" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}>
              <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={create}>Save</Button>
            <Button variant="outline" size="sm" onClick={()=>setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      {assignId && (
        <Card className="mb-4">
          <h3 className="font-bold mb-3">Assign Asset</h3>
          <p className="text-sm text-slate-500 mb-3">Enter employee ID to assign this asset.</p>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={assign}>Confirm Assign</Button>
            <Button variant="outline" size="sm" onClick={()=>setAssignId(null)}>Cancel</Button>
          </div>
        </Card>
      )}
      {loading ? <div className="grid gap-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
      : assets.length===0 ? <Card><div className="text-center py-8 text-slate-500">No assets registered.</div></Card>
      : <div className="grid gap-3">{assets.map(a=>(
        <Card key={a._id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BsBox size={20} className="text-slate-400"/>
            <div>
              <h4 className="font-bold">{a.name} <span className="text-xs text-slate-400">({a.type})</span></h4>
              <p className="text-xs text-slate-500">{a.serialNumber||'No S/N'} · {a.condition} · <span className={a.status==='assigned'?'text-blue-600 font-medium':'text-green-600 font-medium'}>{a.status}</span></p>
              {a.assignedTo && <p className="text-xs text-slate-400"><BsPerson className="inline mr-1" size={10}/>{a.assignedTo?.firstName} {a.assignedTo?.lastName}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {a.status==='available' && <Button variant="primary" size="sm" onClick={()=>setAssignId(a._id)}>Assign</Button>}
            {a.status==='assigned' && <Button variant="outline" size="sm" onClick={()=>returnAsset(a._id)}><BsArrowReturnLeft className="mr-1"/>Return</Button>}
          </div>
        </Card>
      ))}</div>}
    </DashboardLayout>
  )
}