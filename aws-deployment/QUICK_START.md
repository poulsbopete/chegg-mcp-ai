# 🚀 Quick Start - AWS Deployment

Get your Chegg Elastic Insurance Demo running on AWS in minutes!

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** 18+ installed
4. **AWS CDK** installed: `npm install -g aws-cdk`

## ⚡ Quick Deployment

### 1. Configure Environment
```bash
cd aws-deployment
cp env.example .env
# Edit .env with your Elastic Cloud details
```

### 2. Run Deployment
```bash
./scripts/deploy.sh
```

That's it! 🎉

## 🔧 Manual Steps (if needed)

### Step 1: Install Dependencies
```bash
npm run install:all
```

### Step 2: Deploy Infrastructure
```bash
npm run deploy:infrastructure
```

### Step 3: Deploy API
```bash
npm run build:lambda
npm run deploy:lambda
```

### Step 4: Deploy Frontend
```bash
npm run build:frontend
npm run deploy:frontend
```

## 🌐 Access Your Application

After deployment, you'll get:

- **Frontend**: `https://your-cloudfront-domain.cloudfront.net`
- **API**: `https://your-api-gateway-url.amazonaws.com`
- **API Docs**: `https://your-api-gateway-url.amazonaws.com/api-docs`

## 🔍 Monitor & Manage

```bash
# View API logs
npm run logs:api

# Test API health
npm run test:api

# Test frontend
npm run test:frontend

# Destroy infrastructure
npm run destroy
```

## 🚨 Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**
   ```bash
   cd cdk && cdk bootstrap
   ```

2. **AWS Credentials**
   ```bash
   aws configure
   ```

3. **Permission Errors**
   - Ensure your AWS user has necessary permissions
   - Check IAM policies for Lambda, API Gateway, S3, CloudFront

4. **Environment Variables**
   - Verify `.env` file exists and has correct values
   - Check Elastic Cloud connection details

### Get Help

- Check CloudWatch logs for detailed error messages
- Review the full [README.md](README.md) for detailed documentation
- Monitor AWS CloudFormation console for deployment status

---

**Ready to deploy? Run `./scripts/deploy.sh` and watch the magic happen! ✨**
