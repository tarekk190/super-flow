"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDragStore } from '../../../store/useDragStore';
import { fetchTasks, createTask, updateTaskQuadrant } from '@/app/actions/task-actions';

// ─── Data ──────────────────────────────────────────────────────────────────────
const QUADRANTS = [
  { id: 'q1', label: 'DO IT NOW',    sub: 'Quadrant I',   tag: 'Urgent & Important',         icon: 'bolt',          iconBg: 'bg-amber-100',  iconText: 'text-amber-700',  sectionBg: 'rgba(251,191,36,0.06)',  border: '#f59e0b', tagBg: 'rgba(245,158,11,0.1)',   tagText: '#b45309' },
  { id: 'q2', label: 'SCHEDULE IT',  sub: 'Quadrant II',  tag: 'Non-Urgent & Important',     icon: 'calendar_today',iconBg: 'bg-green-100',  iconText: 'text-green-700',  sectionBg: 'rgba(16,185,129,0.05)', border: '#10b981', tagBg: 'rgba(16,185,129,0.1)',   tagText: '#047857' },
  { id: 'q3', label: 'DELEGATE IT',  sub: 'Quadrant III', tag: 'Urgent & Non-Important',     icon: 'groups',        iconBg: 'bg-blue-100',   iconText: 'text-blue-700',   sectionBg: 'rgba(59,130,246,0.05)', border: '#3b82f6', tagBg: 'rgba(59,130,246,0.1)',   tagText: '#1d4ed8' },
  { id: 'q4', label: 'ELIMINATE IT', sub: 'Quadrant IV',  tag: 'Non-Urgent & Non-Important', icon: 'delete',        iconBg: 'bg-slate-200',  iconText: 'text-slate-500',  sectionBg: 'rgba(148,163,184,0.06)',border: '#94a3b8', tagBg: 'rgba(148,163,184,0.1)', tagText: '#64748b' },
];

// Initial tasks are now fetched from Supabase
const INITIAL_TASKS = {
  q1: [],
  q2: [],
  q3: [],
  q4: [],
  unsorted: [],
};

const AI_RECOMMENDATIONS = { 'task-6': 'q2', 'task-7': 'q1', 'task-8': 'q3' };

