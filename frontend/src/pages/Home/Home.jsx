import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Made for people.<br />
            <span className="highlight">Built for productivity.</span>
          </h1>
          <p className="hero-subtitle">
            Sleek is a new way to communicate with your team. It's faster, better organized,
            and more secure than email.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
                <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-mockup">
            <div className="mockup-sidebar">
              <div className="mk-item active"></div>
              <div className="mk-item"></div>
              <div className="mk-item"></div>
              <div className="mk-item"></div>
            </div>
            <div className="mockup-chat">
              <div className="mk-msg"><div className="mk-avatar"></div><div className="mk-lines"><div></div><div className="short"></div></div></div>
              <div className="mk-msg"><div className="mk-avatar alt"></div><div className="mk-lines"><div></div><div className="med"></div></div></div>
              <div className="mk-msg"><div className="mk-avatar alt2"></div><div className="mk-lines"><div></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-icon">💬</span>
          <h3>Channels</h3>
          <p>Organize conversations by topic, project, or team.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔒</span>
          <h3>Direct Messages</h3>
          <p>Private conversations with one person or a small group.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🧵</span>
          <h3>Threads</h3>
          <p>Keep discussions organized with threaded replies.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Real-time</h3>
          <p>Instant messaging with typing indicators and presence.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
