# UBUNTU HRMS - Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UBUNTU HRMS Frontend                     │
│                   (React.js + Vite)                         │
└─────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────────┤
         │                                                     │
    ┌────▼────────────┐                     ┌────────────────┐
    │  Browser/Users  │                     │  Backend API   │
    │  (HTTP Client)  │◄────────────────────►│  (Node.js/    │
    │                 │                     │   Express)    │
    └────────────────┘                     └────────────────┘
         │                                      │
         │                                      └─ MongoDB
         │
         ├─ Light/Dark Theme (localStorage)
         ├─ Auth Token (localStorage)
         └─ User Preferences (localStorage)
```

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Admin    │ Manager  │ Employee │ Shared   │   Auth   │  │
│  │ Portal   │ Portal   │ Portal   │ Pages    │   Page   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
┌─────────────────────────────────────────────────────────────┐
│                   Component Layer                           │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Header   │ Sidebar  │ Card     │ Button   │  Table   │  │
│  │ Modal    │ Input    │ Theme    │ Protected│  Layout  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │AuthContext│ThemeCtx │API       │ Protected│ App      │  │
│  │           │          │Services  │ Routes   │ Router   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (API)                         │
│  Axios HTTP Client → Backend REST API                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── ThemeProvider
│   └── AuthProvider
│       └── Router
│           ├── Login (public)
│           ├── Unauthorized (public)
│           │
│           ├── ProtectedRoute (admin)
│           │   ├── AdminDashboard
│           │   ├── AdminEmployees
│           │   ├── AdminAttendance
│           │   ├── AdminLeaves
│           │   ├── AdminPayroll
│           │   │
│           │   └── DashboardLayout
│           │       ├── Header
│           │       │   ├── ThemeToggle
│           │       │   └── UserMenu
│           │       │
│           │       └── Sidebar
│           │           └── NavLinks
│           │
│           ├── ProtectedRoute (manager)
│           │   ├── ManagerDashboard
│           │   ├── ManagerAttendance
│           │   ├── ManagerLeaves
│           │   ├── ManagerPayroll
│           │   │
│           │   └── DashboardLayout (same)
│           │
│           └── ProtectedRoute (employee)
│               ├── EmployeeDashboard
│               ├── EmployeeAttendance
│               ├── EmployeeLeaves
│               │
│               └── DashboardLayout (same)
```

## Data Flow Architecture

### Authentication Flow
```
Login Page
    │
    ├─ User enters credentials
    │
    ├─ AuthContext.login()
    │
    ├─ API POST /api/auth/login
    │
    ├─ Receive JWT token
    │
    ├─ Store in localStorage
    │
    ├─ Decode token for user info
    │
    ├─ Set Axios default header (x-auth-token)
    │
    ├─ Redirect based on role
    │   ├─ admin → /admin/dashboard
    │   ├─ manager → /manager/dashboard
    │   └─ employee → /employee/dashboard
    │
    └─ Page loads with authenticated context
```

### API Request Flow
```
Component
    │
    ├─ Calls API service function
    │   Example: employeeAPI.getAll()
    │
    ├─ Axios includes x-auth-token header
    │
    ├─ Backend validates token
    │
    ├─ API processes request
    │
    ├─ Response returned
    │
    ├─ Component updates state
    │
    └─ UI re-renders with data
```

### Theme Update Flow
```
User clicks theme toggle
    │
    ├─ ThemeContext.toggleTheme()
    │
    ├─ Update theme state
    │
    ├─ Save to localStorage
    │
    ├─ Update document.documentElement class
    │
    ├─ CSS variables activate
    │
    └─ Entire UI updates (smooth transition)
```

## File Organization Pattern

### Page Component Pattern
```
pages/
└── feature/
    ├── Feature.jsx          (Component)
    └── Feature.css          (Styles)
    
Feature.jsx structure:
├── useState (component state)
├── useAuth (from context)
├── useEffect (data fetching)
├── Event handlers
├── Render JSX
└── Return DashboardLayout wrapper
```

### Component Pattern
```
components/
└── common/
    ├── Component.jsx        (Component)
    └── Component.css        (Styles)
    
Component.jsx structure:
├── Props definition
├── Internal state (if needed)
├── Event handlers
├── Render JSX
└── CSS class binding
```

### Context Pattern
```
contexts/
├── Context.jsx
│   ├── createContext()
│   ├── Provider component
│   ├── Custom hook (useContext)
│   └── Provider wrapper
```

## State Management Architecture

### Global State (Context API)
```
AuthContext
├── user (object)
├── token (string)
├── loading (boolean)
├── login (function)
├── logout (function)
└── register (function)

ThemeContext
├── theme (string: 'light' | 'dark')
└── toggleTheme (function)
```

### Local State (useState)
```
Page Components
├── Component data (useState)
├── Form data (useState)
├── Loading states (useState)
├── Modal visibility (useState)
└── Filter/search (useState)
```

### Derived State
```
No Redux needed
┌─────────────────────────────────────┐
│ AuthContext + localStorage          │
│ Provides complete auth state        │
│ across all components               │
└─────────────────────────────────────┘
```

## Routing Architecture

