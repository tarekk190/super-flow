"use client";

import { useRouter } from 'next/navigation';

const PROJECTS = [
  { id: 'proj-market',   parentGoal: 'Startup 2026', title: 'Market Research',          pct: 45, dashOffset: 69,    accentColor: '#0053dc', strokeColor: '#006d4a', milestones: [{ done: true,  text: 'Competitor Analysis' },         { done: false, text: 'Target Demographic Survey' }] },
  { id: 'proj-vacation', parentGoal: 'Travel 2026',  title: 'Family Vacation Planning', pct: 20, dashOffset: 100.5, accentColor: '#865400', strokeColor: '#fea619', milestones: [{ done: true,  text: 'Destination Shortlist' },         { done: false, text: 'Flight Price Comparison' }] },
  { id: 'proj-health',   parentGoal: 'Fitness 2026', title: 'Health Optimization',       pct: 75, dashOffset: 31.4,  accentColor: '#006d4a', strokeColor: '#006d4a', milestones: [{ done: true,  text: 'Lab Panel Review' },              { done: true,  text: 'Sleep Hygiene Protocol' }] },
];

export default function ProjectsView() {
  const router = useRouter();

  return (
    <>
      <div className="max-w-7xl mx-auto p-10 space-y-12">
        {/* AI Velocity Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-on-surface">Welcome back, Architect.</h1>
            <p className="text-on-surface-variant font-medium">You have {PROJECTS.length} active projects. Click any card to open its <span className="text-primary">Execution Board</span>.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }} className="p-6 rounded-xl flex items-center gap-6 max-w-md shadow-sm border border-white/50">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <div className="space-y-1">
              <p className="text-[0.75rem] font-semibold uppercase tracking-widest text-primary-dim">AI Velocity Widget</p>
              <p className="text-sm font-medium text-on-surface">⚠️ <span className="text-error font-semibold">AI Insight:</span> 'Market Research' is slipping. Re-prioritize?</p>
            </div>
          </div>
        </header>

        {/* Project Grid */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-on-surface">Active Projects</h2>
            <button className="text-sm font-semibold text-primary flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-lg">add_circle</span> New Project
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map(p => (
              <div
                key={p.id}
                style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', cursor: 'pointer' }}
                className="rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-white/50"
                onClick={() => router.push('/projects/board')}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: p.accentColor }} />
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">↳ {p.parentGoal}</p>
                      <h3 className="text-xl font-bold text-on-surface">{p.title}</h3>
                    </div>
                    <div className="relative w-12 h-12">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-surface-container-high" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4" />
                        <circle cx="24" cy="24" fill="transparent" r="20" stroke={p.strokeColor} strokeDasharray="125.6" strokeDashoffset={p.dashOffset} strokeWidth="4" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{p.pct}%</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-on-surface-variant">Next Milestones</p>
                    <div className="space-y-2">
                      {p.milestones.map((m, mi) => (
                        <div key={mi} className="flex items-center gap-3 text-sm text-on-surface-variant">
                          <span className={'material-symbols-outlined text-xs ' + (m.done ? 'text-secondary' : '')}>{m.done ? 'check_circle' : 'radio_button_unchecked'}</span>
                          <span className={m.done ? 'line-through opacity-50' : ''}>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-br from-primary to-primary-dim text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-primary/20 group-hover:scale-[1.02] transition-transform">
                    <span className="material-symbols-outlined text-sm">view_kanban</span>
                    Open Execution Board
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined" style={{ color: p.accentColor, fontSize: '18px' }}>arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quarterly Timeline */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-on-surface">Quarterly Horizon</h2>
          </div>
          <div className="w-full h-80 rounded-2xl overflow-hidden bg-surface-container-low flex">
            {[
              { month: 'October',  bg: '', items: [{ h: 'h-20', cls: 'bg-white/60 shadow-sm', title: 'Market Analysis Phase', sub: 'Professional', subCls: 'text-primary' }] },
              { month: 'November', bg: 'bg-surface-container', items: [{ h: 'h-32', cls: 'bg-white/80 shadow-md border-l-4 border-primary', title: 'MVP Core Development', sub: '✨ AI Intensive Phase', subCls: 'text-primary-dim', bar: true }] },
              { month: 'December', bg: '', items: [{ h: 'h-16', cls: 'bg-tertiary-container/20', title: 'Holiday Prep', sub: 'Family Context', subCls: 'text-tertiary' }] },
            ].map(col => (
              <div key={col.month} className={'flex-1 ' + col.bg + ' p-6 space-y-4'}>
                <p className="text-[0.7rem] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-2">{col.month}</p>
                {col.items.map((item, ii) => (
                  <div key={ii} className={item.h + ' ' + item.cls + ' rounded-xl p-4'}>
                    <p className="text-xs font-bold text-on-surface">{item.title}</p>
                    <p className={'text-[10px] mt-1 ' + item.subCls}>{item.sub}</p>
                    {item.bar && <div className="w-full bg-surface-container-low h-1 mt-4 rounded-full"><div className="bg-primary h-full w-1/3 rounded-full" /></div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[60]">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </button>
    </>
  );
}
