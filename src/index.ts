import { getPersonalLinks, addPersonalLink } from './modules/useful-links/personal.js';
import { getWorkLinks, addWorkLink } from './modules/useful-links/work.js';
import { threeDPrinting, addThreeDPrintingLink } from './modules/useful-links/threeDPrinting.js';
import {
  TRANSLATE_CATEGORIES,
  getAllTranslations,
  getTranslateCategory,
  addTranslateItem,
} from './modules/useful-links/translate.js';
import type { TranslateCategory } from './modules/useful-links/translate.js';

const isTranslateCategory = (value: string): value is TranslateCategory =>
  (TRANSLATE_CATEGORIES as readonly string[]).includes(value);

const LINK_ROUTES: Record<
  string,
  { get: () => Promise<unknown>; add: (item: any) => Promise<unknown>; requiredFields: string[] }
> = {
  personal: { get: getPersonalLinks, add: addPersonalLink, requiredFields: ['name', 'url'] },
  work: { get: getWorkLinks, add: addWorkLink, requiredFields: ['name', 'url'] },
  '3d-printing': { get: threeDPrinting, add: addThreeDPrintingLink, requiredFields: ['name', 'url'] },
};

const TRANSLATE_REQUIRED_FIELDS = ['en', 'ru', 'info'];

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  body: JSON.stringify(body),
});

const notFound = (path: string) => jsonResponse(404, { message: 'Route not found', path });
const badRequest = (message: string) => jsonResponse(400, { message });

const missingFields = (fields: string[], body: Record<string, unknown>) =>
  fields.filter((field) => !body?.[field]);

const parseBody = (event: any): Record<string, unknown> => {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(raw);
};

export const handler = async (event: any) => {
  // rawPath is for HTTP APIs, path is for REST APIs
  const path = event.rawPath || event.path || '';
  const method = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
  // Exact segment after "/useful-links/" - substring matching (e.g. path.includes)
  // would let "wood" match a "woodWorkingTools" request.
  const route = path.replace(/\/+$/, '').split('/useful-links/')[1] ?? '';

  try {
    if (method === 'GET') {
      if (route === 'translate') {
        return jsonResponse(200, await getAllTranslations());
      }
      if (route in LINK_ROUTES) {
        return jsonResponse(200, await LINK_ROUTES[route].get());
      }
      if (isTranslateCategory(route)) {
        return jsonResponse(200, await getTranslateCategory(route));
      }
      return notFound(path);
    }

    if (method === 'POST') {
      const body = parseBody(event);

      if (route in LINK_ROUTES) {
        const { add, requiredFields } = LINK_ROUTES[route];
        const missing = missingFields(requiredFields, body);
        if (missing.length) return badRequest(`Missing required field(s): ${missing.join(', ')}`);
        return jsonResponse(201, await add(body));
      }

      if (isTranslateCategory(route)) {
        const missing = missingFields(TRANSLATE_REQUIRED_FIELDS, body);
        if (missing.length) return badRequest(`Missing required field(s): ${missing.join(', ')}`);
        return jsonResponse(201, await addTranslateItem(route, body as { en: string; ru: string; info: string }));
      }

      return notFound(path);
    }

    return notFound(path);
  } catch (error: any) {
    return jsonResponse(500, { error: error.message });
  }
};
