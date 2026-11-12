import { Router } from 'express';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { createPost, getAllPosts, deletePost } from '../controllers/post.controller.js';

const router = Router();

/**
 * POST   /api/posts  — Upload an image with a caption.
 * GET    /api/posts  — Retrieve all posts (with pre-signed URLs).
 * DELETE /api/posts/:id — Delete a specific post and its S3 object.
 */
router.post('/', uploadSingle, createPost);
router.get('/', getAllPosts);
router.delete('/:id', deletePost);

export default router;
