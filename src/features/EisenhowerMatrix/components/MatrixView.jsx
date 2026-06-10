"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDragStore } from '../../../store/useDragStore';
import { fetchTasks, createTask, createTasks, updateTaskQuadrant } from '@/app/actions/task-actions';
import BrainDumpModal from './BrainDumpModal';

// ─── Data ───────────────────────────────────────────────────────────────────────
const QUADRANTS = [
  { id: 'q1', label: 'DO IT NOW',    sub: 'Quadrant I',   tag: 'Urgent & Important',         icon: 'bolt',           iconBg: 'bg-amber-100',  iconText: 'text-amber-700',  sectionBg: 'rgba(251,191,36,0.06)',   border: '#f59e0b', tagBg: 'rgba(245,158,11,0.1)',   tagText: '#b45309' },
  { id: 'q2', label: 'SCHEDULE IT',  sub: 'Quadrant II',  tag: 'Non-Urgent & Important',     icon: 'calendar_today', iconBg: 'bg-green-100',  iconText: 'text-green-700',  sectionBg: 'rgba(16,185,129,0.05)',  border: '#10b981', tagBg: 'rgba(16,185,129,0.1)',   tagText: '#047857' },
  { id: 'q3', label: 'DELEGATE IT',  sub: 'Quadrant III', tag: 'Urgent & Non-Important',     icon: 'groups',         iconBg: 'bg-blue-100',   iconText: 'text-blue-700',   sectionBg: 'rgba(59,130,246,0.05)',  border: '#3b82f6', tagBg: 'rgba(59,130,246,0.1)',   tagText: '#1d4ed8' },
  { id: 'q4', label: 'ELIMINATE IT', sub: 'Quadrant IV',  tag: 'Non-Urgent & Non-Important', icon: 'delete',         iconBg: 'bg-slate-200',  iconText: 'text-slate-500',  sectionBg: 'rgba(148,163,184,0.06)', border: '#94a3b8', tagBg: 'rgba(148,163,184,0.1)', tagText: '#64748b' },
];

const QUADRANT_LABELS = Object.fromEntries(QUADRANTS.map(q => [q.id, q.label]));
const INITIAL_TASKS   = { q1: [], q2: [], q3: [], q4: [], unsorted: [] };

