import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { regenerateJoinCode, chapterMembersCol, onSnapshot, orderBy, query, updateChapterProfile, updateChapterSettings } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { chapter, settings } = useChapterContext();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(chapterMembersCol(chapter.id), orderBy('fullName', 'asc')),
      (snap) => setMembers(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    );
    return unsubscribe;
  }, [chapter.id]);

  return (
    <div className="settings-page">
      <button onClick={() => navigate(`/${chapter.slug}/dashboard`)} className="settings-back">&larr; Back to Dashboard</button>
      <p className="settings-kicker">{chapter.displayName} Rush</p>
      <h1 className="settings-title">Chapter Settings</h1>

      <div className="settings-grid">
        <IdentitySettingsCard
          key={`${chapter.id}:${chapter.fraternityName}:${chapter.charterName}:${(settings?.rusheeTags || []).join('|')}`}
          chapter={chapter}
          settings={settings}
        />

        <JoinLinksCard chapter={chapter} />
      </div>

      <section className="settings-card settings-card--full">
        <h2>Active members</h2>
        <div className="settings-list settings-list--grid">
          {members.map((memberEntry) => (
            <div key={memberEntry.id} className="settings-list-row">
              <div>
                <div className="settings-list-title">{memberEntry.fullName || memberEntry.email}</div>
                <div className="settings-list-subtitle">{memberEntry.email}</div>
              </div>
              <span className="settings-role">{memberEntry.role === 'rush_chair' ? 'Rush Chair' : 'Member'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function IdentitySettingsCard({ chapter, settings }) {
  const [identity, setIdentity] = useState({
    fraternityName: chapter.fraternityName,
    charterName: chapter.charterName,
  });
  const [tags, setTags] = useState(settings?.rusheeTags || []);
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

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

  async function handleSaveIdentity(event) {
    event.preventDefault();
    await updateChapterProfile(chapter.id, identity);
    await updateChapterSettings(chapter.id, { rusheeTags: tags });
    setSavedMessage('Saved chapter identity and tags.');
    setTimeout(() => setSavedMessage(''), 2500);
  }

  return (
    <section className="settings-card">
      <h2>Chapter identity</h2>
      <form onSubmit={handleSaveIdentity} className="settings-form">
        <label className="settings-field">
          <span>Fraternity name</span>
          <input
            type="text"
            value={identity.fraternityName}
            onChange={(event) => setIdentity((current) => ({ ...current, fraternityName: event.target.value }))}
            className="settings-input"
          />
        </label>
        <label className="settings-field">
          <span>Charter / chapter name</span>
          <input
            type="text"
            value={identity.charterName}
            onChange={(event) => setIdentity((current) => ({ ...current, charterName: event.target.value }))}
            className="settings-input"
          />
        </label>

        <div className="settings-field">
          <span>Rushee tags</span>
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
                className="settings-input"
                autoFocus
              />
              <button type="button" className="auth-tag-save-btn" onClick={saveTag}>
                Save
              </button>
            </div>
          ) : (
            <button type="button" className="auth-tag-add-btn" onClick={() => setAddingTag(true)}>
              + Add tag
            </button>
          )}
        </div>

        {savedMessage && <p className="settings-message">{savedMessage}</p>}
        <button type="submit" className="settings-submit">Save settings</button>
      </form>
    </section>
  );
}

function JoinLinksCard({ chapter }) {
  const [memberMsg, setMemberMsg] = useState('');
  const [rushChairMsg, setRushChairMsg] = useState('');
  const [regenerating, setRegenerating] = useState('');

  function buildLink(code) {
    return `${window.location.origin}/${chapter.slug}/join?code=${code}`;
  }

  async function handleCopy(role) {
    let code = role === 'rush_chair' ? chapter.rushChairJoinCode : chapter.memberJoinCode;
    // Generate code if this is an older chapter that doesn't have one yet.
    if (!code) {
      code = await regenerateJoinCode(chapter.id, role);
    }
    await navigator.clipboard.writeText(buildLink(code)).catch(() => {});
    const set = role === 'rush_chair' ? setRushChairMsg : setMemberMsg;
    set('Link copied!');
    setTimeout(() => set(''), 2500);
  }

  async function handleRegenerate(role) {
    if (!window.confirm(`Regenerate? Anyone using the old ${role === 'rush_chair' ? 'rush chair' : 'member'} link will no longer be able to join.`)) return;
    setRegenerating(role);
    try {
      const newCode = await regenerateJoinCode(chapter.id, role);
      await navigator.clipboard.writeText(buildLink(newCode)).catch(() => {});
      const set = role === 'rush_chair' ? setRushChairMsg : setMemberMsg;
      set('Regenerated and copied!');
      setTimeout(() => set(''), 3000);
    } finally {
      setRegenerating('');
    }
  }

  return (
    <section className="settings-card">
      <h2>Join links</h2>
      <p className="settings-join-hint">Share these links with your chapter. Anyone with the link can join.</p>

      <div className="settings-join-links">
        {[
          {
            role: 'member',
            label: 'Member link',
            subtitle: 'Roster, ratings, and comments',
            msg: memberMsg,
          },
          {
            role: 'rush_chair',
            label: 'Rush chair link',
            subtitle: 'Full access — QR, bids, settings',
            msg: rushChairMsg,
          },
        ].map(({ role, label, subtitle, msg }) => (
          <div key={role} className="settings-join-link-row">
            <div className="settings-join-link-info">
              <div className="settings-list-title">{label}</div>
              <div className="settings-list-subtitle">{subtitle}</div>
              {msg && <p className="settings-message">{msg}</p>}
            </div>
            <div className="settings-join-link-actions">
              <button onClick={() => handleCopy(role)} className="settings-submit">
                Copy link
              </button>
              <button
                onClick={() => handleRegenerate(role)}
                disabled={!!regenerating}
                className="settings-regen-btn"
              >
                {regenerating === role ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
