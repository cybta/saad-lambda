import { getJsonFromS3 } from '../../services/s3Service.js';

export const getWorkLinks = async () => {
  return await getJsonFromS3('useful-links/work.json');
};
