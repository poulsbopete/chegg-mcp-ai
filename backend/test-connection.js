require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

console.log('Environment variables:');
console.log('ELASTICSEARCH_HOST:', process.env.ELASTICSEARCH_HOST);
console.log('ELASTICSEARCH_PORT:', process.env.ELASTICSEARCH_PORT);
console.log('ELASTICSEARCH_API_KEY length:', process.env.ELASTICSEARCH_API_KEY?.length || 0);

if (!process.env.ELASTICSEARCH_HOST) {
  console.error('❌ ELASTICSEARCH_HOST not set');
  process.exit(1);
}

if (!process.env.ELASTICSEARCH_API_KEY) {
  console.error('❌ ELASTICSEARCH_API_KEY not set');
  process.exit(1);
}

const host = process.env.ELASTICSEARCH_HOST;
const port = process.env.ELASTICSEARCH_PORT || 443;
const nodeUrl = host.startsWith('http') ? `${host}:${port}` : `https://${host}:${port}`;

console.log('Node URL:', nodeUrl);

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

console.log('Testing connection...');

client.ping()
  .then(() => {
    console.log('✅ Connected to Elasticsearch successfully!');
    return client.info();
  })
  .then((info) => {
    console.log('Cluster info:', {
      clusterName: info.body.cluster_name,
      version: info.body.version.number,
      tagline: info.body.tagline
    });
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    if (error.meta) {
      console.error('Error details:', error.meta);
    }
  });
