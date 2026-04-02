# Acupressure Feature - Setup & Configuration Guide

## Quick Start

### Option 1: Using Existing Backend

If your backend is already running on `http://localhost:3001`:

1. **Verify Backend is Running**
   ```bash
   cd backend
   npm run dev
   # Should output: "Server running on port 3001"
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # Visit: http://localhost:3000/dashboard
   ```

3. **Access Feature**
   - Click the heart icon (❤️) in the dashboard navbar
   - You'll be taken to `/acupressure` page

### Option 2: Custom API URL

If your backend is running on a different port:

1. **Create `.env.local` in frontend directory**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT/api
   ```

2. **Restart frontend**
   ```bash
   npm run dev
   ```

## Backend Setup

### 1. Verify Backend Has Acupressure Routes

Check that `server.js` includes:
```javascript
const acupressureRoutes = require('./routes/acupressure');
// ... later in file ...
app.use('/api', acupressureRoutes);
```

### 2. Verify Data File Exists

```bash
# Check if data file exists
ls -la backend/data/acupressure_points.json

# If missing, it was created when you ran the setup
```

### 3. Test API Endpoints

```bash
# Replace YOUR_PORT with your actual port (default: 3001)

# Get all points
curl http://localhost:YOUR_PORT/api/acupressure-points

# Search for headache
curl "http://localhost:YOUR_PORT/api/acupressure/search?keyword=headache"

# Filter by Ayurveda
curl "http://localhost:YOUR_PORT/api/acupressure/filter?framework=Ayurveda"

# Get front body points
curl "http://localhost:YOUR_PORT/api/acupressure/by-body-part/front"
```

## Frontend Configuration

### Environment Variables

Create `frontend/.env.local`:
```env
# API URL (default: http://localhost:3001/api)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG_ACUPRESSURE=true
```

### Component Imports

Components are located in:
```
frontend/components/acupressure/
├── body-diagram.tsx
├── point-marker.tsx
├── point-details.tsx
├── search-bar.tsx
├── framework-filter.tsx
├── therapy-guide.tsx
└── index.ts
```

Import example:
```typescript
import { BodyDiagram, PointDetails } from '@/components/acupressure';
```

## Troubleshooting

### Issue: "Cannot find module" error

**Solution**: Make sure all component files are created:
```bash
# Check if all files exist
ls -la frontend/components/acupressure/

# Should show:
# body-diagram.tsx
# point-marker.tsx
# point-details.tsx
# search-bar.tsx
# framework-filter.tsx
# therapy-guide.tsx
# index.ts
```

### Issue: API endpoints not found (404 errors)

**Solution 1**: Verify backend routes are registered
```javascript
// In backend/server.js
const acupressureRoutes = require('./routes/acupressure');
// ...
app.use('/api', acupressureRoutes);
```

**Solution 2**: Check backend data file
```bash
# Verify data file is valid JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('./backend/data/acupressure_points.json')))"
```

### Issue: CORS errors

**Solution**: Ensure CORS is enabled in backend/server.js
```javascript
const cors = require('cors');
app.use(cors()); // Should be near top
```

### Issue: Points not showing on body diagram

**Solution 1**: Check browser console for errors
- Open DevTools (F12)
- Look for red errors in Console tab
- Check Network tab for failed API calls

**Solution 2**: Verify coordinates in data file
```javascript
// Each point should have coordinates like:
"coordinates": { "x": "78%", "y": "48%" }
```

**Solution 3**: Test API directly
```bash
curl http://localhost:3001/api/acupressure-points | json_pp
```

### Issue: Search functionality not working

**Solution**: Check search implementation in API
```bash
# Test search endpoint
curl "http://localhost:3001/api/acupressure/search?keyword=headache"
```

### Issue: Framework filter returns no results

**Solution**: Verify framework names match exactly
- "Ayurveda" (not "ayurveda")
- "Unani" (not "unani")
- "TCM" (not "tcm")
- "Modern" (not "modern")

## Performance Tips

### Frontend
1. **Enable Caching**: Add HTTP cache headers to API responses
   ```javascript
   // In backend/routes/acupressure.js
   res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
   ```

2. **Lazy Load Images**: If adding body diagrams as images
   ```typescript
   import Image from 'next/image';
   // Use Next.js Image component with lazy loading
   ```

3. **Memoize Components**: Prevent unnecessary re-renders
   ```typescript
   export const BodyDiagram = React.memo(({ points, ... }) => {
     // component code
   });
   ```

### Backend
1. **Load Data Once**: Cache JSON data in memory
   ```javascript
   let cachedPoints = null;
   async function loadAcupressurePoints() {
     if (cachedPoints) return cachedPoints;
     // load from file
     cachedPoints = data;
     return data;
   }
   ```

2. **Add Response Compression**:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

## Deployment Checklist

### Frontend Deployment (Vercel, Netlify, etc.)
- [ ] Set `NEXT_PUBLIC_API_URL` to production backend
- [ ] Run `npm run build` successfully
- [ ] Test all routes work
- [ ] Verify dark mode support
- [ ] Test on mobile devices

### Backend Deployment
- [ ] Use environment variables for config
- [ ] Enable CORS for production domain
- [ ] Add rate limiting
- [ ] Set up error logging
- [ ] Backup acupressure_points.json
- [ ] Use proper database instead of JSON (recommended)

## File Checklist

### New Files Created
- ✅ `/frontend/app/acupressure/page.tsx` - Main page
- ✅ `/frontend/components/acupressure/body-diagram.tsx`
- ✅ `/frontend/components/acupressure/point-marker.tsx`
- ✅ `/frontend/components/acupressure/point-details.tsx`
- ✅ `/frontend/components/acupressure/search-bar.tsx`
- ✅ `/frontend/components/acupressure/framework-filter.tsx`
- ✅ `/frontend/components/acupressure/therapy-guide.tsx`
- ✅ `/frontend/components/acupressure/index.ts`
- ✅ `/backend/routes/acupressure.js` - API routes
- ✅ `/backend/data/acupressure_points.json` - Data file

### Modified Files
- ✅ `/frontend/app/dashboard/page.tsx` - Added acupressure button
- ✅ `/backend/server.js` - Added acupressure routes

### Documentation Files
- ✅ `ACUPRESSURE_FEATURE_DOCS.md` - Feature documentation
- ✅ `ACUPRESSURE_SETUP.md` - This setup guide

## Next Steps

1. **Verify everything works**
   - Start backend: `npm run dev` (in backend/)
   - Start frontend: `npm run dev` (in frontend/)
   - Click heart icon in dashboard
   - Navigate to acupressure page

2. **Test features**
   - Click different points
   - Try searching
   - Test framework filters
   - Start a therapy session

3. **Customize** (optional)
   - Adjust therapy session duration
   - Add more acupressure points
   - Modify styling/colors
   - Add more frameworks

4. **Deploy**
   - Follow deployment checklist above
   - Test in production
   - Monitor error logs

## Support

For issues:
1. Check the Troubleshooting section above
2. Review ACUPRESSURE_FEATURE_DOCS.md
3. Check component code comments
4. Test API endpoints directly with curl/Postman

---

**Version**: 1.0.0  
**Last Updated**: 2024-04-02
