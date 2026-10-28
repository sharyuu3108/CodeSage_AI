import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Automated code review and static analysis for modern software teams.
          </h1>
          <p className="hero-subtitle">
            CodeSage AI combines deterministic static analysis with Google Gemini to identify bugs,
            security risks, and performance bottlenecks across Python, JavaScript, Java, and C++.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Free Account
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Code Sample Preview */}
        <div className="hero-preview" aria-label="Example review inspection">
          <div className="preview-window">
            <div className="preview-window-bar">
              <span className="window-dot" />
              <span className="window-dot" />
              <span className="window-dot" />
              <span className="window-title">review_sample.py</span>
            </div>
            <div className="preview-body">
              <pre className="preview-code">
                <code>
                  <span className="code-line"><span className="line-num">1</span><span className="code-keyword">def</span> <span className="code-fn">calculate_metrics</span>(records, threshold=0):</span>
                  <span className="code-line"><span className="line-num">2</span>    total = 0</span>
                  <span className="code-line highlight-issue"><span className="line-num">3</span>    <span className="code-keyword">for</span> item <span className="code-keyword">in</span> records: <span className="code-comment"># Potential IndexError on empty structure</span></span>
                  <span className="code-line"><span className="line-num">4</span>        <span className="code-keyword">if</span> item[<span className="code-str">"score"</span>] &gt; threshold:</span>
                  <span className="code-line"><span className="line-num">5</span>            total += item[<span className="code-str">"score"</span>]</span>
                  <span className="code-line"><span className="line-num">6</span>    <span className="code-keyword">return</span> total</span>
                </code>
              </pre>

              <div className="preview-annotation">
                <div className="annotation-header">
                  <span className="badge badge-medium">Medium</span>
                  <span className="annotation-title">Unsafe dictionary subscript</span>
                </div>
                <p className="annotation-desc">
                  KeyError risk if 'score' key is missing. Use item.get('score', 0) for safe access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="capabilities-section">
        <div className="section-header">
          <h2 className="section-title">Core Capabilities</h2>
          <p className="section-subtitle">
            Built for developers who value correctness, security, and clean code.
          </p>
        </div>

        <div className="capabilities-grid">
          <div className="capability-card">
            <div className="capability-tag">Review</div>
            <h3 className="capability-title">Static Analysis & AI Review</h3>
            <p className="capability-description">
              Executes linters in sandboxed environments, then synthesizes findings with Gemini to
              deliver categorized actionable feedback.
            </p>
          </div>

          <div className="capability-card">
            <div className="capability-tag">Optimize</div>
            <h3 className="capability-title">Performance Optimization</h3>
            <p className="capability-description">
              Refactors slow algorithms and redundant memory allocations while providing side-by-side
              diffs and explanations of trade-offs.
            </p>
          </div>

          <div className="capability-card">
            <div className="capability-tag">Convert</div>
            <h3 className="capability-title">Cross-Language Conversion</h3>
            <p className="capability-description">
              Translates functions idiomatically between Python, JavaScript, Java, and C++ with target
              type systems and language standards.
            </p>
          </div>

          <div className="capability-card">
            <div className="capability-tag">History</div>
            <h3 className="capability-title">Isolated History & Sessions</h3>
            <p className="capability-description">
              Saves your code snapshots, review reports, and optimizations with strict per-user
              database isolation and instant restoration.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
