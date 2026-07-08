import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { collectionGroup, db, auth, onSnapshot, query, where } from '../lib/firebase';

const AuthContext = createContext(null);

const PENDING_EMAIL_KEY = 'rushboard_pending_email';
const PENDING_FLOW_KEY = 'rushboard_pending_flow';

function getStoredJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getPendingEmail() {
  return localStorage.getItem(PENDING_EMAIL_KEY) || '';
}

function setPendingFlow(email, flow) {
  localStorage.setItem(PENDING_EMAIL_KEY, email);
  localStorage.setItem(PENDING_FLOW_KEY, JSON.stringify(flow));
}

function clearPendingFlow() {
  localStorage.removeItem(PENDING_EMAIL_KEY);
  localStorage.removeItem(PENDING_FLOW_KEY);
}

function buildActionCodeSettings(flow) {
  const params = flow ? `?flow=${encodeURIComponent(JSON.stringify(flow))}` : '';
  return {
    url: `${window.location.origin}/finish-signin${params}`,
    handleCodeInApp: true,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState([]);
  const [membershipOwnerUid, setMembershipOwnerUid] = useState(null);
  const [membershipError, setMembershipError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setMemberships([]);
        setMembershipOwnerUid(null);
        setMembershipError('');
      } else {
        setMembershipOwnerUid(null);
        setMembershipError('');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const membershipQuery = query(
      collectionGroup(db, 'members'),
      where('uid', '==', user.uid),
    );

    const unsubscribe = onSnapshot(
      membershipQuery,
      (snap) => {
        setMemberships(
          snap.docs
            .map((memberDoc) => ({ id: memberDoc.id, ...memberDoc.data() }))
            .filter((member) => member.status === 'active'),
        );
        setMembershipOwnerUid(user.uid);
        setMembershipError('');
      },
      (error) => {
        console.error('Failed to load chapter memberships:', error);
        setMemberships([]);
        setMembershipOwnerUid(user.uid);
        setMembershipError(error?.message || 'Could not load your chapter access.');
      },
    );

    return unsubscribe;
  }, [user]);

  const membershipsLoading = !!user && membershipOwnerUid !== user.uid;

  const value = useMemo(() => ({
    user,
    loading,
    memberships,
    membershipsLoading,
    membershipError,
    isLoggedIn: !!user,
    pendingEmail: getPendingEmail(),
    pendingFlow: getStoredJson(PENDING_FLOW_KEY),
    async sendMagicLink(email, flow) {
      const normalizedEmail = email.trim().toLowerCase();
      setPendingFlow(normalizedEmail, flow);
      await sendSignInLinkToEmail(auth, normalizedEmail, buildActionCodeSettings(flow));
    },
    isMagicLink(url) {
      return isSignInWithEmailLink(auth, url);
    },
    async completeMagicLink(email, url) {
      return signInWithEmailLink(auth, email.trim().toLowerCase(), url);
    },
    clearPendingFlow,
    async logout() {
      await signOut(auth);
    },
  }), [loading, membershipError, memberships, membershipsLoading, user]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
