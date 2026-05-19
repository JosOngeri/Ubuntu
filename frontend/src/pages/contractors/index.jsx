import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsFileText, BsCheckCircle, BsXCircle, BsClock, BsCash, BsPerson, BsFlag } from 'react-icons/bs'

export default function ContractorsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('quotes')
  const [quotes, setQuotes] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMs, setSelectedMs] = useState(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyId, setVerifyId] = useState(null)
  const [verifyForm, setVerifyForm] = useState({ timeliness: 80, budgetAdherence: 80, quality: 80, notes: '' })
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

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
    setRejectId(id)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) return toast.error('Rejection reason is required')
    try {
      await api.put('/contractor-lifecycle/quotes/'+rejectId+'/reject', { reason: rejectReason })
      toast.success('Quote rejected')
      setShowRejectModal(false)
      fetchAll()
    } catch { toast.error('Failed') }
  }
  const openVerifyModal = (id) => {
    setVerifyId(id)
    setVerifyForm({ timeliness: 80, budgetAdherence: 80, quality: 80, notes: '' })
    setShowVerifyModal(true)
  }
  const verifyMilestone = async () => {
    try {
      await api.put('/contractor-lifecycle/milestones/'+verifyId+'/verify', {
        timeliness: verifyForm.timeliness,
        budgetAdherence: verifyForm.budgetAdherence,
        quality: verifyForm.quality,
        notes: verifyForm.notes,
        approved: true
      })
      toast.success('Milestone verified')
      setShowVerifyModal(false)
      setVerifyId(null)
      fetchAll()
    } catch { toast.error('Verification failed') }
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
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => { setTab('quotes'); toast.info('Showing all quotes'); }}><div className="stat-card"><span className="stat-label">Pending Quotes</span><span className="stat-value text-yellow-600">{pendingQuotes}</span><p className="text-xs text-blue-500 mt-1">Click to view →</p></div></Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => { setTab('milestones'); toast.info('Showing all milestones'); }}><div className="stat-card"><span className="stat-label">Active Milestones</span><span className="stat-value text-blue-600">{activeMs}</span><p className="text-xs text-blue-500 mt-1">Click to view →</p></div></Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => { setTab('milestones'); toast.info('Showing pending payments'); }}><div className="stat-card"><span className="stat-label">Awaiting Payment</span><span className="stat-value text-green-600">{pendingPayment}</span><p className="text-xs text-blue-500 mt-1">Click to view →</p></div></Card>
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
                  <button onClick={() => toast.info(`Quote status: ${q.status}`)} className={'px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity '+(q.status==='approved'?'bg-green-100 text-green-700':q.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700')}>{q.status}</button>
                  <span className="text-xs text-slate-400"><BsClock className="inline mr-1" size={10}/>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold">{q.projectTitle||'Untitled Project'}</h4>
                <p className="text-sm text-slate-600 mt-1">{q.description?.slice(0,150)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span><BsPerson className="inline mr-1" size={10}/><button onClick={() => navigate(`/contractor/portal`)} className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer">{q.contractorId?.firstName} {q.contractorId?.lastName}</button></span>
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
                  <button onClick={() => toast.info(`Milestone status: ${m.status}`)} className={'px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity '+(m.status==='completed'?'bg-green-100 text-green-700':m.status==='verified'?'bg-purple-100 text-purple-700':m.status==='paid'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700')}>{m.status}</button>
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
                  {m.status==='in_progress' && <Button variant="primary" size="sm" onClick={()=>openVerifyModal(m._id)}>Verify & Score</Button>}
                  {m.status==='submitted' && <Button variant="primary" size="sm" onClick={()=>openVerifyModal(m._id)}>Verify & Score</Button>}
                  {m.status==='verified' && <Button variant="primary" size="sm" onClick={()=>releasePayment(m._id)}><BsCash className="mr-1"/>Release Payment</Button>}
                </div>
              </div>
            )}
          </Card>
        ))}</div>
      )}
      <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title="Verify Milestone & Score KPI">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Timeliness: {verifyForm.timeliness}%</label>
            <input type="range" min="0" max="100" value={verifyForm.timeliness} onChange={e=>setVerifyForm({...verifyForm, timeliness: +e.target.value})} className="w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Budget Adherence: {verifyForm.budgetAdherence}%</label>
            <input type="range" min="0" max="100" value={verifyForm.budgetAdherence} onChange={e=>setVerifyForm({...verifyForm, budgetAdherence: +e.target.value})} className="w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quality: {verifyForm.quality}%</label>
            <input type="range" min="0" max="100" value={verifyForm.quality} onChange={e=>setVerifyForm({...verifyForm, quality: +e.target.value})} className="w-full"/>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium">Overall Score: <span className="text-lg font-bold text-primary">{Math.round((verifyForm.timeliness + verifyForm.budgetAdherence + verifyForm.quality) / 3)}%</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="form-input text-sm w-full" rows={2} placeholder="Additional notes..." value={verifyForm.notes} onChange={e=>setVerifyForm({...verifyForm, notes: e.target.value})}/>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="primary" size="sm" onClick={verifyMilestone}>Approve & Score</Button>
            <Button variant="secondary" size="sm" onClick={()=>setShowVerifyModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {showRejectModal && (
        <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Quote">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rejection Reason</label>
              <textarea
                className="form-input w-full"
                rows="3"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejecting this quote..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={submitReject}>Reject Quote</Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}