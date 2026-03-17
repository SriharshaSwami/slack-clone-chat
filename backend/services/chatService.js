import Message from '../models/Message.js';
import Thread from '../models/Thread.js';

export const createMessage = async ({ senderId, channelId, text, fileUrl }) => {
  const message = await Message.create({ senderId, channelId, text, fileUrl });
  const doc = await Message.findById(message._id).populate('senderId', 'username avatar').lean();
  return { ...doc, threadReplies: 0 };
};

export const getChannelHistory = async (channelId, limit = 50, before = null) => {
  const query = { channelId, deleted: { $ne: true } };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'username avatar')
    .lean();

  // Count thread replies for each message
  const messageIds = messages.map((m) => m._id);
  const threadCounts = await Thread.aggregate([
    { $match: { parentMessageId: { $in: messageIds } } },
    { $group: { _id: '$parentMessageId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  threadCounts.forEach((tc) => {
    countMap[tc._id.toString()] = tc.count;
  });

  return messages
    .map((m) => ({
      ...m,
      threadReplies: countMap[m._id.toString()] || 0,
    }))
    .reverse(); // Oldest first
};

export const getThreadReplies = async (parentMessageId) => {
  return Thread.find({ parentMessageId })
    .sort({ createdAt: 1 })
    .populate('senderId', 'username avatar')
    .lean();
};

export const createThreadReply = async ({ parentMessageId, senderId, text }) => {
  const reply = await Thread.create({ parentMessageId, senderId, text });
  const doc = await Thread.findById(reply._id).populate('senderId', 'username avatar').lean();
  return { ...doc, threadReplies: 0 };
};
