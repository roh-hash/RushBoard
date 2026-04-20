import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChapterContext } from '../hooks/useChapter';
import { useRushees } from '../hooks/useRushees';
import { RusheeCard } from '../components/RusheeCard';
import { onSnapshot, rushNightsRef } from '../lib/firebase';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { chapter, membership, isRushChair } = useChapterContext();
  const { rushees, loading } = useRushees(chapter?.id);
  const [search, setSearch] = useState('');
  const [nightCount, setNightCount] = useState(0);

  useEffect(() => {
    if (!chapter?.id) return undefined;
    return onSnapshot(rushNightsRef(chapter.id), (snap) => setNightCount(snap.size));
  }, [chapter?.id]);

  const filtered = useMemo(() => {
    let list = rushees;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter((rushee) => rushee.displayName?.toLowerCase().includes(needle));
    }

    return list.slice().sort((left, right) => {
      const leftRating = left.avgRating ?? -1;
      const rightRating = right.avgRating ?? -1;
      return rightRating - leftRating;
    });
  }, [rushees, search]);

  const ratedCount = rushees.filter((rushee) => rushee.avgRating != null).length;

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <div className="dash-kicker">{chapter.displayName} Rush</div>
          <h1 className="dash-title">Rush<span>Board</span></h1>
        </div>
        <div className="dash-header-right">
          <span className="dash-member-name">{membership?.fullName}</span>
          <button onClick={handleLogout} className="dash-logout">Sign out</button>
        </div>
      </header>

      <div className="dash-body">
        <nav className="dash-nav">
          {isRushChair && (
            <>
              <button onClick={() => navigate(`/${chapter.slug}/qr`)} className="dash-nav-btn">Rush Nights</button>
              <button onClick={() => navigate(`/${chapter.slug}/bids`)} className="dash-nav-btn">Bid List</button>
              <button onClick={() => navigate(`/${chapter.slug}/settings`)} className="dash-nav-btn dash-nav-btn--ghost">Settings</button>
            </>
          )}
        </nav>

        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">{rushees.length}</span>
            <span className="dash-stat-label">Rushees</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">{ratedCount}</span>
            <span className="dash-stat-label">Rated</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">{nightCount}</span>
            <span className="dash-stat-label">Rush Nights</span>
          </div>
        </div>

        <hr className="dash-rule" />

        <div className="dash-search-wrap">
          <span className="dash-search-icon">&#x2315;</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this chapter's rushees..."
            className="dash-search"
          />
        </div>

        {loading ? (
          <div className="dash-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="dash-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">&#x2014;</div>
            <p>{search ? 'No rushees match that search.' : 'No rushees have checked in for this chapter yet.'}</p>
          </div>
        ) : (
          <div className="dash-grid">
            {filtered.map((rushee) => (
              <RusheeCard key={rushee.id} rushee={rushee} chapterSlug={chapter.slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
