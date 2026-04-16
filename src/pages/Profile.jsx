import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, ratingsRef, commentsRef, setRating, addComment, setTalkedTo, getTalkedTo, setBidStatus } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { memberName, isRushChair } = useAuth();

  const [rushee, setRushee] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [talkedTo, setTalkedToState] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, 'rushees', id), (snap) => {
      if (snap.exists()) setRushee({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  useEffect(() => {
    return onSnapshot(query(ratingsRef(id), orderBy('timestamp', 'desc')), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRatings(list);
      const mine = list.find((r) => r.memberName === memberName);
      if (mine) setMyRating(mine.score);
    });
  }, [id, memberName]);

  useEffect(() => {
    return onSnapshot(query(commentsRef(id), orderBy('timestamp', 'desc')), (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id]);

  useEffect(() => {
    getTalkedTo(id, memberName).then(setTalkedToState);
  }, [id, memberName]);

  async function handleRate(score) {
    setMyRating(score);
    await setRating(id, memberName, score);
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await addComment(id, memberName, commentText.trim());
    setCommentText('');
    setSubmitting(false);
  }

  async function handleTalkedTo() {
    const next = !talkedTo;
    setTalkedToState(next);
    await setTalkedTo(id, memberName, next);
  }

  if (!rushee) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <button onClick={() => navigate('/dashboard')} className="profile-back">&larr; Back</button>

      <div className="profile-header">
        {rushee.photoURL ? (
          <img src={rushee.photoURL} alt={rushee.displayName} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {rushee.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <h1 className="profile-name">{rushee.displayName}</h1>
          {rushee.hometown && <div className="profile-hometown">{rushee.hometown}</div>}
          {rushee.year && <div className="profile-year">{rushee.year}</div>}
          {rushee.tag && <span className="profile-badge">{rushee.tag}</span>}
          <div className="profile-nights">
            {rushee.attendedNights?.length || 0} night{(rushee.attendedNights?.length || 0) !== 1 ? 's' : ''} attended
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Your Rating</h3>
        <div className="profile-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => handleRate(n)}
              className={`profile-star ${n <= myRating ? 'profile-star--filled' : 'profile-star--empty'}`}
            >
              &#9733;
            </button>
          ))}
          {myRating > 0 && <span className="profile-my-score">{myRating}/5</span>}
        </div>
      </div>

      <div className="profile-section">
        <label className="profile-talked">
          <input type="checkbox" checked={talkedTo} onChange={handleTalkedTo} />
          I've talked to {rushee.displayName?.split(' ')[0]}
        </label>
      </div>

      {isRushChair && (
        <div className="profile-section">
          <h3 className="profile-section-title">Bid Status</h3>
          <div className="profile-bid-row">
            {[
              { status: 'bid', label: 'Bid' },
              { status: 'table', label: 'Table' },
              { status: 'fade', label: 'Fade' },
            ].map(({ status, label }) => (
              <button
                key={status}
                onClick={() => setBidStatus(id, status, memberName)}
                className={`profile-bid-btn ${rushee.bidStatus === status ? `profile-bid-btn--${status}-active` : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="profile-section">
        <h3 className="profile-section-title">Comments</h3>
        <form onSubmit={handleComment} className="profile-comment-form">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="profile-comment-input"
          />
          <button type="submit" disabled={submitting || !commentText.trim()} className="profile-comment-post">
            Post
          </button>
        </form>
        {comments.length === 0 ? (
          <p className="profile-empty">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="profile-comment">
              <div className="profile-comment-author">{c.memberName}</div>
              <div className="profile-comment-text">{c.text}</div>
              <div className="profile-comment-time">
                {c.timestamp?.toDate?.()?.toLocaleString() || ''}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">All Ratings ({ratings.length})</h3>
        {ratings.length === 0 ? (
          <p className="profile-empty">No ratings yet.</p>
        ) : (
          ratings.map((r) => (
            <div key={r.id} className="profile-rating-row">
              <span className="profile-rating-member">{r.memberName}</span>
              <span>
                <span className="profile-rating-stars">{'★'.repeat(r.score)}</span>
                <span className="profile-rating-stars-empty">{'★'.repeat(5 - r.score)}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