### Route Structure
```
/                           → Redirect to /login
/login                      → Public login page
/unauthorized               → Access denied page

/admin/*                    → Admin portal
  /admin/dashboard          → Overview & stats
  /admin/employees          → CRUD operations
  /admin/attendance         → Records & adjustment
  /admin/leaves             → Approval workflow
  /admin/payroll            → Calculation & disbursement
  /admin/kpis               → Performance tracking
  /admin/contracts          → Contract management
  /admin/reports            → Analytics
  /admin/settings           → Configuration

/manager/*                  → Manager portal
  /manager/dashboard        → Team overview
  /manager/team             → Team members
  /manager/attendance       → Team attendance
  /manager/leaves           → Leave approvals
  /manager/payroll          → Payroll view
  /manager/kpis             → Team KPIs
  /manager/reports          → Team reports

/employee/*                 → Employee portal
  /employee/dashboard       → Personal overview
  /employee/attendance      → My attendance
  /employee/punch           → Quick punch
  /employee/leaves          → My leaves
  /employee/contracts       → My contracts
  /employee/profile         → My profile
```

## API Integration Architecture

### API Service Structure
```
services/api.js
├── axios instance (baseURL, headers)
├── employeeAPI (CRUD)
├── attendanceAPI (records, punch)
├── payrollAPI (calculate, disburse)
├── kpiAPI (tracking)
├── leaveAPI (requests, approvals)
└── contractAPI (management)

Each API object contains:
├── getAll/getById
├── create/update/delete
└── Custom operations
```

### Header Management
```
Request Headers:
├── x-auth-token: JWT token from localStorage
├── Content-Type: application/json
├── Accept: application/json
└── CORS: handled by backend

Response Handling:
├── Success (200-299)
│   └── Parse data, update state
│
├── Error (4xx-5xx)
│   ├── Show toast notification
│   ├── Log error
│   └── Trigger UI update
│
└── Loading state
    └── Show spinner/skeleton
```

## CSS Architecture

### CSS Variable System
```
:root (Light theme)
├── --color-primary: #3b82f6
├── --color-bg-light: #ffffff
├── --color-text-light: #1f2937
└── ... (20+ variables)

.dark-theme (Dark mode)
├── --color-primary: #3b82f6
├── --color-bg-dark: #0f172a
├── --color-text-dark: #f1f5f9
└── ... (20+ variables)

Usage:
background-color: var(--color-bg-light);
color: var(--color-text-light);

.dark-theme .element {
  background-color: var(--color-bg-dark);
  color: var(--color-text-dark);
}
```

### Responsive Design Breakpoints
```
Mobile:   < 480px    (phones)
Tablet:   480-768px  (tablets)
Desktop:  > 768px    (desktops)

Media Query Pattern:
@media (max-width: 768px) {
  /* Tablet & mobile styles */
}

@media (max-width: 480px) {
  /* Mobile-specific styles */
}
```

## Performance Architecture

### Code Splitting Ready
```
Vite automatically splits:
├── main.js (App.jsx, routing)
├── vendor.js (React, libraries)
├── pages/*.js (lazy loaded)
└── components/*.js (bundled efficiently)
```

### Lazy Loading Ready
```
components/
└── Heavy components with:
    ├── React.lazy() wrapper
    ├── Suspense boundary
    └── Loading fallback
```

### Caching Strategy
```
Browser Cache:
├── Static assets (forever)
├── JavaScript (with hash)
└── CSS (with hash)

Application Cache:
├── localStorage (auth token)
├── localStorage (theme preference)
└── Axios cache (optional)
```

## Security Architecture

### Authentication Flow
```
Login
  ├─ Send credentials
  ├─ Receive JWT token
  ├─ Store in localStorage
  ├─ Add to request headers
  └─ Backend validates

Protected Routes
  ├─ Check token exists
  ├─ Check role matches
  ├─ Allow access or redirect
  └─ Prevent unauthorized access
```

### CORS Setup
```
Backend Configuration:
├── Allow origin: frontend URL
├── Allow credentials
├── Allow headers: x-auth-token
└── Allow methods: GET, POST, PUT, DELETE
```

## Development Workflow

### File Editing
```
Edit .jsx or .css
    │
    ├─ Vite detects change
    │
    ├─ HMR updates module
    │
    ├─ Browser refreshes instantly
    │
    └─ State preserved (if possible)
```

### Debugging
```
Browser DevTools
├─ React DevTools extension
│   └── Component tree, props, state
│
├─ Network tab
│   └── API requests, responses
│
├─ Console
│   └── Errors, warnings, logs
│
└─ Application
    └── localStorage, cookies
```

## Build & Deployment Architecture

### Development Build
```
pnpm dev
    │
    ├─ Vite starts dev server
    ├─ Hot Module Replacement enabled
    ├─ Source maps for debugging
    ├─ No minification
    └─ Instant reload on changes
```

### Production Build
```
pnpm build
    │
    ├─ Vite bundles everything
    ├─ Code minification
    ├─ Tree shaking
    ├─ Lazy loading chunks
    ├─ Asset optimization
    ├─ Output: dist/ folder
    └─ Ready for deployment
```

### Deployment Target
```
dist/
├─ index.html          (entry point)
├─ assets/
│  ├─ main.[hash].js   (minified)
│  ├─ [name].[hash].js (chunks)
│  └─ style.[hash].css (minified)
└─ Can deploy to any static host
```

---

## Architecture Summary

✓ **Layered architecture** - Clear separation of concerns
✓ **Context-based state** - No Redux needed
✓ **Component-driven** - Reusable, composable
✓ **API-integrated** - Axios with automatic headers
✓ **Theme system** - CSS variables for easy customization
✓ **Responsive design** - Mobile-first approach
✓ **Security-focused** - JWT, protected routes, role-based access
✓ **Performance-optimized** - Vite, code splitting ready
✓ **Developer-friendly** - HMR, clear file organization

This architecture scales from prototype to production!
