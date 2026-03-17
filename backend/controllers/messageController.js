import Message from '../models/Message.js';
import { createMessage, getChannelHistory, getThreadReplies, createThreadReply } from '../services/chatService.js';

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { channelId, text } = req.body;
    const message = await createMessage({
      senderId: req.user._id,
      channelId,
      text,
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// GET /api/messages/:channelId
export const fetchHistory = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit, before } = req.query;
    const messages = await getChannelHistory(channelId, parseInt(limit) || 50, before);
    res.json(messages);
  } catch (error) {
    console.error('Fetch history error:', error.message);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

// PUT /api/messages/:id
export const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.editedHistory.push({
      text: message.text,
      editedAt: new Date(),
    });

    message.text = req.body.text;
    message.isEdited = true;
    await message.save();

    const updated = await Message.findById(message._id).populate('senderId', 'username avatar');
    res.json(updated);
  } catch (error) {
    console.error('Edit message error:', error.message);
    res.status(500).json({ message: 'Server error editing message' });
  }
};

// DELETE /api/messages/:id/soft
export const softDeleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.softDelete();
    res.status(200).json({ message: 'Message soft deleted', id: message._id });
  } catch (error) {
    console.error('Soft delete error:', error.message);
    res.status(500).json({ message: 'Server error soft deleting message' });
  }
};

// DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete message error:', error.message);
    res.status(500).json({ message: 'Server error deleting message' });
  }
};

// POST /api/messages/:id/reactions
export const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    let userHadThisEmoji = false;

    // First, remove user from any existing reactions
    message.reactions.forEach(r => {
      if (r.users.some(u => u.toString() === req.user._id.toString())) {
        if (r.emoji === emoji) {
          userHadThisEmoji = true; // User clicked the same emoji again to toggle it off
        }
        r.users = r.users.filter(u => u.toString() !== req.user._id.toString());
      }
    });

    // Cleanup emoji arrays that are now empty
    message.reactions = message.reactions.filter(r => r.users.length > 0);

    // Add the new reaction if it wasn't a toggle-off
    if (!userHadThisEmoji) {
      const existingEmoji = message.reactions.find((r) => r.emoji === emoji);
      if (existingEmoji) {
        existingEmoji.users.push(req.user._id);
      } else {
        message.reactions.push({ emoji, users: [req.user._id] });
      }
    }

    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Add reaction error:', error.message);
    res.status(500).json({ message: 'Server error adding reaction' });
  }
};

// GET /api/messages/:id/thread
export const fetchThread = async (req, res) => {
  try {
    const replies = await getThreadReplies(req.params.id);
    res.json(replies);
  } catch (error) {
    console.error('Fetch thread error:', error.message);
    res.status(500).json({ message: 'Server error fetching thread' });
  }
};

// POST /api/messages/:id/thread
export const sendThreadReply = async (req, res) => {
  try {
    const reply = await createThreadReply({
      parentMessageId: req.params.id,
      senderId: req.user._id,
      text: req.body.text,
    });
    res.status(201).json(reply);
  } catch (error) {
    console.error('Thread reply error:', error.message);
    res.status(500).json({ message: 'Server error sending thread reply' });
  }
};

// PUT /api/messages/:id/pin
export const togglePinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.togglePin();
    res.json({ message: 'Message pin toggled', isPinned: message.isPinned, channelId: message.channelId });
  } catch (error) {
    console.error('Toggle pin error:', error.message);
    res.status(500).json({ message: 'Server error toggling pin status' });
  }
};

// POST /api/messages/:id/star
export const toggleStarMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message || message.deleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.toggleStar(req.user._id);
    const isStarred = message.starredBy.includes(req.user._id);

    // Broadcast pin/star update if needed (request asked for star event)
    const io = req.app.get('io');
    if (io) {
      io.to(message.channelId.toString()).emit('message_starred', { 
        messageId: message._id, 
        userId: req.user._id,
        isStarred
      });
    }

    res.json({ message: 'Star toggled', id: message._id, isStarred });
  } catch (error) {
    console.error('Toggle star error:', error.message);
    res.status(500).json({ message: 'Server error toggling star' });
  }
};

// POST /api/messages/mark-seen (Bulk)
export const markBulkSeen = async (req, res) => {
  try {
    const { channelId } = req.body;
    const userId = req.user._id;

    // Update all messages in this channel that don't have this user in seenBy
    // and weren't sent by this user
    await Message.updateMany(
      { 
        channelId, 
        senderId: { $ne: userId },
        'seenBy.userId': { $ne: userId }
      },
      { 
        $addToSet: { seenBy: { userId, seenAt: new Date() } },
        $set: { status: 'seen' }
      }
    );

    // Broadcast to the channel that messages were seen by this user
    const io = req.app.get('io');
    if (io) {
      io.to(channelId).emit('message_seen', { channelId, userId });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark bulk seen error:', error.message);
    res.status(500).json({ message: 'Server error marking as seen' });
  }
};

// POST /api/messages/:id/read (Legacy individual, renamed to seen)
export const markSeen = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message || message.deleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.markSeen(req.user._id);
    
    const io = req.app.get('io');
    if (io) {
      io.to(message.channelId.toString()).emit('message_seen', { 
        messageId: message._id, 
        userId: req.user._id,
        channelId: message.channelId
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error.message);
    res.status(500).json({ message: 'Server error marking as read' });
  }
};

// GET /api/messages/stars
export const getStarredMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      starredBy: req.user._id,
      deleted: false
    }).populate('senderId', 'username avatar').sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Get starred error:', error.message);
    res.status(500).json({ message: 'Server error fetching starred messages' });
  }
};
