import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [passcode, setPasscode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loginType, setLoginType] = useState('member');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const result = login(passcode, firstName, lastName, loginType);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24 }}>
      <h1>RushBoard</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Login</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>
            <input
              type="radio"
              value="rushChair"
              checked={loginType === 'rushChair'}
              onChange={(e) => setLoginType(e.target.value)}
              style={{ marginRight: 8 }}
            />
            Rush Chair
          </label>
          <label style={{ display: 'block', fontSize: 16 }}>
            <input
              type="radio"
              value="member"
              checked={loginType === 'member'}
              onChange={(e) => setLoginType(e.target.value)}
              style={{ marginRight: 8 }}
            />
            Member
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
        <button type="submit" style={buttonStyle}>
          Log in
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 16,
  border: '1px solid #ccc',
  borderRadius: 6,
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 16,
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};
