# 🚀 AWS Deployment Guide

This guide will help you deploy the Chegg Elastic Insurance Demo to AWS using:
- **API**: AWS Lambda + API Gateway
- **Frontend**: S3 + CloudFront
- **Infrastructure**: AWS CDK (TypeScript)

## 📋 Prerequisites

1. **AWS CLI** installed and configured
2. **Node.js** 18+ installed
3. **AWS CDK** installed globally: `npm install -g aws-cdk`
4. **Docker** (for Lambda container builds)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway   │    │   AWS Lambda    │
│   (Frontend)    │    │   (API Proxy)   │    │   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   S3 Bucket     │    │   Lambda URL    │    │  Elastic Cloud  │
│   (Static Files)│    │   (API Endpoint)│    │  (Data Store)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Deployment

### 1. Install Dependencies
```bash
cd aws-deployment
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy Infrastructure
```bash
npm run deploy
```

### 4. Deploy Frontend
```bash
npm run deploy:frontend
```

## 📁 Project Structure

```
aws-deployment/
├── cdk/                    # CDK infrastructure code
│   ├── lib/
│   │   ├── api-stack.ts    # API Gateway + Lambda stack
│   │   ├── frontend-stack.ts # S3 + CloudFront stack
│   │   └── common.ts       # Shared utilities
│   ├── bin/
│   │   └── app.ts          # CDK app entry point
│   └── package.json
├── lambda/                 # Lambda function code
│   ├── src/
│   │   ├── index.ts        # Lambda handler
│   │   ├── server.ts       # Express server
│   │   └── middleware.ts   # Lambda middleware
│   ├── Dockerfile          # Lambda container
│   └── package.json
├── scripts/                # Deployment scripts
│   ├── build-frontend.sh   # Frontend build script
│   ├── deploy-frontend.sh  # Frontend deployment
│   └── update-env.sh       # Environment update
├── .env.example           # Environment template
└── package.json           # Root package.json
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# Elastic Cloud Configuration
ELASTICSEARCH_HOST=https://your-deployment.elastic.cloud
ELASTICSEARCH_API_KEY=your-api-key
ELASTICSEARCH_INDEX=search-chegg

# Application Configuration
NODE_ENV=production
PORT=3000

# Optional: Custom Domain
CUSTOM_DOMAIN=your-domain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
```

## 🎯 Deployment Steps

### Step 1: Prepare Infrastructure
```bash
# Install CDK dependencies
cd aws-deployment/cdk
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy infrastructure
cdk deploy --all
```

### Step 2: Build and Deploy API
```bash
# Build Lambda container
cd aws-deployment/lambda
docker build -t chegg-api .

# Deploy Lambda function
aws lambda update-function-code \
  --function-name chegg-api \
  --image-uri your-account.dkr.ecr.us-east-1.amazonaws.com/chegg-api:latest
```

### Step 3: Build and Deploy Frontend
```bash
# Build frontend
cd aws-deployment
npm run build:frontend

# Deploy to S3
npm run deploy:frontend
```

## 🌐 Access Points

After deployment, you'll have:

- **Frontend**: `https://your-cloudfront-domain.cloudfront.net`
- **API**: `https://your-api-gateway-url.amazonaws.com`
- **API Documentation**: `https://your-api-gateway-url.amazonaws.com/api-docs`

## 🔍 Monitoring and Logs

### CloudWatch Logs
- **API Logs**: `/aws/lambda/chegg-api`
- **CloudFront Logs**: S3 bucket logs

### Metrics
- **API Gateway**: Request count, latency, errors
- **Lambda**: Duration, memory usage, errors
- **CloudFront**: Cache hit ratio, bandwidth

## 🔒 Security

### IAM Roles
- **Lambda Execution Role**: Minimal permissions for Elastic Cloud access
- **CloudFront Origin Access**: S3 bucket access only

### Environment Variables
- **Encrypted**: Sensitive data encrypted with KMS
- **Secrets Manager**: API keys stored in AWS Secrets Manager

## 📊 Cost Optimization

### Lambda
- **Memory**: 512MB (optimized for performance)
- **Timeout**: 30 seconds
- **Concurrency**: Auto-scaling

### CloudFront
- **Caching**: Aggressive caching for static assets
- **Compression**: Gzip compression enabled
- **Edge Locations**: Global distribution

## 🚨 Troubleshooting

### Common Issues

1. **Lambda Cold Start**
   - Solution: Use provisioned concurrency
   - Monitor: CloudWatch metrics

2. **CORS Issues**
   - Solution: Configure API Gateway CORS
   - Check: Lambda response headers

3. **Environment Variables**
   - Solution: Verify .env configuration
   - Check: Lambda function configuration

### Debug Commands
```bash
# Check Lambda logs
aws logs tail /aws/lambda/chegg-api --follow

# Test API endpoint
curl https://your-api-gateway-url.amazonaws.com/health

# Check CloudFront distribution
aws cloudfront get-distribution --id your-distribution-id
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Infrastructure
        run: |
          cd aws-deployment
          npm run deploy
      - name: Deploy Frontend
        run: |
          cd aws-deployment
          npm run deploy:frontend
```

## 📈 Scaling

### Auto Scaling
- **Lambda**: Automatic scaling based on demand
- **API Gateway**: Built-in scaling
- **CloudFront**: Global edge locations

### Performance
- **Cold Start**: ~200ms (with provisioned concurrency)
- **Warm Start**: ~50ms
- **Frontend Load**: <1s (CloudFront cached)

## 🎯 Next Steps

1. **Custom Domain**: Configure Route 53 and SSL certificate
2. **Monitoring**: Set up CloudWatch dashboards
3. **Alerts**: Configure SNS notifications
4. **Backup**: Set up automated backups
5. **Security**: Implement WAF and rate limiting

---

**Ready to deploy? Follow the steps above to get your Chegg Elastic Insurance Demo running on AWS! 🚀**
