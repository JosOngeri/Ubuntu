const toDate = (value) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

const formatDateOnly = (value) => {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const parseJson = (value, fallback = null) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
};

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const toOptionalText = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value).trim();
};

module.exports = {
  formatDateOnly,
  normalizeId,
  parseJson,
  toDate,
  toOptionalText,
};