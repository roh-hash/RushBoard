import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import MemberLogin from './pages/MemberLogin';
import RushChairLogin from './pages/RushChairLogin';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Profile from './pages/Profile';
import QRCodes from './pages/QRCodes';
import BidList from './pages/BidList';
import BidTracker from './pages/BidTracker';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function RushChairRoute({ children }) {
  const { isLoggedIn, isRushChair } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!isRushChair) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/member-login" element={<MemberLogin />} />
        <Route path="/rush-chair-login" element={<RushChairLogin />} />
        <Route path="/checkin/:nightId" element={<CheckIn />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/rushee/:id"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route
          path="/qr"
          element={<RushChairRoute><QRCodes /></RushChairRoute>}
        />
        <Route
          path="/bids"
          element={<RushChairRoute><BidList /></RushChairRoute>}
        />
        <Route
          path="/bid-tracker"
          element={<RushChairRoute><BidTracker /></RushChairRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
