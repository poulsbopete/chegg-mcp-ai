const express = require('express');
const { body, validationResult } = require('express-validator');
const elasticClient = require('../config/elasticsearch');
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
 * components:
 *   schemas:
 *     Claim:
 *       type: object
 *       properties:
 *         claimId:
 *           type: string
 *           description: Unique claim identifier
 *         policyNumber:
 *           type: string
 *           description: Policy number
 *         claimantName:
 *           type: string
 *           description: Name of the claimant
 *         claimType:
 *           type: string
 *           enum: [auto, home, health, life, business]
 *           description: Type of insurance claim
 *         claimAmount:
 *           type: number
 *           description: Claim amount in dollars
 *         incidentDate:
 *           type: string
 *           format: date-time
 *           description: Date of the incident
 *         region:
 *           type: string
 *           description: Geographic region
 *         status:
 *           type: string
 *           enum: [pending, approved, denied, under_review]
 *           description: Current status of the claim
 *         description:
 *           type: string
 *           description: Description of the incident
 *         vin:
 *           type: string
 *           description: Vehicle identification number (for auto claims)
 *         agentId:
 *           type: string
 *           description: ID of the handling agent
 *         channel:
 *           type: string
 *           enum: [phone, online, mobile, agent]
 *           description: Channel through which claim was filed
 */

