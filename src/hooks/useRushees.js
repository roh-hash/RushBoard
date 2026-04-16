import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useRushees() {
  const [rushees, setRushees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rushees'), (snap) => {
      const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRushees(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { rushees, loading };
}
