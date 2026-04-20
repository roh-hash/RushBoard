import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { createRushNight, onSnapshot, orderBy, query, rushNightsRef } from '../lib/firebase';
import { useChapterContext } from '../hooks/useChapter';
import './QRCodes.css';

export default function QRCodes() {
  const navigate = useNavigate();
  const { chapter, membership } = useChapterContext();
  const [nights, setNights] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!chapter?.id) return undefined;

    return onSnapshot(query(rushNightsRef(chapter.id), orderBy('createdAt', 'desc')), (snap) => {
      setNights(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    });
  }, [chapter?.id]);

  async function handleCreate(event) {
    event.preventDefault();
    setError('');

    if (!label.trim()) {
      setError('Enter a label for this rush night.');
      return;
    }

    setCreating(true);
    try {
      await createRushNight(chapter.id, label.trim(), membership);
      setLabel('');
      setShowCreate(false);
    } catch (err) {
      setError(err?.message || 'Could not create rush night.');
    } finally {
      setCreating(false);
    }
  }

  const baseUrl = window.location.origin;

  return (
    <div className="qr-page">
      <button onClick={() => navigate(`/${chapter.slug}/dashboard`)} className="qr-back">&larr; Back to Dashboard</button>
      <p className="qr-kicker">{chapter.displayName} Rush</p>
      <h1 className="qr-title">Rush Night QR Codes</h1>

      <button onClick={() => setShowCreate((current) => !current)} className="qr-create-btn">
        {showCreate ? 'Cancel' : '+ New Rush Night'}
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="qr-create-form">
          <div className="qr-create-field">
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder='Night label (e.g. "BBQ Night")'
              className="qr-create-input"
            />
          </div>
          {error && <p className="qr-create-error">{error}</p>}
          <button type="submit" disabled={creating} className="qr-create-submit">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {nights.length === 0 ? (
        <p className="qr-empty">No rush nights yet. Create one above.</p>
      ) : (
        nights.map((night) => (
          <NightCard key={night.id} night={night} baseUrl={baseUrl} chapterSlug={chapter.slug} />
        ))
      )}
    </div>
  );
}

function NightCard({ night, baseUrl, chapterSlug }) {
  const canvasRef = useRef(null);
  const checkinUrl = `${baseUrl}/${chapterSlug}/checkin/${night.id}`;
  const dashboardUrl = `${baseUrl}/${chapterSlug}/dashboard`;
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;
    const scale = window.devicePixelRatio || 1;
    const displaySize = 200;
    QRCode.toCanvas(canvasRef.current, checkinUrl, { width: displaySize * scale, margin: 2 });
    canvasRef.current.style.width = `${displaySize}px`;
    canvasRef.current.style.height = `${displaySize}px`;
  }, [checkinUrl]);

  function copyLink(url, label) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  function downloadQR() {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${night.label || night.id}-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="qr-night-card">
      <div className="qr-night-layout">
        <div className="qr-night-canvas">
          <canvas ref={canvasRef} />
        </div>
        <div className="qr-night-info">
          <h3 className="qr-night-label">{night.label || night.id}</h3>
          <div className="qr-night-creator">Created by {night.createdByName}</div>

          <div className="qr-night-links">
            <LinkRow label="Check-in" url={checkinUrl} copied={copied === 'checkin'} onCopy={() => copyLink(checkinUrl, 'checkin')} />
            <LinkRow label="Dashboard" url={dashboardUrl} copied={copied === 'dashboard'} onCopy={() => copyLink(dashboardUrl, 'dashboard')} />
          </div>

          <button onClick={downloadQR} className="qr-download">Download QR</button>
        </div>
      </div>
    </div>
  );
}

function LinkRow({ label, url, copied, onCopy }) {
  return (
    <div className="qr-link-row">
      <span className="qr-link-label">{label}:</span>{' '}
      <span className="qr-link-url">{url}</span>{' '}
      <button onClick={onCopy} className="qr-link-copy">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
