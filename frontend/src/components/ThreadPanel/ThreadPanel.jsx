import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useChat } from '../../store/ChatContext';
import './ThreadPanel.css';

const ThreadPanel = () => {
  const { user } = useAuth();
  const { activeThread, setActiveThread, threadReplies, sendThreadReply } = useChat();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const activeThreadId = activeThread?._id || activeThread?.id;
  const replies = threadReplies[activeThreadId] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  if (!activeThread) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendThreadReply(activeThreadId, text.trim(), user.username, user._id);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="thread-panel">
      <div className="tp-header">
        <h4>Thread</h4>
        <button className="tp-close" onClick={() => setActiveThread(null)}>✕</button>
      </div>

      {/* Original message */}
      <div className="tp-original">
        <strong>{activeThread.senderName || activeThread.senderId?.username}</strong>
        <p>{activeThread.text}</p>
      </div>

      <div className="tp-divider">
        <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
      </div>

      {/* Replies */}
      <div className="tp-replies">
        {replies.map(r => (
          <div key={r._id || r.id} className="tp-reply">
            <div className="tp-reply-avatar">{(r.senderName || r.senderId?.username || '?')[0].toUpperCase()}</div>
            <div className="tp-reply-body">
              <div className="tp-reply-meta">
                <span className="tp-reply-name">{r.senderName || r.senderId?.username}</span>
                <span className="tp-reply-time">
                  {new Date(r.timestamp || r.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <p className="tp-reply-text">{r.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <form className="tp-input" onSubmit={handleSend}>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply..."
        />
        <button type="submit" disabled={!text.trim()}>➤</button>
      </form>
    </div>
  );
};

export default ThreadPanel;
