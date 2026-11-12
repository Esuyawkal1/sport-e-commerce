import crypto from 'node:crypto';
import sharp from 'sharp';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3Client.js';
import Post from '../models/post.model.js';

const BUCKET = process.env.AWS_S3_BUCKET_NAME;

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

/**
 * Processes an uploaded image buffer through Sharp, stores the result in S3,
 * then persists a reference document in MongoDB via Mongoose.
 *
 * @param {{ fileBuffer: Buffer, mimetype: string, caption: string }} params
 * @returns {Promise<import('mongoose').Document>} The newly created Post document.
 */
export async function createPost({ fileBuffer, mimetype, caption }) {
  // 1. Resize & normalise in-memory — zero disk writes.
  const processedBuffer = await sharp(fileBuffer)
    .resize(1920, 1080, { fit: 'contain' })
    .toBuffer();

  // 2. Cryptographically random, unguessable S3 object key.
  const imageKey = crypto.randomBytes(32).toString('hex');

  // 3. Stream the processed buffer directly into the private S3 bucket.
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET,
    Key: imageKey,
    Body: processedBuffer,
    ContentType: mimetype,
  });

  await s3Client.send(putCommand);

  // 4. Only persist the DB reference after S3 acknowledges success.
  const post = await Post.create({ imageKey, caption });

  return post;
}

// ---------------------------------------------------------------------------
// READ ALL
// ---------------------------------------------------------------------------

/**
 * Retrieves all Post documents and decorates each with a temporary pre-signed
 * S3 URL that expires after 1 hour (3 600 s).
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAllPosts() {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();

  // Generate fresh pre-signed URLs for every post in parallel.
  const postsWithUrls = await Promise.all(
    posts.map(async (post) => {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET,
        Key: post.imageKey,
      });

      const imageUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

      return { ...post, imageUrl };
    }),
  );

  return postsWithUrls;
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

/**
 * Removes the S3 object first, then drops the MongoDB document.
 * Throws a 404-shaped error when no document matches the given id.
 *
 * @param {string} id  MongoDB ObjectId string.
 * @returns {Promise<{ message: string }>}
 */
export async function deletePost(id) {
  // 1. Resolve the document to extract its S3 key.
  const post = await Post.findById(id).lean();

  if (!post) {
    const err = new Error('Post not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Delete the S3 object before touching the database.
  const deleteCommand = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: post.imageKey,
  });

  await s3Client.send(deleteCommand);

  // 3. Drop the document only after cloud cleanup succeeds.
  await Post.findByIdAndDelete(id);

  return { message: 'Post deleted successfully.' };
}
