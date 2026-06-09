"use client";

import { useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// ─── Sample task data per category ───────────────────────────────────────────
const SIDEBAR_DATA = {
  internal: [
    {
      id: 'physical', label: 'Physical', color: '#ef4444',
      tasks: [
        { id: 't1', title: 'Morning run 5km', duration: '30m', energy: 'High' },
        { id: 't2', title: 'Gym – upper body',  duration: '45m', energy: 'High' },
      ],
    },
    {
      id: 'mental', label: 'Mental', color: '#0053dc',
      tasks: [
        { id: 't3', title: 'Deep work: API design', duration: '2h',  energy: 'High' },
        { id: 't4', title: 'Read – 30 pages',       duration: '30m', energy: 'Low'  },
      ],
    },
    {
      id: 'spiritual', label: 'Spiritual', color: '#865400',
      tasks: [
        { id: 't5', title: 'Morning meditation', duration: '15m', energy: 'Low' },
        { id: 't6', title: 'Gratitude journal',  duration: '10m', energy: 'Low' },
      ],
    },
    {
      id: 'social', label: 'Social', color: '#006d4a',
      tasks: [
        { id: 't7', title: 'Call Mom',      duration: '20m', energy: 'Medium' },
        { id: 't8', title: 'Reply to Sam',  duration: '10m', energy: 'Low'    },
      ],
    },
  ],
  roles: [
    {
      id: 'senior-eng', label: 'Senior Engineer @ teli', icon: 'computer', color: '#0053dc',
      tasks: [
        { id: 't9',  title: 'Architecture Review',  duration: '45m', energy: 'High'   },
        { id: 't10', title: 'Code Review PR #42',   duration: '30m', energy: 'Medium' },
      ],
    },
    {
      id: 'husband', label: 'Husband', icon: 'favorite', color: '#e11d48',
      tasks: [
        { id: 't11', title: 'Plan date night', duration: '15m', energy: 'Low' },
      ],
    },
    {
      id: 'father', label: 'Father', icon: 'child_care', color: '#f59e0b',
      tasks: [
        { id: 't12', title: 'Help with homework', duration: '30m', energy: 'Medium' },
        { id: 't13', title: 'Bedtime story',       duration: '20m', energy: 'Low'    },
      ],
    },
    {
      id: 'founder', label: 'Founder @ ica', icon: 'rocket_launch', color: '#7c3aed',
      tasks: [
        { id: 't14', title: 'Investor pitch deck', duration: '1.5h', energy: 'High'   },
        { id: 't15', title: 'Team standup',         duration: '15m',  energy: 'Medium' },
      ],
    },
  ],
};

const ENERGY_COLORS = {
  High:   { bg: 'rgba(239,68,68,0.08)',   text: '#dc2626' },
  Medium: { bg: 'rgba(245,158,11,0.08)',  text: '#b45309' },
  Low:    { bg: 'rgba(16,185,129,0.08)',  text: '#059669' },
};

// ─── Draggable Task Card (dnd-kit) ───────────────────────────────────────────
function SidebarTaskCard({ task, accentColor }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `sidebar-${task.id}`,
    data: { type: 'sidebar-task', title: task.title, tag: task.energy, ...task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.4 : 1,
    borderLeftColor: accentColor,
  };

  const ec = ENERGY_COLORS[task.energy] || ENERGY_COLORS.Low;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="sidebar-task-card"
    >
      <div className="flex items-start justify-between gap-2">
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', lineHeight: 1.35 }}>{task.title}</span>
        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#cbd5e1', cursor: 'grab', flexShrink: 0, marginTop: '1px' }}>drag_indicator</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>⏱ {task.duration}</span>
        <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: ec.bg, color: ec.text }}>{task.energy}</span>
      </div>
    </div>
  );
}

