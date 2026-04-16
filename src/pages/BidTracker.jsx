import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRushees } from '../hooks/useRushees';
import { useAuth } from '../hooks/useAuth';
import { setCallStatus } from '../lib/firebase';
import './BidTracker.css';

const RESPONSES = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'needs_time', label: 'Needs time' },
  { value: 'declined', label: 'Declined' },
];

export default function BidTracker() {
  const { rushees, loading } = useRushees();
  const { memberName } = useAuth();
  const navigate = useNavigate();

  const bidRushees = useMemo(
    () => rushees.filter((r) => r.bidStatus === 'bid'),
    [rushees],
  );

  function handleCalledChange(rushee) {
    setCallStatus(rushee.id, { called: !rushee.called, response: rushee.callResponse || '' }, memberName);
  }

  function handleResponseChange(rushee, response) {
    setCallStatus(rushee.id, { called: rushee.called ?? false, response }, memberName);
  }

  if (loading) {
    return <p className="tracker-loading">Loading...</p>;
  }

  return (
    <div className="tracker-page">
      <h1 className="tracker-title">Bid Tracker</h1>
      <div className="tracker-nav">
        <button onClick={() => navigate('/dashboard')} className="tracker-nav-btn">Dashboard</button>
        <button onClick={() => navigate('/bids')} className="tracker-nav-btn">Bid List</button>
      </div>
      <p className="tracker-count">
        {bidRushees.length} rushee{bidRushees.length !== 1 ? 's' : ''} with a bid
      </p>

      {bidRushees.length === 0 ? (
        <p className="tracker-empty">No rushees in the Bid column yet.</p>
      ) : (
        bidRushees.map((r) => (
          <div key={r.id} className="tracker-row">
            {r.photoURL ? (
              <img src={r.photoURL} alt="" className="tracker-photo" />
            ) : (
              <div className="tracker-photo-placeholder">
                {r.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            <div className="tracker-info">
              <div className="tracker-name">{r.displayName}</div>
              <div className="tracker-phone">{r.phone || 'No phone'}</div>
            </div>

            <label className="tracker-called">
              <input
                type="checkbox"
                checked={!!r.called}
                onChange={() => handleCalledChange(r)}
              />
              <span className="tracker-called-label">Called</span>
            </label>

            <div className="tracker-responses">
              {RESPONSES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleResponseChange(r, opt.value)}
                  className={`tracker-response-btn ${r.callResponse === opt.value ? `tracker-response-btn--${opt.value}-active` : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
