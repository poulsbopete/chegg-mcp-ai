const elasticClient = require('../backend/config/elasticsearch');
const faker = require('faker');
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

// Sample data generators
const generateClaims = (count = 1000) => {
  const claims = [];
  const claimTypes = ['auto', 'home', 'health', 'life', 'business'];
  const regions = ['Texas', 'California', 'Florida', 'New York', 'Illinois', 'Ohio', 'Georgia', 'Pennsylvania', 'Michigan', 'North Carolina'];
  const statuses = ['pending', 'approved', 'denied', 'under_review'];
  const channels = ['phone', 'online', 'mobile', 'agent'];

  for (let i = 0; i < count; i++) {
    const claimType = faker.random.arrayElement(claimTypes);
    const region = faker.random.arrayElement(regions);
    const incidentDate = faker.date.recent(90);
    
    const claim = {
      claimId: `CLM-${faker.datatype.number({ min: 100000, max: 999999 })}`,
      policyNumber: `POL-${faker.datatype.number({ min: 1000000, max: 9999999 })}`,
      claimantName: faker.name.findName(),
      claimType,
      claimAmount: faker.datatype.float({ min: 1000, max: 100000, precision: 0.01 }),
      incidentDate: incidentDate.toISOString(),
      region,
      status: faker.random.arrayElement(statuses),
      description: faker.lorem.paragraph(),
      agentId: `AGENT-${faker.datatype.number({ min: 1000, max: 9999 })}`,
      channel: faker.random.arrayElement(channels),
      createdAt: faker.date.recent(30).toISOString(),
      updatedAt: faker.date.recent(7).toISOString()
    };

    // Add VIN for auto claims (with some duplicates for fraud detection demo)
    if (claimType === 'auto') {
      claim.vin = faker.random.arrayElement([
        '1HGBH41JXMN109186',
        '2T1BURHE0JC123456',
        '3VWDX7AJ5DM123456',
        '4T1B11HK5JU123456',
        '5NPE34AF5FH123456'
      ]);
      
      // Mark some as duplicate for fraud detection
      if (faker.datatype.number({ min: 1, max: 10 }) === 1) {
        claim.duplicateVinFlag = true;
      }
    }

    claims.push(claim);
  }

  return claims;
};

const generateCallCenterData = (count = 500) => {
  const calls = [];
  const callTypes = ['claims', 'billing', 'policy', 'support', 'sales'];

  for (let i = 0; i < count; i++) {
    const handleTime = faker.datatype.number({ min: 120, max: 1800 }); // 2-30 minutes
    const slaMet = handleTime <= 900; // 15 minutes SLA

    calls.push({
      callId: `CALL-${faker.datatype.number({ min: 100000, max: 999999 })}`,
      agentId: `AGENT-${faker.datatype.number({ min: 1000, max: 9999 })}`,
      customerId: `CUST-${faker.datatype.number({ min: 10000, max: 99999 })}`,
      timestamp: faker.date.recent(7).toISOString(),
      handleTime,
      slaMet,
      callType: faker.random.arrayElement(callTypes),
      satisfaction: faker.datatype.number({ min: 1, max: 5 })
    });
  }

  return calls;
};

const generateSecurityEvents = (count = 200) => {
  const events = [];
  const eventTypes = ['login_attempt', 'phishing', 'malware', 'data_access', 'system_alert'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const mitreTechniques = ['T1078', 'T1133', 'T1059', 'T1071', 'T1040'];

  for (let i = 0; i < count; i++) {
    events.push({
      eventId: `SEC-${faker.datatype.number({ min: 100000, max: 999999 })}`,
      timestamp: faker.date.recent(30).toISOString(),
      eventType: faker.random.arrayElement(eventTypes),
      severity: faker.random.arrayElement(severities),
      sourceIp: faker.internet.ip(),
      destinationIp: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      description: faker.lorem.sentence(),
      mitreTechnique: faker.random.arrayElement(mitreTechniques),
      status: faker.random.arrayElement(['open', 'investigating', 'resolved', 'false_positive'])
    });
  }

  return events;
};

const generateWeatherData = (count = 100) => {
  const weatherData = [];
  const conditions = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];

  for (let i = 0; i < count; i++) {
    weatherData.push({
      timestamp: faker.date.recent(30).toISOString(),
      location: {
        lat: faker.datatype.float({ min: 25, max: 49 }),
        lon: faker.datatype.float({ min: -125, max: -66 })
      },
      temperature: faker.datatype.float({ min: -10, max: 110 }),
      humidity: faker.datatype.float({ min: 0, max: 100 }),
      windSpeed: faker.datatype.float({ min: 0, max: 50 }),
      precipitation: faker.datatype.float({ min: 0, max: 10 }),
      conditions: faker.random.arrayElement(conditions),
      riskLevel: faker.random.arrayElement(riskLevels)
    });
  }

  return weatherData;
};

