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

  try {
    let result;

    // Routing logic
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Crucial for frontend access
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Lambda Runtime Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        details: error.message,
      }),
    };
  }
};
