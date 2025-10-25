require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
// const { startListening } = require('./utils/blockchainListener'); // Disabled - using Envio HyperIndex
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));

// Webhook routes (for Envio)
app.use('/api/webhooks', require('./routes/webhooks'));

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      
      // Envio HyperIndex is now handling blockchain event indexing
      console.log('✅ Using Envio HyperIndex for blockchain event indexing');
      console.log(`📊 GraphQL endpoint: ${process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'}`);
      console.log('📡 Webhook endpoint: /api/webhooks/envio');
    });

    // Old blockchain listener is disabled - now using Envio HyperIndex
    // if (process.env.SEPOLIA_RPC_URL && process.env.CONTRACT_ADDRESS) {
    //   setTimeout(() => {
    //     startListening();
    //   }, 2000);
    // } else {
    //   console.log('⚠️ Blockchain listener not started - missing configuration');
    // }
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

