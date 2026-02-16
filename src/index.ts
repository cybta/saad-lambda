// 1. Change the import to V2
import type {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { getPersonalLinks } from './modules/useful-links/personal.js';
import { getWorkLinks } from './modules/useful-links/work.js';

// 2. Update the handler types to V2
export const handler: Handler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
> = async (event) => {
  // 3. Now 'rawPath' will be recognized by TypeScript
  const path = event.rawPath;

  try {
    let result;

    if (path.endsWith('/useful-links/personal')) {
      result = await getPersonalLinks();
    } else if (path.endsWith('/useful-links/work')) {
      result = await getWorkLinks();
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Route not found', path }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message,
      }),
    };
  }
};
