import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { attendanceAPI, employeeAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { BsGeoAlt, BsClock, BsCheckCircle, BsArrowLeft, BsClipboardCheck } from 'react-icons/bs'
import { useSettings } from '../../contexts/SettingsContext'

const getStoredDeviceId = () => localStorage.getItem('biometricDeviceId') || 'BIO-001'

export default function Punch() {
  const navigate = useNavigate()
  const { getPunchActions } = useSettings()
  const [biometricDeviceId, setBiometricDeviceId] = useState(getStoredDeviceId())
  const [employeeProfile, setEmployeeProfile] = useState(null)
  const [punchState, setPunchState] = useState('checkIn')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const PUNCH_ACTIONS = getPunchActions()

  useEffect(() => {
    localStorage.setItem('biometricDeviceId', biometricDeviceId)
  }, [biometricDeviceId])

  useEffect(() => {
    const fetchMyEmployee = async () => {
      try {
        const res = await employeeAPI.getMe()
        const profile = res.data || null
        setEmployeeProfile(profile)

        if (profile?.biometricDeviceId) {
          setBiometricDeviceId(profile.biometricDeviceId)
        }
      } catch {
        setEmployeeProfile(null)
      }
    }

    fetchMyEmployee()
  }, [])

  const captureLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setLocation(coords)
          resolve(coords)
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000 }
      )
    })

  const handleGetLocation = async () => {
    setLocating(true)
    try {
      await captureLocation()
      toast.success('Current location captured')
    } catch (error) {
      toast.error(error.message || 'Failed to get location')
    } finally {
      setLocating(false)
    }
  }

  const submitPunch = async (selectedPunchState = punchState) => {
    setLoading(true)
    try {
      const coords = location || (await captureLocation())
      const response = await attendanceAPI.manualSelfPunch({
        biometricDeviceId,
        punchState: selectedPunchState,
        geolocation: coords,
      })
      setLastResult(response.data)
      toast.success(response.data?.msg || 'Punch recorded successfully')
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.msg ||
        error.response?.data?.errors?.join(', ') ||
        error.message ||
        'Failed to record punch'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    setPunchState(action)
    await submitPunch(action)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <BsArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BsClipboardCheck />
              Manual Punch
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Record attendance from this page using your current location.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Punch Controls</h2>
                <p className="text-sm text-slate-500 mt-1">Choose an action, capture your location, then submit.</p>
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <BsClock />
                {new Date().toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="form-group">
                <label className="block text-sm font-medium mb-2">Biometric Device ID</label>
                <input
                  className="form-input w-full"
                  value={biometricDeviceId}
                  onChange={(e) => setBiometricDeviceId(e.target.value)}
                  placeholder="BIO-001"
                />
                <p className="text-xs text-slate-500 mt-2">Stored locally for faster future punches.</p>
                {employeeProfile?.biometricDeviceId && (
                  <p className="text-xs text-green-700 mt-1">Loaded from your employee profile.</p>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium mb-2">Selected Action</label>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
                  <div className="text-lg font-semibold capitalize">{punchState}</div>
                  <div className="text-sm text-slate-500 mt-1">Current punch type to send to attendance.</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {PUNCH_ACTIONS.map((action) => (
                <Button
                  key={action.value}
                  type="button"
                  variant={action.tone}
                  loading={loading && punchState === action.value}
                  onClick={() => handleAction(action.value)}
                  className="w-full"
                >
                  {action.label}
                </Button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleGetLocation} loading={locating}>
                Capture Current Location
              </Button>
              <Button type="button" variant="primary" onClick={() => submitPunch()} loading={loading}>
                Submit Selected Action
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BsGeoAlt />
              Location Status
            </h3>

            {location ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Latitude</p>
                  <p className="font-semibold">{location.lat}</p>
                </div>
                <div>
                  <p className="text-slate-500">Longitude</p>
                  <p className="font-semibold">{location.lng}</p>
                </div>
                <div>
                  <p className="text-slate-500">Accuracy</p>
                  <p className="font-semibold">{Math.round(location.accuracy)} meters</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Your current location has not been captured yet. The punch request requires geolocation.
              </div>
            )}

            {lastResult && (
              <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300 mb-2">
                  <BsCheckCircle />
                  Last Result
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <div>{lastResult.msg || 'Punch recorded'}</div>
                  {lastResult.recordedTime && <div>Recorded: {new Date(lastResult.recordedTime).toLocaleString()}</div>}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-bold mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
            <li>Choose the punch action that matches your attendance event.</li>
            <li>Capture your current location before submitting.</li>
            <li>The server validates your location against the office radius.</li>
            <li>If your device ID changes, update it here once and it will be saved locally.</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}