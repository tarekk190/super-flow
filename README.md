<div align="center">

# ✨ SperoFlow

**Your AI-Powered Life Operating System**

A premium, full-stack productivity dashboard built with **Next.js 15**, **React 19**, and **Feature-Sliced Design (FSD)** architecture. SperoFlow seamlessly integrates task management, time blocking, habit tracking, journaling, and AI coaching into one cohesive experience.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 🎯 Overview

SperoFlow is designed around the philosophy that **true productivity is holistic** — it's not just about checking tasks off a list, but about intentionally balancing every dimension of your life: Physical, Mental, Spiritual, and Social. The app combines an Eisenhower Matrix, a weekly calendar with drag-and-drop scheduling, habit tracking, journaling with AI analysis, and project management into a unified dashboard.

## 🚀 Features

### 📅 Calendar (Agentic Hub)
- **Week / Day / Month** view switching
- Drag-and-drop events between days and time slots
- Resize events by dragging their bottom edge
- Click-to-add new events with color coding
- Real-time "current time" indicator
- Cross-feature drag: drop tasks from the sidebar directly onto the calendar

### 🎯 Eisenhower Matrix
- Interactive 4-quadrant task prioritization grid
- Drag-and-drop tasks between quadrants (Urgent/Important)
- **AI-powered task classification**: Uses the `YatinSatija/eisenhow-matrix-pt-model` ML model to classify tasks.
- Accepts sidebar task drops into any quadrant.

### 📝 Journaling
- Full-width writing canvas with serif typography
- AI Emotional Radar with weekly trend analysis
- Psychological insight panel with AI-generated advice
- Reflections timeline with sentiment tracking
- Focus timer (Pomodoro-style)

### 🏋️ Vitality Sanctuary (Habits)
- Four-dimension vitality radar (Physical, Mental, Spiritual, Social)
- Habit streak tracking with visual dot grids
- AI Dynamic Insights for habit optimization
- "Sharpen the Saw" framework inspired by Stephen Covey

### 📊 Projects & Goals
- **Projects** — Execution board with milestone tracking and AI velocity insights
- **Goals** — Gamified goal journey with progress rings, AI path generator, and detailed breakdowns
- Drill-down navigation: Projects → Execution Board, Goals → Journey View

### ✅ Task Execution Pipeline
- Quadrant-II focused task feed (proactive growth)
- Urgency zone for deadline-critical tasks
- AI delegation suggestions for Quadrant III tasks
- Brain-dump input with instant AI classification

### 🤖 AI Coach & Smart Scheduler Subagent
- **Smart Scheduling Subagent**: An Anti-Burnout Engine that gathers user context (emotion, calendar, learning roadmap) and synthesizes an optimal schedule using the local `google/gemma-4-12B-it` LLM.
- **Priority Reset**: The LLM can override the initial ML quadrant classification (e.g., deferring non-urgent tasks if burnout risk is high, or boosting priority if the task aligns with learning goals).
- Proactive nudges and pattern detection
- Sentiment analysis on journal entries
- Calendar optimization suggestions
- Context-aware insights across all features

### ⚙️ Settings
- Appearance (Dark Mode, Compact Sidebar, Animations)
- AI Coach configuration (strictness, proactive nudges)
- Notifications (push, email digest, focus mode)
- Privacy & Data controls

### 🧩 Cross-Feature Drag & Drop
The sidebar contains **Internal Balance** (Physical, Mental, Spiritual, Social) and **Role Balance** (Engineer, Father, Husband, etc.) categories with draggable task cards. These can be dropped onto:
- Any calendar day column → creates a 1-hour event at the drop position
- Any Eisenhower Matrix quadrant → creates a prioritized task

## 🏗️ Architecture

SperoFlow follows **Feature-Sliced Design (FSD)** — a scalable architecture that organizes code by business domain rather than technical type.

