import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useChat } from '../../store/ChatContext';
import Message from '../Message/Message';
import EmojiPicker from 'emoji-picker-react';
import './ChatWindow.css';

const ChatWindow = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const {
    activeChannel, activeDM, dmConversations,
    messages, dmMessages,
    sendMessage, sendDMMessage, sendFileMessage,
    editMessage, deleteMessage, deleteMessageForMe, addReaction, togglePinMessage,
    setActiveThread, toggleStarMessage, markAsSeen, starredMessages
  } = useChat();

  const [text, setText] = useState('');
  const [editingMsg, setEditingMsg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [rightView, setRightView] = useState(null); // 'members', 'pinned', 'search', 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const bottomRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const isChannel = !!activeChannel;
  const isDM      = !!activeDM;
  
  // activeChannel is a full object, activeDM is a string ID!
  const chatId    = isChannel ? activeChannel?._id : activeDM;
  const chatMsgs  = isChannel ? (messages[chatId] || []) : (dmMessages[chatId] || []);
  
  // Find DM name if it's a DM
  const currentDM = dmConversations.find(dm => dm.id === activeDM);
  const chatName  = isChannel ? activeChannel?.name : currentDM?.name || 'Chat';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // Mark as seen when entering a channel or when new messages arrive
  useEffect(() => {
    if (chatId) {
      markAsSeen(chatId);
    }
  }, [chatId, chatMsgs.length, markAsSeen]);
  
  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close right view on channel switch
  useEffect(() => {
    setRightView(null);
  }, [activeChannel, activeDM]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    if (editingMsg) {
      editMessage(chatId, editingMsg._id, text.trim());
      setEditingMsg(null);
    } else if (selectedFile) {
      setIsUploading(true);
      try {
        await sendFileMessage(chatId, selectedFile, text.trim(), isDM);
      } catch (err) {
        alert(err.message || 'Error uploading file');
      } finally {
        setIsUploading(false);
      }
    } else if (isChannel) {
      sendMessage(chatId, text.trim(), user.username, user._id);
    } else if (isDM) {
      sendDMMessage(chatId, text.trim(), user.username, user._id);
    }
    
    setText('');
    setSelectedFile(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };



  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setText(msg.text);
  };

  const handleDelete = (msgId) => {
    deleteMessage(chatId, msgId); // Works for both channel and DM since backend groups them
  };

  const handleDeleteForMe = (msgId) => {
    deleteMessageForMe(chatId, msgId);
  };

  const handleReaction = (msgId, emoji) => {
    addReaction(chatId, msgId, emoji, user._id);
  };

  const onEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji);
  };

  const toggleRightView = (view) => {
    setRightView(prev => prev === view ? null : view);
  };

  if (!activeChannel && !activeDM) {
    return (
      <div className="chat-window chat-empty">
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <h3>Welcome to Sleek</h3>
          <p>Select a channel or conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-window ${rightView ? 'has-sidebar' : ''}`}>
      {/* Main Chat Area */}
      <div className="cw-main">
        {/* Header */}
        <div className="cw-header">
          <div className="cw-header-left">
            <button className="cw-hamburger-btn" onClick={toggleSidebar}>☰</button>
            <span className="cw-icon">{isChannel ? (activeChannel.isPrivate ? '🔒' : '#') : '●'}</span>
            <h3 className="cw-title">{chatName}</h3>
            {isChannel && activeChannel.description && (
              <span className="cw-topic">| {activeChannel.description}</span>
            )}
          </div>
          <div className="cw-header-right">
            {isChannel && (
              <button className={`cw-hbtn ${rightView === 'members' ? 'active' : ''}`} onClick={() => toggleRightView('members')}>Members</button>
            )}
            <button className={`cw-hbtn ${rightView === 'pinned' ? 'active' : ''}`} onClick={() => toggleRightView('pinned')}>Pinned</button>
            <button className={`cw-hbtn ${rightView === 'starred' ? 'active' : ''}`} onClick={() => toggleRightView('starred')}>Starred</button>
            <button className={`cw-hbtn ${rightView === 'search' ? 'active' : ''}`} onClick={() => toggleRightView('search')}>Search</button>
          </div>
        </div>

        {/* Messages */}
        <div className="cw-messages">
          <div className="cw-messages-spacer" />
          {chatMsgs.length === 0 && (
            <div className="cw-no-messages">Start a conversation in {isChannel ? '#' : ''}{chatName} 💬</div>
          )}
          {chatMsgs.map(msg => (
            <Message
              key={msg._id}
              message={{
                ...msg,
                // Normalize sender formats between mock and api
                senderId: msg.senderId?._id || msg.senderId,
                senderName: msg.senderId?.username || msg.senderName,
                timestamp: msg.createdAt || msg.timestamp,
                updatedAt: msg.updatedAt
              }}
              currentUserId={user?.id || user?._id}
              channelMembersCount={isChannel ? (activeChannel?.members?.length || 0) : 2}
              onReaction={handleReaction}
              onThreadOpen={(m) => setActiveThread(m)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDeleteForMe={handleDeleteForMe}
              onPin={(msgId) => togglePinMessage(chatId, msgId)}
              onStar={(msgId) => toggleStarMessage(chatId, msgId)}
            />
          ))}
          <div ref={bottomRef} />
        </div>

      {/* Input */}
      <div className="cw-input-wrapper">
        {editingMsg && (
          <div className="cw-editing-bar">
            <span>Editing message</span>
            <button onClick={() => { setEditingMsg(null); setText(''); }}>Cancel</button>
          </div>
        )}
        {selectedFile && (
          <div className="cw-editing-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>📎 {selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)}>✕</button>
          </div>
        )}
        <form onSubmit={handleSend} className="cw-input-box">
          <textarea
            className="cw-textarea"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isUploading}
            placeholder={isUploading ? 'Uploading file...' : `Message ${isChannel ? '#' + chatName : chatName}`}
          />
          <div className="cw-toolbar">
            <div className="cw-toolbar-left" style={{ position: 'relative' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    alert('File size exceeds 10MB limit');
                    return;
                  }
                  setSelectedFile(file);
                }} 
              />
              <button 
                type="button" 
                className="tb-btn" 
                title="Attach file (Max 10MB)" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >📎</button>
              <button 
                type="button" 
                className={`tb-btn ${showEmojiPicker ? 'active' : ''}`} 
                title="Emoji"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
              {!isDM && (
                <button type="button" className="tb-btn" title="Mention" onClick={() => setText(prev => prev + '@')}>@</button>
              )}

              {showEmojiPicker && (
                <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: 'calc(100% + 20px)', left: 0, zIndex: 9999 }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                </div>
              )}
            </div>
            <button type="submit" className="send-btn" disabled={(!text.trim() && !selectedFile) || isUploading}>➤</button>
          </div>
        </form>
      </div>
      </div> {/* End cw-main */}

      {/* Right Sidebar */}
      {rightView && (
        <div className="cw-sidebar">
          <div className="cw-sidebar-header">
            <h4>{
              rightView === 'members' ? 'Members' : 
              rightView === 'search' ? 'Search' : 
              rightView === 'starred' ? 'Starred' :
              'Pinned'
            }</h4>
            <button className="close-btn" onClick={() => setRightView(null)}>✕</button>
          </div>
          <div className="cw-sidebar-content">
            {rightView === 'members' && activeChannel?.members?.map(m => (
              <div key={m._id || m.id} className="cw-member-item">
                <div className="cw-member-avatar" style={{ background: '#'+(Math.random()*0xFFFFFF<<0).toString(16) }}>
                  {m.username[0].toUpperCase()}
                </div>
                <span>{m.username}</span>
              </div>
            ))}
            {rightView === 'pinned' && chatMsgs.filter(m => m.isPinned).length === 0 && (
              <div className="cw-sidebar-empty">No pinned messages</div>
            )}
            {rightView === 'pinned' && chatMsgs.filter(m => m.isPinned).map(msg => (
              <div key={msg._id} className="cw-sidebar-message">
                <p><strong>{msg.senderId?.username || msg.senderName}</strong> <span style={{fontSize:'10px', color:'#666'}}>{new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></p>
                <p>{msg.text}</p>
                <button className="unpin-btn" onClick={() => togglePinMessage(chatId, msg._id)}>Unpin</button>
              </div>
            ))}
            {rightView === 'starred' && starredMessages.length === 0 && (
              <div className="cw-sidebar-empty">No starred messages</div>
            )}
            {rightView === 'starred' && starredMessages.map(msg => (
              <div key={msg._id} className="cw-sidebar-message">
                <p><strong>{msg.senderId?.username || msg.senderName}</strong> <span style={{fontSize:'10px', color:'#666'}}>{new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></p>
                <p>{msg.text}</p>
                <button className="unpin-btn" onClick={() => toggleStarMessage(msg.channelId, msg._id)}>Unstar</button>
              </div>
            ))}
            {rightView === 'search' && (
              <div style={{ padding: '0 20px 10px' }}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder={`Search in ${chatName}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--chat-border)', outline: 'none' }}
                />
              </div>
            )}
            {rightView === 'search' && !searchQuery && (
              <div className="cw-sidebar-empty">Type to search for messages</div>
            )}
            {rightView === 'search' && searchQuery && chatMsgs.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="cw-sidebar-empty">No results found for "{searchQuery}"</div>
            )}
            {rightView === 'search' && searchQuery && chatMsgs.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase())).map(msg => (
              <div key={msg._id} className="cw-sidebar-message">
                <p><strong>{msg.senderId?.username || msg.senderName}</strong> <span style={{fontSize:'10px', color:'#666'}}>{new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></p>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
