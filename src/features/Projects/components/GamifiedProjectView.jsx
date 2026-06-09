"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const KANBAN_COLUMNS = [
  { id: 'backlog',    label: 'Backlog',     color: '#94a3b8', bgClass: 'bg-surface-container-low' },
  { id: 'inprogress', label: 'In Progress', color: '#0053dc', bgClass: 'bg-primary/[0.03]' },
  { id: 'review',     label: 'Review',      color: '#865400', bgClass: 'bg-tertiary/[0.03]' },
  { id: 'done',       label: 'Completed',   color: '#006d4a', bgClass: 'bg-secondary/[0.04]' },
];

const DEFAULT_TASKS = {
  backlog:    [
    { id: 'k1', tag: 'Strategy', title: 'Identify Top 5 Direct Competitors in EU Market',            xp: 120, impact: 'High',   color: '#865400' },
    { id: 'k2', tag: 'Research', title: 'Audit pricing models for Architect SaaS leaders',           xp: 50,  impact: 'Medium', color: '#006d4a' },
    { id: 'k3', tag: 'Data',     title: 'Build feature parity spreadsheet',                           xp: 80,  impact: 'Medium', color: '#0053dc' },
  ],
  inprogress: [{ id: 'k4', tag: 'Analysis', title: 'Sentiment mapping of TrustPilot reviews for Competitor A', xp: 200, impact: 'High', color: '#0053dc', aiActive: true }],
  review:     [{ id: 'k5', tag: 'Data',     title: 'Consolidate feature parity matrix for Q4 report',          xp: 150, impact: 'High', color: '#865400' }],
  done:       [
    { id: 'k6', tag: 'Research', title: 'Draft initial competitor list', xp: 300, impact: 'Low', color: '#006d4a', done: true },
    { id: 'k7', tag: 'Setup',    title: 'Create project workspace',       xp: 50,  impact: 'Low', color: '#006d4a', done: true },
  ],
};

const IMPACT_STYLES = {
  High:   { bg: 'rgba(239,68,68,0.08)',   text: '#dc2626' },
  Medium: { bg: 'rgba(245,158,11,0.08)',  text: '#b45309' },
  Low:    { bg: 'rgba(100,116,139,0.08)', text: '#64748b' },
};

function KanbanCard({ task, colId, onMove }) {
  const imp = IMPACT_STYLES[task.impact] || IMPACT_STYLES.Low;
  return (
    <article
      className="bg-white p-5 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:bg-primary/[0.025] transition-all group relative overflow-hidden"
      style={{ borderLeft: `4px solid ${task.color}` }}
      draggable="true"
      onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, fromCol: colId }))}
    >
      {task.aiActive && (
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>trending_up</span>
        </div>
      )}
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: task.color }}>{task.tag}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: imp.bg, color: imp.text }}>{task.impact}</span>
      </div>
      <h4 className={'text-sm font-semibold text-on-surface mb-4 leading-tight ' + (task.done ? 'line-through opacity-50' : '')}>{task.title}</h4>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          {task.aiActive && <span className="text-[10px] font-medium text-slate-400 italic">AI Optimizing...</span>}
          {colId === 'done' && <span className="text-[10px] font-bold px-2 py-1 rounded text-secondary bg-secondary/10">MASTERED</span>}
        </div>
        <span className="text-[10px] font-bold" style={{ color: task.color }}>+{task.xp} XP</span>
      </div>
      {colId !== 'done' && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {KANBAN_COLUMNS.filter(c => c.id !== colId).map(c => (
            <button key={c.id} onClick={e => { e.stopPropagation(); onMove(task.id, colId, c.id); }}
              className="text-[9px] font-bold px-2 py-1 rounded-lg hover:text-white transition"
              style={{ background: c.color + '15', color: c.color }}
              title={`Move to ${c.label}`}
            >{c.label[0]}</button>
          ))}
        </div>
      )}
    </article>
  );
}

export default function GamifiedProjectView() {
  const router = useRouter();

  // In Next.js App Router there's no location.state; use defaults.
  const proj = {
    title: 'Market Research', parentGoal: 'Startup 2026', pct: 45, accentColor: '#0053dc',
  };

  const [columns, setColumns] = useState(DEFAULT_TASKS);
  const [xp, setXp] = useState(450);
  const [dragOver, setDragOver] = useState(null);

  const totalTasks = Object.values(columns).flat().length;
  const doneTasks = columns.done.length;

  const moveTask = (taskId, fromColId, toColId) => {
    setColumns(prev => {
      const task = prev[fromColId].find(t => t.id === taskId);
      if (!task) return prev;
      const updated = { ...prev };
      updated[fromColId] = updated[fromColId].filter(t => t.id !== taskId);
      const movedTask = toColId === 'done' ? { ...task, done: true } : { ...task, done: false };
      updated[toColId] = [...updated[toColId], movedTask];
      if (toColId === 'done') setXp(x => x + task.xp);
      return updated;
    });
  };

  const onColumnDrop = (e, toColId) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const { taskId, fromCol } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (fromCol !== toColId) moveTask(taskId, fromCol, toColId);
    } catch {}
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-8 bg-surface overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <header className="flex flex-col gap-4">
        <button className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-primary transition self-start" onClick={() => router.push('/projects')}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Projects
        </button>
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">↳ {proj.parentGoal || 'Startup 2026'}</span>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">{proj.title}</h1>
            <p className="text-sm text-on-surface-variant mt-1">{doneTasks} / {totalTasks} tasks complete</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-primary tracking-widest uppercase">Level 2 • Mastery Journey</span>
              <span className="text-sm font-medium text-slate-500">{xp} / 1000 XP</span>
            </div>
            <div className="w-64 h-3 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, xp / 10)}%`, background: proj.accentColor || '#0053dc', boxShadow: '0 0 12px rgba(0,83,220,0.4)' }} />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md border border-white/40 p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>smart_toy</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">AI Coach</h3>
              <p className="text-sm text-slate-500">Analysis shows "Market Sentiment" tasks are critical for Phase 2 readiness. Focus on those today.</p>
            </div>
          </div>
          <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all flex-shrink-0">Optimize Flow</button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-6" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {KANBAN_COLUMNS.map(col => (
          <section key={col.id} className="flex-shrink-0 flex flex-col gap-4" style={{ width: '300px' }}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => onColumnDrop(e, col.id)}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: col.color }}>{col.label}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: col.color + '15', color: col.color }}>{(columns[col.id] || []).length}</span>
              </div>
              <button className="p-1 hover:bg-surface-container-high rounded-lg transition">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>add</span>
              </button>
            </div>
            <div className={'flex-1 rounded-3xl p-4 flex flex-col gap-3 min-h-[400px] transition-all ' + col.bgClass + (dragOver === col.id ? ' ring-2 ring-primary/30' : '')}
              style={col.id === 'done' ? { border: '1px solid rgba(0,109,74,0.1)' } : {}}
            >
              {(columns[col.id] || []).map(task => (
                <KanbanCard key={task.id} task={task} colId={col.id} onMove={moveTask} />
              ))}
              {(columns[col.id] || []).length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs font-semibold text-on-surface-variant/30 text-center">Drop tasks here</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 group">
        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
      </button>
    </div>
  );
}
