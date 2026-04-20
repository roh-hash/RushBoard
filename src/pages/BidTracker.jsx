import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCallStatus } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import { useRushees } from '../hooks/useRushees';
import './BidTracker.css';

const RESPONSES = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'needs_time', label: 'Needs time' },
  { value: 'declined', label: 'Declined' },
];

export default function BidTracker() {
  const navigate = useNavigate();
  const { chapter, membership } = useChapterContext();
  const { rushees, loading } = useRushees(chapter?.id);

  const bidRushees = useMemo(
    () => rushees.filter((rushee) => rushee.bidStatus === 'bid'),
    [rushees],
  );

  function handleCalledChange(rushee) {
    setCallStatus(
      chapter.id,
      rushee.id,
      { called: !rushee.called, response: rushee.callResponse || '' },
      membership,
    );
  }

  function handleResponseChange(rushee, response) {
    setCallStatus(
      chapter.id,
      rushee.id,
      { called: rushee.called ?? false, response },
      membership,
    );
  }

  if (loading) {
    return <p className="tracker-loading">Loading...</p>;
  }

  return (
    <div className="tracker-page">
      <p className="tracker-kicker">{chapter.displayName} Rush</p>
      <h1 className="tracker-title">Bid Tracker</h1>
      <div className="tracker-nav">
        <button onClick={() => navigate(`/${chapter.slug}/dashboard`)} className="tracker-nav-btn">Dashboard</button>
        <button onClick={() => navigate(`/${chapter.slug}/bids`)} className="tracker-nav-btn">Bid List</button>
      </div>
      <p className="tracker-count">
        {bidRushees.length} rushee{bidRushees.length !== 1 ? 's' : ''} with a bid
      </p>

      {bidRushees.length === 0 ? (
        <p className="tracker-empty">No rushees in the Bid column yet.</p>
      ) : (
        bidRushees.map((rushee) => (
          <div key={rushee.id} className="tracker-row">
            {rushee.photoURL ? (
              <img src={rushee.photoURL} alt="" className="tracker-photo" />
            ) : (
              <div className="tracker-photo-placeholder">
                {rushee.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            <div className="tracker-info">
              <div className="tracker-name">{rushee.displayName}</div>
              <div className="tracker-phone">{rushee.phone || 'No phone'}</div>
            </div>

            <label className="tracker-called">
              <input
                type="checkbox"
                checked={!!rushee.called}
                onChange={() => handleCalledChange(rushee)}
              />
              <span className="tracker-called-label">Called</span>
            </label>

            <div className="tracker-responses">
              {RESPONSES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponseChange(rushee, option.value)}
                  className={`tracker-response-btn ${rushee.callResponse === option.value ? `tracker-response-btn--${option.value}-active` : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
