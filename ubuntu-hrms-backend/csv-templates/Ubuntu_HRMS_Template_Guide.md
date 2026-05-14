# Ubuntu HRMS Database Template Guide

## Overview
This guide provides CSV templates based on your actual PostgreSQL database schema for the Ubuntu HRMS system.

## Database Tables & Templates

### 1. USERS Table
**Purpose**: User authentication and basic account information
**Fields**: username, email, password, role, status, must_change_password
**Sample CSV**:
```csv
username,email,password,role,status,must_change_password
john.smith,john.smith@ubuntuhrms.com,hashed_password,admin,active,false
jane.wilson,jane.wilson@ubuntuhrms.com,hashed_password,manager,active,false
```

### 2. PROFILES Table  
**Purpose**: Detailed employee information and HR data
**Fields**: userid, fullname, email, phone, employeeid, jobtitle, department, status, dateofjoining, employmenttype
**Sample CSV**:
```csv
userid,fullname,email,phone,employeeid,jobtitle,department,status,dateofjoining,employmenttype
1,John Smith,john.smith@ubuntuhrms.com,+254712345678,EMP001,Software Engineer,IT,active,2022-01-15,permanent
2,Jane Wilson,jane.wilson@ubuntuhrms.com,+254712345679,EMP002,HR Manager,HR,active,2022-06-10,permanent
```

### 3. LEAVE_REQUESTS Table
**Purpose**: Employee leave request management
**Fields**: employee_id, type, start_date, end_date, reason, status, approver_id, days_charged
**Sample CSV**:
```csv
employee_id,type,start_date,end_date,reason,status,approver_id,days_charged
1,annual,2025-05-15,2025-05-17,Personal vacation,Approved,2,3
2,sick,2025-05-20,2025-05-21,Medical checkup,Approved,1,2
```

### 4. LEAVE_BALANCES Table
**Purpose**: Track employee leave balances by year
**Fields**: employee_id, year, annual, sick, maternity_paternity, carried_forward_annual, annual_lapsed
**Sample CSV**:
```csv
employee_id,year,annual,sick,maternity_paternity,carried_forward_annual,annual_lapsed
1,2025,30,15,30,5,0
2,2025,30,15,30,2,0
```

### 5. PAYSLIPS Table
**Purpose**: Payroll and salary management
**Fields**: employee_id, period, gross_pay, overtime_pay, kpi_bonus, deductions, net_pay, status, payment_method
**Sample CSV**:
```csv
employee_id,period,gross_pay,overtime_pay,kpi_bonus,deductions,net_pay,status,payment_method
1,2025-05,120000,5000,10000,24000,111000,Processed,MPESA
2,2025-05,150000,0,15000,30000,135000,Processed,Bank Transfer
```

### 6. PROJECTS Table
**Purpose**: Company project tracking
**Fields**: name, contractor_id, status, due_date
**Sample CSV**:
```csv
name,contractor_id,status,due_date
Main Building Construction,9,completed,2023-12-15
West Wing Extension,9,completed,2024-08-30
New Office Project,9,active,2025-06-30
```

### 7. PROJECT_ASSIGNMENTS Table
**Purpose**: Employee project assignments
**Fields**: employee_id, project_name, start_date, end_date
**Sample CSV**:
```csv
employee_id,project_name,start_date,end_date
1,Main Building Construction,2023-06-01,2023-12-15
2,West Wing Extension,2024-01-15,2024-08-30
```

## Import Instructions

### Order of Import
1. USERS (no dependencies)
2. PROFILES (depends on USERS)
3. LEAVE_BALANCES (depends on USERS)
4. PROJECTS (no dependencies)
5. PROJECT_ASSIGNMENTS (depends on USERS and PROJECTS)
6. LEAVE_REQUESTS (depends on USERS)
7. PAYSLIPS (depends on USERS)

### Data Requirements
- **Foreign Keys**: Ensure all referenced IDs exist
- **Dates**: Use YYYY-MM-DD format
- **Booleans**: Use true/false values
- **Numbers**: No text in numeric fields
- **Passwords**: Should be hashed before import

### Special Fields
- **JSON fields**: Can be left empty or contain valid JSON
- **Array fields**: Use PostgreSQL array format
- **Timestamps**: Use ISO format for datetime fields

## Usage
1. Create CSV files using the sample formats above
2. Fill with your actual data
3. Use the import_script.js to populate your database
4. Follow the import order to maintain relationships

## Database Connection
Your database is hosted at: `postgresql://josiah:***@dpg-d7nmg0r7uimc73bf5q90-a.ohio-postgres.render.com/ubuntu_hrms_db`

All templates are based on your actual database schema analysis.
