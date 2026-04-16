import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRushees } from '../hooks/useRushees';
import { useAuth } from '../hooks/useAuth';
import { setBidStatus, clearBidStatus } from '../lib/firebase';
import './BidList.css';

const COLUMNS = ['bid', 'table', 'fade'];
const COLUMN_LABELS = { bid: 'Bid', table: 'Table', fade: 'Fade' };

export default function BidList() {
  const { rushees } = useRushees();
  const { memberName } = useAuth();
  const navigate = useNavigate();
  const [dragId, setDragId] = useState(null);
  // Mobile tap-to-assign: which card's menu is open
  const [assignMenuId, setAssignMenuId] = useState(null);

  const uncategorized = useMemo(() => rushees.filter((r) => !r.bidStatus), [rushees]);
  const columns = useMemo(() => {
    const cols = { bid: [], table: [], fade: [] };
    rushees.forEach((r) => {
      if (r.bidStatus && cols[r.bidStatus]) cols[r.bidStatus].push(r);
    });
    return cols;
  }, [rushees]);

  function handleDragStart(id) {
    setDragId(id);
  }

  function handleDrop(status) {
    if (!dragId) return;
    setBidStatus(dragId, status, memberName);
    setDragId(null);
  }

  function handleAssign(rusheeId, status) {
    setBidStatus(rusheeId, status, memberName);
    setAssignMenuId(null);
  }

  function toggleAssignMenu(rusheeId) {
    setAssignMenuId((prev) => (prev === rusheeId ? null : rusheeId));
  }

  return (
    <div className="bidlist-page">
      <div className="bidlist-header">
        <h1 className="bidlist-title">Bid List</h1>
        <div className="bidlist-nav">
          <button onClick={() => navigate('/dashboard')} className="bidlist-nav-btn">Dashboard</button>
          <button onClick={() => navigate('/bid-tracker')} className="bidlist-nav-btn">Bid Tracker</button>
        </div>
      </div>

      {uncategorized.length > 0 && (
        <div className="bidlist-uncat">
          <h3 className="bidlist-uncat-title">Uncategorized ({uncategorized.length})</h3>
          <div className="bidlist-uncat-grid">
            {uncategorized.map((r) => (
              <MiniCard
                key={r.id}
                rushee={r}
                onDragStart={() => handleDragStart(r.id)}
                showAssignMenu={assignMenuId === r.id}
                onToggleAssign={() => toggleAssignMenu(r.id)}
                onAssign={(status) => handleAssign(r.id, status)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bidlist-columns">
        {COLUMNS.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col)}
            className={`bidlist-column bidlist-col--${col}`}
          >
            <h3 className="bidlist-col-title">
              {COLUMN_LABELS[col]} ({columns[col].length})
            </h3>
            {columns[col].map((r) => (
              <MiniCard
                key={r.id}
                rushee={r}
                onDragStart={() => handleDragStart(r.id)}
                onRemove={() => clearBidStatus(r.id, memberName)}
                showAssignMenu={assignMenuId === r.id}
                onToggleAssign={() => toggleAssignMenu(r.id)}
                onAssign={(status) => handleAssign(r.id, status)}
                currentStatus={col}
              />
            ))}
            {columns[col].length === 0 && (
              <p className="bidlist-col-empty">Drop here</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniCard({ rushee, onDragStart, onRemove, showAssignMenu, onToggleAssign, onAssign, currentStatus }) {
  return (
    <div className="bidlist-mini-wrap">
      <div draggable onDragStart={onDragStart} className="bidlist-mini">
        {rushee.photoURL ? (
          <img src={rushee.photoURL} alt="" className="bidlist-mini-photo" />
        ) : (
          <div className="bidlist-mini-photo-placeholder">
            {rushee.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="bidlist-mini-info">
          <div className="bidlist-mini-name">{rushee.displayName}</div>
          <div className="bidlist-mini-rating">
            {rushee.avgRating != null ? `${rushee.avgRating.toFixed(1)} avg` : 'Unrated'}
          </div>
        </div>
        {/* Tap-to-assign button (visible on mobile, hidden on desktop where drag works) */}
        <button onClick={(e) => { e.stopPropagation(); onToggleAssign(); }} className="bidlist-mini-assign" title="Move to...">
          &#x2026;
        </button>
        {onRemove && (
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="bidlist-mini-remove" title="Remove">
            &times;
          </button>
        )}
      </div>
      {showAssignMenu && (
        <div className="bidlist-assign-menu">
          {COLUMNS.filter((col) => col !== currentStatus).map((col) => (
            <button key={col} onClick={() => onAssign(col)} className={`bidlist-assign-opt bidlist-assign-opt--${col}`}>
              {COLUMN_LABELS[col]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
