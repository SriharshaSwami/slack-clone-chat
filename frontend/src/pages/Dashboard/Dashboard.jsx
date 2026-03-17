import { useAuth } from '../../store/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import ThreadPanel from '../../components/ThreadPanel/ThreadPanel';
import { useChat } from '../../store/ChatContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { activeThread } = useChat();

  return (
    <div className="dashboard-layout">
      {/* Role badge */}
      {user?.role !== 'user' && (
        <div className="role-banner">
          {user?.role === 'admin' && '🛡️ Admin Panel'}
          {user?.role === 'moderator' && '🔧 Moderator Panel'}
        </div>
      )}

      <div className="dashboard-main">
        <Sidebar />
        <ChatWindow />
        {activeThread && <ThreadPanel />}
      </div>
    </div>
  );
};

export default Dashboard;
