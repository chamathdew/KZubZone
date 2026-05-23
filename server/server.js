const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedAdminRoles } = require('./controllers/authController');
const { apiLimiter, mongoSanitize, xssProtection, helmetGuard } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const { logPageVisit } = require('./controllers/analyticsController');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB().then(() => {
  // Seed basic admin details and roles on connection
  seedAdminRoles();
});

// Middleware security stack
app.use(helmetGuard);
app.use(cors({
  origin: '*', // Enable flexible origins for dev purposes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom sanitizers to prevent injection
app.use(mongoSanitize);
app.use(xssProtection);

// Serve static upload folders (local fallback assets)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Logger visitor hit counter
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    logPageVisit(req, null, null);
  }
  next();
});

// Bind routers
const seoRoutes = require('./routes/seoRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const subtitleRoutes = require('./routes/subtitleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Public indexing SEO paths
app.use('/', seoRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/subtitles', subtitleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Simple base checks
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', serverTime: new Date() });
});

// Centralized error handler
app.use(errorHandler);

// Listen to incoming requests
app.listen(PORT, () => {
  console.log(`KDramaVerse server running in dev mode on port ${PORT}`);
});
