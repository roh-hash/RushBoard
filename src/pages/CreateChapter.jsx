import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChapterWithOwner } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { GoogleButton } from '../components/GoogleButton';
import './Auth.css';

export default function CreateChapter() {
  const navigate = useNavigate();
  const { sendMagicLink, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({
    fraternityName: '',
    charterName: '',
    fullName: '',
    email: '',
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function addTag(tagText) {
    const cleaned = tagText.trim();
    if (!cleaned) return;
    setTags((current) => {
      const lower = cleaned.toLowerCase();
      if (current.some((t) => t.toLowerCase() === lower)) return current;
      return [...current, cleaned];
    });
    setTagInput('');
  }

  function removeTag(tagToRemove) {
    setTags((current) => current.filter((t) => t !== tagToRemove));
  }

  function saveTag() {
    addTag(tagInput);
    setAddingTag(false);
  }

  function handleTagKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      saveTag();
    }
    if (event.key === 'Escape') {
      setTagInput('');
      setAddingTag(false);
    }
  }

  async function handleGoogleCreate() {
    setError('');
    if (!form.fraternityName.trim() || !form.charterName.trim() || !form.fullName.trim()) {
      setError('Fill in the fraternity name, chapter name, and your name first.');
      return;
    }
    setSubmitting(true);
    try {
      const googleUser = await signInWithGoogle();
      const created = await createChapterWithOwner({
        fraternityName: form.fraternityName.trim(),
        charterName: form.charterName.trim(),
        ownerUid: googleUser.uid,
        ownerEmail: googleUser.email,
        ownerName: form.fullName.trim(),
        rusheeTags: tags,
      });
      navigate(`/${created.slug}/dashboard`, { replace: true });
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(err?.message || 'Could not create the chapter.');
      }
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.email.trim()) {
      setError('Enter your email to get a setup link, or use Create with Google.');
      return;
    }
    setSubmitting(true);

    try {
      await sendMagicLink(form.email, {
        type: 'createChapter',
        fraternityName: form.fraternityName.trim(),
        charterName: form.charterName.trim(),
        fullName: form.fullName.trim(),
        rusheeTags: tags,
      });
      setSentTo(form.email.trim().toLowerCase());
    } catch (err) {
      setError(err?.message || 'Could not start chapter onboarding.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page auth-page--wide">
      <div className="auth-card auth-card--wide">
        <button onClick={() => navigate('/')} className="auth-back">&larr; Back</button>

        <div className="auth-eyebrow">Chapter onboarding</div>
        <h1 className="auth-title">Create your chapter&apos;s RushBoard</h1>
        <p className="auth-subtitle">
          Start with the chapter name, the first rush chair, and the rushee tags your chapter actually uses.
        </p>

        {sentTo ? (
          <div className="auth-success">
            <h2>Finish setup from your email</h2>
            <p>We sent a secure setup link to {sentTo}. Open it on this device to create the chapter.</p>
            <p className="auth-spam-note">If you don't see it, check your spam folder.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-grid">
              <label className="auth-field">
                <span>Fraternity name</span>
                <input
                  type="text"
                  value={form.fraternityName}
                  onChange={updateField('fraternityName')}
                  placeholder="Sigma Nu"
                  className="auth-input"
                  required
                />
              </label>
              <label className="auth-field">
                <span>Charter / chapter name</span>
                <input
                  type="text"
                  value={form.charterName}
                  onChange={updateField('charterName')}
                  placeholder="Beta Theta"
                  className="auth-input"
                  required
                />
              </label>
            </div>

            <div className="auth-grid">
              <label className="auth-field">
                <span>Your full name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={updateField('fullName')}
                  placeholder="Jordan Lee"
                  className="auth-input"
                  required
                />
              </label>
              <label className="auth-field">
                <span>Your email (only needed for the email link)</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  placeholder="jordan@school.edu"
                  className="auth-input"
                />
              </label>
            </div>

            <div className="auth-field">
              <span className="auth-field-label">Rushee tags</span>

              {tags.length > 0 && (
                <div className="auth-chip-row">
                  {tags.map((tag) => (
                    <span key={tag} className="auth-chip auth-chip--removable">
                      {tag}
                      <button
                        type="button"
                        className="auth-chip-remove"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {addingTag ? (
                <div className="auth-tag-add-row">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Ex: Legacy, DJ, Athlete"
                    className="auth-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-tag-save-btn"
                    onClick={saveTag}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="auth-tag-add-btn"
                  onClick={() => setAddingTag(true)}
                >
                  + Add tag
                </button>
              )}

            </div>

            {error && <p className="auth-error">{error}</p>}
            <GoogleButton onClick={handleGoogleCreate} disabled={submitting} label="Create with Google" />
            <div className="auth-divider">or get a setup link by email</div>
            <button type="submit" disabled={submitting} className="auth-submit">
              {submitting ? 'Working...' : 'Email me a setup link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
