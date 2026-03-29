// components/Navbar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import './Navbar.css';

// Simple SVG icons inline to avoid heavy icon library
const Icons = {
  daily:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  closet:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg>,
  laundry:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>,
  schedule: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'UJ';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          🦬 Buffalo<span>Fit</span>
        </div>

        <ul className="navbar-nav">
          <li>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {Icons.daily} Daily
            </NavLink>
          </li>
          <li>
            <NavLink to="/closet" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {Icons.closet} Closet
            </NavLink>
          </li>
          <li>
            <NavLink to="/laundry" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {Icons.laundry} Laundry
            </NavLink>
          </li>
          <li>
            <NavLink to="/schedule" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {Icons.schedule} Schedule
            </NavLink>
          </li>
        </ul>

        <div className="navbar-right">
          <div className="user-avatar" title={user?.email}>{initials}</div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}
