import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

export default function History() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ reviews: 0, optimizations: 0, conversions: 0, sessions: 0, total: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/history?limit=100');
      if (data?.items) {
        setItems(data.items);
        setCounts(data.counts || {});
      }
    } catch (err) {
      toastError(err.message || 'Could not fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (type, id) => {
    try {
      setDeletingId(id);
      await api.delete(`/api/history/${type}/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      success('History item removed');
    } catch (err) {
      toastError(err.message || 'Could not delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await api.delete('/api/history');
      setItems((prev) => prev.filter((item) => item.type === 'session'));
      success('All analysis and conversion history cleared');
      setShowClearConfirm(false);
    } catch (err) {
      toastError(err.message || 'Could not clear history');
    } finally {
      setClearing(false);
    }
  };

  const filteredItems = items.filter((item) => {
    // Tab filter
    if (activeTab === 'review' && item.type !== 'review') return false;
    if (activeTab === 'optimization' && item.type !== 'optimization') return false;
    if (activeTab === 'conversion' && item.type !== 'conversion') return false;
    if (activeTab === 'session' && item.type !== 'session') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchLang = (item.language || item.sourceLanguage || item.targetLanguage || '')
        .toLowerCase()
        .includes(q);
      const matchCode = (item.code || item.originalCode || item.sourceCode || '')
        .toLowerCase()
        .includes(q);
      return matchTitle || matchLang || matchCode;
    }

    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Code History & Saved Sessions</h1>
          <p className="page-subtitle">
            Review your activity stream, reload past AI analyses, and inspect saved code sessions.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setShowClearConfirm(true)}
            style={{ color: 'var(--status-critical)' }}
          >
            Clear AI History
          </button>
        )}
      </div>

      {/* Tabs and Search Controls */}
      <div className="history-controls">
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Activity ({items.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Reviews ({counts.reviews || 0})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'optimization' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimization')}
          >
            Optimizations ({counts.optimizations || 0})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'conversion' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversion')}
          >
            Conversions ({counts.conversions || 0})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
          >
            Saved Sessions ({counts.sessions || 0})
          </button>
        </div>

        <input
          type="search"
          className="form-input history-search-input"
          placeholder="Search by language, title, code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card loading-screen">
          <div className="spinner" />
          <span className="loading-text">Loading activity history...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
          <div style={{ color: 'var(--accent)', marginBottom: 'var(--space-3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <h2 className="card-title">No Activity Records Found</h2>
          <p className="card-desc" style={{ maxWidth: '420px', margin: '0 auto var(--space-4)' }}>
            {searchQuery
              ? 'No matching records found for your search term.'
              : 'Start by reviewing code, optimizing a bottleneck, or converting a routine.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to="/review" className="btn btn-primary btn-xs">
              Run Code Review
            </Link>
            <Link to="/optimize" className="btn btn-secondary btn-xs">
              Optimize Code
            </Link>
          </div>
        </div>
      )}

      {/* History Items Stream */}
      {!loading && filteredItems.length > 0 && (
        <div className="history-list">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const codeToDisplay = item.code || item.optimizedCode || item.convertedCode || item.originalCode || '';

            return (
              <div key={item.id} className="history-card">
                <div className="history-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span className={`history-type-badge history-type-${item.type}`}>
                      {item.type}
                    </span>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {item.title}
                    </strong>
                    {item.score !== null && item.score !== undefined && (
                      <span className="badge badge-medium" style={{ backgroundColor: 'var(--accent-surface)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                        Score: {item.score}/100
                      </span>
                    )}
                    {item.issuesCount > 0 && (
                      <span className="badge badge-medium">
                        {item.issuesCount} issue{item.issuesCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <div className="history-card-actions">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? 'Hide Code' : 'View Code'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(codeToDisplay);
                        success('Code copied to clipboard');
                      }}
                      title="Copy code"
                    >
                      Copy
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleDeleteItem(item.type, item.id)}
                      disabled={deletingId === item.id}
                      style={{ color: 'var(--status-critical)' }}
                      title="Delete record"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {item.explanation && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                    {item.explanation}
                  </p>
                )}

                {item.details?.summary && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                    {item.details.summary}
                  </p>
                )}

                {isExpanded && codeToDisplay && (
                  <pre className="history-code-preview">
                    <code>{codeToDisplay}</code>
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--status-critical)' }}>
                Clear AI History?
              </h2>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete all code reviews, optimizations, and conversion records?
                Your saved code sessions and profile settings will <strong>not</strong> be removed.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearAll}
                disabled={clearing}
                style={{ backgroundColor: 'var(--status-critical)', borderColor: 'var(--status-critical)' }}
              >
                {clearing ? 'Clearing...' : 'Yes, Clear History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
