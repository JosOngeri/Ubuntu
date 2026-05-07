const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();


const allowedOrigins = [
  'https://ubuntu-hrms12.vercel.app',
  'https://ubuntu-hrms12.vercel.app',
  process.env.FRONTEND_ORIGIN,
  'https://ubuntu-hrms-epmc.onrender.com',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
    credentials: true,
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/users', require('./routes/user.routes'));

// Payroll, KPI, Leave, Contract modules
app.use('/api/payroll', require('./routes/payroll.routes'));
app.use(['/api/kpi', '/api/kpis'], require('./routes/kpi.routes'));
app.use(['/api/leave', '/api/leaves'], require('./routes/leave.routes'));
app.use('/api/contracts', require('./routes/contract.routes'));
app.use('/api/contractors', require('./routes/contractor.routes'));

// Settings and configuration
app.use('/api/settings', require('./routes/settings.routes'));

app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ msg: 'Server error' });
});

module.exports = app;