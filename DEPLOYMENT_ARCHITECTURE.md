# NutriFusion Deployment Architecture for Render

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ HTTPS
                ┌──────────────────┴──────────────────┐
                │                                     │
        ┌───────▼────────┐                 ┌─────────▼────────┐
        │  Frontend App  │◄─────HTTP───────┤  Backend API     │
        │   (Next.js)    │                 │  (Express.js)    │
        │   on Render    │                 │  on Render       │
        └───────┬────────┘                 └─────────┬────────┘
                │                                    │
                │         (HTTPS)                    │
                └────────────────────┬───────────────┘
                                     │
                            ┌────────▼────────┐
                            │  MongoDB Atlas  │
                            │    Database     │
                            └─────────────────┘
```

## Deployment Flow

### Phase 1: Preparation
```
Local Machine
    │
    ├─ Create GitHub Repo
    ├─ Commit code
    └─ Push to GitHub
           │
           ▼
    GitHub (Remote)
```

### Phase 2: Backend Deployment
```
GitHub
    │
    ▼
Render Backend Service
    ├─ Download code
    ├─ Run: npm install (backend/)
    ├─ Run: npm start
    ├─ Connect to MongoDB Atlas
    ▼
Listening on: https://nutrifusion-backend.onrender.com
```

### Phase 3: Frontend Deployment
```
GitHub
    │
    ▼
Render Frontend Service
    ├─ Download code
    ├─ Run: npm install (frontend/)
    ├─ Run: npm run build
    ├─ Run: npm start
    ├─ Load env: NEXT_PUBLIC_API_URL
    ▼
Accessible at: https://nutrifusion-frontend.onrender.com
```

## Environment Setup Summary

### Backend Environment Variables
```
MONGODB_URI          → MongoDB Atlas connection string
NODE_ENV             → "production"
PORT                 → 5000 (set by default in server.js)
GROQ_API_KEY        → Your Groq API key
GOOGLE_AI_KEY       → Your Google AI key (if needed)
FRONTEND_URL        → Your frontend Render URL (for CORS)
```

### Frontend Environment Variables
```
NEXT_PUBLIC_API_URL → Your backend Render URL
NODE_ENV            → "production"
```

## Service Communication

### Frontend → Backend Communication
1. User interacts with frontend
2. Frontend makes HTTP request to backend URL
3. Backend receives request, processes, returns response
4. Frontend updates UI with response

### Backend → Database Communication
1. Backend receives API request
2. Validates request and user permissions
3. Queries MongoDB Atlas
4. Returns results to frontend

## Deployment Services Breakdown

### Render services needed:
1. **Web Service (Backend)**
   - Runs Node.js/Express API
   - Connects to MongoDB
   - Exposes REST API endpoints

2. **Web Service (Frontend)**
   - Runs Next.js application
   - Serves React UI
   - Makes API calls to backend

### External Services needed:
1. **MongoDB Atlas**
   - Database as a Service (DBaaS)
   - Free tier available
   - Hosted database for user data

## Build Process

### Backend Build
```
1. Render receives new commit
2. Clones repository
3. Navigates to backend/ directory
4. Runs: npm install
5. Installs dependencies from package-lock.json
6. Starts service with: npm start
7. Listens on PORT 5000
```

### Frontend Build
```
1. Render receives new commit
2. Clones repository
3. Navigates to frontend/ directory
4. Runs: npm install
5. Installs dependencies
6. Runs: npm run build
   - Compiles Next.js app
   - Creates optimized production build
   - Checks for build errors
7. Starts server with: npm start
   - Starts Next.js production server
   - Listens on PORT 3000 (internally)
```

## Data Flow Examples

### Example 1: User Registration
```
Browser
    │ POST /api/auth/register
    ▼
Frontend (HTTPS)
    │ POST https://backend-url/api/auth/register
    ▼
Backend (Express)
    │ Receive request
    │ Hash password
    │ Create user document
    ▼
MongoDB (HTTPS)
    │ Insert user
    ▼
Backend
    │ Return success
    ▼
Frontend
    │ Redirect to login
    ▼
Browser (Shows login page)
```

### Example 2: Loading Dashboard
```
Browser
    │ GET /dashboard
    ▼
Frontend
    │ Check localStorage for token
    │ GET /api/dashboard with Authorization header
    ▼
Backend (Express)
    │ Verify JWT token
    │ Extract user ID
    │ Query user data
    ▼
MongoDB
    │ Return user documents
    ▼
Backend
    │ Return combined data
    ▼
Frontend
    │ Render components
    │ Display data
    ▼
Browser (Shows dashboard)
```

## Scaling Considerations

### Free Tier Limitations
- Services spin down after 15 min inactivity
- Limited computational resources
- 330 hours/month
- Suitable for: Demos, learning, low-traffic apps

### Starter Plan ($7/month)
- Always running
- Better performance
- Suitable for: Small production apps
- Recommended for NutriFusion MVP

### Pro/Premium Plans
- More resources
- Better support
- Suitable for: Growing applications

## Monitoring and Maintenance

### What to Monitor
1. **Deployment Status**: Check Render dashboard
2. **Application Logs**: View backend and frontend logs
3. **Database**: Monitor MongoDB Atlas metrics
4. **Error Rates**: Check for 500/400 errors
5. **Response Times**: Measure API latency

### Health Checks
- Backend health: `GET /health`
- Frontend loads: Check browser
- Database connection: Check MongoDB connection
- API endpoints: Test with Postman

## Backup and Recovery

### Database Backups
- MongoDB Atlas automatically backs up free tier
- Backups retained for 7 days
- Automatic backup points available

### Code Recovery
- All code in GitHub
- Can redeploy anytime by pushing new commits
- Render will auto-rebuild

### Environment Variable Recovery
- Saved in Render dashboard
- Not stored in code
- Need to keep note of sensitive keys

## Deployment Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Setup GitHub | 5 min |
| 2 | Setup MongoDB Atlas | 10 min |
| 3 | Deploy Backend | 10 min |
| 4 | Test Backend | 5 min |
| 5 | Deploy Frontend | 10 min |
| 6 | Configure CORS | 2 min |
| 7 | Test Full App | 10 min |
| | **TOTAL** | **~52 min** |

## Success Criteria

✅ Deployment successful when:
1. Backend service shows "Live" status
2. Frontend service shows "Live" status
3. Database connection tests pass
4. `/health` endpoint returns 200 OK
5. Frontend loads in browser
6. API calls work without CORS errors
7. User can register and login
8. Dashboard loads with data

---

**Next Steps**: Follow RENDER_CHECKLIST.md step-by-step for deployment
