import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ToastContainer, toast } from 'react-toastify'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { BsPersonCircle, BsEye, BsEyeSlash } from 'react-icons/bs'
import './Auth.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const result = await login(username, password)

      if (result.mustChangePassword) {
        toast.info(result.msg || 'Please change your password to continue')
        setTimeout(() => {
          navigate(`/reset-password?token=${result.resetToken}`)
        }, 500)
        return
      }

      const user = result.user
      toast.success('Login successful')
      
      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin/dashboard')
        } 
        else if (user.role === 'manager' || user.role === 'supervisor') {
          navigate('/manager/dashboard')}
        
            else if (user.role === 'employee') {
              navigate('/employee/dashboard')
            }
    
        else  {
          navigate('/contractor/dashboard')
        }
      }, 500)
    } catch (error) {
      toast.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <ToastContainer position="top-right" />
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/ubuntu-logo-with-tagline.png" alt="Ubuntu HRMS" className="auth-logo-img" />
          </div>
          <h1>UBUNTU HRMS</h1>
          <p>Human Resource Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
          <div className="auth-divider">
            <span className="auth-divider-text">Don't have an account?</span>
          </div>
          <Link to="/register" className="auth-link">
            Create New Account
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Login
