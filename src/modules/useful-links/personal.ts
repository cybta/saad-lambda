import { getJsonFromS3 } from '../../services/s3Service.js';

export const getPersonalLinks = async () => {
  return await getJsonFromS3('useful-links/personal.json');
};
