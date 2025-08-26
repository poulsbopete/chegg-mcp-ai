const { Client } = require('@elastic/elasticsearch');
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

// Elasticsearch client configuration
let client;

if (process.env.ELASTICSEARCH_HOST) {
  // Elastic Serverless configuration
  const host = process.env.ELASTICSEARCH_HOST;
  const port = process.env.ELASTICSEARCH_PORT || 443;
  const nodeUrl = host.startsWith('http') ? `${host}:${port}` : `https://${host}:${port}`;
  
  client = new Client({
    node: nodeUrl,
    auth: {
      apiKey: process.env.ELASTICSEARCH_API_KEY,
    },
    requestTimeout: 120000, // 2 minutes
    maxRetries: 3,
    retryOnTimeout: true,
    ssl: {
      rejectUnauthorized: true,
    },
  });
} else if (process.env.ELASTIC_CLOUD_ID) {
  // Cloud deployment configuration
  client = new Client({
    cloud: {
      id: process.env.ELASTIC_CLOUD_ID,
    },
    auth: {
      apiKey: process.env.ELASTIC_API_KEY,
    },
    requestTimeout: 120000, // 2 minutes
    maxRetries: 3,
    retryOnTimeout: true,
  });
} else if (process.env.ELASTIC_ENDPOINT) {
  // Self-hosted or custom endpoint configuration
  client = new Client({
    node: process.env.ELASTIC_ENDPOINT,
    auth: {
      username: process.env.ELASTIC_USERNAME || 'elastic',
      password: process.env.ELASTIC_PASSWORD,
    },
    requestTimeout: 120000, // 2 minutes
    maxRetries: 3,
    retryOnTimeout: true,
    ssl: {
      rejectUnauthorized: false, // Only for development
    },
  });
} else {
  // Local development configuration
  client = new Client({
    node: 'http://localhost:9200',
    requestTimeout: 120000, // 2 minutes
    maxRetries: 3,
    retryOnTimeout: true,
  });
}

// Test connection function
async function testConnection() {
  try {
    const response = await client.ping();
    logger.info('Elasticsearch connection successful');
    return true;
  } catch (error) {
    logger.error('Elasticsearch connection failed:', error.message);
    return false;
  }
}

// Get cluster info
async function getClusterInfo() {
  try {
    const info = await client.info();
    return {
      clusterName: info.cluster_name,
      version: info.version.number,
      tagline: info.tagline,
    };
  } catch (error) {
    logger.error('Failed to get cluster info:', error.message);
    throw error;
  }
}

// Get index statistics
async function getIndexStats(indexPattern = '*') {
  try {
    const stats = await client.indices.stats({
      index: indexPattern,
      metric: ['docs', 'store', 'indexing', 'search'],
    });
    return stats.body;
  } catch (error) {
    logger.error('Failed to get index stats:', error.message);
    throw error;
  }
}

// Create index with mapping
async function createIndex(indexName, mapping) {
  try {
    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists.body) {
      const response = await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            'index.mapping.total_fields.limit': 2000,
            'index.mapping.nested_fields.limit': 100,
            'index.mapping.depth.limit': 20,
          },
          mappings: mapping,
        },
      });
      
      logger.info(`Index ${indexName} created successfully`);
      return response;
    } else {
      logger.info(`Index ${indexName} already exists`);
      return { body: { acknowledged: true } };
    }
  } catch (error) {
    logger.error(`Failed to create index ${indexName}:`, error.message);
    throw error;
  }
}

// Bulk index documents
async function bulkIndex(indexName, documents) {
  try {
    const operations = documents.flatMap(doc => [
      { index: { _index: indexName } },
      doc
    ]);

    const response = await client.bulk({
      refresh: true,
      operations: operations,
    });

    if (response.errors) {
      const errors = response.items
        .filter(item => item.index && item.index.error)
        .map(item => item.index.error);
      
      logger.error('Bulk indexing errors:', errors);
      throw new Error(`Bulk indexing failed: ${errors.length} errors`);
    }

    logger.info(`Successfully indexed ${documents.length} documents to ${indexName}`);
    return response;
  } catch (error) {
    logger.error(`Bulk indexing failed for ${indexName}:`, error.message);
    throw error;
  }
}

// Search documents
async function search(indexName, query, options = {}) {
  try {
    const searchOptions = {
      index: indexName,
      body: query,
      ...options,
    };

    const response = await client.search(searchOptions);
    return response;
  } catch (error) {
    logger.error(`Search failed for ${indexName}:`, error.message);
    throw error;
  }
}

// Update document
async function updateDocument(indexName, id, doc) {
  try {
    const response = await client.update({
      index: indexName,
      id: id,
      body: {
        doc: doc,
      },
    });
    
    logger.info(`Document ${id} updated in ${indexName}`);
    return response.body;
  } catch (error) {
    logger.error(`Failed to update document ${id} in ${indexName}:`, error.message);
    throw error;
  }
}

// Delete document
async function deleteDocument(indexName, id) {
  try {
    const response = await client.delete({
      index: indexName,
      id: id,
    });
    
    logger.info(`Document ${id} deleted from ${indexName}`);
    return response.body;
  } catch (error) {
    logger.error(`Failed to delete document ${id} from ${indexName}:`, error.message);
    throw error;
  }
}

// Get document by ID
async function getDocument(indexName, id) {
  try {
    const response = await client.get({
      index: indexName,
      id: id,
    });
    
    return response.body._source;
  } catch (error) {
    logger.error(`Failed to get document ${id} from ${indexName}:`, error.message);
    throw error;
  }
}

// Count documents
async function countDocuments(indexName, query = { match_all: {} }) {
  try {
    const response = await client.count({
      index: indexName,
      body: {
        query: query,
      },
    });
    
    return response.count;
  } catch (error) {
    logger.error(`Failed to count documents in ${indexName}:`, error.message);
    throw error;
  }
}

// Delete index
async function deleteIndex(indexName) {
  try {
    const exists = await client.indices.exists({ index: indexName });
    
    if (exists.body) {
      const response = await client.indices.delete({ index: indexName });
      logger.info(`Index ${indexName} deleted successfully`);
      return response;
    } else {
      logger.info(`Index ${indexName} does not exist`);
      return { body: { acknowledged: true } };
    }
  } catch (error) {
    logger.error(`Failed to delete index ${indexName}:`, error.message);
    throw error;
  }
}

// Health check
async function healthCheck() {
  try {
    const health = await client.cluster.health();
    return {
      status: health.body.status,
      numberOfNodes: health.body.number_of_nodes,
      activeShards: health.body.active_shards,
      relocatingShards: health.body.relocating_shards,
      initializingShards: health.body.initializing_shards,
      unassignedShards: health.body.unassigned_shards,
    };
  } catch (error) {
    logger.error('Health check failed:', error.message);
    throw error;
  }
}

module.exports = {
  client,
  testConnection,
  getClusterInfo,
  getIndexStats,
  createIndex,
  bulkIndex,
  search,
  updateDocument,
  deleteDocument,
  getDocument,
  countDocuments,
  deleteIndex,
  healthCheck,
};
