import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onSnapshot, orderBy, query } from 'firebase/firestore';
import QRCode from 'qrcode';
import { rushNightsRef, createRushNight } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import './QRCodes.css';

export default function QRCodes() {
  const { memberName } = useAuth();
  const navigate = useNavigate();
  const [nights, setNights] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return onSnapshot(query(rushNightsRef(), orderBy('createdAt', 'desc')), (snap) => {
      setNights(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!label.trim()) {
      setError('Enter a label for this night.');
      return;
    }
    setCreating(true);
    await createRushNight(label.trim(), memberName);
    setLabel('');
    setShowCreate(false);
    setCreating(false);
  }

  const baseUrl = window.location.origin;

  return (
    <div className="qr-page">
      <button onClick={() => navigate('/dashboard')} className="qr-back">&larr; Back to Dashboard</button>
      <h1 className="qr-title">Rush Night QR Codes</h1>

      <button onClick={() => setShowCreate(!showCreate)} className="qr-create-btn">
        {showCreate ? 'Cancel' : '+ New Rush Night'}
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="qr-create-form">
          <div className="qr-create-field">
            <input
              type="text"
              placeholder='Night label (e.g. "BBQ Night")'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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
          <NightCard key={night.id} night={night} baseUrl={baseUrl} />
        ))
      )}
    </div>
  );
}

function NightCard({ night, baseUrl }) {
  const canvasRef = useRef(null);
  const checkinUrl = `${baseUrl}/checkin/${night.id}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, checkinUrl, { width: 200, margin: 2 });
    }
  }, [checkinUrl]);

  function copyLink(url, label) {
    navigator.clipboard.writeText(url);
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
          <div className="qr-night-creator">Created by {night.createdBy}</div>

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
