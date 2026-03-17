import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="header-logo">
          <img src="/sleek-logo.jpeg" alt="Sleek Logo" className="logo-image" />
        </Link>
      </div>

      <nav className="header-nav">
        {!user ? (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="nav-link nav-link--primary">Get Started</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>

            {/* Profile dropdown */}
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="profile-trigger"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-expanded={dropdownOpen}
              >
                <div className="user-avatar" title={user.username}>
                  {user.username[0].toUpperCase()}
                </div>
                <span className="profile-trigger-name">{user.username}</span>
                <span className={`profile-chevron ${dropdownOpen ? 'open' : ''}`}>▾</span>
              </button>

              {dropdownOpen && (
                <div className="profile-dropdown">
                  {/* Avatar + name header */}
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="dropdown-user-info">
                      <span className="dropdown-username">{user.username}</span>
                      <span className="dropdown-role">{user.role || 'Member'}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  {/* Details */}
                  <div className="dropdown-details">
                    <div className="dropdown-detail-row">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                    {user.role && (
                      <div className="dropdown-detail-row">
                        <span className="detail-label">Role</span>
                        <span className="detail-value">{user.role}</span>
                      </div>
                    )}
                  </div>

                  <div className="dropdown-divider" />

                  {/* Actions */}
                  <button
                    className="dropdown-action dropdown-action--logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
