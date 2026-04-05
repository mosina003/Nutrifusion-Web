# NutriFusion Deployment Guide for Render

This guide will help you deploy the NutriFusion project to Render.com.

## Project Overview
- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: Next.js application
- **Database**: MongoDB

## Prerequisites
1. Render account (render.com)
2. Paid plan or free plan (limitations apply)
3. GitHub repository with your code pushed
4. MongoDB Atlas account (free tier available)

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
cd c:\Users\Mosina.S\OneDrive\Desktop\NutriFusion-Mobile
git init
git add .
git commit -m "Initial commit for NutriFusion"
```

### 1.2 Push to GitHub
1. Create a new repository on GitHub (github.com)
2. Add remote and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/NutriFusion-Mobile.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new project
4. Create a cluster (free tier)
5. Create a database user with a password
6. Whitelist IP address (allow from anywhere for Render: `0.0.0.0/0`)
7. Copy the connection string (should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/nutrifusion?retryWrites=true&w=majority
   ```
8. Replace `<password>` with your actual password

## Step 3: Deploy Backend to Render

### 3.1 Create Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `nutrifusion-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose nearest to you
   - **Plan**: Free or Starter

### 3.2 Add Environment Variables
In the Render dashboard, go to Service → Environment:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nutrifusion?retryWrites=true&w=majority
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
FRONTEND_URL=your-frontend-url.onrender.com
```

### 3.3 Deploy
- Click **Create Web Service**
- Render will automatically build and deploy

## Step 4: Deploy Frontend to Render

### 4.1 Update API Configuration
Update your frontend's API endpoint configuration to use your backend URL:

Edit `frontend/.env.local` or `frontend/.env.production`:
```
NEXT_PUBLIC_API_URL=https://nutrifusion-backend.onrender.com
```

### 4.2 Create Frontend Service
1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `nutrifusion-frontend`
   - **Environment**: `Node`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Region**: Same as backend
   - **Plan**: Free or Starter

### 4.3 Add Environment Variables
```
NEXT_PUBLIC_API_URL=https://nutrifusion-backend.onrender.com
NODE_ENV=production
```

### 4.4 Deploy
- Click **Create Web Service**
- Wait for build to complete

## Step 5: Configure CORS on Backend

Update `backend/server.js` to allow your frontend URL:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'https://your-frontend-url.onrender.com',
  'http://localhost:3000' // for development
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Step 6: Verify Deployment

### 6.1 Test Backend
```
https://nutrifusion-backend.onrender.com/health
```
Should return:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...
}
```

### 6.2 Test Frontend
Visit your frontend URL and verify API calls work

### 6.3 Check Logs
In Render Dashboard:
- Click on service
- Go to **Logs** tab to see deployment and runtime logs

## Step 7: Environment Variables Reference

### Backend (.env or Render)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
GROQ_API_KEY=your_key
GOOGLE_GENERATIVE_AI_API_KEY=your_key  # if using Google AI
```

### Frontend (.env.production or Render)
```
NEXT_PUBLIC_API_URL=https://nutrifusion-backend.onrender.com
NODE_ENV=production
```

## Troubleshooting

### Backend won't start
- Check `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas includes `0.0.0.0/0`
- Check all API keys are set

### Frontend can't connect to backend
- Verify backend URL is correct in environment
- Check CORS is configured
- Check backend is running (test health endpoint)

### Slow deployments
- First deployment takes longer
- Cold starts on free tier can be slow
- Consider upgrading to Starter plan

### Database connection timeout
- Ensure MongoDB Atlas IP whitelist includes Render's IPs
- Use `0.0.0.0/0` for development (not recommended for production)

## Important Notes

⚠️ **Free Tier Limitations**:
- Services spin down after 15 minutes of inactivity
- Limited computing resources
- Limited monthly hours (330 hours/month)

💡 **Recommendations**:
- Use Starter plan for production ($7/month)
- Enable **Auto-Deploy** for automatic updates
- Set up monitoring and alerts
- Keep sensitive data in environment variables

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## Next Steps

1. Push code to GitHub
2. Set up MongoDB Atlas
3. Create backend service on Render
4. Create frontend service on Render
5. Configure environment variables
6. Test the application
7. Set up monitoring

Good luck with your deployment! 🚀
