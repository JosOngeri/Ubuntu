# Flexible Settings System Implementation Plan

This plan implements a comprehensive admin settings system to make all hardcoded dropdown values, lists, and selections configurable by owner and manager roles, with full audit logging and impact analysis.

## Scope

**Hardcoded values to make configurable:**
- DEPARTMENTS (Engineering, Product, Sales, Marketing, Finance, HR, Operations, Support, Legal, Other)
- Employment types (Full-Time, Part-Time, Contract, Internship)
- Leave types (annual, sick, maternity, paternity, unpaid)
- Statutory types (maternity)
- Onboarding STEPS (offer_letter, documents, department_assignment, asset_allocation, orientation, probation_review_1, probation_review_2, probation_review_3, final_review)
- PUNCH_ACTIONS (checkIn, breakOut, breakIn, checkOut)
- Job statuses (open, closed)
- Leave statuses (pending, approved, rejected, cancelled)
- Complaint statuses (open, acknowledged, investigating, resolved, closed)
- Dashboard COLORS (chart colors)

## Database Changes

### 1. Extend existing settings table
- Add columns: `category` (VARCHAR), `data_type` (VARCHAR - 'array', 'string', 'number', 'boolean'), `is_active` (BOOLEAN), `validation_rules` (JSONB)
- Create unique index on (setting_key, category)

### 2. Create settings_audit_log table
```sql
CREATE TABLE settings_audit_log (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  impact_analysis TEXT,
  reason TEXT
);
```

### 3. Seed initial settings
- Insert all current hardcoded values as settings with appropriate categories

## Backend Implementation

### 1. Extend settings.controller.js
- Add `getSettingsByCategory(category)` - fetch all settings for a category
- Add `createSetting(setting)` - create new setting (owner/manager only)
- Add `deleteSetting(key)` - delete setting (owner/manager only)
- Add `validateSettingChange(key, newValue)` - validate change and perform impact analysis
- Add `getAuditLog(key)` - fetch audit history for a setting
- Add role-based access control middleware (owner/manager only for writes)

### 2. Add validation utilities
- `validateArraySetting(value)` - ensure valid JSON array
- `validateDateString(value)` - ensure valid date format
- `validateNoBackdatedAttendance(date)` - prevent backdated attendance entries
- `analyzeImpact(key, oldValue, newValue)` - check which records would be affected

### 3. Update attendance.controller.js
- Add backdated attendance validation in `managerPunchForEmployee` and `adjustAttendance`
- Validate timestamp is not before a configurable cutoff (e.g., 30 days ago, or allow admin override with reason)

### 4. Create settings.service.js
- Central service for settings management
- Caching layer for frequently accessed settings
- Impact analysis logic for each setting type

## Frontend Implementation

### 1. Update admin/Settings.jsx
- Add tabbed interface: Office Location, Employee Permissions, System Values, Audit Log
- System Values tab:
  - Group settings by category (Departments, Employment Types, Leave Types, etc.)
  - Each category: list current values with edit/delete buttons
  - Add new value form with validation
  - Show impact warning before saving
- Audit Log tab:
  - Table showing all changes with who, when, old value, new value, reason
  - Filter by setting key, category, date range

### 2. Create settings context (contexts/SettingsContext.jsx)
- Provide settings to entire app
- Fetch settings on app init
- Cache settings to avoid repeated API calls
- Refresh settings when changed

### 3. Update all components with hardcoded values
Replace hardcoded arrays with settings from context:
- JobPostingManagement.jsx: use DEPARTMENTS, EMPLOYMENT_TYPES, JOB_STATUSES from settings
- leave/Request.jsx: use LEAVE_TYPES from settings
- leave/Approvals.jsx: use LEAVE_KINDS, APPROVED_STATUSES from settings
- leave/Statutory.jsx: use STATUTORY_TYPES from settings
- onboarding/index.jsx: use ONBOARDING_STEPS from settings
- employee/Punch.jsx: use PUNCH_ACTIONS from settings
- admin/Dashboard.jsx: use COLORS from settings
- complaints/index.jsx: use COMPLAINT_STATUSES from settings

### 4. Add validation UI
- Show error messages for invalid data entry
- Show warnings for backdated attendance attempts
- Require reason for impactful changes
- Show impact summary before confirming changes

## Implementation Order

1. Database schema changes and seed data
2. Backend controller extensions and validation
3. Settings context creation
4. Update admin Settings page with new tabs
5. Update components one category at a time (starting with DEPARTMENTS)
6. Add attendance validation
7. Add audit log viewing
8. Testing and validation

## Validation Rules

**General:**
- No empty values in required arrays
- No duplicate values in arrays
- String values must not contain special characters that could break UI
- Numeric values must be within reasonable ranges

**Attendance:**
- Cannot log attendance before employee hire date
- Cannot log attendance before configurable cutoff (default: 30 days ago)
- Manager can override with reason and approval
- Override logged in audit trail

**Impact Analysis:**
- When changing a department name: warn about employees with that department
- When changing employment type: warn about employees with that type
- When deleting a value: warn about records using that value
- When changing leave type: warn about leave requests with that type
