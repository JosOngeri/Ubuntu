import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsFileText, BsCheckCircle, BsXCircle, BsClock, BsCash, BsPerson, BsFlag } from 'react-icons/bs'

export default function ContractorsPage() {
  const [tab, setTab] = useState('quotes')
  const [quotes, setQuotes] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMs, setSelectedMs] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [qRes, mRes] = await Promise.all([
        api.get('/contractor-lifecycle/quotes'),
        api.get('/contractor-lifecycle/milestones'),
      ])
      setQuotes(qRes.data || [])
      setMilestones(mRes.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const approveQuote = async (id) => {
    try { await api.put('/contractor-lifecycle/quotes/'+id+'/approve'); toast.success('Approved'); fetchAll() }
    catch { toast.error('Failed') }
  }
  const rejectQuote = async (id) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try { await api.put('/contractor-lifecycle/quotes/'+id+'/reject', { reason }); toast.success('Rejected'); fetchAll() }
    catch { toast.error('Failed') }
  }
  const verifyMilestone = async (id) => {
    const score = prompt('KPI Score (0-100):')
    if (!score) return
    try { await api.put('/contractor-lifecycle/milestones/'+id+'/verify', { kpiScore: +score }); toast.success('Verified'); fetchAll() }
    catch { toast.error('Failed') }
  }
  const releasePayment = async (id) => {
    try { await api.put('/contractor-lifecycle/milestones/'+id+'/pay'); toast.success('Payment released'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const pendingQuotes = quotes.filter(q=>q.status==='pending').length
  const activeMs = milestones.filter(m=>m.status==='in_progress').length
  const pendingPayment = milestones.filter(m=>m.status==='verified').length
  
  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Contractor Lifecycle</h1>
        <p className="page-subtitle">Manage quotes, milestones, and payments for contractors.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><div className="stat-card"><span className="stat-label">Pending Quotes</span><span className="stat-value text-yellow-600">{pendingQuotes}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Active Milestones</span><span className="stat-value text-blue-600">{activeMs}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Awaiting Payment</span><span className="stat-value text-green-600">{pendingPayment}</span></div></Card>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant={tab==='quotes'?'primary':'secondary'} size="sm" onClick={()=>setTab('quotes')}>Quotes</Button>
        <Button variant={tab==='milestones'?'primary':'secondary'} size="sm" onClick={()=>setTab('milestones')}>Milestones</Button>
      </div>
      {loading ? <div className="grid gap-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
      : tab === 'quotes' ? (
        quotes.length === 0 ? <Card><div className="text-center py-8 text-slate-500">No quotes submitted.</div></Card>
        : <div className="grid gap-3">{quotes.map(q=>(
          <Card key={q._id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={'px-2 py-0.5 rounded text-xs font-medium '+(q.status==='approved'?'bg-green-100 text-green-700':q.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700')}>{q.status}</span>
                  <span className="text-xs text-slate-400"><BsClock className="inline mr-1" size={10}/>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold">{q.projectTitle||'Untitled Project'}</h4>
                <p className="text-sm text-slate-600 mt-1">{q.description?.slice(0,150)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span><BsPerson className="inline mr-1" size={10}/>{q.contractorId?.firstName} {q.contractorId?.lastName}</span>
                  <span><BsCash className="inline mr-1" size={10}/>KSh {(q.amount||0).toLocaleString()}</span>
                  {q.timeline && <span>{q.timeline} days</span>}
                </div>
              </div>
              {q.status==='pending' && <div className="flex gap-2 ml-4">
                <Button variant="primary" size="sm" onClick={()=>approveQuote(q._id)}><BsCheckCircle className="mr-1"/>Approve</Button>
                <Button variant="outline" size="sm" onClick={()=>rejectQuote(q._id)}><BsXCircle className="mr-1"/>Reject</Button>
              </div>}
            </div>
          </Card>
        ))}</div>
              ) : (
        milestones.length === 0 ? <Card><div className="text-center py-8 text-slate-500">No milestones.</div></Card>
        : <div className="grid gap-3">{milestones.map(m=>(
          <Card key={m._id} className="cursor-pointer" onClick={()=>setSelectedMs(selectedMs===m._id?null:m._id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={'px-2 py-0.5 rounded text-xs font-medium '+(m.status==='completed'?'bg-green-100 text-green-700':m.status==='verified'?'bg-purple-100 text-purple-700':m.status==='paid'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700')}>{m.status}</span>
                  <span className="text-xs text-slate-400">{(m.progress||0)}% complete</span>
                </div>
                <h4 className="font-bold">{m.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{m.description?.slice(0,120)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span><BsCash className="inline mr-1" size={10}/>KSh {(m.budget||0).toLocaleString()}</span>
                  {m.deadline && <span><BsClock className="inline mr-1" size={10}/>Due: {new Date(m.deadline).toLocaleDateString()}</span>}
                  {m.kpiScore != null && <span><BsFlag className="inline mr-1" size={10}/>KPI: {m.kpiScore}</span>}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className="bg-primary h-1.5 rounded-full" style={{width:(m.progress||0)+'%'}}/>
                </div>
              </div>
            </div>
            {selectedMs===m._id && (
              <div className="mt-4 pt-4 border-t" onClick={e=>e.stopPropagation()}>
                {m.photos?.length > 0 && <div className="flex gap-2 mb-3">{m.photos.map((p,i)=><img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover"/>)}</div>}
                <div className="flex gap-2">
                  {m.status==='in_progress' && <Button variant="primary" size="sm" onClick={()=>verifyMilestone(m._id)}>Verify & Score</Button>}
                  {m.status==='verified' && <Button variant="primary" size="sm" onClick={()=>releasePayment(m._id)}><BsCash className="mr-1"/>Release Payment</Button>}
                </div>
              </div>
            )}
          </Card>
        ))}</div>
      )}
    </DashboardLayout>
  )
}