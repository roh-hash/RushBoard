import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { regenerateJoinCode, chapterJoinCodesDoc, chapterMembersCol, onSnapshot, orderBy, query, removeMember, updateChapterProfile, updateChapterSettings, updateMemberRole } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { chapter, settings, membership } = useChapterContext();
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

      <MembersCard chapter={chapter} members={members} currentMemberUid={membership?.uid} />
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
  const [codes, setCodes] = useState(null);
  const [memberMsg, setMemberMsg] = useState('');
  const [rushChairMsg, setRushChairMsg] = useState('');
  const [regenerating, setRegenerating] = useState('');

  useEffect(() => {
    return onSnapshot(chapterJoinCodesDoc(chapter.id), (snap) => {
      if (snap.exists()) setCodes(snap.data());
    });
  }, [chapter.id]);

  function buildLink(code, role) {
    return `${window.location.origin}/${chapter.slug}/join?code=${code}&role=${role}`;
  }

  async function handleCopy(role) {
    const codeField = role === 'rush_chair' ? 'rushChairCode' : 'memberCode';
    let code = codes?.[codeField];
    if (!code) {
      code = await regenerateJoinCode(chapter.id, role);
    }
    await navigator.clipboard.writeText(buildLink(code, role)).catch(() => {});
    const set = role === 'rush_chair' ? setRushChairMsg : setMemberMsg;
    set('Link copied!');
    setTimeout(() => set(''), 2500);
  }

  async function handleRegenerate(role) {
    if (!window.confirm(`Regenerate? Anyone using the old ${role === 'rush_chair' ? 'rush chair' : 'member'} link will no longer be able to join.`)) return;
    setRegenerating(role);
    try {
      const newCode = await regenerateJoinCode(chapter.id, role);
      await navigator.clipboard.writeText(buildLink(newCode, role)).catch(() => {});
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

function MembersCard({ chapter, members, currentMemberUid }) {
  const [pendingUid, setPendingUid] = useState(null);
  const rushChairCount = members.filter((m) => m.role === 'rush_chair').length;

  const handleRoleChange = useCallback(async (memberEntry) => {
    const newRole = memberEntry.role === 'rush_chair' ? 'member' : 'rush_chair';
    setPendingUid(memberEntry.uid);
    try {
      await updateMemberRole(chapter.id, memberEntry.uid, newRole, currentMemberUid);
    } finally {
      setPendingUid(null);
    }
  }, [chapter.id, currentMemberUid]);

  const handleRemove = useCallback(async (memberEntry) => {
    if (!window.confirm(`Remove ${memberEntry.fullName || memberEntry.email} from this chapter?`)) return;
    setPendingUid(memberEntry.uid);
    try {
      await removeMember(chapter.id, memberEntry.uid);
    } finally {
      setPendingUid(null);
    }
  }, [chapter.id]);

  return (
    <section className="settings-card settings-card--full">
      <h2>Active members</h2>
      <div className="settings-list settings-list--grid">
        {members.map((memberEntry) => {
          const isSelf = memberEntry.uid === currentMemberUid;
          const isOnlyRushChair = memberEntry.role === 'rush_chair' && rushChairCount === 1;
          const isPending = pendingUid === memberEntry.uid;

          return (
            <div key={memberEntry.id} className="settings-list-row">
              <div>
                <div className="settings-list-title">{memberEntry.fullName || memberEntry.email}</div>
                <div className="settings-list-subtitle">{memberEntry.email}</div>
              </div>
              <div className="settings-member-right">
                <span className="settings-role">
                  {memberEntry.role === 'rush_chair' ? 'Rush Chair' : 'Member'}
                </span>
                {!isSelf && (
                  <div className="settings-member-actions">
                    <button
                      className="settings-member-btn"
                      onClick={() => handleRoleChange(memberEntry)}
                      disabled={isPending || isOnlyRushChair}
                      title={isOnlyRushChair ? "Cannot change the only rush chair's role" : undefined}
                    >
                      {memberEntry.role === 'rush_chair' ? '→ Member' : '→ Rush Chair'}
                    </button>
                    <button
                      className="settings-member-btn settings-member-btn--remove"
                      onClick={() => handleRemove(memberEntry)}
                      disabled={isPending || isOnlyRushChair}
                      title={isOnlyRushChair ? 'Cannot remove the only rush chair' : undefined}
                    >
                      {isPending ? '···' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
