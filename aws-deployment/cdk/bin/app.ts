#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CheggApiStack } from '../lib/api-stack';
import { CheggFrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

// Get environment variables
const env = {
  account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Create API Stack
const apiStack = new CheggApiStack(app, 'CheggApiStack', {
  env,
  description: 'Chegg Elastic Insurance Demo API - Lambda + API Gateway',
  tags: {
    Project: 'CheggElasticDemo',
    Component: 'API',
    Environment: 'Production'
  }
});

// Create Frontend Stack
const frontendStack = new CheggFrontendStack(app, 'CheggFrontendStack', {
  env,
  description: 'Chegg Elastic Insurance Demo Frontend - S3 + CloudFront',
  tags: {
    Project: 'CheggElasticDemo',
    Component: 'Frontend',
    Environment: 'Production'
  }
});

// Add dependency: Frontend depends on API
frontendStack.addDependency(apiStack);

// Output the stack names for reference
app.node.addContext('apiStackName', apiStack.stackName);
app.node.addContext('frontendStackName', frontendStack.stackName);
