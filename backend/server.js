const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Manual environment variable loading as fallback
const fs = require('fs');
const path = require('path');

// Load .env file from parent directory if not found in current directory
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  // Set environment variables
  Object.keys(envVars).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = envVars[key];
    }
  });
}

// Import routes
const claimsRoutes = require('./routes/claims');
const securityRoutes = require('./routes/security');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const mlRoutes = require('./routes/ml');
const weatherRoutes = require('./routes/weather');
const complianceRoutes = require('./routes/compliance');
const apmRoutes = require('./routes/apm');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const elasticClient = require('./config/elasticsearch');

// Import services
const elasticService = require('./services/elasticService');
const mlService = require('./services/mlService');
const aiService = require('./services/aiService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chegg-elastic-demo-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chegg Elastic Insurance Demo API',
      version: '1.0.0',
      description: 'Comprehensive API for insurance industry use cases with Elastic',
      contact: {
        name: 'Chegg Development Team',
        email: 'dev@chegg.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/claims', claimsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/apm', apmRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chegg Elastic Insurance Demo API',
    version: '1.0.0',
    endpoints: {
      docs: '/api-docs',
      health: '/health',
      claims: '/api/claims',
      security: '/api/security',
      analytics: '/api/analytics',
      ai: '/api/ai',
      ml: '/api/ml',
      weather: '/api/weather',
      compliance: '/api/compliance',
      apm: '/api/apm',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function initializeServices() {
  try {
    // Test Elasticsearch connection
    const isConnected = await elasticClient.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Elasticsearch');
    }
    logger.info('Elasticsearch connection established');

    // Initialize ML service
    await mlService.initialize();
    logger.info('ML service initialized');

    // Initialize AI service
    await aiService.initialize();
    logger.info('AI service initialized');

    // Initialize Elastic service
    await elasticService.initialize();
    logger.info('Elastic service initialized');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Chegg Elastic Demo API server running on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
