import { useState } from 'react';
import { useChat } from '../../store/ChatContext';
import { channelAPI } from '../../services/api';
import './ChannelsList.css';

const ChannelsList = () => {
  const { 
    dmConversations, activeDM, setActiveDM, setActiveChannel, setActiveThread, 
    onlineUsers, allUsers, refreshChannels, createChannel
  } = useChat();
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const handleClick = (ch) => {
    setActiveChannel(ch);
    setActiveDM(null);
    setActiveThread(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      await createChannel({ name: newChannelName.trim(), description: newChannelDesc.trim() });
      setShowModal(false);
      setNewChannelName(''); // Clear input after successful creation
      setNewChannelDesc(''); // Clear input after successful creation
    } catch (err) {
      alert('Failed to create channel: ' + err.message);
    }
  };

  return (
    <div className="channels-list-feature">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>All Channels</h3>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--slack-blue)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
          Create
        </button>
      </div>

      <div className="cl-grid" style={{ marginTop: 16 }}>
        {channels.map(ch => (
          <div
            key={ch._id}
            className={`cl-card ${activeChannel?._id === ch._id ? 'active' : ''}`}
            onClick={() => handleClick(ch)}
          >
            <div className="cl-card-icon">{ch.isPrivate ? '🔒' : '#'}</div>
            <div className="cl-card-info">
              <h4>{ch.name}</h4>
              <p>{ch.description}</p>
              <span className="cl-members">{ch.members.length} members</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 400 }}>
            <h2 style={{ marginTop: 0 }}>Create Channel</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <input 
                type="text" 
                placeholder="Channel Name (e.g. marketing)" 
                value={newChannelName} 
                onChange={(e) => setNewChannelName(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <input 
                type="text" 
                placeholder="Description (Optional)" 
                value={newChannelDesc} 
                onChange={(e) => setNewChannelDesc(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--slack-blue)', color: 'white', border: 'none', borderRadius: 4 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsList;
