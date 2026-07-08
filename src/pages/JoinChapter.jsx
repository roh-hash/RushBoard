import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptCodeJoin } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useChapterContext } from '../hooks/useChapter';
import './Auth.css';

export default function JoinChapter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const { chapter, loading: chapterLoading } = useChapterContext();
  const { user, loading: authLoading, sendMagicLink, memberships } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    if (chapter?.slug && memberships.some((entry) => entry.chapterId === chapter.id)) {
      navigate(`/${chapter.slug}/dashboard`, { replace: true });
    }
  }, [chapter?.id, chapter?.slug, memberships, navigate]);

  const role = chapter
    ? code === chapter.rushChairJoinCode
      ? 'rush_chair'
      : code === chapter.memberJoinCode
        ? 'member'
        : null
    : null;

  async function handleDirectJoin() {
    if (!chapter?.id || !code || !user) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await acceptCodeJoin({
        chapterId: chapter.id,
        code,
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || '',
      });
      navigate(`/${result.chapterSlug}/dashboard`, { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not join chapter.');
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!chapter?.slug || !code) return;
    setSubmitting(true);
    setError('');
    try {
      await sendMagicLink(email, {
        type: 'joinWithCode',
        chapterSlug: chapter.slug,
        code,
        fullName: fullName.trim(),
      });
      setSentTo(email.trim().toLowerCase());
    } catch (err) {
      setError(err?.message || 'Could not send your sign-in link.');
    } finally {
      setSubmitting(false);
    }
  }

  if (chapterLoading || authLoading) {
    return <div className="auth-page"><div className="auth-card"><p>Loading...</p></div></div>;
  }

  if (!chapter || !code || !role) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Invalid link</h1>
          <p className="auth-subtitle">This join link is invalid or has been regenerated. Ask your chapter for the latest link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--wide">
      <div className="auth-card auth-card--wide">
        <div className="auth-eyebrow">Chapter invite</div>
        <h1 className="auth-title">Join {chapter.displayName} Rush</h1>
        <p className="auth-subtitle">
          This link grants <strong>{role === 'rush_chair' ? 'rush chair' : 'member'}</strong> access.
        </p>

        {sentTo ? (
          <div className="auth-success">
            <h2>Check your inbox</h2>
            <p>We sent your sign-in link to {sentTo}.</p>
            <p className="auth-spam-note">If you don't see it, check your spam folder.</p>
          </div>
        ) : user ? (
          <div className="auth-form">
            <p className="auth-signed-in-note">Signed in as <strong>{user.email}</strong></p>
            {error && <p className="auth-error">{error}</p>}
            <button onClick={handleDirectJoin} disabled={submitting} className="auth-submit">
              {submitting ? 'Joining...' : 'Join chapter'}
            </button>
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
              {submitting ? 'Sending link...' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
