import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

function QRIcon() {
  return (
    <svg className="home-feat-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.5" y="3.5" width="4" height="4" fill="currentColor" rx="0.5" />
      <rect x="12.5" y="3.5" width="4" height="4" fill="currentColor" rx="0.5" />
      <rect x="3.5" y="12.5" width="4" height="4" fill="currentColor" rx="0.5" />
      <rect x="11" y="11" width="2.5" height="2.5" fill="currentColor" rx="0.3" />
      <rect x="15.5" y="11" width="2.5" height="2.5" fill="currentColor" rx="0.3" />
      <rect x="11" y="15.5" width="2.5" height="2.5" fill="currentColor" rx="0.3" />
      <rect x="15.5" y="15.5" width="2.5" height="2.5" fill="currentColor" rx="0.3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="home-feat-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.5.85 5L10 13.8l-4.45 2.5.85-5L2.8 7.8l5-.7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function KanbanIcon() {
  return (
    <svg className="home-feat-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="4.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7.75" y="3" width="4.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13.5" y="3" width="4.5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="home-feat-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.2 2.5h3.4l1.4 3.7-2 1.6a9.5 9.5 0 003.8 3.8l1.6-2 3.7 1.4v3.4a1.8 1.8 0 01-1.8 1.8C7.2 16.2 3.5 12.5 3.5 7.7a1.8 1.8 0 011.7-1.7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  { Icon: QRIcon, title: 'QR Check-in', desc: 'Rushees scan and fill out their info. No clipboards, no lost sign-in sheets.' },
  { Icon: StarIcon, title: 'Live Ratings', desc: 'Every brother rates and comments in real time. Bid night decisions backed by the whole chapter.' },
  { Icon: KanbanIcon, title: 'Bid Board', desc: 'Drag rushees across Bid, Waitlist, and Reject columns as the night unfolds.' },
  { Icon: PhoneIcon, title: 'Call Tracker', desc: "See who's been called, who accepted, and who still needs a follow-up — all in one place." },
];

const PREVIEW_COLS = [
  {
    key: 'bid',
    label: 'Bid',
    cards: [
      { initials: 'JM', name: 'Jake M.', rating: '4.5' },
      { initials: 'CL', name: 'Chris L.', rating: '4.2' },
      { initials: 'AT', name: 'Alex T.', rating: '3.9' },
    ],
  },
  {
    key: 'waitlist',
    label: 'Waitlist',
    cards: [
      { initials: 'MR', name: 'Mike R.', rating: '3.4' },
      { initials: 'SP', name: 'Sam P.', rating: '3.1' },
    ],
  },
  {
    key: 'reject',
    label: 'Reject',
    cards: [
      { initials: 'DK', name: 'Drew K.', rating: '2.2' },
    ],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, loading, memberships, membershipsLoading } = useAuth();

  if (!loading && !membershipsLoading && isLoggedIn && memberships[0]?.chapterSlug) {
    return <Navigate to={`/${memberships[0].chapterSlug}/dashboard`} replace />;
  }

  return (
    <div className="home">
      <div className="home-inner">

        <div className="home-top">
          <section className="home-hero">
            <p className="home-kicker">Chapter-scoped rush operations</p>
            <h1 className="home-title">Rush<span>Board</span></h1>
            <p className="home-subtitle">
              Give your chapter a live roster, QR check-ins, real-time ratings,
              and a bid board — synced to every phone in the room.
            </p>
            <div className="home-actions">
              <button onClick={() => navigate('/start')} className="home-btn-primary">
                Start using RushBoard
              </button>
              <button onClick={() => navigate('/sign-in')} className="home-btn-secondary">
                Sign in
              </button>
            </div>
            <p className="home-member-hint">
              Joining your chapter? Ask your rush chair for the invite link.
            </p>
          </section>

          <aside className="home-preview" aria-hidden="true">
            <div className="home-preview-bar">
              <span className="home-preview-bar-title">Bid Board</span>
              <span className="home-preview-live">
                <span className="home-preview-dot" />
                Live
              </span>
            </div>
            <div className="home-preview-board">
              {PREVIEW_COLS.map((col) => (
                <div key={col.key} className={`home-preview-col home-preview-col--${col.key}`}>
                  <div className="home-preview-col-hd">
                    {col.label}
                    <span className="home-preview-count">{col.cards.length}</span>
                  </div>
                  {col.cards.map((card) => (
                    <div key={card.initials} className="home-preview-card">
                      <div className="home-preview-avatar">{card.initials}</div>
                      <div className="home-preview-cardinfo">
                        <div className="home-preview-name">{card.name}</div>
                        <div className="home-preview-rating">★ {card.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="home-features-section">
          <p className="home-features-label">What rush chairs use it for</p>
          <div className="home-features">
            {FEATURES.map((feat, i) => {
              const FeatIcon = feat.Icon;
              return (
                <div key={feat.title} className="home-feat-card" style={{ animationDelay: `${0.35 + i * 0.06}s` }}>
                  <div className="home-feat-icon">
                    <FeatIcon />
                  </div>
                  <h3 className="home-feat-title">{feat.title}</h3>
                  <p className="home-feat-desc">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
