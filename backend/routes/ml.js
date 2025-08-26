const express = require('express');
const mlService = require('../services/mlService');
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
 * /api/ml/status:
 *   get:
 *     summary: Get ML service status
 *     tags: [ML]
 *     responses:
 *       200:
 *         description: ML service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await mlService.getModelStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting ML service status:', error);
    res.status(500).json({ error: 'Failed to get ML service status' });
  }
});

module.exports = router;
