import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Configure axios to use the backend API
const API_BASE_URL = 'http://localhost:3001';
axios.defaults.baseURL = API_BASE_URL;

function App() {
  const [health, setHealth] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showUseCaseModal, setShowUseCaseModal] = useState(false);

  useEffect(() => {
    checkHealth();
    fetchClaims();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get('/health');
      setHealth(response.data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/claims?size=10');
      setClaims(response.data.claims || []);
    } catch (err) {
      setError('Failed to fetch claims');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimClick = (claim) => {
    setSelectedClaim(claim);
    setShowClaimModal(true);
  };

  const handleUseCaseClick = (useCase) => {
    setSelectedUseCase(useCase);
    setShowUseCaseModal(true);
  };

  const closeModal = () => {
    setShowClaimModal(false);
    setShowUseCaseModal(false);
    setSelectedClaim(null);
    setSelectedUseCase(null);
  };

  const useCases = [
    {
      id: 'claims-anomaly',
      title: 'Claims Anomaly Detection',
      icon: '📊',
      description: 'ML-powered detection of unusual claims spikes by region, policy type, or channel.',
      details: {
        overview: 'Advanced machine learning algorithms detect unusual patterns in claims data that may indicate fraud, natural disasters, or other anomalies.',
        features: [
          'Real-time anomaly detection using Elastic ML',
          'Regional spike analysis and alerting',
          'Policy type correlation analysis',
          'Channel-based pattern recognition',
          'Automated alert generation'
        ],
        apiEndpoints: [
          'GET /api/claims/anomalies',
          'GET /api/ml/anomalies',
          'POST /api/ml/detect-anomalies'
        ],
        demoData: '10,000+ claims with various anomaly patterns'
      }
    },
    {
      id: 'call-center',
      title: 'Call Center Monitoring',
      icon: '📞',
      description: 'Real-time KPIs like average claim handling time, SLA adherence, and agent performance.',
      details: {
        overview: 'Comprehensive monitoring of call center operations with real-time performance metrics and SLA tracking.',
        features: [
          'Real-time agent performance tracking',
          'SLA adherence monitoring',
          'Average handling time analysis',
          'Customer satisfaction correlation',
          'Queue management optimization'
        ],
        apiEndpoints: [
          'GET /api/analytics/call-center',
          'GET /api/analytics/agent-performance',
          'GET /api/analytics/sla-metrics'
        ],
        demoData: '700+ call center records with performance metrics'
      }
    },
    {
      id: 'security-siem',
      title: 'Security & SIEM',
      icon: '🛡️',
      description: 'Threat hunting, phishing detection, and ransomware triage workflows.',
      details: {
        overview: 'Enterprise-grade security information and event management with automated threat detection and response.',
        features: [
          'MITRE ATT&CK framework integration',
          'Phishing attempt detection',
          'Ransomware triage automation',
          'Threat intelligence enrichment',
          'Automated incident response'
        ],
        apiEndpoints: [
          'GET /api/security/events',
          'GET /api/security/threats',
          'POST /api/security/investigate'
        ],
        demoData: '2,000+ security events with MITRE ATT&CK mappings'
      }
    },
    {
      id: 'fraud-detection',
      title: 'Fraud Detection',
      icon: '🔍',
      description: 'ML-based outlier detection for duplicate VINs, repeated claimants, and abnormal patterns.',
      details: {
        overview: 'Advanced fraud detection using machine learning to identify suspicious patterns and potential fraudulent claims.',
        features: [
          'Duplicate VIN detection',
          'Repeated claimant analysis',
          'Abnormal loss pattern identification',
          'Network analysis for fraud rings',
          'Real-time fraud scoring'
        ],
        apiEndpoints: [
          'GET /api/security/fraud',
          'POST /api/ml/detect-fraud',
          'GET /api/analytics/fraud-patterns'
        ],
        demoData: 'ML models trained on historical fraud patterns'
      }
    },
    {
      id: 'climate-risk',
      title: 'Climate Risk',
      icon: '🌤️',
      description: 'Weather feed integration with geospatial data and insured asset locations.',
      details: {
        overview: 'Climate and catastrophe risk modeling using real-time weather data and geospatial analysis.',
        features: [
          'Real-time weather feed integration',
          'Geospatial asset mapping',
          'Catastrophe risk modeling',
          'Climate change impact analysis',
          'Underwriting risk assessment'
        ],
        apiEndpoints: [
          'GET /api/analytics/weather',
          'GET /api/analytics/climate-risk',
          'GET /api/analytics/asset-exposure'
        ],
        demoData: 'Weather data for catastrophe risk modeling'
      }
    },
    {
      id: 'ai-search',
      title: 'AI & Search',
      icon: '🤖',
      description: 'ELSER semantic search, AI Assistant, and knowledge base copilot.',
      details: {
        overview: 'Next-generation AI-powered search and assistance capabilities using Elastic\'s ELSER model and AI Assistant.',
        features: [
          'ELSER semantic search',
          'Natural language query processing',
          'Knowledge base copilot',
          'Intelligent claim similarity matching',
          'AI-powered document analysis'
        ],
        apiEndpoints: [
          'GET /api/ai/semantic-search',
          'POST /api/ai/assistant',
          'GET /api/ai/knowledge-base'
        ],
        demoData: 'Policy documents and knowledge base integration'
      }
    }
  ];

  return (
    <div className="App">
      <header className="App-header">
        <div className="chegg-logo">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#ff6b35" strokeWidth="3"/>
            <text x="50" y="60" textAnchor="middle" fontSize="35" fontWeight="bold" fill="#ff6b35">C</text>
          </svg>
          <span className="chegg-logo-text">Chegg</span>
        </div>
        <h1>🚀 Elastic Insurance Demo</h1>
        <p>Comprehensive demo showcasing Elastic Serverless and AI capabilities for insurance industry use cases</p>
      </header>

      <main className="App-main">
        {/* Health Status */}
        <section className="health-section">
          <h2>🏥 System Health</h2>
          {health ? (
            <div className="health-status">
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Environment:</strong> {health.environment}</p>
              <p><strong>Version:</strong> {health.version}</p>
              <p><strong>Uptime:</strong> {Math.round(health.uptime)}s</p>
            </div>
          ) : (
            <p className="loading">Checking system health...</p>
          )}
        </section>

        {/* Claims Overview */}
        <section className="claims-section">
          <h2>📊 Recent Claims</h2>
          {loading ? (
            <p className="loading">Loading claims...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="claims-list">
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <div 
                    key={claim.id} 
                    className="claim-card clickable"
                    onClick={() => handleClaimClick(claim)}
                  >
                    <h3>{claim.claimId}</h3>
                    <p><strong>Claimant:</strong> {claim.claimantName}</p>
                    <p><strong>Type:</strong> {claim.claimType}</p>
                    <p><strong>Amount:</strong> ${claim.claimAmount?.toLocaleString()}</p>
                    <p><strong>Region:</strong> {claim.region}</p>
                    <p><strong>Status:</strong> {claim.status}</p>
                  </div>
                ))
              ) : (
                <p>No claims found. Try running the data ingestion script.</p>
              )}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>⚡ Quick Actions</h2>
          <div className="action-buttons">
            <a href={`${API_BASE_URL}/api-docs`} className="action-button" target="_blank" rel="noopener noreferrer">
              📚 API Documentation
            </a>
            <a href={`${API_BASE_URL}/api/claims`} className="action-button" target="_blank" rel="noopener noreferrer">
              📋 All Claims
            </a>
            <a href={`${API_BASE_URL}/api/claims/anomalies`} className="action-button" target="_blank" rel="noopener noreferrer">
              🔍 Anomalies
            </a>
            <a href={`${API_BASE_URL}/api/security/events`} className="action-button" target="_blank" rel="noopener noreferrer">
              🛡️ Security Events
            </a>
            <a href={`${API_BASE_URL}/api/analytics/call-center`} className="action-button" target="_blank" rel="noopener noreferrer">
              📞 Call Center Analytics
            </a>
            <a href={`${API_BASE_URL}/api/ai/semantic-search?q=auto%20claims`} className="action-button" target="_blank" rel="noopener noreferrer">
              🤖 AI Search
            </a>
          </div>
        </section>

        {/* Use Cases Overview */}
        <section className="usecases-section">
          <h2>🎯 Demo Use Cases</h2>
          <div className="usecases-grid">
            {useCases.map((useCase) => (
              <div 
                key={useCase.id}
                className="usecase-card clickable"
                onClick={() => handleUseCaseClick(useCase)}
              >
                <h3>{useCase.icon} {useCase.title}</h3>
                <p>{useCase.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="App-footer">
        <p>Chegg Elastic Insurance Demo - Built with Elastic Serverless and AI</p>
      </footer>

      {/* Claim Detail Modal */}
      {showClaimModal && selectedClaim && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Claim Details</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="claim-detail-grid">
                <div className="detail-item">
                  <strong>Claim ID:</strong> {selectedClaim.claimId}
                </div>
                <div className="detail-item">
                  <strong>Claimant:</strong> {selectedClaim.claimantName}
                </div>
                <div className="detail-item">
                  <strong>Policy Number:</strong> {selectedClaim.policyNumber}
                </div>
                <div className="detail-item">
                  <strong>Claim Type:</strong> {selectedClaim.claimType}
                </div>
                <div className="detail-item">
                  <strong>Amount:</strong> ${selectedClaim.claimAmount?.toLocaleString()}
                </div>
                <div className="detail-item">
                  <strong>Region:</strong> {selectedClaim.region}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> 
                  <span className={`status-badge status-${selectedClaim.status?.toLowerCase()}`}>
                    {selectedClaim.status}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Incident Date:</strong> {new Date(selectedClaim.incidentDate).toLocaleDateString()}
                </div>
                <div className="detail-item">
                  <strong>Agent ID:</strong> {selectedClaim.agentId}
                </div>
                <div className="detail-item">
                  <strong>Channel:</strong> {selectedClaim.channel}
                </div>
                {selectedClaim.vin && (
                  <div className="detail-item">
                    <strong>VIN:</strong> {selectedClaim.vin}
                  </div>
                )}
                {selectedClaim.description && (
                  <div className="detail-item full-width">
                    <strong>Description:</strong> {selectedClaim.description}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <a 
                  href={`${API_BASE_URL}/api/claims/${selectedClaim.claimId}`} 
                  className="action-button" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  🔗 View in API
                </a>
                <button className="action-button secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Use Case Detail Modal */}
      {showUseCaseModal && selectedUseCase && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUseCase.icon} {selectedUseCase.title}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="usecase-detail">
                <div className="detail-section">
                  <h3>Overview</h3>
                  <p>{selectedUseCase.details.overview}</p>
                </div>
                
                <div className="detail-section">
                  <h3>Key Features</h3>
                  <ul className="feature-list">
                    {selectedUseCase.details.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section">
                  <h3>API Endpoints</h3>
                  <div className="endpoint-list">
                    {selectedUseCase.details.apiEndpoints.map((endpoint, index) => (
                      <code key={index} className="endpoint-item">
                        {endpoint}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Demo Data</h3>
                  <p>{selectedUseCase.details.demoData}</p>
                </div>
              </div>
              
              <div className="modal-actions">
                <a 
                  href={`${API_BASE_URL}/api-docs`} 
                  className="action-button" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  📚 Test APIs
                </a>
                <button className="action-button secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
