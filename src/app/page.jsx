"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#04071a;--bg2:#070c24;--surface:#0c1230;--surface2:#111832;
  --surface3:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.07);
  --border-hover:rgba(255,255,255,0.14);--text:#e8eeff;--text-dim:#8898b8;
  --text-muted:#4a5a7a;--primary:#5b8fff;--primary-glow:rgba(91,143,255,0.25);
  --purple:#a855f7;--purple-glow:rgba(168,85,247,0.25);
  --gradient:linear-gradient(135deg,#5b8fff 0%,#a855f7 100%);
  --q1:#f59e0b;--q1-bg:rgba(245,158,11,0.08);--q1-border:rgba(245,158,11,0.2);
  --q2:#10b981;--q2-bg:rgba(16,185,129,0.08);--q2-border:rgba(16,185,129,0.2);
  --q3:#3b82f6;--q3-bg:rgba(59,130,246,0.08);--q3-border:rgba(59,130,246,0.2);
  --q4:#64748b;--q4-bg:rgba(100,116,139,0.08);--q4-border:rgba(100,116,139,0.2);
  --radius:16px;--radius-lg:24px;--radius-xl:32px;
}
html{scroll-behavior:smooth}
#lp-root{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6;-webkit-font-smoothing:antialiased}
[data-reveal]{opacity:0;transform:translateY(36px);transition:opacity .7s cubic-bezier(.25,.46,.45,.94),transform .7s cubic-bezier(.25,.46,.45,.94)}
[data-reveal].visible{opacity:1;transform:translateY(0)}
[data-reveal="left"]{transform:translateX(-40px)}[data-reveal="right"]{transform:translateX(40px)}
[data-reveal="left"].visible,[data-reveal="right"].visible{transform:translateX(0)}
[data-delay="1"]{transition-delay:.1s}[data-delay="2"]{transition-delay:.2s}[data-delay="3"]{transition-delay:.3s}
[data-delay="4"]{transition-delay:.4s}[data-delay="5"]{transition-delay:.5s}[data-delay="6"]{transition-delay:.6s}
.lp-gradient-text{background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lp-glass{background:var(--surface3);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--border)}
.lp-section-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--primary);background:rgba(91,143,255,0.1);border:1px solid rgba(91,143,255,0.2);padding:5px 12px;border-radius:999px;margin-bottom:20px}
.lp-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:var(--gradient);color:#fff;font-weight:700;font-size:15px;border-radius:var(--radius);border:none;cursor:pointer;text-decoration:none;transition:opacity .2s,transform .2s,box-shadow .2s;font-family:'Inter',sans-serif}
.lp-btn-primary:hover{opacity:.92;transform:translateY(-2px);box-shadow:0 12px 40px var(--primary-glow)}
.lp-btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;background:transparent;color:var(--text-dim);font-weight:600;font-size:14px;border-radius:var(--radius);border:1px solid var(--border);cursor:pointer;text-decoration:none;transition:all .2s;font-family:'Inter',sans-serif}
.lp-btn-ghost:hover{border-color:var(--border-hover);color:var(--text);background:var(--surface3)}
.lp-pulse{animation:lp-cta-pulse 2.5s ease-out infinite}
@keyframes lp-cta-pulse{0%{box-shadow:0 0 0 0 var(--primary-glow)}70%{box-shadow:0 0 0 14px rgba(91,143,255,0)}100%{box-shadow:0 0 0 0 rgba(91,143,255,0)}}
/* Nav */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between;background:rgba(4,7,26,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:background .3s}
.lp-nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer}
.lp-nav-logo-mark{width:32px;height:32px;background:var(--gradient);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff}
.lp-nav-logo-text{font-size:18px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.lp-nav-links{display:flex;align-items:center;gap:6px;list-style:none}
.lp-nav-links a{color:var(--text-dim);text-decoration:none;font-size:14px;font-weight:500;padding:6px 14px;border-radius:10px;transition:color .2s,background .2s}
.lp-nav-links a:hover{color:var(--text);background:var(--surface3)}
.lp-nav-cta{display:flex;align-items:center;gap:10px}
/* Hero */
.lp-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 40px 80px;overflow:hidden;z-index:1}
.lp-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;animation:lp-orb-pulse 8s ease-in-out infinite}
.lp-orb1{width:600px;height:600px;background:radial-gradient(circle,rgba(91,143,255,0.12) 0%,transparent 70%);top:-100px;left:-150px}
.lp-orb2{width:500px;height:500px;background:radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%);bottom:-50px;right:-100px;animation-delay:-4s}
.lp-orb3{width:300px;height:300px;background:radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-2s}
@keyframes lp-orb-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.lp-hero-inner{max-width:1280px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.lp-hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.25);border-radius:999px;padding:6px 14px 6px 8px;margin-bottom:28px;font-size:12px;font-weight:600;color:#c084fc}
.lp-hero-badge-dot{width:22px;height:22px;background:var(--gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff}
.lp-hero-h1{font-size:clamp(40px,5vw,72px);font-weight:900;line-height:1.06;letter-spacing:-.03em;margin-bottom:24px;color:var(--text)}
.lp-hero-sub{font-size:clamp(16px,1.5vw,19px);color:var(--text-dim);line-height:1.65;margin-bottom:40px;max-width:480px}
.lp-hero-ctas{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.lp-hero-note{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-top:16px}
/* Demo */
.lp-demo-wrap{position:relative;animation:lp-demo-enter .9s cubic-bezier(.34,1.56,.64,1) .3s both}
@keyframes lp-demo-enter{from{opacity:0;transform:scale(.85) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.lp-demo-shell{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:20px;position:relative;box-shadow:0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.06)}
.lp-demo-topbar{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.lp-demo-dot{width:10px;height:10px;border-radius:50%}
.lp-demo-title{flex:1;text-align:center;font-size:12px;font-weight:600;color:var(--text-muted);font-family:'JetBrains Mono',monospace}
.lp-demo-input{background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:8px;min-height:44px}
.lp-demo-input-text{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text);flex:1;white-space:nowrap;overflow:hidden}
.lp-demo-cursor{display:inline-block;width:2px;height:14px;background:var(--primary);margin-left:2px;vertical-align:middle;animation:lp-blink .8s step-end infinite}
@keyframes lp-blink{0%,100%{opacity:1}50%{opacity:0}}
.lp-demo-ai-badge{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:.05em;color:#c084fc;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.2);padding:3px 10px;border-radius:999px;flex-shrink:0}
.lp-demo-ai-dot{width:6px;height:6px;background:var(--purple);border-radius:50%;animation:lp-ai-pulse 1.5s ease-in-out infinite}
@keyframes lp-ai-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
.lp-demo-matrix{display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative}
.lp-dq{border-radius:14px;padding:14px;min-height:140px;position:relative;transition:box-shadow .3s;overflow:visible}
.lp-dq.q1{background:var(--q1-bg);border:1.5px solid var(--q1-border)}.lp-dq.q2{background:var(--q2-bg);border:1.5px solid var(--q2-border)}.lp-dq.q3{background:var(--q3-bg);border:1.5px solid var(--q3-border)}.lp-dq.q4{background:var(--q4-bg);border:1.5px solid var(--q4-border)}
.lp-dq.gq1{box-shadow:0 0 20px rgba(245,158,11,0.35)}.lp-dq.gq2{box-shadow:0 0 20px rgba(16,185,129,0.35)}.lp-dq.gq3{box-shadow:0 0 20px rgba(59,130,246,0.35)}.lp-dq.gq4{box-shadow:0 0 20px rgba(100,116,139,0.25)}
.lp-dq-header{display:flex;align-items:center;gap:6px;margin-bottom:10px}
.lp-dq-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.q1 .lp-dq-icon{background:rgba(245,158,11,0.15);color:var(--q1)}.q2 .lp-dq-icon{background:rgba(16,185,129,0.15);color:var(--q2)}.q3 .lp-dq-icon{background:rgba(59,130,246,0.15);color:var(--q3)}.q4 .lp-dq-icon{background:rgba(100,116,139,0.15);color:var(--q4)}
.lp-dq-label{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.q1 .lp-dq-label{color:var(--q1)}.q2 .lp-dq-label{color:var(--q2)}.q3 .lp-dq-label{color:var(--q3)}.q4 .lp-dq-label{color:var(--q4)}
.lp-dq-sub{font-size:8px;font-weight:600;color:var(--text-muted);display:block;margin-top:1px}
.lp-demo-task{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px;margin-top:6px;opacity:0;transform:scale(0.8) translateY(-8px);transition:opacity .4s cubic-bezier(.34,1.56,.64,1),transform .4s cubic-bezier(.34,1.56,.64,1)}
.lp-demo-task.landed{opacity:1;transform:scale(1) translateY(0)}
.lp-task-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}.q1 .lp-task-dot{background:var(--q1)}.q2 .lp-task-dot{background:var(--q2)}.q3 .lp-task-dot{background:var(--q3)}.q4 .lp-task-dot{background:var(--q4)}
.lp-demo-empty{font-size:9px;color:var(--text-muted);text-align:center;padding:16px 0 8px;font-style:italic}
/* Stats */
.lp-stats-bar{position:relative;z-index:1;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:32px 40px}
.lp-stats-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center}
.lp-stat-num{font-size:clamp(28px,3vw,40px);font-weight:900;letter-spacing:-.03em;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:6px}
.lp-stat-label{font-size:13px;color:var(--text-dim);font-weight:500}
/* Sections */
.lp-section{position:relative;z-index:1;padding:100px 40px}
.lp-section-inner{max-width:1200px;margin:0 auto}
.lp-section-header{text-align:center;max-width:680px;margin:0 auto 64px}
.lp-section-header h2{font-size:clamp(32px,3.5vw,52px);font-weight:900;letter-spacing:-.03em;line-height:1.1;margin-bottom:16px;color:var(--text)}
.lp-section-header p{font-size:17px;color:var(--text-dim);line-height:1.65}
.lp-bg2{background:var(--bg2)}
/* Problem */
.lp-problem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.lp-problem-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;transition:border-color .25s,transform .25s,box-shadow .25s;cursor:default}
.lp-problem-card:hover{border-color:rgba(255,255,255,0.14);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
.lp-p-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px}
.lp-p-icon.red{background:rgba(239,68,68,0.1)}.lp-p-icon.amber{background:rgba(245,158,11,0.1)}.lp-p-icon.blue{background:rgba(59,130,246,0.1)}
.lp-problem-card h3{font-size:18px;font-weight:700;color:var(--text);margin-bottom:10px;letter-spacing:-.01em}
.lp-problem-card p{font-size:14px;color:var(--text-dim);line-height:1.65}
.lp-problem-stat{display:inline-block;margin-top:16px;font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--text-muted);border-top:1px solid var(--border);padding-top:12px;width:100%}
/* How it works */
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0;position:relative}
.lp-steps::before{content:'';position:absolute;top:52px;left:calc(16.7% + 24px);right:calc(16.7% + 24px);height:2px;background:linear-gradient(90deg,rgba(91,143,255,0.3),rgba(168,85,247,0.3),rgba(91,143,255,0.3))}
.lp-step{text-align:center;padding:0 24px;position:relative}
.lp-step-num{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;margin:0 auto 28px;position:relative;z-index:1}
.lp-step-num.s1{background:linear-gradient(135deg,#5b8fff,#818cf8);color:#fff;box-shadow:0 8px 24px rgba(91,143,255,0.35)}
.lp-step-num.s2{background:var(--gradient);color:#fff;box-shadow:0 8px 24px var(--purple-glow)}
.lp-step-num.s3{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 8px 24px rgba(16,185,129,0.35)}
.lp-step-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:14px;margin-top:20px}
.lp-step-badge.s1{color:#818cf8;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.2)}
.lp-step-badge.s2{color:#c084fc;background:rgba(192,132,252,0.1);border:1px solid rgba(192,132,252,0.2)}
.lp-step-badge.s3{color:#34d399;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2)}
.lp-step h3{font-size:20px;font-weight:800;color:var(--text);margin-bottom:12px;letter-spacing:-.02em}
.lp-step p{font-size:14px;color:var(--text-dim);line-height:1.65}
.lp-flow-demo{max-width:700px;margin:64px auto 0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:28px;position:relative;overflow:hidden}
.lp-flow-demo::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--gradient)}
.lp-flow-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px}
.lp-flow-tasks{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.lp-chip{font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;border:1px solid;display:flex;align-items:center;gap:5px}
.chip-q1{color:var(--q1);background:var(--q1-bg);border-color:var(--q1-border)}.chip-q2{color:var(--q2);background:var(--q2-bg);border-color:var(--q2-border)}.chip-q3{color:var(--q3);background:var(--q3-bg);border-color:var(--q3-border)}.chip-q4{color:var(--q4);background:var(--q4-bg);border-color:var(--q4-border)}
/* Matrix explainer */
.lp-mq-grid{max-width:640px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.lp-mq-card{border-radius:var(--radius);padding:20px;border:1.5px solid;transition:transform .25s,box-shadow .25s;cursor:default}
.lp-mq-card:hover{transform:scale(1.02)}
.lp-mq-card.m1{background:var(--q1-bg);border-color:var(--q1-border)}.lp-mq-card.m2{background:var(--q2-bg);border-color:var(--q2-border)}.lp-mq-card.m3{background:var(--q3-bg);border-color:var(--q3-border)}.lp-mq-card.m4{background:var(--q4-bg);border-color:var(--q4-border)}
.lp-mq-card:hover.m1{box-shadow:0 12px 40px rgba(245,158,11,.2)}.lp-mq-card:hover.m2{box-shadow:0 12px 40px rgba(16,185,129,.2)}.lp-mq-card:hover.m3{box-shadow:0 12px 40px rgba(59,130,246,.2)}.lp-mq-card:hover.m4{box-shadow:0 12px 40px rgba(100,116,139,.15)}
.lp-mq-label{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px}
.m1 .lp-mq-label{color:var(--q1)}.m2 .lp-mq-label{color:var(--q2)}.m3 .lp-mq-label{color:var(--q3)}.m4 .lp-mq-label{color:var(--q4)}
.lp-mq-title{font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px;letter-spacing:-.02em}
.lp-mq-sub{font-size:11px;color:var(--text-dim);line-height:1.5}
/* Features */
.lp-features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lp-feat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;transition:all .3s cubic-bezier(.25,.46,.45,.94);cursor:default;position:relative;overflow:hidden}
.lp-feat-card:hover{transform:translateY(-6px);box-shadow:0 24px 64px rgba(0,0,0,.5);border-color:rgba(255,255,255,.12)}
.lp-feat-icon{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px;border:1px solid}
.lp-feat-card.c1 .lp-feat-icon{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.2)}.lp-feat-card.c2 .lp-feat-icon{background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.2)}.lp-feat-card.c3 .lp-feat-icon{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.2)}.lp-feat-card.c4 .lp-feat-icon{background:rgba(91,143,255,.1);border-color:rgba(91,143,255,.2)}.lp-feat-card.c5 .lp-feat-icon{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.2)}.lp-feat-card.c6 .lp-feat-icon{background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.2)}
.lp-feat-card h3{font-size:17px;font-weight:700;color:var(--text);margin-bottom:10px;letter-spacing:-.02em}
.lp-feat-card p{font-size:14px;color:var(--text-dim);line-height:1.65}
.lp-feat-tag{display:inline-block;margin-top:16px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;border-radius:999px}
.tag-ai{color:#c084fc;background:rgba(192,132,252,.1);border:1px solid rgba(192,132,252,.2)}.tag-core{color:var(--primary);background:rgba(91,143,255,.1);border:1px solid rgba(91,143,255,.2)}.tag-new{color:#34d399;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.2)}
/* Testimonials */
.lp-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.lp-testi-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;transition:all .3s;cursor:default}
.lp-testi-card:hover{transform:translateY(-4px);border-color:rgba(255,255,255,.12);box-shadow:0 20px 60px rgba(0,0,0,.4)}
.lp-testi-quote{font-size:32px;line-height:1;color:var(--primary);opacity:.4;margin-bottom:16px;font-family:Georgia,serif}
.lp-testi-text{font-size:15px;color:var(--text);line-height:1.7;margin-bottom:24px;font-style:italic}
.lp-testi-author{display:flex;align-items:center;gap:12px}
.lp-testi-avatar{width:40px;height:40px;border-radius:50%;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#fff}
.lp-testi-name{font-size:14px;font-weight:700;color:var(--text)}.lp-testi-role{font-size:12px;color:var(--text-dim)}
.lp-testi-stars{display:flex;gap:3px;margin-bottom:4px}.lp-testi-stars span{color:var(--q1);font-size:12px}
/* Roles */
.lp-roles-strip{padding:40px;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);text-align:center}
.lp-roles-label{font-size:12px;color:var(--text-muted);font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:20px}
.lp-roles-pills{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.lp-role-pill{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;padding:8px 16px;border-radius:999px;background:var(--surface3);border:1px solid var(--border);color:var(--text-dim);transition:all .2s;cursor:default}
.lp-role-pill:hover{color:var(--text);border-color:var(--border-hover)}
.lp-role-dot{width:8px;height:8px;border-radius:50%}
/* CTA */
.lp-cta-section{text-align:center;background:var(--bg);position:relative;overflow:hidden;padding:100px 40px}
.lp-cta-section::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:400px;background:radial-gradient(ellipse at center,rgba(91,143,255,.1) 0%,rgba(168,85,247,.07) 40%,transparent 70%);pointer-events:none}
.lp-cta-inner{position:relative;max-width:640px;margin:0 auto}
.lp-cta-h2{font-size:clamp(36px,4vw,64px);font-weight:900;letter-spacing:-.03em;line-height:1.08;color:var(--text);margin-bottom:20px}
.lp-cta-sub{font-size:18px;color:var(--text-dim);line-height:1.6;margin-bottom:40px}
.lp-cta-form{display:flex;gap:10px;max-width:440px;margin:0 auto 20px}
.lp-cta-input{flex:1;padding:14px 18px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);color:var(--text);font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s}
.lp-cta-input:focus{border-color:var(--primary)}.lp-cta-input::placeholder{color:var(--text-muted)}
.lp-cta-note{font-size:12px;color:var(--text-muted)}.lp-cta-note a{color:var(--primary);text-decoration:none}
.lp-urgency-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:11px;font-weight:700;letter-spacing:.05em;padding:5px 14px;border-radius:999px;margin-bottom:24px}
.lp-urgency-dot{width:6px;height:6px;background:#f87171;border-radius:50%;animation:lp-ai-pulse 1.5s ease-in-out infinite}
/* Footer */
.lp-footer{background:var(--surface);border-top:1px solid var(--border);padding:40px 40px 32px}
.lp-footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.lp-footer-copy{font-size:13px;color:var(--text-muted)}
.lp-footer-links{display:flex;gap:24px}.lp-footer-links a{font-size:13px;color:var(--text-muted);text-decoration:none;transition:color .2s}.lp-footer-links a:hover{color:var(--text)}
.lp-footer-tagline{width:100%;text-align:center;margin-top:28px;font-size:12px;color:var(--text-muted);font-style:italic;border-top:1px solid var(--border);padding-top:24px}
/* Responsive */
@media(max-width:1024px){.lp-hero-inner{grid-template-columns:1fr;gap:60px}.lp-demo-wrap{max-width:560px;margin:0 auto}.lp-features-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){.lp-problem-grid{grid-template-columns:1fr}.lp-testi-grid{grid-template-columns:1fr}.lp-steps{grid-template-columns:1fr;gap:40px}.lp-steps::before{display:none}}
@media(max-width:768px){.lp-nav{padding:0 20px}.lp-nav-links{display:none}.lp-stats-inner{grid-template-columns:repeat(2,1fr);gap:20px}.lp-section{padding:64px 20px}}
@media(max-width:640px){.lp-hero{padding:100px 20px 60px}.lp-hero-ctas{flex-direction:column;align-items:flex-start}.lp-cta-form{flex-direction:column}.lp-features-grid{grid-template-columns:1fr}}
::selection{background:rgba(91,143,255,0.3);color:var(--text)}
#lp-root::-webkit-scrollbar{width:6px}
#lp-root::-webkit-scrollbar-track{background:var(--bg)}
#lp-root::-webkit-scrollbar-thumb{background:var(--surface2);border-radius:3px}
`;

const DUMP_PHRASES = [
  "Fix critical auth bug on prod...",
  "Plan Q3 OKRs with team...",
  "Call Mom this weekend...",
  "Read 20 pages of deep work book...",
  "Reply to vendor follow-up emails...",
];

const DEMO_TASKS = [
  { text: "Fix auth bug on prod", q: "q1", dq: "lpdq1", empty: "lpempty1" },
  { text: "Plan Q3 OKRs",        q: "q2", dq: "lpdq2", empty: "lpempty2" },
  { text: "Reply to vendor",     q: "q3", dq: "lpdq3", empty: "lpempty3" },
  { text: "YouTube rabbit hole", q: "q4", dq: "lpdq4", empty: "lpempty4" },
];

export default function LandingPage() {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const navRef = useRef(null);
  const demoTimerRef = useRef(null);
  const typerTimerRef = useRef(null);

  // Fix body overflow set by root layout
  useEffect(() => {
    const body = document.body;
    const origOverflow = body.style.overflow;
    const origHeight   = body.style.height;
    const origBg       = body.style.backgroundColor;
    body.style.overflow = "auto";
    body.style.height   = "auto";
    body.style.backgroundColor = "#04071a";
    body.classList.remove("overflow-hidden", "h-screen", "bg-surface");
    return () => {
      body.style.overflow = origOverflow;
      body.style.height   = origHeight;
      body.style.backgroundColor = origBg;
      body.classList.add("overflow-hidden", "h-screen", "bg-surface");
    };
  }, []);

  // Navbar transparency on scroll
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.style.background = window.scrollY > 40
        ? "rgba(4,7,26,0.95)"
        : "rgba(4,7,26,0.7)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Stats counter
  useEffect(() => {
    const animate = (id, end, suffix, duration, delay) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const start = performance.now();
        const step = (now) => {
          const p    = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * ease).toLocaleString() + (suffix || "");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animate("lps1", 12847, "",   2000, 0);
          animate("lps2", 3200,  "",   1800, 150);
          animate("lps3", 891,   "",   1600, 300);
          animate("lps4", 4,     "K+", 1400, 450);
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    const el = document.querySelector(".lp-stats-bar");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Parallax orbs
  useEffect(() => {
    const onScroll = () => {
      const y  = window.scrollY;
      const o1 = document.getElementById("lporb1");
      const o2 = document.getElementById("lporb2");
      if (o1) o1.style.transform = `translateY(${y * 0.15}px)`;
      if (o2) o2.style.transform = `translateY(${-y * 0.1}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Matrix demo — typer + card landing
  useEffect(() => {
    let phraseIdx = 0, charIdx = 0, dir = 1;

    const typeNext = () => {
      const el = document.getElementById("lpdemoTyper");
      if (!el) return;
      const phrase = DUMP_PHRASES[phraseIdx];
      if (dir === 1) {
        if (charIdx < phrase.length) {
          el.textContent = phrase.slice(0, ++charIdx);
          typerTimerRef.current = setTimeout(typeNext, 55 + Math.random() * 30);
        } else {
          typerTimerRef.current = setTimeout(() => { dir = -1; typeNext(); }, 1400);
        }
      } else {
        if (charIdx > 0) {
          el.textContent = phrase.slice(0, --charIdx);
          typerTimerRef.current = setTimeout(typeNext, 28);
        } else {
          dir = 1;
          phraseIdx = (phraseIdx + 1) % DUMP_PHRASES.length;
          typerTimerRef.current = setTimeout(typeNext, 350);
        }
      }
    };
    const typerStart = setTimeout(typeNext, 1000);

    const runDemo = () => {
      DEMO_TASKS.forEach(t => {
        const q  = document.getElementById(t.dq);
        const em = document.getElementById(t.empty);
        if (!q) return;
        q.querySelectorAll(".lp-demo-task").forEach(n => n.remove());
        if (em) em.style.display = "block";
        q.classList.remove("gq1","gq2","gq3","gq4");
      });
      DEMO_TASKS.forEach((task, i) => {
        demoTimerRef.current = setTimeout(() => {
          const q  = document.getElementById(task.dq);
          const em = document.getElementById(task.empty);
          if (!q) return;
          if (em) em.style.display = "none";
          const card = document.createElement("div");
          card.className = "lp-demo-task";
          card.innerHTML = `<div class="lp-task-dot"></div>${task.text}`;
          q.appendChild(card);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            card.classList.add("landed");
            q.classList.add(`g${task.q}`);
            setTimeout(() => q.classList.remove(`g${task.q}`), 1200);
          }));
        }, 1000 + i * 700);
      });
      demoTimerRef.current = setTimeout(runDemo, 1000 + DEMO_TASKS.length * 700 + 5000);
    };
    const demoStart = setTimeout(runDemo, 1800);

    return () => {
      clearTimeout(typerStart);
      clearTimeout(demoStart);
      clearTimeout(typerTimerRef.current);
      clearTimeout(demoTimerRef.current);
    };
  }, []);

  const handleSignup = (e) => {
    e.preventDefault();
    if (!email) return;
    setEmailSent(true);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="lp-root">

        {/* ── NAV ── */}
        <nav className="lp-nav" ref={navRef}>
          <div className="lp-nav-logo" onClick={() => scrollTo("lp-hero")}>
            <div className="lp-nav-logo-mark">✦</div>
            <span className="lp-nav-logo-text">SperoFlow</span>
          </div>
          <ul className="lp-nav-links">
            <li><a onClick={() => scrollTo("lp-features")} href="#lp-features">Features</a></li>
            <li><a onClick={() => scrollTo("lp-how")}      href="#lp-how">How It Works</a></li>
            <li><a onClick={() => scrollTo("lp-matrix")}   href="#lp-matrix">The Matrix</a></li>
            <li><a onClick={() => scrollTo("lp-testi")}    href="#lp-testi">Reviews</a></li>
          </ul>
          <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={() => router.push("/login")}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => scrollTo("lp-cta")}>Get Early Access</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero" id="lp-hero">
          <div className="lp-orb lp-orb1" id="lporb1" />
          <div className="lp-orb lp-orb2" id="lporb2" />
          <div className="lp-orb lp-orb3" />
          <div className="lp-hero-inner">
            {/* Left */}
            <div className="lp-hero-text">
              <div className="lp-hero-badge">
                <div className="lp-hero-badge-dot">✦</div>
                AI-Powered Eisenhower Matrix Intelligence
              </div>
              <h1 className="lp-hero-h1">
                Stop Being<br />
                <span className="lp-gradient-text">Busy.</span><br />
                Start Being<br />Effective.
              </h1>
              <p className="lp-hero-sub">
                SperoFlow's AI reads your chaotic task list, sorts every item into the right Eisenhower quadrant, and keeps your Physical, Mental, Spiritual, and Social life in balance — automatically.
              </p>
              <div className="lp-hero-ctas">
                <button
                  className="lp-btn-primary lp-pulse"
                  style={{ fontSize: "16px", padding: "16px 32px" }}
                  onClick={() => router.push("/signup")}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  Start for Free
                </button>
                <button className="lp-btn-ghost" onClick={() => scrollTo("lp-how")}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
                  See how it works
                </button>
              </div>
              <div className="lp-hero-note">
                <svg width="14" height="14" fill="none" stroke="#4a5a7a" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                No credit card required · Free forever plan · Takes 60 seconds
              </div>
            </div>

            {/* Right: demo */}
            <div className="lp-demo-wrap">
              <div className="lp-demo-shell">
                <div className="lp-demo-topbar">
                  <div className="lp-demo-dot" style={{ background: "#ff5f57" }} />
                  <div className="lp-demo-dot" style={{ background: "#febc2e" }} />
                  <div className="lp-demo-dot" style={{ background: "#28c840" }} />
                  <div className="lp-demo-title">speroflow — matrix intelligence</div>
                </div>
                <div className="lp-demo-input">
                  <span style={{ fontSize: "14px", opacity: .6 }}>⌨️</span>
                  <span className="lp-demo-input-text" id="lpdemoTyper" />
                  <span className="lp-demo-cursor" />
                  <div className="lp-demo-ai-badge">
                    <div className="lp-demo-ai-dot" /> AI Active
                  </div>
                </div>
                <div className="lp-demo-matrix">
                  {[
                    { id: "lpdq1", cls: "q1", icon: "⚡", label: "DO IT NOW",    sub: "Quadrant I",   eid: "lpempty1" },
                    { id: "lpdq2", cls: "q2", icon: "📅", label: "SCHEDULE IT",  sub: "Quadrant II",  eid: "lpempty2" },
                    { id: "lpdq3", cls: "q3", icon: "👥", label: "DELEGATE IT",  sub: "Quadrant III", eid: "lpempty3" },
                    { id: "lpdq4", cls: "q4", icon: "🗑", label: "ELIMINATE IT", sub: "Quadrant IV",  eid: "lpempty4" },
                  ].map(q => (
                    <div key={q.id} id={q.id} className={`lp-dq ${q.cls}`}>
                      <div className="lp-dq-header">
                        <div className="lp-dq-icon">{q.icon}</div>
                        <div>
                          <div className="lp-dq-label">{q.label}</div>
                          <span className="lp-dq-sub">{q.sub}</span>
                        </div>
                      </div>
                      <div className="lp-demo-empty" id={q.eid}>— awaiting triage —</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "120%", height: "120%", background: "radial-gradient(ellipse,rgba(91,143,255,0.06),transparent 70%)", pointerEvents: "none", zIndex: -1, borderRadius: "50%" }} />
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="lp-stats-bar">
          <div className="lp-stats-inner">
            {[["lps1","Tasks AI-Sorted This Week"],["lps2","Hours of Focus Reclaimed"],["lps3","Burnout Alerts Prevented"],["lps4","Life Roles Balanced"]].map(([id, label], i) => (
              <div key={id} data-reveal="" data-delay={String(i)}>
                <div className="lp-stat-num" id={id}>0</div>
                <div className="lp-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHO IT'S FOR ── */}
        <div className="lp-roles-strip">
          <div className="lp-roles-label">Built for people who carry many roles</div>
          <div className="lp-roles-pills">
            {[["#0053dc","Senior Engineers"],["#7c3aed","Founders & CEOs"],["#e11d48","Parents & Partners"],["#059669","Athletes & Coaches"],["#f59e0b","High-Achievers in Transition"],["#0891b2","Knowledge Workers"]].map(([color, label]) => (
              <div key={label} className="lp-role-pill">
                <div className="lp-role-dot" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── PROBLEM ── */}
        <section className="lp-section" id="lp-problem">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <div className="lp-section-label" data-reveal="">⚠️ The Real Problem</div>
              <h2 data-reveal="">Your To-Do List Is Lying To You</h2>
              <p data-reveal="" data-delay="1">The average knowledge worker has 41+ tasks on their list. Research shows only 9% ever get done. The problem isn't effort — it's prioritization.</p>
            </div>
            <div className="lp-problem-grid">
              {[
                { cls: "red", icon: "🔥", title: "Everything Feels Urgent", desc: "When everything is marked #1 priority, nothing is. You spend your day reacting instead of executing work that actually moves the needle.", stat: "📊 80% of tasks done daily are low-value (McKinsey)", delay: "" },
                { cls: "amber", icon: "😵", title: "Context-Switching Costs You", desc: "Juggling roles — engineer, parent, founder, spouse — without a system doesn't just waste time. It fractures identity and accelerates burnout.", stat: "⏱ 23 min to refocus after each interruption (UCI)", delay: "2" },
                { cls: "blue", icon: "🤯", title: "Important Work Never Gets Done", desc: "Q2 tasks — the strategic, important-but-not-urgent work that compounds over time — always get pushed by Q1 fires. Until it's too late.", stat: "🎯 Q2 neglect is the #1 cause of career stagnation", delay: "4" },
              ].map(p => (
                <div key={p.title} className="lp-problem-card" data-reveal="" data-delay={p.delay}>
                  <div className={`lp-p-icon ${p.cls}`}>{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <div className="lp-problem-stat">{p.stat}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section lp-bg2" id="lp-how">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <div className="lp-section-label" data-reveal="">⚡ The Method</div>
              <h2 data-reveal="">Three Steps to <span className="lp-gradient-text">Radical Clarity</span></h2>
              <p data-reveal="" data-delay="1">No complicated setup. No productivity guru courses. Three actions that take your brain from scattered to unstoppable.</p>
            </div>
            <div className="lp-steps">
              {[
                { n: "s1", num: "1", badge: "📥 Capture", title: "Brain Dump Everything", desc: "Open SperoFlow and dump every task, worry, and obligation — one per line or comma-separated. Don't organize. Don't overthink. Just get it out of your head.", delay: "" },
                { n: "s2", num: "2", badge: "✨ Analyze", title: "AI Sorts the Matrix", desc: "SperoFlow's Matrix Intelligence reads each task, weighs it against your roles, energy, calendar, and goals — then places it in exactly the right quadrant.", delay: "2" },
                { n: "s3", num: "3", badge: "🎯 Execute", title: "Work Only What Matters", desc: "Start with Q1. Block time for Q2. Delegate Q3. Ruthlessly eliminate Q4. SperoFlow's calendar integration turns your matrix into a live schedule — automatically.", delay: "4" },
              ].map(s => (
                <div key={s.n} className="lp-step" data-reveal="" data-delay={s.delay}>
                  <div className={`lp-step-num ${s.n}`}>{s.num}</div>
                  <div className={`lp-step-badge ${s.n}`}>{s.badge}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="lp-flow-demo" data-reveal="" data-delay="2">
              <div className="lp-flow-label">🧠 Brain Dump → AI Triage → Sorted Matrix</div>
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 16px", fontFamily: "'Inter',sans-serif", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                Fix critical auth bug on prod server, Plan Q3 OKRs with team, Reply to vendor follow-up emails, Watch 3h YouTube rabbit hole...
              </div>
              <div className="lp-flow-tasks">
                <div className="lp-chip chip-q1">⚡ Fix auth bug → DO IT NOW</div>
                <div className="lp-chip chip-q2">📅 Plan Q3 OKRs → SCHEDULE IT</div>
                <div className="lp-chip chip-q3">👥 Reply to vendor → DELEGATE IT</div>
                <div className="lp-chip chip-q4">🗑 YouTube rabbit hole → ELIMINATE IT</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MATRIX DEEP DIVE ── */}
        <section className="lp-section" id="lp-matrix">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <div className="lp-section-label" data-reveal="">🎯 The Framework</div>
              <h2 data-reveal="">The Eisenhower Matrix,<br /><span className="lp-gradient-text">Supercharged by AI</span></h2>
              <p data-reveal="" data-delay="1">Eisenhower's framework has been trusted by presidents and CEOs for 70 years. SperoFlow adds a real-time AI layer that classifies your tasks with zero manual effort.</p>
            </div>
            <div className="lp-mq-grid" data-reveal="">
              {[
                { cls: "m1", label: "Quadrant I",   title: "⚡ Do It Now",    desc: "Urgent & Important. Crises, deadlines, production incidents. Act immediately — but work to shrink this quadrant over time." },
                { cls: "m2", label: "Quadrant II",  title: "📅 Schedule It",  desc: "Not Urgent, but Important. Strategy, learning, relationships. This is where all leverage lives. SperoFlow protects this time." },
                { cls: "m3", label: "Quadrant III", title: "👥 Delegate It",  desc: "Urgent but Not Important. Interruptions, requests from others. AI identifies these and suggests who to hand off to." },
                { cls: "m4", label: "Quadrant IV",  title: "🗑 Eliminate It", desc: "Not Urgent, Not Important. Time sinks, busywork. SperoFlow surfaces these so you can cut without guilt." },
              ].map(m => (
                <div key={m.cls} className={`lp-mq-card ${m.cls}`}>
                  <div className="lp-mq-label">{m.label}</div>
                  <div className="lp-mq-title">{m.title}</div>
                  <div className="lp-mq-sub">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="lp-section lp-bg2" id="lp-features">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <div className="lp-section-label" data-reveal="">🚀 Everything Included</div>
              <h2 data-reveal="">Your Complete<br /><span className="lp-gradient-text">Life Operating System</span></h2>
              <p data-reveal="" data-delay="1">SperoFlow isn't just a task manager. It's the connective tissue between your goals, your calendar, your habits, and your identity.</p>
            </div>
            <div className="lp-features-grid">
              {[
                { cls: "c1", icon: "🧠", title: "Matrix Intelligence", desc: "Drag tasks between quadrants with live AI feedback. The ML model learns your patterns and gets sharper with every classification. Override anytime.", tag: "tag-ai", tagLabel: "AI-Powered", delay: "" },
                { cls: "c2", icon: "🌊", title: "Brain Dump Mode", desc: "Hit Brain Dump and type every task, thought, and obligation. SperoFlow parses them in real time and drops them into Unsorted — ready for one-click AI triage.", tag: "tag-core", tagLabel: "Core Feature", delay: "1" },
                { cls: "c3", icon: "📅", title: "Calendar & Drag & Drop", desc: "Week, Day, and Month views with 15-minute snap precision. Drag tasks from your matrix directly onto the calendar at the exact drop position.", tag: "tag-core", tagLabel: "Core Feature", delay: "2" },
                { cls: "c4", icon: "🏋️", title: "Vitality Sanctuary", desc: "Track Physical, Mental, Spiritual, and Social dimensions daily. AI Dynamic Insights detect imbalance before you feel it and suggest corrective actions.", tag: "tag-new", tagLabel: "New", delay: "3" },
                { cls: "c5", icon: "📝", title: "AI Journaling", desc: "Full-width writing canvas with mood tracking, sentiment analysis, and weekly psychological trend reports. Your journal trains SperoFlow to prioritize better.", tag: "tag-ai", tagLabel: "AI-Powered", delay: "4" },
                { cls: "c6", icon: "🎯", title: "Goals & Pathfinder AI", desc: "Set 3-month, 1-year, and 5-year goals. Pathfinder AI generates prerequisite learning paths, tracks milestones as gamified progress rings.", tag: "tag-ai", tagLabel: "AI-Powered", delay: "5" },
              ].map(f => (
                <div key={f.cls} className={`lp-feat-card ${f.cls}`} data-reveal="" data-delay={f.delay}>
                  <div className="lp-feat-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <span className={`lp-feat-tag ${f.tag}`}>{f.tagLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section lp-bg2" id="lp-testi">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <div className="lp-section-label" data-reveal="">💬 Real Users, Real Clarity</div>
              <h2 data-reveal="">They Stopped Being Busy.<br />You Can Too.</h2>
            </div>
            <div className="lp-testi-grid">
              {[
                { initials: "TK", bg: "linear-gradient(135deg,#0053dc,#4d8eff)", text: "I was drowning in Jira tickets, Slack messages, and family obligations. SperoFlow was the first system that understood I'm not just an engineer — I'm a father, a husband, and a founder too. The multi-role Brain Dump changed my mornings completely.", name: "Tarek K.", role: "Senior Engineer & Founder", delay: "" },
                { initials: "SM", bg: "linear-gradient(135deg,#7c3aed,#a855f7)", text: "I've tried every productivity app. The difference with SperoFlow is the AI doesn't just sort tasks — it reads my journal mood, checks my calendar load, and tells me when I'm about to burn out before I feel it. That alone is worth everything.", name: "Sara M.", role: "VP of Product, Series B Startup", delay: "2" },
                { initials: "JR", bg: "linear-gradient(135deg,#059669,#10b981)", text: "The Eisenhower Matrix isn't new. But having an AI that understands WHICH quadrant my tasks belong in — based on my goals, energy, deadlines — that's genuinely new. My Q2 time has doubled in three weeks.", name: "James R.", role: "Marathon Runner & Tech Lead", delay: "4" },
              ].map(t => (
                <div key={t.initials} className="lp-testi-card" data-reveal="" data-delay={t.delay}>
                  <div className="lp-testi-quote">"</div>
                  <p className="lp-testi-text">{t.text}</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-avatar" style={{ background: t.bg }}>{t.initials}</div>
                    <div>
                      <div className="lp-testi-stars">{Array(5).fill(0).map((_,i) => <span key={i}>★</span>)}</div>
                      <div className="lp-testi-name">{t.name}</div>
                      <div className="lp-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta-section" id="lp-cta">
          <div className="lp-cta-inner">
            <div className="lp-urgency-badge" data-reveal="">
              <div className="lp-urgency-dot" /> Early Access — Limited Spots Remaining
            </div>
            <h2 className="lp-cta-h2" data-reveal="">
              Ready to<br /><span className="lp-gradient-text">Flow With Purpose?</span>
            </h2>
            <p className="lp-cta-sub" data-reveal="" data-delay="1">
              Join thousands of high-performers who replaced chaos with clarity. Your first AI triage is free — no credit card, no friction.
            </p>
            {emailSent ? (
              <div data-reveal="" style={{ textAlign: "center", padding: "24px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "16px", maxWidth: "440px", margin: "0 auto 20px", color: "#34d399", fontWeight: 600, fontSize: "16px" }}>
                ✓ You're on the list! We'll be in touch soon.
              </div>
            ) : (
              <form className="lp-cta-form" onSubmit={handleSignup} data-reveal="" data-delay="2">
                <input
                  type="email"
                  className="lp-cta-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="lp-btn-primary">
                  Start Free
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </form>
            )}
            <div className="lp-cta-note" data-reveal="" data-delay="3">
              Free forever plan available.{" "}
              <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </div>
            <div style={{ marginTop: "48px", display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" }} data-reveal="" data-delay="4">
              {["No setup required","AI triage in under 60 seconds","Cancel anytime"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-dim)" }}>
                  <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-nav-logo" style={{ cursor: "default" }}>
              <div className="lp-nav-logo-mark">✦</div>
              <span className="lp-nav-logo-text">SperoFlow</span>
            </div>
            <div className="lp-footer-links">
              {["Features","Pricing","Blog","Privacy","Terms"].map(l => <a key={l} href="#">{l}</a>)}
            </div>
            <div className="lp-footer-copy">© 2026 SperoFlow. All rights reserved.</div>
          </div>
          <div className="lp-footer-tagline">Architect your life. Execute your vision. Flow with purpose.</div>
        </footer>

      </div>
    </>
  );
}
