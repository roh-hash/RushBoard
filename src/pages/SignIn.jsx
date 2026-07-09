import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleButton } from '../components/GoogleButton';
import './Auth.css';

export default function SignIn() {
  const navigate = useNavigate();
  const { sendMagicLink, signInWithGoogle, memberships, isLoggedIn, loading, membershipsLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const noMembership = !loading && !membershipsLoading && isLoggedIn && memberships.length === 0;

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

  async function handleGoogle() {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // The memberships effect above routes to the dashboard once they load.
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(err?.message || 'Could not sign in with Google.');
      }
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

        <div className="auth-eyebrow">Chapter sign-in</div>
        <h1 className="auth-title">Sign in to your chapter</h1>
        <p className="auth-subtitle">
          Use the same Google account or email address your chapter knows you by.
        </p>

        {sentTo ? (
          <div className="auth-success">
            <h2>Check your inbox</h2>
            <p>We sent a sign-in link to {sentTo}.</p>
            <p className="auth-spam-note">If you don't see it, check your spam folder.</p>
          </div>
        ) : (
          <div className="auth-form">
            <GoogleButton onClick={handleGoogle} disabled={submitting} label="Sign in with Google" />
            {noMembership && (
              <p className="auth-error">
                You&apos;re signed in, but no chapter membership was found for this account.
                Ask your rush chair for a join link, or create a new chapter below.
              </p>
            )}
            <div className="auth-divider">or use email</div>
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
                {submitting ? 'Working...' : 'Send sign-in link'}
              </button>
            </form>
          </div>
        )}

        <p className="auth-footnote">
          New chapter? <Link to="/start">Create your rush process.</Link>
        </p>
      </div>
    </div>
  );
}