/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: Get all claims with optional filtering
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by claim status
 *       - in: query
 *         name: claimType
 *         schema:
 *           type: string
 *         description: Filter by claim type
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Starting offset
 *     responses:
 *       200:
 *         description: List of claims
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 claims:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Claim'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      claimType,
      region,
      from,
      to,
      size = 20,
      from: fromOffset = 0
    } = req.query;

    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

    // Build query
    const query = {
      bool: {
        must: []
      }
    };

    if (status) {
      query.bool.must.push({ term: { status: status } });
    }

    if (claimType) {
      query.bool.must.push({ term: { claimType: claimType } });
    }

    if (region) {
      query.bool.must.push({ term: { region: region } });
    }

    if (from || to) {
      const rangeQuery = { range: { incidentDate: {} } };
      if (from) rangeQuery.range.incidentDate.gte = from;
      if (to) rangeQuery.range.incidentDate.lte = to;
      query.bool.must.push(rangeQuery);
    }

    if (query.bool.must.length === 0) {
      query.bool.must.push({ match_all: {} });
    }

    const searchBody = {
      query: query,
      sort: [
        { incidentDate: { order: 'desc' } }
      ],
      from: parseInt(fromOffset),
      size: parseInt(size)
    };

    const result = await elasticClient.search(indexName, searchBody);

    res.json({
      claims: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      })),
      total: result.hits.total.value,
      page: Math.floor(parseInt(fromOffset) / parseInt(size)) + 1
    });

  } catch (error) {
    logger.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

/**
 * @swagger
 * /api/claims/{id}:
 *   get:
 *     summary: Get a specific claim by ID
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Claim ID
 *     responses:
 *       200:
 *         description: Claim details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       404:
 *         description: Claim not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

    const claim = await elasticClient.getDocument(indexName, id);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({ id, ...claim });

  } catch (error) {
    logger.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

/**
 * @swagger
 * /api/claims:
 *   post:
 *     summary: Create a new claim
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Claim'
 *     responses:
 *       201:
 *         description: Claim created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', [
  body('claimId').notEmpty().withMessage('Claim ID is required'),
  body('policyNumber').notEmpty().withMessage('Policy number is required'),
  body('claimantName').notEmpty().withMessage('Claimant name is required'),
  body('claimType').isIn(['auto', 'home', 'health', 'life', 'business']).withMessage('Invalid claim type'),
  body('claimAmount').isFloat({ min: 0 }).withMessage('Claim amount must be a positive number'),
  body('incidentDate').isISO8601().withMessage('Invalid incident date'),
  body('region').notEmpty().withMessage('Region is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const claimData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      status: req.body.status || 'pending',
      channel: req.body.channel || 'online'
    };

    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

    // Check for duplicate VIN (for auto claims)
    if (claimData.claimType === 'auto' && claimData.vin) {
      const vinQuery = {
        bool: {
          must: [
            { term: { vin: claimData.vin } },
            { term: { claimType: 'auto' } }
          ]
        }
      };

      const existingClaims = await elasticClient.search(indexName, { query: vinQuery });
      
      if (existingClaims.hits.total.value > 0) {
        logger.warn(`Duplicate VIN detected: ${claimData.vin}`);
        claimData.duplicateVinFlag = true;
      }
    }

    // Index the claim
    const result = await elasticClient.client.index({
      index: indexName,
      body: claimData
    });

    // Trigger anomaly detection
    if (process.env.ELASTIC_ML_ANOMALY_DETECTION_ENABLED === 'true') {
      try {
        await mlService.detectAnomalies(claimData);
      } catch (mlError) {
        logger.error('ML anomaly detection failed:', mlError);
      }
    }

    res.status(201).json({
      id: result.body._id,
      message: 'Claim created successfully',
      claim: claimData
    });

  } catch (error) {
    logger.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

/**
 * @swagger
 * /api/claims/{id}:
 *   put:
 *     summary: Update a claim
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Claim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Claim'
 *     responses:
 *       200:
 *         description: Claim updated successfully
 *       404:
 *         description: Claim not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const result = await elasticClient.updateDocument(indexName, id, updateData);

    res.json({
      id,
      message: 'Claim updated successfully',
      claim: updateData
    });

  } catch (error) {
    logger.error('Error updating claim:', error);
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

/**
 * @swagger
 * /api/claims/anomalies:
 *   get:
 *     summary: Get claims anomalies
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region
 *       - in: query
 *         name: claimType
 *         schema:
 *           type: string
 *         description: Filter by claim type
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Anomaly detection results
 */
router.get('/anomalies', async (req, res) => {
  try {
    const { region, claimType, days = 30 } = req.query;

    // Get anomaly detection results from ML service
    const anomalies = await mlService.getAnomalies({
      region,
      claimType,
      days: parseInt(days)
    });

    res.json({
      anomalies,
      totalAnomalies: anomalies.length,
      analysisPeriod: `${days} days`
    });

  } catch (error) {
    logger.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

/**
 * @swagger
 * /api/claims/fraud-detection:
 *   get:
 *     summary: Get fraud detection results
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.8
 *         description: Fraud detection threshold
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Fraud detection results
 */
router.get('/fraud-detection', async (req, res) => {
  try {
    const { threshold = 0.8, days = 90 } = req.query;

    // Get fraud detection results from ML service
    const fraudResults = await mlService.detectFraud({
      threshold: parseFloat(threshold),
      days: parseInt(days)
    });

    res.json({
      suspiciousClaims: fraudResults.suspiciousClaims,
      totalAnalyzed: fraudResults.totalAnalyzed,
      fraudScore: fraudResults.averageFraudScore,
      patterns: fraudResults.patterns
    });

  } catch (error) {
    logger.error('Error in fraud detection:', error);
    res.status(500).json({ error: 'Failed to perform fraud detection' });
  }
});

/**
 * @swagger
 * /api/claims/analytics:
 *   get:
 *     summary: Get claims analytics
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [region, claimType, status, channel]
 *         description: Group results by field
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Claims analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { groupBy = 'region', from, to } = req.query;
    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

    // Build aggregation query
    const query = {
      bool: {
        must: []
      }
    };

    if (from || to) {
      const rangeQuery = { range: { incidentDate: {} } };
      if (from) rangeQuery.range.incidentDate.gte = from;
      if (to) rangeQuery.range.incidentDate.lte = to;
      query.bool.must.push(rangeQuery);
    }

    if (query.bool.must.length === 0) {
      query.bool.must.push({ match_all: {} });
    }

    const searchBody = {
      query: query,
      aggs: {
        group_stats: {
          terms: {
            field: `${groupBy}.keyword`,
            size: 100
          },
          aggs: {
            total_claims: {
              value_count: {
                field: "claimId"
              }
            },
            total_amount: {
              sum: {
                field: "claimAmount"
              }
            },
            avg_amount: {
              avg: {
                field: "claimAmount"
              }
            }
          }
        }
      },
      size: 0
    };

    const result = await elasticClient.search(indexName, searchBody);

    const analytics = result.aggregations.group_stats.buckets.map(bucket => ({
      group: bucket.key,
      totalClaims: bucket.total_claims.value,
      totalAmount: bucket.total_amount.value,
      averageAmount: bucket.avg_amount.value
    }));

    res.json({
      groupBy,
      analytics,
      totalGroups: analytics.length
    });

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
