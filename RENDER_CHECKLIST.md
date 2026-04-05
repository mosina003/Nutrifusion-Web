# Quick Start Checklist for Render Deployment

Complete these steps in order:

## Phase 1: Preparation (5-10 minutes)
- [ ] Have GitHub account and repository created
- [ ] Push your NutriFusion code to GitHub
- [ ] Note your GitHub repository URL

## Phase 2: Database Setup (10-15 minutes)
- [ ] Create MongoDB Atlas account (free)
- [ ] Create a project
- [ ] Create a cluster (M0 free tier)
- [ ] Create database user with password
- [ ] Whitelist IP address (0.0.0.0/0 for now)
- [ ] Copy MongoDB connection string
- [ ] Replace password in connection string

## Phase 3: Backend Deployment (10-15 minutes)
- [ ] Sign up for Render (render.com)
- [ ] Connect GitHub account to Render
- [ ] Create new Web Service
- [ ] Select your GitHub repository
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Add Environment Variables:
  - [ ] MONGODB_URI: (paste from MongoDB Atlas)
  - [ ] GROQ_API_KEY: (your API key)
  - [ ] NODE_ENV: `production`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy your backend URL (e.g., nutrifusion-backend.onrender.com)
- [ ] Test: Visit `https://your-backend-url/health` in browser

## Phase 4: Frontend Deployment (10-15 minutes)
- [ ] Update frontend API URL:
  - [ ] Create `.env.production` file in frontend/ folder
  - [ ] Add: `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com`
  - [ ] Push to GitHub
- [ ] In Render Dashboard, create new Web Service
- [ ] Select your GitHub repository again
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npm start`
- [ ] Add Environment Variables:
  - [ ] NEXT_PUBLIC_API_URL: `https://your-backend-url.onrender.com`
  - [ ] NODE_ENV: `production`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy your frontend URL

## Phase 5: Testing & Verification (5-10 minutes)
- [ ] Visit your frontend URL
- [ ] Test login functionality
- [ ] Test creating a health profile
- [ ] Check browser console for errors
- [ ] Check Render logs for backend errors
- [ ] Test API calls in Postman:
  - [ ] GET `/health` (should return OK)
  - [ ] GET `/api/auth/profile` (should be accessible)

## Phase 6: Production Optimization (Optional)
- [ ] Enable Auto-Deploy in Render settings
- [ ] Set up monitoring
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (auto in Render)
- [ ] Set up error tracking (Sentry)

## Troubleshooting Quick Fixes

### Backend won't deploy
- Check that backend/package.json exists
- Check MongoDB connection string format
- Check all environment variables are set

### Frontend won't build
- Check that frontend/package.json exists
- Verify `npm run build` works locally:
  ```bash
  cd frontend
  npm install
  npm run build
  ```

### API calls failing
- Check CORS is enabled on backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running (test /health)

### Slow first load
- Free tier may have cold starts (15+ seconds)
- This is normal - upgrade to Starter for better performance

## Time Estimates
- Total time: 45-60 minutes
- If you have issues: 1-2 hours

## Next Steps After Deployment
1. Share your deployed app URL
2. Gather user feedback
3. Monitor logs for errors
4. Plan upgrades if needed
5. Set up CI/CD automation

Need help? Refer to RENDER_DEPLOYMENT_GUIDE.md for detailed instructions.
