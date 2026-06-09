"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

// ── Icons (inline SVG to keep it dependency-free) ─────────────────────────────
const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a2.5 2.5 0 1 1 5 0 5 5 0 0 1 5 5v.5a3 3 0 0 1 0 6A5 5 0 0 1 9.5 22a5 5 0 0 1-9-3A3 3 0 0 1 0 13.5V10a5 5 0 0 1 5-5A2.5 2.5 0 0 1 9.5 2z"/>
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── HITL Approval Banner ──────────────────────────────────────────────────────
function HITLApprovalBanner({ message, threadId, onResolved }) {
  const [loading, setLoading] = useState(false);
  const [rejectMsg, setRejectMsg] = useState('');
  const [showReject, setShowReject] = useState(false);

  const decide = useCallback(async (decision) => {
    setLoading(true);
    try {
      const res = await fetch('/api/brain/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          decision,
          message: decision === 'reject' ? rejectMsg : undefined,
        }),
      });
      const data = await res.json();
      onResolved(data);
    } catch (e) {
      onResolved({ response: '❌ Failed to communicate with the Brain.', interrupted: false });
    } finally {
      setLoading(false);
    }
  }, [threadId, rejectMsg, onResolved]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7, #fef9ee)',
      border: '1.5px solid #f59e0b',
      borderRadius: '16px',
      padding: '16px',
      margin: '8px 0',
      animation: 'brainFadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>⏸️</span>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>Action Requires Approval</span>
      </div>
      <p style={{ fontSize: '12px', color: '#78350f', margin: '0 0 14px', lineHeight: 1.5 }}>
        A subagent wants to schedule or modify a task. Review and decide:
      </p>
      {showReject && (
        <div style={{ marginBottom: '10px' }}>
          <input
            value={rejectMsg}
            onChange={e => setRejectMsg(e.target.value)}
            placeholder="Optional: reason for rejection..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 12px', borderRadius: '10px',
              border: '1.5px solid #fbbf24',
              fontSize: '12px', outline: 'none',
              background: 'white', color: '#1e293b',
            }}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => decide('approve')}
          disabled={loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px', fontWeight: 700, opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <CheckIcon /> Approve
        </button>
        {!showReject ? (
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '9px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 700,
              transition: 'opacity 0.2s',
            }}
          >
            <XIcon /> Reject
          </button>
        ) : (
          <button
            onClick={() => decide('reject')}
            disabled={loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '9px', borderRadius: '10px',
              background: '#ef4444',
              color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontWeight: 700, opacity: loading ? 0.7 : 1,
            }}
          >
            <XIcon /> Send Rejection
          </button>
        )}
      </div>
    </div>
  );
}

