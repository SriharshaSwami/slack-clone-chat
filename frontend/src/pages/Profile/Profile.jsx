import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email]                = useState(user?.email || '');
  const [saved, setSaved]      = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ username });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar-lg">
          {user?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <h2>Your Profile</h2>
        <span className="profile-role">{user?.role}</span>

        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={email} disabled />
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
