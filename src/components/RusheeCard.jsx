import { useNavigate } from 'react-router-dom';
import './RusheeCard.css';

export function RusheeCard({ rushee, chapterSlug }) {
  const navigate = useNavigate();
  const nights = rushee.attendedNights?.length || 0;

  return (
    <div onClick={() => navigate(`/${chapterSlug}/rushee/${rushee.id}`)} className="rushee-card">
      <div className="rushee-photo-wrap">
        {rushee.photoURL ? (
          <img src={rushee.photoURL} alt={rushee.displayName} className="rushee-photo" />
        ) : (
          <div className="rushee-photo-placeholder">
            {rushee.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="rushee-info">
        <div className="rushee-name">{rushee.displayName}</div>
        {rushee.hometown && <div className="rushee-hometown">{rushee.hometown}</div>}
        <div className="rushee-meta">
          {rushee.tags?.map((tag) => <span key={tag} className="rushee-badge">{tag}</span>)}
          <span className="rushee-nights">{nights} night{nights !== 1 ? 's' : ''}</span>
        </div>
        {rushee.avgRating != null ? (
          <div className="rushee-rating">
            <span className="rushee-rating-star">&#9733;</span>
            <span className="rushee-rating-value">{rushee.avgRating.toFixed(1)}</span>
            <span className="rushee-rating-count">({rushee.ratingCount || 0})</span>
          </div>
        ) : (
          <span className="rushee-no-rating">Not yet rated</span>
        )}
      </div>
    </div>
  );
}
