"use client";

import { useState, useEffect } from "react";

const initialHabits = [
  {
    id: "1",
    name: "Morning Meditation",
    category: "Mindfulness",
    streak: 12,
    completedToday: true,
    history: [true, true, false, true, true, true, true],
    icon: "self_improvement",
    color: "#4f46e5",
  },
  {
    id: "2",
    name: "Deep Work (2 hrs)",
    category: "Productivity",
    streak: 5,
    completedToday: false,
    history: [true, false, true, true, true, true, false],
    icon: "psychology",
    color: "#059669",
  },
  {
    id: "3",
    name: "Read 20 Pages",
    category: "Learning",
    streak: 21,
    completedToday: true,
    history: [true, true, true, true, true, true, true],
    icon: "menu_book",
    color: "#d97706",
  },
];

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Returns array of 7 Date objects: [6 days ago, ..., today]
// history[0] = oldest, history[6] = today
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

function calcStreak(history) {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]) streak++;
    else break;
  }
  return streak;
}

function HabitCard({ habit, onToggle, days }) {
  return (
    <div className="group flex flex-col p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {habit.icon}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">{habit.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70" style={{ color: habit.color }}>
              {habit.category}
            </p>
          </div>
        </div>
        <button
          onClick={() => onToggle(habit.id)}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
            habit.completedToday
              ? "bg-primary border-primary text-on-primary shadow-md"
              : "border-outline-variant hover:border-primary/50 text-transparent hover:text-primary/20"
          }`}
          aria-label={habit.completedToday ? "Mark incomplete" : "Mark complete"}
        >
          <span className="material-symbols-outlined text-sm font-bold">check</span>
        </button>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-tertiary" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>
            local_fire_department
          </span>
          <span className="text-sm font-bold text-on-surface-variant">
            {habit.streak} Day Streak
          </span>
        </div>
        <div className="flex gap-1">
          {habit.history.map((completed, idx) => {
            const date = days[idx];
            const label = date
              ? `${DAY_ABBR[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}: ${completed ? "Completed" : "Missed"}`
              : "";
            return (
              <div
                key={idx}
                className={`w-3 h-8 rounded-full transition-all duration-300 ${completed ? "opacity-100" : "opacity-20"}`}
                style={{ backgroundColor: habit.color }}
                title={label}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HabitsView() {
  const [habits, setHabits] = useState(initialHabits);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const last7Days = getLast7Days();

  // Load persisted state from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("speroflow_habits");
      if (stored) setHabits(JSON.parse(stored));
    } catch {}
    setStorageLoaded(true);
  }, []);

  // Persist to localStorage whenever habits change (skip the initial pre-load render)
  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem("speroflow_habits", JSON.stringify(habits));
  }, [habits, storageLoaded]);

  // Toggle today (index 6) — used by the HabitCard checkmark button
  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const newHistory = [...h.history];
        newHistory[6] = !newHistory[6];
        return { ...h, history: newHistory, completedToday: newHistory[6], streak: calcStreak(newHistory) };
      })
    );
  };

  // Toggle any specific day — used by matrix cells
  const toggleHabitDay = (id, dayIdx) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const newHistory = [...h.history];
        newHistory[dayIdx] = !newHistory[dayIdx];
        return { ...h, history: newHistory, completedToday: newHistory[6], streak: calcStreak(newHistory) };
      })
    );
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const progress = Math.round((completedCount / habits.length) * 100) || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
            Consistency Engine
          </span>
          <h1 className="text-4xl font-bold text-on-surface tracking-tight">Daily Habits</h1>
          <p className="mt-2 text-on-surface-variant text-sm max-w-lg leading-relaxed">
            Track your daily routines, maintain streaks, and build the foundation for long-term productivity.
          </p>
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-5 bg-surface-container-low px-6 py-4 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-surface-container-high" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                className="stroke-primary transition-all duration-1000 ease-out"
                strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - progress}
              />
            </svg>
            <div className="absolute text-sm font-bold text-on-surface">{progress}%</div>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">Today's Progress</h3>
            <p className="text-xs text-on-surface-variant font-medium">
              {completedCount} of {habits.length} habits completed
            </p>
          </div>
        </div>
      </div>

      {/* Habit cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} days={last7Days} />
        ))}

        {/* Add Habit CTA */}
        <button className="group flex flex-col items-center justify-center p-5 bg-surface-container-lowest/50 border-2 border-dashed border-outline-variant/50 rounded-2xl hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-300 min-h-[160px]">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary/10 transition-transform">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">add</span>
          </div>
          <span className="font-bold text-sm text-on-surface-variant group-hover:text-primary">Add New Habit</span>
        </button>
      </div>

      {/* 7-Day Consistency Matrix */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-on-surface mb-1">7-Day Consistency Matrix</h3>
        <p className="text-xs text-on-surface-variant/60 mb-6">Click any cell to toggle completion for that day.</p>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[600px]">

            {/* Column headers — real day abbreviation + date, today highlighted */}
            <div className="grid grid-cols-8 gap-4 mb-4">
              <div className="col-span-1" />
              {last7Days.map((date, idx) => {
                const isToday = idx === 6;
                return (
                  <div key={idx} className="flex flex-col items-center gap-0.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-primary" : "text-on-surface-variant"}`}>
                      {DAY_ABBR[date.getDay()]}
                    </span>
                    <span className={`text-[10px] font-semibold tabular-nums ${isToday ? "text-primary/70" : "text-on-surface-variant/50"}`}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />}
                  </div>
                );
              })}
            </div>

            {/* Habit rows */}
            <div className="space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="grid grid-cols-8 gap-4 items-center">
                  <div className="col-span-1 text-sm font-semibold text-on-surface truncate pr-4" title={habit.name}>
                    {habit.name}
                  </div>
                  {habit.history.map((completed, idx) => {
                    const date = last7Days[idx];
                    const isToday = idx === 6;
                    return (
                      <div key={idx} className="flex justify-center">
                        <button
                          onClick={() => toggleHabitDay(habit.id, idx)}
                          aria-label={`${completed ? "Unmark" : "Mark"} ${habit.name} complete for ${DAY_ABBR[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`}
                          aria-pressed={completed}
                          title={`${DAY_ABBR[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1} — ${completed ? "Completed ✓" : "Not done"}`}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                            hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                            ${completed
                              ? "shadow-md"
                              : "bg-surface-container-high opacity-40 hover:opacity-70"
                            }`}
                          style={{
                            backgroundColor: completed ? habit.color : undefined,
                            outline: isToday ? `2px solid ${habit.color}60` : undefined,
                            outlineOffset: isToday ? "2px" : undefined,
                          }}
                        >
                          {completed && (
                            <span
                              className="material-symbols-outlined text-white text-sm"
                              style={{ fontVariationSettings: "'FILL' 1, 'wght' 700", fontSize: "16px" }}
                            >
                              check
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
