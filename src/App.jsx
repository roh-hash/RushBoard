import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ChapterProvider, useChapterContext } from './hooks/useChapter';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import CreateChapter from './pages/CreateChapter';
import FinishSignIn from './pages/FinishSignIn';
import JoinChapter from './pages/JoinChapter';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Profile from './pages/Profile';
import QRCodes from './pages/QRCodes';
import BidList from './pages/BidList';
import BidTracker from './pages/BidTracker';
import Settings from './pages/Settings';

function LoadingScreen({ label = 'Loading RushBoard...' }) {
  return <div className="app-loading">{label}</div>;
}

function ProtectedChapterContent({ children, rushChairOnly = false }) {
  const { chapter, membership, loading, isRushChair, chapterError } = useChapterContext();
  const { membershipError } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (chapterError || membershipError) {
    return <LoadingScreen label={chapterError || membershipError} />;
  }

  if (!chapter) {
    return <Navigate to="/" replace />;
  }

  if (!membership) {
    return <Navigate to="/sign-in" replace />;
  }

  if (rushChairOnly && !isRushChair) {
    return <Navigate to={`/${chapter.slug}/dashboard`} replace />;
  }

  return children;
}

function ProtectedChapterRoute({ children, rushChairOnly = false }) {
  const { isLoggedIn, loading } = useAuth();
  const { chapterSlug = '' } = useParams();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <ChapterProvider chapterSlug={chapterSlug}>
      <ProtectedChapterContent rushChairOnly={rushChairOnly}>
        {children}
      </ProtectedChapterContent>
    </ChapterProvider>
  );
}

function PublicChapterRoute({ children }) {
  const { chapterSlug = '' } = useParams();

  return (
    <ChapterProvider chapterSlug={chapterSlug}>
      {children}
    </ChapterProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/start" element={<CreateChapter />} />
        <Route path="/finish-signin" element={<FinishSignIn />} />
        <Route
          path="/:chapterSlug/join"
          element={<PublicChapterRoute><JoinChapter /></PublicChapterRoute>}
        />
        <Route
          path="/:chapterSlug/checkin/:nightId"
          element={<PublicChapterRoute><CheckIn /></PublicChapterRoute>}
        />
        <Route
          path="/:chapterSlug/dashboard"
          element={<ProtectedChapterRoute><Dashboard /></ProtectedChapterRoute>}
        />
        <Route
          path="/:chapterSlug/rushee/:id"
          element={<ProtectedChapterRoute><Profile /></ProtectedChapterRoute>}
        />
        <Route
          path="/:chapterSlug/qr"
          element={<ProtectedChapterRoute rushChairOnly><QRCodes /></ProtectedChapterRoute>}
        />
        <Route
          path="/:chapterSlug/bids"
          element={<ProtectedChapterRoute rushChairOnly><BidList /></ProtectedChapterRoute>}
        />
        <Route
          path="/:chapterSlug/bid-tracker"
          element={<ProtectedChapterRoute rushChairOnly><BidTracker /></ProtectedChapterRoute>}
        />
        <Route
          path="/:chapterSlug/settings"
          element={<ProtectedChapterRoute rushChairOnly><Settings /></ProtectedChapterRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
