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
const { faker } = require('@faker-js/faker');

// Simple logger
const logger = {
  info: (message) => console.log(`ℹ️  ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  warn: (message) => console.warn(`⚠️  ${message}`)
};

// Use ELASTICSEARCH_INDEX as base index
const baseIndex = process.env.ELASTICSEARCH_INDEX || 'search-chegg';

// Sample data generators
const generateClaims = (count = 1000) => {
  const claims = [];
  const claimTypes = ['auto', 'home', 'health', 'life', 'business'];
  const regions = ['Texas', 'California', 'Florida', 'New York', 'Illinois', 'Ohio', 'Georgia', 'Pennsylvania', 'Michigan', 'North Carolina'];
  const statuses = ['pending', 'approved', 'denied', 'under_review'];
  const channels = ['phone', 'online', 'mobile', 'agent'];

  for (let i = 0; i < count; i++) {
    const claimType = faker.helpers.arrayElement(claimTypes);
    const region = faker.helpers.arrayElement(regions);
    const incidentDate = faker.date.recent({ days: 90 });
    
    const claim = {
      claimId: `CLM-${faker.number.int({ min: 100000, max: 999999 })}`,
      policyNumber: `POL-${faker.number.int({ min: 1000000, max: 9999999 })}`,
      claimantName: faker.person.fullName(),
      claimType,
      claimAmount: faker.number.float({ min: 1000, max: 100000, precision: 0.01 }),
      incidentDate: incidentDate.toISOString(),
      region,
      status: faker.helpers.arrayElement(statuses),
      description: faker.lorem.paragraph(),
      agentId: `AGENT-${faker.number.int({ min: 1000, max: 9999 })}`,
      channel: faker.helpers.arrayElement(channels),
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      updatedAt: faker.date.recent({ days: 7 }).toISOString()
    };

    // Add VIN for auto claims (with some duplicates for fraud detection demo)
    if (claimType === 'auto') {
      claim.vin = faker.helpers.arrayElement([
        '1HGBH41JXMN109186',
        '2T1BURHE0JC123456',
        '3VWDX7AJ5DM123456',
        '4T1B11HK5JU123456',
        '5NPE34AF5FH123456'
      ]);
      
      // Mark some as duplicate for fraud detection
      if (faker.number.int({ min: 1, max: 10 }) === 1) {
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
    const handleTime = faker.number.int({ min: 120, max: 1800 }); // 2-30 minutes
    const slaMet = handleTime <= 900; // 15 minutes SLA

    calls.push({
      callId: `CALL-${faker.number.int({ min: 100000, max: 999999 })}`,
      agentId: `AGENT-${faker.number.int({ min: 1000, max: 9999 })}`,
      customerId: `CUST-${faker.number.int({ min: 10000, max: 99999 })}`,
      timestamp: faker.date.recent({ days: 7 }).toISOString(),
      handleTime,
      slaMet,
      callType: faker.helpers.arrayElement(callTypes),
      satisfaction: faker.number.int({ min: 1, max: 5 })
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
      eventId: `SEC-${faker.number.int({ min: 100000, max: 999999 })}`,
      timestamp: faker.date.recent({ days: 30 }).toISOString(),
      eventType: faker.helpers.arrayElement(eventTypes),
      severity: faker.helpers.arrayElement(severities),
      sourceIp: faker.internet.ip(),
      destinationIp: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      description: faker.lorem.sentence(),
      mitreTechnique: faker.helpers.arrayElement(mitreTechniques),
      status: faker.helpers.arrayElement(['open', 'investigating', 'resolved', 'false_positive'])
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
      timestamp: faker.date.recent({ days: 30 }).toISOString(),
      location: {
        lat: faker.number.float({ min: 25, max: 49 }),
        lon: faker.number.float({ min: -125, max: -66 })
      },
      temperature: faker.number.float({ min: -10, max: 110 }),
      humidity: faker.number.float({ min: 0, max: 100 }),
      windSpeed: faker.number.float({ min: 0, max: 50 }),
      precipitation: faker.number.float({ min: 0, max: 10 }),
      conditions: faker.helpers.arrayElement(conditions),
      riskLevel: faker.helpers.arrayElement(riskLevels)
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
      policyId: `DOC-${faker.number.int({ min: 10000, max: 99999 })}`,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      documentType: faker.helpers.arrayElement(documentTypes),
      category: faker.helpers.arrayElement(categories),
      keywords: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
      createdAt: faker.date.recent({ days: 365 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString()
    });
  }

  return policies;
};

const generateAPMData = (count = 300) => {
  const apmData = [];
  const services = ['claims-api', 'policy-api', 'customer-portal', 'agent-portal', 'mobile-app'];
  const endpoints = ['/api/claims', '/api/policies', '/api/customers', '/api/agents', '/api/search'];

  for (let i = 0; i < count; i++) {
    const responseTime = faker.number.int({ min: 50, max: 2000 });
    const hasError = faker.number.int({ min: 1, max: 20 }) === 1;

    apmData.push({
      timestamp: faker.date.recent({ days: 7 }).toISOString(),
      serviceName: faker.helpers.arrayElement(services),
      endpoint: faker.helpers.arrayElement(endpoints),
      responseTime,
      pageLoadTime: faker.number.int({ min: 1000, max: 5000 }),
      hasError,
      errorType: hasError ? faker.helpers.arrayElement(['timeout', 'database', 'network', 'validation']) : null,
      satisfactionScore: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
      userId: `USER-${faker.number.int({ min: 1000, max: 9999 })}`
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

    // Get counts from environment or use defaults (reduced for testing)
    const claimsCount = parseInt(process.env.SAMPLE_CLAIMS_COUNT) || 100;
    const callsCount = parseInt(process.env.SAMPLE_CALLS_COUNT) || 50;
    const securityCount = parseInt(process.env.SAMPLE_SECURITY_EVENTS_COUNT) || 20;

    // Generate sample data
    logger.info('Generating sample data...');
    const claims = generateClaims(claimsCount);
    const calls = generateCallCenterData(callsCount);
    const securityEvents = generateSecurityEvents(securityCount);
    const weatherData = generateWeatherData(10);
    const policies = generatePolicyDocuments(5);
    const apmData = generateAPMData(30);

    // Ingest data into Elasticsearch
    logger.info('Ingesting claims data...');
    await elasticClient.bulkIndex(`${baseIndex}-claims`, claims);

    logger.info('Ingesting call center data...');
    await elasticClient.bulkIndex(`${baseIndex}-calls`, calls);

    logger.info('Ingesting security events...');
    await elasticClient.bulkIndex(`${baseIndex}-security`, securityEvents);

    logger.info('Ingesting weather data...');
    await elasticClient.bulkIndex(`${baseIndex}-weather`, weatherData);

    logger.info('Ingesting policy documents...');
    await elasticClient.bulkIndex(`${baseIndex}-policies`, policies);

    logger.info('Ingesting APM data...');
    await elasticClient.bulkIndex(`${baseIndex}-apm`, apmData);

    // Get final counts
    const claimsCountFinal = await elasticClient.countDocuments(`${baseIndex}-claims`);
    const callsCountFinal = await elasticClient.countDocuments(`${baseIndex}-calls`);
    const securityCountFinal = await elasticClient.countDocuments(`${baseIndex}-security`);

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
