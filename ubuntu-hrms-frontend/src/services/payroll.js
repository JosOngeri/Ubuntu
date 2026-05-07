import api from './api';

export const disbursePayroll = (data) => api.post('/payroll/disburse', data);
export const getPayrolls = () => api.get('/payroll'); // If you add a GET endpoint
