import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function SignIn() {
  const navigate = useNavigate();
  const { sendMagicLink, memberships, isLoggedIn, loading, membershipsLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    if (!loading && !membershipsLoading && isLoggedIn && memberships[0]?.chapterSlug) {
      navigate(`/${memberships[0].chapterSlug}/dashboard`, { replace: true });
    }
  }, [isLoggedIn, loading, memberships, membershipsLoading, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await sendMagicLink(email, { type: 'signIn' });
      setSentTo(email.trim().toLowerCase());
    } catch (err) {
      setError(err?.message || 'Could not send that sign-in link.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !membershipsLoading && isLoggedIn && memberships[0]?.chapterSlug) {
    return <Navigate to={`/${memberships[0].chapterSlug}/dashboard`} replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button onClick={() => navigate('/')} className="auth-back">&larr; Back</button>

        <div className="auth-eyebrow">Email link sign-in</div>
        <h1 className="auth-title">Sign in to your chapter</h1>
        <p className="auth-subtitle">
          We&apos;ll send a secure sign-in link to your email. Use the same address your chapter invite was sent to.
        </p>

        {sentTo ? (
          <div className="auth-success">
            <h2>Check your inbox</h2>
            <p>We sent a sign-in link to {sentTo}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@chapter.edu"
                className="auth-input"
                required
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={submitting} className="auth-submit">
              {submitting ? 'Sending link...' : 'Send sign-in link'}
            </button>
          </form>
        )}

        <p className="auth-footnote">
          New chapter? <Link to="/start">Create your rush process.</Link>
        </p>
      </div>
    </div>
  );
}
