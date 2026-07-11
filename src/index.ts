import { getPersonalLinks, addPersonalLink, updatePersonalLink, deletePersonalLink } from './modules/useful-links/personal.js';
import { getWorkLinks, addWorkLink, updateWorkLink, deleteWorkLink } from './modules/useful-links/work.js';
import {
  threeDPrinting,
  addThreeDPrintingLink,
  updateThreeDPrintingLink,
  deleteThreeDPrintingLink,
} from './modules/useful-links/threeDPrinting.js';
import { getNotes, addNote, updateNote, deleteNote } from './modules/useful-links/notes.js';
import {
  TRANSLATE_CATEGORIES,
  getAllTranslations,
  getTranslateCategory,
  addTranslateItem,
  updateTranslateItem,
  deleteTranslateItem,
} from './modules/useful-links/translate.js';
import type { TranslateCategory } from './modules/useful-links/translate.js';

const isTranslateCategory = (value: string): value is TranslateCategory =>
  (TRANSLATE_CATEGORIES as readonly string[]).includes(value);

const LINK_ROUTES: Record<
  string,
  {
    get: () => Promise<unknown>;
    add: (item: any) => Promise<unknown>;
    update: (id: string, updates: any) => Promise<unknown | null>;
    remove: (id: string) => Promise<boolean>;
    requiredFields: string[];
  }
> = {
  personal: {
    get: getPersonalLinks,
    add: addPersonalLink,
    update: updatePersonalLink,
    remove: deletePersonalLink,
    requiredFields: ['name', 'url'],
  },
  work: {
    get: getWorkLinks,
    add: addWorkLink,
    update: updateWorkLink,
    remove: deleteWorkLink,
    requiredFields: ['name', 'url'],
  },
  '3d-printing': {
    get: threeDPrinting,
    add: addThreeDPrintingLink,
    update: updateThreeDPrintingLink,
    remove: deleteThreeDPrintingLink,
    requiredFields: ['name', 'url'],
  },
  notes: {
    get: getNotes,
    add: addNote,
    update: updateNote,
    remove: deleteNote,
    requiredFields: ['title', 'desc'],
  },
};

const TRANSLATE_REQUIRED_FIELDS = ['en', 'ru', 'info'];

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  body: JSON.stringify(body),
});

const notFound = (path: string) => jsonResponse(404, { message: 'Route not found', path });
const itemNotFound = (route: string, id: string) => jsonResponse(404, { message: 'Item not found', route, id });
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
  // Exact segments after "/useful-links/" - substring matching (e.g. path.includes)
  // would let "wood" match a "woodWorkingTools" request.
  const afterPrefix = path.replace(/\/+$/, '').split('/useful-links/')[1] ?? '';
  const [route, itemId] = afterPrefix.split('/');

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

    if (method === 'PATCH') {
      if (!itemId) return badRequest('Missing item id in path');
      const body = parseBody(event);
      if (Object.keys(body).length === 0) return badRequest('No fields to update');

      if (route in LINK_ROUTES) {
        const updated = await LINK_ROUTES[route].update(itemId, body);
        if (!updated) return itemNotFound(route, itemId);
        return jsonResponse(200, updated);
      }

      if (isTranslateCategory(route)) {
        const updated = await updateTranslateItem(route, itemId, body);
        if (!updated) return itemNotFound(route, itemId);
        return jsonResponse(200, updated);
      }

      return notFound(path);
    }

    if (method === 'DELETE') {
      if (!itemId) return badRequest('Missing item id in path');

      if (route in LINK_ROUTES) {
        const deleted = await LINK_ROUTES[route].remove(itemId);
        if (!deleted) return itemNotFound(route, itemId);
        return jsonResponse(200, { message: 'Deleted', id: itemId });
      }

      if (isTranslateCategory(route)) {
        const deleted = await deleteTranslateItem(route, itemId);
        if (!deleted) return itemNotFound(route, itemId);
        return jsonResponse(200, { message: 'Deleted', id: itemId });
      }

      return notFound(path);
    }

    return notFound(path);
  } catch (error: any) {
    return jsonResponse(500, { error: error.message });
  }
};
