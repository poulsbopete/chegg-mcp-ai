const elasticClient = require('../config/elasticsearch');
const winston = require('winston');

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

class MLService {
  constructor() {
    this.initialized = false;
    this.anomalyJobs = new Map();
    this.fraudModels = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing ML Service...');
      
      // Initialize anomaly detection jobs
      await this.setupAnomalyDetectionJobs();
      
      // Initialize fraud detection models
      await this.setupFraudDetectionModels();
      
      this.initialized = true;
      logger.info('ML Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ML Service:', error);
      throw error;
    }
  }

  async setupAnomalyDetectionJobs() {
    try {
      const jobs = [
        {
          id: 'claims-amount-anomaly',
          description: 'Detect anomalies in claim amounts by region and type',
          config: {
            analysis_config: {
              bucket_span: '1h',
              detectors: [
                {
                  function: 'high_mean',
                  field_name: 'claimAmount',
                  partition_field_name: 'region'
                },
                {
                  function: 'high_mean',
                  field_name: 'claimAmount',
                  partition_field_name: 'claimType'
                }
              ]
            },
            data_description: {
              time_field: 'incidentDate',
              time_format: 'epoch_ms'
            }
          }
        },
        {
          id: 'claims-frequency-anomaly',
          description: 'Detect unusual spikes in claim frequency',
          config: {
            analysis_config: {
              bucket_span: '1h',
              detectors: [
                {
                  function: 'count',
                  partition_field_name: 'region'
                },
                {
                  function: 'count',
                  partition_field_name: 'claimType'
                }
              ]
            },
            data_description: {
              time_field: 'incidentDate',
              time_format: 'epoch_ms'
            }
          }
        }
      ];

      for (const job of jobs) {
        await this.createAnomalyJob(job);
      }

      logger.info('Anomaly detection jobs setup completed');
    } catch (error) {
      logger.error('Failed to setup anomaly detection jobs:', error);
      throw error;
    }
  }

  async setupFraudDetectionModels() {
    try {
      const models = [
        {
          id: 'duplicate-vin-detector',
          description: 'Detect duplicate VIN patterns',
          type: 'rule_based'
        },
        {
          id: 'repeated-claimant-detector',
          description: 'Detect claimants with multiple claims',
          type: 'rule_based'
        },
        {
          id: 'abnormal-loss-pattern-detector',
          description: 'Detect abnormal loss patterns',
          type: 'ml_based'
        }
      ];

      for (const model of models) {
        await this.createFraudModel(model);
      }

      logger.info('Fraud detection models setup completed');
    } catch (error) {
      logger.error('Failed to setup fraud detection models:', error);
      throw error;
    }
  }

  async createAnomalyJob(jobConfig) {
    try {
      const jobId = jobConfig.id;
      
      // Check if job already exists
      try {
        await elasticClient.client.ml.getJobs({ job_id: jobId });
        logger.info(`Anomaly job ${jobId} already exists`);
        this.anomalyJobs.set(jobId, jobConfig);
        return;
      } catch (error) {
        // Job doesn't exist, create it
      }

      // Create the job
      const response = await elasticClient.client.ml.putJob({
        job_id: jobId,
        body: jobConfig.config
      });

      // Start the job
      await elasticClient.client.ml.openJob({ job_id: jobId });
      
      this.anomalyJobs.set(jobId, jobConfig);
      logger.info(`Created and started anomaly job: ${jobId}`);
      
      return response;
    } catch (error) {
      logger.error(`Failed to create anomaly job ${jobConfig.id}:`, error);
      throw error;
    }
  }

  async createFraudModel(modelConfig) {
    try {
      const modelId = modelConfig.id;
      
      // For demo purposes, we'll create simple rule-based models
      // In production, you'd integrate with actual ML model deployment
      
      this.fraudModels.set(modelId, {
        ...modelConfig,
        rules: this.getFraudRules(modelId),
        threshold: 0.8
      });

      logger.info(`Created fraud model: ${modelId}`);
    } catch (error) {
      logger.error(`Failed to create fraud model ${modelConfig.id}:`, error);
      throw error;
    }
  }

  getFraudRules(modelId) {
    const rules = {
      'duplicate-vin-detector': [
        {
          name: 'Multiple claims with same VIN',
          condition: 'vin_count > 1',
          weight: 0.9
        },
        {
          name: 'VIN in short time period',
          condition: 'time_between_claims < 30_days',
          weight: 0.8
        }
      ],
      'repeated-claimant-detector': [
        {
          name: 'Multiple claims by same claimant',
          condition: 'claimant_claim_count > 3',
          weight: 0.7
        },
        {
          name: 'Claims in different regions',
          condition: 'unique_regions > 2',
          weight: 0.8
        }
      ],
      'abnormal-loss-pattern-detector': [
        {
          name: 'Unusual claim amount',
          condition: 'amount > 3 * avg_amount',
          weight: 0.6
        },
        {
          name: 'Claims on weekends/holidays',
          condition: 'incident_day_type in ["weekend", "holiday"]',
          weight: 0.5
        }
      ]
    };

    return rules[modelId] || [];
  }

  async detectAnomalies(claimData) {
    try {
      if (!this.initialized) {
        throw new Error('ML Service not initialized');
      }

      // Index the claim data for anomaly detection
      const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;
      await elasticClient.client.index({
        index: indexName,
        body: claimData
      });

      // Trigger anomaly detection for all active jobs
      const results = [];
      
      for (const [jobId, jobConfig] of this.anomalyJobs) {
        try {
          const anomalies = await this.getAnomalyResults(jobId, claimData);
          results.push({
            jobId,
            jobDescription: jobConfig.description,
            anomalies
          });
        } catch (error) {
          logger.error(`Failed to get anomalies for job ${jobId}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      throw error;
    }
  }

  async getAnomalyResults(jobId, filters = {}) {
    try {
      const query = {
        bool: {
          must: [
            { term: { job_id: jobId } }
          ]
        }
      };

      // Add time filter
      if (filters.days) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - filters.days);
        
        query.bool.must.push({
          range: {
            timestamp: {
              gte: fromDate.getTime()
            }
          }
        });
      }

      // Add region filter
      if (filters.region) {
        query.bool.must.push({
          term: { 'partition_field_value': filters.region }
        });
      }

      // Add claim type filter
      if (filters.claimType) {
        query.bool.must.push({
          term: { 'partition_field_value': filters.claimType }
        });
      }

      const searchBody = {
        query: query,
        sort: [
          { timestamp: { order: 'desc' } }
        ],
        size: 100
      };

      const indexName = '.ml-anomalies-*';
      const result = await elasticClient.search(indexName, searchBody);

      return result.hits.hits.map(hit => ({
        id: hit._id,
        timestamp: hit._source.timestamp,
        score: hit._source.anomaly_score,
        bucketSpan: hit._source.bucket_span,
        partitionFieldValue: hit._source.partition_field_value,
        detectorIndex: hit._source.detector_index
      }));
    } catch (error) {
      logger.error(`Error getting anomaly results for job ${jobId}:`, error);
      throw error;
    }
  }

  async getAnomalies(filters = {}) {
    try {
      const allAnomalies = [];
      
      for (const [jobId, jobConfig] of this.anomalyJobs) {
        const anomalies = await this.getAnomalyResults(jobId, filters);
        allAnomalies.push(...anomalies.map(anomaly => ({
          ...anomaly,
          jobId,
          jobDescription: jobConfig.description
        })));
      }

      // Sort by anomaly score (highest first)
      return allAnomalies.sort((a, b) => b.score - a.score);
    } catch (error) {
      logger.error('Error getting anomalies:', error);
      throw error;
    }
  }

  async detectFraud(options = {}) {
    try {
      const { threshold = 0.8, days = 90 } = options;
      const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

      // Get claims data for analysis
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const query = {
        bool: {
          must: [
            {
              range: {
                incidentDate: {
                  gte: fromDate.toISOString()
                }
              }
            }
          ]
        }
      };

      const searchBody = {
        query: query,
        size: 10000
      };

      const result = await elasticClient.search(indexName, searchBody);
      const claims = result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      }));

      // Apply fraud detection rules
      const suspiciousClaims = [];
      const patterns = [];

      for (const [modelId, model] of this.fraudModels) {
        const modelResults = await this.applyFraudModel(model, claims, threshold);
        suspiciousClaims.push(...modelResults.suspiciousClaims);
        patterns.push(...modelResults.patterns);
      }

      // Calculate overall fraud score
      const totalAnalyzed = claims.length;
      const averageFraudScore = suspiciousClaims.length > 0 
        ? suspiciousClaims.reduce((sum, claim) => sum + claim.fraudScore, 0) / suspiciousClaims.length
        : 0;

      return {
        suspiciousClaims,
        totalAnalyzed,
        averageFraudScore,
        patterns
      };
    } catch (error) {
      logger.error('Error in fraud detection:', error);
      throw error;
    }
  }

  async applyFraudModel(model, claims, threshold) {
    const suspiciousClaims = [];
    const patterns = [];

    try {
      switch (model.id) {
        case 'duplicate-vin-detector':
          const vinResults = this.detectDuplicateVINs(claims);
          suspiciousClaims.push(...vinResults.suspiciousClaims);
          patterns.push(...vinResults.patterns);
          break;

        case 'repeated-claimant-detector':
          const claimantResults = this.detectRepeatedClaimants(claims);
          suspiciousClaims.push(...claimantResults.suspiciousClaims);
          patterns.push(...claimantResults.patterns);
          break;

        case 'abnormal-loss-pattern-detector':
          const patternResults = this.detectAbnormalPatterns(claims);
          suspiciousClaims.push(...patternResults.suspiciousClaims);
          patterns.push(...patternResults.patterns);
          break;
      }

      return { suspiciousClaims, patterns };
    } catch (error) {
      logger.error(`Error applying fraud model ${model.id}:`, error);
      return { suspiciousClaims: [], patterns: [] };
    }
  }

  detectDuplicateVINs(claims) {
    const suspiciousClaims = [];
    const patterns = [];
    const vinMap = new Map();

    // Group claims by VIN
    claims.forEach(claim => {
      if (claim.vin) {
        if (!vinMap.has(claim.vin)) {
          vinMap.set(claim.vin, []);
        }
        vinMap.get(claim.vin).push(claim);
      }
    });

    // Check for duplicate VINs
    for (const [vin, vinClaims] of vinMap) {
      if (vinClaims.length > 1) {
        const fraudScore = Math.min(0.9, 0.5 + (vinClaims.length - 1) * 0.2);
        
        vinClaims.forEach(claim => {
          suspiciousClaims.push({
            ...claim,
            fraudScore,
            fraudReason: `Duplicate VIN detected (${vinClaims.length} claims)`,
            modelId: 'duplicate-vin-detector'
          });
        });

        patterns.push({
          type: 'duplicate_vin',
          vin,
          claimCount: vinClaims.length,
          totalAmount: vinClaims.reduce((sum, c) => sum + c.claimAmount, 0),
          timeSpan: this.calculateTimeSpan(vinClaims)
        });
      }
    }

    return { suspiciousClaims, patterns };
  }

  detectRepeatedClaimants(claims) {
    const suspiciousClaims = [];
    const patterns = [];
    const claimantMap = new Map();

    // Group claims by claimant
    claims.forEach(claim => {
      if (claim.claimantName) {
        if (!claimantMap.has(claim.claimantName)) {
          claimantMap.set(claim.claimantName, []);
        }
        claimantMap.get(claim.claimantName).push(claim);
      }
    });

    // Check for repeated claimants
    for (const [claimant, claimantClaims] of claimantMap) {
      if (claimantClaims.length > 3) {
        const regions = [...new Set(claimantClaims.map(c => c.region))];
        const fraudScore = Math.min(0.9, 0.4 + (claimantClaims.length - 3) * 0.1 + (regions.length - 1) * 0.2);
        
        claimantClaims.forEach(claim => {
          suspiciousClaims.push({
            ...claim,
            fraudScore,
            fraudReason: `Repeated claimant (${claimantClaims.length} claims, ${regions.length} regions)`,
            modelId: 'repeated-claimant-detector'
          });
        });

        patterns.push({
          type: 'repeated_claimant',
          claimant: claimant,
          claimCount: claimantClaims.length,
          regions: regions,
          totalAmount: claimantClaims.reduce((sum, c) => sum + c.claimAmount, 0)
        });
      }
    }

    return { suspiciousClaims, patterns };
  }

  detectAbnormalPatterns(claims) {
    const suspiciousClaims = [];
    const patterns = [];

    // Calculate average claim amount
    const totalAmount = claims.reduce((sum, claim) => sum + claim.claimAmount, 0);
    const avgAmount = totalAmount / claims.length;

    // Check for unusual claim amounts
    claims.forEach(claim => {
      let fraudScore = 0;
      let reasons = [];

      // Check for unusually high amounts
      if (claim.claimAmount > avgAmount * 3) {
        fraudScore += 0.3;
        reasons.push('Unusually high claim amount');
      }

      // Check for claims on weekends
      const incidentDate = new Date(claim.incidentDate);
      const dayOfWeek = incidentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        fraudScore += 0.2;
        reasons.push('Claim filed on weekend');
      }

      // Check for claims filed late at night
      const hour = incidentDate.getHours();
      if (hour >= 22 || hour <= 6) {
        fraudScore += 0.1;
        reasons.push('Claim filed late at night');
      }

      if (fraudScore > 0) {
        suspiciousClaims.push({
          ...claim,
          fraudScore: Math.min(0.9, fraudScore),
          fraudReason: reasons.join(', '),
          modelId: 'abnormal-loss-pattern-detector'
        });
      }
    });

    return { suspiciousClaims, patterns };
  }

  calculateTimeSpan(claims) {
    if (claims.length < 2) return 0;
    
    const dates = claims.map(c => new Date(c.incidentDate)).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    return Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
  }

  async getModelStatus() {
    try {
      const status = {
        initialized: this.initialized,
        anomalyJobs: Array.from(this.anomalyJobs.keys()),
        fraudModels: Array.from(this.fraudModels.keys()),
        totalJobs: this.anomalyJobs.size,
        totalModels: this.fraudModels.size
      };

      return status;
    } catch (error) {
      logger.error('Error getting model status:', error);
      throw error;
    }
  }
}

module.exports = new MLService();
