import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema(
  {
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Reply text is required'],
      maxlength: [5000, 'Reply must be at most 5000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching replies to a parent message
threadSchema.index({ parentMessageId: 1, createdAt: 1 });

const Thread = mongoose.model('Thread', threadSchema);

export default Thread;
