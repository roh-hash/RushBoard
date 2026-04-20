import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { chapterSettingsDoc, chaptersRef, limit, onSnapshot, query, where } from '../lib/firebase';

const ChapterContext = createContext(null);

export function ChapterProvider({ chapterSlug, children }) {
  const { memberships, membershipsLoading } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterError, setChapterError] = useState('');

  useEffect(() => {
    const chapterQuery = query(chaptersRef(), where('slug', '==', chapterSlug), limit(1));
    const unsubscribe = onSnapshot(
      chapterQuery,
      (snap) => {
        if (snap.empty) {
          setChapter(null);
          setLoading(false);
          setChapterError('');
          return;
        }

        const chapterDoc = snap.docs[0];
        setChapter({ id: chapterDoc.id, ...chapterDoc.data() });
        setLoading(false);
        setChapterError('');
      },
      (error) => {
        console.error('Failed to load chapter:', error);
        setChapter(null);
        setLoading(false);
        setChapterError(error?.message || 'Could not load this chapter.');
      },
    );

    return unsubscribe;
  }, [chapterSlug]);

  useEffect(() => {
    if (!chapter?.id) return undefined;

    const unsubscribe = onSnapshot(chapterSettingsDoc(chapter.id), (snap) => {
      setSettings(snap.exists() ? snap.data() : null);
    });

    return unsubscribe;
  }, [chapter?.id]);

  const membership = chapter?.id
    ? memberships.find((entry) => entry.chapterId === chapter.id) || null
    : null;

  const value = useMemo(() => ({
    chapter,
    settings: chapter?.id ? settings : null,
    membership,
    isRushChair: membership?.role === 'rush_chair',
    loading: loading || membershipsLoading,
    chapterError,
  }), [chapter, chapterError, loading, membership, membershipsLoading, settings]);

  return createElement(ChapterContext.Provider, { value }, children);
}

export function useChapterContext() {
  const context = useContext(ChapterContext);
  if (!context) {
    throw new Error('useChapterContext must be used within a ChapterProvider.');
  }
  return context;
}
