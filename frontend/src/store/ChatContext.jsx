import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { channelAPI, messageAPI, userAPI } from '../services/api.js';
import socket from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  
  const [channels, setChannels]             = useState([]);
  const [activeChannel, setActiveChannel]   = useState(null);
  const [activeDM, setActiveDM]             = useState(null);
  const [messages, setMessages]             = useState({});
  const [allUsers, setAllUsers]             = useState([]);
  const [dmConversations, setDmConversations] = useState([]);
  const [dmMessages, setDmMessages]         = useState({});
  const [threadReplies, setThreadReplies]   = useState({});
  const [activeThread, setActiveThread]     = useState(null);
  const [typingUsers, setTypingUsers]       = useState({});
  const [onlineUsers, setOnlineUsers]       = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);

  // LOAD DATA
  const refreshChannels = useCallback(async () => {
    if (!user) return;
    try {
      const [loadedChannels, loadedUsers] = await Promise.all([
        channelAPI.list(),
        userAPI.list(),
      ]);
      setChannels(loadedChannels);
      setAllUsers(loadedUsers);

      const dms = loadedChannels.filter(c => c.isPrivate && c.isMember && c.name?.startsWith('dm-'));
      const currentUserId = user._id || user.id;
      const formattedDMs = dms.map(dm => {
        const other = dm.members.find(m => m._id !== currentUserId);
        return {
          id: dm._id,
          participantIds: dm.members.map(m => m._id),
          participantNames: dm.members.map(m => m.username),
          name: other ? other.username : 'Unknown', 
        };
      });
      setDmConversations(formattedDMs);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [user]);

  // Fetch initial data exactly once when user logs in
  useEffect(() => {
    if (user) {
      // Connect Socket
      socket.connect();
      socket.emit('user_online', user._id || user.id);
      
      refreshChannels();

      // Setup global socket listeners
      socket.on('online_users', (users) => setOnlineUsers(users));
      
      socket.on('new_thread_reply', ({ parentMessageId, reply }) => {
        setThreadReplies(prev => ({
          ...prev,
          [parentMessageId]: [...(prev[parentMessageId] || []), reply],
        }));
      });

      socket.on('membership_updated', ({ userId, channelId, status }) => {
        const currentUserId = user._id || user.id;
        if (userId === currentUserId) {
          refreshChannels();
        }
      });

      // Load starred messages
      messageAPI.fetchStarred().then(setStarredMessages).catch(console.error);
    } else {
      socket.disconnect();
    }

    return () => {
      socket.off('online_users');
      socket.off('new_thread_reply');
      socket.off('membership_updated');
    };
  }, [user, refreshChannels]);

  useEffect(() => {
    const channelId = activeChannel?._id || activeDM;
    if (channelId) {
      messageAPI.fetch(channelId).then((history) => {
        if (activeChannel) {
          setMessages(prev => ({ ...prev, [channelId]: history }));
        } else {
          setDmMessages(prev => ({ ...prev, [channelId]: history }));
        }
      }).catch(console.error);

      // Join socket room
      socket.emit('join_channel', channelId);

      // Setup room-specific listeners
      const onNewMsg = (msg) => {
        if (activeChannel) {
          setMessages(prev => ({ ...prev, [channelId]: [...(prev[channelId] || []), msg] }));
        } else {
          setDmMessages(prev => ({ ...prev, [channelId]: [...(prev[channelId] || []), msg] }));
        }
      };
      
      const onMsgEdited = (msg) => {
        const updater = prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(m => m._id === msg._id ? msg : m)
        });
        if (activeChannel) setMessages(updater); else setDmMessages(updater);
      };

      const onMsgDeleted = ({ messageId }) => {
        const updater = prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).filter(m => m._id !== messageId)
        });
        if (activeChannel) setMessages(updater); else setDmMessages(updater);
      };

      const onReactionUpdated = ({ messageId, reactions }) => {
        const updater = prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(m => m._id === messageId ? { ...m, reactions } : m)
        });
        if (activeChannel) setMessages(updater); else setDmMessages(updater);
      };

      const onMsgPinned = ({ messageId, isPinned }) => {
        const updater = prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(m => m._id === messageId ? { ...m, isPinned } : m)
        });
        if (activeChannel) setMessages(updater); else setDmMessages(updater);
      };

      const onMsgStarred = ({ messageId, userId, isStarred }) => {
        // Update local message search/list if needed
        const updater = prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(m => m._id === messageId ? { ...m, starredBy: isStarred ? [...(m.starredBy || []), userId] : (m.starredBy || []).filter(id => id !== userId) } : m)
        });
        if (activeChannel) setMessages(updater); else setDmMessages(updater);
        
        // Update starred list if it's the current user
        if (userId === (user._id || user.id)) {
          messageAPI.fetchStarred().then(setStarredMessages).catch(console.error);
        }
      };

      const onMsgSeen = ({ channelId: seenChId, userId }) => {
        if (seenChId !== channelId) return;
        const updater = prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(m => {
            if (m.senderId?._id === (user._id || user.id) || m.senderId === (user._id || user.id)) {
               // If I am the sender, mark it as seen by the other user
               return { ...m, status: 'seen', seenBy: [...(m.seenBy || []), { userId, seenAt: new Date() }] };
            }
            return m;
          })
        });
        if (activeChannel) setMessages(updater); else setDmMessages(updater);
      };

      socket.on('new_message', onNewMsg);
      socket.on('message_edited', onMsgEdited);
      socket.on('message_deleted', onMsgDeleted);
      socket.on('reaction_updated', onReactionUpdated);
      socket.on('message_pinned', onMsgPinned);
      socket.on('message_starred', onMsgStarred);
      socket.on('message_seen', onMsgSeen);

      return () => {
        socket.emit('leave_channel', channelId);
        socket.off('new_message', onNewMsg);
        socket.off('message_edited', onMsgEdited);
        socket.off('message_deleted', onMsgDeleted);
        socket.off('reaction_updated', onReactionUpdated);
        socket.off('message_pinned', onMsgPinned);
        socket.off('message_starred', onMsgStarred);
        socket.off('message_seen', onMsgSeen);
      };
    }
  }, [activeChannel, activeDM]);

  // Load thread history when activated
  useEffect(() => {
    if (activeThread) {
      messageAPI.fetchThread(activeThread._id || activeThread.id).then((history) => {
        setThreadReplies(prev => ({ ...prev, [activeThread._id || activeThread.id]: history }));
      }).catch(console.error);
    }
  }, [activeThread]);

  /* ── Actions ── */
  const createChannel = useCallback(async (data) => {
    const newChan = await channelAPI.create(data);
    await refreshChannels();
    return newChan;
  }, [refreshChannels]);

  const removeChannel = useCallback(async (channelId) => {
    await channelAPI.delete(channelId);
    if (activeChannel?._id === channelId) setActiveChannel(null);
    if (activeDM === channelId) setActiveDM(null);
    await refreshChannels();
  }, [refreshChannels, activeChannel, activeDM]);

  const joinChannel = useCallback(async (channelId) => {
    await channelAPI.requestJoin(channelId);
    await refreshChannels();
  }, [refreshChannels]);

  const sendMessage = useCallback(async (channelId, text, senderName, senderId) => {
    try {
      const msg = await messageAPI.send({ channelId, text });
      socket.emit('broadcast_new_message', msg);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  }, []);

  const editMessage = useCallback(async (channelId, messageId, newText) => {
    try {
      const updatedMsg = await messageAPI.edit(messageId, { text: newText });
      socket.emit('broadcast_edit_message', updatedMsg);
    } catch (e) {
      console.error('Failed to edit message', e);
    }
  }, []);

  const deleteMessage = useCallback(async (channelId, messageId) => {
    try {
      await messageAPI.delete(messageId);
      socket.emit('broadcast_delete_message', { channelId, messageId });
    } catch (e) {
      console.error('Failed to delete message', e);
    }
  }, []);

  const addReaction = useCallback(async (channelId, messageId, emoji, userId) => {
    try {
      const updatedMsg = await messageAPI.addReaction(messageId, emoji);
      socket.emit('broadcast_reaction', { channelId, messageId: updatedMsg._id, reactions: updatedMsg.reactions });
    } catch (e) {
      console.error('Failed to add reaction', e);
    }
  }, []);

  const togglePinMessage = useCallback(async (channelId, messageId) => {
    try {
      const { isPinned } = await messageAPI.togglePin(messageId);
      socket.emit('broadcast_pin_message', { channelId, messageId, isPinned });
    } catch (e) {
      console.error('Failed to toggle pin', e);
    }
  }, []);

  const toggleStarMessage = useCallback(async (channelId, messageId) => {
    try {
      const { isStarred } = await messageAPI.toggleStar(messageId);
      // Backend already broadcasts message_starred but we update local state for list
      // The onMsgStarred listener will handle refreshing the starredMessages list
    } catch (e) {
      console.error('Failed to toggle star', e);
    }
  }, []);

  const markAsSeen = useCallback(async (channelId) => {
    try {
      await messageAPI.markBulkSeen(channelId);
      socket.emit('mark_as_seen', { channelId });
    } catch (e) {
      console.error('Failed to mark as seen', e);
    }
  }, []);

  const sendDMMessage = useCallback(async (dmId, text, senderName, senderId) => {
    try {
      const msg = await messageAPI.send({ channelId: dmId, text });
      socket.emit('broadcast_new_message', msg);
    } catch (e) {
      console.error('Failed to send DM', e);
    }
  }, []);

  const sendThreadReply = useCallback(async (parentId, text, senderName, senderId) => {
    try {
      const reply = await messageAPI.replyThread(parentId, text);
      socket.emit('broadcast_thread_reply', { parentMessageId: parentId, reply });
    } catch (e) {
      console.error('Failed to send thread reply', e);
    }
  }, []);

  const value = {
    channels, setChannels,
    activeChannel, setActiveChannel,
    activeDM, setActiveDM,
    messages,
    dmConversations, setDmConversations, dmMessages,
    threadReplies, activeThread, setActiveThread,
    typingUsers, setTypingUsers,
    onlineUsers,
    allUsers, // Expose user list for creating DMs
    refreshChannels, createChannel, removeChannel, joinChannel,
    sendMessage, editMessage, deleteMessage, addReaction, togglePinMessage,
    toggleStarMessage, markAsSeen,
    starredMessages,
    sendDMMessage, sendThreadReply,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

export default ChatContext;