// ── Todo List Mini Panel ──────────────────────────────────────────────────────
function TodoPanel({ todos }) {
  const [open, setOpen] = useState(true);
  if (!todos || todos.length === 0) return null;
  return (
    <div style={{ background: '#f8faff', border: '1.5px solid #e2e8f0', borderRadius: '14px', margin: '8px 0', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🗂 Plan ({todos.length} steps)
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px' }}>
          {todos.map((todo, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
              <span style={{ marginTop: '2px', color: todo.status === 'completed' ? '#10b981' : todo.status === 'in_progress' ? '#f59e0b' : '#94a3b8', flexShrink: 0 }}>
                {todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '◉' : '○'}
              </span>
              <span style={{
                fontSize: '12px', color: todo.status === 'completed' ? '#94a3b8' : '#1e293b',
                textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                lineHeight: 1.4,
              }}>
                {todo.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single Chat Message ────────────────────────────────────────────────────────
function ChatMessage({ msg, threadId, onHITLResolved }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: '20px' }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      {!isUser && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, marginRight: '8px', marginTop: '2px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        }}>
          <BrainIcon />
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        {msg.todos && msg.todos.length > 0 && <TodoPanel todos={msg.todos} />}
        {msg.interrupted ? (
          <HITLApprovalBanner message={msg.content} threadId={threadId} onResolved={onHITLResolved} />
        ) : (
          <div style={{
            padding: '10px 14px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser
              ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
              : 'white',
            color: isUser ? 'white' : '#1e293b',
            fontSize: '13px', lineHeight: 1.55,
            boxShadow: isUser ? '0 2px 12px rgba(99,102,241,0.25)' : '0 1px 6px rgba(0,0,0,0.07)',
            border: isUser ? 'none' : '1.5px solid #f1f5f9',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            animation: 'brainFadeIn 0.2s ease',
          }}>
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
      }}>
        <BrainIcon />
      </div>
      <div style={{
        padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
        background: 'white', border: '1.5px solid #f1f5f9',
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
        display: 'flex', gap: '4px', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8',
            animation: `brainDot 1.2s infinite ${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Main BrainChat Component ──────────────────────────────────────────────────
export default function BrainChat({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Central Brain Orchestrator · LangGraph' },
    { role: 'assistant', content: '👋 Hello! I\'m your Central Brain — I can schedule tasks, query your learning roadmap, or check your wellbeing. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId] = useState(() => `user-${Date.now()}`);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleHITLResolved = useCallback((data) => {
    setMessages(prev => {
      const updated = [...prev];
      // Remove last interrupted message
      const lastIdx = updated.findLastIndex(m => m.interrupted);
      if (lastIdx !== -1) updated.splice(lastIdx, 1);
      return [
        ...updated,
        {
          role: 'assistant',
          content: data.response || 'Done.',
          todos: data.todos || [],
          interrupted: data.interrupted || false,
        },
      ];
    });
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, thread_id: threadId }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || 'Task completed.',
          todos: data.todos || [],
          interrupted: data.interrupted || false,
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Could not reach the Brain Orchestrator. Make sure the backend is running.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, threadId]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const QUICK_PROMPTS = [
    '📅 Plan my day',
    '🧠 What should I learn next?',
    '💚 How am I feeling?',
    '⚡ Schedule my most urgent task',
  ];

  return (
    <>
      {/* ── CSS Keyframes ─────────────────────────────────────────── */}
      <style>{`
        @keyframes brainFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes brainDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes brainSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .brain-chip:hover {
          background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
          color: white !important;
          transform: translateY(-1px);
        }
        .brain-send:hover { opacity: 0.85 !important; transform: scale(1.05) !important; }
        .brain-send:disabled { opacity: 0.4 !important; cursor: not-allowed !important; transform: none !important; }
        .brain-toggle:hover { transform: scale(1.06) !important; }
      `}</style>

      {/* ── Floating Toggle Button ────────────────────────────────── */}
      <button
        id="brain-chat-toggle"
        className="brain-toggle"
        onClick={() => setOpen(o => !o)}
        title="Central Brain Orchestrator"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: '54px', height: '54px', borderRadius: '50%', border: 'none',
          background: open
            ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
            : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <span style={{ fontSize: '22px' }}>{open ? '×' : '🧠'}</span>
      </button>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      {open && (
        <div
          id="brain-chat-panel"
          style={{
            position: 'fixed', bottom: '90px', right: '24px', zIndex: 999,
            width: '380px', maxHeight: '580px',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(99,102,241,0.12)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'brainSlideIn 0.25s ease',
            border: '1.5px solid rgba(99,102,241,0.12)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: 'white', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                🧠
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em' }}>Central Brain</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '1px' }}>
                  Scheduler · Roadmap · Wellbeing
                </div>
              </div>
              <div style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '20px',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Active</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            background: 'linear-gradient(to bottom, #fafbff, #f8faff)',
          }}>
            {messages.map((msg, i) => (
              <ChatMessage
                key={i} msg={msg} threadId={threadId}
                onHITLResolved={handleHITLResolved}
              />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && !loading && (
            <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  className="brain-chip"
                  onClick={() => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    padding: '6px 12px', borderRadius: '20px',
                    background: '#eef2ff', color: '#4f46e5',
                    border: '1.5px solid #c7d2fe',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1.5px solid #f1f5f9',
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            background: 'white', flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              id="brain-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the Brain anything…"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #e2e8f0',
                borderRadius: '14px', padding: '10px 14px',
                fontSize: '13px', outline: 'none', lineHeight: 1.5,
                maxHeight: '100px', overflowY: 'auto',
                fontFamily: 'inherit', color: '#1e293b',
                background: '#fafbff',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              id="brain-chat-send"
              className="brain-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: '38px', height: '38px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s ease',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
