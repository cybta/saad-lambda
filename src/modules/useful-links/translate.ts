import { getJsonFromS3 } from '../../services/s3Service.js';

export const TRANSLATE_CATEGORIES = [
  'electricTools',
  'fasteners',
  'gardeningTools',
  'wood',
  'woodWorkingTools',
] as const;

export type TranslateCategory = (typeof TRANSLATE_CATEGORIES)[number];

export const getTranslateCategory = async (category: TranslateCategory) => {
  return await getJsonFromS3(`useful-links/translate/${category}.json`);
};

export const getAllTranslations = async () => {
  const entries = await Promise.all(
    TRANSLATE_CATEGORIES.map(async (category) => [category, await getTranslateCategory(category)] as const)
  );
  return Object.fromEntries(entries);
};
