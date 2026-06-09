"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getPrerequisitePath } from "@/app/actions/ai-actions";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// ─── Toast Component ────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      role="alert"
      className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all animate-in slide-in-from-top-2 duration-300 max-w-sm ${
        isError
          ? "bg-error-container/95 border-error/20 text-on-error-container"
          : "bg-secondary-container/95 border-secondary/20 text-on-secondary-container"
      }`}
    >
      <span className="material-symbols-outlined text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
        {isError ? "error" : "check_circle"}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function TimelineSkeleton() {
  return (
    <div className="mt-10 space-y-0 animate-pulse" aria-busy="true" aria-label="Generating learning path…">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-5 pb-10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-surface-container-high" />
            {i < 3 && <div className="w-0.5 flex-1 bg-surface-container-high mt-2 min-h-[40px]" />}
          </div>
          <div className="flex-1 pb-2 space-y-2">
            <div className="h-4 w-2/5 bg-surface-container-high rounded-lg" style={{ animationDelay: `${i * 80}ms` }} />
            <div className="h-3 w-4/5 bg-surface-container rounded-lg" />
            <div className="h-3 w-1/3 bg-surface-container rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Single Timeline Step Card ───────────────────────────────────────────────
function TimelineStep({ step, isLast, accentColor }) {
  return (
    <div className="flex gap-5 group">
      {/* Node + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-4 ring-surface z-10 transition-transform group-hover:scale-110 duration-200"
          style={{ background: accentColor }}
        >
          {step.step_number}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-2 min-h-[40px] rounded-full opacity-30"
            style={{ background: accentColor }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 pb-10 group-hover:-translate-y-0.5 transition-transform duration-200"
        style={{ paddingBottom: isLast ? "0" : undefined }}
      >
        <div
          className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-transparent hover:border-primary/10 hover:shadow-md transition-all duration-200"
          style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <h4 className="font-bold text-on-surface text-base leading-snug">{step.topic_name}</h4>
            <span
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              <span className="material-symbols-outlined text-xs" style={{ fontSize: "14px" }}>schedule</span>
              {step.estimated_hours}h
            </span>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Result Panel ───────────────────────────────────────────────────
function LearningTimelinePanel({ timeline }) {
  const ACCENT = "#0053dc";

  return (
    <section
      className="mt-10 bg-surface-container-lowest rounded-3xl shadow-sm p-8 border border-outline-variant/20"
      aria-label="Generated learning timeline"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">
            AI-Generated Prerequisite Path
          </span>
          <h3 className="text-2xl font-bold text-on-surface">{timeline.goal}</h3>
        </div>
        <div className="flex items-center gap-2 bg-surface-container px-5 py-3 rounded-2xl flex-shrink-0">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>
            bolt
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Total Time</p>
            <p className="text-base font-bold text-on-surface">{timeline.total_estimated_hours}h</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-8">
        <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
        <p className="text-sm text-on-surface leading-relaxed">{timeline.summary}</p>
      </div>

      {/* Steps */}
      <div role="list" aria-label="Learning steps">
        {timeline.steps.map((step, idx) => (
          <div key={step.step_number} role="listitem">
            <TimelineStep
              step={step}
              isLast={idx === timeline.steps.length - 1}
              accentColor={ACCENT}
            />
          </div>
        ))}
      </div>

      {/* Accept CTA */}
      <div className="mt-6 pt-6 border-t border-outline-variant/30 flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-on-surface-variant">
          {timeline.steps.length} steps verified from the knowledge graph — no hallucinations.
        </p>
        <button className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20">
          Accept & Populate Matrix
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RoadmapView() {
  return (
    <ErrorBoundary>
      <RoadmapViewInner />
    </ErrorBoundary>
  );
}

function RoadmapViewInner() {
  const searchParams = useSearchParams();
  const initialGoal = searchParams.get("goal") || "";
  const [goalName, setGoalName] = useState(initialGoal);
  const [timeline, setTimeline] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Auto-submit if a goal was passed from the URL
  useEffect(() => {
    if (initialGoal) {
      startTransition(async () => {
        try {
          const result = await getPrerequisitePath(initialGoal);
          if (result.success) {
            setTimeline(result.data);
          }
        } catch {
          // silently fail auto-trigger — user can retry manually
        }
      });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((type, title, message = "") => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = goalName.trim();
      if (!trimmed) return;

      setTimeline(null);

      startTransition(async () => {
        try {
          const result = await getPrerequisitePath(trimmed);
          if (!result.success) {
            showToast("error", "Goal Not Found", result.error || "Topic not found in the knowledge graph.");
            return;
          }
          setTimeline(result.data);
          showToast("success", "Path Generated!", `${result.data.steps.length} prerequisite steps found.`);
        } catch (err) {
          showToast("error", "Connection Error", "Could not reach the AI service. Please try again.");
        }
      });
    },
    [goalName, showToast]
  );

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
            Graph RAG — Powered by Neo4j
          </span>
          <h1 className="text-4xl font-bold text-on-surface tracking-tight">AI Roadmap Generator</h1>
          <p className="mt-2 text-on-surface-variant text-sm leading-relaxed">
            Enter any skill or goal. The AI traverses the knowledge graph to build a mathematically guaranteed,
            hallucination-free prerequisite path — just for you.
          </p>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6"
          aria-label="Goal input form"
        >
          <label htmlFor="goal-input" className="block text-sm font-semibold text-on-surface-variant mb-3">
            What do you want to master?
          </label>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              id="goal-input"
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder='e.g. "AI Agents", "Machine Learning", "Docker"'
              disabled={isPending}
              aria-describedby="goal-hint"
              className="flex-1 bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={isPending || !goalName.trim()}
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-on-primary px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 whitespace-nowrap"
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Traversing Graph…
                </>
              ) : (
                <>
                  Generate AI Path
                  <span className="text-base">🪄</span>
                </>
              )}
            </button>
          </div>
          <p id="goal-hint" className="mt-3 text-xs text-on-surface-variant/70">
            Uses real knowledge-graph traversal — prerequisites are mathematically verified, not guessed.
          </p>
        </form>

        {/* Loading state */}
        {isPending && <TimelineSkeleton />}

        {/* Result */}
        {!isPending && timeline && <LearningTimelinePanel timeline={timeline} />}

        {/* Empty state */}
        {!isPending && !timeline && (
          <div className="mt-10 text-center py-16 opacity-40">
            <span
              className="material-symbols-outlined text-6xl text-on-surface-variant block mb-3"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              account_tree
            </span>
            <p className="text-sm text-on-surface-variant">Your prerequisite timeline will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
}
