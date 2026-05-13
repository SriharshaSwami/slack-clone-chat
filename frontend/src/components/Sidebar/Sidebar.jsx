import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useChat } from '../../store/ChatContext';
import { channelAPI } from '../../services/api';
import AdminRequests from './AdminRequests';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    channels, activeChannel, setActiveChannel,
    dmConversations, activeDM, setActiveDM,
    onlineUsers, setActiveThread, allUsers,
    refreshChannels, createChannel, removeChannel, joinChannel
  } = useChat();

  const [channelsOpen, setChannelsOpen]   = useState(true);
  const [dmsOpen, setDmsOpen]             = useState(true);
  const [showDmModal, setShowDmModal]     = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const [showRequests, setShowRequests]   = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [channelSearchTerm, setChannelSearchTerm] = useState('');
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleChannelClick = (ch) => {
    setActiveChannel(ch); // storing full channel object
    setActiveDM(null);
    setActiveThread(null);
    if (onClose) onClose();
  };

  const handleDMClick = (dm) => {
    setActiveDM(dm.id); // storing only the ID to match DirectMessages logic
    setActiveChannel(null);
    setActiveThread(null);
    if (onClose) onClose();
  };

  const startDM = async (otherUser) => {
    try {
      // Check if DM already exists
      const existingDm = dmConversations.find(dm => 
        dm.participantIds.includes(otherUser._id) && dm.participantIds.length <= 2
      );

      if (existingDm) {
        handleDMClick(existingDm);
        setShowDmModal(false);
        setSearchTerm('');
        return;
      }

      // Create a private channel with a reliably sorted name to prevent DB clashes
      const currentUserId = user._id || user.id;
      const sortedIds = [currentUserId, otherUser._id].sort();
      const dmName = `dm-${sortedIds[0]}-${sortedIds[1]}`;

      await channelAPI.create({
        name: dmName,
        isPrivate: true,
        members: [otherUser._id]
      });
      
      setShowDmModal(false);
      setSearchTerm('');
      await refreshChannels(); // Sync state without reload
    } catch (e) {
      console.error(e);
      showToast('Failed to create DM: ' + (e.response?.data?.message || e.message));
    }
  };

  const filteredUsers = allUsers?.filter(u => 
    u._id !== user?._id && 
    (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const isCreatorOfAny = channels.some(ch => ch.createdBy?._id === user?._id || ch.createdBy === user?._id);
  const canManageRequests = user?.role === 'admin' || isCreatorOfAny;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Workspace header */}
      <div className="sidebar-header">
        <h2 className="workspace-name">
          <span className="ws-dot"></span>
          Sleek
        </h2>
        <button className="compose-btn" title="New message" onClick={() => setShowDmModal(true)}>✎</button>
      </div>

      <div className="sidebar-scroll">
        {/* ── Channels ── */}
        <div className="sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 10 }}>
            <button className="section-toggle" onClick={() => setChannelsOpen(!channelsOpen)} style={{ flex: 1 }}>
              <span className={`caret ${!channelsOpen ? 'collapsed' : ''}`}>▾</span>
              <span className="section-label">Channels</span>
            </button>
            {canManageRequests && (
              <button 
                className="add-btn" 
                onClick={() => setShowRequests(true)}
                title="Manage Requests"
                style={{ marginRight: 8, fontSize: 12, fontWeight: 700, border: '1px solid', borderRadius: 4, width: 'auto', padding: '0 4px' }}
              >Approve</button>
            )}
            <button 
              onClick={() => setShowBrowseModal(true)}
              style={{ background: 'transparent', border: 'none', color: '#B0B0B0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, width: 20, height: 20, padding: 0 }}
              title="Browse Channels"
            >
              🔍
            </button>
            <button 
              onClick={() => setShowCreateChannelModal(true)}
              className="add-btn"
              title="Create Channel"
              style={{ marginLeft: 8 }}
            >+</button>
          </div>
          {channelsOpen && channels.map(ch => {
            if (!ch.isMember) return null; // Only show joined channels in sidebar
            if (ch.name.startsWith('dm-')) return null; // Don't show DMs in the main channels list
            
            return (
              <div
                key={ch._id}
                className={`sidebar-item ${activeChannel?._id === ch._id ? 'active' : ''}`}
                onClick={() => handleChannelClick(ch)}
              >
                <span className="item-icon">{ch.isPrivate ? '🔒' : '#'}</span>
                <span className="item-name">{ch.name}</span>
                
                {(user?.role === 'admin' || ch.createdBy?._id === user?._id || ch.createdBy === user?._id) && (
                  <button 
                    className="delete-item-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete channel #${ch.name}?`)) {
                        removeChannel(ch._id).catch(err => showToast(err.response?.data?.message || 'Error deleting channel'));
                      }
                    }}
                    title="Delete Channel"
                  >×</button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Direct Messages ── */}
        <div className="sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 10 }}>
            <button className="section-toggle" onClick={() => setDmsOpen(!dmsOpen)} style={{ flex: 1 }}>
              <span className={`caret ${!dmsOpen ? 'collapsed' : ''}`}>▾</span>
              <span className="section-label">Direct Messages</span>
            </button>
            <button 
              onClick={() => setShowDmModal(true)}
              style={{ background: 'transparent', border: 'none', color: '#B0B0B0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 20, height: 20, padding: 0 }}
              title="Open a direct message"
            >
              +
            </button>
          </div>
          {dmsOpen && dmConversations.map(dm => {
            const isOnline = dm.participantIds.some(id => onlineUsers.includes(id) && id !== user?._id);
            return (
              <div
                key={dm.id}
                className={`sidebar-item ${activeDM === dm.id ? 'active' : ''}`}
                onClick={() => handleDMClick(dm)}
              >
                <span className={`online-dot ${isOnline ? 'online' : 'offline'}`}></span>
                <span className="item-name">{dm.name}</span>

                <button 
                  className="delete-item-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete conversation with ${dm.name}?`)) {
                      removeChannel(dm.id).catch(err => showToast(err.response?.data?.message || 'Error deleting conversation'));
                    }
                  }}
                  title="Delete Conversation"
                >×</button>
              </div>
            );
          })}
        </div>
      </div>

      {showRequests && <AdminRequests onClose={() => setShowRequests(false)} />}
      
      {showDmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: '#333'
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, maxHeight: 300 }}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <div key={u._id} onClick={() => startDM(u)} style={{
                    padding: 12, border: '1px solid #eee', borderRadius: 4, cursor: 'pointer', transition: 'background 0.2s'
                  }} onMouseOver={(e) => e.currentTarget.style.background = '#f8f8f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <strong>{u.username}</strong> <br/>
                    <span style={{ fontSize: 12, color: '#666' }}>{u.email}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: 12, color: '#888', textAlign: 'center' }}>No users found matching "{searchTerm}"</div>
              )}
            </div>
            
            <button onClick={() => { setShowDmModal(false); setSearchTerm(''); }} style={{ marginTop: 20, padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          </div>
        </div>
      )}
      {showBrowseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: '#333'
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 450, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Browse Channels</h2>
            
            <input 
              type="text" 
              placeholder="Search channels..." 
              value={channelSearchTerm}
              onChange={(e) => setChannelSearchTerm(e.target.value)}
              style={{ padding: 10, borderRadius: 4, border: '1px solid #ccc', marginBottom: 16 }}
              autoFocus
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, maxHeight: 300 }}>
              {channels.filter(ch => !ch.isMember && !ch.name.startsWith('dm-') && ch.name.toLowerCase().includes(channelSearchTerm.toLowerCase())).length > 0 ? (
                channels
                  .filter(ch => !ch.isMember && !ch.name.startsWith('dm-') && ch.name.toLowerCase().includes(channelSearchTerm.toLowerCase()))
                  .map(ch => (
                    <div key={ch._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 12, border: '1px solid #eee', borderRadius: 4, transition: 'background 0.2s'
                    }} onMouseOver={(e) => e.currentTarget.style.background = '#f8f8f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#888' }}>{ch.isPrivate ? '🔒' : '#'}</span>
                        <strong>{ch.name}</strong>
                      </div>
                      
                      {!ch.isPending ? (
                        <button 
                          onClick={() => {
                            joinChannel(ch._id).then(() => {
                              showToast('Join request sent!');
                            }).catch(err => showToast(err.response?.data?.message || 'Error sending request'));
                          }}
                          style={{
                            background: '#1264A3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12
                          }}
                        >Request</button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#2BAC76', fontStyle: 'italic', fontWeight: 600 }}>Pending</span>
                      )}
                    </div>
                  ))
              ) : (
                <div style={{ padding: 12, color: '#888', textAlign: 'center' }}>No unjoined channels found.</div>
              )}
            </div>
            
            <button onClick={() => { setShowBrowseModal(false); setChannelSearchTerm(''); }} style={{ marginTop: 20, padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: '#333'
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 400, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Create a channel</h2>
            <p style={{ fontSize: 14, color: '#616061', marginBottom: 16 }}>
              Channels are where your team communicates. They're best when organized around a topic — #marketing, for example.
            </p>
            
            <label style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Name</label>
            <input 
              type="text" 
              placeholder="e.g. plan-budget" 
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 4, border: '1px solid #ccc', marginBottom: 20, fontSize: 16 }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newChannelName.trim()) {
                  createChannel({ name: newChannelName.trim() })
                    .then(() => { setShowCreateChannelModal(false); setNewChannelName(''); showToast('Channel created successfully'); })
                    .catch(err => showToast(err.response?.data?.message || 'Error creating channel'));
                }
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => { setShowCreateChannelModal(false); setNewChannelName(''); }} 
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (newChannelName.trim()) {
                    createChannel({ name: newChannelName.trim() })
                      .then(() => { setShowCreateChannelModal(false); setNewChannelName(''); showToast('Channel created successfully'); })
                      .catch(err => showToast(err.response?.data?.message || 'Error creating channel'));
                  }
                }}
                disabled={!newChannelName.trim()}
                style={{ padding: '8px 16px', background: '#007a5a', color: '#fff', border: 'none', borderRadius: 4, cursor: newChannelName.trim() ? 'pointer' : 'default', fontWeight: 'bold', opacity: newChannelName.trim() ? 1 : 0.5 }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#2BAC76', color: '#fff', padding: '12px 24px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, fontWeight: 600, fontSize: 14,
        }}>
          {toastMessage}
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;