// ─── Expandable Row ───────────────────────────────────────────────────────────
function ExpandableRow({ item, accentColor, icon }) {
  const [open, setOpen] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id: `sidebar-folder-${item.id}`,
    data: { type: 'sidebar-folder', folderId: item.id },
  });

  return (
    <div ref={setNodeRef} className={isOver ? "ring-2 ring-primary/50 rounded-xl bg-primary/5" : ""}>
      <div
        className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all"
        style={{ background: open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          {icon
            ? <span className="material-symbols-outlined" style={{ fontSize: '16px', color: accentColor, fontVariationSettings: '"FILL" 1' }}>{icon}</span>
            : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
          }
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{item.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '1px 6px', borderRadius: '8px' }}>{item.tasks.length}</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#94a3b8', transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
        </div>
      </div>
      <div style={{ overflow: 'hidden', transition: 'max-height 0.3s ease,opacity 0.2s ease', maxHeight: open ? '600px' : '0', opacity: open ? 1 : 0 }}>
        <div style={{ margin: '4px 0 4px 12px', paddingLeft: '12px', borderLeft: `2px solid ${accentColor}22`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {item.tasks.map(task => (
            <SidebarTaskCard key={task.id} task={task} accentColor={accentColor} />
          ))}
          <button
            style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', padding: '6px 4px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.color = '#0053dc'}
            onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function SidebarSection({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 mb-1 cursor-pointer group" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>{title}</span>
        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#94a3b8', transition: 'transform 0.25s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>expand_more</span>
      </div>
      <div style={{ overflow: 'hidden', transition: 'max-height 0.35s ease,opacity 0.2s', maxHeight: open ? '2000px' : '0', opacity: open ? 1 : 0 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const router     = useRouter();
  const pathname   = usePathname();
  const isSettings = pathname === '/settings';

  return (
    <aside
      className="h-[calc(100vh-64px)] w-72 fixed left-0 top-16 flex flex-col gap-y-4 overflow-y-auto sidebar-scroll z-40"
      style={{ background: 'rgba(241,244,246,0.88)', backdropFilter: 'blur(14px)', borderRight: '1px solid rgba(0,0,0,0.06)', padding: '16px 12px 8px' }}
    >
      {/* Scrollable content area */}
      <div className="flex-1 flex flex-col gap-y-4 overflow-y-auto sidebar-scroll">
        {/* INTERNAL BALANCE */}
        <SidebarSection title="Internal Balance">
          {SIDEBAR_DATA.internal.map(item => (
            <ExpandableRow key={item.id} item={item} accentColor={item.color} icon={null} />
          ))}
        </SidebarSection>

        <div style={{ height: '1px', background: 'rgba(148,163,184,0.2)', margin: '0 -4px' }} />

        {/* ROLE BALANCE */}
        <SidebarSection title="Role Balance">
          {SIDEBAR_DATA.roles.map(item => (
            <ExpandableRow key={item.id} item={item} accentColor={item.color} icon={item.icon} />
          ))}
          {/* AI Suggested */}
          <div style={{ marginTop: '8px', padding: '12px', borderRadius: '12px', border: '2px dashed rgba(99,102,241,0.3)', background: 'linear-gradient(135deg,rgba(238,242,255,0.7),rgba(245,243,255,0.7))', boxShadow: '0 0 20px rgba(99,102,241,0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#4f46e5', color: 'white', padding: '2px 8px', borderRadius: '9999px' }}>✨ AI Suggested</span>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#818cf8' }}>auto_awesome</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#312e81', display: 'block', marginBottom: '10px' }}>Freelancer</span>
            <div className="flex items-center gap-2">
              <button style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Why?</button>
              <button style={{ flex: 1, background: '#4f46e5', color: 'white', fontSize: '10px', fontWeight: 700, padding: '6px 0', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Confirm</button>
              <button className="material-symbols-outlined" style={{ fontSize: '15px', color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>close</button>
            </div>
          </div>
        </SidebarSection>

        {/* Add a role */}
        <button
          style={{ width: '100%', border: '2px dashed rgba(148,163,184,0.4)', borderRadius: '12px', padding: '10px', color: '#94a3b8', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'none', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#475569'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.4)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add a role
        </button>
      </div>

      {/* ── Pinned bottom: Settings ───────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: '10px', marginTop: '4px', flexShrink: 0 }}>
        <button
          id="sidebar-settings-btn"
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{
            background:  isSettings ? 'rgba(0,83,220,0.1)'   : 'transparent',
            color:       isSettings ? '#0053dc'              : '#64748b',
            fontWeight:  isSettings ? 700 : 600,
            fontSize: '13px',
          }}
          onMouseOver={e => { if (!isSettings) { e.currentTarget.style.background = 'rgba(148,163,184,0.12)'; e.currentTarget.style.color = '#334155'; } }}
          onMouseOut={e  => { if (!isSettings) { e.currentTarget.style.background = 'transparent';             e.currentTarget.style.color = '#64748b'; } }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', fontVariationSettings: isSettings ? "'FILL' 1" : "'FILL' 0" }}
          >
            settings
          </span>
          Settings
          {isSettings && (
            <span
              className="ml-auto w-1.5 h-1.5 rounded-full"
              style={{ background: '#0053dc', flexShrink: 0 }}
            />
          )}
        </button>
      </div>
    </aside>
  );
}
