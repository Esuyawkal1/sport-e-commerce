import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    imageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  },
);

const Post = mongoose.model('Post', postSchema);

export default Post;
