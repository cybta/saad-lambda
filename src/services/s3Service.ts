import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { slugify, generateUniqueId } from '../utils/id.js';

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'saad-api';

export const getJsonFromS3 = async (filePath: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
  });

  try {
    const response = await s3.send(command);
    // SDK v3 requires transformToString to read the stream
    const data = await response.Body?.transformToString();
    return data ? JSON.parse(data) : null;
  } catch (error: any) {
    throw error;
  }
};

export const putJsonToS3 = async (filePath: string, data: unknown) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  });

  await s3.send(command);
};

export const appendJsonItem = async (
  filePath: string,
  idSourceField: string,
  item: Record<string, unknown>
) => {
  const items: Array<Record<string, unknown>> = (await getJsonFromS3(filePath)) ?? [];
  const existingIds = new Set(items.map((existing) => String(existing.id)));
  const { id: _ignoredClientId, ...rest } = item;
  const id = generateUniqueId(existingIds, slugify(String(item[idSourceField] ?? '')));

  const newItem = { id, ...rest };
  await putJsonToS3(filePath, [...items, newItem]);
  return newItem;
};

export const updateJsonItem = async (
  filePath: string,
  id: string,
  updates: Record<string, unknown>
) => {
  const items: Array<Record<string, unknown>> = (await getJsonFromS3(filePath)) ?? [];
  const index = items.findIndex((existing) => existing.id === id);
  if (index === -1) return null;

  const { id: _ignoredClientId, ...rest } = updates;
  const updatedItem = { ...items[index], ...rest };
  items[index] = updatedItem;
  await putJsonToS3(filePath, items);
  return updatedItem;
};

export const deleteJsonItem = async (filePath: string, id: string) => {
  const items: Array<Record<string, unknown>> = (await getJsonFromS3(filePath)) ?? [];
  const index = items.findIndex((existing) => existing.id === id);
  if (index === -1) return false;

  items.splice(index, 1);
  await putJsonToS3(filePath, items);
  return true;
};
