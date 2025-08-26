# Chegg Elastic Insurance Demo - Setup Guide

This guide will help you set up and run the Chegg Elastic Insurance Demo using Elastic Serverless.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Elastic Cloud account with AI Assistants enabled
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd chegg-elastic-demo
```

### 2. Environment Configuration

Create a `.env` file in the root directory with your Elastic Serverless configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Elastic Serverless Configuration
ELASTICSEARCH_HOST=https://ai-assistants-ffcafb.es.us-east-1.aws.elastic.cloud
ELASTICSEARCH_PORT=443
ELASTICSEARCH_API_KEY=bXlUWjRwZ0JrYW1ldk9CQUJtLVU6TWNtdmRKcnRMbnpxQU5QYzA0Vy1aQQ==
ELASTIC_INDEX_PREFIX=search-chegg

# AI Configuration
ELASTIC_AI_ASSISTANT_ENABLED=true
ELASTIC_ML_ENABLED=true

# Sample Data Configuration
SAMPLE_CLAIMS_COUNT=1000
SAMPLE_CALLS_COUNT=500
SAMPLE_SECURITY_EVENTS_COUNT=200

# Optional: OpenAI/Anthropic for enhanced AI features
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
LLM_MODEL=gpt-4

# Demo Mode (avoids API throttling)
DEMO_MODE=true
```

### 3. Run the Demo

#### Option A: Quick Start Script (Recommended)

```bash
./quick-start.sh
```

#### Option B: Manual Setup

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Setup Elastic indices
node elastic/setup-indices.js

# Ingest sample data
node data/ingest-sample-data.js

# Start the application
npm run dev
```

### 4. Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 📊 Demo Use Cases

### 1. Claims Processing Anomaly Detection
- **Endpoint**: `GET /api/claims/anomalies`
- **Demo**: ML-powered detection of unusual claims spikes by region, policy type, or channel
- **Features**: Real-time anomaly detection, fraud vs. natural disaster pattern recognition

### 2. Call Center Experience Monitoring
- **Endpoint**: `GET /api/analytics/call-center`
- **Demo**: KPIs like average claim handling time, SLA adherence, and agent performance
- **Features**: Real-time call center analytics with OpenTelemetry integration

### 3. Policyholder Digital Experience
- **Endpoint**: `GET /api/analytics/digital-experience`
- **Demo**: Error tracking and response times in customer mobile app or agent portal
- **Features**: Elastic APM integration, customer satisfaction correlation

### 4. SIEM Threat Hunting Demo
- **Endpoint**: `GET /api/security/threats`
- **Demo**: Phishing attempt and credential stuffing detection with MITRE ATT&CK integration
- **Features**: Automated alert enrichment and correlation

### 5. Fraudulent Claims Detection
- **Endpoint**: `GET /api/claims/fraud-detection`
- **Demo**: ML-based outlier detection for structured and unstructured claims data
- **Features**: Duplicate VIN detection, repeated claimant analysis, abnormal loss patterns

### 6. Ransomware Triage Workflow
- **Endpoint**: `POST /api/security/ransomware-triage`
- **Demo**: Elastic SOAR automation for incident response
- **Features**: Endpoint isolation, threat intel enrichment, one-click notifications

### 7. Climate & Catastrophe Risk Dashboard
- **Endpoint**: `GET /api/weather/climate-risk`
- **Demo**: Weather feed integration with geospatial data and insured asset locations
- **Features**: CAT modeling and underwriting risk visualization

### 8. Regulatory Compliance Monitoring
- **Endpoint**: `GET /api/compliance/regulatory`
- **Demo**: PCI/DSS audit log monitoring and GDPR data governance tracking
- **Features**: Compliance officer dashboards

### 9. Sustainability / ESG Tracking
- **Endpoint**: `GET /api/compliance/esg`
- **Demo**: Emissions, travel, and facilities energy use data ingestion
- **Features**: ESG initiative alignment reporting

### 10. AI-Powered Claims Search
- **Endpoint**: `GET /api/ai/semantic-search?q=your_query`
- **Demo**: ELSER semantic search for claim histories
- **Features**: Natural language queries like "find cases similar to hail damage in Houston last June"

### 11. Knowledge Base Copilot
- **Endpoint**: `POST /api/ai/assistant`
- **Demo**: Policy documents and underwriting manuals ingestion
- **Features**: Natural language Q&A for agents or customers

### 12. Fraud Investigator Copilot
- **Demo**: Workflow automation for fraud investigation
- **Features**: Intelligent claim clustering and summarization

## 🔧 API Endpoints

### Claims Management
- `GET /api/claims` - Get all claims with filtering
- `GET /api/claims/:id` - Get specific claim
- `POST /api/claims` - Create new claim
- `PUT /api/claims/:id` - Update claim
- `GET /api/claims/anomalies` - Get anomaly detection results
- `GET /api/claims/fraud-detection` - Get fraud detection results
- `GET /api/claims/analytics` - Get claims analytics

### Security & SIEM
- `GET /api/security/events` - Get security events
- `GET /api/security/threats` - Get threat hunting results
- `GET /api/security/phishing` - Get phishing detection results
- `GET /api/security/credential-stuffing` - Get credential stuffing detection
- `POST /api/security/ransomware-triage` - Initiate ransomware triage workflow
- `GET /api/security/workflows` - Get SOAR workflows
- `GET /api/security/mitre-attack` - Get MITRE ATT&CK framework data

### Analytics & Monitoring
- `GET /api/analytics/call-center` - Get call center analytics
- `GET /api/analytics/digital-experience` - Get digital experience metrics
- `GET /api/apm/performance` - Get application performance metrics

### AI & Search
- `GET /api/ai/semantic-search` - Perform semantic search
- `POST /api/ai/assistant` - Get AI Assistant response
- `GET /api/ai/status` - Get AI service status

### Weather & Climate
- `GET /api/weather/climate-risk` - Get climate risk analysis

### Compliance & ESG
- `GET /api/compliance/regulatory` - Get regulatory compliance data
- `GET /api/compliance/esg` - Get ESG tracking data

### ML & Services
- `GET /api/ml/status` - Get ML service status

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Setup data ingestion
docker-compose --profile setup up data-ingestion

# View logs
docker-compose logs -f
```

