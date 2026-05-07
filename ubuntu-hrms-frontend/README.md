# UBUNTU HRMS - Human Resource Management System

A modern, role-based HRMS application built with React.js, featuring separate portals for Admin, Manager, and Employee users.

## Features

### Core Features
- **Role-Based Access Control**: Separate dashboards for Admin, Manager, and Employee
- **Light & Dark Theme**: Persistent theme preference with localStorage
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Modern UI**: Built with React Icons and custom CSS styling
- **Authentication**: JWT-based authentication with x-auth-token header

### Role-Specific Features

#### Admin Portal
- Full system access
- Employee management (add, edit, delete)
- Attendance tracking and adjustment
- Payroll management and disbursement
- KPI tracking
- Leave management
- Contract management
- System reports and settings

#### Manager/Supervisor Portal
- Team management and oversight
- Attendance viewing and manual punch (flexible timestamps)
- Leave approval workflow
- KPI monitoring
- Team payroll view (read-only)
- Team performance reports

#### Employee Portal
- Self-service dashboard
- Personal attendance records
- Manual punch (server time only)
- Leave request management
- Contract viewing
- Profile management
- KPI tracking

## Tech Stack

- **Frontend**: React 18.2.0
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: React Icons (4.12.0)
- **Forms**: React Hook Form
- **Notifications**: React Toastify
- **Build Tool**: Vite
- **Styling**: Custom CSS with CSS variables for theming

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── Card.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Table.jsx
│   │   └── Modal.jsx
│   ├── DashboardLayout.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Auth.css
│   ├── admin/
│   │   ├── Dashboard.jsx
│   │   └── Employees.jsx
│   ├── manager/
│   │   └── Dashboard.jsx
│   ├── employee/
│   │   └── Dashboard.jsx
│   ├── shared/
│   │   └── Attendance.jsx
│   ├── Unauthorized.jsx
│   └── Error.css
├── services/
│   └── api.js
├── App.jsx
├── main.jsx
├── index.css
└── vite.config.js
```

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or pnpm
- Backend API running (https://ubuntu-hrms-epmc.onrender.com by default)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ubuntu-hrms
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API URL:
   ```
   REACT_APP_API_URL=https://ubuntu-hrms-epmc.onrender.com
   ```

4. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   The application will open at `https://ubuntu-hrms12.vercel.app`

### Build for Production
```bash
pnpm build
# or
npm run build
```

### Preview Production Build
```bash
pnpm preview
# or
npm run preview
```

## Authentication

The application uses JWT-based authentication via the x-auth-token header.

### Demo Credentials
- **Admin**: username: `admin`, password: `password123`
- **Manager**: username: `manager`, password: `password123`

### Login Flow
1. User enters credentials on Login page
2. API returns JWT token
3. Token is stored in localStorage
4. Token is automatically sent with all subsequent requests via x-auth-token header
5. User is redirected based on their role

## API Integration

The application connects to the UBUNTU HRMS backend API with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance/:employeeId` - Get employee attendance
- `POST /api/attendance/biometrics/push` - Biometric punch
- `POST /api/attendance/manual/self` - Employee manual punch (server time)
- `POST /api/attendance/manual/manager` - Manager manual punch (flexible time)
- `PUT /api/attendance/:id` - Adjust attendance record

### Payroll
- `GET /api/payroll/calculate/:period` - Calculate payroll
- `POST /api/payroll/disburse` - Disburse payment
- `GET /api/payroll/payments` - Get payment history

### Other Endpoints
- KPIs, Leaves, Contracts - Full CRUD operations available

## Theme System

The application uses CSS custom properties (variables) for theming:

### Light Theme
- Primary: #3b82f6
- Background: #ffffff
- Text: #1f2937

### Dark Theme
- Primary: #3b82f6
- Background: #0f172a
- Text: #f1f5f9

Theme preference is saved to localStorage and persists across sessions.

## Styling Guidelines

The application uses:
- **CSS Variables**: For consistent theming and color management
- **Flexbox**: Primary layout method for components
- **CSS Grid**: For multi-column dashboard layouts
- **Responsive Design**: Mobile-first approach with media queries
- **Utility Classes**: Common patterns like `.flex`, `.gap-4`, `.p-4`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- React Router lazy loading ready
- Efficient re-renders with Context API
- API response caching via Axios
- CSS optimization with variables
- Image optimization ready

## Security Considerations

- JWT tokens stored securely in localStorage
- x-auth-token header for API authentication
- Protected routes with role-based access control
- Input validation on forms
- CORS handling via API configuration

## Troubleshooting

### "Cannot find module" errors
```bash
pnpm install
```

### API connection issues
- Verify backend is running on `https://ubuntu-hrms-epmc.onrender.com`
- Check `.env.local` has correct `REACT_APP_API_URL`
- Check browser console for CORS errors

### Theme not persisting
- Clear localStorage: `localStorage.clear()`
- Refresh the page

### Logout not working
- Clear localStorage: `localStorage.removeItem('authToken')`
- Check AuthContext configuration

## License

Proprietary - UBUNTU HRMS

## Support

For issues and feature requests, please contact the development team.
