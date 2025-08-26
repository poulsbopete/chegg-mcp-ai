import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class CheggApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ECR repository for Lambda container
    const repository = new ecr.Repository(this, 'CheggApiRepository', {
      repositoryName: 'chegg-api',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'CheggApiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        ElasticCloudAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'CheggApiFunction', {
      functionName: 'chegg-api',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda'),
      role: lambdaRole,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        ELASTICSEARCH_HOST: process.env.ELASTICSEARCH_HOST || '',
        ELASTICSEARCH_API_KEY: process.env.ELASTICSEARCH_API_KEY || '',
        ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'search-chegg',
        PORT: '3000',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      reservedConcurrentExecutions: 100,
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'CheggApiGateway', {
      restApiName: 'Chegg Elastic Insurance Demo API',
      description: 'API Gateway for Chegg Elastic Insurance Demo',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      proxy: true,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
          },
        },
      ],
    });

    // Add proxy resource to handle all routes
    const proxyResource = this.api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Add health check endpoint
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // Add API documentation endpoint
    const docsResource = this.api.root.addResource('api-docs');
    docsResource.addMethod('GET', lambdaIntegration);
    docsResource.addMethod('OPTIONS', lambdaIntegration);

    // Add claims endpoints
    const claimsResource = this.api.root.addResource('api').addResource('claims');
    claimsResource.addMethod('GET', lambdaIntegration);
    claimsResource.addMethod('OPTIONS', lambdaIntegration);

    // Add security endpoints
    const securityResource = this.api.root.addResource('api').addResource('security');
    securityResource.addMethod('GET', lambdaIntegration);
    securityResource.addMethod('OPTIONS', lambdaIntegration);

    // Add analytics endpoints
    const analyticsResource = this.api.root.addResource('api').addResource('analytics');
    analyticsResource.addMethod('GET', lambdaIntegration);
    analyticsResource.addMethod('OPTIONS', lambdaIntegration);

    // Add AI endpoints
    const aiResource = this.api.root.addResource('api').addResource('ai');
    aiResource.addMethod('GET', lambdaIntegration);
    aiResource.addMethod('POST', lambdaIntegration);
    aiResource.addMethod('OPTIONS', lambdaIntegration);

    // Add ML endpoints
    const mlResource = this.api.root.addResource('api').addResource('ml');
    mlResource.addMethod('GET', lambdaIntegration);
    mlResource.addMethod('POST', lambdaIntegration);
    mlResource.addMethod('OPTIONS', lambdaIntegration);

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: 'CheggApiUrl',
    });

    // Output the Lambda function name
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: 'CheggLambdaFunctionName',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR repository URI',
      exportName: 'CheggEcrRepositoryUri',
    });
  }
}
