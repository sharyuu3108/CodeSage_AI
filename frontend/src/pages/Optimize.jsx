import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import CodeEditor from '../components/CodeEditor.jsx';
import { CODE_SAMPLES } from '../utils/codeSamples.js';

export default function Optimize() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [language, setLanguage] = useState(user?.defaultLanguage || 'python');
  const [targetGoal, setTargetGoal] = useState('performance');
  const [code, setCode] = useState(CODE_SAMPLES[user?.defaultLanguage || 'python']?.optimize || '');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'code'
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    if (user?.defaultLanguage) {
      setLanguage(user.defaultLanguage);
      if (!code) {
        setCode(CODE_SAMPLES[user.defaultLanguage]?.optimize || '');
      }
    }
  }, [user]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (!code.trim() || Object.values(CODE_SAMPLES).some((s) => s.optimize === code)) {
      setCode(CODE_SAMPLES[newLang]?.optimize || '');
    }
  };

  const handleLoadSample = () => {
    setCode(CODE_SAMPLES[language]?.optimize || '');
    setOptimizationResult(null);
    success(`Loaded ${language.toUpperCase()} optimization sample`);
  };

  const handleClear = () => {
    setCode('');
    setOptimizationResult(null);
  };

  const codeBytes = new TextEncoder().encode(code).length;
  const isOverSize = codeBytes > 51200;

  const handleRunOptimize = async () => {
    if (!code.trim()) {
      toastError('Please enter code to optimize.');
      return;
    }
    if (isOverSize) {
      toastError('Code size exceeds the 50 KB limit.');
      return;
    }

    try {
      setOptimizing(true);
      const data = await api.post('/api/ai/optimize', {
        language,
        code,
        targetGoal,
      });

      if (data?.optimization) {
        setOptimizationResult(data.optimization);
        success('Code optimization completed successfully');
      }
    } catch (err) {
      toastError(err.message || 'Failed to optimize code.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimized = () => {
    if (optimizationResult?.optimizedCode) {
      setCode(optimizationResult.optimizedCode);
      success('Applied optimized code to editor');
    }
  };

  const handleCopy = () => {
    if (optimizationResult?.optimizedCode) {
      navigator.clipboard.writeText(optimizationResult.optimizedCode);
      success('Copied optimized code to clipboard');
    }
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    const codeToSave = optimizationResult?.optimizedCode || code;
    if (!codeToSave.trim()) return;

    try {
      setSavingSession(true);
      await api.post('/api/sessions', {
        title: sessionTitle.trim() || `Optimized ${language.toUpperCase()}`,
        language,
        code: codeToSave,
      });
      success('Session saved successfully');
      setShowSaveModal(false);
      setSessionTitle('');
    } catch (err) {
      toastError(err.message || 'Could not save session');
    } finally {
      setSavingSession(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI Code Optimization & Refactoring</h1>
        <p className="page-subtitle">
          Transform computational bottlenecks into high-throughput routines with Big-O complexity analysis and side-by-side diff verification.
        </p>
      </div>

      {/* Target Goal & Controls Bar */}
      <div className="workspace-toolbar" style={{ borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
        <div className="toolbar-controls">
          <label htmlFor="opt-lang-select" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Language:</label>
          <select
            id="opt-lang-select"
            className="select-sm"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          <label htmlFor="opt-goal-select" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>Target Goal:</label>
          <select
            id="opt-goal-select"
            className="select-sm"
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value)}
          >
            <option value="performance">Performance (Time Complexity & CPU)</option>
            <option value="memory">Memory (Heap Allocation & Leaks)</option>
            <option value="readability">Readability (Clean Code & DRY)</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleLoadSample}
          >
            Load Sample
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>

        <div className="toolbar-info">
          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={handleRunOptimize}
            disabled={optimizing || !code.trim() || isOverSize}
          >
            {optimizing ? 'Optimizing...' : '⚡ Optimize Code'}
          </button>
        </div>
      </div>

      {/* Results View: Complexity comparison & Diff */}
      {optimizationResult && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {/* Complexity Comparison Bar */}
          <div className="complexity-comparison-bar">
            <div className="complexity-box">
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Original Complexity:</span>
              <span className="complexity-tag complexity-original">
                {optimizationResult.originalComplexity?.time || 'O(n²)'} time • {optimizationResult.originalComplexity?.space || 'O(n)'} space
              </span>
            </div>

            <div className="complexity-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="complexity-box">
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Optimized Complexity:</span>
              <span className="complexity-tag complexity-optimized">
                {optimizationResult.optimizedComplexity?.time || 'O(n)'} time • {optimizationResult.optimizedComplexity?.space || 'O(1)'} space
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className={`filter-pill ${viewMode === 'diff' ? 'active' : ''}`}
                onClick={() => setViewMode('diff')}
              >
                Side-by-Side Diff
              </button>
              <button
                type="button"
                className={`filter-pill ${viewMode === 'code' ? 'active' : ''}`}
                onClick={() => setViewMode('code')}
              >
                Optimized Result
              </button>
            </div>
          </div>

          {/* Editor Container (Diff or Single) */}
          {viewMode === 'diff' ? (
            <CodeEditor
              language={language}
              isDiff={true}
              originalValue={code}
              value={optimizationResult.optimizedCode}
              height="450px"
              readOnly={true}
            />
          ) : (
            <CodeEditor
              language={language}
              value={optimizationResult.optimizedCode}
              height="450px"
              readOnly={true}
            />
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn btn-secondary btn-xs" onClick={handleCopy}>
              Copy Code
            </button>
            <button type="button" className="btn btn-secondary btn-xs" onClick={handleApplyOptimized}>
              Replace Editor With Optimized
            </button>
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={() => {
                setSessionTitle(`Optimized ${language.toUpperCase()} (${targetGoal})`);
                setShowSaveModal(true);
              }}
            >
              Save as Session
            </button>
          </div>

          {/* Improvements & Explanation Card */}
          <div className="improvements-card">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600' }}>Applied Optimizations</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              {optimizationResult.explanation}
            </p>

            {optimizationResult.improvements?.length > 0 && (
              <ul className="improvements-list">
                {optimizationResult.improvements.map((item, idx) => (
                  <li key={idx} className="improvement-item">
                    <span className="improvement-icon">⚡</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Primary Input Editor if no result or in edit state */}
      {!optimizationResult && (
        <div>
          <CodeEditor
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            height="500px"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Target goal: <strong>{targetGoal.toUpperCase()}</strong> • Size: {(codeBytes / 1024).toFixed(1)} KB / 50 KB
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunOptimize}
              disabled={optimizing || !code.trim() || isOverSize}
            >
              {optimizing ? 'Analyzing Complexity & Refactoring...' : '⚡ Optimize Code'}
            </button>
          </div>
        </div>
      )}

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Save Optimized Session</h2>
            </div>
            <form onSubmit={handleSaveSession}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="session-title-input" className="form-label">Session Title</label>
                  <input
                    id="session-title-input"
                    type="text"
                    className="form-input"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSession}
                >
                  {savingSession ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
