const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.FRONTEND_ORIGIN = 'https://ubuntu-hrms12.vercel.app';

const app = require('../app');
const Employee = require('../models/Employee.model');
const Attendance = require('../models/Attendance.model');

const createToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET);

const startServer = () => new Promise((resolve) => {
  const server = http.createServer(app);
  server.listen(0, () => {
    const { port } = server.address();
    resolve({ server, port });
  });
});

const request = async (port, method, path, body, token) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-auth-token': token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  return { response, json };
};

test('employee creation validates required fields', async (t) => {
  const { server, port } = await startServer();
  t.after(() => server.close());

  const token = createToken({ id: 1, role: 'admin' });
  const { response, json } = await request(port, 'POST', '/api/employees', { firstName: 'John' }, token);

  assert.equal(response.status, 400);
  assert.equal(json.msg, 'Validation failed');
  assert.ok(Array.isArray(json.errors));
});

test('employee creation accepts valid payload', async (t) => {
  const originalSave = Employee.prototype.save;
  Employee.prototype.save = async function saveStub() {
    this.id = this.id || 2;
    return this;
  };

  const { server, port } = await startServer();
  t.after(() => {
    server.close();
    Employee.prototype.save = originalSave;
  });

  const token = createToken({ id: 1, role: 'admin' });
  const payload = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+254700000000',
    biometricDeviceId: 'BIO-001',
    mpesaPhoneNumber: '254700000000',
    employmentType: 'Permanent',
    wageRate: 1200,
    department: 'Kitchen',
  };

  const { response, json } = await request(port, 'POST', '/api/employees', payload, token);

  assert.equal(response.status, 201);
  assert.equal(json.firstName, 'John');
  assert.equal(json.fullName, 'John Doe');
  assert.equal(json._id, '2');
});

test('attendance biometric push rejects invalid punch state', async (t) => {
  const { server, port } = await startServer();
  t.after(() => server.close());

  const { response, json } = await request(port, 'POST', '/api/attendance/biometrics/push', {
    biometricDeviceId: 'BIO-001',
    timestamp: '2026-04-01T08:00:00.000Z',
    punchState: 'invalidState',
  });

  assert.equal(response.status, 400);
  assert.equal(json.msg, 'Validation failed');
  assert.ok(json.errors.some((error) => error.includes('punchState')));
});

test('employee can only read own attendance records', async (t) => {
  const { server, port } = await startServer();
  t.after(() => {
    server.close();
  });

  const employeeToken = createToken({ id: 3, role: 'employee' });
  const { response } = await request(port, 'GET', '/api/attendance/4', null, employeeToken);

  assert.equal(response.status, 403);
});

test('attendance update recalculates total hours', async (t) => {
  const originalFindById = Attendance.findById;
  const attendanceDoc = {
    checkIn: new Date('2026-04-01T08:00:00.000Z'),
    checkOut: new Date('2026-04-01T17:30:00.000Z'),
    breakOut: new Date('2026-04-01T12:00:00.000Z'),
    breakIn: new Date('2026-04-01T12:30:00.000Z'),
    totalHoursWorked: 0,
    set(update) {
      Object.assign(this, update);
    },
    async save() {
      return this;
    },
  };
  Attendance.findById = async () => attendanceDoc;

  const { server, port } = await startServer();
  t.after(() => {
    server.close();
    Attendance.findById = originalFindById;
  });

  const token = createToken({ id: 1, role: 'admin' });
  const { response, json } = await request(port, 'PUT', '/api/attendance/5', {
    checkIn: '2026-04-01T08:00:00.000Z',
    checkOut: '2026-04-01T17:30:00.000Z',
    breakOut: '2026-04-01T12:00:00.000Z',
    breakIn: '2026-04-01T12:30:00.000Z',
  }, token);

  assert.equal(response.status, 200);
  assert.equal(json.totalHoursWorked, 8.5);
});