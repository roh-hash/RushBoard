import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, loading, memberships, membershipsLoading } = useAuth();

  if (!loading && !membershipsLoading && isLoggedIn && memberships[0]?.chapterSlug) {
    return <Navigate to={`/${memberships[0].chapterSlug}/dashboard`} replace />;
  }

  return (
    <div className="home">
      <div className="home-grid">
        <section className="home-hero">
          <p className="home-kicker">Chapter-scoped rush operations</p>
          <h1 className="home-title">Rush<span>Board</span></h1>
          <p className="home-subtitle">
            Give every fraternity chapter its own rush process, invite flow, QR check-ins,
            roster, bid board, and live decision room.
          </p>

          <div className="home-actions">
            <button onClick={() => navigate('/start')} className="home-btn-primary">
              Start using RushBoard
            </button>
            <button onClick={() => navigate('/sign-in')} className="home-btn-secondary">
              Sign in to your chapter
            </button>
          </div>
        </section>

        <aside className="home-panel">
          <div className="home-panel-card">
            <div className="home-panel-label">Why rush chairs use it</div>
            <ul className="home-feature-list">
              <li>Rushees scan a QR code to check in — no clipboards, no lost sign-in sheets.</li>
              <li>Every brother rates and comments in real time, so bid night decisions are backed by the whole chapter.</li>
              <li>Drag rushees across your Bid, Watch List, and Fade columns as the night unfolds.</li>
              <li>Track who's been called, who accepted, and who needs more time — all in one place.</li>
            </ul>
          </div>
          <div className="home-panel-note">
            The whole chapter sees the same live roster the moment someone checks in — no group chat, no spreadsheet.
          </div>
        </aside>
      </div>
    </div>
  );
}