// ─── Sortable Task Card ────────────────────────────────────────────────────────
function SortableTaskCard({ task, quadrantId, isNew }) {
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
        <div className="pt-1 flex flex-col items-center gap-3 flex-shrink-0">
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors" style={{ fontSize: '20px' }}>drag_indicator</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className={'font-semibold text-on-surface text-sm leading-tight ' + (quadrantId === 'q4' ? 'line-through decoration-slate-300 opacity-70' : '')}>{task.title}</h3>
            <span className="flex-shrink-0 text-[9px] px-2 py-0.5 font-bold uppercase tracking-tighter rounded-md" style={{ background: 'rgba(0,83,220,0.08)', color: '#0053dc' }}>{task.tag}</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{task.desc}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.aiSorted && (
                <span className="text-[9px] font-semibold text-secondary uppercase tracking-tight flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>smart_toy</span>
                  {task.aiLabel}
                </span>
              )}
              {isNew && <span style={{ fontSize: '9px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>AI ✨</span>}
            </div>
            {task.due && <div className="text-[9px] font-medium text-slate-400 flex-shrink-0">{task.due}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Droppable Quadrant ────────────────────────────────────────────────────────
function DroppableQuadrant({ q, tasks, newlyPlacedIds }) {
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
            <SortableTaskCard key={task.id} task={task} quadrantId={q.id} isNew={newlyPlacedIds.has(task.id)} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onUndo, onDismiss }) {
  return (
    <div className="fixed bottom-28 left-1/2 z-50 flex items-center gap-4"
      style={{ transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'viewFadeIn 0.2s ease', whiteSpace: 'nowrap' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#a78bfa' }}>auto_awesome</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{message}</span>
      {onUndo && <button onClick={onUndo} style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: 'none', cursor: 'pointer', padding: '4px 12px', borderRadius: '8px' }}>Undo</button>}
      <button onClick={onDismiss} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
      </button>
    </div>
  );
}

// ─── Main MatrixView — receives onDragEnd from DndContext via prop ─────────────
/**
 * Usage:
 *   MatrixView is mounted inside MainLayout's DndContext.
 *   It exports a handleExternalDrop function (see useMatrixDrop hook below)
 *   that MainLayout calls when a sidebar-task is dropped on a quadrant.
 *
 *   For internal quadrant-to-quadrant moves we use onDragEnd directly.
 */
export default function MatrixView() {
  const [tasks, setTasks]             = useState(INITIAL_TASKS);
  const [newlyPlaced, setNewlyPlaced] = useState(new Set());
  const [aiLoading, setAiLoading]     = useState(false);
  const [toast, setToast]             = useState(null);
  const toastTimer                    = useRef(null);
  const preAiSnapshot                 = useRef(null);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks()
      .then((dbTasks) => {
        const formatted = { q1: [], q2: [], q3: [], q4: [], unsorted: [] };
        dbTasks.forEach((t) => {
          const q = t.quadrant_id || 'unsorted';
          if (formatted[q]) {
            formatted[q].push(t);
          } else {
            formatted.unsorted.push(t);
          }
        });
        setTasks(formatted);
      })
      .catch(err => console.error('Failed to load tasks:', err));
  }, []);

  // ─── Subscribe to global drag events ─────────────────────────────────────
  // We expose our own handleDragEnd via a globally-registered callback so
  // MainLayout's DndContext can call into us when a sidebar task lands here.
  const { activeItem } = useDragStore();

  const showToast = useCallback((message, onUndo) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, onUndo });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ─── Move a task between quadrants (or from unsorted) ────────────────────
  const moveTask = useCallback((taskId, fromQ, toQ, overId) => {
    setTasks(prev => {
      const src  = prev[fromQ] || [];
      const task = src.find(t => t.id === taskId);
      if (!task) return prev;

      const next = { ...prev };
      next[fromQ] = src.filter(t => t.id !== taskId);

      if (fromQ === toQ) {
        // reorder within same quadrant
        const oldIdx = prev[toQ].findIndex(t => t.id === taskId);
        const newIdx = prev[toQ].findIndex(t => t.id === overId);
        if (oldIdx !== -1 && newIdx !== -1) next[toQ] = arrayMove(prev[toQ], oldIdx, newIdx);
        else next[fromQ] = src; // revert
      } else {
        const overIdx = (prev[toQ] || []).findIndex(t => t.id === overId);
        const insert  = overIdx >= 0 ? overIdx : (prev[toQ] || []).length;
        const list    = [...(prev[toQ] || [])];
        list.splice(insert, 0, { ...task, aiSorted: false, quadrant_id: toQ });
        next[toQ] = list;
      }
      return next;
    });

    if (fromQ !== toQ) {
      updateTaskQuadrant(taskId, toQ).catch(err => {
        console.error('Failed to save task move to DB:', err);
        showToast('Error saving task move to database.');
      });
    }
  }, [showToast]);

  // ─── Global onDragEnd — registered on window so MainLayout can call it ───
  // This is the hook point for sidebar-task → quadrant drops.
  const handleGlobalDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType   = over.data.current?.type;

    // Sidebar task → quadrant
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

      // Optimistically show loading state or temporary ID? 
      // We will create it in DB, then update UI with the real ID.
      createTask(newTaskData).then((realTask) => {
        setTasks(prev => ({ ...prev, [destQ]: [...(prev[destQ] || []), realTask] }));
        setNewlyPlaced(s => new Set(s).add(realTask.id));
        setTimeout(() => setNewlyPlaced(new Set()), 6000);
        showToast(`Task added to ${QUADRANTS.find(q => q.id === destQ)?.label}`, null);
      }).catch(err => {
        console.error('Failed to create task from sidebar:', err);
        showToast('Error adding task from sidebar.');
      });
      
      return;
    }

    // Matrix task → different quadrant
    if (activeType === 'matrix-task') {
      const fromQ  = active.data.current.quadrantId;
      const toQ    = overType === 'quadrant'
        ? over.id
        : over.data.current?.quadrantId;
      if (!toQ) return;
      moveTask(active.id, fromQ, toQ, over.id);
      if (fromQ !== toQ) showToast(`Moved to ${QUADRANTS.find(q => q.id === toQ)?.label}`, null);
    }
  }, [moveTask, showToast]);

  // Register callback on window so MainLayout DndContext can invoke it
  // (avoids prop drilling through React Router <Outlet>)
  useEffect(() => {
    window.__matrixDragEnd = handleGlobalDragEnd;
    return () => { delete window.__matrixDragEnd; };
  }, [handleGlobalDragEnd]);

  // ─── AI Recommend ─────────────────────────────────────────────────────────
  const handleAIRecommend = async () => {
    if (aiLoading) return;
    preAiSnapshot.current = JSON.parse(JSON.stringify(tasks));
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    const unsorted = tasks.unsorted || [];
    if (unsorted.length === 0) { setAiLoading(false); showToast('No unsorted tasks to process.', null); return; }
    const newNamed = new Set();
    setTasks(prev => {
      const updated = { ...prev };
      for (const task of prev.unsorted) {
        const dest = AI_RECOMMENDATIONS[task.id] || 'q2';
        updated[dest] = [...(updated[dest] || []), { ...task, aiSorted: true, aiLabel: '🤖 AI Auto-Sorted' }];
        newNamed.add(task.id);
      }
      updated.unsorted = [];
      return updated;
    });
    setNewlyPlaced(newNamed);
    setAiLoading(false);
    setTimeout(() => setNewlyPlaced(new Set()), 6000);
    showToast('AI sorted ' + unsorted.length + ' task(s) ✨', () => {
      setTasks(preAiSnapshot.current);
      setNewlyPlaced(new Set());
      setToast(null);
    });
  };

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
                ✨ <span className="font-semibold text-primary">AI Insight:</span> 40% of your tasks are in Q1. High burnout risk — consider delegating Q3.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button id="ai-recommend-btn" disabled={aiLoading} onClick={handleAIRecommend}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#9333ea)', opacity: aiLoading ? 0.75 : 1, cursor: aiLoading ? 'not-allowed' : 'pointer', boxShadow: aiLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)' }}>
              {aiLoading
                ? <><span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>refresh</span><span>Analyzing...</span></>
                : <><span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span><span>Recommend Priority</span></>}
            </button>
            <button className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span> Brain Dump
            </button>
          </div>
        </div>
      </header>

      {/* Unsorted Pool — also a droppable */}
      {(tasks.unsorted || []).length > 0 && (
        <UnsortedPool tasks={tasks.unsorted} aiLoading={aiLoading} />
      )}

      {/* 2×2 Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {QUADRANTS.map(q => (
          <DroppableQuadrant key={q.id} q={q} tasks={tasks[q.id] || []} newlyPlacedIds={newlyPlaced} />
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-surface-container-low rounded-3xl p-8">
          <h3 className="text-lg font-semibold mb-5 text-on-surface">Focus Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            {[['Completed','12','text-primary'],['Delegated','04','text-secondary'],['Focus Score','82%','text-tertiary']].map(([label,val,cls]) => (
              <div key={label} className="bg-white p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <div className={`text-3xl font-bold mt-1 ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-primary/90 backdrop-blur-xl text-white rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="font-bold uppercase tracking-widest text-[10px]">Upcoming AI Triage</span>
          </div>
          <p className="text-sm font-medium leading-relaxed mb-6">"I noticed you have 3 unassigned tasks from the 'Family' role. Would you like me to move 'Grocery Shopping' to Q1 for tomorrow?"</p>
          <div className="flex gap-3">
            <button className="bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-md">Yes, please</button>
            <button className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold">Dismiss</button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 right-10 z-40">
        <button className="h-16 w-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>

      {toast && <Toast message={toast.message} onUndo={toast.onUndo ? () => { toast.onUndo(); } : null} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ─── Unsorted Pool (also droppable) ──────────────────────────────────────────
function UnsortedPool({ tasks, aiLoading }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unsorted', data: { type: 'quadrant', quadrantId: 'unsorted' } });
  return (
    <div ref={setNodeRef} className="mb-6 rounded-2xl p-5 border-2 border-dashed transition-colors"
      style={{ borderColor: isOver ? '#6366f1' : '#6366f120', background: isOver ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#6366f1' }}>queue</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>Unsorted — {tasks.length} task(s) awaiting AI triage</span>
        {aiLoading && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>AI Analyzing...</span>}
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-wrap gap-3">
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} quadrantId="unsorted" isNew={false} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
