import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import CodeEditor from '../components/CodeEditor.jsx';
import { CODE_SAMPLES } from '../utils/codeSamples.js';

export default function Review() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const [language, setLanguage] = useState(user?.defaultLanguage || 'python');
  const [code, setCode] = useState(CODE_SAMPLES[user?.defaultLanguage || 'python']?.review || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [explanationMode, setExplanationMode] = useState('developer'); // 'developer' | 'story'
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isPlayingStoryAudio, setIsPlayingStoryAudio] = useState(false);
  const [editorMode, setEditorMode] = useState('code'); // 'code' | 'diff'

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync user's default language on mount if available
  useEffect(() => {
    if (user?.defaultLanguage) {
      setLanguage(user.defaultLanguage);
      if (!code) {
        setCode(CODE_SAMPLES[user.defaultLanguage]?.review || '');
      }
    }
  }, [user]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Offer to load language sample if code is empty or matches previous sample
    if (!code.trim() || Object.values(CODE_SAMPLES).some((s) => s.review === code)) {
      setCode(CODE_SAMPLES[newLang]?.review || '');
    }
  };

  const clearEditorDiagnostics = () => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'codesage-ai', []);
      }
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  };

  const updateEditorMarkers = (result) => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    if (!result || !result.issues || result.issues.length === 0) {
      monacoRef.current.editor.setModelMarkers(model, 'codesage-ai', []);
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const markers = result.issues
      .filter((iss) => iss.line && Number(iss.line) > 0)
      .map((iss) => {
        let severity = monacoRef.current.MarkerSeverity.Info;
        if (iss.severity === 'critical' || iss.severity === 'high') {
          severity = monacoRef.current.MarkerSeverity.Error;
        } else if (iss.severity === 'medium') {
          severity = monacoRef.current.MarkerSeverity.Warning;
        }

        const lineNum = Number(iss.line);
        return {
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: model.getLineMaxColumn(lineNum) || 120,
          message: `[${(iss.severity || 'ISSUE').toUpperCase()}] ${iss.title}\n💡 Fix: ${iss.suggestion || iss.description}`,
          severity,
        };
      });

    monacoRef.current.editor.setModelMarkers(model, 'codesage-ai', markers);
  };

  const jumpToIssueLine = (line) => {
    if (!editorRef.current || !line) return;
    const lineNum = Number(line);
    if (isNaN(lineNum) || lineNum <= 0) return;

    try {
      editorRef.current.revealLineInCenter(lineNum);
      editorRef.current.setPosition({ lineNumber: lineNum, column: 1 });
      editorRef.current.focus();

      if (monacoRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
          {
            range: new monacoRef.current.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: true,
              className: 'active-issue-line-highlight',
              overviewRuler: {
                color: 'rgba(239, 68, 68, 0.8)',
                position: monacoRef.current.editor.OverviewRulerLane.Full,
              },
            },
          },
        ]);
      }
    } catch (err) {
      console.warn('[Review] Jump to line error:', err);
    }
  };

  const handleLoadSample = () => {
    setCode(CODE_SAMPLES[language]?.review || '');
    setAnalysisResult(null);
    setCurrentIssueIndex(0);
    setEditorMode('code');
    clearEditorDiagnostics();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingStoryAudio(false);
    }
    success(`Loaded ${language.toUpperCase()} sample code`);
  };

  const handleClear = () => {
    setCode('');
    setAnalysisResult(null);
    setCurrentIssueIndex(0);
    setEditorMode('code');
    clearEditorDiagnostics();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingStoryAudio(false);
    }
  };

  const codeBytes = new TextEncoder().encode(code).length;
  const lineCount = code ? code.split('\n').length : 0;
  const isOverSize = codeBytes > 51200;

  const handleRunReview = async () => {
    if (!code.trim()) {
      toastError('Please enter or paste code to analyze.');
      return;
    }
    if (isOverSize) {
      toastError('Code size exceeds the 50 KB limit.');
      return;
    }

    try {
      setAnalyzing(true);
      const data = await api.post('/api/ai/review', {
        language,
        code,
      });

      if (data?.analysis) {
        setAnalysisResult(data.analysis);
        setCurrentIssueIndex(0);
        success(`Code review completed (Score: ${data.analysis.overallScore}/100)`);
      }
    } catch (err) {
      toastError(err.message || 'Failed to review code.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setSavingSession(true);
      await api.post('/api/sessions', {
        title: sessionTitle.trim() || `Review Session (${language.toUpperCase()})`,
        language,
        code,
      });
      success('Session saved to your workspace');
      setShowSaveModal(false);
      setSessionTitle('');
    } catch (err) {
      toastError(err.message || 'Could not save session');
    } finally {
      setSavingSession(false);
    }
  };

  const handleToggleStoryAudio = (textToRead) => {
    if (!('speechSynthesis' in window)) {
      toastError('Audio narration is not supported in this browser.');
      return;
    }

    if (isPlayingStoryAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingStoryAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingStoryAudio(false);
    utterance.onerror = () => setIsPlayingStoryAudio(false);

    setIsPlayingStoryAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportReport = () => {
    if (!analysisResult) return;
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    const issuesMarkdown = (analysisResult.issues || [])
      .map((iss, i) => {
        const story = getStoryForIssue(iss);
        return `### Issue ${i + 1}: ${iss.title} [${(iss.severity || 'issue').toUpperCase()}]
- **Type**: \`${iss.type || 'general'}\`
- **Location**: Line ${iss.line || 'General'}
- **Technical Description**: ${iss.description || 'N/A'}
- **Technical Fix**: ${iss.suggestion || 'N/A'}
- **Beginner Story Analogy**: ${story.title}
  > ${story.description}
- **Simple Remediation**: ${story.suggestion}
${iss.codeSnippet ? `\n\`\`\`${language}\n${iss.codeSnippet}\n\`\`\`\n` : ''}`;
      })
      .join('\n---\n\n');

    const strengthsMarkdown = (analysisResult.strengths || [])
      .map((s) => `- ✓ ${s}`)
      .join('\n');

    const recommendationsMarkdown = (analysisResult.recommendations || [])
      .map((r) => `- 💡 ${r}`)
      .join('\n');

    const reportContent = `# CodeSage AI — Automated Code Audit Report
**Language**: ${language.toUpperCase()}  
**Generated At**: ${dateStr} ${timeStr}  
**Overall Health Score**: ${analysisResult.overallScore}/100  
**Maintainability**: ${analysisResult.metrics?.maintainabilityRating || 'A'}  
**Cyclomatic Complexity**: ${analysisResult.metrics?.cyclomaticComplexity || 'N/A'}  
**Lines of Code**: ${analysisResult.metrics?.linesOfCode || lineCount}  

---

## Executive Summary
${analysisResult.summary || 'Static and AI analysis completed successfully.'}

### Beginner Story Overview
${getStorySummary(analysisResult)}

---

## Identified Issues (${analysisResult.issues?.length || 0})

${issuesMarkdown || 'No critical issues identified. Code looks clean!'}

---

## Observed Strengths
${strengthsMarkdown || '- Clean code structure observed.'}

## Future Recommendations
${recommendationsMarkdown || '- Maintain current test coverage and design patterns.'}

---
*Report generated automatically by CodeSage AI Static & Neural Review Engine.*
`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CodeSage_Audit_Report_${language}_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Audit report exported successfully as Markdown');
  };

  /**
   * Helper to retrieve or synthesize refactored code for Side-by-Side Diff & 1-Click Fix
   */
  const getRefactoredCode = () => {
    if (analysisResult?.refactoredCode) {
      return analysisResult.refactoredCode;
    }

    if (!code) return '';
    // Synthesize fallback refactored code if missing from older session records
    let refactoredLines = code.split('\n').map((l) => {
      let fixed = l;
      const trimmed = l.trim();
      if (/password\s*=\s*['"][^'"]+['"]/i.test(trimmed) ||
          /secret\s*=\s*['"][^'"]+['"]/i.test(trimmed) ||
          /api_key\s*=\s*['"][^'"]+['"]/i.test(trimmed) ||
          /token\s*=\s*['"][^'"]+['"]/i.test(trimmed)) {
        if (language === 'python') {
          fixed = l.replace(/(password|secret|api_key|token)\s*=\s*['"][^'"]+['"]/i, '$1 = os.environ.get("$1".upper(), "")  # [CodeSage Fix]');
        } else if (language === 'javascript') {
          fixed = l.replace(/(password|secret|api_key|token)\s*=\s*['"][^'"]+['"]/i, 'const $1 = process.env.$1?.toUpperCase() || ""; // [CodeSage Fix]');
        }
      }
      if (language === 'python' && /^\s*print\(/.test(l)) {
        fixed = l.replace(/^(\s*)print\((.*)\)/, '$1# print($2)  # [CodeSage Fix] Debug output suppressed');
      } else if (language === 'javascript' && /^\s*console\.(log|debug|warn)/.test(l)) {
        fixed = l.replace(/^(\s*)console\.(log|debug|warn)\((.*)\);?/, '$1// console.$2($3); // [CodeSage Fix] Debug log suppressed');
      }
      if (language === 'javascript' && /==(?!=)/.test(l)) {
        fixed = l.replace(/==(?!=)/g, '===');
      }
      return fixed;
    });

    if (language === 'python' && refactoredLines.some((l) => l.includes('os.environ')) && !refactoredLines.some((l) => l.startsWith('import os'))) {
      refactoredLines.unshift('import os');
    }

    return refactoredLines.join('\n');
  };

  /**
   * 1-Click Fix: Replaces editor code with refactored code and switches view to editor
   */
  const handleApplyFix = () => {
    const fixedCode = getRefactoredCode();
    if (!fixedCode || fixedCode.trim() === code.trim()) {
      toastError('Your code already matches the suggested solution.');
      return;
    }
    setCode(fixedCode);
    setEditorMode('code');
    success('✨ 1-Click Fix Applied! Cleaned code loaded into editor.');
  };

  /**
   * Helper to retrieve or synthesize beginner-friendly story mode explanations
   */
  const getStoryForIssue = (issue) => {
    if (issue.storyDescription && issue.storySuggestion) {
      return {
        title: issue.storyTitle || issue.title,
        description: issue.storyDescription,
        suggestion: issue.storySuggestion,
      };
    }

    const titleLower = (issue.title || '').toLowerCase();
    const type = issue.type || '';

    if (
      titleLower.includes('credential') ||
      titleLower.includes('password') ||
      titleLower.includes('secret') ||
      titleLower.includes('api_key') ||
      titleLower.includes('token') ||
      type === 'security'
    ) {
      return {
        title: '🔑 The Secret Key Taped to the Front Door',
        description:
          'Imagine locking your house with a high-security lock, but taping the brass key right above the doorknob with a note saying "Secret Key". Anyone walking by (or anyone reading your source code) can copy that key and unlock your private systems.',
        suggestion:
          'Keep sensitive keys inside a private, locked safe (an environment variable file called .env), so it stays completely hidden away from the public code.',
      };
    }

    if (
      titleLower.includes('debug') ||
      titleLower.includes('print') ||
      titleLower.includes('console') ||
      titleLower.includes('log') ||
      type === 'style'
    ) {
      return {
        title: '📢 The Shouting Waiter in a Quiet Restaurant',
        description:
          'Imagine a waiter in a fancy restaurant who loudly shouts every kitchen step to the dining guests: "I am taking soup to table 4! Washing hands now!". While helpful during rehearsal, it confuses and clutters the dining room for real guests. print() outputs raw technical noise straight onto your user\'s screen.',
        suggestion:
          'Remove the shouting print() line before sharing your code, or whisper it to a private kitchen notebook (a professional logging tool) that only developers can view.',
      };
    }

    if (
      titleLower.includes('loop') ||
      titleLower.includes('complexity') ||
      titleLower.includes('iteration') ||
      type === 'performance'
    ) {
      return {
        title: '🐢 Searching Every Pocket in Every Closet',
        description:
          'Imagine looking for your keys. Instead of checking a key hook, you search every room in your house, open every single closet, and in each closet check every single coat pocket! As the house grows, this takes hours. Running nested loops forces the computer to do massive amounts of repetitive work.',
        suggestion:
          'Hang your keys on an organized rack (like a dictionary or set) so the computer can grab what it needs in a single quick second instead of searching everything twice.',
      };
    }

    if (titleLower.includes('equality') || titleLower.includes('type') || type === 'bug') {
      return {
        title: '🎭 The Disguised Impostor at the Club Door',
        description:
          'Imagine a security guard who checks IDs. With loose equality (==), the guard says: "Well, you are wearing a hat like Bob, so you must be Bob!" (like 0 == "0"). It causes accidental confusion because completely different types of data get mixed up.',
        suggestion:
          'Use strict equality === so the guard checks both the photo ID and the name before letting anyone in.',
      };
    }

    return {
      title: `🛠️ ${issue.title || 'A Loose Bolt on the Machine'}`,
      description: `Think of your code like a clockwork machine. This part is currently a bit loose: ${
        issue.description || 'It works right now, but might wobble under unexpected inputs or heavy pressure'
      }.`,
      suggestion: `Tighten this section according to standard practices: ${
        issue.suggestion || 'Follow clean code conventions to keep your software sturdy and dependable.'
      }`,
    };
  };

  /**
   * Helper to retrieve or synthesize beginner story summary for health score
   */
  const getStorySummary = (analysis) => {
    if (analysis?.storySummary) return analysis.storySummary;
    const score = analysis?.overallScore || 0;
    const issueCount = analysis?.issues?.length || 0;
    if (score >= 85) {
      return `Your code runs like a newly tuned sports car! It's fast and smooth, with ${
        issueCount > 0 ? `${issueCount} minor touch-up(s) you can easily polish.` : 'clean roads ahead!'
      }`;
    }
    if (score >= 65) {
      return `Your code is like a sturdy bicycle that rides well, but has ${issueCount} squeaky gear(s) that need a quick oiling before a long road trip.`;
    }
    return `Your code has great logic, but like a car running on low tire pressure with ${issueCount} warning lights on the dashboard, it needs a tune-up before hitting the highway!`;
  };

  const filteredIssues = analysisResult?.issues?.filter((issue) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'security') return issue.type === 'security';
    if (activeFilter === 'performance') return issue.type === 'performance';
    if (activeFilter === 'bugs') return issue.type === 'bug';
    if (activeFilter === 'critical') return issue.severity === 'critical';
    if (activeFilter === 'high') return issue.severity === 'high';
    return true;
  }) || [];

  const navigateToIssue = (newIndex) => {
    if (!filteredIssues || filteredIssues.length === 0) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingStoryAudio(false);
    }
    const boundedIndex = Math.max(0, Math.min(filteredIssues.length - 1, newIndex));
    setCurrentIssueIndex(boundedIndex);
    const targetIssue = filteredIssues[boundedIndex];
    if (targetIssue?.line) {
      jumpToIssueLine(targetIssue.line);
    }
  };

  // Sync Monaco markers and highlight the first issue on review completion
  useEffect(() => {
    updateEditorMarkers(analysisResult);
    if (analysisResult?.issues?.length > 0) {
      const firstIssue = analysisResult.issues[0];
      if (firstIssue?.line) {
        jumpToIssueLine(firstIssue.line);
      }
    }
  }, [analysisResult]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI Code Review & Static Analysis</h1>
        <p className="page-subtitle">
          Submit source code for deep vulnerability assessment, performance bottleneck analysis, and Gemini AI recommendations.
        </p>
      </div>

      <div className="review-layout">
        {/* Left Column: Monaco Editor */}
        <div className="editor-column">
          <div className="workspace-toolbar">
            <div className="toolbar-controls">
              <label htmlFor="language-select" className="sr-only">Language</label>
              <select
                id="language-select"
                className="select-sm"
                value={language}
                onChange={handleLanguageChange}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleLoadSample}
                title="Load realistic example code"
              >
                Load Sample
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleClear}
                title="Clear editor"
              >
                Clear
              </button>
            </div>

            <div className="toolbar-info">
              <span>{lineCount} lines</span>
              <span className={isOverSize ? 'text-danger' : ''}>
                {(codeBytes / 1024).toFixed(1)} KB / 50 KB
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSessionTitle(`Review ${language.toUpperCase()} (${new Date().toLocaleDateString()})`);
                  setShowSaveModal(true);
                }}
                disabled={!code.trim()}
                title="Save current code snippet to your sessions"
              >
                Save Session
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRunReview}
                disabled={analyzing || !code.trim() || isOverSize}
                title="Run AI Code Review"
              >
                {analyzing ? (
                  <>
                    <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    Run AI Review
                  </>
                )}
              </button>
            </div>
          </div>

          <CodeEditor
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            height="560px"
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              if (analysisResult) {
                updateEditorMarkers(analysisResult);
              }
            }}
          />
        </div>

        {/* Right Column: Analysis Dashboard */}
        <div className="analysis-panel">
          {/* Explanation Mode Switcher Bar */}
          <div className="explanation-mode-bar">
            <div className="mode-switcher-group" role="tablist" aria-label="Explanation Level">
              <button
                type="button"
                role="tab"
                aria-selected={explanationMode === 'developer'}
                className={`mode-btn ${explanationMode === 'developer' ? 'active' : ''}`}
                onClick={() => setExplanationMode('developer')}
                title="Switch to technical Developer Mode"
              >
                <span>💻</span>
                <span>Developer Mode</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={explanationMode === 'story'}
                className={`mode-btn ${explanationMode === 'story' ? 'story-active' : ''}`}
                onClick={() => setExplanationMode('story')}
                title="Switch to Beginner Story Mode"
              >
                <span>📖</span>
                <span>Beginner Story Mode</span>
              </button>
            </div>

            <div className="mode-tagline">
              {explanationMode === 'developer' ? (
                <span className="mode-badge-indicator">
                  Technical AST & Code Specs
                </span>
              ) : (
                <span className="mode-badge-indicator story">
                  Real-World Story Analogies
                </span>
              )}
            </div>
          </div>

          {!analysisResult && !analyzing && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
              <div style={{ color: explanationMode === 'story' ? '#0284c7' : 'var(--accent)', marginBottom: 'var(--space-4)' }}>
                {explanationMode === 'story' ? (
                  <span style={{ fontSize: '40px' }}>📖</span>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                )}
              </div>
              <h2 className="card-title">
                {explanationMode === 'story' ? 'Awaiting Code for Story Translation' : 'Awaiting Code Submission'}
              </h2>
              <p className="card-desc" style={{ maxWidth: '420px', margin: '0 auto var(--space-4)' }}>
                {explanationMode === 'story'
                  ? 'Write or paste code above, then click Run AI Review to break down complex bugs into simple, intuitive real-world story analogies!'
                  : 'Write, paste, or load a sample above and click Run AI Review to receive instant vulnerability, complexity, and maintainability insights.'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleLoadSample}
                >
                  Try With Sample Code
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRunReview}
                  disabled={analyzing || !code.trim() || isOverSize}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Run AI Review
                </button>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="card loading-screen">
              <div className="spinner" />
              <span className="loading-text">
                {explanationMode === 'story'
                  ? 'Crafting beginner story analogies & simplifying code insights...'
                  : 'Performing AST static analysis & Gemini verification...'}
              </span>
            </div>
          )}

          {analysisResult && (
            <>
              {/* Score Banner */}
              <div className="score-banner">
                <div
                  className={`score-gauge ${
                    analysisResult.overallScore >= 80
                      ? 'score-excellent'
                      : analysisResult.overallScore >= 60
                      ? 'score-good'
                      : 'score-poor'
                  }`}
                >
                  <span className="score-number">{analysisResult.overallScore}</span>
                  <span className="score-scale">/ 100</span>
                </div>
                <div className="score-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <div className="score-title">
                      {explanationMode === 'story'
                        ? 'Health Score • Story Snapshot'
                        : 'Overall Health Score'}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={handleExportReport}
                        title="Download complete audit analysis report as Markdown"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export Report
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={handleRunReview}
                        disabled={analyzing || !code.trim() || isOverSize}
                        title="Re-run review on current code"
                      >
                        {analyzing ? 'Analyzing...' : 'Re-run'}
                      </button>
                    </div>
                  </div>
                  <p className="score-summary">
                    {explanationMode === 'story'
                      ? getStorySummary(analysisResult)
                      : analysisResult.summary}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-row">
                <div className="metric-card">
                  <div className="metric-val">{analysisResult.metrics?.linesOfCode || lineCount}</div>
                  <div className="metric-lbl">Lines of Code</div>
                </div>
                <div className="metric-card">
                  <div className="metric-val">{analysisResult.metrics?.cyclomaticComplexity || 'N/A'}</div>
                  <div className="metric-lbl">
                    {explanationMode === 'story' ? 'Path Complexity' : 'Complexity'}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-val">{analysisResult.metrics?.maintainabilityRating || 'A'}</div>
                  <div className="metric-lbl">
                    {explanationMode === 'story' ? 'Health Rating' : 'Maintainability'}
                  </div>
                </div>
              </div>

              {/* Issues List Carousel */}
              <div
                className="issues-container"
                tabIndex={0}
                role="region"
                aria-label="Issues carousel - Use left and right arrow keys to navigate"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    navigateToIssue(activeIndex - 1);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    navigateToIssue(activeIndex + 1);
                  }
                }}
              >
                {(() => {
                  const totalIssues = filteredIssues.length;
                  const activeIndex = Math.min(Math.max(0, currentIssueIndex), Math.max(0, totalIssues - 1));
                  const currentIssue = filteredIssues[activeIndex];

                  return (
                    <>
                      <div className="issues-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600' }}>
                            {explanationMode === 'story' ? 'Story Breakdown' : 'Identified Issues'} ({totalIssues})
                          </h3>
                          <span className={`mode-badge-indicator ${explanationMode === 'story' ? 'story' : ''}`}>
                            {explanationMode === 'story' ? '📖 Story Mode' : '💻 Dev Mode'}
                          </span>
                        </div>

                        {/* Top Arrow Navigation Bar when multiple issues exist */}
                        {totalIssues > 1 && (
                          <div className="carousel-nav-controls">
                            <button
                              type="button"
                              className="carousel-arrow-btn"
                              onClick={() => navigateToIssue(activeIndex - 1)}
                              disabled={activeIndex === 0}
                              aria-label="Previous Issue"
                              title="Previous Issue"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                              </svg>
                            </button>

                            <span className="carousel-step-counter">
                              {activeIndex + 1} / {totalIssues}
                            </span>

                            <button
                              type="button"
                              className="carousel-arrow-btn"
                              onClick={() => navigateToIssue(activeIndex + 1)}
                              disabled={activeIndex >= totalIssues - 1}
                              aria-label="Next Issue"
                              title="Next Issue"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <div className="filter-pills">
                          {['all', 'critical', 'high', 'security', 'performance', 'bugs'].map((pill) => (
                            <button
                              key={pill}
                              type="button"
                              className={`filter-pill ${activeFilter === pill ? 'active' : ''}`}
                              onClick={() => {
                                setActiveFilter(pill);
                                setCurrentIssueIndex(0);
                              }}
                            >
                              {pill.charAt(0).toUpperCase() + pill.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {totalIssues === 0 ? (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                          No issues match the selected filter.
                        </p>
                      ) : (
                        <div className="carousel-issue-viewport">
                          {explanationMode === 'story' ? (
                            <div key={currentIssue.id || activeIndex} className="issue-item story-mode carousel-slide">
                              <div className="issue-title-bar">
                                <span className={`issue-type-badge ${currentIssue.severity}`}>
                                  {currentIssue.severity}
                                </span>
                                {currentIssue.line && (
                                  <button
                                    type="button"
                                    className="issue-line-badge clickable"
                                    onClick={() => jumpToIssueLine(currentIssue.line)}
                                    title={`Click to jump to line ${currentIssue.line} in code editor`}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <circle cx="12" cy="12" r="10" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Line {currentIssue.line} ↗
                                  </button>
                                )}
                                <span className="issue-heading" style={{ color: '#38bdf8' }}>
                                  {getStoryForIssue(currentIssue).title}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  style={{ marginLeft: 'auto', fontSize: '11px', padding: '1px 6px' }}
                                  onClick={() => setExplanationMode('developer')}
                                  title="Switch to technical Developer Mode view"
                                >
                                  💻 Technical View
                                </button>
                              </div>

                              <div className="story-analogy-box">
                                <div className="story-analogy-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                  <span>📖 What This Means (Everyday Story)</span>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-xs"
                                    style={{ fontSize: '11px', padding: '1px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => {
                                      const story = getStoryForIssue(currentIssue);
                                      handleToggleStoryAudio(`${story.title}. ${story.description}. How to fix simply: ${story.suggestion}`);
                                    }}
                                    title="Listen to story explanation aloud"
                                  >
                                    {isPlayingStoryAudio ? '⏹ Stop Audio' : '🎧 Listen to Story'}
                                  </button>
                                </div>
                                <p className="story-analogy-text">{getStoryForIssue(currentIssue).description}</p>
                              </div>

                              {currentIssue.codeSnippet && (
                                <div style={{ marginBottom: 'var(--space-2)' }}>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                    Problem line in your code:
                                  </div>
                                  <pre className="issue-snippet">
                                    <code>{currentIssue.codeSnippet}</code>
                                  </pre>
                                </div>
                              )}

                              <div className="story-fix-box">
                                <span className="story-fix-icon">🌱</span>
                                <div>
                                  <strong>How to Fix Simply:</strong> {getStoryForIssue(currentIssue).suggestion}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={currentIssue.id || activeIndex} className="issue-item carousel-slide">
                              <div className="issue-title-bar">
                                <span className={`issue-type-badge ${currentIssue.severity}`}>
                                  {currentIssue.severity}
                                </span>
                                {currentIssue.line && (
                                  <button
                                    type="button"
                                    className="issue-line-badge clickable"
                                    onClick={() => jumpToIssueLine(currentIssue.line)}
                                    title={`Click to jump to line ${currentIssue.line} in code editor`}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <circle cx="12" cy="12" r="10" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Line {currentIssue.line} ↗
                                  </button>
                                )}
                                <span className="issue-heading">{currentIssue.title}</span>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  style={{ marginLeft: 'auto', fontSize: '11px', padding: '1px 6px' }}
                                  onClick={() => setExplanationMode('story')}
                                  title="Switch to Beginner Story Mode view"
                                >
                                  📖 Story Analogy
                                </button>
                              </div>
                              <p className="issue-body">{currentIssue.description}</p>
                              {currentIssue.codeSnippet && (
                                <pre className="issue-snippet">
                                  <code>{currentIssue.codeSnippet}</code>
                                </pre>
                              )}
                              {currentIssue.suggestion && (
                                <div className="issue-suggestion">
                                  <span className="suggestion-icon">💡</span>
                                  <span><strong>Fix:</strong> {currentIssue.suggestion}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Horizontal Navigation Footer with Prev / Next Arrow Buttons */}
                          {totalIssues > 1 && (
                            <div className="carousel-footer-bar">
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs carousel-nav-btn"
                                onClick={() => navigateToIssue(activeIndex - 1)}
                                disabled={activeIndex === 0}
                                title="Previous Issue"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="15 18 9 12 15 6" />
                                </svg>
                                <span>Previous</span>
                              </button>

                              <div className="carousel-dots-list">
                                {filteredIssues.map((issue, idx) => (
                                  <button
                                    key={issue.id || idx}
                                    type="button"
                                    className={`carousel-dot-pill ${idx === activeIndex ? 'active' : ''}`}
                                    onClick={() => navigateToIssue(idx)}
                                    aria-label={`Jump to issue ${idx + 1}`}
                                    title={`Issue ${idx + 1}: ${issue.title} (${issue.severity})`}
                                  >
                                    <span className={`dot-severity-color ${issue.severity}`} />
                                    <span>Issue {idx + 1}</span>
                                  </button>
                                ))}
                              </div>

                              <button
                                type="button"
                                className="btn btn-primary btn-xs carousel-nav-btn"
                                onClick={() => navigateToIssue(activeIndex + 1)}
                                disabled={activeIndex >= totalIssues - 1}
                                title="Next Issue"
                              >
                                <span>Next</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Strengths & Recommendations */}
              {analysisResult.strengths?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: 'var(--space-2)' }}>
                    Observed Strengths
                  </h3>
                  <ul className="improvements-list" style={{ marginTop: '0' }}>
                    {analysisResult.strengths.map((str, idx) => (
                      <li key={idx} className="improvement-item">
                        <span className="improvement-icon">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Save Code Session</h2>
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
                    placeholder="e.g. User Auth Routine"
                    maxLength={100}
                    required
                  />
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  This will persist your current {language} code snippet to your developer workspace sessions.
                </p>
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
