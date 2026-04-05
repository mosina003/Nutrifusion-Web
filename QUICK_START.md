# Quick Reference - Deploy NutriFusion to Render

## 📋 Pre-Deployment Checklist

Before starting, ensure:
- [ ] GitHub account created (github.com)
- [ ] Render account created (render.com)
- [ ] MongoDB Atlas account created (mongodb.com)
- [ ] NutriFusion code committed to GitHub repo
- [ ] All API keys obtained (Groq, Google AI, etc.)

## 🚀 5-Step Deployment Process

### Step 1: MongoDB Atlas Setup (10 minutes)
```
1. Login to MongoDB Atlas (mongodb.com)
2. Create Project → Create Cluster (M0 Free)
3. Create Database User (save password!)
4. Network Access → Add IP 0.0.0.0/0
5. Databases → Connect → Drivers → Copy connection string
6. Replace <password> with your actual password
Keep this string for Step 3!
```

### Step 2: Deploy Backend to Render (10 minutes)
```
1. Login to Render (render.com)
2. New → Web Service
3. Connect GitHub repo
Root Directory: backend
Build Command: npm install
Start Command: npm start

4. Environment Variables:
   MONGODB_URI = [from MongoDB Atlas]
   NODE_ENV = production
   GROQ_API_KEY = [your key]

5. Create Web Service
6. Wait for "Live" status
7. Copy the URL (e.g., nutrifusion-backend.onrender.com)
```

### Step 3: Create .env.production in Frontend
```
In your frontend folder, create file: .env.production

Add this line:
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com

Push to GitHub!
```

### Step 4: Deploy Frontend to Render (10 minutes)
```
1. In Render Dashboard → New → Web Service
2. Connect same GitHub repo
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start

3. Environment Variables:
   NEXT_PUBLIC_API_URL = [your backend URL]
   NODE_ENV = production

4. Create Web Service
5. Wait for build and "Live" status
6. Copy the URL (e.g., nutrifusion-frontend.onrender.com)
```

### Step 5: Test Your Deployment (5 minutes)
```
1. Test Backend:
   Visit: https://your-backend-url/health
   Should see: {"status": "OK", ...}

2. Test Frontend:
   Visit: https://your-frontend-url
   Should see: Login page

3. Try Functionality:
   - Register new account
   - Login
   - Create health profile
   - Check dashboard
```

## 📝 Important Notes

### Environment Variables by Service

**Backend (in Render)**:
- MONGODB_URI (Required)
- NODE_ENV = production
- GROQ_API_KEY (if used)
- GOOGLE_GENERATIVE_AI_API_KEY (if used)

**Frontend (in Render)**:
- NEXT_PUBLIC_API_URL (Required)
- NODE_ENV = production

### Common Mistakes to Avoid
❌ Forgetting to update NEXT_PUBLIC_API_URL
❌ Not whitelisting 0.0.0.0/0 in MongoDB
❌ Wrong MongoDB connection string
❌ Missing API keys in Render
❌ Wrong root directories (should be backend/ and frontend/)

### Expected Timings
- First deployment: 2-5 minutes (includes compile time)
- Subsequent deploys: 1-2 minutes (faster with caching)
- Cold starts (free tier): 15-30 seconds first time

## 🔗 Important URLs

**During Deployment**:
1. GitHub: https://github.com (push code here)
2. MongoDB Atlas: https://atlas.mongodb.com (get connection string)
3. Render: https://render.com/dashboard (deploy services)
4. Render Docs: https://render.com/docs

**After Deployment**:
1. Backend Health: https://your-backend-url/health
2. API Docs: https://your-backend-url/ (lists all endpoints)
3. Frontend App: https://your-frontend-url

## 🛠️ If Something Goes Wrong

### Backend won't start
→ Check MongoDB URI in environment variables
→ Check IP whitelist (0.0.0.0/0)
→ View logs in Render dashboard

### Frontend won't build
→ Test locally with:
```bash
cd frontend
npm install && npm run build
```

### API calls failing
→ Check NEXT_PUBLIC_API_URL is correct
→ Check backend /health endpoint works
→ Check browser console for CORS errors

### Services stuck deploying
→ Cancel deployment
→ Wait 2 minutes
→ Click "Manual Deploy"

## 📞 Support Resources

- Render Docs: https://render.com/docs
- MongoDB Docs: https://docs.mongodb.com/
- Next.js Docs: https://nextjs.org/docs
- Express.js: https://expressjs.com/

## ✅ Final Verification Checklist

After deployment is complete:
- [ ] Backend service shows "Live" in Render
- [ ] Frontend service shows "Live" in Render
- [ ] Backend /health endpoint accessible
- [ ] Frontend page loads in browser
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Dashboard displays data
- [ ] No red errors in browser console
- [ ] No errors in Render backend logs

## 🎉 Success!

When all checklist items are complete, your NutriFusion app is successfully deployed to Render!

### Next Steps:
1. Share your app URL with users
2. Gather feedback
3. Monitor logs for errors
4. Plan upgrades as needed
5. Consider upgrading from free to Starter tier for better performance

---

**Detailed Guides Available**:
- `RENDER_DEPLOYMENT_GUIDE.md` - Full detailed guide
- `RENDER_CHECKLIST.md` - Step-by-step checklist
- `TROUBLESHOOTING.md` - Problem solving guide
- `DEPLOYMENT_ARCHITECTURE.md` - System architecture
- `ENV_TEMPLATE.md` - Environment variables reference
