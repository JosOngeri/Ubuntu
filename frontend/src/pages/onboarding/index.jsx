import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsPersonCheck, BsFileText, BsBoxArrowRight, BsCalendarCheck, BsStar, BsCheckCircle, BsClock, BsBuilding, BsPerson } from 'react-icons/bs'

const STEPS = [
  { name: 'offer_letter', label: 'Offer Letter', icon: BsFileText },
  { name: 'documents', label: 'Documents', icon: BsFileText },
  { name: 'department_assignment', label: 'Dept & Supervisor', icon: BsBuilding },
  { name: 'asset_allocation', label: 'Asset Allocation', icon: BsBoxArrowRight },
  { name: 'orientation', label: 'Orientation', icon: BsCalendarCheck },
  { name: 'probation_review_1', label: 'Probation Review #1', icon: BsStar },
  { name: 'probation_review_2', label: 'Probation Review #2', icon: BsStar },
  { name: 'confirmation', label: 'Confirmation', icon: BsCheckCircle },
]
export default function OnboardingPage() {
  const [onboardings, setOnboardings] = useState([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [showInitiate, setShowInitiate] = useState(false)
  const [form, setForm] = useState({ employeeId: '', department: '', position: '', probationMonths: 3 })
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [importing, setImporting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [oRes, eRes, aRes] = await Promise.all([api.get('/onboarding'), api.get('/employees'), api.get('/jobs/my-applications')])
      setOnboardings(oRes.data || [])
      setEmployees((eRes.data || []).filter(e => e.status !== 'Active'))
      setApplications(aRes.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])
const initiate = async () => {
    try { await api.post('/onboarding', form); toast.success('Started'); setShowInitiate(false); fetchAll() }
    catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  const completeStep = async (id, stepName) => {
    try { await api.put('/onboarding/' + id + '/step', { stepName }); toast.success('Done'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const addReview = async (id) => {
    const score = prompt('Score (0-100):'), comments = prompt('Comments:')
    if (!score) return
    try { await api.post('/onboarding/' + id + '/review', { score: +score, comments, recommendation: 'confirm' }); toast.success('Review added'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const generateLetter = async (id) => {
    try { await api.post('/onboarding/' + id + '/offer-letter'); toast.success('Letter generated'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const importApplicationToEmployee = async (applicationId, employeeId) => {
    setImporting(true)
    try {
      await api.post(`/jobs/applications/${applicationId}/import-to-employee/${employeeId}`)
      toast.success('Application data imported successfully')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const getDone = (o, name) => o.steps?.find(s => s.name === name)?.completed
  const inProg = onboardings.filter(o => o.status === 'in_progress').length
  const done = onboardings.filter(o => o.status === 'completed').length
return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Onboarding</h1>
        <p className="page-subtitle">Track employee onboarding from offer letter to confirmation.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{onboardings.length}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">In Progress</span><span className="stat-value text-blue-600">{inProg}</span></div></Card>
        <Card><div className="stat-card"><span className="stat-label">Completed</span><span className="stat-value text-green-600">{done}</span></div></Card>
      </div>
<div className="flex gap-2 mb-4">
        <Button variant="primary" size="sm" onClick={() => setShowInitiate(!showInitiate)}>+ New Onboarding</Button>
      </div>
{showInitiate && (
        <Card className="mb-4">
          <h3 className="font-bold mb-3">Initiate Onboarding</h3>
          <div className="grid grid-cols-2 gap-3">
            <select className="form-select text-sm" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <input className="form-input text-sm" placeholder="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            <input className="form-input text-sm" placeholder="Position" value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
            <input className="form-input text-sm" placeholder="Probation Months" type="number" value={form.probationMonths} onChange={e => setForm({...form, probationMonths: +e.target.value})} />
          </div>
          
          {form.employeeId && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Import from Job Application (Optional)</h4>
              <select className="form-select text-sm mb-2" value={selectedApplication || ''} onChange={e => setSelectedApplication(e.target.value)}>
                <option value="">Select Application</option>
                {applications.filter(a => a.applicantEmail === employees.find(e => e._id === form.employeeId)?.email).map(a => (
                  <option key={a.id} value={a.id}>{a.applicantName} - {a.jobId?.title || 'Unknown Position'}</option>
                ))}
              </select>
              {selectedApplication && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => importApplicationToEmployee(selectedApplication, form.employeeId)}
                  disabled={importing}
                >
                  {importing ? 'Importing...' : 'Import Application Data'}
                </Button>
              )}
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={initiate}>Start</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowInitiate(false); setSelectedApplication(null); setForm({ employeeId: '', department: '', position: '', probationMonths: 3 }) }}>Cancel</Button>
          </div>
        </Card>
      )}
{loading ? <div className="grid gap-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      : onboardings.length === 0 ? <Card><div className="text-center py-8 text-slate-500">No onboardings.</div></Card>
: <div className="grid gap-4">
        {onboardings.map(o => {
          const emp = o.employeeId || {}
          const cnt = o.steps?.filter(s => s.completed).length || 0
          return (
            <Card key={o._id}>
              <div className="flex items-center gap-3 mb-2">
          <BsPerson size={20} className="text-primary" />
          <div><h3 className="font-bold">{emp.firstName} {emp.lastName}</h3><p className="text-sm text-slate-500">{o.department||emp.department} — {o.position||emp.position}</p></div>
          <span className={'px-2 py-0.5 rounded-full text-xs font-medium '+(o.status==='completed'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700')}>{o.status}</span>
          </div><div className="w-full bg-slate-200 rounded-full h-2 mb-2"><div className="bg-primary h-2 rounded-full" style={{width:Math.round(cnt/8*100)+'%'}}/></div>
          <p className="text-xs text-slate-400 mb-3">{cnt}/8 steps</p><div className="flex flex-wrap gap-2">
          {STEPS.map(step => {
                  const isDone = getDone(o, step.name)
                  const Icon = step.icon
                  return <button key={step.name} onClick={() => {
                    if (isDone) return
                    if (step.name.startsWith('probation_review')) addReview(o._id)
                    else if (step.name === 'offer_letter') generateLetter(o._id)
                    else completeStep(o._id, step.name)
                  }} className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium '+(isDone?'bg-green-50 text-green-700 cursor-default':'bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary cursor-pointer')}><Icon size={12}/>{step.label}{isDone&&' ✓'}</button>
                })}
              </div>
              {o.probationEndDate && <p className="text-xs text-slate-400 mt-2">Probation ends: {new Date(o.probationEndDate).toLocaleDateString()}</p>}
            </Card>
          )
        })}
      </div>}
    </DashboardLayout>
  )
}
