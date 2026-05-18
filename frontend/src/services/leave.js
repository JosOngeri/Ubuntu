import api from './api';

export const createLeave = (data) => api.post('/leaves', data);
export const getLeaves = () => api.get('/leaves');
export const updateLeave = (id, data) => api.put(`/leaves/${id}`, data);
export const deleteLeave = (id) => api.delete(`/leaves/${id}`);

export const getLeaveBalance = (employeeId) => api.get(`/leaves/balance/${employeeId}`);
export const requestLeave = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
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
};
