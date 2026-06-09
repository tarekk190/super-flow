"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { logout } from '@/app/actions/auth-actions';

const NAV_ITEMS = [
  { id: 'journaling', path: '/journaling', icon: 'menu_book',     label: 'Journaling' },
  { id: 'matrix',    path: '/matrix',     icon: 'grid_view',      label: 'Matrix'     },
  { id: 'habits',    path: '/habits',     icon: 'rebase_edit',    label: 'Habits'     },
  { id: 'tasks',     path: '/tasks',      icon: 'checklist',      label: 'Tasks'      },
  { id: 'calendar',  path: '/calendar',   icon: 'calendar_month', label: 'Calendar'   },
  { id: 'goals',     path: '/goals',      icon: 'ads_click',      label: 'Goals'      },
];

export default function TopNav({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => {
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  // Extract a display letter from the user's email
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header
      className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl flex items-center h-16 px-6 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
      style={{ gap: 0, position: 'fixed' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2 cursor-pointer mr-6 flex-shrink-0"
        onClick={() => router.push('/calendar')}
      >
        <div style={{ background: 'linear-gradient(135deg,#0053dc,#3b82f6)' }} className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
        </div>
        <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.04em', color: '#0053dc' }}>SperoFlow</span>
      </div>

      {/* 7-view Nav Pills — absolutely centred */}
      <nav className="flex items-center gap-1" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              className={
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all border-none font-sans ' +
                (active ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800')
              }
              style={{ minWidth: '68px' }}
              onClick={() => router.push(item.path)}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  transition: 'font-variation-settings 0.2s',
                  ...(active ? { fontVariationSettings: "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24" } : {}),
                }}
              >{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side: avatar and profile dropdown */}
      <div className="flex items-center gap-4 pl-4 border-l border-slate-100 flex-shrink-0 relative" style={{ marginLeft: 'auto' }} ref={menuRef}>
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-primary/10">
            {userInitial}
          </div>
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>expand_more</span>
        </button>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-slate-50">
              <p className="text-xs font-semibold text-slate-800 truncate">Account</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>
            
            <button
              onClick={() => router.push('/settings')}
              className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 border-none bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
              Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-none bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

