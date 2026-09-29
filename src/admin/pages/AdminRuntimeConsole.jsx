import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';

const INITIAL_HELP_MESSAGE = [
  '╔════════════════════════════════════════════════════════════════════╗',
  '║              NAÏM BSILI — AGENT RUNTIME CONSOLE                    ║',
  '║  Interactive CLI for MCP & Agent diagnostics (Secure Admin API)    ║',
  '╚════════════════════════════════════════════════════════════════════╝',
  '',
  'Type "help" to view all available commands.',
  'Example: "mcp status" or "agent inspect naim-copilot"',
  '',
].join('\n');

export default function AdminRuntimeConsole() {
  const { profile } = useAuth();
  const [history, setHistory] = useState([
    { type: 'output', text: INITIAL_HELP_MESSAGE },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleExecute = async (e) => {
    e?.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Check Viewer role permission
    if (profile?.role === 'viewer') {
      setHistory((prev) => [
        ...prev,
        { type: 'command', text: cmd },
        { type: 'error', text: 'Access Denied: Viewer accounts are not authorized to run console diagnostics.' },
      ]);
      setInputVal('');
      return;
    }

    if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      setInputVal('');
      setCmdHistory((prev) => [cmd, ...prev]);
      setHistoryIndex(-1);
      return;
    }

    // Add command to log & command history
    setHistory((prev) => [...prev, { type: 'command', text: cmd }]);
    setCmdHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/runtime-console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();
      if (data.clear) {
        setHistory([]);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            type: data.success === false ? 'error' : 'output',
            text: data.output || 'Command returned no output.',
          },
        ]);
      }
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          type: 'error',
          text: `Console API Error: ${err.message || 'Unable to communicate with API server.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(historyIndex + 1, cmdHistory.length - 1);
      setHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setHistory([]);
    }
  };

  const handleQuickCommand = (cmd) => {
    setInputVal(cmd);
    inputRef.current?.focus();
  };

  return (
    <div>
      <Helmet>
        <title>Runtime Console — Admin CMS</title>
      </Helmet>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Agent Runtime Console
          </h2>
          <p className="text-muted small mb-0">
            Developer diagnostic CLI for testing server-side MCP connections, agent handshakes, and workflows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHistory([])}
          className="admin-btn admin-btn-secondary py-1 px-3 small"
          title="Clear Terminal (Ctrl + K)"
        >
          <i className="bi bi-trash me-1"></i> Clear
        </button>
      </div>

      {/* Quick Action Chips */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <span className="small text-muted fw-bold me-1">Quick Commands:</span>
        <button
          type="button"
          onClick={() => handleQuickCommand('help')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small"
        >
          help
        </button>
        <button
          type="button"
          onClick={() => handleQuickCommand('mcp status')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small"
        >
          mcp status
        </button>
        <button
          type="button"
          onClick={() => handleQuickCommand('mcp tools')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small"
        >
          mcp tools
        </button>
        <button
          type="button"
          onClick={() => handleQuickCommand('mcp test')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small"
        >
          mcp test
        </button>
        <button
          type="button"
          onClick={() => handleQuickCommand('agent list')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small"
        >
          agent list
        </button>
        <button
          type="button"
          onClick={() => handleQuickCommand('agent inspect naim-copilot')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small"
        >
          agent inspect naim-copilot
        </button>
        <button
          type="button"
          onClick={() => handleQuickCommand('agent test naim-copilot')}
          className="btn btn-sm btn-light border py-0 px-2 rounded font-monospace small text-primary"
        >
          agent test naim-copilot
        </button>
      </div>

      {/* Terminal Window */}
      <div
        className="rounded shadow-sm p-3 mb-4"
        style={{
          backgroundColor: '#0c1518',
          color: '#34d399',
          fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          minHeight: '480px',
          maxHeight: '640px',
          overflowY: 'auto',
          border: '1px solid #1e293b',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Output Stream */}
        {history.map((item, idx) => (
          <div key={idx} className="mb-2">
            {item.type === 'command' ? (
              <div className="text-white d-flex align-items-center gap-2">
                <span style={{ color: '#087f66' }}>naim@runtime:~$</span>
                <span className="fw-bold">{item.text}</span>
              </div>
            ) : item.type === 'error' ? (
              <div className="text-danger small" style={{ whiteSpace: 'pre-wrap' }}>
                {item.text}
              </div>
            ) : (
              <div
                className="small"
                style={{
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.45',
                }}
              >
                {item.text}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-muted small d-flex align-items-center gap-2 my-2">
            <span className="spinner-border spinner-border-sm" role="status"></span>
            <span>Executing command...</span>
          </div>
        )}

        <div ref={bottomRef} />

        {/* Input Prompt Form */}
        <form onSubmit={handleExecute} className="d-flex align-items-center gap-2 mt-3 pt-2 border-top border-dark">
          <span style={{ color: '#087f66' }} className="fw-bold">naim@runtime:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type a command (e.g. mcp status, agent test naim-copilot)..."
            className="flex-grow-1 bg-transparent border-0 text-white font-monospace outline-none"
            style={{ outline: 'none', boxShadow: 'none' }}
            autoFocus
          />
        </form>
      </div>

      <div className="text-muted small">
        <i className="bi bi-shield-lock-fill text-success me-1"></i> Zero-Trust Sandbox:
        Only whitelisted MCP and Agent diagnostic queries are permitted. System commands and external scripts are blocked server-side.
      </div>
    </div>
  );
}