```
src/
├── app/                          # Next.js App Router
│   ├── layout.jsx                # Root layout (fonts, metadata)
│   ├── page.jsx                  # Root redirect → /calendar
│   ├── (dashboard)/              # Route group (shared layout)
│   │   ├── layout.jsx            # Dashboard shell (TopNav + Sidebar + DndProvider)
│   │   ├── loading.jsx           # Skeleton loading state
│   │   ├── calendar/page.jsx     # Calendar view
│   │   ├── matrix/page.jsx       # Eisenhower Matrix
│   │   ├── journaling/page.jsx   # Journaling canvas
│   │   ├── habits/page.jsx       # Vitality Sanctuary
│   │   ├── tasks/page.jsx        # Task pipeline
│   │   ├── projects/page.jsx     # Projects overview
│   │   ├── projects/board/page.jsx
│   │   ├── goals/page.jsx        # Goals overview
│   │   ├── goals/journey/page.jsx
│   │   ├── agentic-hub/page.jsx
│   │   └── settings/page.jsx
│   └── api/                      # API routes
│       ├── ai-coach/route.js
│       └── matrix-sort/route.js
├── components/
│   ├── layout/
│   │   ├── TopNav.jsx            # 7-view navigation bar
│   │   └── Sidebar.jsx           # Draggable task sidebar
│   └── providers/
│       └── DndProvider.jsx       # Global @dnd-kit context
├── features/                     # FSD feature slices
│   ├── AgenticHub/               # Calendar (Week/Day/Month views)
│   ├── EisenhowerMatrix/         # 4-quadrant matrix
│   ├── Goals/                    # Goals + Gamified Journey
│   ├── Habits/                   # Vitality Sanctuary
│   ├── Journaling/               # Writing + AI analysis
│   ├── Projects/                 # Projects + Execution Board
│   ├── Settings/                 # App configuration
│   └── Tasks/                    # Task pipeline
├── lib/                          # Shared utilities
│   ├── apiClient.js
│   ├── formatters.js
│   └── utils.js
└── store/
    └── useDragStore.js           # Zustand drag state management
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **UI** | React 19 |
| **Styling** | Tailwind CSS 3.4 |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **State** | Zustand |
| **Icons** | Google Material Symbols |
| **Fonts** | Inter (Google Fonts) |

## 📦 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/speroflow.git
cd speroflow

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server
npm run dev

# Open in browser
# → http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## 🎨 Design System

SperoFlow uses a custom design system with semantic color tokens:

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#0053dc` | Primary brand, active states, CTAs |
| `--secondary` | `#006d4a` | Physical dimension, success |
| `--tertiary` | `#865400` | Spiritual dimension, warm accents |
| `--error` | `#ba1a1a` | Urgency, destructive actions |
| `--surface` | `#f8f9fa` | Background |
| `--on-surface` | `#1a1c1e` | Primary text |

## 🗺️ Routes

| Path | View | Description |
|---|---|---|
| `/` | — | Redirects to `/calendar` |
| `/calendar` | Calendar | Weekly/Daily/Monthly schedule |
| `/matrix` | Eisenhower Matrix | Task prioritization grid |
| `/journaling` | Journaling Canvas | AI-powered reflective writing |
| `/habits` | Vitality Sanctuary | Habit tracking dashboard |
| `/tasks` | Task Pipeline | Execution-focused task list |
| `/projects` | Projects | Project management overview |
| `/projects/board` | Execution Board | Gamified project board |
| `/goals` | Goals | Goal tracking with AI |
| `/goals/journey` | Goal Journey | Gamified goal breakdown |
| `/agentic-hub` | Agentic Hub | Alternative calendar entry |
| `/settings` | Settings | App configuration |

## 🔌 API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai-coach` | `GET` / `POST` | AI coach proxy (placeholder) |
| `/api/matrix-sort` | `POST` | AI task classification (placeholder) |

> **Note:** API routes are currently stubs. Connect them to your AI backend (OpenAI, Anthropic, etc.) for production use.

## 🧪 Development Notes

### Component Paradigm
- **Server Components** — all page files and layouts (no `"use client"`)
- **Client Components** — interactive features marked with `"use client"` directive (calendar, matrix, sidebar, settings, etc.)

### Drag & Drop Architecture
The global `DndProvider` wraps the entire dashboard layout. It uses:
- **`pointerWithin`** collision detection for accurate cross-feature drops
- **`window.__calendarDragEnd`** bridge for sidebar → calendar drops
- **`window.__matrixDragEnd`** bridge for sidebar → matrix drops
- Pointer position calculation for precise time-slot placement

### Key Design Decisions
1. **No `react-router-dom`** — fully leverages Next.js App Router
2. **`(dashboard)` route group** — shares a layout without affecting URL paths
3. **Feature-Sliced Design** — each feature is self-contained with its own components, actions, and barrel exports
4. **Zustand for drag state** — lightweight, React 19 compatible global store

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

*Architect your life. Execute your vision. Flow with purpose.*

</div>