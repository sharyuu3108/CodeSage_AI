import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const [defaultLang, setDefaultLang] = useState(user?.defaultLanguage || 'python');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Quota state
  const [quota, setQuota] = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        setLoadingQuota(true);
        const data = await api.get('/api/ai/quota');
        if (data?.quota) {
          setQuota(data.quota);
        }
      } catch (err) {
        console.warn('Quota fetch failed:', err);
      } finally {
        setLoadingQuota(false);
      }
    };

    fetchQuota();
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('codesage_theme', newTheme);
    success(`Theme changed to ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      const data = await api.put('/api/profile', {
        defaultLanguage: defaultLang,
      });
      if (data?.user) {
        updateUser(data.user);
      }
      success('Workspace preferences updated');
    } catch (err) {
      toastError(err.message || 'Could not update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toastError('Please enter your password to confirm account deletion.');
      return;
    }

    try {
      setDeleting(true);
      await api.delete('/api/auth/account', { password: deletePassword });
      success('Your account and all associated records have been permanently deleted.');
      logout();
      navigate('/');
    } catch (err) {
      toastError(err.message || 'Could not delete account. Verify your password.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Developer Workspace Settings</h1>
        <p className="page-subtitle">
          Manage editor themes, language defaults, daily AI quotas, and account security.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', maxWidth: '720px' }}>
        {/* Workspace Preferences */}
        <div className="card">
          <h2 className="card-title">Preferences</h2>
          <p className="card-desc">Customize your editor appearance and preferred language environment.</p>

          <form onSubmit={handleSavePreferences}>
            <div className="form-group">
              <label htmlFor="theme-select" className="form-label">Theme Mode</label>
              <select
                id="theme-select"
                className="form-input form-select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
              >
                <option value="dark">Dark Theme (Default)</option>
                <option value="light">Light Theme</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="default-lang-select" className="form-label">Default Programming Language</label>
              <select
                id="default-lang-select"
                className="form-input form-select"
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-xs"
                disabled={savingPrefs}
              >
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* AI Quota Monitoring */}
        <div className="card">
          <h2 className="card-title">Daily AI Request Quota</h2>
          <p className="card-desc">
            CodeSage AI provides daily quota allocation for code reviews, optimizations, and conversions.
          </p>

          {loadingQuota ? (
            <div className="loading-screen" style={{ padding: 'var(--space-4)' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="dashboard-meta-grid">
              <div className="meta-box">
                <span className="meta-label">Used Today</span>
                <span className="meta-value font-mono">{quota?.used ?? 0} requests</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Remaining Today</span>
                <span className="meta-value font-mono" style={{ color: 'var(--accent)' }}>
                  {quota?.remaining ?? 50} requests
                </span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Daily Limit</span>
                <span className="meta-value font-mono">{quota?.limit ?? 50} / day</span>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="card danger-zone-card">
          <h2 className="card-title danger-zone-title">Danger Zone</h2>
          <p className="card-desc">
            Permanently delete your account, saved sessions, reviews, and all personal data. This action cannot be reversed.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setShowDeleteModal(true)}
            style={{ color: 'var(--status-critical)', borderColor: 'var(--status-critical)' }}
          >
            Delete Account...
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title danger-zone-title">Delete Account Confirmation</h2>
            </div>
            <form onSubmit={handleDeleteAccount}>
              <div className="modal-body">
                <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                  Please confirm by entering your current password. This will permanently remove user <strong>{user?.username}</strong> and all saved code sessions.
                </p>
                <div className="form-group">
                  <label htmlFor="delete-account-password" className="form-label">Current Password</label>
                  <PasswordInput
                    id="delete-account-password"
                    name="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password to confirm"
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={deleting || !deletePassword}
                  style={{ backgroundColor: 'var(--status-critical)', borderColor: 'var(--status-critical)' }}
                >
                  {deleting ? 'Deleting Account...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
