"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';

// ─── Layout constants ─────────────────────────────────────────────────────────
const HOUR_HEIGHT   = 80;
const SNAP_MINUTES  = 15;
const SNAP_PX       = (SNAP_MINUTES / 60) * HOUR_HEIGHT;
const DAYS          = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS         = Array.from({ length: 24 }, (_, i) => i);
const MONTHS        = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Color palette ────────────────────────────────────────────────────────────
const COLOR_MAP = {
  indigo:  { bg: '#eef2ff', text: '#3730a3', border: '#4f46e5' },
  blue:    { bg: '#eff6ff', text: '#1e3a8a', border: '#2563eb' },
  emerald: { bg: '#ecfdf5', text: '#065f46', border: '#059669' },
  rose:    { bg: '#fff1f2', text: '#9f1239', border: '#e11d48' },
  amber:   { bg: '#fffbeb', text: '#78350f', border: '#d97706' },
  purple:  { bg: '#faf5ff', text: '#581c87', border: '#7c3aed' },
  teal:    { bg: '#f0fdfa', text: '#134e4a', border: '#0d9488' },
};
const COLOR_KEYS = Object.keys(COLOR_MAP);

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** 'YYYY-MM-DD' string from a Date (local time, no UTC shift). */
function toDateStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convert a Supabase row to the component's local event format. */
function dbToLocal(row) {
  const start = new Date(row.start_time);
  const end   = new Date(row.end_time);
  return {
    id:          row.id,
    dateStr:     toDateStr(start),
    startMin:    start.getHours() * 60 + start.getMinutes(),
    durationMin: Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000)),
    title:       row.title,
    color:       row.color  || 'indigo',
    role:        row.role   || '',
  };
}

/** Convert local event back to { start_time, end_time } ISO strings. */
function localToTimestamps(evt) {
  const [y, m, d] = evt.dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, Math.floor(evt.startMin / 60), evt.startMin % 60, 0, 0);
  const end   = new Date(start.getTime() + evt.durationMin * 60000);
  return { start_time: start.toISOString(), end_time: end.toISOString() };
}