### Individual Services

```bash
# Backend only
docker-compose up backend

# Frontend only
docker-compose up frontend

# Data ingestion only
docker-compose --profile setup up data-ingestion
```

## 📈 Sample Data

The demo includes comprehensive sample data for all use cases:

- **Claims Data**: 1,000+ insurance claims with various types, regions, and amounts
- **Call Center Data**: 500+ call records with performance metrics
- **Security Events**: 200+ security events with MITRE ATT&CK mappings
- **Weather Data**: 100+ weather records with geospatial data
- **Policy Documents**: 50+ policy documents for knowledge base
- **APM Data**: 300+ application performance records

## 🔍 Troubleshooting

### Common Issues

1. **Connection to Elastic Serverless fails**
   - Verify your API key is correct
   - Check that your Elastic Cloud deployment is active
   - Ensure the host URL is correct

2. **Indices not created**
   - Run `node elastic/setup-indices.js` manually
   - Check Elastic Cloud permissions

3. **Sample data not ingested**
   - Run `node data/ingest-sample-data.js` manually
   - Check network connectivity to Elastic Cloud

4. **Frontend not loading**
   - Ensure backend is running on port 3001
   - Check browser console for errors
   - Verify proxy configuration in frontend/package.json

### Logs

- **Backend logs**: Check console output or `logs/` directory
- **Frontend logs**: Check browser developer tools
- **Docker logs**: `docker-compose logs -f [service-name]`

## 🎯 Next Steps

1. **Customize the demo** for your specific use cases
2. **Integrate with your data sources** for real-time data
3. **Configure ML models** for your specific fraud patterns
4. **Set up alerts and notifications** for production use
5. **Deploy to production** with proper security configurations

## 📞 Support

For questions or issues:
- Check the troubleshooting section above
- Review the API documentation at `/api-docs`
- Create an issue in the repository
- Contact the development team

---

**Note**: This is a demo application for educational and demonstration purposes. Do not use in production without proper security review and customization.
