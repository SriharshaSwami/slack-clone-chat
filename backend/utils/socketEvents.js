export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Channels
  JOIN_CHANNEL: 'join_channel',
  LEAVE_CHANNEL: 'leave_channel',
  
  // Messages
  NEW_MESSAGE: 'new_message',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  REACTION_UPDATED: 'reaction_updated',
  MESSAGE_PINNED: 'message_pinned',
  
  // Real-time features (New)
  USER_IDENTIFY: 'user:identify',
  USER_TYPING: 'user:typing',
  USER_STOP_TYPING: 'user:stop_typing',
  MESSAGE_READ: 'message:read',
  MESSAGE_STARRED: 'message:starred',
  
  // Threads
  NEW_THREAD_REPLY: 'new_thread_reply',
  
  // Presence
  ONLINE_USERS: 'online_users',
  USER_ONLINE: 'user_online',
  
  // Membership
  MEMBERSHIP_UPDATED: 'membership_updated',

  // Feature specific
  MESSAGE_SEEN: 'message_seen',
  MESSAGE_STARRED: 'message_starred',
};
