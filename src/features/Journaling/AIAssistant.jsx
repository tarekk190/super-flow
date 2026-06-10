"use client";

import { useState, useTransition, useCallback, useRef, useEffect, useMemo } from "react";
import { embedJournalEntry, searchJournal } from "@/app/actions/ai-actions";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

const MOOD_OPTIONS = ["😄", "😊", "😐", "😔", "😢", "😡", "🤩", "😴"];

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md max-w-sm transition-all ${
        isError
          ? "bg-error-container/95 border-error/20 text-on-error-container"
          : "bg-secondary-container/95 border-secondary/20 text-on-secondary-container"
      }`}
    >
      <span
        className="material-symbols-outlined text-xl mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {isError ? "error" : "check_circle"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

// ─── Similarity Score Badge ───────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 85 ? "#006d4a" : pct >= 70 ? "#865400" : "#596063";
  const bg =
    pct >= 85 ? "rgba(0,109,74,0.08)" : pct >= 70 ? "rgba(134,84,0,0.08)" : "rgba(89,96,99,0.08)";
  return (
    <span
      className="text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0"
      style={{ color, background: bg }}
      aria-label={`${pct}% semantic match`}
    >
      {pct}% Match
    </span>
  );
}

// ─── Search Result Card ───────────────────────────────────────────────────────
function MemoryCard({ match }) {
  const date = match.created_at
    ? new Date(match.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const snippet =
    match.content.length > 280
      ? match.content.slice(0, 280).trimEnd() + "…"
      : match.content;

  return (
    <article className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}
          >
            history_edu
          </span>
          {date && (
            <time className="text-xs text-on-surface-variant font-medium" dateTime={match.created_at}>
              {date}
            </time>
          )}
        </div>
        <ScoreBadge score={match.similarity_score} />
      </div>
      <p className="text-sm text-on-surface leading-relaxed font-serif">{snippet}</p>
    </article>
  );
}

// ─── Search Loading Skeleton ──────────────────────────────────────────────────
function SearchSkeleton() {
  return (
    <div className="space-y-3 animate-pulse mt-4" aria-busy="true" aria-label="Searching memories…">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20">
          <div className="flex justify-between mb-3">
            <div className="h-3 w-24 bg-surface-container-high rounded" />
            <div className="h-5 w-20 bg-surface-container-high rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-surface-container rounded" />
            <div className="h-3 w-4/5 bg-surface-container rounded" />
            <div className="h-3 w-2/3 bg-surface-container rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mood Picker ──────────────────────────────────────────────────────────────
function MoodPicker({ selected, onChange }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/10 bg-surface-container/20">
      <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
        Today's mood
      </span>
      <div className="flex gap-1 flex-wrap">
        {MOOD_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all duration-150 ${
              selected === emoji
                ? "bg-secondary/15 scale-110 ring-2 ring-secondary/40"
                : "hover:bg-surface-container hover:scale-105 opacity-60 hover:opacity-100"
            }`}
            aria-label={`Mood ${emoji}`}
            aria-pressed={selected === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────
function EntryCard({ entry }) {
  const d = new Date(entry.created_at);
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <article className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 hover:border-secondary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{entry.mood ?? "😊"}</span>
          <time
            className="text-xs text-on-surface-variant font-medium"
            dateTime={entry.created_at}
          >
            {datePart} · {timePart}
          </time>
        </div>
      </div>
      <p className="text-sm text-on-surface leading-relaxed font-serif whitespace-pre-wrap">
        {entry.text}
      </p>
    </article>
  );
}

// ─── Entries Loading Skeleton ─────────────────────────────────────────────────
function EntriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container-high" />
            <div className="h-3 w-40 bg-surface-container-high rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-surface-container rounded" />
            <div className="h-3 w-4/5 bg-surface-container rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  return (
    <ErrorBoundary>
      <AIAssistantInner />
    </ErrorBoundary>
  );
}

