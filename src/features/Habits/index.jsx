"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import AddHabitModal from "./components/AddHabitModal";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCY_CONFIG = {
  daily:  { color: "#4f46e5", icon: "repeat" },
  weekly: { color: "#059669", icon: "calendar_month" },
};

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

function normalizeHabit(row) {
  const history = Array.isArray(row.history) ? row.history : Array(7).fill(false);
  const cfg = FREQUENCY_CONFIG[row.frequency] ?? FREQUENCY_CONFIG.daily;
  return {
    id: row.id,
    name: row.name,
    category: row.frequency ?? "daily",
    frequency: row.frequency ?? "daily",
    description: row.description ?? "",
    streak: calcStreak(history),
    completedToday: history[6] ?? false,
    history,
    icon: cfg.icon,
    color: cfg.color,
  };
}

// ─── HabitCard ──────────────────────────────────────────────────────────────

function HabitCard({ habit, onToggle, onRemove, days }) {
  return (
    <div className="group flex flex-col p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {habit.icon}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">{habit.name}</h3>
            <p
              className="text-xs font-semibold uppercase tracking-wider opacity-70"
              style={{ color: habit.color }}
            >
              {habit.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRemove(habit.id)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-transparent group-hover:text-on-surface-variant/40 hover:!text-red-400 hover:bg-red-50 transition-all duration-200"
            aria-label="Remove habit"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
          </button>
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
      </div>

      {habit.description && (
        <p className="text-xs text-on-surface-variant/70 mb-3 leading-relaxed line-clamp-2">
          {habit.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-tertiary"
            style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}
          >
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

// ─── HabitsView ──────────────────────────────────────────────────────────────

export default function HabitsView() {
  const { user, loading: userLoading } = useUser();
  const [habits, setHabits]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [adding, setAdding]           = useState(false);

  const last7Days = getLast7Days();

  // ── Fetch habits from Supabase on mount (waits for auth to resolve) ──────
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    setLoading(true);
    setError(null);

    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error("Habits fetch error:", fetchError);
          setError("Failed to load habits. Please refresh the page.");
        } else {
          setHabits((data ?? []).map(normalizeHabit));
        }
        setLoading(false);
      });
  }, [user, userLoading]);

  // ── Persist history change to Supabase (optimistic UI — fire and forget) ─
  const persistHistory = useCallback(async (id, history) => {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("habits")
      .update({ history })
      .eq("id", id);
    if (updateError) console.error("Habit update error:", updateError);
  }, []);

  // ── Toggle today (index 6) ───────────────────────────────────────────────
  const toggleHabit = useCallback((id) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const newHistory = [...h.history];
        newHistory[6] = !newHistory[6];
        persistHistory(id, newHistory);
        return { ...h, history: newHistory, completedToday: newHistory[6], streak: calcStreak(newHistory) };
      })
    );
  }, [persistHistory]);

  // ── Toggle any specific day ──────────────────────────────────────────────
  const toggleHabitDay = useCallback((id, dayIdx) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const newHistory = [...h.history];
        newHistory[dayIdx] = !newHistory[dayIdx];
        persistHistory(id, newHistory);
        return { ...h, history: newHistory, completedToday: newHistory[6], streak: calcStreak(newHistory) };
      })
    );
  }, [persistHistory]);

  // ── Remove habit from Supabase ──────────────────────────────────────────
  const removeHabit = useCallback(async (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("habits")
      .delete()
      .eq("id", id);
    if (deleteError) {
      console.error("Habit delete error:", deleteError);
      setError("Failed to remove habit.");
    }
  }, []);

  // ── Insert new habit into Supabase ───────────────────────────────────────
  const addHabit = async ({ name, frequency, description }) => {
    if (!user) return;
    setAdding(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("habits")
      .insert({
        user_id:     user.id,
        name,
        frequency,
        description: description || null,
        history:     Array(7).fill(false),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Habit insert error:", insertError);
      setError("Failed to add habit. Please try again.");
    } else {
      setHabits((prev) => [...prev, normalizeHabit(data)]);
      setShowModal(false);
    }
    setAdding(false);
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const progress       = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────

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
              {loading ? "Loading…" : `${completedCount} of ${habits.length} habits completed`}
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-6">
          <span className="material-symbols-outlined text-red-500" style={{ fontSize: "18px" }}>error</span>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {(loading || userLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-surface-container-low border border-outline-variant/20 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Habit cards grid */}
      {!loading && !userLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onRemove={removeHabit} days={last7Days} />
          ))}

          {/* Add New Habit CTA */}
          <button
            onClick={() => setShowModal(true)}
            className="group flex flex-col items-center justify-center p-5 bg-surface-container-lowest/50 border-2 border-dashed border-outline-variant/50 rounded-2xl hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-300 min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary/10 transition-transform">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">
                add
              </span>
            </div>
            <span className="font-bold text-sm text-on-surface-variant group-hover:text-primary">
              Add New Habit
            </span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !userLoading && habits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span
            className="material-symbols-outlined text-on-surface-variant/30 mb-4"
            style={{ fontSize: "64px", fontVariationSettings: "'FILL' 1" }}
          >
            rebase_edit
          </span>
          <p className="text-on-surface-variant font-semibold">No habits yet</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">
            Click "Add New Habit" above to start building your routine.
          </p>
        </div>
      )}

      {/* 7-Day Consistency Matrix */}
      {!loading && !userLoading && habits.length > 0 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-1">7-Day Consistency Matrix</h3>
          <p className="text-xs text-on-surface-variant/60 mb-6">
            Click any cell to toggle completion for that day.
          </p>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[600px]">

              {/* Column headers */}
              <div className="grid grid-cols-8 gap-4 mb-4">
                <div className="col-span-1" />
                {last7Days.map((date, idx) => {
                  const isToday = idx === 6;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-0.5">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isToday ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {DAY_ABBR[date.getDay()]}
                      </span>
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${
                          isToday ? "text-primary/70" : "text-on-surface-variant/50"
                        }`}
                      >
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
                    <div
                      className="col-span-1 text-sm font-semibold text-on-surface truncate pr-4"
                      title={habit.name}
                    >
                      {habit.name}
                    </div>
                    {habit.history.map((completed, idx) => {
                      const date    = last7Days[idx];
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
                              ${completed ? "shadow-md" : "bg-surface-container-high opacity-40 hover:opacity-70"}`}
                            style={{
                              backgroundColor: completed ? habit.color : undefined,
                              outline:       isToday ? `2px solid ${habit.color}60` : undefined,
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
      )}

      {/* Add Habit Modal */}
      {showModal && (
        <AddHabitModal
          onClose={() => !adding && setShowModal(false)}
          onAdd={addHabit}
          loading={adding}
        />
      )}
    </div>
  );
}
