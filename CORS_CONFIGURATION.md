// Updated CORS Configuration for Production
// Add this to your backend/server.js file

// Example of proper CORS setup for production:
/*

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000', // Production frontend
  'http://localhost:3000', // Local development
  'http://localhost:3001'  // Alternative local port
];

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy: ' + origin));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Apply CORS
app.use(cors(corsOptions));

// Rest of your Express setup...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

*/

// For Render Deployment - Updated server.js section to add:

// Add this configuration RIGHT AFTER require('dotenv').config();
// and BEFORE app.use(cors()):

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Everything else remains the same...
