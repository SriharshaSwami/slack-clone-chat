import { useChat } from '../../store/ChatContext';
import { useAuth } from '../../store/AuthContext';

const UsersList = () => {
  const { onlineUsers } = useChat();
  const { user } = useAuth();

  /* Simple inline list for admin panel */
  const allUsers = [
    { id: '1', username: 'admin',     role: 'admin' },
    { id: '2', username: 'moderator', role: 'moderator' },
    { id: '3', username: 'alice',     role: 'user' },
    { id: '4', username: 'bob',       role: 'user' },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>All Users</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allUsers.map(u => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            border: '1px solid var(--chat-border)', borderRadius: 'var(--radius)', background: '#fff',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: onlineUsers.includes(u.id) ? 'var(--slack-green)' : '#ccc',
            }}></span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</span>
            <span style={{
              fontSize: 11, padding: '1px 8px', borderRadius: 10,
              background: 'rgba(18,100,163,0.1)', color: 'var(--slack-blue)', marginLeft: 'auto',
            }}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
