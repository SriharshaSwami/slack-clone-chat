import { SOCKET_EVENTS } from '../utils/socketEvents.js';

// Map: userId → socketId
const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    console.log('🔌 User connected:', socket.id);

    // ── User comes online ──
    socket.on(SOCKET_EVENTS.USER_ONLINE, (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId; // Store on socket for easy access
      io.emit(SOCKET_EVENTS.ONLINE_USERS, Array.from(onlineUsers.keys()));
      console.log(`✅ ${userId} is online`);
    });

    // ── Join a channel room ──
    socket.on(SOCKET_EVENTS.JOIN_CHANNEL, (channelId) => {
      socket.join(channelId);
      console.log(`📺 Socket ${socket.id} joined channel ${channelId}`);
    });

    // ── Leave a channel room ──
    socket.on(SOCKET_EVENTS.LEAVE_CHANNEL, (channelId) => {
      socket.leave(channelId);
    });

    // ── Broadcasters for REST Actions ──
    socket.on('broadcast_new_message', (message) => {
      io.to(message.channelId).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
    });

    socket.on('broadcast_edit_message', (message) => {
      io.to(message.channelId).emit(SOCKET_EVENTS.MESSAGE_EDITED, message);
    });

    socket.on('broadcast_delete_message', (data) => {
      io.to(data.channelId).emit(SOCKET_EVENTS.MESSAGE_DELETED, { messageId: data.messageId });
    });

    socket.on('broadcast_reaction', (data) => {
      io.to(data.channelId).emit(SOCKET_EVENTS.REACTION_UPDATED, { messageId: data.messageId, reactions: data.reactions });
    });

    socket.on('broadcast_pin_message', (data) => {
      io.to(data.channelId).emit(SOCKET_EVENTS.MESSAGE_PINNED, { messageId: data.messageId, isPinned: data.isPinned });
    });

    socket.on('broadcast_thread_reply', (data) => {
      io.emit(SOCKET_EVENTS.NEW_THREAD_REPLY, { parentMessageId: data.parentMessageId, reply: data.reply });
    });

    // ── New Real-time Listeners ──

    // Typing Indicators
    socket.on(SOCKET_EVENTS.USER_TYPING, (data) => {
      socket.to(data.channelId).emit(SOCKET_EVENTS.USER_TYPING, {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, (data) => {
      socket.to(data.channelId).emit(SOCKET_EVENTS.USER_STOP_TYPING, {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    // Read Receipts
    socket.on(SOCKET_EVENTS.MESSAGE_READ, (data) => {
      socket.to(data.channelId).emit(SOCKET_EVENTS.MESSAGE_READ, {
        messageId: data.messageId,
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    socket.on('mark_as_seen', (data) => {
      // Broadcast to channel that this user saw messages
      socket.to(data.channelId).emit(SOCKET_EVENTS.MESSAGE_SEEN, {
        channelId: data.channelId,
        userId: socket.userId
      });
    });

    // Starred Messages
    socket.on(SOCKET_EVENTS.MESSAGE_STARRED, (data) => {
      socket.to(data.channelId).emit(SOCKET_EVENTS.MESSAGE_STARRED, {
        messageId: data.messageId,
        userId: socket.userId,
        isStarred: data.isStarred
      });
    });

    // ── Disconnect ──
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      // Remove user from online map
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit(SOCKET_EVENTS.ONLINE_USERS, Array.from(onlineUsers.keys()));
      console.log('🔌 User disconnected:', socket.id);
    });
  });
};

export default socketHandler;
