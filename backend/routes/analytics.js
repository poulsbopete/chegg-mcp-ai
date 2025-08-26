const express = require('express');
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
 * /api/analytics/call-center:
 *   get:
 *     summary: Get call center analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Call center KPIs and metrics
 */
router.get('/call-center', async (req, res) => {
  try {
    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-calls`;

    const searchBody = {
      query: {
        range: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        }
      },
      aggs: {
        total_calls: {
          value_count: {
            field: 'callId'
          }
        },
        avg_handle_time: {
          avg: {
            field: 'handleTime'
          }
        },
        sla_adherence: {
          terms: {
            field: 'slaMet.keyword'
          }
        },
        agent_performance: {
          terms: {
            field: 'agentId.keyword',
            size: 20
          },
          aggs: {
            avg_handle_time: {
              avg: {
                field: 'handleTime'
              }
            },
            total_calls: {
              value_count: {
                field: 'callId'
              }
            }
          }
        },
        calls_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: '1h'
          }
        }
      },
      size: 0
    };

    const result = await elasticClient.search(indexName, searchBody);

    const slaMet = result.aggregations.sla_adherence.buckets.find(b => b.key === true);
    const slaNotMet = result.aggregations.sla_adherence.buckets.find(b => b.key === false);
    const slaAdherenceRate = slaMet && slaNotMet 
      ? (slaMet.doc_count / (slaMet.doc_count + slaNotMet.doc_count)) * 100 
      : 100;

    res.json({
      totalCalls: result.aggregations.total_calls.value,
      averageHandleTime: Math.round(result.aggregations.avg_handle_time.value || 0),
      slaAdherenceRate: Math.round(slaAdherenceRate),
      agentPerformance: result.aggregations.agent_performance.buckets.map(bucket => ({
        agentId: bucket.key,
        totalCalls: bucket.total_calls.value,
        averageHandleTime: Math.round(bucket.avg_handle_time.value || 0)
      })),
      callsOverTime: result.aggregations.calls_over_time.buckets
    });

  } catch (error) {
    logger.error('Error fetching call center analytics:', error);
    res.status(500).json({ error: 'Failed to fetch call center analytics' });
  }
});

/**
 * @swagger
 * /api/analytics/digital-experience:
 *   get:
 *     summary: Get digital experience metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Digital experience KPIs
 */
router.get('/digital-experience', async (req, res) => {
  try {
    const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-apm`;

    const searchBody = {
      query: {
        range: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        }
      },
      aggs: {
        avg_response_time: {
          avg: {
            field: 'responseTime'
          }
        },
        error_rate: {
          terms: {
            field: 'hasError.keyword'
          }
        },
        page_load_times: {
          avg: {
            field: 'pageLoadTime'
          }
        },
        user_satisfaction: {
          avg: {
            field: 'satisfactionScore'
          }
        },
        errors_by_type: {
          terms: {
            field: 'errorType.keyword',
            size: 10
          }
        },
        performance_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: '1h'
          },
          aggs: {
            avg_response_time: {
              avg: {
                field: 'responseTime'
              }
            },
            error_count: {
              value_count: {
                field: 'hasError'
              }
            }
          }
        }
      },
      size: 0
    };

    const result = await elasticClient.search(indexName, searchBody);

    const errorCount = result.aggregations.error_rate.buckets.find(b => b.key === true);
    const totalRequests = result.aggregations.error_rate.buckets.reduce((sum, b) => sum + b.doc_count, 0);
    const errorRate = totalRequests > 0 ? (errorCount?.doc_count || 0) / totalRequests * 100 : 0;

    res.json({
      averageResponseTime: Math.round(result.aggregations.avg_response_time.value || 0),
      errorRate: Math.round(errorRate * 100) / 100,
      averagePageLoadTime: Math.round(result.aggregations.page_load_times.value || 0),
      userSatisfaction: Math.round((result.aggregations.user_satisfaction.value || 0) * 100) / 100,
      errorsByType: result.aggregations.errors_by_type.buckets,
      performanceOverTime: result.aggregations.performance_over_time.buckets
    });

  } catch (error) {
    logger.error('Error fetching digital experience analytics:', error);
    res.status(500).json({ error: 'Failed to fetch digital experience analytics' });
  }
});

module.exports = router;