const generatePolicyDocuments = (count = 50) => {
  const policies = [];
  const documentTypes = ['policy', 'procedure', 'manual', 'guideline', 'regulation'];
  const categories = ['auto', 'home', 'health', 'life', 'business', 'general'];

  for (let i = 0; i < count; i++) {
    policies.push({
      policyId: `DOC-${faker.datatype.number({ min: 10000, max: 99999 })}`,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      documentType: faker.random.arrayElement(documentTypes),
      category: faker.random.arrayElement(categories),
      keywords: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
      createdAt: faker.date.recent(365).toISOString(),
      updatedAt: faker.date.recent(30).toISOString()
    });
  }

  return policies;
};

const generateAPMData = (count = 300) => {
  const apmData = [];
  const services = ['claims-api', 'policy-api', 'customer-portal', 'agent-portal', 'mobile-app'];
  const endpoints = ['/api/claims', '/api/policies', '/api/customers', '/api/agents', '/api/search'];

  for (let i = 0; i < count; i++) {
    const responseTime = faker.datatype.number({ min: 50, max: 2000 });
    const hasError = faker.datatype.number({ min: 1, max: 20 }) === 1;

    apmData.push({
      timestamp: faker.date.recent(7).toISOString(),
      serviceName: faker.random.arrayElement(services),
      endpoint: faker.random.arrayElement(endpoints),
      responseTime,
      pageLoadTime: faker.datatype.number({ min: 1000, max: 5000 }),
      hasError,
      errorType: hasError ? faker.random.arrayElement(['timeout', 'database', 'network', 'validation']) : null,
      satisfactionScore: faker.datatype.float({ min: 1, max: 5, precision: 0.1 }),
      userId: `USER-${faker.datatype.number({ min: 1000, max: 9999 })}`
    });
  }

  return apmData;
};

// Main ingestion function
async function ingestSampleData() {
  try {
    logger.info('Starting sample data ingestion...');

    // Test connection
    const isConnected = await elasticClient.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Elasticsearch');
    }

    logger.info('Connected to Elasticsearch successfully');

    // Get counts from environment or use defaults
    const claimsCount = parseInt(process.env.SAMPLE_CLAIMS_COUNT) || 1000;
    const callsCount = parseInt(process.env.SAMPLE_CALLS_COUNT) || 500;
    const securityCount = parseInt(process.env.SAMPLE_SECURITY_EVENTS_COUNT) || 200;

    // Generate sample data
    logger.info('Generating sample data...');
    const claims = generateClaims(claimsCount);
    const calls = generateCallCenterData(callsCount);
    const securityEvents = generateSecurityEvents(securityCount);
    const weatherData = generateWeatherData(100);
    const policies = generatePolicyDocuments(50);
    const apmData = generateAPMData(300);

    // Ingest data into Elasticsearch
    logger.info('Ingesting claims data...');
    await elasticClient.bulkIndex(`${process.env.ELASTIC_INDEX_PREFIX}-claims`, claims);

    logger.info('Ingesting call center data...');
    await elasticClient.bulkIndex(`${process.env.ELASTIC_INDEX_PREFIX}-calls`, calls);

    logger.info('Ingesting security events...');
    await elasticClient.bulkIndex(`${process.env.ELASTIC_INDEX_PREFIX}-security`, securityEvents);

    logger.info('Ingesting weather data...');
    await elasticClient.bulkIndex(`${process.env.ELASTIC_INDEX_PREFIX}-weather`, weatherData);

    logger.info('Ingesting policy documents...');
    await elasticClient.bulkIndex(`${process.env.ELASTIC_INDEX_PREFIX}-policies`, policies);

    logger.info('Ingesting APM data...');
    await elasticClient.bulkIndex(`${process.env.ELASTIC_INDEX_PREFIX}-apm`, apmData);

    // Get final counts
    const claimsCountFinal = await elasticClient.countDocuments(`${process.env.ELASTIC_INDEX_PREFIX}-claims`);
    const callsCountFinal = await elasticClient.countDocuments(`${process.env.ELASTIC_INDEX_PREFIX}-calls`);
    const securityCountFinal = await elasticClient.countDocuments(`${process.env.ELASTIC_INDEX_PREFIX}-security`);

    logger.info('Sample data ingestion completed successfully!');
    logger.info(`Final document counts:`);
    logger.info(`- Claims: ${claimsCountFinal}`);
    logger.info(`- Calls: ${callsCountFinal}`);
    logger.info(`- Security Events: ${securityCountFinal}`);
    logger.info(`- Weather Data: ${weatherData.length}`);
    logger.info(`- Policy Documents: ${policies.length}`);
    logger.info(`- APM Data: ${apmData.length}`);

    return {
      success: true,
      counts: {
        claims: claimsCountFinal,
        calls: callsCountFinal,
        security: securityCountFinal,
        weather: weatherData.length,
        policies: policies.length,
        apm: apmData.length
      }
    };

  } catch (error) {
    logger.error('Error during sample data ingestion:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ingestSampleData()
    .then(result => {
      console.log('✅ Sample data ingestion completed successfully!');
      console.log('📊 Document counts:', result.counts);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Sample data ingestion failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  ingestSampleData,
  generateClaims,
  generateCallCenterData,
  generateSecurityEvents,
  generateWeatherData,
  generatePolicyDocuments,
  generateAPMData
};
