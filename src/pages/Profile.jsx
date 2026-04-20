import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addComment, commentsRef, db, doc, getTalkedTo, onSnapshot, orderBy, query, ratingsRef, setBidStatus, setRating, setTalkedTo } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { chapter, membership, isRushChair } = useChapterContext();
  const [rushee, setRushee] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [talkedTo, setTalkedToState] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!chapter?.id) return undefined;

    return onSnapshot(doc(db, 'chapters', chapter.id, 'rushees', id), (snap) => {
      if (snap.exists()) {
        setRushee({ id: snap.id, ...snap.data() });
      }
    });
  }, [chapter?.id, id]);

  useEffect(() => {
    if (!chapter?.id || !membership?.uid) return undefined;

    return onSnapshot(query(ratingsRef(chapter.id, id), orderBy('timestamp', 'desc')), (snap) => {
      const nextRatings = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      setRatings(nextRatings);
      const mine = nextRatings.find((entry) => entry.memberUid === membership.uid);
      setMyRating(mine?.score || 0);
    });
  }, [chapter?.id, id, membership?.uid]);

  useEffect(() => {
    if (!chapter?.id) return undefined;

    return onSnapshot(query(commentsRef(chapter.id, id), orderBy('timestamp', 'desc')), (snap) => {
      setComments(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    });
  }, [chapter?.id, id]);

  useEffect(() => {
    if (!chapter?.id || !membership?.uid) return;
    getTalkedTo(chapter.id, id, membership.uid).then(setTalkedToState);
  }, [chapter?.id, id, membership?.uid]);

  async function handleRate(score) {
    setMyRating(score);
    await setRating(chapter.id, id, membership, score);
  }

  async function handleComment(event) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await addComment(chapter.id, id, membership, commentText.trim());
    setCommentText('');
    setSubmitting(false);
  }

  async function handleTalkedTo() {
    const nextValue = !talkedTo;
    setTalkedToState(nextValue);
    await setTalkedTo(chapter.id, id, membership, nextValue);
  }

  if (!rushee) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <button onClick={() => navigate(`/${chapter.slug}/dashboard`)} className="profile-back">&larr; Back</button>

      <div className="profile-header">
        {rushee.photoURL ? (
          <img src={rushee.photoURL} alt={rushee.displayName} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {rushee.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <p className="profile-kicker">{chapter.displayName} Rush</p>
          <h1 className="profile-name">{rushee.displayName}</h1>
          {rushee.hometown && <div className="profile-hometown">{rushee.hometown}</div>}
          {rushee.year && <div className="profile-year">{rushee.year}</div>}
          {rushee.tags?.length > 0 && (
            <div className="profile-badges">
              {rushee.tags.map((tag) => <span key={tag} className="profile-badge">{tag}</span>)}
            </div>
          )}
          <div className="profile-nights">
            {rushee.attendedNights?.length || 0} night{(rushee.attendedNights?.length || 0) !== 1 ? 's' : ''} attended
          </div>
          {rushee.avgRating != null && (
            <div className="profile-avg">
              <span className="profile-avg-value">{rushee.avgRating.toFixed(1)}</span>
              <span className="profile-avg-stars">
                {'★'.repeat(Math.round(rushee.avgRating))}{'☆'.repeat(5 - Math.round(rushee.avgRating))}
              </span>
              <span className="profile-avg-label">{rushee.ratingCount} rating{rushee.ratingCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Your Rating</h3>
        <div className="profile-stars">
          {[1, 2, 3, 4, 5].map((number) => (
            <button
              key={number}
              onClick={() => handleRate(number)}
              className={`profile-star ${number <= myRating ? 'profile-star--filled' : 'profile-star--empty'}`}
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
          I&apos;ve talked to {rushee.displayName?.split(' ')[0]}
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
                onClick={() => setBidStatus(chapter.id, id, status, membership)}
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
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Add a comment..."
            className="profile-comment-input"
          />
          <button type="submit" disabled={submitting || !commentText.trim()} className="profile-comment-post">
            Post
          </button>
        </form>
        {comments.length === 0 ? (
          <p className="profile-empty">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="profile-comment">
              <div className="profile-comment-author">{comment.memberName}</div>
              <div className="profile-comment-text">{comment.text}</div>
              <div className="profile-comment-time">
                {comment.timestamp?.toDate?.()?.toLocaleString() || ''}
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
          ratings.map((rating) => (
            <div key={rating.id} className="profile-rating-row">
              <span className="profile-rating-member">{rating.memberName}</span>
              <span>
                <span className="profile-rating-stars">{'★'.repeat(rating.score)}</span>
                <span className="profile-rating-stars-empty">{'★'.repeat(5 - rating.score)}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
