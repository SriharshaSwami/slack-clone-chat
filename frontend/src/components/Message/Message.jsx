import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './Message.css';

const AVATAR_COLORS = ['#E01E5A', '#36C5F0', '#2EB67D', '#ECB22E', '#6B2FA0', '#E8912D', '#4A154B', '#1264A3'];

function getColor(name) {
  if (!name) return '#CCC';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '👀'];

const Message = ({ message, onReaction, onThreadOpen, onEdit, onDelete, onDeleteForMe, onPin, onStar, currentUserId, channelMembersCount }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const pickerRef = useRef(null);

  const isOwn = String(message.senderId) === String(currentUserId);
  const isStarred = message.starredBy?.some(id => String(id) === String(currentUserId));
  const msgId = message._id || message.id;

  if (message.deletedFor?.some(id => String(id) === String(currentUserId))) {
    return null;
  }

  // Read status logic
  const seenByOthersCount = new Set(
    message.seenBy?.filter(s => String(s.userId) !== String(message.senderId)).map(s => String(s.userId))
  ).size;
  
  // Exclude the sender themselves from the required count
  const requiredSeenCount = Math.max(1, (channelMembersCount || 2) - 1);
  const allSeen = seenByOthersCount >= requiredSeenCount;
  const isDelivered = message.status === 'delivered' || message.status === 'seen' || seenByOthersCount > 0;

  let statusIcon = '✓';
  let statusColor = '#888';

  if (allSeen) {
    statusIcon = '✓✓';
    statusColor = '#36C5F0'; // Blue
  } else if (isDelivered) {
    statusIcon = '✓✓';
    statusColor = '#888'; // Gray double tick
  } else {
    statusIcon = '✓';
    statusColor = '#888'; // Gray single tick
  }

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    if (lightboxSrc) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxSrc]);

  const handleEmojiClick = (emojiObject) => {
    onReaction?.(msgId, emojiObject.emoji);
    setShowPicker(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className={`message-item ${message.isPinned ? 'pinned' : ''}`}>
      <div className="msg-avatar" style={{ background: getColor(message.senderName) }}>
        {(message.senderName || '?')[0].toUpperCase()}
      </div>
      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-sender">{message.senderName}</span>
          <span className="msg-time">{formatTime(message.timestamp)}</span>
          {message.isEdited && (
            <span
              className="msg-edited"
              title={`Last edited: ${formatTime(message.updatedAt || message.timestamp)}`}
            >
              (edited)
            </span>
          )}
          {message.isPinned && (
            <span className="msg-pinned-badge" title="Pinned message">📌Pinned</span>
          )}
          {isStarred && (
            <span className="msg-starred-badge" title="Starred message">⭐Starred</span>
          )}
          
          {/* Status ticks for my messages */}
          {isOwn && (
            <span className="msg-status" style={{ color: statusColor, fontSize: '10px', marginLeft: 'auto' }} title={message.status}>
              {statusIcon}
            </span>
          )}
        </div>
        {message.text && <div className="msg-text">{message.text}</div>}

        {message.fileUrl && (
          <div className="msg-attachment">
            {message.type === 'image' && (
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Attachment'}
                className="msg-image"
                onClick={() => setLightboxSrc(message.fileUrl)}
                title="Click to view full size"
              />
            )}
            {message.type === 'video' && (
              <video src={message.fileUrl} controls className="msg-video" />
            )}
            {message.type === 'voice' && (
              <audio src={message.fileUrl} controls className="msg-audio" />
            )}
            {message.type === 'file' && (
              <div className="msg-file-card">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="file-name">{message.fileName || 'Download File'}</a>
                  <span className="file-size">{message.fileSize ? (message.fileSize / 1024).toFixed(2) + ' KB' : ''}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Lightbox */}
        {lightboxSrc && (
          <div className="msg-lightbox-overlay" onClick={() => setLightboxSrc(null)}>
            <button className="msg-lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
            <img
              src={lightboxSrc}
              alt="Full size preview"
              className="msg-lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}


        {/* Message Actions: Edit, Delete, Reply */}
        <div className="msg-inline-actions">
          {isOwn && (
            <>
              <button className="inline-action-btn" onClick={() => onEdit?.(message)}>Edit</button>
              <button className="inline-action-btn delete" onClick={() => onDelete?.(msgId)}>Delete</button>
            </>
          )}
          {!isOwn && message.fileUrl && (
            <button className="inline-action-btn delete" onClick={() => onDeleteForMe?.(msgId)}>Remove for me</button>
          )}
          {message.threadReplies !== undefined && (
            <button
              className={`inline-action-btn ${message.threadReplies > 0 ? 'has-replies' : ''}`}
              onClick={() => onThreadOpen?.(message)}
            >
              {message.threadReplies > 0
                ? `${message.threadReplies} ${message.threadReplies === 1 ? 'reply' : 'replies'}`
                : 'Reply'}
            </button>
          )}
          <button
            className={`inline-action-btn ${message.isPinned ? 'has-pin' : ''}`}
            onClick={() => onPin?.(msgId)}
          >
            {message.isPinned ? 'Unpin' : 'Pin'}
          </button>
        </div>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="msg-reactions">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                className={`reaction-chip ${r.users.some(uid => String(uid) === String(currentUserId)) ? 'own' : ''}`}
                onClick={() => onReaction?.(msgId, r.emoji)}
              >
                {r.emoji} {r.users.length}
              </button>
            ))}
          </div>
        )}

        {/* Action bar on hover */}
        <div className={`msg-actions ${showPicker ? 'active' : ''}`}>
          <div style={{ position: 'relative' }}>
            <button
              className="action-btn"
              onClick={() => setShowPicker(!showPicker)}
              title="Add reaction"
            >➕</button>
            {showPicker && (
              <div ref={pickerRef} style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 1000, marginBottom: '5px' }}>
                <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
              </div>
            )}
          </div>
          {QUICK_EMOJIS.map(e => (
            <button key={e} className="action-btn" onClick={() => onReaction?.(msgId, e)} title={e}>{e}</button>
          ))}
          
          <button className="action-btn" onClick={handleCopy} title="Copy text">📋</button>
          <button className={`action-btn ${isStarred ? 'active' : ''}`} onClick={() => onStar?.(msgId)} title={isStarred ? 'Unstar' : 'Star'}>
            {isStarred ? '⭐' : '☆'}
          </button>

          {showCopied && <div className="msg-copied-toast">Copied!</div>}
        </div>
      </div>
    </div>
  );
};

export default Message;
