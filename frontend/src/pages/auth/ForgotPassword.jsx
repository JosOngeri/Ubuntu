import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import { BsKey } from 'react-icons/bs'
import axios from 'axios'
import './Auth.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email,
      })
      
      toast.success('Password reset link sent to your email!')
      setSubmitted(true)
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message
      // Show user-friendly message even if account not found (security best practice)
      toast.info('If an account exists with this email, a reset link has been sent')
      setSubmitted(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <ToastContainer position="top-right" />
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <BsKey size={48} />
          </div>
          <h1>Reset Password</h1>
          <p>Recover Your Account Access</p>
        </div>

        {!submitted ? (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-success" style={{ background: '#f0f9ff', borderColor: '#0284c7', color: '#0c4a6e' }}>
                ℹ️ Enter your email address and we'll send you a link to reset your password
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
              </button>
            </form>

            <div className="auth-links">
              <div className="auth-divider">
                <span className="auth-divider-text">Remember your password?</span>
              </div>
              <Link to="/login" className="auth-link">
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          <div className="auth-form">
            <div className="auth-success" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 0 }}>
              <span style={{ fontSize: '32px' }}>✓</span>
              <strong>Check Your Email!</strong>
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                We've sent a password reset link to your email address. Please click the link in the email to reset your password.
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '8px' }}>
                The link will expire in 1 hour for security reasons.
              </span>
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '13px' }}>
              Redirecting to login in 3 seconds...
            </p>
            <Link to="/login" className="auth-link" style={{ marginTop: '12px' }}>
              Go Back to Sign In
            </Link>
          </div>
        )}

        <div className="auth-footer">
          <p>Didn't receive the email?</p>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            textAlign: 'left',
            fontSize: '12px',
            lineHeight: '1.8'
          }}>
            <li>• Check your spam folder</li>
            <li>• Verify the email address is correct</li>
            <li>• Try again in a few minutes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
