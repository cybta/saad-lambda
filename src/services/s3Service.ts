import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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
