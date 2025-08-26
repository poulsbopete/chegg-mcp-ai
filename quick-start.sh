#!/bin/bash

# Chegg Elastic Insurance Demo - Quick Start Script
# This script sets up and runs the demo application with Elastic Serverless

set -e

echo "🚀 Chegg Elastic Insurance Demo - Quick Start"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your Elastic Serverless configuration:"
    echo ""
    echo "ELASTICSEARCH_HOST=https://ai-assistants-ffcafb.es.us-east-1.aws.elastic.cloud"
    echo "ELASTICSEARCH_PORT=443"
    echo "ELASTICSEARCH_API_KEY=your_api_key_here"
    echo "ELASTIC_INDEX_PREFIX=chegg-demo"
    echo "NODE_ENV=development"
    echo "PORT=3001"
    echo ""
    exit 1
fi

# Load environment variables
source .env

echo "📋 Configuration:"
echo "  - Elastic Host: $ELASTICSEARCH_HOST"
echo "  - Index Prefix: $ELASTIC_INDEX_PREFIX"
echo "  - Environment: $NODE_ENV"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..

# Install frontend with legacy peer deps to handle React version conflicts
echo "📦 Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps && cd ..

# Setup Elastic indices
echo "🔧 Setting up Elastic indices..."
node elastic/setup-indices.js

# Ingest sample data
echo "📊 Ingesting sample data..."
node data/ingest-sample-data.js

# Start the application
echo "🎯 Starting the application..."
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo "📚 API Documentation: http://localhost:3001/api-docs"
echo "🏥 Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start both frontend and backend
npm run dev
