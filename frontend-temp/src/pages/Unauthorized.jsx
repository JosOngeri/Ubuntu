import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BsExclamationTriangle } from 'react-icons/bs'
import Button from '../components/common/Button'
// import './Error.css'

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <div className="error-container">
      <div className="error-content">
        <BsExclamationTriangle size={64} className="error-icon" />
        <h1>Access Denied</h1>
        <p>You don't have permission to access this resource.</p>
        <Button variant="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  )
}

export default Unauthorized
