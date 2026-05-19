import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DateDropdown from '../../components/common/DateDropdown'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BsGraphUp, BsPeople, BsCalendarCheck, BsCash, BsClock, BsDownload } from 'react-icons/bs'

const REPORT_TYPES = [
  { k: 'attendance', l: 'Attendance' },
  { k: 'leave', l: 'Leave' },
  { k: 'payroll', l: 'Payroll' },
  { k: 'kpi', l: 'KPI' },
  { k: 'employee', l: 'Employees' },
  { k: 'recruitment', l: 'Recruitment' },
  { k: 'complaints', l: 'Complaints' },
  { k: 'daily-labour', l: 'Daily Labour' },
]

export default function ReportsPage() {
  const navigate = useNavigate()
  const [type, setType] = useState('attendance')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState({ from: '', to: '' })
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [dept, setDept] = useState('all')

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to) params.to = range.to
      if (dept !== 'all') params.department = dept
      const r = await api.get('/reports/' + type, { params })
      setData(r.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() }, [type])

  const exportCSV = () => {
    if (!data?.rows?.length) return
    const headers = Object.keys(data.rows[0]).join(',')
    const rows = data.rows.map(r => Object.values(r).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = type + '-report.csv'; a.click()
  }

  const exportPDF = async () => {
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to) params.to = range.to
      if (dept !== 'all') params.department = dept
      params.type = type

      const url = new URL(`${import.meta.env.VITE_API_URL || 'http://75.119.139.249'}/api/reports/pdf`)
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

      window.open(url.toString(), '_blank')
    } catch (err) {
      toast.error('Failed to generate PDF')
    }
  }

  const maxVal = data?.rows?.length ? Math.max(...data.rows.map(r => Object.values(r).find(v => typeof v === 'number') || 0), 1) : 1

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Dynamic reports with filtering and export.</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <DateDropdown 
              selectedDate={fromDate}
              onDateChange={(date) => {
                setFromDate(date);
                setRange({...range, from: date ? date.toISOString().split('T')[0] : ''});
              }}
              label="From"
              showYear={true}
              showMonth={true}
              showDay={true}
              yearRange={5}
            />
          </div>
          <div>
            <DateDropdown 
              selectedDate={toDate}
              onDateChange={(date) => {
                setToDate(date);
                setRange({...range, to: date ? date.toISOString().split('T')[0] : ''});
              }}
              label="To"
              showYear={true}
              showMonth={true}
              showDay={true}
              yearRange={5}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Department</label>
            <select className="form-select text-sm" value={dept} onChange={e => setDept(e.target.value)}>
              <option value="all">All</option>
              <option value="Front Office">Front Office</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Farm">Farm</option>
              <option value="Grounds">Grounds</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={fetchReport}>Generate</Button>
          {data?.rows?.length > 0 && <Button variant="outline" size="sm" onClick={exportCSV}><BsDownload className="mr-1"/>Export CSV</Button>}
          {data?.rows?.length > 0 && <Button variant="outline" size="sm" onClick={exportPDF}><BsDownload className="mr-1"/>Export PDF</Button>}
        </div>
      </Card>

      <div className="flex gap-2 mb-4 flex-wrap">
        {REPORT_TYPES.map(t => (
          <Button key={t.k} variant={type === t.k ? 'primary' : 'outline'} size="sm" onClick={() => setType(t.k)}>{t.l}</Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : data?.summary ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(data.summary).map(([k, v]) => (
            <Card key={k} className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => navigate(`/${type.toLowerCase()}`)}>
              <div className="stat-card">
                <span className="stat-label">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="stat-value">{typeof v === 'number' ? v.toLocaleString() : v}</span>
                <p className="text-xs text-blue-500 mt-1">Click to view →</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {data?.rows?.length > 0 ? (
        <Card>
          <h3 className="font-bold mb-4 text-lg">{type.charAt(0).toUpperCase() + type.slice(1)} Breakdown</h3>
          <div className="space-y-3">
            {data.rows.map((row, i) => {
              const label = Object.values(row)[0]
              const val = Object.values(row).find(v => typeof v === 'number') || 0
              const pct = Math.round((val / maxVal) * 100)
              return (
                <div key={i} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{String(label)}</span>
                    <span className="text-slate-500">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: pct + '%', minWidth: pct > 0 ? '4px' : '0' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : !loading ? (
        <Card><div className="text-center py-8 text-slate-500">Select filters and click Generate to view report.</div></Card>
      ) : null}
    </DashboardLayout>
  )
}