const { query } = require('../config/db');

// Simple in-memory cache for settings
const settingsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map();

/**
 * Get setting value from cache or database
 */
const getSetting = async (key) => {
  const cacheKey = key;
  const now = Date.now();
  
  // Check cache
  if (settingsCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (now - timestamp < CACHE_TTL) {
      return settingsCache.get(cacheKey);
    }
  }
  
  // Fetch from database
  try {
    const result = await query(
      `SELECT setting_value, data_type FROM settings WHERE setting_key = $1 AND is_active = true`,
      [key]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    let value = row.setting_value;
    
    // Parse based on data type
    if (row.data_type === 'array') {
      value = JSON.parse(value);
    } else if (row.data_type === 'number') {
      value = Number(value);
    } else if (row.data_type === 'boolean') {
      value = value === 'true';
    }
    
    // Cache the result
    settingsCache.set(cacheKey, value);
    cacheTimestamps.set(cacheKey, now);
    
    return value;
  } catch (err) {
    console.error(`Error fetching setting ${key}:`, err);
    return null;
  }
};

/**
 * Get settings by category from cache or database
 */
const getSettingsByCategory = async (category) => {
  const cacheKey = `category:${category}`;
  const now = Date.now();
  
  // Check cache
  if (settingsCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (now - timestamp < CACHE_TTL) {
      return settingsCache.get(cacheKey);
    }
  }
  
  // Fetch from database
  try {
    const result = await query(
      `SELECT setting_key, setting_value, data_type FROM settings WHERE category = $1 AND is_active = true ORDER BY setting_key`,
      [category]
    );
    
    const settings = {};
    
    for (const row of result.rows) {
      let value = row.setting_value;
      
      // Parse based on data type
      if (row.data_type === 'array') {
        value = JSON.parse(value);
      } else if (row.data_type === 'number') {
        value = Number(value);
      } else if (row.data_type === 'boolean') {
        value = value === 'true';
      }
      
      settings[row.setting_key] = value;
    }
    
    // Cache the result
    settingsCache.set(cacheKey, settings);
    cacheTimestamps.set(cacheKey, now);
    
    return settings;
  } catch (err) {
    console.error(`Error fetching settings for category ${category}:`, err);
    return {};
  }
};

/**
 * Invalidate cache for a specific key or category
 */
const invalidateCache = (key = null, category = null) => {
  if (key) {
    settingsCache.delete(key);
    cacheTimestamps.delete(key);
  }
  
  if (category) {
    const cacheKey = `category:${category}`;
    settingsCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
  }
  
  // If neither provided, clear all
  if (!key && !category) {
    settingsCache.clear();
    cacheTimestamps.clear();
  }
};

/**
 * Get all settings (with caching)
 */
const getAllSettings = async () => {
  const cacheKey = 'all';
  const now = Date.now();
  
  // Check cache
  if (settingsCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (now - timestamp < CACHE_TTL) {
      return settingsCache.get(cacheKey);
    }
  }
  
  // Fetch from database
  try {
    const result = await query(
      `SELECT setting_key, category, setting_value, data_type FROM settings WHERE is_active = true ORDER BY category, setting_key`
    );
    
    const settings = {};
    
    for (const row of result.rows) {
      let value = row.setting_value;
      
      // Parse based on data type
      if (row.data_type === 'array') {
        value = JSON.parse(value);
      } else if (row.data_type === 'number') {
        value = Number(value);
      } else if (row.data_type === 'boolean') {
        value = value === 'true';
      }
      
      settings[row.setting_key] = {
        value,
        category: row.category,
        dataType: row.data_type,
      };
    }
    
    // Cache the result
    settingsCache.set(cacheKey, settings);
    cacheTimestamps.set(cacheKey, now);
    
    return settings;
  } catch (err) {
    console.error('Error fetching all settings:', err);
    return {};
  }
};

/**
 * Get departments from settings
 */
const getDepartments = async () => {
  const departments = await getSetting('DEPARTMENTS');
  return departments || ['Engineering', 'Product', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Support', 'Legal', 'Other'];
};

/**
 * Get employment types from settings
 */
const getEmploymentTypes = async () => {
  const types = await getSetting('EMPLOYMENT_TYPES');
  return types || ['Full-Time', 'Part-Time', 'Contract', 'Internship'];
};

/**
 * Get leave types from settings
 */
const getLeaveTypes = async () => {
  const types = await getSetting('LEAVE_TYPES');
  return types || ['annual', 'sick', 'maternity', 'paternity', 'unpaid'];
};

/**
 * Get job statuses from settings
 */
const getJobStatuses = async () => {
  const statuses = await getSetting('JOB_STATUSES');
  return statuses || ['open', 'closed'];
};

/**
 * Get punch actions from settings
 */
const getPunchActions = async () => {
  const actions = await getSetting('PUNCH_ACTIONS');
  return actions || ['checkIn', 'breakOut', 'breakIn', 'checkOut'];
};

module.exports = {
  getSetting,
  getSettingsByCategory,
  invalidateCache,
  getAllSettings,
  getDepartments,
  getEmploymentTypes,
  getLeaveTypes,
  getJobStatuses,
  getPunchActions,
};
