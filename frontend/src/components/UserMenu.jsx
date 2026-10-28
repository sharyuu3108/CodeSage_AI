import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User navigation menu"
      >
        <span className="user-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="user-name">{user?.username}</span>
        <svg
          className={`menu-chevron ${isOpen ? 'open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-header">
            <div className="dropdown-name">{user?.name}</div>
            <div className="dropdown-email">{user?.email}</div>
          </div>
          <div className="dropdown-divider" />
          <Link
            to="/dashboard"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>
          <Link
            to="/settings"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <div className="dropdown-divider" />
          <button
            type="button"
            className="dropdown-item dropdown-logout"
            role="menuitem"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