// ─── Sortable Task Card ─────────────────────────────────────────────────────────
function SortableTaskCard({ task, quadrantId, isNew, analyzeTask, aiResult, isAnalyzing }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id:   task.id,
    data: { type: 'matrix-task', quadrantId, title: task.title, tag: task.tag, ...task },
  });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.4 : 1,
    borderLeft: isNew ? '3px solid #7c3aed' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing"
    >
      <div className="flex gap-3">
        <div className="pt-1 flex-shrink-0">
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors" style={{ fontSize: '20px' }}>drag_indicator</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className={'font-semibold text-on-surface text-sm leading-tight ' + (quadrantId === 'q4' ? 'line-through decoration-slate-300 opacity-70' : '')}>{task.title}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.tag && (
                <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-tighter rounded-md" style={{ background: 'rgba(0,83,220,0.08)', color: '#0053dc' }}>{task.tag}</span>
              )}
              {/* Analyze button — stopPropagation prevents dnd from starting */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); analyzeTask(task); }}
                disabled={isAnalyzing}
                title="Analyze with AI"
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center hover:bg-purple-100 disabled:cursor-not-allowed"
              >
                {isAnalyzing
                  ? <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                  : <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#7c3aed', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                }
              </button>
            </div>
          </div>

          {task.desc && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{task.desc}</p>}

          {/* AI Analysis result — inline */}
          {aiResult && (
            <div className="mt-2 p-2 rounded-xl border" style={{ background: 'rgba(124,58,237,0.04)', borderColor: 'rgba(124,58,237,0.15)' }}>
              <div className="flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined" style={{ fontSize: '10px', color: '#7c3aed', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c3aed' }}>
                  AI → {QUADRANT_LABELS[aiResult.suggested_quadrant] || aiResult.suggested_quadrant}
                </span>
                <span className="ml-auto text-[9px]" style={{ color: '#a78bfa' }}>
                  U:{Math.round((aiResult.urgency_score || 0) * 10)}/10 · I:{Math.round((aiResult.importance_score || 0) * 10)}/10
                </span>
              </div>
              <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: '#6d28d9' }}>{aiResult.reasoning}</p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.aiSorted && (
                <span className="text-[9px] font-semibold text-secondary uppercase tracking-tight flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>smart_toy</span>
                  {task.aiLabel}
                </span>
              )}
              {isNew && (
                <span style={{ fontSize: '9px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>AI ✨</span>
              )}
            </div>
            {task.due && <div className="text-[9px] font-medium text-slate-400 flex-shrink-0">{task.due}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Droppable Quadrant ─────────────────────────────────────────────────────────
function DroppableQuadrant({ q, tasks, newlyPlacedIds, analyzeTask, aiResults, analyzingIds }) {
  const { setNodeRef, isOver } = useDroppable({ id: q.id, data: { type: 'quadrant', quadrantId: q.id } });

  return (
    <section
      ref={setNodeRef}
      className="rounded-[2.5rem] p-6 flex flex-col gap-5 transition-all"
      style={{
        background: isOver
          ? q.sectionBg.replace(/[\d.]+\)$/, s => (parseFloat(s) * 3).toFixed(2) + ')')
          : q.sectionBg,
        border: isOver ? `2px dashed ${q.border}` : '2px solid transparent',
        minHeight: '260px',
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${q.iconBg} ${q.iconText}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{q.icon}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-widest leading-none" style={{ color: q.border }}>{q.sub}</span>
            <h2 className="text-base font-bold text-on-surface leading-tight">{q.label}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2.5 py-1 rounded-full font-bold uppercase" style={{ background: q.tagBg, color: q.tagText }}>{q.tag}</span>
          <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-full shadow-sm">{tasks.length}</span>
        </div>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(40vh - 60px)', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-2xl" style={{ borderColor: q.border + '40' }}>
              <p className="text-xs font-semibold" style={{ color: q.border + '80' }}>Drop tasks here</p>
            </div>
          )}
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              quadrantId={q.id}
              isNew={newlyPlacedIds.has(task.id)}
              analyzeTask={analyzeTask}
              aiResult={aiResults[task.id]}
              isAnalyzing={analyzingIds.has(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, onUndo, onDismiss }) {
  return (
    <div
      className="fixed bottom-28 left-1/2 z-50 flex items-center gap-4"
      style={{ transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'viewFadeIn 0.2s ease', whiteSpace: 'nowrap' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#a78bfa' }}>auto_awesome</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{message}</span>
      {onUndo && (
        <button onClick={onUndo} style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: 'none', cursor: 'pointer', padding: '4px 12px', borderRadius: '8px' }}>Undo</button>
      )}
      <button onClick={onDismiss} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
      </button>
    </div>
  );
}

// ─── Main MatrixView ────────────────────────────────────────────────────────────
export default function MatrixView() {
  const [tasks, setTasks]                   = useState(INITIAL_TASKS);
  const [pageLoading, setPageLoading]       = useState(true);
  const [newlyPlaced, setNewlyPlaced]       = useState(new Set());
  const [aiLoading, setAiLoading]           = useState(false);
  const [toast, setToast]                   = useState(null);
  const [brainDumpOpen, setBrainDumpOpen]   = useState(false);
  const [brainDumping, setBrainDumping]     = useState(false);
  const [aiResults, setAiResults]           = useState({});
  const [analyzingIds, setAnalyzingIds]     = useState(new Set());
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const tasksRef      = useRef(tasks);
  const toastTimer    = useRef(null);
  const preAiSnapshot = useRef(null);

  // Keep tasksRef current for rollback snapshots
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Initial fetch
  useEffect(() => {
    fetchTasks()
      .then((dbTasks) => {
        const formatted = { q1: [], q2: [], q3: [], q4: [], unsorted: [] };
        dbTasks.forEach((t) => {
          const q = t.quadrant_id || 'unsorted';
          if (formatted[q]) formatted[q].push(t);
          else formatted.unsorted.push(t);
        });
        setTasks(formatted);
      })
      .catch(err => console.error('Failed to load tasks:', err))
      .finally(() => setPageLoading(false));
  }, []);

  const { activeItem } = useDragStore();

  const showToast = useCallback((message, onUndo) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, onUndo: onUndo || null });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ─── Move task between quadrants — snapshot rollback on DB failure ──────────
  const moveTask = useCallback((taskId, fromQ, toQ, overId) => {
    const snapshot = tasksRef.current;

    setTasks(prev => {
      const src  = prev[fromQ] || [];
      const task = src.find(t => t.id === taskId);
      if (!task) return prev;

      const next = { ...prev };
      next[fromQ] = src.filter(t => t.id !== taskId);

      if (fromQ === toQ) {
        const oldIdx = prev[toQ].findIndex(t => t.id === taskId);
        const newIdx = prev[toQ].findIndex(t => t.id === overId);
        if (oldIdx !== -1 && newIdx !== -1) next[toQ] = arrayMove(prev[toQ], oldIdx, newIdx);
        else next[fromQ] = src;
      } else {
        const overIdx = overId ? (prev[toQ] || []).findIndex(t => t.id === overId) : -1;
        const insert  = overIdx >= 0 ? overIdx : (prev[toQ] || []).length;
        const list    = [...(prev[toQ] || [])];
        list.splice(insert, 0, { ...task, aiSorted: false, quadrant_id: toQ });
        next[toQ] = list;
      }
      return next;
    });

    if (fromQ !== toQ) {
      updateTaskQuadrant(taskId, toQ).catch(() => {
        setTasks(snapshot);
        showToast('Failed to save move. Changes reverted.');
      });
    }
  }, [showToast]);

  // ─── Brain Dump — optimistic temp IDs, replace with real on success ─────────
  const handleBrainDump = useCallback(async (titles) => {
    setBrainDumping(true);
    const snapshot = tasksRef.current;

    const tempTasks = titles.map((title, i) => ({
      id: `temp-${Date.now()}-${i}`,
      title,
      desc: '',
      tag: '',
      quadrant_id: 'unsorted',
      aiSorted: false,
      _temp: true,
    }));

    setBrainDumpOpen(false);
    setTasks(prev => ({ ...prev, unsorted: [...(prev.unsorted || []), ...tempTasks] }));

    try {
      const realTasks = await createTasks(titles);
      setTasks(prev => ({
        ...prev,
        unsorted: prev.unsorted.filter(t => !t._temp).concat(realTasks),
      }));
      showToast(`Added ${realTasks.length} task${realTasks.length !== 1 ? 's' : ''} to Unsorted ✨`);
    } catch {
      setTasks(snapshot);
      showToast('Failed to save tasks. Please try again.');
    } finally {
      setBrainDumping(false);
    }
  }, [showToast]);

  // ─── Analyze a single task with AI ──────────────────────────────────────────
  const analyzeTask = useCallback(async (task) => {
    setAnalyzingIds(prev => new Set([...prev, task.id]));
    try {
      const res = await fetch(`/api/tasks/${task.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, details: task.desc || '' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiResults(prev => ({ ...prev, [task.id]: data.data }));
        setLatestAnalysis({ task, result: data.data });
      } else {
        showToast('AI analysis failed. Please try again.');
      }
    } catch {
      showToast('AI analysis failed. Please try again.');
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }, [showToast]);

  // ─── Global onDragEnd — registered so MainLayout DndContext can call in ─────
  const handleGlobalDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType   = over.data.current?.type;

    if (activeType === 'sidebar-task') {
      const destQ = overType === 'quadrant' ? over.id : over.data.current?.quadrantId;
      if (!destQ || !QUADRANTS.find(q => q.id === destQ)) return;

      const newTaskData = {
        title:    active.data.current.title,
        desc:     `Added from sidebar – ${active.data.current.duration || ''}`.trim(),
        tag:      active.data.current.energy || 'Task',
        due:      '',
        quadrant_id: destQ,
        aiSorted: false,
      };

      createTask(newTaskData)
        .then((realTask) => {
          setTasks(prev => ({ ...prev, [destQ]: [...(prev[destQ] || []), realTask] }));
          setNewlyPlaced(s => new Set(s).add(realTask.id));
          setTimeout(() => setNewlyPlaced(new Set()), 6000);
          showToast(`Task added to ${QUADRANTS.find(q => q.id === destQ)?.label}`);
        })
        .catch(err => {
          console.error('Failed to create task from sidebar:', err);
          showToast('Error adding task from sidebar.');
        });
      return;
    }

    if (activeType === 'matrix-task') {
      const fromQ = active.data.current.quadrantId;
      const toQ   = overType === 'quadrant' ? over.id : over.data.current?.quadrantId;
      if (!toQ) return;
      moveTask(active.id, fromQ, toQ, over.id);
      if (fromQ !== toQ) showToast(`Moved to ${QUADRANTS.find(q => q.id === toQ)?.label}`);
    }
  }, [moveTask, showToast]);

  useEffect(() => {
    window.__matrixDragEnd = handleGlobalDragEnd;
    return () => { delete window.__matrixDragEnd; };
  }, [handleGlobalDragEnd]);

  // ─── AI Recommend — bulk-sort unsorted tasks via /api/matrix-sort ──────────
  const handleAIRecommend = useCallback(async () => {
    if (aiLoading) return;
    const unsorted = tasks.unsorted || [];
    if (!unsorted.length) { showToast('No unsorted tasks to analyze.'); return; }

    preAiSnapshot.current = JSON.parse(JSON.stringify(tasks));
    setAiLoading(true);

    try {
      const res = await fetch('/api/matrix-sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: unsorted }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      if (data.classifications?.length) {
        const newNamed = new Set();
        setTasks(prev => {
          const updated = { ...prev };
          for (const c of data.classifications) {
            const task = prev.unsorted.find(t => t.id === c.taskId);
            if (!task) continue;
            const dest = ['q1', 'q2', 'q3', 'q4'].includes(c.quadrant) ? c.quadrant : 'q2';
            updated[dest] = [...(updated[dest] || []), { ...task, aiSorted: true, aiLabel: '🤖 AI Sorted' }];
            newNamed.add(task.id);
          }
          updated.unsorted = prev.unsorted.filter(t => !newNamed.has(t.id));
          return updated;
        });
        setNewlyPlaced(newNamed);
        setTimeout(() => setNewlyPlaced(new Set()), 6000);
        showToast(`AI sorted ${data.classifications.length} task(s) ✨`, () => {
          setTasks(preAiSnapshot.current);
          setNewlyPlaced(new Set());
          setToast(null);
        });
      } else {
        showToast('No classifications returned from AI.');
      }
    } catch (err) {
      console.error('[AI Recommend]', err);
      showToast('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, tasks, showToast]);

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium">Loading your matrix…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-10 pb-32">

      {/* Header */}
      <header className="mb-8">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-on-surface">Matrix Intelligence</h1>
              <p className="text-on-surface-variant mt-0.5 text-sm">
                ✨ <span className="font-semibold text-primary">AI Insight:</span>{' '}
                {(tasks.q1 || []).length > 3
                  ? `${tasks.q1.length} tasks in Q1 — high burnout risk. Consider delegating Q3.`
                  : 'Drag tasks to their quadrant, or let AI sort them for you.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              id="ai-recommend-btn"
              disabled={aiLoading}
              onClick={handleAIRecommend}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#9333ea)', opacity: aiLoading ? 0.75 : 1, cursor: aiLoading ? 'not-allowed' : 'pointer', boxShadow: aiLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)' }}
            >
              {aiLoading
                ? <><span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>refresh</span><span>Analyzing...</span></>
                : <><span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span><span>Recommend Priority</span></>
              }
            </button>
            <button
              onClick={() => setBrainDumpOpen(true)}
              className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span> Brain Dump
            </button>
          </div>
        </div>
      </header>

      {/* Unsorted Pool */}
      {(tasks.unsorted || []).length > 0 && (
        <UnsortedPool
          tasks={tasks.unsorted}
          aiLoading={aiLoading}
          analyzeTask={analyzeTask}
          aiResults={aiResults}
          analyzingIds={analyzingIds}
        />
      )}

      {/* 2×2 Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {QUADRANTS.map(q => (
          <DroppableQuadrant
            key={q.id}
            q={q}
            tasks={tasks[q.id] || []}
            newlyPlacedIds={newlyPlaced}
            analyzeTask={analyzeTask}
            aiResults={aiResults}
            analyzingIds={analyzingIds}
          />
        ))}
      </div>

      {/* Statistics + AI Coaching Panel */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-surface-container-low rounded-3xl p-8">
          <h3 className="text-lg font-semibold mb-5 text-on-surface">Focus Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Q1 Tasks',  String((tasks.q1       || []).length).padStart(2, '0'), 'text-amber-600'],
              ['Unsorted',  String((tasks.unsorted || []).length).padStart(2, '0'), 'text-primary'],
              ['Analyzed',  String(Object.keys(aiResults).length).padStart(2, '0'), 'text-purple-600'],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-white p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <div className={`text-3xl font-bold mt-1 ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Coaching Panel */}
        <div className="bg-primary/90 backdrop-blur-xl text-white rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="font-bold uppercase tracking-widest text-[10px]">AI Insight</span>
          </div>
          {latestAnalysis ? (
            <>
              <p className="text-[10px] font-semibold text-white/70 mb-1 truncate">"{latestAnalysis.task.title}"</p>
              <p className="text-sm font-medium leading-relaxed mb-4">{latestAnalysis.result.reasoning}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-bold">
                  → {QUADRANT_LABELS[latestAnalysis.result.suggested_quadrant] || latestAnalysis.result.suggested_quadrant}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-bold">
                  U: {Math.round((latestAnalysis.result.urgency_score || 0) * 10)}/10
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-bold">
                  I: {Math.round((latestAnalysis.result.importance_score || 0) * 10)}/10
                </span>
              </div>
              <button
                onClick={() => {
                  const t   = latestAnalysis.task;
                  const toQ = latestAnalysis.result.suggested_quadrant;
                  const fromQ = Object.keys(tasks).find(q => (tasks[q] || []).some(tk => tk.id === t.id)) || 'unsorted';
                  if (fromQ !== toQ) {
                    moveTask(t.id, fromQ, toQ, null);
                    showToast(`Moved "${t.title}" to ${QUADRANT_LABELS[toQ]}`);
                  }
                }}
                className="bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Apply Suggestion
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium leading-relaxed mb-6">
                Click the ✨ icon on any task card to get AI-powered Eisenhower quadrant placement insights.
              </p>
              <button
                onClick={handleAIRecommend}
                disabled={aiLoading}
                className="bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-md disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all"
              >
                {aiLoading ? 'Analyzing…' : 'Sort All Unsorted'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-10 right-10 z-40">
        <button
          onClick={() => setBrainDumpOpen(true)}
          className="h-16 w-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          title="Brain Dump"
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.onUndo ? () => toast.onUndo() : null}
          onDismiss={() => setToast(null)}
        />
      )}

      <BrainDumpModal
        open={brainDumpOpen}
        onClose={() => { if (!brainDumping) setBrainDumpOpen(false); }}
        onSubmit={handleBrainDump}
        loading={brainDumping}
      />
    </div>
  );
}

// ─── Unsorted Pool ──────────────────────────────────────────────────────────────
function UnsortedPool({ tasks, aiLoading, analyzeTask, aiResults, analyzingIds }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unsorted', data: { type: 'quadrant', quadrantId: 'unsorted' } });

  return (
    <div
      ref={setNodeRef}
      className="mb-6 rounded-2xl p-5 border-2 border-dashed transition-colors"
      style={{ borderColor: isOver ? '#6366f1' : '#6366f120', background: isOver ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#6366f1' }}>queue</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>
          Unsorted — {tasks.length} task{tasks.length !== 1 ? 's' : ''} awaiting triage
        </span>
        {aiLoading && (
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>AI Analyzing...</span>
        )}
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-wrap gap-3">
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              quadrantId="unsorted"
              isNew={false}
              analyzeTask={analyzeTask}
              aiResult={aiResults[task.id]}
              isAnalyzing={analyzingIds.has(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
