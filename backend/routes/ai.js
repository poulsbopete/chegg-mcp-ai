const express = require('express');
const aiService = require('../services/aiService');
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
 * /api/ai/semantic-search:
 *   get:
 *     summary: Perform semantic search
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Semantic search results
 */
router.get('/semantic-search', async (req, res) => {
  try {
    const { q, size = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await aiService.semanticSearch(q, { size: parseInt(size) });
    res.json(results);
  } catch (error) {
    logger.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Failed to perform semantic search' });
  }
});

/**
 * @swagger
 * /api/ai/assistant:
 *   post:
 *     summary: Get AI Assistant response
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: User question
 *     responses:
 *       200:
 *         description: AI Assistant response
 */
router.post('/assistant', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const answer = await aiService.generateAnswer(question);
    res.json(answer);
  } catch (error) {
    logger.error('Error generating AI Assistant response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Get AI service status
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: AI service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await aiService.getServiceStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting AI service status:', error);
    res.status(500).json({ error: 'Failed to get service status' });
  }
});

module.exports = router;
