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
 * /api/weather/climate-risk:
 *   get:
 *     summary: Get climate risk analysis
 *     tags: [Weather]
 *     responses:
 *       200:
 *         description: Climate risk data
 */
router.get('/climate-risk', async (req, res) => {
  try {
    // Sample climate risk data for demo
    const climateData = {
      regions: [
        {
          name: 'Texas',
          riskLevel: 'high',
          factors: ['hurricanes', 'flooding', 'drought'],
          insuredAssets: 1500000000,
          riskScore: 0.85
        },
        {
          name: 'California',
          riskLevel: 'high',
          factors: ['wildfires', 'earthquakes', 'drought'],
          insuredAssets: 2000000000,
          riskScore: 0.92
        }
      ],
      weatherAlerts: [
        {
          type: 'hurricane',
          severity: 'high',
          location: 'Gulf Coast',
          affectedAssets: 500000000
        }
      ]
    };

    res.json(climateData);
  } catch (error) {
    logger.error('Error fetching climate risk data:', error);
    res.status(500).json({ error: 'Failed to fetch climate risk data' });
  }
});

module.exports = router;
