const express = require('express');
const { body, validationResult } = require('express-validator');
const elasticClient = require('../config/elasticsearch');
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
 *     SecurityEvent:
 *       type: object
 *       properties:
 *         eventId:
 *           type: string
 *           description: Unique event identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Event timestamp
 *         eventType:
 *           type: string
 *           enum: [login_attempt, phishing, malware, data_access, system_alert]
 *           description: Type of security event
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Event severity level
 *         sourceIp:
 *           type: string
 *           description: Source IP address
 *         destinationIp:
 *           type: string
 *           description: Destination IP address
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         description:
 *           type: string
 *           description: Event description
 *         mitreTechnique:
 *           type: string
 *           description: MITRE ATT&CK technique
 *         status:
 *           type: string
 *           enum: [open, investigating, resolved, false_positive]
 *           description: Investigation status
 */

/**
 * @swagger
 * /api/security/events:
 *   get:
 *     summary: Get security events with filtering
 *     tags: [Security]
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity level
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
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
 *         description: List of security events
 */
router.get('/events', async (req, res) => {
  try {
    const {
      severity,
      eventType,
      from,
      to,
      size = 50,
      from: fromOffset = 0
    } = req.query;

    const indexName = `${process.env.ELASTICSEARCH_INDEX}-security`;

    const query = {
      bool: {
        must: []
      }
    };

    if (severity) {
      query.bool.must.push({ term: { severity: severity } });
    }

    if (eventType) {
      query.bool.must.push({ term: { eventType: eventType } });
    }

    if (from || to) {
      const rangeQuery = { range: { timestamp: {} } };
      if (from) rangeQuery.range.timestamp.gte = from;
      if (to) rangeQuery.range.timestamp.lte = to;
      query.bool.must.push(rangeQuery);
    }

    if (query.bool.must.length === 0) {
      query.bool.must.push({ match_all: {} });
    }

    const searchBody = {
      query: query,
      sort: [
        { timestamp: { order: 'desc' } }
      ],
      from: parseInt(fromOffset),
      size: parseInt(size)
    };

    const result = await elasticClient.search(indexName, searchBody);

    res.json({
      events: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      })),
      total: result.hits.total.value,
      page: Math.floor(parseInt(fromOffset) / parseInt(size)) + 1
    });

  } catch (error) {
    logger.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

/**
 * @swagger
 * /api/security/threats:
 *   get:
 *     summary: Get threat hunting results
 *     tags: [Security]
 *     parameters:
 *       - in: query
 *         name: technique
 *         schema:
 *           type: string
 *         description: MITRE ATT&CK technique
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Threat hunting results
 */
router.get('/threats', async (req, res) => {
  try {
    const { technique, days = 30 } = req.query;
    const indexName = `${process.env.ELASTICSEARCH_INDEX}-security`;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const query = {
      bool: {
        must: [
          {
            range: {
              timestamp: {
                gte: fromDate.toISOString()
              }
            }
          }
        ]
      }
    };

    if (technique) {
      query.bool.must.push({ term: { mitreTechnique: technique } });
    }

    const searchBody = {
      query: query,
      aggs: {
        threats_by_technique: {
          terms: {
            field: 'mitreTechnique.keyword',
            size: 20
          },
          aggs: {
            severity_distribution: {
              terms: {
                field: 'severity.keyword'
              }
            },
            event_types: {
              terms: {
                field: 'eventType.keyword'
              }
            }
          }
        },
        threats_by_severity: {
          terms: {
            field: 'severity.keyword'
          }
        },
        threats_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: '1d'
          }
        }
      },
      size: 0
    };

    const result = await elasticClient.search(indexName, searchBody);

    res.json({
      analysisPeriod: `${days} days`,
      threatsByTechnique: result.aggregations.threats_by_technique.buckets,
      threatsBySeverity: result.aggregations.threats_by_severity.buckets,
      threatsOverTime: result.aggregations.threats_over_time.buckets,
      totalThreats: result.hits.total.value
    });

  } catch (error) {
    logger.error('Error in threat hunting:', error);
    res.status(500).json({ error: 'Failed to perform threat hunting' });
  }
});

/**
 * @swagger
 * /api/security/phishing:
 *   get:
 *     summary: Get phishing detection results
 *     tags: [Security]
 *     responses:
 *       200:
 *         description: Phishing detection results
 */
router.get('/phishing', async (req, res) => {
  try {
    const indexName = `${process.env.ELASTICSEARCH_INDEX}-security`;

    const query = {
      bool: {
        must: [
          { term: { eventType: 'phishing' } },
          {
            range: {
              timestamp: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        ]
      }
    };

    const searchBody = {
      query: query,
      aggs: {
        phishing_by_severity: {
          terms: {
            field: 'severity.keyword'
          }
        },
        phishing_by_source: {
          terms: {
            field: 'sourceIp.keyword',
            size: 10
          }
        },
        phishing_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: '1h'
          }
        }
      },
      size: 0
    };

    const result = await elasticClient.search(indexName, searchBody);

    res.json({
      phishingBySeverity: result.aggregations.phishing_by_severity.buckets,
      phishingBySource: result.aggregations.phishing_by_source.buckets,
      phishingOverTime: result.aggregations.phishing_over_time.buckets,
      totalPhishingAttempts: result.hits.total.value
    });

  } catch (error) {
    logger.error('Error fetching phishing data:', error);
    res.status(500).json({ error: 'Failed to fetch phishing data' });
  }
});

/**
 * @swagger
 * /api/security/credential-stuffing:
 *   get:
 *     summary: Get credential stuffing detection results
 *     tags: [Security]
 *     responses:
 *       200:
 *         description: Credential stuffing detection results
 */
