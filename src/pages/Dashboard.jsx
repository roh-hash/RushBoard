import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRushees } from '../hooks/useRushees';
import { RusheeCard } from '../components/RusheeCard';
import './Dashboard.css';

export default function Dashboard() {
  const { memberName, logout, isRushChair } = useAuth();
  const { rushees, loading } = useRushees();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = rushees;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.displayName?.toLowerCase().includes(q));
    }
    // Sort by avg rating descending, unrated at the bottom
    return list.slice().sort((a, b) => {
      const aRating = a.avgRating ?? -1;
      const bRating = b.avgRating ?? -1;
      return bRating - aRating;
    });
  }, [rushees, search]);

  const ratedCount = rushees.filter((r) => r.avgRating != null).length;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1 className="dash-title">Rush<span>Board</span></h1>
        <div className="dash-header-right">
          <span className="dash-member-name">{memberName}</span>
          <button onClick={handleLogout} className="dash-logout">Logout</button>
        </div>
      </header>

      <div className="dash-body">
        {isRushChair && (
          <nav className="dash-nav">
            <button onClick={() => navigate('/qr')} className="dash-nav-btn">+ Rush Night</button>
            <button onClick={() => navigate('/bids')} className="dash-nav-btn">Bid List</button>
          </nav>
        )}

        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">{rushees.length}</span>
            <span className="dash-stat-label">Rushees</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">{ratedCount}</span>
            <span className="dash-stat-label">Rated</span>
          </div>
        </div>

        <hr className="dash-rule" />

        <div className="dash-search-wrap">
          <span className="dash-search-icon">&#x2315;</span>
          <input
            type="text"
            placeholder="Search rushees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dash-search"
          />
        </div>

        {loading ? (
          <div className="dash-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dash-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">&#x2014;</div>
            <p>{search ? 'No rushees match that search.' : 'No rushees checked in yet.'}</p>
          </div>
        ) : (
          <div className="dash-grid">
            {filtered.map((r) => (
              <RusheeCard key={r.id} rushee={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
