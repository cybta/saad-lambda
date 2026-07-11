import { getPersonalLinks } from './modules/useful-links/personal.js';
import { getWorkLinks } from './modules/useful-links/work.js';
import { threeDPrinting } from './modules/useful-links/threeDPrinting.js';
import {
  TRANSLATE_CATEGORIES,
  getAllTranslations,
  getTranslateCategory,
} from './modules/useful-links/translate.js';
import type { TranslateCategory } from './modules/useful-links/translate.js';

const isTranslateCategory = (value: string): value is TranslateCategory =>
  (TRANSLATE_CATEGORIES as readonly string[]).includes(value);

export const handler = async (event : any) => {
  // rawPath is for HTTP APIs, path is for REST APIs
  const path = event.rawPath || event.path || '';
  // Exact segment after "/useful-links/" - substring matching (e.g. path.includes)
  // would let "wood" match a "woodWorkingTools" request.
  const route = path.replace(/\/+$/, '').split('/useful-links/')[1] ?? '';

  try {
    let result;

    if (route === 'personal') {
      result = await getPersonalLinks();
    } else if (route === 'work') {
      result = await getWorkLinks();
    } else if (route === '3d-printing') {
      result = await threeDPrinting();
    } else if (route === 'translate') {
      result = await getAllTranslations();
    } else if (isTranslateCategory(route)) {
      result = await getTranslateCategory(route);
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
