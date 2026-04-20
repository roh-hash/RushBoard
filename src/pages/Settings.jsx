import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChapterInvite, chapterInvitesCol, chapterMembersCol, onSnapshot, orderBy, query, updateChapterProfile, updateChapterSettings } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { chapter, membership, settings } = useChapterContext();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    const unsubscribeMembers = onSnapshot(
      query(chapterMembersCol(chapter.id), orderBy('fullName', 'asc')),
      (snap) => setMembers(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    );

    const unsubscribeInvites = onSnapshot(
      query(chapterInvitesCol(chapter.id), orderBy('createdAt', 'desc')),
      (snap) => setInvites(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    );

    return () => {
      unsubscribeMembers();
      unsubscribeInvites();
    };
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

        <InviteSettingsCard
          key={`${chapter.id}:${membership.uid}`}
          chapter={chapter}
          membership={membership}
          invites={invites}
        />
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

function InviteSettingsCard({ chapter, membership, invites }) {
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'member',
  });
  const [inviteMessage, setInviteMessage] = useState('');

  async function handleCreateInvite(event) {
    event.preventDefault();
    const inviteId = await createChapterInvite(chapter.id, {
      fullName: inviteForm.fullName,
      email: inviteForm.email,
      role: inviteForm.role,
      createdByUid: membership.uid,
      createdByName: membership.fullName,
    });

    const joinUrl = `${window.location.origin}/${chapter.slug}/join?invite=${inviteId}`;
    await navigator.clipboard.writeText(joinUrl).catch(() => {});
    setInviteMessage('Invite link copied to clipboard.');
    setInviteForm({ fullName: '', email: '', role: 'member' });
    setTimeout(() => setInviteMessage(''), 2500);
  }

  return (
    <section className="settings-card">
      <h2>Invite members</h2>
      <form onSubmit={handleCreateInvite} className="settings-form">
        <label className="settings-field">
          <span>Full name</span>
          <input
            type="text"
            value={inviteForm.fullName}
            onChange={(event) => setInviteForm((current) => ({ ...current, fullName: event.target.value }))}
            className="settings-input"
          />
        </label>
        <label className="settings-field">
          <span>Email</span>
          <input
            type="email"
            value={inviteForm.email}
            onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
            className="settings-input"
          />
        </label>
        <label className="settings-field">
          <span>Role</span>
          <select
            value={inviteForm.role}
            onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
            className="settings-input"
          >
            <option value="member">Member</option>
            <option value="rush_chair">Rush Chair</option>
          </select>
        </label>
        {inviteMessage && <p className="settings-message">{inviteMessage}</p>}
        <button type="submit" className="settings-submit">Create invite link</button>
      </form>

      <div className="settings-list">
        <h3>Recent invites</h3>
        {invites.length === 0 ? (
          <p className="settings-empty">No invites yet.</p>
        ) : (
          invites.map((invite) => (
            <div key={invite.id} className="settings-list-row">
              <div>
                <div className="settings-list-title">{invite.fullName || invite.email}</div>
                <div className="settings-list-subtitle">{invite.role} · {invite.status}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
