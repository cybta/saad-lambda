import { getJsonFromS3, appendJsonItem } from '../../services/s3Service.js';

const FILE_PATH = 'useful-links/3d-printing.json';

export const threeDPrinting = async () => {
  return await getJsonFromS3(FILE_PATH);
};

export const addThreeDPrintingLink = async (item: { name: string; url: string }) => {
  return await appendJsonItem(FILE_PATH, 'name', item);
};
