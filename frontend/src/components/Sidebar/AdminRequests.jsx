import { useState, useEffect } from 'react';
import { useModal } from '../common/useModal.jsx';
import { useChat } from '../../store/ChatContext';
import { channelAPI } from '../../services/api';

const AdminRequests = ({ onClose }) => {
  const { refreshChannels } = useChat();
  const [channelsWithRequests, setChannelsWithRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, showModal] = useModal();

  const fetchAllRequests = async () => {
    try {
      const channels = await channelAPI.list();
      const requestsPromises = channels.map(async (ch) => {
        const requests = await channelAPI.listPending(ch._id);
        return { ...ch, requests };
      });
      const results = await Promise.all(requestsPromises);
      setChannelsWithRequests(results.filter(ch => ch.requests.length > 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const handleApprove = async (chId, userId) => {
    try {
      await channelAPI.approveJoin(chId, userId);
      fetchAllRequests();
      await refreshChannels();
      showModal('Approved successfully!', 'Success');
    } catch (e) {
      showModal('Failed to approve: ' + e.message, 'Error');
    }
  };

  return (
    <>
      {modal}
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, color: '#333'
    }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          Join Requests
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </h2>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div>Loading requests...</div>
          ) : channelsWithRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>No pending requests found.</div>
          ) : (
            channelsWithRequests.map(ch => (
              <div key={ch._id} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                  #{ch.name}
                </h3>
                {ch.requests.map(req => (
                  <div key={req._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9f9f9'
                  }}>
                    <div>
                      <strong>{req.username}</strong>
                      <div style={{ fontSize: 12, color: '#888' }}>{req.email}</div>
                    </div>
                    <button 
                      onClick={() => handleApprove(ch._id, req._id)}
                      style={{
                        background: '#2EB67D', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600
                      }}
                    >Approve</button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminRequests;
