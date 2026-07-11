import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

const REST_API_ID = 'wstb35mif9';
const USEFUL_LINKS_RESOURCE_ID = 's1jwz9';
const PERSONAL_RESOURCE_ID = 'scg2fp';
const WORK_RESOURCE_ID = '2rd3cj';
const LAMBDA_ARN = 'arn:aws:lambda:us-east-1:759166090310:function:saad-lambda';
const LAMBDA_ROLE_ARN = 'arn:aws:iam::759166090310:role/service-role/saad-lambda-role-lcgbjgdn';
const STAGE_NAME = 'prod';

const TRANSLATE_CATEGORIES = ['electricTools', 'fasteners', 'gardeningTools', 'wood', 'woodWorkingTools'];

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

    // A single wildcard permission for the whole API, instead of apigateway.LambdaIntegration's
    // default of two Lambda::Permission statements per method (one per stage + one for the
    // console "Test" button). That default blows past the 20KB Lambda resource-policy size
    // limit once you have more than ~15 methods. One statement covers all current and future
    // routes/methods/stages on this API.
    existingLambda.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: existingApi.arnForExecuteApi(),
    });
    const lambdaIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.AWS_PROXY,
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${existingLambda.functionArn}/invocations`,
    });

    // Writes to S3 now go through the Lambda's own IAM permission rather than the
    // bucket's public write grant (being locked down separately). Grant is scoped to
    // the useful-links/ prefix only.
    const existingLambdaRole = iam.Role.fromRoleArn(this, 'ExistingLambdaRole', LAMBDA_ROLE_ARN, {
      mutable: true,
    });
    existingLambdaRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject'],
        resources: ['arn:aws:s3:::saad-api/useful-links/*'],
      })
    );

    // A fresh deployment is required to push new routes live on the existing "prod" stage.
    // addToLogicalId ties this Deployment's physical identity to the methods it serves, so
    // adding a route via addRoute below automatically produces a new deployment on `cdk deploy`.
    const deployment = new apigateway.Deployment(this, 'Deployment', { api: existingApi });

    // Edit/delete a single item by id: /useful-links/{route}/{id}
    const addItemRoutes = (resource: apigateway.IResource) => {
      const itemResource = resource.addResource('{id}');
      const patchMethod = itemResource.addMethod('PATCH', lambdaIntegration, { apiKeyRequired: true });
      const deleteMethod = itemResource.addMethod('DELETE', lambdaIntegration, { apiKeyRequired: true });
      deployment.node.addDependency(patchMethod);
      deployment.node.addDependency(deleteMethod);
      deployment.addToLogicalId({ method: patchMethod.methodId });
      deployment.addToLogicalId({ method: deleteMethod.methodId });

      const corsOptions = itemResource.addCorsPreflight({
        allowOrigins: ['*'],
        allowMethods: ['PATCH', 'DELETE', 'OPTIONS'],
      });
      deployment.node.addDependency(corsOptions);
    };

    const addRoute = (pathPart: string, options: { post?: boolean } = {}) => {
      const resource = usefulLinksResource.addResource(pathPart);
      const getMethod = resource.addMethod('GET', lambdaIntegration);
      deployment.node.addDependency(getMethod);
      deployment.addToLogicalId({ method: getMethod.methodId });

      const corsAllowMethods = ['GET', 'OPTIONS'];
      if (options.post) {
        const postMethod = resource.addMethod('POST', lambdaIntegration, { apiKeyRequired: true });
        deployment.node.addDependency(postMethod);
        deployment.addToLogicalId({ method: postMethod.methodId });
        corsAllowMethods.splice(1, 0, 'POST');

        addItemRoutes(resource);
      }

      const corsOptions = resource.addCorsPreflight({
        allowOrigins: ['*'],
        allowMethods: corsAllowMethods,
      });
      deployment.node.addDependency(corsOptions);
    };

    // POST-enabled: a single JSON array backs each of these directly.
    addRoute('3d-printing', { post: true });
    addRoute('notes', { post: true });
    for (const category of TRANSLATE_CATEGORIES) {
      addRoute(category, { post: true });
    }
    // GET-only: /useful-links/translate combines the 5 category files above, so
    // there's no single file to append to (and no single item to PATCH/DELETE either).
    addRoute('translate');

    // personal/work resources+GET+OPTIONS remain manually-managed (per the minimal-import
    // strategy) - only the new POST/{id} methods are added here, same additive pattern as addRoute.
    const addWriteMethods = (constructIdPrefix: string, resourceId: string, path: string) => {
      const resource = apigateway.Resource.fromResourceAttributes(this, `${constructIdPrefix}Resource`, {
        restApi: existingApi,
        resourceId,
        path,
      });
      const postMethod = resource.addMethod('POST', lambdaIntegration, { apiKeyRequired: true });
      deployment.node.addDependency(postMethod);
      deployment.addToLogicalId({ method: postMethod.methodId });

      addItemRoutes(resource);
    };

    addWriteMethods('Personal', PERSONAL_RESOURCE_ID, '/useful-links/personal');
    addWriteMethods('Work', WORK_RESOURCE_ID, '/useful-links/work');

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

    const apiKey = new apigateway.CfnApiKey(this, 'WriteApiKey', {
      enabled: true,
      name: 'saad-api-write-key',
    });

    const usagePlan = new apigateway.CfnUsagePlan(this, 'WriteUsagePlan', {
      usagePlanName: 'saad-api-write-plan',
      apiStages: [{ apiId: existingApi.restApiId, stage: STAGE_NAME }],
    });
    usagePlan.node.addDependency(stage);

    new apigateway.CfnUsagePlanKey(this, 'WriteUsagePlanKey', {
      keyId: apiKey.ref,
      keyType: 'API_KEY',
      usagePlanId: usagePlan.ref,
    });

    new CfnOutput(this, 'WriteApiKeyId', {
      value: apiKey.ref,
      description: 'Fetch the actual key value with: aws apigateway get-api-key --api-key <this> --include-value --query value --output text',
    });
  }
}
