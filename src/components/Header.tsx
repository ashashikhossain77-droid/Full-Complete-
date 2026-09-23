/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Sun, Moon, Gauge, Award, CheckCircle2, Loader2, Check, ShieldCheck, Sparkles, User, Upload, MessageSquare } from 'lucide-react';
import { SaveStatus, UserProfile, LineEntry } from '../types';
import { CustomDateSelector } from './CustomDateSelector';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogoClick?: () => void;
  onOpenScorecard?: () => void;
  scorecardScore?: number;
  activeDataset?: string;
  onSelectDataset?: (dataset: string) => void;
  onReloadDebonair?: () => void;
  saveStatus?: SaveStatus;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  onOpenRoles?: () => void;
  onOpenChat?: () => void;
  profile?: UserProfile;
  onOpenProfile?: () => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  lines?: LineEntry[];
  onInitializeDateLines?: (date: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  unreadCount,
  onOpenNotifications,
  onLogoClick,
  onOpenScorecard,
  scorecardScore,
  saveStatus = 'idle',
  activeDate,
  onSelectDate,
  onOpenRoles,
  onOpenChat,
  profile,
  onOpenProfile,
  onOpenDatabase,
  lines = [],
  onInitializeDateLines
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-40 border-b border-[#d9d2c2] bg-[#fbfaf6]/95 backdrop-blur-md transition-colors cockpit-header"
    >
      <div className="mx-auto max-w-[1500px] px-3 sm:px-6">
        <div className="flex h-14 sm:h-15 items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              id="top-brand-logo-btn"
              onClick={onLogoClick}
              title="IE Daily Control - Home"
              aria-label="IE Daily Control Home"
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-hidden cursor-pointer touch-manipulation active:scale-95 transition-transform"
            >
              <div
                id="top-brand-logo-icon"
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#176f78] to-[#0f4e55] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:from-[#1b7f89] group-hover:to-[#135d65] group-hover:shadow-md transition-all duration-200 border border-[#176f78]/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent pointer-events-none" />
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] text-[#fbfaf6] drop-shadow-xs transition-transform duration-200 group-hover:scale-105" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex flex-col">
                  <span className="font-extrabold text-[11px] sm:text-sm tracking-tight text-[#17343a] leading-none uppercase font-display">
                    IE / DAILY
                  </span>
                  <span className="font-extrabold text-[11px] sm:text-sm tracking-tight text-[#17343a] leading-none uppercase mt-0.5 font-display">
                    CONTROL
                  </span>
                </div>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--accent)/.55)]">
                  LIVE / PROD
                </span>
              </div>
            </button>
          </div>

          {/* Center: Active Production Date Selector */}
          {onSelectDate && (
            <div id="top-date-selector-wrapper" className="hidden sm:flex items-center">
              <CustomDateSelector
                selectedDate={activeDate || '2026-09-21'}
                onSelectDate={onSelectDate}
                lines={lines}
                onInitializeDateLines={onInitializeDateLines}
                compact={true}
              />
            </div>
          )}

          {/* Center-Right: Live Status Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {saveStatus === 'saving' && (
              <div
                id="header-save-status-indicator"
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-[11px] sm:text-xs font-bold animate-pulse shadow-2xs"
                title="Saving line and checklist updates to local storage"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden min-[420px]:inline">Saving...</span>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div
                id="header-save-status-indicator"
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-200 text-[11px] sm:text-xs font-bold shadow-2xs transition-all duration-300"
                title="All updates successfully saved"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden min-[420px]:inline">Saved</span>
              </div>
            )}

            {saveStatus === 'idle' && (
              <div
                id="header-save-status-indicator"
                className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-[#527078] opacity-75 hover:opacity-100 transition-opacity"
                title="LocalStorage state synced"
              >
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Saved</span>
              </div>
            )}
          </div>

          {/* Right Action Icons: Scorecard, User Profile & Notifications */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Profile / OAuth Button */}
            {onOpenProfile && (
              <button
                id="top-user-profile-btn"
                onClick={onOpenProfile}
                title={`Profile: ${profile?.name || 'Engineer'} (${profile?.jobTitle || 'IE'})`}
                className="h-8.5 sm:h-9 px-1.5 sm:px-2.5 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] flex items-center gap-1.5 sm:gap-2 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0"
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-5 h-5 rounded-full object-cover border border-[#d9d2c2]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-[#176f78] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'IE'}
                  </div>
                )}
                <span className="hidden md:inline max-w-[100px] truncate text-[11px] font-semibold">
                  {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
                </span>
                {profile?.googleUid && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Google OAuth Linked" />
                )}
              </button>
            )}

            {/* Import Data Button - visible on tablet/desktop, accessible via bottom drawer on mobile */}
            {onOpenDatabase && (
              <button
                id="top-import-data-btn"
                type="button"
                onClick={() => onOpenDatabase('csv-import')}
                title="Import Line Data from CSV / Excel or Restore Backup"
                className="hidden sm:flex h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <Upload className="w-4 h-4 shrink-0 text-emerald-700 group-hover:text-white" />
                <span className="hidden md:inline font-display uppercase tracking-wide">Import Data</span>
              </button>
            )}

            {/* Performance Scorecard Button - visible on desktop, accessible via bottom nav on mobile */}
            {onOpenScorecard && (
              <button
                id="top-scorecard-btn"
                onClick={onOpenScorecard}
                title="Open IE Performance Scorecard Modal"
                className="hidden md:flex h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-[#176f78]/30 bg-[#176f78]/10 hover:bg-[#176f78] text-[#176f78] hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <Award className="w-4 h-4 shrink-0 text-[#176f78] group-hover:text-white" />
                <span className="font-display uppercase tracking-wide">Scorecard</span>
                {typeof scorecardScore === 'number' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#176f78] text-white text-[10px] font-mono-numbers group-hover:bg-white group-hover:text-[#176f78] transition-colors">
                    {scorecardScore}%
                  </span>
                )}
              </button>
            )}

            {/* Team Chat & Floor Hub Button */}
            {onOpenChat && (
              <button
                id="header-team-chat-btn"
                onClick={onOpenChat}
                title="Shop Floor Communications & AI Advisor"
                aria-label="Shop Floor Chat"
                className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] flex items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            )}

            {/* Notifications Button */}
            <button
              id="top-notifications-btn"
              onClick={onOpenNotifications}
              title="Notifications & Floor Alerts"
              aria-label="Notifications"
              className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus:outline-hidden touch-manipulation active:scale-95 shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle Button (Light/Dark Mode with Smooth Cross-Fade) */}
            <button
              id="header-theme-toggle-btn"
              onClick={onToggleTheme}
              title={isDark ? 'Switch to Warm Cream (Light Mode)' : 'Switch to Night Shift (Dark Mode)'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] flex items-center justify-center transition-all shadow-2xs cursor-pointer group overflow-hidden touch-manipulation active:scale-95 shrink-0"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-90 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-[#176f78] transition-transform group-hover:-rotate-12 duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
