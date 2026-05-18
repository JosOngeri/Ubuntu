import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const decodeToken = (jwtToken) => {
    try {
      const payload = jwtToken.split('.')[1]
      if (!payload) return null

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
      const decoded = JSON.parse(atob(padded))
      return decoded
    } catch {
      return null
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      const decoded = decodeToken(savedToken)
      console.log('[AuthContext] Decoded token on load:', decoded)
      if (decoded) {
        setToken(savedToken)
        setUser(decoded)
        axios.defaults.headers.common['x-auth-token'] = savedToken
      } else {
        localStorage.removeItem('authToken')
        delete axios.defaults.headers.common['x-auth-token']
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      })
      const { token, mustChangePassword, resetToken, msg } = response.data

      if (mustChangePassword) {
        return {
          mustChangePassword: true,
          resetToken,
          msg,
        }
      }

      setToken(token)
      axios.defaults.headers.common['x-auth-token'] = token
      localStorage.setItem('authToken', token)
      
      // Decode token to get user info
      const decoded = decodeToken(token)
      if (!decoded) {
        throw new Error('Invalid auth token received')
      }
      setUser(decoded)
      console.log('[AuthContext] Decoded token after login:', decoded)
      
      return {
        mustChangePassword: false,
        user: decoded,
      }
    } catch (error) {
      throw error.response?.data?.msg || 'Login failed'
    }
  }

  const register = async (username, password, role) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        password,
        role,
      })
      const { token } = response.data
      setToken(token)
      axios.defaults.headers.common['x-auth-token'] = token
      localStorage.setItem('authToken', token)
      
      const decoded = decodeToken(token)
      if (!decoded) {
        throw new Error('Invalid auth token received')
      }
      setUser(decoded)
      
      return decoded
    } catch (error) {
      throw error.response?.data?.msg || 'Registration failed'
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email,
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.msg || 'Failed to process forgot password request'
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword,
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.msg || 'Failed to reset password'
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['x-auth-token']
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register,
      forgotPassword,
      resetPassword,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
