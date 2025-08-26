const elasticClient = require('../backend/config/elasticsearch');
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

// Index mappings
const indexMappings = {
  claims: {
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
  },
  calls: {
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
  },
  security: {
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
  },
  weather: {
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
  },
  policies: {
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
  },
  apm: {
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
  },
  'soar-workflows': {
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
  }
};

async function setupIndices() {
  try {
    logger.info('Setting up Elastic indices...');

    // Test connection
    const isConnected = await elasticClient.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Elasticsearch');
    }

    logger.info('Connected to Elasticsearch successfully');

    const indexPrefix = process.env.ELASTIC_INDEX_PREFIX || 'chegg-demo';
    const createdIndices = [];

    // Create each index
    for (const [indexName, mapping] of Object.entries(indexMappings)) {
      const fullIndexName = `${indexPrefix}-${indexName}`;
      
      try {
        await elasticClient.createIndex(fullIndexName, mapping);
        createdIndices.push(fullIndexName);
        logger.info(`✅ Created index: ${fullIndexName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          logger.info(`ℹ️  Index already exists: ${fullIndexName}`);
        } else {
          logger.error(`❌ Failed to create index ${fullIndexName}:`, error.message);
        }
      }
    }

    // Get cluster info
    const clusterInfo = await elasticClient.getClusterInfo();
    const health = await elasticClient.healthCheck();

    logger.info('🎉 Index setup completed!');
    logger.info(`📊 Cluster: ${clusterInfo.clusterName} (${clusterInfo.version})`);
    logger.info(`🏥 Health: ${health.status}`);
    logger.info(`📁 Created/Verified indices: ${createdIndices.length}`);

    return {
      success: true,
      indices: createdIndices,
      clusterInfo,
      health
    };

  } catch (error) {
    logger.error('Error setting up indices:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupIndices()
    .then(result => {
      console.log('✅ Index setup completed successfully!');
      console.log('📁 Indices:', result.indices);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Index setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  setupIndices,
  indexMappings
};
