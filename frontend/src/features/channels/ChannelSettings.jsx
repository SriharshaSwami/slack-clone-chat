import { useChat } from '../../store/ChatContext';

const ChannelSettings = ({ channel }) => {
  const ch = channel || { name: '', description: '', members: [] };

  return (
    <div style={{ padding: 20 }}>
      <h3>Channel Settings: #{ch.name}</h3>
      <p style={{ color: 'var(--chat-text-secondary)', fontSize: 14, marginTop: 8 }}>
        {ch.description || 'No description'}
      </p>
      <p style={{ fontSize: 13, marginTop: 12, color: 'var(--chat-timestamp)' }}>
        {ch.members?.length || 0} members
      </p>
    </div>
  );
};

export default ChannelSettings;
