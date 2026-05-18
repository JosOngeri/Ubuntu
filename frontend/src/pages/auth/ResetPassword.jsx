import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import { BsCheckLg } from 'react-icons/bs'
import axios from 'axios'
import './Auth.css'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const resetToken = searchParams.get('token')
    if (!resetToken) {
      setTokenError('Invalid or missing reset token. Please request a new password reset.')
      return
    }

    setToken(resetToken)
    // Verify token validity
    verifyToken(resetToken)
  }, [searchParams])

  const verifyToken = async (resetToken) => {
    try {
      // We'll verify the token when the user tries to reset
      setTokenValid(true)
    } catch (error) {
      setTokenError('Token verification failed. Please request a new password reset.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields')
      return false
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }

    const hasUpperCase = /[A-Z]/.test(formData.password)
    const hasLowerCase = /[a-z]/.test(formData.password)
    const hasNumber = /[0-9]/.test(formData.password)
    
    if (!(hasUpperCase && hasLowerCase && hasNumber)) {
      toast.warning('Password should contain uppercase, lowercase, and numbers for better security')
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword: formData.password,
      })

      toast.success('Password reset successful!')
      setResetSuccess(true)
      
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Failed to reset password. Please try again.'
      toast.error(errorMsg)
      if (error.response?.status === 400 || error.response?.status === 401) {
        setTokenError('Reset token expired or invalid. Please request a new password reset.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="auth-container">
        <ToastContainer position="top-right" />
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon" style={{ background: '#ef4444' }}>
              <span style={{ fontSize: '40px' }}>✕</span>
            </div>
            <h1>Link Expired</h1>
            <p>Unable to Reset Your Password</p>
          </div>

          <div className="auth-form">
            <div className="auth-error" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 0 }}>
              <strong>⚠️ Invalid Reset Link</strong>
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                {tokenError}
              </span>
            </div>
            <Link to="/forgot-password" className="auth-link" style={{ marginTop: '24px', display: 'block', textAlign: 'center' }}>
              Request New Reset Link
            </Link>
          </div>

          <div className="auth-footer">
            <p>Reset Link Lifetime:</p>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              textAlign: 'left',
              fontSize: '12px',
              lineHeight: '1.8'
            }}>
              <li>• Links expire after 1 hour</li>
              <li>• Request a new link if this one has expired</li>
              <li>• Check your email for the latest link</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="auth-container">
        <ToastContainer position="top-right" />
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>
              <BsCheckLg size={48} color="white" />
            </div>
            <h1>Password Reset Successfully!</h1>
            <p>Your Account is Now Secure</p>
          </div>

          <div className="auth-form">
            <div className="auth-success" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 0 }}>
              <span style={{ fontSize: '32px' }}>✓</span>
              <strong>All Done!</strong>
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </span>
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '13px' }}>
              Redirecting to login in 3 seconds...
            </p>
            <Link to="/login" className="auth-link" style={{ marginTop: '12px', display: 'block', textAlign: 'center' }}>
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <ToastContainer position="top-right" />
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <BsCheckLg size={48} />
          </div>
          <h1>Create New Password</h1>
          <p>Set a Strong Password to Secure Your Account</p>
        </div>

        {!tokenValid ? (
          <div className="auth-form">
            <div className="auth-error">
              Verifying reset link...
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '0 0 16px 0',
                  textAlign: 'left',
                }}
              >
                {showPassword ? '🙈 Hide Passwords' : '👁️ Show Passwords'}
              </button>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/login" className="auth-link">
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        <div className="auth-footer">
          <p style={{ marginBottom: '12px' }}>✓ Password Requirements:</p>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            textAlign: 'left',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <li>✓ At least 6 characters</li>
            <li>✓ Uppercase & lowercase letters</li>
            <li>✓ At least one number</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
