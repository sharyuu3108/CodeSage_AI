import React, { useState, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  height = '480px',
  readOnly = false,
  isDiff = false,
  originalValue = '',
  onMount,
}) {
  const [editorTheme, setEditorTheme] = useState('vs-dark');

  // Sync with current data-theme on html element
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setEditorTheme(currentTheme === 'light' ? 'light' : 'vs-dark');
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const commonOptions = {
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineHeight: 20,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'all',
    tabSize: 2,
    readOnly,
  };

  if (isDiff) {
    return (
      <div className="editor-frame" style={{ height }}>
        <DiffEditor
          height={height}
          language={language}
          original={originalValue}
          modified={value}
          theme={editorTheme}
          options={{
            ...commonOptions,
            enableSplitViewResizing: true,
            renderSideBySide: true,
          }}
          loading={<div className="loading-screen"><div className="spinner" /><span className="loading-text">Loading Diff Engine...</span></div>}
        />
      </div>
    );
  }

  return (
    <div className="editor-frame" style={{ height }}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={editorTheme}
        options={commonOptions}
        onMount={onMount}
        loading={<div className="loading-screen"><div className="spinner" /><span className="loading-text">Loading Editor...</span></div>}
      />
    </div>
  );
}