function AIAssistantInner() {
  const { user } = useUser();

  // ── Write pane state ────────────────────────────────────────────
  const [journalContent, setJournalContent] = useState("");
  const [selectedMood, setSelectedMood]     = useState("😊");
  const [isSaving, startSaveTransition]     = useTransition();
  const textareaRef                         = useRef(null);

  // ── Recall pane state ───────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [hasSearched, setHasSearched]       = useState(false);

  // ── Toast state ─────────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  // ── Journal entries state ────────────────────────────────────────
  const [entries, setEntries]               = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError]     = useState(null);
  const [sortOrder, setSortOrder]           = useState("newest");

  const showToast = useCallback((type, title, message = "") => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Fetch entries from Supabase on mount ────────────────────────
  useEffect(() => {
    if (!user) {
      setEntriesLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("journal_entries")
      .select("id, text, mood, created_at")
      .eq("user_id", user.id)
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error("Journal fetch error:", fetchError);
          setEntriesError("Failed to load entries.");
        } else {
          setEntries(data ?? []);
        }
        setEntriesLoading(false);
      });
  }, [user]);

  // ── Sorted entries (client-side) ────────────────────────────────
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
  }, [entries, sortOrder]);

  // ── Save handler — saves to Supabase, then tries AI embed ───────
  const handleSave = useCallback(() => {
    const trimmed = journalContent.trim();
    if (!trimmed) return;

    startSaveTransition(async () => {
      try {
        // 1. Save to Supabase (primary persistence)
        let savedEntry = null;
        if (user) {
          const supabase = createClient();
          const { data, error: dbError } = await supabase
            .from("journal_entries")
            .insert({
              user_id: user.id,
              text:    trimmed,
              mood:    selectedMood,
            })
            .select("id, text, mood, created_at")
            .single();

          if (dbError) {
            console.error("Journal insert error:", dbError);
            showToast("error", "Save Failed", "Could not save your entry to the database.");
            return;
          }
          savedEntry = data;
          setEntries((prev) => [savedEntry, ...prev]);
        }

        // 2. Try AI embed (best-effort — failure doesn't block the user)
        try {
          const result = await embedJournalEntry(trimmed);
          if (result.success) {
            showToast("success", "Entry Saved!", "Saved and embedded into your personal memory.");
          } else {
            showToast("success", "Entry Saved!", "Your reflection has been recorded.");
          }
        } catch {
          showToast("success", "Entry Saved!", "Your reflection has been recorded.");
        }

        setJournalContent("");
        setSelectedMood("😊");
        if (textareaRef.current) textareaRef.current.focus();
      } catch (err) {
        showToast("error", "Save Failed", "An unexpected error occurred.");
      }
    });
  }, [journalContent, selectedMood, user, showToast]);

  // ── Search handler ───────────────────────────────────────────────
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setSearchResults(null);
      setHasSearched(false);

      startSearchTransition(async () => {
        try {
          const result = await searchJournal(trimmed, 3);
          if (!result.success) {
            showToast("error", "Search Failed", result.error || "Could not search your journal.");
            setHasSearched(true);
            return;
          }
          setSearchResults(result.data);
          setHasSearched(true);
        } catch {
          showToast("error", "Connection Error", "Could not reach the AI service.");
          setHasSearched(true);
        }
      });
    },
    [searchQuery, showToast]
  );

  const wordCount  = journalContent.trim().split(/\s+/).filter(Boolean).length;
  const hasMatches = searchResults?.matches?.length > 0;

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">
            Affective Memory — Powered by pgvector
          </span>
          <h1 className="text-4xl font-bold text-on-surface tracking-tight">AI Journal</h1>
          <p className="mt-2 text-on-surface-variant text-sm">
            Write freely. Recall semantically. Your journal learns you.
          </p>
        </div>

        {/* ── Split pane layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT PANE: Write */}
          <section
            aria-label="Write journal entry"
            className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col"
          >
            {/* Pane header */}
            <div className="flex items-center gap-3 px-7 py-5 border-b border-outline-variant/20">
              <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                >
                  edit_note
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">Today's Reflection</h2>
                <p className="text-xs text-on-surface-variant">Write freely — this is your private space.</p>
              </div>
            </div>

            {/* Mood picker */}
            <MoodPicker selected={selectedMood} onChange={setSelectedMood} />

            {/* Textarea */}
            <div className="p-6 flex-1">
              <textarea
                ref={textareaRef}
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder={`How are you feeling today? What challenged you? What are you grateful for?\n\nWrite without judgment — your thoughts will be embedded into your personal memory and can be recalled later through semantic search.`}
                disabled={isSaving}
                aria-label="Journal entry text"
                className="w-full h-64 lg:h-72 bg-transparent border-none resize-none focus:outline-none text-on-surface placeholder-on-surface/25 font-serif text-sm leading-relaxed disabled:opacity-50"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 bg-surface-container/30">
              <div className="flex items-center gap-4">
                <span className="text-xs text-on-surface-variant">
                  {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""}` : "Start writing…"}
                </span>
                {journalContent.length > 0 && (
                  <button
                    onClick={() => setJournalContent("")}
                    className="text-xs text-on-surface-variant hover:text-error transition-colors"
                    aria-label="Clear journal entry"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || !journalContent.trim()}
                aria-busy={isSaving}
                className="flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      memory
                    </span>
                    Save & Embed
                  </>
                )}
              </button>
            </div>
          </section>

          {/* RIGHT PANE: Recall */}
          <section
            aria-label="Search past journal entries"
            className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col"
          >
            {/* Pane header */}
            <div className="flex items-center gap-3 px-7 py-5 border-b border-outline-variant/20">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">Ask Your Past Self</h2>
                <p className="text-xs text-on-surface-variant">Semantic search across all your memories.</p>
              </div>
            </div>

            {/* Search form */}
            <div className="p-6">
              <form onSubmit={handleSearch} className="flex gap-2" role="search">
                <div className="relative flex-1">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant"
                    style={{ fontSize: "18px" }}
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="When did I feel most confident?"
                    disabled={isSearching}
                    aria-label="Search your journal memories"
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-xl text-on-surface placeholder-on-surface/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  aria-busy={isSearching}
                  className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-3 rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 whitespace-nowrap"
                >
                  {isSearching ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      manage_search
                    </span>
                  )}
                  Recall
                </button>
              </form>

              <p className="text-xs text-on-surface-variant/60 mt-2 pl-1">
                Powered by cosine similarity — finds what you <em>meant</em>, not just what you typed.
              </p>
            </div>

            {/* Results area */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "420px" }}>
              {isSearching && <SearchSkeleton />}

              {!isSearching && hasMatches && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
                    {searchResults.total_matches} memories found for "{searchResults.query}"
                  </p>
                  {searchResults.matches.map((match) => (
                    <MemoryCard key={match.entry_id} match={match} />
                  ))}
                </div>
              )}

              {!isSearching && hasSearched && !hasMatches && (
                <div className="py-12 text-center">
                  <span
                    className="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-3"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    search_off
                  </span>
                  <p className="text-sm font-semibold text-on-surface-variant">No memories found</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    Try a different query or write more journal entries first.
                  </p>
                </div>
              )}

              {!isSearching && !hasSearched && (
                <div className="py-12 text-center">
                  <span
                    className="material-symbols-outlined text-5xl text-on-surface-variant/20 block mb-3"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    history_edu
                  </span>
                  <p className="text-sm text-on-surface-variant/50">
                    Ask a question to surface relevant past reflections.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Journal Entries Section ── */}
        <section className="mt-10" aria-label="Past journal entries">

          {/* Section header + sort controls */}
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Past Reflections</h2>
              {!entriesLoading && entries.length > 0 && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </p>
              )}
            </div>

            {/* Sort toggle */}
            {!entriesLoading && entries.length > 1 && (
              <div
                className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-outline-variant/20"
                role="group"
                aria-label="Sort entries"
              >
                <button
                  onClick={() => setSortOrder("newest")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortOrder === "newest"
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    arrow_downward
                  </span>
                  Newest
                </button>
                <button
                  onClick={() => setSortOrder("oldest")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortOrder === "oldest"
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    arrow_upward
                  </span>
                  Oldest
                </button>
              </div>
            )}
          </div>

          {/* Error state */}
          {entriesError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4">
              <span className="material-symbols-outlined text-red-500" style={{ fontSize: "18px" }}>
                error
              </span>
              {entriesError}
            </div>
          )}

          {/* Loading skeleton */}
          {entriesLoading && <EntriesSkeleton />}

          {/* Empty state */}
          {!entriesLoading && entries.length === 0 && !entriesError && (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
              <span
                className="material-symbols-outlined text-on-surface-variant/20 mb-4"
                style={{ fontSize: "56px", fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
              <p className="text-on-surface-variant font-semibold">No entries yet</p>
              <p className="text-sm text-on-surface-variant/60 mt-1">
                Write your first reflection above and hit Save.
              </p>
            </div>
          )}

          {/* Entry cards grid */}
          {!entriesLoading && sortedEntries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}
