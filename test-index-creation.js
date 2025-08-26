// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
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

const { Client } = require('@elastic/elasticsearch');

const host = process.env.ELASTICSEARCH_HOST;
const port = process.env.ELASTICSEARCH_PORT || 443;
const nodeUrl = host.startsWith('http') ? `${host}:${port}` : `https://${host}:${port}`;

console.log('Node URL:', nodeUrl);
console.log('API Key length:', process.env.ELASTICSEARCH_API_KEY?.length || 0);

const client = new Client({
  node: nodeUrl,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY,
  },
  requestTimeout: 30000,
  maxRetries: 3,
  retryOnTimeout: true,
  ssl: {
    rejectUnauthorized: true,
  },
});

async function testIndexCreation() {
  try {
    console.log('Testing connection...');
    await client.ping();
    console.log('✅ Connected successfully!');

    const baseIndex = process.env.ELASTICSEARCH_INDEX || 'search-chegg';
    const testIndexName = `${baseIndex}-test`;

    console.log(`Creating test index: ${testIndexName}`);

    const result = await client.indices.create({
      index: testIndexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            test_field: {
              type: 'text'
            }
          }
        }
      }
    });

    console.log('✅ Index created successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

    // Clean up - delete the test index
    await client.indices.delete({ index: testIndexName });
    console.log('✅ Test index deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testIndexCreation();
