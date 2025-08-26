// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Set environment variables
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key];
});

const elasticClient = require('../backend/config/elasticsearch');

// Simple logger
const logger = {
  info: (message) => console.log(`ℹ️  ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  warn: (message) => console.warn(`⚠️  ${message}`)
};

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

    const baseIndex = process.env.ELASTICSEARCH_INDEX || 'search-chegg';
    const createdIndices = [];

    // Create each index with simplified approach
    for (const [indexName, mapping] of Object.entries(indexMappings)) {
      const fullIndexName = `${baseIndex}-${indexName}`;
      
      try {
        // Use direct client call for better compatibility
        await elasticClient.client.indices.create({
          index: fullIndexName,
          body: {
            mappings: mapping
          }
        });
        createdIndices.push(fullIndexName);
        logger.info(`✅ Created index: ${fullIndexName}`);
              } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('resource_already_exists_exception')) {
            logger.info(`ℹ️  Index already exists: ${fullIndexName}`);
            createdIndices.push(fullIndexName);
          } else {
            logger.error(`❌ Failed to create index ${fullIndexName}:`, error.message);
            logger.error(`Error details:`, error);
          }
        }
    }

    logger.info('🎉 Index setup completed!');
    logger.info(`📁 Created/Verified indices: ${createdIndices.length}`);
    logger.info(`📋 Indices: ${createdIndices.join(', ')}`);

    return {
      success: true,
      indices: createdIndices
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
