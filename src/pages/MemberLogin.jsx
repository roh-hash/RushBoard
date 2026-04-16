import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export default function MemberLogin() {
  const [passcode, setPasscode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const result = login(passcode, firstName, lastName, 'member');
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <button onClick={() => navigate('/')} className="login-back">&larr; Back</button>
        <h1 className="login-title">Member Login</h1>
        <p className="login-subtitle">Enter your chapter passcode and name</p>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <input
              type="password"
              placeholder="Chapter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="login-input"
            />
          </div>
          <div className="login-field">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="login-input"
            />
          </div>
          <div className="login-field">
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="login-input"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit">Log in</button>
        </form>
      </div>
    </div>
  );
}
