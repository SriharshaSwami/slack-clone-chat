import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Channel name must be at most 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description must be at most 200 characters'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    waitingList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
