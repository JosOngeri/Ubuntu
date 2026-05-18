import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BsExclamationTriangle } from 'react-icons/bs'
import Button from '../components/common/Button'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'

const Unauthorized = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else if (user) {
      navigate('/dashboard')
    } else {
      navigate('/')
    }
  }

  return (
    <DashboardLayout>
      <div className="error-container">
        <div className="error-content">
          <BsExclamationTriangle size={64} className="error-icon" />
          <h1>Access Denied</h1>
          <p>You don't have permission to access this resource.</p>
          <Button variant="primary" onClick={handleGoBack}>
            Go Back
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Unauthorized
