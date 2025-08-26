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

class ElasticService {
  constructor() {
    this.initialized = false;
    this.baseIndex = process.env.ELASTICSEARCH_INDEX || 'search-chegg';
  }

  async initialize() {
    try {
      logger.info('Initializing Elastic Service...');
      
      // Create indices with mappings
      await this.createIndices();
      
      this.initialized = true;
      logger.info('Elastic Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Elastic Service:', error);
      throw error;
    }
  }

  async createIndices() {
    try {
      const indices = [
        {
          name: `${this.indexPrefix}-claims`,
          mapping: this.getClaimsMapping()
        },
        {
          name: `${this.indexPrefix}-calls`,
          mapping: this.getCallsMapping()
        },
        {
          name: `${this.indexPrefix}-security`,
          mapping: this.getSecurityMapping()
        },
        {
          name: `${this.indexPrefix}-weather`,
          mapping: this.getWeatherMapping()
        },
        {
          name: `${this.indexPrefix}-policies`,
          mapping: this.getPoliciesMapping()
        },
        {
          name: `${this.indexPrefix}-apm`,
          mapping: this.getAPMMapping()
        },
        {
          name: `${this.indexPrefix}-soar-workflows`,
          mapping: this.getWorkflowMapping()
        }
      ];

      for (const index of indices) {
        await elasticClient.createIndex(index.name, index.mapping);
      }

      logger.info('All indices created successfully');
    } catch (error) {
      logger.error('Error creating indices:', error);
      throw error;
    }
  }

  getClaimsMapping() {
    return {
      properties: {
        claimId: { type: 'keyword' },
        policyNumber: { type: 'keyword' },
        claimantName: { type: 'text' },
        claimType: { type: 'keyword' },
        claimAmount: { type: 'float' },
        incidentDate: { type: 'date' },
        region: { type: 'keyword' },
        status: { type: 'keyword' },
        description: { type: 'text' },
        vin: { type: 'keyword' },
        agentId: { type: 'keyword' },
        channel: { type: 'keyword' },
        duplicateVinFlag: { type: 'boolean' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    };
  }

  getCallsMapping() {
    return {
      properties: {
        callId: { type: 'keyword' },
        agentId: { type: 'keyword' },
        customerId: { type: 'keyword' },
        timestamp: { type: 'date' },
        handleTime: { type: 'integer' },
        slaMet: { type: 'boolean' },
        callType: { type: 'keyword' },
        satisfaction: { type: 'integer' }
      }
    };
  }

  getSecurityMapping() {
    return {
      properties: {
        eventId: { type: 'keyword' },
        timestamp: { type: 'date' },
        eventType: { type: 'keyword' },
        severity: { type: 'keyword' },
        sourceIp: { type: 'ip' },
        destinationIp: { type: 'ip' },
        userAgent: { type: 'text' },
        description: { type: 'text' },
        mitreTechnique: { type: 'keyword' },
        status: { type: 'keyword' }
      }
    };
  }

  getWeatherMapping() {
    return {
      properties: {
        timestamp: { type: 'date' },
        location: { type: 'geo_point' },
        temperature: { type: 'float' },
        humidity: { type: 'float' },
        windSpeed: { type: 'float' },
        precipitation: { type: 'float' },
        conditions: { type: 'keyword' },
        riskLevel: { type: 'keyword' }
      }
    };
  }

  getPoliciesMapping() {
    return {
      properties: {
        policyId: { type: 'keyword' },
        title: { type: 'text' },
        content: { type: 'text' },
        documentType: { type: 'keyword' },
        category: { type: 'keyword' },
        keywords: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    };
  }

  getAPMMapping() {
    return {
      properties: {
        timestamp: { type: 'date' },
        serviceName: { type: 'keyword' },
        endpoint: { type: 'keyword' },
        responseTime: { type: 'integer' },
        pageLoadTime: { type: 'integer' },
        hasError: { type: 'boolean' },
        errorType: { type: 'keyword' },
        satisfactionScore: { type: 'float' },
        userId: { type: 'keyword' }
      }
    };
  }

  getWorkflowMapping() {
    return {
      properties: {
        id: { type: 'keyword' },
        endpointId: { type: 'keyword' },
        alertId: { type: 'keyword' },
        severity: { type: 'keyword' },
        status: { type: 'keyword' },
        steps: {
          type: 'nested',
          properties: {
            name: { type: 'keyword' },
            status: { type: 'keyword' },
            timestamp: { type: 'date' },
            action: { type: 'text' }
          }
        },
        createdAt: { type: 'date' }
      }
    };
  }

  async getServiceStatus() {
    try {
      const health = await elasticClient.healthCheck();
      const clusterInfo = await elasticClient.getClusterInfo();
      
      return {
        initialized: this.initialized,
        clusterHealth: health,
        clusterInfo,
        indices: await this.getIndexStats()
      };
    } catch (error) {
      logger.error('Error getting Elastic service status:', error);
      throw error;
    }
  }

  async getIndexStats() {
    try {
      const stats = await elasticClient.getIndexStats(`${this.indexPrefix}-*`);
      return Object.keys(stats.indices).map(indexName => ({
        name: indexName,
        documentCount: stats.indices[indexName].total.docs.count,
        storageSize: stats.indices[indexName].total.store.size_in_bytes
      }));
    } catch (error) {
      logger.error('Error getting index stats:', error);
      return [];
    }
  }
}

module.exports = new ElasticService();
