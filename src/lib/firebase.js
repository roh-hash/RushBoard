import { initializeApp } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

function generateJoinCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

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
export const auth = getAuth(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(() => {
  // Fall back to Firebase's default persistence if the browser blocks this.
});

const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (typeof window !== 'undefined' && appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Ignore duplicate init during hot reload.
  }
}

export const DEFAULT_RUSHEE_TAGS = ['Legacy', 'DJ', 'Biker', 'Hooper'];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function buildChapterDisplayName(fraternityName, charterName) {
  return `${fraternityName.trim()} ${charterName.trim()}`.replace(/\s+/g, ' ').trim();
}

function sanitizeTags(tags) {
  const source = Array.isArray(tags) ? tags : [];
  return Array.from(
    new Set(
      source
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

export function slugifyChapter(fraternityName, charterName) {
  return `${fraternityName}-${charterName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48) || 'chapter';
}

export function chaptersRef() {
  return collection(db, 'chapters');
}

export function chapterDoc(chapterId) {
  return doc(db, 'chapters', chapterId);
}

export function chapterSettingsDoc(chapterId) {
  return doc(db, 'chapters', chapterId, 'settings', 'app');
}

export function chapterMembersCol(chapterId) {
  return collection(db, 'chapters', chapterId, 'members');
}

export function chapterRusheesCol(chapterId) {
  return collection(db, 'chapters', chapterId, 'rushees');
}

export function chapterRushNightsCol(chapterId) {
  return collection(db, 'chapters', chapterId, 'rushNights');
}

export function chapterJoinCodesDoc(chapterId) {
  return doc(db, 'chapters', chapterId, 'private', 'joinCodes');
}

export function ratingsRef(chapterId, rusheeId) {
  return collection(db, 'chapters', chapterId, 'rushees', rusheeId, 'ratings');
}

export function commentsRef(chapterId, rusheeId) {
  return collection(db, 'chapters', chapterId, 'rushees', rusheeId, 'comments');
}

function talkedToDoc(chapterId, rusheeId, memberUid) {
  return doc(db, 'chapters', chapterId, 'rushees', rusheeId, 'talkedTo', memberUid);
}

function rushNightDoc(chapterId, nightId) {
  return doc(db, 'chapters', chapterId, 'rushNights', nightId);
}

export async function getChapterBySlug(slug) {
  const snap = await getDocs(query(chaptersRef(), where('slug', '==', slug), limit(1)));
  if (snap.empty) return null;
  const chapter = snap.docs[0];
  return { id: chapter.id, ...chapter.data() };
}

export async function listUserMemberships(uid) {
  const snap = await getDocs(
    query(collectionGroup(db, 'members'), where('uid', '==', uid)),
  );

  return snap.docs
    .map((memberDoc) => ({ id: memberDoc.id, ...memberDoc.data() }))
    .filter((member) => member.status === 'active');
}

export async function createChapterWithOwner({
  fraternityName,
  charterName,
  ownerUid,
  ownerEmail,
  ownerName,
  rusheeTags,
}) {
  const cleanFraternity = fraternityName.trim();
  const cleanCharter = charterName.trim();
  const displayName = buildChapterDisplayName(cleanFraternity, cleanCharter);
  const baseSlug = slugifyChapter(cleanFraternity, cleanCharter);

  return runTransaction(db, async (transaction) => {
    let slug = baseSlug;
    let suffix = 1;
    let slugRef = doc(db, 'chapterSlugs', slug);
    let existingSlug = await transaction.get(slugRef);

    while (existingSlug.exists()) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
      slugRef = doc(db, 'chapterSlugs', slug);
      existingSlug = await transaction.get(slugRef);
    }

    const createdChapterRef = doc(chaptersRef());
    const settingsRef = chapterSettingsDoc(createdChapterRef.id);
    const memberRef = doc(chapterMembersCol(createdChapterRef.id), ownerUid);
    const joinCodesRef = chapterJoinCodesDoc(createdChapterRef.id);

    transaction.set(createdChapterRef, {
      fraternityName: cleanFraternity,
      charterName: cleanCharter,
      displayName,
      slug,
      createdAt: serverTimestamp(),
      createdByUid: ownerUid,
    });

    transaction.set(joinCodesRef, {
      memberCode: generateJoinCode(),
      rushChairCode: generateJoinCode(),
      createdAt: serverTimestamp(),
    });

    transaction.set(slugRef, {
      chapterId: createdChapterRef.id,
      slug,
      createdAt: serverTimestamp(),
    });

    transaction.set(settingsRef, {
      rusheeTags: sanitizeTags(rusheeTags),
      updatedAt: serverTimestamp(),
    });

    transaction.set(memberRef, {
      uid: ownerUid,
      email: normalizeEmail(ownerEmail),
      fullName: ownerName.trim(),
      role: 'rush_chair',
      status: 'active',
      chapterId: createdChapterRef.id,
      chapterSlug: slug,
      chapterDisplayName: displayName,
      invitedAt: serverTimestamp(),
      joinedAt: serverTimestamp(),
    });

    return {
      chapterId: createdChapterRef.id,
      slug,
      displayName,
    };
  });
}

export async function updateChapterProfile(chapterId, { fraternityName, charterName }) {
  const chapterRef = chapterDoc(chapterId);
  const cleanFraternity = fraternityName.trim();
  const cleanCharter = charterName.trim();
  const displayName = buildChapterDisplayName(cleanFraternity, cleanCharter);

  await updateDoc(chapterRef, {
    fraternityName: cleanFraternity,
    charterName: cleanCharter,
    displayName,
    updatedAt: serverTimestamp(),
  });
}

export async function updateChapterSettings(chapterId, { rusheeTags }) {
  await setDoc(
    chapterSettingsDoc(chapterId),
    {
      rusheeTags: sanitizeTags(rusheeTags),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function regenerateJoinCode(chapterId, role) {
  const code = generateJoinCode();
  const field = role === 'rush_chair' ? 'rushChairCode' : 'memberCode';
  await updateDoc(chapterJoinCodesDoc(chapterId), { [field]: code });
  return code;
}

export async function acceptCodeJoin({ chapterId, code, role, uid, email, fullName, chapterSlug, chapterDisplayName }) {
  const memberRef = doc(chapterMembersCol(chapterId), uid);
  const existing = await getDoc(memberRef);
  if (existing.exists() && existing.data().status === 'active') {
    return { chapterSlug };
  }

  // joinCode is validated server-side in Firestore rules via get() on private/joinCodes.
  // It's stored here as an audit trail of which link was used to join.
  await setDoc(memberRef, {
    uid,
    email: normalizeEmail(email),
    fullName: fullName.trim(),
    role,
    joinCode: code,
    status: 'active',
    chapterId,
    chapterSlug,
    chapterDisplayName,
    joinedAt: serverTimestamp(),
  }, { merge: true });

  return { chapterSlug };
}

export async function findDuplicateRushee(chapterId, firstName, lastName, phone) {
  const rushees = chapterRusheesCol(chapterId);
  const normalizedPhone = phone.trim();

  if (normalizedPhone) {
    const phoneSnap = await getDocs(query(rushees, where('phone', '==', normalizedPhone), limit(1)));
    if (!phoneSnap.empty) return phoneSnap.docs[0];
  }

  const nameSnap = await getDocs(query(
    rushees,
    where('firstName', '==', firstName.trim().toLowerCase()),
    where('lastName', '==', lastName.trim().toLowerCase()),
    limit(1),
  ));

  return nameSnap.empty ? null : nameSnap.docs[0];
}

export async function uploadRusheePhoto(chapterId, rusheeId, file) {
  const storageRef = ref(storage, `chapters/${chapterId}/rushees/${rusheeId}/${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function submitRusheeCheckIn({
  chapterId,
  nightId,
  firstName,
  lastName,
  phone,
  hometown,
  year,
  tags,
  photo,
}) {
  // Pre-generate the doc ref so we can upload the photo first and include the URL
  // in the initial create — avoids a separate public update that the rules don't allow.
  // Duplicate detection is omitted: unauthenticated reads on the rushees collection are
  // denied by rules, so duplicate merging must happen manually from the roster.
  const rusheeRef = doc(chapterRusheesCol(chapterId));

  let photoURL = '';
  if (photo) {
    photoURL = await uploadRusheePhoto(chapterId, rusheeRef.id, photo);
  }

  await setDoc(rusheeRef, {
    firstName: firstName.trim().toLowerCase(),
    lastName: lastName.trim().toLowerCase(),
    displayName: `${firstName.trim()} ${lastName.trim()}`,
    phone: phone.trim(),
    hometown: hometown.trim(),
    year: year || '',
    tags: sanitizeTags(tags),
    photoURL,
    attendedNights: [nightId],
    avgRating: null,
    ratingCount: 0,
    createdAt: serverTimestamp(),
  });

  return {
    rusheeId: rusheeRef.id,
    displayName: `${firstName.trim()} ${lastName.trim()}`,
    photoURL,
    created: true,
  };
}

export async function setRating(chapterId, rusheeId, member, score) {
  const ratingDoc = doc(ratingsRef(chapterId, rusheeId), member.uid);
  await setDoc(ratingDoc, {
    memberUid: member.uid,
    memberName: member.fullName,
    score,
    timestamp: serverTimestamp(),
  });
  await recalcAvgRating(chapterId, rusheeId);
}

async function recalcAvgRating(chapterId, rusheeId) {
  const rusheeRef = doc(chapterRusheesCol(chapterId), rusheeId);

  await runTransaction(db, async (transaction) => {
    const snap = await getDocs(ratingsRef(chapterId, rusheeId));

    if (snap.empty) {
      transaction.update(rusheeRef, { avgRating: null, ratingCount: 0 });
      return;
    }

    let total = 0;
    snap.forEach((entry) => {
      total += entry.data().score;
    });

    transaction.update(rusheeRef, {
      avgRating: total / snap.size,
      ratingCount: snap.size,
    });
  });
}

export async function addComment(chapterId, rusheeId, member, text) {
  await addDoc(commentsRef(chapterId, rusheeId), {
    memberUid: member.uid,
    memberName: member.fullName,
    text,
    timestamp: serverTimestamp(),
  });
}

export async function setTalkedTo(chapterId, rusheeId, member, talked) {
  const target = talkedToDoc(chapterId, rusheeId, member.uid);
  if (talked) {
    await setDoc(target, {
      memberUid: member.uid,
      memberName: member.fullName,
      timestamp: serverTimestamp(),
    });
  } else {
    await deleteDoc(target);
  }
}

export async function getTalkedTo(chapterId, rusheeId, memberUid) {
  const snap = await getDoc(talkedToDoc(chapterId, rusheeId, memberUid));
  return snap.exists();
}

export async function createRushNight(chapterId, label, member) {
  const docRef = await addDoc(chapterRushNightsCol(chapterId), {
    label,
    createdByUid: member.uid,
    createdByName: member.fullName,
    createdAt: serverTimestamp(),
    isActive: true,
  });

  return docRef.id;
}

export function rushNightsRef(chapterId) {
  return chapterRushNightsCol(chapterId);
}

export async function getRushNight(chapterId, nightId) {
  const snap = await getDoc(rushNightDoc(chapterId, nightId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function setBidStatus(chapterId, rusheeId, status, member) {
  await updateDoc(doc(chapterRusheesCol(chapterId), rusheeId), {
    bidStatus: status,
    lastBidChange: {
      memberUid: member.uid,
      memberName: member.fullName,
      movedTo: status,
      timestamp: serverTimestamp(),
    },
  });
}

export async function clearBidStatus(chapterId, rusheeId, member) {
  await updateDoc(doc(chapterRusheesCol(chapterId), rusheeId), {
    bidStatus: deleteField(),
    lastBidChange: {
      memberUid: member.uid,
      memberName: member.fullName,
      movedTo: 'uncategorized',
      timestamp: serverTimestamp(),
    },
  });
}

export async function removeMember(chapterId, uid) {
  await deleteDoc(doc(chapterMembersCol(chapterId), uid));
}

export async function updateMemberRole(chapterId, uid, newRole, actingMemberUid) {
  await updateDoc(doc(chapterMembersCol(chapterId), uid), {
    role: newRole,
    updatedAt: serverTimestamp(),
    updatedByUid: actingMemberUid,
  });
}

export async function setCallStatus(chapterId, rusheeId, { called, response }, member) {
  await updateDoc(doc(chapterRusheesCol(chapterId), rusheeId), {
    called: !!called,
    callResponse: response || '',
    lastCallUpdate: {
      memberUid: member.uid,
      memberName: member.fullName,
      timestamp: serverTimestamp(),
    },
  });
}

export {
  collectionGroup,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
};
