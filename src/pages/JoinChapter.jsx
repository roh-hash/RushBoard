import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getChapterInvite } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useChapterContext } from '../hooks/useChapter';
import './Auth.css';

export default function JoinChapter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('invite');
  const { chapter } = useChapterContext();
  const { sendMagicLink, memberships } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      if (!chapter?.id || !inviteId) {
        setLoading(false);
        return;
      }

      const nextInvite = await getChapterInvite(chapter.id, inviteId);
      if (cancelled) return;
      setInvite(nextInvite);
      setFullName(nextInvite?.fullName || '');
      setEmail(nextInvite?.email || '');
      setLoading(false);
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [chapter?.id, inviteId]);

  useEffect(() => {
    if (chapter?.slug && memberships.some((entry) => entry.chapterId === chapter.id)) {
      navigate(`/${chapter.slug}/dashboard`, { replace: true });
    }
  }, [chapter?.id, chapter?.slug, memberships, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!chapter?.slug || !inviteId) return;

    setSubmitting(true);
    setError('');

    try {
      await sendMagicLink(email, {
        type: 'joinChapter',
        chapterSlug: chapter.slug,
        inviteId,
        fullName: fullName.trim(),
      });
      setSentTo(email.trim().toLowerCase());
    } catch (err) {
      setError(err?.message || 'Could not send your join link.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="auth-page"><div className="auth-card"><p>Loading invite...</p></div></div>;
  }

  if (!chapter || !inviteId || !invite) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Invite not found</h1>
          <p className="auth-subtitle">Ask your rush chair for a fresh chapter invite link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--wide">
      <div className="auth-card auth-card--wide">
        <button onClick={() => navigate('/')} className="auth-back">&larr; Back</button>
        <div className="auth-eyebrow">Chapter invite</div>
        <h1 className="auth-title">Join {chapter.displayName} Rush</h1>
        <p className="auth-subtitle">
          This invite grants {invite.role === 'rush_chair' ? 'rush chair' : 'member'} access for this chapter.
        </p>

        {sentTo ? (
          <div className="auth-success">
            <h2>Check your inbox</h2>
            <p>We sent your join link to {sentTo}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-grid">
              <label className="auth-field">
                <span>Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="auth-input"
                  required
                />
              </label>
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  required
                />
              </label>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={submitting} className="auth-submit">
              {submitting ? 'Sending link...' : 'Join chapter'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