router.get('/credential-stuffing', async (req, res) => {
  try {
    const indexName = `${process.env.ELASTICSEARCH_INDEX}-security`;

    const query = {
      bool: {
        must: [
          { term: { eventType: 'login_attempt' } },
          {
            range: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        ]
      }
    };

    const searchBody = {
      query: query,
      aggs: {
        attempts_by_ip: {
          terms: {
            field: 'sourceIp.keyword',
            size: 20
          },
          aggs: {
            attempt_count: {
              value_count: {
                field: 'eventId'
              }
            }
          }
        },
        attempts_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: '1h'
          }
        }
      },
      size: 0
    };

    const result = await elasticClient.search(indexName, searchBody);

    // Filter for potential credential stuffing (high attempt counts)
    const suspiciousIPs = result.aggregations.attempts_by_ip.buckets.filter(
      bucket => bucket.attempt_count.value > 10
    );

    res.json({
      suspiciousIPs,
      attemptsOverTime: result.aggregations.attempts_over_time.buckets,
      totalAttempts: result.hits.total.value,
      potentialCredentialStuffing: suspiciousIPs.length
    });

  } catch (error) {
    logger.error('Error fetching credential stuffing data:', error);
    res.status(500).json({ error: 'Failed to fetch credential stuffing data' });
  }
});

/**
 * @swagger
 * /api/security/ransomware-triage:
 *   post:
 *     summary: Initiate ransomware triage workflow
 *     tags: [Security]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpointId:
 *                 type: string
 *                 description: Endpoint identifier
 *               alertId:
 *                 type: string
 *                 description: Alert identifier
 *               severity:
 *                 type: string
 *                 enum: [high, critical]
 *                 description: Alert severity
 *     responses:
 *       200:
 *         description: Triage workflow initiated
 */
router.post('/ransomware-triage', [
  body('endpointId').notEmpty().withMessage('Endpoint ID is required'),
  body('alertId').notEmpty().withMessage('Alert ID is required'),
  body('severity').isIn(['high', 'critical']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { endpointId, alertId, severity } = req.body;

    // Simulate SOAR workflow
    const workflow = {
      id: `triage-${Date.now()}`,
      endpointId,
      alertId,
      severity,
      status: 'initiated',
      steps: [
        {
          name: 'Isolate Endpoint',
          status: 'completed',
          timestamp: new Date().toISOString(),
          action: 'Endpoint isolated from network'
        },
        {
          name: 'Enrich Threat Intel',
          status: 'completed',
          timestamp: new Date().toISOString(),
          action: 'Threat intelligence enriched with MITRE ATT&CK data'
        },
        {
          name: 'Notify Security Team',
          status: 'completed',
          timestamp: new Date().toISOString(),
          action: 'Security team notified via Slack and email'
        },
        {
          name: 'Initiate Investigation',
          status: 'in_progress',
          timestamp: new Date().toISOString(),
          action: 'Investigation workflow started'
        }
      ],
      createdAt: new Date().toISOString()
    };

    // Store workflow in Elasticsearch
    const indexName = `${process.env.ELASTICSEARCH_INDEX}-soar-workflows`;
    await elasticClient.client.index({
      index: indexName,
      body: workflow
    });

    res.json({
      message: 'Ransomware triage workflow initiated successfully',
      workflowId: workflow.id,
      workflow
    });

  } catch (error) {
    logger.error('Error initiating ransomware triage:', error);
    res.status(500).json({ error: 'Failed to initiate triage workflow' });
  }
});

/**
 * @swagger
 * /api/security/workflows:
 *   get:
 *     summary: Get SOAR workflows
 *     tags: [Security]
 *     responses:
 *       200:
 *         description: List of SOAR workflows
 */
router.get('/workflows', async (req, res) => {
  try {
    const indexName = `${process.env.ELASTICSEARCH_INDEX}-soar-workflows`;

    const searchBody = {
      query: {
        match_all: {}
      },
      sort: [
        { createdAt: { order: 'desc' } }
      ],
      size: 50
    };

    const result = await elasticClient.search(indexName, searchBody);

    res.json({
      workflows: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      })),
      total: result.hits.total.value
    });

  } catch (error) {
    logger.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

/**
 * @swagger
 * /api/security/mitre-attack:
 *   get:
 *     summary: Get MITRE ATT&CK framework data
 *     tags: [Security]
 *     responses:
 *       200:
 *         description: MITRE ATT&CK techniques and tactics
 */
router.get('/mitre-attack', async (req, res) => {
  try {
    // Sample MITRE ATT&CK data for demo
    const mitreData = {
      tactics: [
        {
          id: 'TA0001',
          name: 'Initial Access',
          description: 'The adversary is trying to get into your network.',
          techniques: [
            {
              id: 'T1078',
              name: 'Valid Accounts',
              description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.'
            },
            {
              id: 'T1133',
              name: 'External Remote Services',
              description: 'Adversaries may leverage external-facing remote services to gain initial access into internal networks.'
            }
          ]
        },
        {
          id: 'TA0002',
          name: 'Execution',
          description: 'The adversary is trying to run malicious code.',
          techniques: [
            {
              id: 'T1059',
              name: 'Command and Scripting Interpreter',
              description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.'
            }
          ]
        }
      ],
      techniques: [
        {
          id: 'T1078',
          name: 'Valid Accounts',
          tactic: 'Initial Access',
          description: 'Adversaries may obtain and abuse credentials of existing accounts.',
          detection: 'Monitor for unusual account activity, failed login attempts, and account creation.'
        }
      ]
    };

    res.json(mitreData);

  } catch (error) {
    logger.error('Error fetching MITRE ATT&CK data:', error);
    res.status(500).json({ error: 'Failed to fetch MITRE ATT&CK data' });
  }
});

module.exports = router;
