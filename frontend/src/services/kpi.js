import api from './api';

export const createKPI = (data) => api.post('/kpis', data);
export const getKPIs = () => api.get('/kpis');
export const updateKPI = (id, data) => api.put(`/kpis/${id}`, data);
export const deleteKPI = (id) => api.delete(`/kpis/${id}`);

export const assignKPI = (data) => api.post('/kpi/assign', data);
export const evaluateKPI = (id, data) => api.put(`/kpi/${id}/evaluate`, data);
export const getEmployeeKPIs = (employeeId) => api.get(`/kpi/employee/${employeeId}`);
