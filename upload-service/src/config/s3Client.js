import { S3Client } from '@aws-sdk/client-s3';

/**
 * Singleton S3 client instance.
 * Credentials and region are read exclusively from environment variables
 * so no secrets are ever hard-coded in source.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3Client;
