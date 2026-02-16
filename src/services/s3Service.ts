import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize client outside the handler for performance
const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'saad-api';

export const getJsonFromS3 = async (filePath: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${filePath}`,
  });

  try {
    const response = await s3Client.send(command);
    const data = await response.Body?.transformToString();
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error fetching ${filePath}:`, error);
    throw error;
  }
};
