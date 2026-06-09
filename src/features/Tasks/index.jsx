"use client";

import { useState, useEffect, useRef } from "react";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Column UI config — not task data
const COLUMNS = {
  todo:       { id: "todo",       title: "To Do",       color: "text-tertiary",  bg: "bg-tertiary/10",  border: "border-tertiary/20"  },
  inProgress: { id: "inProgress", title: "In Progress", color: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20"   },
  done:       { id: "done",       title: "Done",        color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
};

// DB status ↔ frontend column ID
const STATUS_TO_COLUMN = { todo: "todo", in_progress: "inProgress", done: "done" };
const COLUMN_TO_STATUS = { todo: "todo", inProgress: "in_progress", done: "done" };

const priorityColors = {
  High: "bg-error/10 text-error border-error/20",
  Med:  "bg-warning/10 text-warning border-warning/20",
  Low:  "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
};

function dbToLocal(row) {
  return {
    id:          row.id,
    columnId:    STATUS_TO_COLUMN[row.status] ?? "todo",
    title:       row.title,
    description: row.description || "",
    priority:    row.priority || "Med",
    tags:        Array.isArray(row.tags) ? row.tags : [],
  };
}

// ─── Task creation modal ───────────────────────────────────────────────────

function TaskModal({ onSave, onClose }) {
  const [title,       setTitle      ] = useState("");
  const [description, setDescription] = useState("");
  const [priority,    setPriority   ] = useState("Med");
  const [tags,        setTags       ] = useState("");
  const [saving,      setSaving     ] = useState(false);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    await onSave({
      title:       title.trim(),
      description: description.trim(),
      priority,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md mx-4 rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <h2 className="text-lg font-bold text-on-surface">New Task</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Title <span className="text-error">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") onClose(); }}
              placeholder="What needs to be done?"
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional details..."
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {["High", "Med", "Low"].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    priority === p
                      ? priorityColors[p] + " scale-[1.02]"
                      : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Tags{" "}
              <span className="font-normal normal-case text-on-surface-variant/60">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Frontend, Backend, Docs..."
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          >
            {saving ? "Adding…" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable task card ────────────────────────────────────────────────────

function SortableTaskItem({ task, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id:   task.id,
    data: { type: "task-item", current: { type: "task-item", sortable: true } },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-md transition-shadow group relative"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[task.priority] ?? priorityColors.Med}`}>
          {task.priority}
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <h4 className="text-sm font-bold text-on-surface leading-snug mb-3">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-on-surface-variant mb-3 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {task.tags.map(tag => (
            <span key={tag} className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Droppable column ──────────────────────────────────────────────────────

function Column({ column, tasks, onDelete }) {
  const { setNodeRef } = useDroppable({
    id:   column.id,
    data: { type: "task-column" },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col bg-surface-container-low/50 rounded-3xl p-4 border border-outline-variant/20 h-full min-h-[500px]"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${column.bg} border ${column.border}`} />
          <h3 className={`font-bold text-sm uppercase tracking-wider ${column.color}`}>{column.title}</h3>
        </div>
        <span className="text-xs font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskItem key={task.id} task={task} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────

export default function TasksView() {
  const [tasks,     setTasks    ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const tasksRef = useRef([]);

  // Keep ref in sync so the drag handler avoids stale closures
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Fetch tasks from Supabase on mount
  useEffect(() => {
    fetch("/api/tasks")
      .then(r => r.json())
      .then(({ tasks: rows }) => setTasks((rows ?? []).map(dbToLocal)))
      .catch(err => console.error("[tasks] fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // Global drag-end handler — uses tasksRef so no stale-closure deps needed
  useEffect(() => {
    window.__tasksDragEnd = (event) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId   = over.id;

      if (!active.data.current || active.data.current.type !== "task-item") return;

      const isOverTask   = over.data.current?.type === "task-item";
      const isOverColumn = over.data.current?.type === "task-column";
      if (!isOverTask && !isOverColumn) return;

      const current   = tasksRef.current;
      const activeIdx = current.findIndex(t => t.id === activeId);
      if (activeIdx === -1) return;

      const oldColumnId = current[activeIdx].columnId;
      let newColumnId;
      let overIdx = -1;

      if (isOverTask) {
        overIdx = current.findIndex(t => t.id === overId);
        if (overIdx === -1) return;
        newColumnId = current[overIdx].columnId;
      } else {
        newColumnId = overId;
      }

      // Optimistic update
      let updated = current.map((t, i) =>
        i === activeIdx && newColumnId !== oldColumnId
          ? { ...t, columnId: newColumnId }
          : t
      );
      if (isOverTask && overIdx !== -1) {
        updated = arrayMove(updated, activeIdx, overIdx);
      }
      setTasks(updated);

      // Sync status change to Supabase
      if (newColumnId !== oldColumnId) {
        fetch(`/api/tasks/${activeId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ status: COLUMN_TO_STATUS[newColumnId] }),
        }).catch(err => console.error("[tasks] status update failed:", err));
      }
    };

    return () => { delete window.__tasksDragEnd; };
  }, []);

  const handleCreateTask = async ({ title, description, priority, tags }) => {
    const tempId  = `temp-${Date.now()}`;
    const newTask = { id: tempId, columnId: "todo", title, description, priority, tags };

    setTasks(prev => [...prev, newTask]);
    setShowModal(false);

    try {
      const res = await fetch("/api/tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, description, priority, tags }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const { task } = await res.json();
      setTasks(prev => prev.map(t => t.id === tempId ? dbToLocal(task) : t));
    } catch (err) {
      console.error("[tasks] create failed:", err);
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("[tasks] delete failed:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 h-full flex flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
            Execution Engine
          </span>
          <h1 className="text-4xl font-bold text-on-surface tracking-tight">Tasks</h1>
          <p className="mt-2 text-on-surface-variant text-sm max-w-lg leading-relaxed">
            Drag and drop to manage your workflow. Keep tasks moving towards completion.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-surface border border-outline-variant/30 text-on-surface px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span> New Task
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {Object.values(COLUMNS).map(col => (
            <div
              key={col.id}
              className="bg-surface-container-low/50 rounded-3xl border border-outline-variant/20 min-h-[500px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {Object.values(COLUMNS).map(col => (
            <div key={col.id} className="h-full">
              <Column
                column={col}
                tasks={tasks.filter(t => t.columnId === col.id)}
                onDelete={handleDeleteTask}
              />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          onSave={handleCreateTask}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
