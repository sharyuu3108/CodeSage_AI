import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalOptimizations: 0,
    totalConversions: 0,
    totalSavedSessions: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, historyRes] = await Promise.all([
          api.get('/api/profile/stats'),
          api.get('/api/history?limit=5'),
        ]);

        if (statsRes?.stats) {
          setStats(statsRes.stats);
        }
        if (historyRes?.items) {
          setRecentActivities(historyRes.items);
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {user?.name || user?.username}</h1>
        <p className="dashboard-subtitle">
          CodeSage Developer Platform • Choose an AI action below or continue your recent session.
        </p>
      </div>

      {/* Real Developer Statistics */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{loading ? '—' : stats.totalReviews}</span>
            <span className="stat-label">Code Reviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{loading ? '—' : stats.totalOptimizations}</span>
            <span className="stat-label">Optimizations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{loading ? '—' : stats.totalConversions}</span>
            <span className="stat-label">Conversions</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{loading ? '—' : stats.totalSavedSessions}</span>
            <span className="stat-label">Saved Sessions</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="quick-actions-bar">
        <Link to="/review" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Review Code
        </Link>
        <Link to="/optimize" className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Optimize Code
        </Link>
        <Link to="/convert" className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          Convert Code
        </Link>
        <Link to="/history" className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
          View History
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
        {/* Recent Activity Stream */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Recent Activity</h2>
            <Link to="/history" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="loading-screen" style={{ padding: 'var(--space-6)' }}>
              <div className="spinner" />
            </div>
          ) : recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No recent activity yet. Run a code review to get started!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className={`history-type-badge history-type-${act.type}`} style={{ fontSize: '10px' }}>
                      {act.type}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {act.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace Profile & Quota */}
        <div className="card">
          <h2 className="card-title">Session State</h2>
          <p className="card-desc">
            Signed in as <strong>{user?.name}</strong> (<span className="font-mono">{user?.email}</span>)
          </p>
          <div className="dashboard-meta-grid">
            <div className="meta-box">
              <span className="meta-label">Default Language</span>
              <span className="meta-value font-mono">{user?.defaultLanguage || 'python'}</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Daily AI Quota</span>
              <span className="meta-value font-mono">50 requests / day</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Max Code Size</span>
              <span className="meta-value font-mono">50 KB</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Security Shield</span>
              <span className="meta-value font-mono" style={{ color: 'var(--status-success)' }}>Active (CSRF + JWT)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
