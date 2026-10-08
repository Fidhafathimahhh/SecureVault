require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const noteRoutes = require('./routes/noteRoutes');
const documentRoutes = require('./routes/documentRoutes');
const securityRoutes = require('./routes/securityRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply global rate limiting to API routes
app.use('/api', apiLimiter);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/security', securityRoutes);
app.use('/api', searchRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SecureVault Backend API', timestamp: new Date().toISOString() });
});

// Central error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🔐 SecureVault Backend Server running on port ${PORT}`);
  console.log(`===================================================`);
});
