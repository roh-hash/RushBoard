import { useEffect, useState } from 'react';
import { chapterRusheesCol, onSnapshot } from '../lib/firebase';

export function useRushees(chapterId) {
  const [rushees, setRushees] = useState([]);
  const [loadedChapterId, setLoadedChapterId] = useState(null);

  useEffect(() => {
    if (!chapterId) return undefined;

    const unsubscribe = onSnapshot(chapterRusheesCol(chapterId), (snap) => {
      setRushees(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
      setLoadedChapterId(chapterId);
    });

    return unsubscribe;
  }, [chapterId]);

  return {
    rushees: chapterId && loadedChapterId === chapterId ? rushees : [],
    loading: !!chapterId && loadedChapterId !== chapterId,
  };
}
