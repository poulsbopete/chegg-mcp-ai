import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Chegg Elastic Insurance Demo</h1>
        <p>Comprehensive demo showcasing Elastic Serverless and AI capabilities</p>
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
            <p>Checking system health...</p>
          )}
        </section>

        {/* Claims Overview */}
        <section className="claims-section">
          <h2>📊 Recent Claims</h2>
          {loading ? (
            <p>Loading claims...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="claims-list">
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <div key={claim.id} className="claim-card">
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
            <a href="/api-docs" className="action-button" target="_blank" rel="noopener noreferrer">
              📚 API Documentation
            </a>
            <a href="/api/claims" className="action-button" target="_blank" rel="noopener noreferrer">
              📋 All Claims
            </a>
            <a href="/api/claims/anomalies" className="action-button" target="_blank" rel="noopener noreferrer">
              🔍 Anomalies
            </a>
            <a href="/api/claims/fraud-detection" className="action-button" target="_blank" rel="noopener noreferrer">
              🛡️ Fraud Detection
            </a>
            <a href="/api/security/threats" className="action-button" target="_blank" rel="noopener noreferrer">
              🚨 Security Threats
            </a>
            <a href="/api/analytics/call-center" className="action-button" target="_blank" rel="noopener noreferrer">
              📞 Call Center Analytics
            </a>
          </div>
        </section>

        {/* Use Cases Overview */}
        <section className="usecases-section">
          <h2>🎯 Demo Use Cases</h2>
          <div className="usecases-grid">
            <div className="usecase-card">
              <h3>📊 Claims Anomaly Detection</h3>
              <p>ML-powered detection of unusual claims spikes by region, policy type, or channel</p>
            </div>
            <div className="usecase-card">
              <h3>📞 Call Center Monitoring</h3>
              <p>Real-time KPIs like average claim handling time, SLA adherence, and agent performance</p>
            </div>
            <div className="usecase-card">
              <h3>🛡️ Security & SIEM</h3>
              <p>Threat hunting, phishing detection, and ransomware triage workflows</p>
            </div>
            <div className="usecase-card">
              <h3>🔍 Fraud Detection</h3>
              <p>ML-based outlier detection for duplicate VINs, repeated claimants, and abnormal patterns</p>
            </div>
            <div className="usecase-card">
              <h3>🌤️ Climate Risk</h3>
              <p>Weather feed integration with geospatial data and insured asset locations</p>
            </div>
            <div className="usecase-card">
              <h3>🤖 AI & Search</h3>
              <p>ELSER semantic search, AI Assistant, and knowledge base copilot</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="App-footer">
        <p>Chegg Elastic Insurance Demo - Built with Elastic Serverless and AI</p>
      </footer>
    </div>
  );
}

export default App;
