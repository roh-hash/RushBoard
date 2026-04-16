import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, getDoc, doc, addDoc, setDoc, updateDoc, deleteDoc, deleteField, arrayUnion, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Rushee helpers ---

const rusheesCol = collection(db, 'rushees');

export async function findDuplicateRushee(firstName, lastName, phone) {
  // Check by phone first (most reliable)
  if (phone) {
    const phoneQuery = query(rusheesCol, where('phone', '==', phone));
    const phoneSnap = await getDocs(phoneQuery);
    if (!phoneSnap.empty) return phoneSnap.docs[0];
  }
  // Then check by name
  const nameQuery = query(
    rusheesCol,
    where('firstName', '==', firstName.trim().toLowerCase()),
    where('lastName', '==', lastName.trim().toLowerCase()),
  );
  const nameSnap = await getDocs(nameQuery);
  if (!nameSnap.empty) return nameSnap.docs[0];
  return null;
}

export async function uploadRusheePhoto(file, rusheeId) {
  const storageRef = ref(storage, `rushees/${rusheeId}/${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createRushee({ firstName, lastName, phone, hometown, year, tag, photoURL, nightId }) {
  const docRef = await addDoc(rusheesCol, {
    firstName: firstName.trim().toLowerCase(),
    lastName: lastName.trim().toLowerCase(),
    displayName: `${firstName.trim()} ${lastName.trim()}`,
    phone: phone || '',
    hometown: hometown || '',
    year: year || '',
    tag: tag || '',
    photoURL: photoURL || '',
    attendedNights: [nightId],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function addNightToRushee(rusheeDoc, nightId) {
  await updateDoc(rusheeDoc.ref, {
    attendedNights: arrayUnion(nightId),
  });
}

// --- Rating helpers ---
// Each rating is a doc in rushees/{id}/ratings keyed by memberName

export function ratingsRef(rusheeId) {
  return collection(db, 'rushees', rusheeId, 'ratings');
}

export async function setRating(rusheeId, memberName, score) {
  const ratingDoc = doc(db, 'rushees', rusheeId, 'ratings', memberName);
  await setDoc(ratingDoc, {
    memberName,
    score,
    timestamp: serverTimestamp(),
  });
  await recalcAvgRating(rusheeId);
}

async function recalcAvgRating(rusheeId) {
  const snap = await getDocs(ratingsRef(rusheeId));
  if (snap.empty) {
    await updateDoc(doc(db, 'rushees', rusheeId), { avgRating: null, ratingCount: 0 });
    return;
  }
  let total = 0;
  snap.forEach((d) => { total += d.data().score; });
  await updateDoc(doc(db, 'rushees', rusheeId), {
    avgRating: total / snap.size,
    ratingCount: snap.size,
  });
}

// --- Comment helpers ---

export function commentsRef(rusheeId) {
  return collection(db, 'rushees', rusheeId, 'comments');
}

export async function addComment(rusheeId, memberName, text) {
  await addDoc(commentsRef(rusheeId), {
    memberName,
    text,
    timestamp: serverTimestamp(),
  });
}

// --- Talked-to helpers ---
// Stored as a doc in rushees/{id}/talkedTo keyed by memberName

export async function setTalkedTo(rusheeId, memberName, talked) {
  const talkedDoc = doc(db, 'rushees', rusheeId, 'talkedTo', memberName);
  if (talked) {
    await setDoc(talkedDoc, { memberName, timestamp: serverTimestamp() });
  } else {
    await deleteDoc(talkedDoc);
  }
}

export async function getTalkedTo(rusheeId, memberName) {
  const talkedDoc = doc(db, 'rushees', rusheeId, 'talkedTo', memberName);
  const snap = await getDoc(talkedDoc);
  return snap.exists();
}

// --- Rush night helpers ---

const nightsCol = collection(db, 'rushNights');

export async function createRushNight(label, memberName) {
  const docRef = await addDoc(nightsCol, {
    label,
    createdBy: memberName,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function rushNightsRef() {
  return nightsCol;
}

// --- Bid helpers ---

export async function setBidStatus(rusheeId, status, memberName) {
  await updateDoc(doc(db, 'rushees', rusheeId), {
    bidStatus: status,
    lastBidChange: {
      memberName,
      movedTo: status,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function clearBidStatus(rusheeId, memberName) {
  await updateDoc(doc(db, 'rushees', rusheeId), {
    bidStatus: deleteField(),
    lastBidChange: {
      memberName,
      movedTo: 'uncategorized',
      timestamp: new Date().toISOString(),
    },
  });
}

// --- Call tracking helpers ---

export async function setCallStatus(rusheeId, { called, response }, memberName) {
  await updateDoc(doc(db, 'rushees', rusheeId), {
    called: !!called,
    callResponse: response || '',
    lastCallUpdate: {
      memberName,
      timestamp: new Date().toISOString(),
    },
  });
}
