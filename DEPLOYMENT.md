# Vercel Deployment Guide

## Overview
This guide explains how to deploy the Ubuntu HRMS application to Vercel.

## Architecture
- **Frontend**: React/Vite app (ubuntu-hrms-frontend)
- **Backend**: Node.js/Express with PostgreSQL (ubuntu-hrms-backend)

## Option 1: Deploy Frontend to Vercel, Backend to Render/Railway

### Step 1: Deploy Backend to Render (Recommended)

1. Create a Render account at https://render.com
2. Create a PostgreSQL database on Render
3. Create a new Web Service:
   - Connect your GitHub repository
   - Root directory: `ubuntu-hrms-backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: 5000 (or any port)
5. Deploy and note the backend URL

### Step 2: Deploy Frontend to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd ubuntu-hrms-frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

5. Set environment variable in Vercel dashboard:
   - Go to your project settings
   - Add `VITE_API_URL` with your backend URL from Render

## Option 2: Deploy Both to Vercel (Using Serverless Functions)

### Step 1: Set up Vercel PostgreSQL

1. Go to Vercel dashboard → Storage → Create Database
2. Select PostgreSQL and create a database
3. Copy the connection string

### Step 2: Configure Backend for Serverless

1. The backend needs to be converted to use Vercel serverless functions
2. This requires significant refactoring - see Option 1 for easier deployment

## Environment Variables

### Backend Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `EMAIL_HOST`: SMTP host (for email features)
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password

### Frontend Required Variables
- `VITE_API_URL`: Backend API URL

## Database Migration

Before deploying, ensure your database schema is up to date:

```bash
cd ubuntu-hrms-backend
node config/db.js
```

## Troubleshooting

### CORS Issues
Ensure your backend allows requests from your Vercel frontend domain in the CORS configuration.

### File Uploads
If using file uploads, ensure you're using a cloud storage service (AWS S3, Cloudinary) instead of local storage for production.

### Background Jobs
The KPI bonus processor runs as a background job. For serverless environments, consider using a cron job service or move to a long-running server.
