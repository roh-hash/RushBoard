import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-content">
        <h1 className="home-title">Rush<span>Board</span></h1>
        <p className="home-subtitle">Real-time fraternity rush management</p>
        <hr className="home-rule" />

        <div className="home-buttons">
          <button onClick={() => navigate('/member-login')} className="home-btn-primary">
            Member Login
          </button>
          <button onClick={() => navigate('/rush-chair-login')} className="home-btn-secondary">
            Rush Chair Login
          </button>
          <button className="home-btn-disabled" disabled>
            Start using RushBoard
          </button>
        </div>
      </div>
    </div>
  );
}
