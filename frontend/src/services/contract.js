import api from './api';

export const getContracts = () => api.get('/contracts');
export const deleteContract = (id) => api.delete(`/contracts/${id}`);

export const createContract = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'document' && value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (data.document instanceof File) {
    formData.append('document', data.document);
  }
  
  return api.post('/contracts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateContract = (id, data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'document' && value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (data.document instanceof File) {
    formData.append('document', data.document);
  }

  return api.put(`/contracts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
