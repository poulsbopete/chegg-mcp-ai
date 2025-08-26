# 🚀 Chegg Elastic Insurance Demo

A comprehensive demo showcasing Elastic Serverless and AI capabilities for insurance industry use cases, built with Chegg's brand identity.

## 🎨 Chegg Branding

This demo features:
- **Chegg Orange (#ff6b35)** - Primary brand color
- **Chegg Red (#d32f2f)** - Secondary brand color  
- **Custom Chegg Logo** - SVG-based logo in the header
- **Modern UI Design** - Clean, professional interface matching Chegg's brand guidelines
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

- **Frontend**: React.js with Chegg-branded UI
- **Backend**: Node.js/Express API
- **Database**: Elastic Serverless
- **AI/ML**: Elastic ML and AI capabilities
- **Security**: Elastic Security (SIEM/SOAR)

## 🎯 12 Insurance Use Cases

### 📊 Observability & Claims Operations
1. **Claims Processing Anomaly Detection** - ML-powered detection of unusual claims patterns
2. **Call Center Experience Monitoring** - Real-time KPIs and performance metrics
3. **Policyholder Digital Experience** - APM for customer satisfaction tracking

### 🛡️ Security & Fraud Detection
4. **SIEM Threat Hunting** - Phishing detection and MITRE ATT&CK mapping
5. **Fraudulent Claims Detection** - ML-based outlier detection
6. **Ransomware Triage Workflow** - Automated investigation and response

### 📈 Risk, Compliance & ESG Analytics
7. **Regulatory Compliance Monitoring** - PCI/DSS audit logs and GDPR governance
8. **Climate & Catastrophe Risk Dashboard** - Weather feeds and geospatial data
9. **Sustainability / ESG Tracking** - Emissions and energy use reporting

### 🤖 AI & Search Experiences
10. **AI-Powered Claims Search** - ELSER semantic search capabilities
11. **Knowledge Base Copilot** - Natural language Q&A for agents
12. **Fraud Investigator Copilot** - Intelligent workflow assistance

## 🚀 Quick Start

### Option 1: Use the Startup Script
```bash
./start-demo.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Start backend
cd backend && npm start

# Start frontend (in new terminal)
cd frontend && npm start
```

## 🌐 Access Points

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 📊 Sample Data

The demo includes realistic sample data:
- **10,000+ insurance claims** with various types and regions
- **2,000+ security events** with MITRE ATT&CK mappings
- **700+ call center records** with performance metrics
- **Weather data** for catastrophe risk modeling
- **APM traces** for performance monitoring

## 🔧 API Endpoints

### Claims Management
- `GET /api/claims` - Get all claims with filtering
- `GET /api/claims/analytics` - Claims analytics and aggregations
- `GET /api/claims/anomalies` - ML anomaly detection results

### Security & Fraud
- `GET /api/security/events` - Security events and threats
- `GET /api/security/fraud` - Fraud detection results
- `GET /api/security/threats` - Threat hunting data

### Analytics
- `GET /api/analytics/call-center` - Call center performance metrics
- `GET /api/analytics/digital-experience` - Digital experience data
- `GET /api/analytics/esg` - ESG tracking metrics

### AI & Search
- `GET /api/ai/semantic-search` - ELSER semantic search
- `POST /api/ai/assistant` - AI Assistant responses
- `GET /api/ai/status` - AI service status

## 🎨 Design Features

### Chegg Brand Colors
- Primary Orange: `#ff6b35`
- Secondary Red: `#d32f2f`
- Dark Orange: `#e55a2b`
- Light Orange: `#ff8a5c`
- Gray Palette: `#424242`, `#757575`, `#f5f5f5`

### UI Components
- **Gradient Headers** - Chegg orange to red gradients
- **Card-based Layout** - Clean, modern card design
- **Hover Effects** - Smooth animations and transitions
- **Status Indicators** - Color-coded health and status displays
- **Responsive Grid** - Adaptive layout for all screen sizes

## 🔍 Demo Features

### Interactive Dashboard
- Real-time system health monitoring
- Recent claims display with filtering
- Quick action buttons for API testing
- Use case overview with descriptions

### API Testing
- Direct links to test all endpoints
- Swagger UI integration
- Real-time data visualization
- Error handling and status feedback

## 📱 Mobile Responsive

The frontend is fully responsive and optimized for:
- Desktop browsers
- Tablet devices
- Mobile phones
- Touch interactions

## 🛠️ Technology Stack

- **Frontend**: React 17, CSS3, Axios
- **Backend**: Node.js, Express, Winston
- **Database**: Elastic Serverless
- **AI/ML**: Elastic ML, ELSER
- **Security**: Elastic Security
- **Monitoring**: Elastic APM

## 📄 License

This demo is built for Chegg to showcase Elastic capabilities in insurance industry applications.

---

**Built with ❤️ for Chegg using Elastic Serverless and AI**
