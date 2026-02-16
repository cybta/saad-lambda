import { getPersonalLinks } from './modules/useful-links/personal.js';
import { getWorkLinks } from './modules/useful-links/work.js';

export const handler = async (event) => {
  // rawPath is for HTTP APIs, path is for REST APIs
  const path = event.rawPath || event.path || '';

  try {
    let result;

    if (path.includes('/useful-links/personal')) {
      result = await getPersonalLinks();
    } else if (path.includes('/useful-links/work')) {
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
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
