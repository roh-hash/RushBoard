import { useState } from 'react';
import { useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { createRushee, uploadRusheePhoto } from '../lib/firebase';
import './CheckIn.css';

const YEAR_OPTIONS = ['Freshman', 'Sophomore'];
const CATEGORIES = ['Legacy', 'DJ', 'Biker', 'Hooper'];

export default function CheckIn() {
  const { nightId } = useParams();
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

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleTag(tag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
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
      setError('Could not process photo. Try another.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }

    setSubmitting(true);
    try {
      let photoURL = '';
      if (photo) {
        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        photoURL = await uploadRusheePhoto(photo, tempId);
      }

      await createRushee({
        ...form,
        tag: tags.join(', '),
        photoURL,
        nightId,
      });

      setDone({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        photoURL,
      });
    } catch (err) {
      console.error(err);
      if (!navigator.onLine) {
        setError('You appear to be offline. Connect to Wi-Fi and try again.');
      } else if (err?.code === 'storage/unauthorized' || err?.code === 'permission-denied') {
        setError('Check-in is temporarily unavailable. Ask a member for help.');
      } else {
        setError('Something went wrong. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="checkin-done">
        {done.photoURL && (
          <img src={done.photoURL} alt={done.name} className="checkin-done-photo" />
        )}
        <h1>You're checked in!</h1>
        <p className="checkin-done-name">{done.name}</p>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      <h1 className="checkin-title">Rush Check-In</h1>
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
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Categories</label>
          <div className="checkin-tags">
            {CATEGORIES.map((cat) => (
              <label key={cat} className="checkin-tag">
                <input
                  type="checkbox"
                  checked={tags.includes(cat)}
                  onChange={() => toggleTag(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>
        <div className="checkin-field">
          <label className="checkin-label">Selfie</label>
          <input type="file" accept="image/*" capture="user" onChange={handlePhoto} className="checkin-file-input" />
          {preview && (
            <img src={preview} alt="Preview" className="checkin-photo-preview" />
          )}
        </div>

        {error && <p className="checkin-error">{error}</p>}

        <button type="submit" disabled={submitting} className="checkin-submit">
          {submitting ? 'Checking in...' : 'Check In'}
        </button>
      </form>
    </div>
  );
}
