import { getJsonFromS3, appendJsonItem } from '../../services/s3Service.js';

const FILE_PATH = 'useful-links/personal.json';

export const getPersonalLinks = async () => {
  return await getJsonFromS3(FILE_PATH);
};

export const addPersonalLink = async (item: { name: string; url: string }) => {
  return await appendJsonItem(FILE_PATH, 'name', item);
};
