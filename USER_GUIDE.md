# Ubuntu HRMS - Complete User Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Admin Dashboard](#admin-dashboard)
4. [User Management](#user-management)
5. [Employee Management](#employee-management)
6. [Recruitment Workflow](#recruitment-workflow)
7. [Onboarding Workflow](#onboarding-workflow)
8. [Attendance Management](#attendance-management)
9. [Leave Management](#leave-management)
10. [KPI Assessment](#kpi-assessment)
11. [Payroll Management](#payroll-management)
12. [Contract Management](#contract-management)
13. [Complaints Management](#complaints-management)
14. [Assets Management](#assets-management)
15. [Daily Labour Management](#daily-labour-management)
16. [Contractor Management](#contractor-management)
17. [Report Generation](#report-generation)
18. [Settings](#settings)

---

## System Overview

Ubuntu HRMS is a comprehensive Human Resource Management System designed to streamline HR operations from recruitment to payroll. The system is built with a React frontend and Node.js/PostgreSQL backend, providing role-based access control for different user types.

### User Roles
- **Admin**: Full system access, can manage all aspects of the system
- **Manager**: Can manage team members, approve requests, view reports
- **Supervisor**: Can manage specific departments, approve team requests
- **Employee**: Can view personal information, submit requests, manage attendance

### Key Features
- End-to-end recruitment and onboarding
- Attendance tracking with geolocation
- Performance management with KPIs
- Payroll processing with M-Pesa integration
- Leave management with automated approvals
- Asset management
- Complaint handling
- Contractor lifecycle management

---

## Getting Started

### Login Credentials
After database seeding, use these credentials to access the system:

**Admin Accounts:**
- Username: `admin1` | Password: `Admin@123`
- Username: `admin2` | Password: `Admin@123`

**Other Users:**
- Username: `jessica.anderson` | Password: `Password@123`
- (Format: firstname.lastname | Password: `Password@123`)

### First Login
1. Navigate to the application URL
2. Enter your username and password
3. Click "Login"
4. You will be redirected to your dashboard based on your role

---

## Admin Dashboard

### Overview
The Admin Dashboard provides a high-level view of the entire organization's HR status at a glance.

### Components

#### Stat Cards
- **Total Employees**: Displays the current number of active employees
  - Click to view all employees
  - Color-coded based on employee count

- **Present Today**: Shows employees who have clocked in today
  - Real-time attendance data
  - Click to view today's attendance details

- **Pending Payroll**: Number of draft payslips awaiting approval
  - Click to navigate to payroll management
  - Alerts you to pending payroll actions

- **Average KPI**: Organization-wide performance score
  - Calculated from all evaluated KPIs
  - Click to view KPI management page

- **Pending Leaves**: Number of leave requests awaiting approval
  - Click to navigate to leave management
  - Helps prioritize approval tasks

- **Open Complaints**: Number of unresolved complaints
  - Click to view complaints page
  - Alerts you to issues needing attention

#### Charts
- **Employee Distribution by Role**: Pie chart showing employee breakdown by role
  - Visual representation of workforce composition
  - Helps in resource planning

- **Payroll Trends**: Line chart showing payroll over time
  - Monthly payroll expenditure
  - Helps in budget tracking

#### Recent Activity
- Timeline of recent system activities
- Shows latest hires, approvals, and important events
- Quick access to recent actions

---

## User Management

### Overview
Manage system user accounts and permissions.

### Components

#### User Table
- **Username**: Clickable link to view user details
- **Email**: User's email address
- **Role**: User's system role (Admin, Manager, Supervisor, Employee)
  - Click to filter by role
- **Status**: User account status (Active, Pending, Inactive)
  - Click to filter by status
- **Actions**:
  - **View**: Opens user profile details
  - **Edit**: Modify user information
  - **Reset Password**: Send password reset link
  - **Approve**: Activate pending user accounts
  - **Delete**: Remove user account

#### Add User Button
- Opens registration form to create new user accounts
- Requires username, email, and role assignment

### Workflow
1. Click "Add User" button
2. Fill in user details (username, email, role)
3. Set initial password or send reset link
4. User receives activation email (if configured)
5. User logs in and completes profile

---

## Employee Management

### Overview
Manage employee records, personal information, and employment details.

### Components

#### Employee Table
- **Name**: Clickable link to view full employee profile
  - Navigates to employee detail page
- **Department**: Employee's department assignment
- **Position**: Job title/role
- **Status**: Employment status (Active, Inactive, Terminated)
  - Click to filter by status
- **Actions**:
  - **View Details**: Complete employee profile
  - **Edit**: Update employee information
  - **Terminate**: End employment (with confirmation)
  - **Change Role**: Update system role

#### Employee Profile Page
Contains comprehensive employee information:
- **Personal Details**: Name, contact, emergency contacts
- **Employment Details**: Department, position, wage rate, employment type
- **Education History**: Academic qualifications
- **Employment History**: Previous work experience
- **Skills**: Professional skills and certifications
- **Documents**: Uploaded documents (ID, contracts, etc.)
- **Attendance History**: Attendance records
- **Leave Balances**: Current leave entitlements
- **KPI Performance**: Performance metrics
- **Payroll History**: Salary and payment records

### Workflow
1. Navigate to Employees page
2. Click "Add Employee" button
3. Fill in personal information
4. Add employment details (department, position, wage rate)
5. Upload required documents
6. Save to create employee record
7. Employee can now be assigned to projects, tracked for attendance, etc.

---

## Recruitment Workflow

### Overview
Manage job postings, applications, and hiring process from start to finish.

### Components

#### Job Posting Management
- **Job Table**:
  - **Title**: Clickable link to view job details
  - **Department**: Department hiring for the role
  - **Location**: Job location
  - **Type**: Employment type (Permanent, Contractor, Daily)
  - **Status**: Job posting status (Open, Closed, Filled)
    - Click to filter by status
  - **Actions**:
    - **View Details**: Full job description
    - **Edit**: Modify job posting
    - **Delete**: Remove job posting

- **Add Job Button**: Create new job posting
  - Title, description, requirements
  - Department, location, salary range
  - Employment type, application deadline

#### Applicant Review Dashboard
- **Application Table**:
  - **Name**: Clickable link to view applicant profile
  - **Email**: Applicant's email
  - **Phone**: Contact number
  - **Status**: Application status (Pending, Under Review, Shortlisted, Rejected, Hired)
    - Click to filter by status
  - **CV**: View/download resume
  - **Auto-Score**: AI-generated fit score
  - **Interview Score**: Manual interview evaluation
  - **Actions**:
    - **View Details**: Complete application
    - **Update Status**: Move through recruitment stages
    - **Schedule Interview**: Set up interview
    - **Send Offer**: Extend job offer
    - **Reject**: Decline application

### Recruitment Workflow

#### Step 1: Create Job Posting
1. Navigate to Recruitment → Job Posting Management
2. Click "Add Job" button
3. Fill in job details:
   - Job title and description
   - Department and location
   - Requirements and responsibilities
   - Salary range and benefits
   - Employment type
   - Application deadline
4. Set status to "Open"
5. Publish job posting

#### Step 2: Receive Applications
1. Applications appear in Applicant Review Dashboard
2. Review applicant profiles and CVs
3. Auto-score evaluates fit based on job requirements
4. Filter applications by status

#### Step 3: Screen Applications
1. Click applicant name to view full profile
2. Review qualifications, experience, skills
3. Check auto-score and manually evaluate
4. Update status to "Under Review" or "Shortlisted"

#### Step 4: Interview Process
1. For shortlisted candidates, click "Schedule Interview"
2. Set interview date and time
3. Conduct interviews
4. Record interview score (0-100)
5. Update application status

#### Step 5: Make Decision
1. After interviews, evaluate all candidates
2. Select top candidate(s)
3. Click "Send Offer" for chosen candidate
4. Set offer details (salary, start date, etc.)
5. Update status to "Hired"

#### Step 6: Onboarding
1. Hired candidates move to onboarding phase
2. System creates employee record
3. Begin onboarding workflow (see Onboarding section)

---

## Onboarding Workflow

### Overview
Guide new hires through the onboarding process with checklists and document management.

### Components

#### Onboarding Dashboard
- **Stat Cards**:
  - **Total**: All onboardings in system
    - Click to view all
  - **In Progress**: Active onboarding processes
    - Click to filter by in-progress
  - **Completed**: Finished onboarding
    - Click to view completed

- **Onboarding List**:
  - Employee name and position
  - Onboarding progress percentage
  - Current stage
  - Start date
  - Actions: View details, manage steps

#### Onboarding Steps
- **Step 1: Documentation Collection**
  - Upload ID documents
  - Tax forms
  - Bank details
  - Emergency contacts

- **Step 2: System Setup**
  - Create user account
  - Assign system role
  - Set up email
  - Configure permissions

- **Step 3: Training**
  - Department orientation
  - System training
  - Safety training
  - Role-specific training

- **Step 4: Equipment Assignment**
  - Assign workspace
  - Provide equipment (laptop, phone, etc.)
  - Asset allocation

- **Step 5: Review**
  - Manager evaluation
  - Performance expectations
  - Goals setting

### Onboarding Workflow

#### Step 1: Initiate Onboarding
1. Navigate to Onboarding page
2. Click "Initiate Onboarding"
3. Select hired candidate from recruitment
4. Set start date and position
5. Assign onboarding manager

#### Step 2: Complete Documentation
1. Employee uploads required documents
2. HR verifies documents
3. Mark documentation step complete
4. System updates progress

#### Step 3: System Configuration
1. HR creates user account
2. Assigns appropriate role and permissions
3. Employee receives login credentials
4. Employee logs in and completes profile

#### Step 4: Training Completion
1. Schedule training sessions
2. Track training attendance
3. Complete training assessments
4. Mark training step complete

#### Step 5: Equipment Assignment
1. Assign workspace and equipment
2. Asset management records allocation
3. Employee signs for equipment
4. Mark equipment step complete

#### Step 6: Final Review
1. Manager conducts review meeting
2. Discuss performance expectations
3. Set initial goals
4. Complete onboarding
5. Employee becomes fully active

---

## Attendance Management

### Overview
Track employee attendance with geolocation verification, shift management, and punch history.

### Components

#### Attendance Dashboard
- **Employee Selection**: Dropdown to select employee
  - Defaults to showing all today's attendance
  - Filter by specific employee

- **Attendance Table**:
  - **Date**: Attendance date
  - **Status**: Present, Absent, Leave
    - Click to view status details
  - **Shift**: Morning, Afternoon, Night
  - **Check In**: Time employee clocked in
  - **Check Out**: Time employee clocked out
  - **Hours**: Total hours worked
  - **Employee Name**: Clickable to view employee profile

- **Stat Cards** (for selected employee):
  - Total attendance records
  - Present days
  - Absent days
  - Average hours per day

### Attendance Workflow

#### For Employees (Self-Recording)
1. Navigate to Attendance page
2. Click "Check In" button when arriving at work
3. System verifies location (if geolocation enabled)
4. Record punch time
5. During breaks, use "Break Out" and "Break In"
6. At end of shift, click "Check Out"
7. System calculates total hours worked

#### For Admin/Managers
1. Navigate to Attendance page
2. View all today's attendance by default
3. Select specific employee to view their history
4. Review punch history for accuracy
5. Edit attendance if needed (with reason)
6. Generate attendance reports

#### Geolocation Verification
- System checks if employee is within office radius
- Configurable office location and radius in Settings
- Prevents off-site clock-in
- Exceptions can be approved by manager

#### Shift Management
- Morning: 8:00 AM - 5:00 PM
- Afternoon: 12:00 PM - 9:00 PM
- Night: 8:00 PM - 5:00 AM
- Custom shifts can be configured

---

## Leave Management

### Overview
Manage leave requests, approvals, and leave balances with automated policies.

### Components

#### Leave Dashboard
- **Stat Cards**:
  - **Total Requests**: All leave requests
    - Click to view all
  - **Pending**: Requests awaiting approval
    - Click to filter by pending
  - **Approved**: Approved leave requests
    - Click to filter by approved
  - **Rejected**: Declined requests
    - Click to filter by rejected

- **Leave Requests Table**:
  - **Employee Name**: Clickable to view employee profile
  - **Type**: Leave type (Annual, Sick, Maternity, Paternity, etc.)
  - **Start Date**: Leave start date
  - **End Date**: Leave end date
  - **Days**: Number of days requested
  - **Status**: Request status
    - Click to filter by status
  - **Actions**:
    - **Approve**: Approve leave request
    - **Reject**: Decline request with reason
    - **View Details**: Full request details

- **Leave Balances**:
  - Shows each employee's leave balance
  - Annual leave remaining
  - Sick leave remaining
  - Maternity/Paternity leave
  - Carried forward from previous year

#### Leave Types and Policies
- **Annual Leave**: 30 days per year, requires manager approval
- **Sick Leave**: 14 days, auto-approved for first 7 days
- **Maternity Leave**: 90 days, requires documentation
- **Paternity Leave**: 14 days, requires documentation
- **Compassionate Leave**: 10 days for family emergencies
- **Unpaid Leave**: Up to 30 days, requires approval
- **Off-Day**: Single day, auto-approved

### Leave Workflow

#### For Employees
1. Navigate to Leave page
2. Click "Request Leave" button
3. Select leave type
4. Choose start and end dates
5. Provide reason for leave
6. Upload documentation if required (maternity, paternity)
7. Submit request
8. Track status in dashboard

#### For Managers/Supervisors
1. Navigate to Leave page
2. View pending requests
3. Click on request to view details
4. Check department conflicts (system shows overlapping requests)
5. Review leave balance
6. Click "Approve" or "Reject"
7. If rejecting, provide reason
8. System updates leave balance automatically

#### Automated Features
- **Department Conflict Detection**: Warns if too many team members on leave
- **Balance Checking**: Prevents requests exceeding available balance
- **Documentation Requirements**: Enforces document upload for certain leave types
- **Carry Forward**: Automatically carries forward unused annual leave (up to 5 days)
- **Payroll Integration**: Adjusts payroll for unpaid leave

---

## KPI Assessment

### Overview
Define, assign, track, and evaluate Key Performance Indicators for employees.

### Components

#### KPI Definitions
- **KPI List**:
  - **Title**: KPI name (clickable to view details)
  - **Description**: What the KPI measures
  - **Max Score**: Maximum achievable score
  - **Status**: Active/Inactive
  - **Actions**: Edit, Delete, Deactivate

- **Add KPI Definition**:
  - Title and description
  - Measurement method
  - Max score (typically 100)
  - Evaluation frequency

#### Employee KPIs
- **KPI Assignment Table**:
  - **Employee Name**: Clickable to view employee profile
  - **KPI Title**: Which KPI is being measured
  - **Period**: Evaluation period (Q1, Q2, Q3, Q4)
  - **Target Value**: Goal to achieve
  - **Achieved Value**: Actual performance
  - **Final Score**: Calculated score (0-100)
  - **Status**: Pending, Evaluated, Completed
    - Click to filter by status
  - **Actions**:
    - **View Details**: Full KPI information
    - **Evaluate**: Score the KPI
    - **Edit**: Modify targets or scores

- **Assign KPI**:
  - Select employee
  - Choose KPI definition
  - Set period and target value
  - Assign evaluator

- **Bulk Assign KPI**:
  - Select multiple employees
  - Choose KPI definition
  - Set period and target value
  - Assign to all selected employees at once

### KPI Workflow

#### Step 1: Define KPIs
1. Navigate to KPI Management page
2. Click "Add KPI Definition"
3. Define KPI title (e.g., "Sales Target", "Customer Satisfaction")
4. Write description of what it measures
5. Set max score (typically 100)
6. Save definition

#### Step 2: Assign KPIs to Employees
1. Click "Assign KPI" button
2. Select employee from dropdown
3. Choose KPI definition
4. Set evaluation period (Q1 2024, etc.)
5. Set target value (goal)
6. Assign evaluator (who will score it)
7. Save assignment

**For Bulk Assignment:**
1. Click "Bulk Assign" button
2. Check boxes next to multiple employees
3. Choose KPI definition
4. Set period and target value
5. Click "Assign to X Employees"

#### Step 3: Track Progress
1. Employees work toward targets
2. Periodic check-ins can be recorded
3. Achieved values updated as progress is made
4. Status changes from "Pending" to "In Progress"

#### Step 4: Evaluate KPIs
1. At period end, evaluator reviews performance
2. Click "Evaluate" on KPI assignment
3. Enter achieved value (actual performance)
4. System calculates final score based on formula
5. Add comments/notes
6. Submit evaluation
7. Status changes to "Evaluated" or "Completed"

#### Step 5: Bonus Calculation
1. High KPI scores may trigger bonuses
2. Pending bonuses created automatically
3. Bonuses processed through payroll
4. Employees notified of bonus payments

#### Step 6: Reporting
1. Generate KPI performance reports
2. Compare employees within department
3. Track improvement over time
4. Identify training needs based on scores

---

## Payroll Management

### Overview
Process payroll, generate payslips, approve payments, and disburse via M-Pesa.

### Components

#### Payroll Dashboard
- **Stat Cards**:
  - **Total Payslips**: All payslips in system
  - **Draft**: Unapproved payslips awaiting review
    - Click to view drafts
  - **Approved**: Ready for payment
    - Click to view approved
  - **Paid**: Successfully disbursed
    - Click to view payment history

- **Payslip Table**:
  - **Employee Name**: Clickable to view employee profile
  - **Period**: Pay period (YYYY-MM)
  - **Gross Pay**: Total earnings before deductions
  - **Net Pay**: Take-home pay after deductions
  - **Status**: Draft, Approved, Processing, Paid, Failed
    - Click to filter by status
  - **Actions**:
    - **View Details**: Full payslip breakdown
    - **Edit**: Modify payslip (draft only)
    - **Approve**: Approve for payment
    - **Disburse**: Initiate M-Pesa payment

- **Batch Generate**:
  - Generate draft payslips for all monthly employees
  - Automatically calculates based on attendance, wage rates
  - Creates in bulk for selected period

#### Payslip Details
- **Earnings**:
  - Base salary
  - Overtime pay
  - KPI bonuses
  - Other allowances

- **Deductions**:
  - Tax (PAYE)
  - NSSF contributions
  - NHIF contributions
  - Pension contributions
  - Other deductions

- **Payment Method**:
  - M-Pesa (mobile money)
  - Bank transfer
  - Cash

### Payroll Workflow

#### Step 1: Configure Pay Rates
1. Navigate to Employee profile
2. Set base wage rate
3. Set overtime rate (per hour)
4. Choose payment method (M-Pesa/Bank)
5. Add bank details if applicable

#### Step 2: Track Attendance
1. Employees clock in/out daily
2. System calculates hours worked
3. Overtime tracked automatically
4. Attendance data feeds into payroll

#### Step 3: Generate Draft Payslips
**Individual Generation:**
1. Navigate to Payroll page
2. Click "Add Payslip"
3. Select employee
4. Choose pay period
5. System auto-calculates based on:
   - Base salary (monthly wage rate)
   - Overtime (hours × overtime rate)
   - KPI bonuses (from performance)
6. Review and adjust if needed
7. Save as draft

**Batch Generation:**
1. Click "Batch Generate" button
2. Confirm period
3. System generates for all monthly employees
4. Skips daily labourers (handled separately)
5. All created as drafts

#### Step 4: Review Drafts
1. Navigate to Payroll page
2. Filter by "Draft" status
3. Click "View Details" on each payslip
4. Review calculations:
   - Gross pay = Base + Overtime + Bonuses
   - Deductions = Tax + NSSF + NHIF + Other
   - Net pay = Gross - Deductions
5. Edit if corrections needed
6. Save changes

#### Step 5: Approve Payslips
1. After review, click "Approve" button
2. Status changes to "Approved"
3. Payslips ready for disbursement
4. Can be approved individually or in batch

#### Step 6: Disburse Payments
**M-Pesa Disbursement:**
1. Navigate to Payroll Disbursement page
2. Select approved payslips
3. Click "Disburse via M-Pesa"
4. System initiates M-Pesa transactions
5. Status updates to "Processing"
6. Successful payments: "Paid"
7. Failed payments: "Failed" (with error message)
8. Retry failed payments

**Bank Transfer:**
1. Generate payment file
2. Upload to banking system
3. Mark as paid in system

#### Step 7: Generate Payslips
1. Employees can view their payslips
2. Download PDF version
3. Email payslips to employees
4. Archive for record-keeping

---

## Contract Management

### Overview
Manage employee contracts, track contract expiry, and handle renewals.

### Components

#### Contract Dashboard
- **Stat Cards**:
  - **Total Contracts**: All contracts in system
  - **Active**: Currently active contracts
  - **Expiring Soon**: Contracts expiring in 30 days
  - **Expired**: Contracts that have ended

- **Contract Table**:
  - **Employee Name**: Clickable to view employee profile
  - **Contract Title**: Contract type/name
  - **Start Date**: Contract start
  - **End Date**: Contract expiry
  - **Status**: Active, Expiring, Expired
    - Click to filter by status
  - **Actions**:
    - **View**: Full contract details
    - **Edit**: Modify contract terms
    - **Renew**: Extend contract
    - **Terminate**: End contract early

#### Contract Analytics
- **Status Distribution**: Chart showing contract statuses
- **Top Departments**: Departments with most contracts
- **Expiry Timeline**: Visual timeline of contract expirations

### Contract Workflow

#### Step 1: Create Contract
1. Navigate to Contracts page
2. Click "Add Contract"
3. Select employee
4. Enter contract details:
   - Contract title
   - Contract type (Permanent, Fixed-term)
   - Start date
   - End date (if fixed-term)
   - Terms and conditions
5. Upload signed contract document
6. Save contract

#### Step 2: Track Expiry
1. System monitors contract end dates
2. 30-day warning for expiring contracts
3. Notifications sent to HR and manager
4. Expiring Soon stat card alerts

#### Step 3: Renew Contract
1. Click "Renew" on expiring contract
2. Set new end date
3. Update terms if needed
4. Upload renewed contract document
5. Save renewal
6. System updates status to Active

#### Step 4: Terminate Contract
1. Click "Terminate" on contract
2. Provide termination reason
3. Set termination date
4. Calculate final pay
5. Handle exit process
6. Archive contract

---

## Complaints Management

### Overview
Handle employee and guest complaints with resolution tracking and root cause analysis.

### Components

#### Complaints Dashboard
- **Stat Cards**:
  - **Total**: All complaints
    - Click to view all
  - **Open**: Unresolved complaints
    - Click to filter by open
  - **In Progress**: Being investigated
    - Click to filter by in progress
  - **Resolved**: Completed resolutions
    - Click to filter by resolved

- **Complaints Table**:
  - **Type**: Guest or Employee complaint
  - **Category**: Complaint category
  - **Description**: Issue description
  - **Urgency**: Low, Medium, High
  - **Status**: Open, Acknowledged, Investigating, Resolved, Closed
    - Click to filter by status
  - **Submitted By**: Who submitted
  - **Date**: Submission date
  - **Actions**:
    - **Acknowledge**: Mark as received
    - **Investigate**: Start investigation
    - **Resolve**: Submit resolution
    - **Close**: Finalize resolved complaint

- **Resolve Modal**:
  - **Resolution**: How the issue was resolved
  - **Root Cause**: What caused the issue
  - **Prevention Notes**: How to prevent recurrence
  - Submit resolution with details

### Complaints Workflow

#### Step 1: Submit Complaint
1. Navigate to Complaints page
2. Click "Submit Complaint"
3. Select type (Guest/Employee)
4. Choose category
5. Provide description
6. Set urgency level
7. If guest, enter guest name and room
8. If employee, auto-populated
9. Submit complaint

#### Step 2: Acknowledge
1. New complaints appear as "Open"
2. Manager clicks "Acknowledge"
3. Status changes to "Acknowledged"
4. Submitter receives notification

#### Step 3: Investigate
1. Click "Investigate" button
2. Status changes to "Investigating"
3. Gather information
4. Interview involved parties
5. Document findings

#### Step 4: Resolve
1. Click "Resolve" button
2. Resolution modal opens
3. Fill in:
   - Resolution: How was it fixed?
   - Root Cause: Why did it happen?
   - Prevention: How to prevent recurrence?
4. Submit resolution
5. Status changes to "Resolved"

#### Step 5: Close
1. After resolution, click "Close"
2. Status changes to "Closed"
3. Complaint archived
4. Data used for trend analysis

---

## Assets Management

### Overview
Track company assets, assignments, and returns.

### Components

#### Assets Dashboard
- **Stat Cards**:
  - **Total**: All assets
    - Click to view all
  - **Assigned**: Currently assigned to employees
    - Click to view assigned
  - **Available**: Available for assignment
    - Click to view available

- **Assets List**:
  - **Name**: Asset name and type
  - **Serial Number**: Unique identifier
  - **Condition**: New, Good, Fair, Poor
    - Click to filter by condition
  - **Status**: Available, Assigned
    - Click to filter by status
  - **Assigned To**: Employee holding asset (if assigned)
    - Click to view employee profile
  - **Actions**:
    - **Assign**: Assign to employee
    - **Return**: Return from employee

- **Add Asset Form**:
  - Asset name
  - Type (Equipment, Furniture, Electronics, Vehicle, Tool, Other)
  - Serial number
  - Condition (New, Good, Fair, Poor)

### Assets Workflow

#### Step 1: Register Asset
1. Navigate to Assets page
2. Click "Add Asset"
3. Fill in asset details:
   - Name and type
   - Serial number
   - Condition
4. Save asset
5. Asset appears in available list

#### Step 2: Assign Asset
1. Click "Assign" on available asset
2. Select employee from dropdown
3. Confirm assignment
4. Status changes to "Assigned"
5. Employee receives notification

#### Step 3: Track Assignment
1. View all assigned assets
2. See who has each asset
4. Monitor condition over time

#### Step 4: Return Asset
1. Click "Return" on assigned asset
2. Confirm return
3. Check condition
4. Update if damaged
5. Status changes to "Available"
6. Ready for reassignment

---

## Daily Labour Management

### Overview
Manage daily wage workers, track their attendance, calculate wages, and convert to permanent employees.

### Components

#### Daily Labour Dashboard
- **Tabs**:
  - **Labourers**: Manage daily workers
  - **Attendance**: Track daily attendance
  - **Wages**: Calculate and view wages

- **Labourers Tab**:
  - **Labourer List**:
    - Name and contact
    - ID number
    - Daily rate
    - Skills
    - Status (Active, Inactive)
    - Actions:
      - **Register**: Add new daily worker
      - **Convert**: Convert to permanent employee
      - **Remove**: Deactivate worker

- **Attendance Tab**:
  - Date selection
  - Present/Absent marking
  - Hours worked
  - Auto-calculate wages

- **Wages Tab**:
  - Wage summary by worker
  - Total days worked
  - Total wage earned
  - Pay period summary

### Daily Labour Workflow

#### Step 1: Register Labourer
1. Navigate to Daily Labour page
2. Click "Register Labourer"
3. Fill in details:
   - Name
   - Phone number
   - ID number
   - Daily wage rate
   - Skills
   - Department
4. Save labourer

#### Step 2: Track Attendance
1. Switch to Attendance tab
2. Select date
3. Mark present/absent for each labourer
4. Enter hours worked
5. System auto-calculates daily wage
6. Save attendance

#### Step 3: Calculate Wages
1. Switch to Wages tab
2. Select pay period
3. View wage summary:
   - Each labourer's total days
   - Total wage earned
   - Grand total for period
4. Export wage report
5. Process payments

#### Step 4: Convert to Employee
1. On Labourers tab, click "Convert"
2. Conversion modal opens
3. Fill in:
   - Department
   - Position
   - Monthly wage rate
4. Click "Convert"
5. Labourer becomes permanent employee
6. Employee record created
7. Can now access full HR features

---

## Contractor Management

### Overview
Manage contractor quotes, milestones, verification, and payments.

### Components

#### Contractor Dashboard
- **Tabs**:
  - **Quotes**: Review and approve contractor quotes
  - **Milestones**: Track project milestones and payments

- **Quotes Tab**:
  - **Quote List**:
    - Project title
    - Description
    - Amount
    - Timeline (days)
    - Contractor name
    - Status (Pending, Approved, Rejected)
      - Click to filter by status
    - Actions:
      - **Approve**: Accept quote
      - **Reject**: Decline with reason

- **Milestones Tab**:
  - **Milestone List**:
    - Title
    - Description
    - Budget
    - Progress percentage
    - Status (In Progress, Submitted, Verified, Paid)
      - Click to filter by status
    - Deadline
    - KPI Score (if verified)
    - Actions:
      - **Verify & Score**: Evaluate milestone completion
      - **Release Payment**: Disburse payment

- **Verify Modal**:
  - **Timeliness**: Score (0-100) with slider
  - **Budget Adherence**: Score (0-100) with slider
  - **Quality**: Score (0-100) with slider
  - **Overall Score**: Auto-calculated average
  - **Notes**: Additional comments
  - Submit verification

### Contractor Workflow

#### Step 1: Receive Quote
1. Contractor submits project quote
2. Appears in Quotes tab
3. Review project details, timeline, cost
4. Check contractor qualifications

#### Step 2: Approve Quote
1. Click "Approve" on quote
2. Status changes to "Approved"
3. Project created
4. Contractor notified

#### Step 3: Track Milestones
1. Contractor works on project
2. Submits milestones for verification
3. Appears in Milestones tab
4. Status: "Submitted"

#### Step 4: Verify Milestone
1. Click "Verify & Score"
2. Verification modal opens
3. Evaluate:
   - Timeliness (was it delivered on time?)
   - Budget Adherence (within budget?)
   - Quality (work quality?)
4. Use sliders to score each (0-100)
5. Overall score auto-calculated
6. Add notes
7. Click "Approve & Score"
8. Status changes to "Verified"

#### Step 5: Release Payment
1. After verification, click "Release Payment"
2. Payment processed
3. Status changes to "Paid"
4. Contractor receives payment
5. Next milestone can begin

#### Step 6: Project Completion
1. All milestones completed
2. Final payment released
3. Project marked complete
4. Contractor performance updated

---

## Report Generation

### Overview
Generate comprehensive reports for HR analytics, compliance, and decision-making.

### Available Reports

#### Employee Reports
- **Employee List**: All employees with details
- **Department Summary**: Employees by department
- **Turnover Report**: Hires and departures
- **Demographics**: Age, gender, nationality breakdown

#### Attendance Reports
- **Daily Attendance**: Attendance for specific date
- **Monthly Attendance**: Monthly attendance summary
- **Attendance Trends**: Patterns over time
- **Absenteeism Report**: Excessive absence tracking

#### Leave Reports
- **Leave Balance**: Current leave balances
- **Leave Usage**: Leave taken by period
- **Leave Trends**: Patterns and forecasting
- **Leave Liability**: Financial liability for unused leave

#### Payroll Reports
- **Payroll Summary**: Total payroll by period
- **Payslip Details**: Individual payslip breakdown
- **Tax Report**: PAYE deductions summary
- **Payment History**: All disbursements

#### KPI Reports
- **KPI Performance**: Employee KPI scores
- **Department Performance**: KPI by department
- **Trend Analysis**: Performance over time
- **Bonus Summary**: KPI-based bonuses

#### Recruitment Reports
- **Time to Hire**: Average hiring time
- **Source Analysis**: Where candidates come from
- **Cost per Hire**: Recruitment costs
- **Offer Acceptance Rate**

### Generating Reports

#### Step 1: Navigate to Reports
1. Go to Reports section (from sidebar)
2. Select report category
3. Choose specific report type

#### Step 2: Set Parameters
1. Select date range
2. Filter by department (if applicable)
3. Choose report format (PDF, Excel, CSV)
4. Select additional filters

#### Step 3: Generate Report
1. Click "Generate Report"
2. System processes data
3. Report preview displayed
4. Download or print

#### Step 4: Schedule Reports (Optional)
1. Set up recurring reports
2. Choose frequency (daily, weekly, monthly)
3. Set recipients
4. Reports auto-generated and emailed

---

## Settings

### Overview
Configure system settings, office location, departments, and other parameters.

### Components

#### Location Settings
- **Office Latitude**: GPS latitude
- **Office Longitude**: GPS longitude
- **Office Radius**: Allowed work area (meters)
- **Office Name**: Name of location

#### Department Settings
- **Departments List**: All departments
- **Add Department**: Create new department
- **Edit Department**: Modify department details
- **Delete Department**: Remove department

#### Employment Settings
- **Employment Types**: Permanent, Contractor, Daily
- **Leave Types**: Configurable leave types
- **Job Statuses**: Open, Closed, Filled
- **Punch Actions**: Check-in, break, check-out

#### System Settings
- **Company Name**: Organization name
- **Logo**: Upload company logo
- **Timezone**: System timezone
- **Date Format**: Date display format
- **Currency**: Default currency (KSh)

#### Audit Log
- **Settings Changes**: Track who changed what
- **Timestamp**: When changes were made
- **Impact Analysis**: Effects of changes
- **Reason**: Why change was made

### Settings Workflow

#### Step 1: Access Settings
1. Navigate to Settings page
2. Choose category (Location, Departments, etc.)

#### Step 2: Modify Settings
1. Click on setting to edit
2. Update value
3. Add reason for change (required)
4. Save changes

#### Step 3: Review Impact
1. System shows potential impact
2. Review affected users/processes
3. Confirm or cancel change

#### Step 4: Audit Trail
1. All changes logged
2. Viewable in Audit Log section
3. Can revert changes if needed

---

## Quick Reference

### Common Workflows

**Hire New Employee:**
1. Create job posting → 2. Receive applications → 3. Interview candidates → 4. Send offer → 5. Onboarding → 6. Activate employee

**Process Payroll:**
1. Configure pay rates → 2. Track attendance → 3. Generate payslips → 4. Review and approve → 5. Disburse payments → 6. Archive records

**Manage Leave:**
1. Employee requests leave → 2. Manager reviews → 3. Check conflicts → 4. Approve/reject → 5. Update balance → 6. Adjust payroll

**Evaluate Performance:**
1. Define KPIs → 2. Assign to employees → 3. Track progress → 4. Evaluate at period end → 5. Calculate bonuses → 6. Update payroll

### Keyboard Shortcuts
- **Ctrl + K**: Quick search
- **Ctrl + N**: New record (context-dependent)
- **Ctrl + S**: Save
- **Escape**: Close modal

### Support
For technical support or questions:
- Contact system administrator
- Check documentation portal
- Submit help ticket

---

## Best Practices

### For Admins
- Regularly review pending approvals
- Monitor attendance patterns
- Keep employee records up to date
- Generate monthly reports
- Review security logs

### For Managers
- Respond to requests promptly
- Conduct regular check-ins
- Monitor team KPIs
- Approve leave requests fairly
- Track team attendance

### For Employees
- Clock in/out on time
- Submit leave requests in advance
- Keep profile updated
- Track own KPI progress
- Review payslips regularly

---

## Security Notes

- Never share login credentials
- Log out when finished
- Report suspicious activity
- Keep contact information updated
- Use strong passwords

---

## Glossary

- **KPI**: Key Performance Indicator
- **M-Pesa**: Mobile money payment system
- **PAYE**: Pay As You Earn (tax)
- **NSSF**: National Social Security Fund
- **NHIF**: National Hospital Insurance Fund
- **HRMS**: Human Resource Management System

---

*This guide is comprehensive but not exhaustive. For specific questions about features not covered here, consult your system administrator or refer to the technical documentation.*
