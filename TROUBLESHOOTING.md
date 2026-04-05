# NutriFusion Render Deployment - Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend Service Won't Start

**Error: "Cannot find module 'mongoose'"**
- Solution: Ensure `npm install` completes before start
- Check backend/package.json exists
- In Render: Build Command: `npm install`

**Error: "MONGODB_URI is required"**
- Solution: 
  1. Go to Render Dashboard → Backend Service → Settings
  2. Add Environment Variable: `MONGODB_URI=mongodb+srv://...`
  3. Redeploy service

**Error: "MongoDB connection timeout"**
- Solution:
  1. Go to MongoDB Atlas
  2. Network Access → IP Whitelist
  3. Click "Add Current IP" or set to "0.0.0.0/0"
  4. Click "Confirm"
  5. Redeploy

### 2. Frontend Won't Build

**Error: "npm ERR! missing script: build"**
- Solution: Check frontend/package.json has:
  ```json
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
  ```

**Error: "NEXT build failed"**
- Fix and test locally first:
  ```bash
  cd frontend
  npm install
  npm run build
  npm start
  ```
- Then push to GitHub and redeploy

**Error: "Cannot find NEXT_PUBLIC_API_URL"**
- Solution: Add to Render environment variables:
  - Key: `NEXT_PUBLIC_API_URL`
  - Value: `https://your-backend-service.onrender.com`
- Rebuild the service

### 3. API Connection Issues

**Error: "CORS policy: No 'Access-Control-Allow-Origin' header"**
- Solution: Update backend/server.js CORS configuration
- See CORS_CONFIGURATION.md for example
- Redeploy backend

**Error: "Failed to fetch from /api/..."**
- Check:
  1. Backend is running (test `/health` endpoint)
  2. NEXT_PUBLIC_API_URL is correct in frontend
  3. Network tab in browser shows correct API URL
  4. Backend logs for errors

**Error: "401 Unauthorized"**
- Check:
  1. JWT token is being stored locally
  2. Authorization header is being sent
  3. Backend middleware is checking tokens correctly

### 4. Database Issues

**Error: "Cannot connect to MongoDB Atlas"**
- Steps to fix:
  1. Check MONGODB_URI format:
     - Should be: `mongodb+srv://username:password@cluster.mongodb.net/database?...`
     - NOT: `mongodb://`
  2. Verify password doesn't have special characters (or URL encode them)
  3. Check cluster is active in MongoDB Atlas
  4. Verify IP whitelist includes Render IPs (use 0.0.0.0/0 for development)

**Error: "MongoNetworkError: connection refused"**
- Solutions:
  1. Restart MongoDB cluster in Atlas
  2. Check cluster tier (free tier sometimes sleeps)
  3. Verify connection string username/password

### 5. NutriFusion-Specific Issues

**Error: "Cannot find module './data/...'"**
- These data files should be in backend/data/
- Common culprits:
  - `acupressure_points.json`
  - `ayurveda_food_constitution.json`
  - `yoga_poses.json`
- Ensure these files are committed to git

**Error: "Groq API key invalid"**
- Solution:
  1. Get fresh key from console.groq.com
  2. Update in Render environment: `GROQ_API_KEY=...`
  3. Redeploy

**Assessment/Recommendation endpoints return 500**
- Check backend logs for AI service errors
- Verify API keys are set for all services used

### 6. Performance Issues

**Symptom: "First load takes 30+ seconds"**
- This is normal on free tier (cold start)
- Solutions:
  1. Upgrade to Starter plan ($7/month)
  2. Set up New Relic monitoring
  3. Optimize slow database queries
  4. Enable compression middleware

**Symptom: "API responses are very slow"**
- Check:
  1. Database query performance
  2. Add indexes to frequently queried fields
  3. Check backend logs for slow operations
  4. Profile in local environment first

### 7. Deployment Issues

**Error: "Build failed" (no specific error)**
- Rebuild from scratch:
  1. Check recent git commits
  2. Ensure new code doesn't have syntax errors
  3. Test build locally before pushing
  4. Check Render logs for full error messages

**Service stuck in "Deploy" state**
- Cancel deployment and retry:
  1. Click service name
  2. Click "Cancel Deployment"
  3. Wait 2 minutes
  4. Click "Manual Deploy" → "Clear build cache & deploy"

**Redeploy not picking up new environment variables**
- Force redeploy:
  1. Settings → Environment → Add dummy variable
  2. Delete dummy variable
  3. Click "Save"
  4. Render will redeploy automatically

## Debug Checklists

### Deploy Checklist
- [ ] Code pushed to GitHub
- [ ] GitHub repo is public (or Render has access)
- [ ] package.json exists in both backend/ and frontend/
- [ ] All required env variables are set
- [ ] MongoDB connection string is correct
- [ ] MongoDB Atlas allows Render IPs

### Connection Checklist
- [ ] Backend /health endpoint responds
- [ ] Frontend loads without 500 errors
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API calls going to correct URL
- [ ] API responses include correct CORS headers

### Functionality Checklist
- [ ] Login works
- [ ] Creating user profile works
- [ ] API data loads on dashboard
- [ ] No 401 errors on protected routes
- [ ] Forms submit without errors

## Accessing Logs

**Backend Logs:**
1. Render Dashboard → nutrifusion-backend
2. Click "Logs" tab
3. Search for errors or "ERROR"

**Frontend Logs:**
1. Render Dashboard → nutrifusion-frontend
2. Click "Logs" tab
3. Look for build errors or start errors

**Browser Logs:**
1. Open your deployed app
2. Press F12 to open Developer Tools
3. Click "Console" tab
4. Check for errors in red

## Getting Help

1. Check this guide first
2. Search Render docs: https://render.com/docs
3. Check MongoDB Atlas docs for connection issues
4. Check browser console for frontend errors
5. Check Render logs for backend errors

## Emergency Fixes

**Nuclear Option - Start Fresh:**
```bash
# Delete both services from Render
# Pull latest code from GitHub
git pull origin main

# Test locally
cd backend && npm install && npm run dev
# In another terminal:
cd frontend && npm install && npm run dev

# Verify everything works
# Then push and create new services in Render
```

## Success Indicators

✅ All checks pass if:
- Backend /health endpoint returns 200 OK
- Frontend loads in browser
- API calls complete without errors
- Forms/buttons work correctly
- No red errors in browser console
- No errors in Render logs

Your deployment is successful when:
1. User can register/login
2. User can create health profile
3. Dashboard loads and shows data
4. API calls go to your deployed backend
