# UBUNTU HRMS - Quick Start Guide

Get the HRMS application running in 5 minutes!

## Prerequisites Check
```bash
# Check Node.js installed
node --version    # Should be v16+

# Check npm/pnpm installed
npm --version     # or pnpm --version
```

## 1. Install Dependencies (1 minute)

```bash
# Navigate to project directory
cd ubuntu-hrms

# Install dependencies
pnpm install
# OR
npm install
```

## 2. Configure Backend URL (30 seconds)

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local (optional if backend is on localhost:5000)
# REACT_APP_API_URL=http://75.119.139.249
```

## 3. Start Backend (if not already running)

In a separate terminal:
```bash
cd ubuntu-hrms-backend
npm install
npm start
# Should output: Server running on http://75.119.139.249
```

## 4. Start Frontend (1 minute)

```bash
pnpm dev
# OR
npm run dev

# Application opens at: http://localhost:5177
```

## 5. Login & Explore (2 minutes)

### Demo Account 1: Admin
```
Username: admin
Password: password123
Access:   Full system access
```

Click through:
- Dashboard → See system stats
- Employees → Add/edit/delete employees
- Attendance → View attendance records
- Payroll → Calculate & disburse payments

### Demo Account 2: Manager
```
Username: manager
Password: password123
Access:   Team management only
```

Click through:
- Dashboard → Team overview
- My Team → Manage team members
- Attendance → Manual punch (flexible time)
- Leaves → Approve leave requests

### Demo Account 3: Employee
```
Username: employee
Password: password123
Access:   Self-service only
```

Click through:
- My Dashboard → Personal overview
- My Attendance → Personal records
- Manual Punch → Quick attendance recording
- My Leaves → Request leave

## Theme Toggle

Click the **Sun/Moon icon** in top-right to toggle between light & dark themes.

## Project Structure at a Glance

```
src/
├── pages/          ← All page components
├── components/     ← Reusable UI components
├── contexts/       ← Auth & Theme state
├── services/       ← API calls
├── App.jsx         ← Router configuration
└── index.css       ← Global styles
```

## Common Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# View source code
code .
```

## Troubleshooting

### Can't login?
1. Ensure backend is running: `http://75.119.139.249`
2. Check credentials are correct (copy-paste from above)
3. Open browser console (F12) for error details

### Port already in use?
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
pnpm dev -- --port 3000
```

### API connection error?
```bash
# Test backend connection
curl http://75.119.139.249/api/employees

# If error, ensure backend is running
cd ../ubuntu-hrms-backend
npm start
```

### Packages not installing?
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Key Features to Try

1. **Switch Roles**: Logout and login with different accounts to see different UIs
2. **Add Employee**: Admin → Employees → Add Employee button
3. **Manual Punch**: Manager/Employee can record attendance with flexible/server time
4. **Leave Request**: Employee → My Leaves → Request Leave
5. **Theme**: Click sun/moon icon to switch themes
6. **Responsive**: Resize browser to see mobile view
7. **Dark Mode**: Switch to dark theme and explore styling

## File Locations

| What | Where |
|------|-------|
| Pages | `src/pages/` |
| Components | `src/components/common/` |
| Styles | `src/pages/*//*.css` & `src/index.css` |
| API Calls | `src/services/api.js` |
| Authentication | `src/contexts/AuthContext.jsx` |
| Theme | `src/contexts/ThemeContext.jsx` |
| Routing | `src/App.jsx` |

## Next Steps

1. Read **SETUP.md** for detailed installation
2. Read **README.md** for feature details
3. Check **IMPLEMENTATION_SUMMARY.md** for what's built
4. Review `src/pages/` to understand structure
5. Modify `src/index.css` to customize colors
6. Add new pages by creating components
7. Deploy to production

## API Endpoints

All endpoints in `src/services/api.js`. Key ones:

```javascript
// Auth
POST /api/auth/login
POST /api/auth/register

// Employees
GET /api/employees
POST /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id

// Attendance
GET /api/attendance/:employeeId
POST /api/attendance/manual/self
POST /api/attendance/manual/manager

// Leaves, Payroll, KPIs, Contracts - all available
```

## Support

- **Installation issues?** → See SETUP.md
- **Feature details?** → See README.md
- **Code structure?** → See IMPLEMENTATION_SUMMARY.md
- **API endpoints?** → See src/services/api.js

## You're All Set!

```
✓ Frontend installed
✓ Backend connected
✓ Authentication working
✓ Three portals ready
✓ API integrated
✓ Themes working
✓ Mobile responsive

Happy exploring! 🚀
```

---

**Remember**: The application is fully functional. Just ensure your backend API is running!
