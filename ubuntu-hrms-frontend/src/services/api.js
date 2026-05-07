// Users (Admin/HR)
export const userAPI = {
  getAll: () => api.get('/api/users'),
  register: (data) => api.post('/api/auth/register', data),
  approve: (id, details) => api.post(`/api/users/${id}/approve`, details),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
  assignRole: (id, role) => api.post(`/api/users/${id}/role`, { role }),
};
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ubuntu-hrms-epmc.onrender.com'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Ensure every protected request carries the latest JWT from storage.
api.interceptors.request.use(
  (config) => {
    if (typeof config.url === 'string' && config.url.startsWith('/') && !config.url.startsWith('/api')) {
      config.url = `/api${config.url}`
    }

    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers['x-auth-token'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-clear invalid sessions so the app can redirect to login cleanly.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
    }
    return Promise.reject(error)
  }
)

// Employees
export const employeeAPI = {
  getAll: () => api.get('/api/employees'),
  getMe: () => api.get('/api/employees/me'),
  getById: (id) => api.get(`/api/employees/${id}`),
  create: (data) => api.post('/api/employees', data),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  delete: (id) => api.delete(`/api/employees/${id}`),
}

// Attendance
export const attendanceAPI = {
  getByEmployeeId: (employeeId) => api.get(`/api/attendance/${employeeId}`),
  biometricPush: (data) => api.post('/api/attendance/biometrics/push', data),
  manualSelfPunch: (data) => api.post('/api/attendance/manual/self', data),
  managerManualPunch: (data) => api.post('/api/attendance/manual/manager', data),
  update: (id, data) => api.put(`/api/attendance/${id}`, data),
}

// Payroll
export const payrollAPI = {
  calculate: (period) => api.get(`/api/payroll/calculate/${period}`),
  disburse: () => api.post('/api/payroll/disburse'),
  getPayments: (status) => api.get('/api/payroll', { params: status ? { status } : undefined }),
  getPayslips: () => api.get('/api/payroll'),
  getApprovedPayslips: () => api.get('/api/payroll', { params: { status: 'Approved' } }),
  mpesaCallback: (data) => api.post('/api/payroll/mpesa-callback', data),
}

// KPIs
export const kpiAPI = {
  getEmployeeKPIs: (employeeId) => api.get(`/api/kpi/employee/${employeeId}`),
  assignKPI: (data) => api.post('/api/kpi/assign', data),
  evaluateKPI: (id, data) => api.put(`/api/kpi/${id}/evaluate`, data),
  create: (data) => api.post('/api/kpis', data),
  update: (id, data) => api.put(`/api/kpis/${id}`, data),
  delete: (id) => api.delete(`/api/kpis/${id}`),
}

// Leaves
export const leaveAPI = {
  getAll: () => api.get('/api/leaves'),
  getBalance: (employeeId) => api.get(`/api/leaves/balance/${employeeId}`),
  requestLeave: (data) => {
    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'attachment' && value instanceof File) {
        formData.append('attachment', value);
        return;
      }
      formData.append(key, value);
    });

    return api.post('/api/leaves/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateLeaveStatus: (id, approverOrPayload, statusMaybe) => {
    const payload =
      approverOrPayload && typeof approverOrPayload === 'object' && !Array.isArray(approverOrPayload)
        ? approverOrPayload
        : { approverId: approverOrPayload, status: statusMaybe };

    return api.put(`/api/leaves/${id}/status`, payload);
  },
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return api.put(`/api/leaves/${id}/upload-doc`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data) => api.post('/api/leaves', data),
  update: (id, data) => api.put(`/api/leaves/${id}`, data),
  delete: (id) => api.delete(`/api/leaves/${id}`),
}

// Contracts
export const contractAPI = {
  getByEmployeeId: (employeeId) => api.get(`/api/contracts/${employeeId}`),
  create: (data) => api.post('/api/contracts', data),
  update: (id, data) => api.put(`/api/contracts/${id}`, data),
  delete: (id) => api.delete(`/api/contracts/${id}`),
}

// Contractors
export const contractorAPI = {
  getStats: () => api.get('/api/contractors/stats'),
  getProjects: () => api.get('/api/contractors/projects'),
  getInvoices: () => api.get('/api/contractors/invoices'),
}

export default api
