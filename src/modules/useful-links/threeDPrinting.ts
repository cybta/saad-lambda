import { getJsonFromS3 } from '../../services/s3Service.js';

export const threeDPrinting = async () => {
  return await getJsonFromS3('useful-links/3d-printing.json');
};
