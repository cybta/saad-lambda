import { getJsonFromS3, appendJsonItem, updateJsonItem, deleteJsonItem } from '../../services/s3Service.js';

const FILE_PATH = 'useful-links/3d-printing.json';

export const threeDPrinting = async () => {
  return await getJsonFromS3(FILE_PATH);
};

export const addThreeDPrintingLink = async (item: { name: string; url: string }) => {
  return await appendJsonItem(FILE_PATH, 'name', item);
};

export const updateThreeDPrintingLink = async (id: string, updates: Record<string, unknown>) => {
  return await updateJsonItem(FILE_PATH, id, updates);
};

export const deleteThreeDPrintingLink = async (id: string) => {
  return await deleteJsonItem(FILE_PATH, id);
};
