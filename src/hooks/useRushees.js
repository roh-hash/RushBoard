import { useEffect, useState } from 'react';
import { chapterRusheesCol, onSnapshot } from '../lib/firebase';

export function useRushees(chapterId) {
  const [rushees, setRushees] = useState([]);
  const [loadedChapterId, setLoadedChapterId] = useState(null);

  useEffect(() => {
    if (!chapterId) return undefined;

    const unsubscribe = onSnapshot(chapterRusheesCol(chapterId), (snap) => {
      setRushees(snap.docs.map((entry) => {
        const data = entry.data();
        // Normalize legacy bid status values stored before the Table→Waitlist/Fade→Reject rename.
        const STATUS_MAP = { table: 'waitlist', fade: 'reject' };
        if (data.bidStatus) data.bidStatus = STATUS_MAP[data.bidStatus] ?? data.bidStatus;
        if (data.lastBidChange?.movedTo) {
          data.lastBidChange = {
            ...data.lastBidChange,
            movedTo: STATUS_MAP[data.lastBidChange.movedTo] ?? data.lastBidChange.movedTo,
          };
        }
        return { id: entry.id, ...data };
      }));
      setLoadedChapterId(chapterId);
    });

    return unsubscribe;
  }, [chapterId]);

  return {
    rushees: chapterId && loadedChapterId === chapterId ? rushees : [],
    loading: !!chapterId && loadedChapterId !== chapterId,
  };
}
