import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useChat } from '../../store/ChatContext';
import { channelAPI } from '../../services/api';

const DirectMessages = () => {
  const { user } = useAuth();
  const { 
    dmConversations, activeDM, setActiveDM, setActiveChannel, setActiveThread, 
    onlineUsers, allUsers, createChannel 
  } = useChat();
  const [showModal, setShowModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const handleClick = (dm) => {
    setActiveDM(dm.id);
    setActiveChannel(null);
    setActiveThread(null);
  };

  const startDM = async (otherUser) => {
    try {
      // Check if DM already exists
      const existingDm = dmConversations.find(dm => 
        dm.participantIds.includes(otherUser._id) && dm.participantIds.length <= 2
      );

      if (existingDm) {
        handleClick(existingDm);
        setShowModal(false);
        setSearchTerm('');
        return;
      }

      // Create a private channel
      await createChannel({
        name: `dm-${user._id || user.id}-${otherUser._id}`,
        isPrivate: true,
        members: [otherUser._id]
      });
      
      // Reload or refetch
      setShowModal(false);
      setSearchTerm('');
    } catch (e) {
      console.error(e);
      alert('Failed to create DM');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u._id !== user?._id && 
    (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Direct Messages</h3>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'none', border: 'none', color: 'var(--slack-blue)', cursor: 'pointer', fontSize: 24, fontWeight: 'bold' }}>
          +
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dmConversations.map(dm => {
          // Now dmConversations is formatted differently: {id, name, participantIds}
          const isOnline = dm.participantIds.some(id => onlineUsers.includes(id) && id !== user?._id);
          
          return (
            <div
              key={dm.id}
              onClick={() => handleClick(dm)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                border: `1px solid ${activeDM === dm.id ? 'var(--slack-blue)' : 'var(--chat-border)'}`,
                borderRadius: 'var(--radius)', cursor: 'pointer', background: activeDM === dm.id ? 'rgba(18,100,163,0.04)' : '#fff',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOnline ? 'var(--slack-green)' : 'transparent',
                border: isOnline ? 'none' : '1.5px solid #ccc',
              }}></span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{dm.name}</span>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>New Direct Message</h2>
            
            <input 
              type="text" 
              placeholder="Search by username or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: 10, borderRadius: 4, border: '1px solid #ccc', marginBottom: 16 }}
              autoFocus
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <div key={u._id} onClick={() => startDM(u)} style={{
                    padding: 12, border: '1px solid #eee', borderRadius: 4, cursor: 'pointer', transition: 'background 0.2s'
                  }} className="user-search-result" onMouseOver={(e) => e.currentTarget.style.background = '#f8f8f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <strong>{u.username}</strong> <br/>
                    <span style={{ fontSize: 12, color: '#666' }}>{u.email}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: 12, color: '#888', textAlign: 'center' }}>No users found matching "{searchTerm}"</div>
              )}
            </div>
            
            <button onClick={() => { setShowModal(false); setSearchTerm(''); }} style={{ marginTop: 20, padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages;
