import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    text: {
      type: String,
      required: function() { return !this.fileUrl; },
      maxlength: [5000, 'Message must be at most 5000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'file', 'image', 'system', 'voice', 'video'],
      default: 'text',
    },
    reactions: [reactionSchema],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedHistory: [
      {
        text: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    seenBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ isPinned: -1, channelId: 1 });
messageSchema.index({ starredBy: 1 });
messageSchema.index({ deleted: 1 });

// Methods
messageSchema.methods.softDelete = function () {
  this.deleted = true;
  this.text = '[Message deleted]';
  return this.save();
};

messageSchema.methods.markSeen = function (userId) {
  if (!this.seenBy.some((r) => r.userId.toString() === userId.toString())) {
    this.seenBy.push({ userId });
    if (this.seenBy.length === 1) {
      this.status = 'seen';
    }
  }
  return this.save();
};

messageSchema.methods.togglePin = function () {
  this.isPinned = !this.isPinned;
  return this.save();
};

messageSchema.methods.toggleStar = function (userId) {
  const index = this.starredBy.indexOf(userId);
  if (index > -1) {
    this.starredBy.splice(index, 1);
  } else {
    this.starredBy.push(userId);
  }
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
