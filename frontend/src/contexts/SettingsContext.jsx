import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const settingsMap = {};
      
      res.data.settings.forEach(setting => {
        let value = setting.setting_value;
        
        // Parse based on data_type
        if (setting.data_type === 'array') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error(`Failed to parse setting ${setting.setting_key}:`, e);
          }
        } else if (setting.data_type === 'number') {
          value = Number(value);
        } else if (setting.data_type === 'boolean') {
          value = value === 'true';
        }
        
        settingsMap[setting.setting_key] = value;
      });
      
      setSettings(settingsMap);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch settings:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await api.get('/settings/categories');
      setCategories(res.data.categories);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch categories:', err);
      }
    }
  };

  const refreshSettings = () => {
    fetchSettings();
    fetchCategories();
  };

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  const getSetting = (key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const getDepartments = () => {
    return getSetting('DEPARTMENTS', ['Engineering', 'Product', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Support', 'Legal', 'Other']);
  };

  const getEmploymentTypes = () => {
    return getSetting('EMPLOYMENT_TYPES', ['Full-Time', 'Part-Time', 'Contract', 'Internship']);
  };

  const getLeaveTypes = () => {
    return getSetting('LEAVE_TYPES', ['annual', 'sick', 'maternity', 'paternity', 'unpaid']);
  };

  const getJobStatuses = () => {
    return getSetting('JOB_STATUSES', ['open', 'closed']);
  };

  const getPunchActions = () => {
    return getSetting('PUNCH_ACTIONS', ['checkIn', 'breakOut', 'breakIn', 'checkOut']);
  };

  const getComplaintStatuses = () => {
    return getSetting('COMPLAINT_STATUSES', ['open', 'acknowledged', 'investigating', 'resolved', 'closed']);
  };

  const value = {
    settings,
    categories,
    loading,
    refreshSettings,
    getSetting,
    getDepartments,
    getEmploymentTypes,
    getLeaveTypes,
    getJobStatuses,
    getPunchActions,
    getComplaintStatuses,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
