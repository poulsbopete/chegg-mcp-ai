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

class AIService {
  constructor() {
    this.initialized = false;
    this.elserModel = null;
    this.aiAssistantEnabled = process.env.ELASTIC_AI_ASSISTANT_ENABLED === 'true';
  }

  async initialize() {
    try {
      logger.info('Initializing AI Service...');
      
      // Initialize ELSER model
      await this.initializeELSER();
      
      this.initialized = true;
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  async initializeELSER() {
    try {
      // Check if ELSER model is available
      const models = await elasticClient.client.ml.getTrainedModels({
        model_id: 'elser_model_2'
      });

      if (models.body.count > 0) {
        this.elserModel = 'elser_model_2';
        logger.info('ELSER model is available');
      } else {
        logger.warn('ELSER model not found, semantic search will be limited');
      }
    } catch (error) {
      logger.warn('ELSER model not available:', error.message);
    }
  }

  async semanticSearch(query, options = {}) {
    try {
      const {
        indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`,
        size = 10
      } = options;

      let searchBody;

      if (this.elserModel) {
        // Use ELSER for semantic search
        searchBody = {
          query: {
            text_expansion: {
              "ml.inference.description_expanded.predicted_value": {
                model_id: this.elserModel,
                model_text: query
              }
            }
          },
          size: size
        };
      } else {
        // Fallback to traditional search
        searchBody = {
          query: {
            multi_match: {
              query: query,
              fields: ['description^3', 'claimantName^2', 'region^2'],
              type: "best_fields",
              fuzziness: "AUTO"
            }
          },
          size: size
        };
      }

      const result = await elasticClient.search(indexName, searchBody);

      return {
        query,
        results: result.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          source: hit._source
        })),
        total: result.hits.total.value
      };
    } catch (error) {
      logger.error('Error in semantic search:', error);
      throw error;
    }
  }

  async searchClaims(query, options = {}) {
    try {
      const {
        size = 20,
        filters = {}
      } = options;

      const indexName = `${process.env.ELASTIC_INDEX_PREFIX}-claims`;

      const searchQuery = {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['description^3', 'claimantName^2', 'region^2', 'claimType'],
                type: "best_fields",
                fuzziness: "AUTO"
              }
            }
          ],
          filter: []
        }
      };

      // Add filters
      if (filters.claimType) {
        searchQuery.bool.filter.push({ term: { claimType: filters.claimType } });
      }

      if (filters.region) {
        searchQuery.bool.filter.push({ term: { region: filters.region } });
      }

      const searchBody = {
        query: searchQuery,
        sort: [{ _score: { order: 'desc' } }],
        size: size
      };

      const result = await elasticClient.search(indexName, searchBody);

      return {
        query,
        claims: result.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source
        })),
        total: result.hits.total.value
      };
    } catch (error) {
      logger.error('Error searching claims:', error);
      throw error;
    }
  }

  async generateAnswer(question, context = {}) {
    try {
      // Simple rule-based answer generation for demo
      const questionLower = question.toLowerCase();
      let answer = '';
      let confidence = 0.7;

      if (questionLower.includes('claim') && questionLower.includes('process')) {
        answer = "The claim processing workflow involves: 1) Initial claim submission, 2) Documentation review, 3) Investigation, 4) Assessment, 5) Decision, and 6) Payment or denial. The average processing time is 7-14 business days depending on claim complexity.";
        confidence = 0.9;
      } else if (questionLower.includes('fraud')) {
        answer = "Fraud detection involves analyzing patterns such as duplicate VINs, repeated claimants, unusual claim amounts, and suspicious timing. Our ML models automatically flag potential fraud cases for manual review.";
        confidence = 0.8;
      } else {
        answer = "I can help you with questions about claims processing, fraud detection, policy coverage, and general insurance procedures. Please ask a specific question about any of these topics.";
        confidence = 0.6;
      }

      return {
        answer,
        confidence,
        model: 'demo-ai-assistant'
      };
    } catch (error) {
      logger.error('Error generating answer:', error);
      throw error;
    }
  }

  async getServiceStatus() {
    try {
      return {
        initialized: this.initialized,
        elserModel: this.elserModel,
        aiAssistantEnabled: this.aiAssistantEnabled,
        capabilities: {
          semanticSearch: !!this.elserModel,
          aiAssistant: this.aiAssistantEnabled,
          fraudInvestigation: true
        }
      };
    } catch (error) {
      logger.error('Error getting AI service status:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
