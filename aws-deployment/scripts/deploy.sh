#!/bin/bash

# Chegg Elastic Insurance Demo - AWS Deployment Script
# This script deploys the entire application to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        print_error "AWS CDK is not installed. Please install it with: npm install -g aws-cdk"
        exit 1
    fi
    
    # Check Docker (for Lambda container builds)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Lambda container builds will be skipped."
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied!"
}

# Load environment variables
load_env() {
    print_status "Loading environment variables..."
    
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
        print_success "Environment variables loaded from .env"
    else
        print_warning "No .env file found. Using default values."
    fi
    
    # Set defaults
    export AWS_REGION=${AWS_REGION:-us-east-1}
    export NODE_ENV=${NODE_ENV:-production}
    export ELASTICSEARCH_INDEX=${ELASTICSEARCH_INDEX:-search-chegg}
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install CDK dependencies
    cd cdk
    npm install
    cd ..
    
    # Install Lambda dependencies
    cd lambda
    npm install
    cd ..
    
    print_success "Dependencies installed successfully!"
}

# Build Lambda function
build_lambda() {
    print_status "Building Lambda function..."
    
    cd lambda
    
    # Build TypeScript
    npm run build
    
    # Create deployment package
    npm run package
    
    cd ..
    
    print_success "Lambda function built successfully!"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying AWS infrastructure..."
    
    cd cdk
    
    # Bootstrap CDK (if needed)
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
        print_status "Bootstrapping CDK..."
        cdk bootstrap
    fi
    
    # Deploy stacks
    print_status "Deploying CDK stacks..."
    cdk deploy --all --require-approval never
    
    cd ..
    
    print_success "Infrastructure deployed successfully!"
}

# Deploy Lambda function
deploy_lambda() {
    print_status "Deploying Lambda function..."
    
    # Get function name from CloudFormation output
    FUNCTION_NAME=$(aws cloudformation describe-stacks \
        --stack-name CheggApiStack \
        --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
        --output text)
    
    if [ -z "$FUNCTION_NAME" ]; then
        print_error "Could not get Lambda function name from CloudFormation"
        exit 1
    fi
    
    # Update function code
    cd lambda
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://function.zip
    
    cd ..
    
    print_success "Lambda function deployed successfully!"
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    # Build frontend
    cd ../frontend
    npm run build
    
    # Get S3 bucket name from CloudFormation output
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name CheggFrontendStack \
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
        --output text)
    
    if [ -z "$BUCKET_NAME" ]; then
        print_error "Could not get S3 bucket name from CloudFormation"
        exit 1
    fi
    
    # Sync to S3
    aws s3 sync build/ s3://"$BUCKET_NAME" --delete
    
    # Invalidate CloudFront cache
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name CheggFrontendStack \
        --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
        --output text)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*"
    fi
    
    cd ../aws-deployment
    
    print_success "Frontend deployed successfully!"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Get API URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name CheggApiStack \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
        --output text)
    
    # Get Frontend URL
    FRONTEND_URL=$(aws cloudformation describe-stacks \
        --stack-name CheggFrontendStack \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
        --output text)
    
    # Test API health endpoint
    print_status "Testing API health endpoint..."
    if curl -s "$API_URL/health" | grep -q "OK"; then
        print_success "API is healthy!"
    else
        print_error "API health check failed"
        exit 1
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -s "$FRONTEND_URL" | grep -q "Chegg"; then
        print_success "Frontend is accessible!"
    else
        print_warning "Frontend test failed (this might be normal during initial deployment)"
    fi
    
    print_success "Deployment test completed!"
}

# Display deployment information
show_deployment_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend: $(aws cloudformation describe-stacks --stack-name CheggFrontendStack --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' --output text)"
    echo "   API: $(aws cloudformation describe-stacks --stack-name CheggApiStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)"
    echo "   API Docs: $(aws cloudformation describe-stacks --stack-name CheggApiStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)/api-docs"
    echo ""
    echo "📊 Monitoring:"
    echo "   CloudWatch Logs: /aws/lambda/chegg-api"
    echo "   CloudFront Logs: S3 bucket logs"
    echo ""
    echo "🔧 Management:"
    echo "   View logs: npm run logs:api"
    echo "   Test API: npm run test:api"
    echo "   Destroy: npm run destroy"
}

# Main deployment function
main() {
    echo "🚀 Chegg Elastic Insurance Demo - AWS Deployment"
    echo "================================================"
    echo ""
    
    check_prerequisites
    load_env
    install_dependencies
    build_lambda
    deploy_infrastructure
    deploy_lambda
    deploy_frontend
    test_deployment
    show_deployment_info
}

# Run main function
main "$@"
