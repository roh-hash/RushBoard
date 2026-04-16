import { useState, useCallback } from 'react';

const STORAGE_KEY = 'rushboard_auth';
const RUSH_CHAIR_PASSCODE = 'rush2026';
const MEMBER_PASSCODE = import.meta.env.VITE_MEMBER_PASSCODE || 'members2026';

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [auth, setAuth] = useState(getStored);

  const login = useCallback((passcode, firstName, lastName, loginType) => {
    const expectedPasscode = loginType === 'rushChair' ? RUSH_CHAIR_PASSCODE : MEMBER_PASSCODE;
    if (passcode !== expectedPasscode) {
      return { success: false, error: 'Wrong passcode' };
    }
    if (!firstName.trim() || !lastName.trim()) {
      return { success: false, error: 'Enter your first and last name' };
    }
    const data = {
      memberName: `${firstName.trim()} ${lastName.trim()}`,
      loggedInAt: new Date().toISOString(),
      isRushChair: loginType === 'rushChair',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setAuth(data);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  return {
    memberName: auth?.memberName || null,
    isLoggedIn: !!auth,
    isRushChair: auth?.isRushChair || false,
    login,
    logout,
  };
}
