import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { DEFAULT_RUSHEE_TAGS, getRushNight, submitRusheeCheckIn } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import './CheckIn.css';

const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Other'];

export default function CheckIn() {
  const { nightId } = useParams();
  const { chapter, settings, loading: chapterLoading } = useChapterContext();
  const [night, setNight] = useState(null);
  const [nightLoading, setNightLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    hometown: '',
    year: '',
  });
  const [tags, setTags] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const tagOptions = useMemo(
    () => settings?.rusheeTags?.length ? settings.rusheeTags : DEFAULT_RUSHEE_TAGS,
    [settings?.rusheeTags],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadNight() {
      if (!chapter?.id) return;
      const nextNight = await getRushNight(chapter.id, nightId);
      if (!cancelled) {
        setNight(nextNight);
        setNightLoading(false);
      }
    }

    loadNight();

    return () => {
      cancelled = true;
    };
  }, [chapter?.id, nightId]);

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function toggleTag(tag) {
    setTags((current) => (
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag]
    ));
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      setPhoto(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError('Could not process that photo. Try a different one.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }

    if (!chapter?.id) {
      setError('This chapter could not be loaded.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitRusheeCheckIn({
        chapterId: chapter.id,
        nightId,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        hometown: form.hometown,
        year: form.year,
        tags,
        photo,
      });

      setDone({
        name: result.displayName,
        photoURL: result.photoURL,
        created: result.created,
      });
    } catch (err) {
      if (!navigator.onLine) {
        setError('You appear to be offline. Connect to the internet and try again.');
      } else {
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // nightLoading only resolves once a chapter is found, so gate it on chapter
  // to avoid an infinite spinner on URLs with a bad chapter slug.
  if (chapterLoading || (chapter && nightLoading)) {
    return <div className="checkin-page"><p>Loading check-in...</p></div>;
  }

  if (!chapter || !night?.isActive) {
    return (
      <div className="checkin-page">
        <h1 className="checkin-title">Check-in unavailable</h1>
        <p className="checkin-copy">This rush night link is not active anymore.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="checkin-done">
        {done.photoURL && <img src={done.photoURL} alt={done.name} className="checkin-done-photo" />}
        <p className="checkin-kicker">{chapter.displayName} Rush</p>
        <h1>{done.created ? "You're checked in!" : "You're already on the board!"}</h1>
        <p className="checkin-done-name">{done.name}</p>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      <p className="checkin-kicker">{chapter.displayName} Rush</p>
      <h1 className="checkin-title">{night.label}</h1>
      <p className="checkin-copy">Fill this out once and your chapter roster updates live for everyone inside RushBoard.</p>

      <form onSubmit={handleSubmit}>
        <div className="checkin-field">
          <label className="checkin-label">First name *</label>
          <input type="text" value={form.firstName} onChange={updateField('firstName')} className="checkin-input" />
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Last name *</label>
          <input type="text" value={form.lastName} onChange={updateField('lastName')} className="checkin-input" />
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Phone</label>
          <input type="tel" value={form.phone} onChange={updateField('phone')} className="checkin-input" />
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Hometown</label>
          <input type="text" value={form.hometown} onChange={updateField('hometown')} className="checkin-input" />
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Year</label>
          <select value={form.year} onChange={updateField('year')} className="checkin-select">
            <option value="">Select</option>
            {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Tags</label>
          <div className="checkin-tags">
            {tagOptions.map((tag) => (
              <label key={tag} className="checkin-tag">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Selfie</label>
          <input type="file" accept="image/*" capture="user" onChange={handlePhoto} className="checkin-file-input" />
          {preview && <img src={preview} alt="Preview" className="checkin-photo-preview" />}
        </div>

        {error && <p className="checkin-error">{error}</p>}

        <button type="submit" disabled={submitting} className="checkin-submit">
          {submitting ? 'Checking in...' : 'Check In'}
        </button>
      </form>
    </div>
  );
}
