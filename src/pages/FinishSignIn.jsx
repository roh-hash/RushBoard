import { useEffect, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { acceptCodeJoin, createChapterWithOwner, getChapterBySlug, listUserMemberships } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

function getFlowFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('flow');
    return raw ? JSON.parse(decodeURIComponent(raw)) : null;
  } catch {
    return null;
  }
}

export default function FinishSignIn() {
  const navigate = useNavigate();
  const {
    completeMagicLink,
    clearPendingFlow,
    isMagicLink,
    pendingEmail,
    pendingFlow: storedFlow,
  } = useAuth();
  // Fall back to URL-encoded flow when localStorage is empty (cross-device sign-in).
  const pendingFlow = storedFlow || getFlowFromUrl();
  const [email, setEmail] = useState(pendingEmail || '');
  const [status, setStatus] = useState('init');
  const [message, setMessage] = useState('Verifying your sign-in link...');

  useEffect(() => {
    if (!isMagicLink(window.location.href)) {
      setStatus('error');
      setMessage('That sign-in link is invalid or expired.');
      return;
    }

    if (!pendingEmail) {
      setStatus('needs_email');
      setMessage('Enter the same email address you used when requesting the sign-in link.');
      return;
    }

    completeSignIn(pendingEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completeSignIn(emailToUse) {
    setStatus('working');
    setMessage('Verifying your sign-in link...');

    try {
      const credential = await completeMagicLink(emailToUse, window.location.href);
      const signedInUser = credential.user;

      if (pendingFlow?.fullName) {
        await updateProfile(signedInUser, { displayName: pendingFlow.fullName }).catch(() => {});
      }

      if (pendingFlow?.type === 'createChapter') {
        const created = await createChapterWithOwner({
          fraternityName: pendingFlow.fraternityName,
          charterName: pendingFlow.charterName,
          ownerUid: signedInUser.uid,
          ownerEmail: signedInUser.email || emailToUse,
          ownerName: pendingFlow.fullName,
          rusheeTags: pendingFlow.rusheeTags,
        });
        clearPendingFlow();
        navigate(`/${created.slug}/dashboard`, { replace: true });
        return;
      }

      if (pendingFlow?.type === 'joinWithCode') {
        const chapter = await getChapterBySlug(pendingFlow.chapterSlug);
        if (!chapter) {
          throw new Error('Chapter not found.');
        }
        const result = await acceptCodeJoin({
          chapterId: chapter.id,
          code: pendingFlow.code,
          uid: signedInUser.uid,
          email: signedInUser.email || emailToUse,
          fullName: pendingFlow.fullName || signedInUser.displayName || '',
        });
        clearPendingFlow();
        navigate(`/${result.chapterSlug}/dashboard`, { replace: true });
        return;
      }

      clearPendingFlow();

      const liveMemberships = await listUserMemberships(signedInUser.uid);
      if (liveMemberships[0]?.chapterSlug) {
        navigate(`/${liveMemberships[0].chapterSlug}/dashboard`, { replace: true });
        return;
      }

      setStatus('error');
      setMessage('You are signed in, but no chapter membership was found for this email.');
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Could not complete sign-in.');
    }
  }

  function handleEmailSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return;
    completeSignIn(email.trim().toLowerCase());
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-eyebrow">Complete sign-in</div>
        <h1 className="auth-title">Finish your RushBoard access</h1>
        <p className="auth-subtitle">{message}</p>

        {status === 'needs_email' && (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="auth-input"
                placeholder="you@chapter.edu"
                required
              />
            </label>
            <button type="submit" className="auth-submit">
              Continue
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="auth-footnote">
            Need a new link? <Link to="/sign-in">Request another sign-in email.</Link>
          </p>
        )}
      </div>
    </div>
  );
}
