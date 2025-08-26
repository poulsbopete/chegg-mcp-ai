const express = require('express');
const winston = require('winston');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * @swagger
 * /api/apm/performance:
 *   get:
 *     summary: Get application performance metrics
 *     tags: [APM]
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    // Sample APM data for demo
    const apmData = {
      responseTime: {
        p50: 120,
        p95: 450,
        p99: 1200
      },
      throughput: {
        requestsPerSecond: 1250,
        errorsPerSecond: 2.5
      },
      errors: {
        total: 1250,
        rate: 0.002,
        byType: [
          { type: 'timeout', count: 450 },
          { type: 'database', count: 300 },
          { type: 'network', count: 500 }
        ]
      }
    };

    res.json(apmData);
  } catch (error) {
    logger.error('Error fetching APM data:', error);
    res.status(500).json({ error: 'Failed to fetch APM data' });
  }
});

module.exports = router;
