"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GOALS = [
  { id: 'goal-ai',       pct: 45, dashOffset: 96,  context: 'Professional', ctxColor: '#2563eb', ctxBg: 'rgba(37,99,235,0.08)',   title: 'Master AI Engineering', desc: 'Transition from full-stack to specialized AI architecture by Q4.', milestone: 'Complete Neural Networks Specialization', accentColor: '#0053dc' },
  { id: 'goal-marathon', pct: 20, dashOffset: 140, context: 'Personal',      ctxColor: '#865400', ctxBg: 'rgba(134,84,0,0.08)',    title: 'Marathon 2024 Prep',     desc: 'Build physical resilience and mental fortitude for the sub-4h mark.', milestone: 'Reach 15km baseline distance',                accentColor: '#865400' },
  { id: 'goal-cabin',    pct: 80, dashOffset: 35,  context: 'Family',        ctxColor: '#006d4a', ctxBg: 'rgba(0,109,74,0.08)',    title: 'Cabin Remodel',          desc: 'Create a sustainable getaway for the extended family reunions.',   milestone: 'Finalize Solar Array Installation',          accentColor: '#006d4a' },
];

export default function GoalsView() {
  const router = useRouter();
  const [goalInput, setGoalInput] = useState('');

  return (
    <>
      <div className="max-w-6xl mx-auto p-10 space-y-16 pb-24">
        {/* Section 1: AI Goal Ingestion */}
        <section>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }} className="rounded-[2.5rem] p-12 shadow-sm">
            <div className="space-y-8">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-4 block">Manifesting Potential</span>
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-4xl md:text-5xl font-bold text-on-surface placeholder-on-surface/20 resize-none overflow-hidden"
                  placeholder="What is your visionary goal?"
                  rows={2}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  aria-label="Goal name"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-on-surface-variant">Context &amp; Nuance</label>
                <input className="w-full bg-surface-container-high border-none rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-on-surface" placeholder="Describe the impact or specific outcome you desire..." type="text" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-on-surface-variant mr-2">Horizon:</span>
                  <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-all">3mo</button>
                  <button className="px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-md">1yr</button>
                  <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-all">5yr</button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="bg-gradient-to-br from-primary to-primary-dim text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => router.push(`/goals/roadmap${goalInput.trim() ? `?goal=${encodeURIComponent(goalInput.trim())}` : ''}`)}
                    disabled={!goalInput.trim()}
                    aria-label="Generate AI prerequisite path"
                  >
                    Generate AI Path <span className="text-xl">🪄</span>
                  </button>
                  <button
                    className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#0f172a]/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
                    onClick={() => router.push(`/goals/pathfinder`)}
                    aria-label="Open Pathfinder AI interactive roadmap"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    Pathfinder AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Algorithmic Path Output */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-on-surface tracking-tight">Algorithmic Path Output</h3>
            <button className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Accept &amp; Populate Matrix <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="relative overflow-x-auto pb-8">
            <div className="flex items-start gap-12 min-w-max p-4">
              {[
                { num: 1, tag: 'Project', title: 'Market Research & Positioning', desc: 'Validate target audience and analyze competitive landscape for sustainable growth.' },
                { num: 2, tag: 'Project', title: 'Build MVP Core Ecosystem',        desc: 'Develop primary features and initial user interface for beta testing.' },
                { num: 3, tag: 'Project', title: 'Global Launch Strategy',          desc: 'Scaling infrastructure and executing cross-platform marketing campaign.' },
              ].map(s => (
                <div key={s.num} className="relative flex-shrink-0 w-80 group">
                  <div className="absolute -left-6 top-8 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm z-10">
                    <span className="text-primary font-bold">{s.num}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }} className="p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-all">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-1 rounded">{s.tag}</span>
                    <h4 className="text-lg font-bold leading-tight">{s.title}</h4>
                    <p className="text-sm text-on-surface-variant line-clamp-2">{s.desc}</p>
                    <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full w-0 bg-secondary rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Active Goals */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-on-surface tracking-tight">Active Goals Overview</h3>
          <p className="text-sm text-on-surface-variant -mt-3">Click any goal to view its journey map.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GOALS.map(g => (
              <div
                key={g.id}
                className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden"
                onClick={() => router.push('/goals/journey')}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: g.accentColor, borderRadius: '1.5rem 1.5rem 0 0' }} />
                <div className="flex justify-between items-start mb-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" fill="transparent" r="28" stroke="#f1f4f6" strokeWidth="4" />
                      <circle cx="32" cy="32" fill="transparent" r="28" stroke={g.accentColor} strokeDasharray="175" strokeDashoffset={g.dashOffset} strokeLinecap="round" strokeWidth="4" />
                    </svg>
                    <span className="absolute text-xs font-bold text-on-surface">{g.pct}%</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '9999px', color: g.ctxColor, background: g.ctxBg }}>{g.context}</span>
                </div>
                <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{g.title}</h4>
                <p className="text-sm text-on-surface-variant mb-6">{g.desc}</p>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm text-secondary">flag</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Next Milestone</span>
                  </div>
                  <p className="text-sm font-medium text-on-surface">{g.milestone}</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <span style={{ fontSize: '10px', fontWeight: 700, color: g.accentColor }}>View Journey</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: g.accentColor }}>arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 group">
        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
      </button>
    </>
  );
}