function formatHour(h) {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}
function fmt(m) {
  const h    = Math.floor(m / 60) % 24;
  const min  = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${min.toString().padStart(2, '0')} ${ampm}`;
}
function formatTimeRange(s, e) { return `${fmt(s)} – ${fmt(e)}`; }

function getWeekDates(base) {
  const d = new Date(base);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function getMonthDates(base) {
  const y = base.getFullYear(), m = base.getMonth();
  const first    = new Date(y, m, 1);
  const last     = new Date(y, m + 1, 0);
  const startDay = first.getDay();
  const cells    = [];
  for (let i = 0; i < startDay; i++) {
    cells.push({ date: new Date(y, m, -(startDay - 1 - i)), outside: true });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ date: new Date(y, m, d), outside: false });
  }
  while (cells.length < 42) {
    cells.push({ date: new Date(y, m + 1, cells.length - startDay - last.getDate() + 1), outside: true });
  }
  return cells;
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────
function AddEventModal({ slot, onSave, onClose }) {
  const [title,    setTitle]    = useState('');
  const [color,    setColor]    = useState('indigo');
  const [duration, setDuration] = useState(60);

  const save = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), color, durationMin: duration, dateStr: slot.dateStr, startMin: slot.startMin });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-[380px] max-w-[90vw]" style={{ animation: 'viewFadeIn 0.18s ease' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">New Event</h3>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <div className="space-y-4">
          <input
            autoFocus
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            placeholder="Event title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Duration</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(d => (
                <button
                  key={d}
                  className={'flex-1 py-2 rounded-xl text-xs font-bold border transition ' + (duration === d ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:border-primary/40')}
                  onClick={() => setDuration(d)}
                >{d < 60 ? d + 'm' : (d / 60) + 'h'}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Color</label>
            <div className="flex gap-2">
              {Object.entries(COLOR_MAP).map(([k, v]) => (
                <button
                  key={k}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', background: v.border, border: `3px solid ${color === k ? v.text : 'transparent'}`, transition: 'border 0.15s' }}
                  onClick={() => setColor(k)}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400">{slot.dateStr} · {formatTimeRange(slot.startMin, slot.startMin + duration)}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={save}    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dim transition">Add Event</button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Event Card ──────────────────────────────────────────────────────
function CalEvent({ evt, onDragStart, onResizeStart, isDragging, onDelete }) {
  const c = COLOR_MAP[evt.color] || COLOR_MAP.indigo;
  return (
    <div
      className="cal-event group"
      style={{
        top:         (evt.startMin / 60) * HOUR_HEIGHT + 'px',
        height:      Math.max(20, (evt.durationMin / 60) * HOUR_HEIGHT) + 'px',
        background:  c.bg,
        color:       c.text,
        borderLeft:  `3px solid ${c.border}`,
        opacity:     isDragging ? 0.35 : 1,
        borderStyle: isDragging ? 'dashed' : 'solid',
      }}
      draggable="true"
      onDragStart={e => onDragStart(e, evt)}
    >
      {/* Delete button — visible on hover */}
      <button
        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 hover:bg-red-400/90 transition-opacity flex items-center justify-center z-10"
        onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete(evt.id); }}
        title="Delete event"
        aria-label={`Delete ${evt.title}`}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '10px', lineHeight: 1 }}>close</span>
      </button>

      <div className="cal-event-title">{evt.title}</div>
      <div className="cal-event-time">{formatTimeRange(evt.startMin, evt.startMin + evt.durationMin)}</div>
      {evt.role && <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>{evt.role}</div>}
      <div className="cal-resize-handle" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, evt); }} />
    </div>
  );
}

// ─── Day Column ───────────────────────────────────────────────────────────────
function DayColumn({ date, events, onDrop, onColumnClick, draggingId, onEventDragStart, onResizeStart, onDelete }) {
  const dateStr = toDateStr(date);
  const colRef  = useRef(null);
  const [hoverSlot,  setHoverSlot]  = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id:   `cal-day-${dateStr}`,
    data: { type: 'calendar-day', dateStr, getColEl: () => colRef.current },
  });

  const setRefs = el => { colRef.current = el; setDropRef(el); };

  const snap = clientY => {
    const rect = colRef.current.getBoundingClientRect();
    const px   = Math.round((clientY - rect.top) / SNAP_PX) * SNAP_PX;
    return Math.max(0, Math.min(23 * 60, Math.round(px / HOUR_HEIGHT * 60)));
  };

  return (
    <div
      ref={setRefs}
      className={'cal-day-col' + (isDragOver || isOver ? ' drop-target-active' : '')}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
        const sm = snap(e.clientY);
        setHoverSlot({ sm, top: (sm / 60) * HOUR_HEIGHT });
      }}
      onDragLeave={() => { setIsDragOver(false); setHoverSlot(null); }}
      onDrop={e => {
        e.preventDefault();
        setIsDragOver(false);
        setHoverSlot(null);
        const sm = snap(e.clientY);

        const taskData = e.dataTransfer.getData('application/salam-task');
        if (taskData) {
          try { onDrop({ type: 'new-task', task: JSON.parse(taskData), dateStr, startMin: sm }); } catch {}
          return;
        }

        const id = e.dataTransfer.getData('text/plain');
        if (id) onDrop({ type: 'move-event', evtId: id, dateStr, startMin: sm });
      }}
      onClick={e => {
        if (e.target.closest('.cal-event')) return;
        const rect = colRef.current.getBoundingClientRect();
        const sm   = Math.round(Math.round((e.clientY - rect.top) / SNAP_PX) * SNAP_PX / HOUR_HEIGHT * 60);
        onColumnClick(dateStr, sm);
      }}
    >
      {hoverSlot && <div className="cal-hover-slot" style={{ top: hoverSlot.top + 'px', height: HOUR_HEIGHT + 'px', display: 'block' }} />}
      {events.map(evt => (
        <CalEvent
          key={evt.id}
          evt={evt}
          isDragging={draggingId === evt.id}
          onDragStart={onEventDragStart}
          onResizeStart={onResizeStart}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ─── Current Time Indicator ───────────────────────────────────────────────────
function CurrentTimeIndicator() {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const upd = () => setTop((new Date().getHours() * 60 + new Date().getMinutes()) / 60 * HOUR_HEIGHT);
    upd();
    const t = setInterval(upd, 60000);
    return () => clearInterval(t);
  }, []);
  return <div className="cal-time-now" style={{ top: top + 'px', position: 'absolute', left: 0, right: 0, zIndex: 9, pointerEvents: 'none' }} />;
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({ baseDate, events, onCellClick }) {
  const cells    = getMonthDates(baseDate);
  const todayStr = toDateStr(new Date());

  // Index events by dateStr for O(1) lookup — no more broken weekDates mapping
  const byDate = {};
  events.forEach(evt => {
    if (!byDate[evt.dateStr]) byDate[evt.dateStr] = [];
    byDate[evt.dateStr].push(evt);
  });

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden">
        {DAYS.map(d => (
          <div key={d} className="bg-white py-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d}</span>
          </div>
        ))}
        {cells.map((cell, i) => {
          const ds        = toDateStr(cell.date);
          const isToday   = ds === todayStr;
          const dayEvents = byDate[ds] || [];
          return (
            <div
              key={i}
              className={`bg-white min-h-[100px] p-2 cursor-pointer hover:bg-primary/[0.02] transition-colors ${cell.outside ? 'opacity-40' : ''}`}
              onClick={() => onCellClick(cell.date)}
            >
              <div className="flex justify-end mb-1">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-primary text-white' : 'text-slate-600'}`}>
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(evt => {
                  const c = COLOR_MAP[evt.color] || COLOR_MAP.indigo;
                  return (
                    <div key={evt.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate" style={{ background: c.bg, color: c.text, borderLeft: `2px solid ${c.border}` }}>
                      {evt.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && <span className="text-[9px] font-bold text-slate-400">+{dayEvents.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ dayDate, events, onDrop, onColumnClick, draggingId, onEventDragStart, onResizeStart, onDelete }) {
  const bodyRef = useRef(null);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 8 * HOUR_HEIGHT - 40; }, []);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{DAYS[dayDate.getDay()]}</span>
          <span className={`w-9 h-9 flex items-center justify-center rounded-full text-lg font-bold ${dayDate.toDateString() === new Date().toDateString() ? 'bg-primary text-white' : 'text-slate-700'}`}>
            {dayDate.getDate()}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" ref={bodyRef}>
        <div className="grid" style={{ gridTemplateColumns: '56px 1fr' }}>
          <div>{HOURS.map(h => <div key={h} className="cal-time-label">{h === 0 ? '' : formatHour(h)}</div>)}</div>
          <DayColumn
            date={dayDate}
            events={events}
            draggingId={draggingId}
            onDrop={onDrop}
            onColumnClick={(_, sm) => onColumnClick(toDateStr(dayDate), sm)}
            onEventDragStart={onEventDragStart}
            onResizeStart={onResizeStart}
            onDelete={onDelete}
          />
        </div>
        <CurrentTimeIndicator />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AgenticHubView (Calendar) ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function AgenticHubView() {
  const [baseDate,    setBaseDate]    = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [selectedDay, setSelectedDay] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [viewMode,    setViewMode]    = useState('Week');
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [draggingId,  setDraggingId]  = useState(null);
  const [modal,       setModal]       = useState(null);

  const bodyRef   = useRef(null);
  const resizeRef = useRef(null);
  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 8 * HOUR_HEIGHT - 40; }, []);

  const weekDates  = getWeekDates(baseDate);
  const todayIdx   = weekDates.findIndex(d => d.toDateString() === new Date().toDateString());

  // ── Compute stable fetch-range keys ──────────────────────────────────────
  const baseDateKey    = `${baseDate.getFullYear()}-${baseDate.getMonth()}`;
  const selectedDayKey = toDateStr(selectedDay);
  const weekStartKey   = toDateStr(weekDates[0]);
  const weekEndKey     = toDateStr(weekDates[6]);

  const { startKey, endKey } = useMemo(() => {
    if (viewMode === 'Month') {
      const y = baseDate.getFullYear(), m = baseDate.getMonth();
      // Fetch the full visible grid (includes preceding/trailing cells from adjacent months)
      const firstDay = new Date(y, m, 1);
      const sd = new Date(firstDay);
      sd.setDate(firstDay.getDate() - firstDay.getDay()); // back to Sunday
      const lastDay = new Date(y, m + 1, 0);
      const ed = new Date(lastDay);
      ed.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // forward to Saturday
      return {
        startKey: `${toDateStr(sd)}T00:00:00.000Z`,
        endKey:   `${toDateStr(ed)}T23:59:59.999Z`,
      };
    }
    if (viewMode === 'Day') {
      return {
        startKey: `${selectedDayKey}T00:00:00.000Z`,
        endKey:   `${selectedDayKey}T23:59:59.999Z`,
      };
    }
    return {
      startKey: `${weekStartKey}T00:00:00.000Z`,
      endKey:   `${weekEndKey}T23:59:59.999Z`,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, baseDateKey, selectedDayKey, weekStartKey, weekEndKey]);

  // ── Fetch events from Supabase ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/calendar?start=${encodeURIComponent(startKey)}&end=${encodeURIComponent(endKey)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(({ events: rows }) => {
        if (!cancelled) setEvents((rows || []).map(dbToLocal));
      })
      .catch(err => {
        console.error('[calendar] fetch error:', err.message);
        if (!cancelled) setEvents([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [startKey, endKey]);

  // ── DB persistence helpers ────────────────────────────────────────────────
  const persistCreate = useCallback(async (tempId, payload) => {
    try {
      const res = await fetch('/api/calendar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { event } = await res.json();
      // Replace optimistic temp-ID with the real UUID from the DB
      setEvents(prev => prev.map(e => e.id === tempId ? dbToLocal(event) : e));
    } catch (err) {
      console.error('[calendar] create failed:', err.message);
      setEvents(prev => prev.filter(e => e.id !== tempId));
    }
  }, []);

  const persistUpdate = useCallback((id, payload) => {
    if (id.startsWith('temp-')) return; // not yet in DB
    fetch(`/api/calendar/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }).catch(err => console.error('[calendar] update failed:', err.message));
  }, []);

  const handleDeleteEvent = useCallback((evtId) => {
    setEvents(prev => prev.filter(e => e.id !== evtId));
    if (!evtId.startsWith('temp-')) {
      fetch(`/api/calendar/${evtId}`, { method: 'DELETE' })
        .catch(err => console.error('[calendar] delete failed:', err.message));
    }
  }, []);

  // ── Drag: native HTML5 ────────────────────────────────────────────────────
  const onEventDragStart = (e, evt) => {
    e.dataTransfer.setData('text/plain', evt.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(evt.id);
  };

  const handleDrop = useCallback(({ type, task, evtId, dateStr, startMin }) => {
    if (type === 'move-event') {
      // Read current event from ref (avoids stale closure)
      const existing = eventsRef.current.find(e => e.id === evtId);
      if (existing) {
        const updated = { ...existing, dateStr, startMin };
        setEvents(prev => prev.map(e => e.id !== evtId ? e : updated));
        persistUpdate(evtId, localToTimestamps(updated));
      }
      setDraggingId(null);
    } else if (type === 'new-task') {
      const color  = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
      const tempId = `temp-dnd-${Date.now()}`;
      const newEvt = { id: tempId, dateStr, startMin, durationMin: 60, title: task.title || 'New Task', color, role: task.energy || '' };
      setEvents(prev => [...prev, newEvt]);
      persistCreate(tempId, { title: newEvt.title, color: newEvt.color, role: newEvt.role, ...localToTimestamps(newEvt) });
    }
  }, [persistCreate, persistUpdate]);

  // ── Resize: native mouse events ───────────────────────────────────────────
  const onResizeStart = (e, evt) => {
    e.preventDefault();
    resizeRef.current = { evtId: evt.id, startY: e.clientY, startDur: evt.durationMin };

    const onMove = ev => {
      const dy = ev.clientY - resizeRef.current.startY;
      const d  = Math.max(SNAP_MINUTES, resizeRef.current.startDur + Math.round(dy / SNAP_PX) * SNAP_MINUTES);
      setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, durationMin: d } : e));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      const final = eventsRef.current.find(e => e.id === evt.id);
      if (final) persistUpdate(final.id, localToTimestamps(final));
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  };

  // ── Add event (from modal) ────────────────────────────────────────────────
  const handleAddEvent = useCallback(({ title, color, durationMin, dateStr, startMin }) => {
    const tempId = `temp-${Date.now()}`;
    const newEvt = { id: tempId, dateStr, startMin, durationMin, title, color, role: '' };
    setEvents(prev => [...prev, newEvt]);
    persistCreate(tempId, { title, color, role: '', ...localToTimestamps(newEvt) });
  }, [persistCreate]);

  // ── dnd-kit bridge (for sidebar → calendar drops) ─────────────────────────
  const handleCalDrop = useCallback((event) => {
    const { active, over } = event;
    if (!over || over.data.current?.type !== 'calendar-day') return;

    const dateStr = over.data.current.dateStr;
    let startMin  = 9 * 60;

    const colEl = over.data.current?.getColEl?.();
    let clientY;
    if (event.activatorEvent && event.delta) {
      clientY = event.activatorEvent.clientY + event.delta.y;
    } else if (event.activatorEvent) {
      clientY = event.activatorEvent.clientY;
    }
    if (colEl && clientY != null) {
      const rect     = colEl.getBoundingClientRect();
      const scroll   = (colEl.closest('#cal-body') || colEl.parentElement)?.scrollTop ?? 0;
      const relY     = clientY - rect.top + scroll;
      const snappedPx = Math.round(relY / SNAP_PX) * SNAP_PX;
      startMin = Math.max(0, Math.min(23 * 60, Math.round(snappedPx / HOUR_HEIGHT * 60)));
    }

    const color  = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    const tempId = `temp-caldrop-${Date.now()}`;
    const newEvt = { id: tempId, dateStr, startMin, durationMin: 60, title: active.data.current?.title ?? 'New Task', color, role: active.data.current?.tag ?? '' };
    setEvents(prev => [...prev, newEvt]);
    persistCreate(tempId, { title: newEvt.title, color: newEvt.color, role: newEvt.role, ...localToTimestamps(newEvt) });
  }, [persistCreate]);

  useEffect(() => {
    window.__calendarDragEnd = handleCalDrop;
    return () => { delete window.__calendarDragEnd; };
  }, [handleCalDrop]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigatePrev = () => {
    if (viewMode === 'Month') {
      const d = new Date(baseDate); d.setMonth(d.getMonth() - 1); setBaseDate(d);
    } else if (viewMode === 'Day') {
      const d = new Date(selectedDay); d.setDate(d.getDate() - 1); d.setHours(0,0,0,0); setSelectedDay(d); setBaseDate(d);
    } else {
      const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d);
    }
  };
  const navigateNext = () => {
    if (viewMode === 'Month') {
      const d = new Date(baseDate); d.setMonth(d.getMonth() + 1); setBaseDate(d);
    } else if (viewMode === 'Day') {
      const d = new Date(selectedDay); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); setSelectedDay(d); setBaseDate(d);
    } else {
      const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d);
    }
  };
  const goToday = () => {
    const now = new Date(); now.setHours(0,0,0,0); setBaseDate(now); setSelectedDay(now);
  };
  const handleMonthCellClick = (date) => { setSelectedDay(date); setBaseDate(date); setViewMode('Day'); };

  // ── Header label ──────────────────────────────────────────────────────────
  let headerLabel = '';
  if (viewMode === 'Month') {
    headerLabel = `${MONTHS[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
  } else if (viewMode === 'Day') {
    headerLabel = `${MONTHS[selectedDay.getMonth()]} ${selectedDay.getDate()}, ${selectedDay.getFullYear()}`;
  } else {
    const s = weekDates[0], en = weekDates[6];
    headerLabel = s.getMonth() === en.getMonth()
      ? `${MONTHS[s.getMonth()]} ${s.getFullYear()}`
      : `${MONTHS[s.getMonth()]} – ${MONTHS[en.getMonth()]} ${en.getFullYear()}`;
  }

  const addBtnDateStr = toDateStr(weekDates[todayIdx >= 0 ? todayIdx : 0]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div id="cal-container" onDragEnd={() => setDraggingId(null)}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div id="cal-header">
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500" onClick={navigatePrev}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500" onClick={navigateNext}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
          <button className="px-3 py-1.5 rounded-xl text-primary text-xs font-bold hover:bg-primary/15 transition" style={{ background: 'rgba(0,83,220,0.08)' }} onClick={goToday}>Today</button>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{headerLabel}</h2>
          {loading && (
            <span className="material-symbols-outlined text-primary/50" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>
              autorenew
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['Day', 'Week', 'Month'].map(v => (
              <button
                key={v}
                className={'px-3 py-1 rounded-lg text-xs font-bold transition ' + (viewMode === v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800')}
                onClick={() => setViewMode(v)}
              >{v}</button>
            ))}
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary-dim transition"
            onClick={() => setModal({ dateStr: addBtnDateStr, startMin: 9 * 60 })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>Add Event
          </button>
        </div>
      </div>

      {/* ── View Body ────────────────────────────────────────────────────────── */}
      {viewMode === 'Month' ? (
        <MonthView baseDate={baseDate} events={events} onCellClick={handleMonthCellClick} />

      ) : viewMode === 'Day' ? (
        <DayView
          dayDate={selectedDay}
          events={events.filter(e => e.dateStr === toDateStr(selectedDay))}
          draggingId={draggingId}
          onDrop={handleDrop}
          onColumnClick={(ds, sm) => setModal({ dateStr: ds, startMin: sm })}
          onEventDragStart={onEventDragStart}
          onResizeStart={onResizeStart}
          onDelete={handleDeleteEvent}
        />

      ) : (
        /* Week View */
        <div id="cal-grid-wrapper">
          <div id="cal-day-headers">
            <div className="cal-day-header-cell" style={{ borderRight: '1px solid #f1f5f9' }} />
            {weekDates.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="cal-day-header-cell">
                  <div className="cal-day-name">{DAYS[d.getDay()]}</div>
                  <div><span className={'cal-day-num' + (isToday ? ' today' : '')}>{d.getDate()}</span></div>
                </div>
              );
            })}
          </div>

          <div id="cal-body" ref={bodyRef}>
            <div id="cal-time-grid">
              <div>{HOURS.map(h => <div key={h} className="cal-time-label">{h === 0 ? '' : formatHour(h)}</div>)}</div>
              {weekDates.map((d, dayIdx) => (
                <DayColumn
                  key={dayIdx}
                  date={d}
                  events={events.filter(e => e.dateStr === toDateStr(d))}
                  draggingId={draggingId}
                  onDrop={handleDrop}
                  onColumnClick={(ds, sm) => setModal({ dateStr: ds, startMin: sm })}
                  onEventDragStart={onEventDragStart}
                  onResizeStart={onResizeStart}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>
            <CurrentTimeIndicator />
          </div>
        </div>
      )}

      {modal && <AddEventModal slot={modal} onSave={handleAddEvent} onClose={() => setModal(null)} />}
    </div>
  );
}
