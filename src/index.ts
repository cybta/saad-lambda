import type {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { getPersonalLinks } from './modules/useful-links/personal.js';
import { getWorkLinks } from './modules/useful-links/work.js';

export const handler: Handler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
> = async (event) => {
  const path = event.rawPath;

  // In HTTP API (v2), the method is located here:
  const method = event.requestContext.http.method;

  try {
    let result;

    // 1. Check Method
    if (method === 'GET') {
      if (path.includes('/useful-links/personal')) {
        result = await getPersonalLinks();
      } else if (path.includes('/useful-links/work')) {
        result = await getWorkLinks();
      } else {
        return response(404, { message: 'Route not found' });
      }
    }

    // 2. Add POST logic here if needed later
    else if (method === 'POST') {
      // Logic for updating links would go here
      return response(200, { message: 'Post logic not implemented yet' });
    }

    return response(200, result);
  } catch (error: any) {
    return response(500, { error: error.message });
  }
};

const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});
