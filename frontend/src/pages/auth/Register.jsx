import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ToastContainer, toast } from 'react-toastify'
import { BsPersonPlusFill, BsCheckCircle } from 'react-icons/bs'
import './Auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields')
      return false
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long')
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

    // Password strength check
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
        await register(formData.username, formData.password, formData.role)
        toast.success('Registration successful! Redirecting...')

        setTimeout(() => {
        navigate('/login')
        }, 500)
        } catch (error) {
      toast.error(typeof error === 'string' ? error : (error?.message || 'Registration failed. Please try again.'))
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
            <BsPersonPlusFill size={48} />
          </div>
          <h1>Create Account</h1>
          <p>Join UBUNTU HRMS Today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Choose your username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              style={{
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              className="form-group-select"
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create a strong password"
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
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="auth-links">
          <div className="auth-divider">
            <span className="auth-divider-text">Already have an account?</span>
          </div>
          <Link to="/login" className="auth-link">
            Sign In Here
          </Link>
        </div>

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

export default Register
