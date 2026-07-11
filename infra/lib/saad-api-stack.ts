import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

const REST_API_ID = 'wstb35mif9';
const USEFUL_LINKS_RESOURCE_ID = 's1jwz9';
const LAMBDA_ARN = 'arn:aws:lambda:us-east-1:759166090310:function:saad-lambda';
const STAGE_NAME = 'prod';

export class SaadApiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Read-only references to resources created by hand in the console.
    // This stack never owns/modifies these - it only adds new child resources.
    const existingApi = apigateway.RestApi.fromRestApiId(this, 'ExistingApi', REST_API_ID);

    const usefulLinksResource = apigateway.Resource.fromResourceAttributes(this, 'UsefulLinksResource', {
      restApi: existingApi,
      resourceId: USEFUL_LINKS_RESOURCE_ID,
      path: '/useful-links',
    });

    const existingLambda = lambda.Function.fromFunctionAttributes(this, 'ExistingLambda', {
      functionArn: LAMBDA_ARN,
      sameEnvironment: true,
    });

    // New route: /useful-links/3d-printing
    const threeDPrintingResource = usefulLinksResource.addResource('3d-printing');

    const getMethod = threeDPrintingResource.addMethod('GET', new apigateway.LambdaIntegration(existingLambda));

    const corsOptions = threeDPrintingResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'OPTIONS'],
    });

    // A fresh deployment is required to push new routes live on the existing "prod" stage.
    // addToLogicalId ties this Deployment's physical identity to the methods it serves, so
    // future routes added the same way automatically produce a new deployment on `cdk deploy`.
    const deployment = new apigateway.Deployment(this, 'Deployment', { api: existingApi });
    deployment.node.addDependency(getMethod);
    deployment.node.addDependency(corsOptions);
    deployment.addToLogicalId({ method: getMethod.methodId });

    // The one live resource this stack adopts via `cdk import`, so it can flip
    // the "prod" stage over to the new deployment without recreating it.
    const stage = new apigateway.CfnStage(this, 'ProdStage', {
      restApiId: existingApi.restApiId,
      stageName: STAGE_NAME,
      deploymentId: deployment.deploymentId,
      cacheClusterEnabled: false,
      tracingEnabled: false,
    });
    stage.applyRemovalPolicy(RemovalPolicy.RETAIN);
  }
}
