import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearBidStatus, setBidStatus } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import { useRushees } from '../hooks/useRushees';
import './BidList.css';

const COLUMNS = ['bid', 'waitlist', 'reject'];
const COLUMN_LABELS = { bid: 'Bid', waitlist: 'Waitlist', reject: 'Reject' };

export default function BidList() {
  const navigate = useNavigate();
  const { chapter, membership } = useChapterContext();
  const { rushees } = useRushees(chapter?.id);
  const [dragId, setDragId] = useState(null);
  const [assignMenuId, setAssignMenuId] = useState(null);

  const uncategorized = useMemo(() => rushees.filter((rushee) => !rushee.bidStatus), [rushees]);
  const columns = useMemo(() => {
    const nextColumns = { bid: [], waitlist: [], reject: [] };
    rushees.forEach((rushee) => {
      if (rushee.bidStatus && nextColumns[rushee.bidStatus]) {
        nextColumns[rushee.bidStatus].push(rushee);
      }
    });
    return nextColumns;
  }, [rushees]);

  function handleDrop(status) {
    if (!dragId) return;
    setBidStatus(chapter.id, dragId, status, membership);
    setDragId(null);
  }

  function handleAssign(rusheeId, status) {
    setBidStatus(chapter.id, rusheeId, status, membership);
    setAssignMenuId(null);
  }

  return (
    <div className="bidlist-page">
      <div className="bidlist-header">
        <div>
          <p className="bidlist-kicker">{chapter.displayName} Rush</p>
          <h1 className="bidlist-title">Bid List</h1>
        </div>
        <div className="bidlist-nav">
          <button onClick={() => navigate(`/${chapter.slug}/dashboard`)} className="bidlist-nav-btn">Dashboard</button>
          <button onClick={() => navigate(`/${chapter.slug}/bid-tracker`)} className="bidlist-nav-btn">Bid Tracker</button>
        </div>
      </div>

      <div className="bidlist-touch-hint">
        Tap <strong>···</strong> on any card to move it between columns
      </div>

      {uncategorized.length > 0 && (
        <div className="bidlist-uncat">
          <h3 className="bidlist-uncat-title">Uncategorized ({uncategorized.length})</h3>
          <div className="bidlist-uncat-grid">
            {uncategorized.map((rushee) => (
              <MiniCard
                key={rushee.id}
                rushee={rushee}
                onDragStart={() => setDragId(rushee.id)}
                showAssignMenu={assignMenuId === rushee.id}
                onToggleAssign={() => setAssignMenuId((current) => (current === rushee.id ? null : rushee.id))}
                onAssign={(status) => handleAssign(rushee.id, status)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bidlist-columns">
        {COLUMNS.map((column) => (
          <div
            key={column}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(column)}
            className={`bidlist-column bidlist-col--${column}`}
          >
            <h3 className="bidlist-col-title">
              {COLUMN_LABELS[column]} ({columns[column].length})
            </h3>
            {columns[column].map((rushee) => (
              <MiniCard
                key={rushee.id}
                rushee={rushee}
                onDragStart={() => setDragId(rushee.id)}
                onRemove={() => clearBidStatus(chapter.id, rushee.id, membership)}
                showAssignMenu={assignMenuId === rushee.id}
                onToggleAssign={() => setAssignMenuId((current) => (current === rushee.id ? null : rushee.id))}
                onAssign={(status) => handleAssign(rushee.id, status)}
                currentStatus={column}
              />
            ))}
            {columns[column].length === 0 && <p className="bidlist-col-empty">Drop here</p>}
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
        <button onClick={(event) => { event.stopPropagation(); onToggleAssign(); }} className="bidlist-mini-assign" title="Move to...">
          &#x2026;
        </button>
        {onRemove && (
          <button onClick={(event) => { event.stopPropagation(); onRemove(); }} className="bidlist-mini-remove" title="Remove">
            &times;
          </button>
        )}
      </div>
      {showAssignMenu && (
        <div className="bidlist-assign-menu">
          {COLUMNS.filter((column) => column !== currentStatus).map((column) => (
            <button key={column} onClick={() => onAssign(column)} className={`bidlist-assign-opt bidlist-assign-opt--${column}`}>
              {COLUMN_LABELS[column]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
