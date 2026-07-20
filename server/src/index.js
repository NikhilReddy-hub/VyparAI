require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const staffRoutes = require('./routes/staffRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const aiRoutes = require('./routes/aiRoutes');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://vypar-ai.vercel.app').split(',');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect Database
connectDB();

// Pre-register Mongoose Schemas to prevent population race conditions
require('./models/User');
require('./models/Customer');
require('./models/Supplier');
require('./models/Category');
require('./models/Product');
require('./models/Staff');
require('./models/Invoice');
require('./models/Activity');
require('./models/BusinessHealth');

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: (origin, callback) => {
    if (
      ALLOWED_ORIGINS.includes('*') || 
      !origin || 
      ALLOWED_ORIGINS.some(o => origin.startsWith(o.trim())) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Pass Socket.io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/ai', aiRoutes);

// Static files server for barcode generation/OCR uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ name: 'VyaparAI API', status: 'Online', version: '1.0.0' });
});

// Health check — used by frontend pre-warm ping to detect cold start completion
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket Connection handling
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);
  
  socket.on('join:business', (businessId) => {
    socket.join(businessId);
    console.log(`Joined room: ${businessId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 VyaparAI Backend Server running on port ${PORT}`);
});
