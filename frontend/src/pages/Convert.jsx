import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import CodeEditor from '../components/CodeEditor.jsx';
import { CODE_SAMPLES } from '../utils/codeSamples.js';

export default function Convert() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [sourceLang, setSourceLang] = useState(user?.defaultLanguage || 'python');
  const [targetLang, setTargetLang] = useState(
    user?.defaultLanguage === 'javascript' ? 'python' : 'javascript'
  );
  const [sourceCode, setSourceCode] = useState(CODE_SAMPLES[user?.defaultLanguage || 'python']?.convert || '');
  const [convertedCode, setConvertedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [caveats, setCaveats] = useState([]);
  const [converting, setConverting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    if (user?.defaultLanguage) {
      setSourceLang(user.defaultLanguage);
      setTargetLang(user.defaultLanguage === 'javascript' ? 'python' : 'javascript');
      if (!sourceCode) {
        setSourceCode(CODE_SAMPLES[user.defaultLanguage]?.convert || '');
      }
    }
  }, [user]);

  const handleSwap = () => {
    const oldSource = sourceLang;
    const oldTarget = targetLang;
    setSourceLang(oldTarget);
    setTargetLang(oldSource);
    if (convertedCode) {
      setSourceCode(convertedCode);
      setConvertedCode('');
      setExplanation('');
      setCaveats([]);
    } else {
      setSourceCode(CODE_SAMPLES[oldTarget]?.convert || '');
    }
  };

  const handleLoadSample = () => {
    setSourceCode(CODE_SAMPLES[sourceLang]?.convert || '');
    setConvertedCode('');
    setExplanation('');
    setCaveats([]);
    success(`Loaded ${sourceLang.toUpperCase()} sample`);
  };

  const handleClear = () => {
    setSourceCode('');
    setConvertedCode('');
    setExplanation('');
    setCaveats([]);
  };

  const handleConvert = async () => {
    if (!sourceCode.trim()) {
      toastError('Please enter source code to convert.');
      return;
    }
    if (sourceLang === targetLang) {
      toastError('Source and target languages must be different.');
      return;
    }

    try {
      setConverting(true);
      const data = await api.post('/api/ai/convert', {
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        code: sourceCode,
      });

      if (data?.conversion) {
        setConvertedCode(data.conversion.convertedCode);
        setExplanation(data.conversion.explanation);
        setCaveats(data.conversion.caveats || []);
        success(`Successfully converted to ${targetLang.toUpperCase()}`);
      }
    } catch (err) {
      toastError(err.message || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  const handleCopy = () => {
    if (convertedCode) {
      navigator.clipboard.writeText(convertedCode);
      success('Copied converted code to clipboard');
    }
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!convertedCode.trim()) return;

    try {
      setSavingSession(true);
      await api.post('/api/sessions', {
        title: sessionTitle.trim() || `Converted to ${targetLang.toUpperCase()}`,
        language: targetLang,
        code: convertedCode,
      });
      success('Session saved to workspace');
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
        <h1 className="page-title">Cross-Language Code Conversion</h1>
        <p className="page-subtitle">
          Translate algorithms and service routines seamlessly across Python, JavaScript, Java, and C++ with idiomatic syntax preservation.
        </p>
      </div>

      {/* Language Selection & Conversion Header */}
      <div className="convert-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>From:</span>
          <select
            className="select-sm"
            value={sourceLang}
            onChange={(e) => {
              const val = e.target.value;
              setSourceLang(val);
              if (val === targetLang) {
                setTargetLang(val === 'python' ? 'javascript' : 'python');
              }
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={handleSwap}
          title="Swap source and target languages"
        >
          ⇄ Swap
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>To:</span>
          <select
            className="select-sm"
            value={targetLang}
            onChange={(e) => {
              const val = e.target.value;
              setTargetLang(val);
              if (val === sourceLang) {
                setSourceLang(val === 'python' ? 'javascript' : 'python');
              }
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

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

        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={handleConvert}
          disabled={converting || !sourceCode.trim()}
        >
          {converting ? 'Converting Code...' : 'Convert Code ➔'}
        </button>
      </div>

      {/* Dual Column Editors */}
      <div className="convert-grid">
        {/* Source Column */}
        <div>
          <div className="workspace-toolbar" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-primary)' }}>
              Source: {sourceLang.toUpperCase()}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {(new TextEncoder().encode(sourceCode).length / 1024).toFixed(1)} KB
            </span>
          </div>
          <CodeEditor
            language={sourceLang}
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            height="460px"
          />
        </div>

        {/* Converted Column */}
        <div>
          <div className="workspace-toolbar" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--accent)' }}>
              Target: {targetLang.toUpperCase()}
            </span>
            {convertedCode && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary btn-xs" onClick={handleCopy}>
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => {
                    setSessionTitle(`Converted to ${targetLang.toUpperCase()}`);
                    setShowSaveModal(true);
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
          <CodeEditor
            language={targetLang}
            value={convertedCode || '// Converted code will appear here after clicking Convert Code...'}
            readOnly={true}
            height="460px"
          />
        </div>
      </div>

      {/* Explanation & Caveats */}
      {explanation && (
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', marginBottom: 'var(--space-2)' }}>
            Conversion Notes & Idioms
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {explanation}
          </p>

          {caveats?.length > 0 && (
            <div className="caveats-box">
              <div className="caveats-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Important Language-Specific Caveats
              </div>
              <ul className="improvements-list" style={{ marginTop: 'var(--space-1)' }}>
                {caveats.map((c, i) => (
                  <li key={i} className="improvement-item" style={{ fontSize: 'var(--text-xs)' }}>
                    <span>•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Save Converted Code Session</h2>
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
