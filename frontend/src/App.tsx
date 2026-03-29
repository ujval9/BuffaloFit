// src/App.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser, storeUser, removeUser } from './api/auth';
import { User } from './types';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DailyPage from './pages/DailyPage';
import ClosetPage from './pages/ClosetPage';
import LaundryPage from './pages/LaundryPage';
import SchedulePage from './pages/SchedulePage';

// Components
import Navbar from './components/Navbar';

// ── Auth Context ───────────────────────────────────────────────────────────
interface AuthCtx {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUserState] = useState<User | null>(getStoredUser);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) storeUser(u);
    else removeUser();
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <BrowserRouter>
        <div className="page-wrapper">
          {user && <Navbar />}
          <Routes>
            {/* Public */}
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
            <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" replace />} />

            {/* Onboarding — shown right after signup before main app */}
            <Route
              path="/onboarding"
              element={
                user && !user.onboarding_done
                  ? <OnboardingPage />
                  : <Navigate to={user ? '/' : '/login'} replace />
              }
            />

            {/* Protected main app */}
            <Route
              path="/"
              element={
                !user
                  ? <Navigate to="/login" replace />
                  : !user.onboarding_done
                  ? <Navigate to="/onboarding" replace />
                  : <DailyPage />
              }
            />
            <Route
              path="/closet"
              element={!user ? <Navigate to="/login" replace /> : <ClosetPage />}
            />
            <Route
              path="/laundry"
              element={!user ? <Navigate to="/login" replace /> : <LaundryPage />}
            />
            <Route
              path="/schedule"
              element={!user ? <Navigate to="/login" replace /> : <SchedulePage />}
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
