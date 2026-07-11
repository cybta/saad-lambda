import { getJsonFromS3, appendJsonItem, updateJsonItem, deleteJsonItem } from '../../services/s3Service.js';

const FILE_PATH = 'useful-links/work.json';

export const getWorkLinks = async () => {
  return await getJsonFromS3(FILE_PATH);
};

export const addWorkLink = async (item: { name: string; url: string }) => {
  return await appendJsonItem(FILE_PATH, 'name', item);
};

export const updateWorkLink = async (id: string, updates: Record<string, unknown>) => {
  return await updateJsonItem(FILE_PATH, id, updates);
};

export const deleteWorkLink = async (id: string) => {
  return await deleteJsonItem(FILE_PATH, id);
};
