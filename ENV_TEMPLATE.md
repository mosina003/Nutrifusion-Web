# Environment Variables Template for Render Deployment

## Backend Environment Variables (.env)
```
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/nutrifusion?retryWrites=true&w=majority

# API Keys
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here

# Frontend URL (for CORS)
FRONTEND_URL=https://your-nutrifusion-frontend.onrender.com
```

## Frontend Environment Variables (.env.production)
```
# API Configuration
NEXT_PUBLIC_API_URL=https://your-nutrifusion-backend.onrender.com

# Environment
NODE_ENV=production
```

## How to Add to Render:

1. Go to your service in Render Dashboard
2. Click **Settings** → **Environment**
3. Add each variable one by one, OR
4. Paste all at once (Render accepts bulk copy-paste)

## Getting Your Values:

### MONGODB_URI
1. Go to MongoDB Atlas (atlas.mongodb.com)
2. Your project → Deployment → Database
3. Click "Connect" button
4. Choose "Drivers" (not MongoDB Compass)
5. Copy the connection string
6. Replace `<password>` with your database user password
7. The database name is already in the string

### GROQ_API_KEY
1. Go to Groq Console (console.groq.com)
2. Create an API key
3. Copy and paste here

### Backend/Frontend URLs
These are automatically assigned by Render:
- Backend: `https://nutrifusion-backend.onrender.com`
- Frontend: `https://nutrifusion-frontend.onrender.com`

(Replace with your actual Render service names)

## Important Security Notes:

⚠️ NEVER commit .env files to GitHub
✅ Always use Render's environment variable feature for sensitive data
✅ Rotate API keys regularly
✅ Use different keys for development and production
