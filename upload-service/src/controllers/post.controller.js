import * as postService from '../services/post.service.js';

// ---------------------------------------------------------------------------
// POST /api/posts
// ---------------------------------------------------------------------------

/**
 * Handles image upload requests.
 * Expects: multipart/form-data with fields `image` (file) and `caption` (text).
 */
export async function createPost(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { caption } = req.body;

    if (!caption || !caption.trim()) {
      return res.status(400).json({ error: 'Caption is required.' });
    }

    const post = await postService.createPost({
      fileBuffer: req.file.buffer,
      mimetype: req.file.mimetype,
      caption: caption.trim(),
    });

    return res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/posts
// ---------------------------------------------------------------------------

/**
 * Returns all posts, each decorated with a temporary pre-signed S3 URL.
 */
export async function getAllPosts(_req, res, next) {
  try {
    const posts = await postService.getAllPosts();
    return res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/posts/:id
// ---------------------------------------------------------------------------

/**
 * Deletes a post's S3 object and its database record.
 */
export async function deletePost(req, res, next) {
  try {
    const result = await postService.deletePost(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
