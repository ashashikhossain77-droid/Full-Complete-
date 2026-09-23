/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Layers, ChevronDown, Check, X, Building2 } from 'lucide-react';

export interface ProductionFloorOption {
  id: string;
  label: string;
  floorNo?: number;
  linesRange?: string;
  matchPatterns: string[];
}

export const PRODUCTION_FLOOR_OPTIONS: ProductionFloorOption[] = [
  {
    id: 'all',
    label: 'All Production Floors',
    linesRange: 'Lines 01 - 34',
    matchPatterns: ['all', 'all floors', 'all production floors']
  },
  {
    id: 'padma',
    label: 'Padma (Floor 1)',
    floorNo: 1,
    linesRange: 'Lines 01 - 06',
    matchPatterns: ['padma', 'floor 1', 'floor 01', 'unit 2 - padma']
  },
  {
    id: 'meghna',
    label: 'Meghna (Floor 2)',
    floorNo: 2,
    linesRange: 'Lines 07 - 12',
    matchPatterns: ['meghna', 'floor 2', 'floor 02', 'unit 2 - meghna']
  },
  {
    id: 'karnophuli',
    label: 'Karnophuli (Floor 3)',
    floorNo: 3,
    linesRange: 'Lines 13 - 17',
    matchPatterns: ['karnophuli', 'floor 3', 'floor 03', 'unit 2 - karnophuli']
  },
  {
    id: 'korotoya',
    label: 'Korotoya (Floor 4)',
    floorNo: 4,
    linesRange: 'Lines 18 - 23',
    matchPatterns: ['korotoya', 'floor 4', 'floor 04', 'unit 2 - korotoya']
  },
  {
    id: 'shitalokshya',
    label: 'Shitalokshya (Floor 5)',
    floorNo: 5,
    linesRange: 'Lines 24 - 29',
    matchPatterns: ['shitalokshya', 'floor 5', 'floor 05', 'unit 2 - shitalokshya']
  },
  {
    id: 'turag',
    label: 'Turag (Floor 6)',
    floorNo: 6,
    linesRange: 'Lines 30 - 34',
    matchPatterns: ['turag', 'floor 6', 'floor 06', 'unit 2 - turag']
  }
];

/**
 * Returns true if the line's floor string matches the selected floor option id
 */
export function matchesProductionFloor(lineFloor: string | undefined | null, selectedFloorId: string): boolean {
  if (!selectedFloorId || selectedFloorId === 'all') return true;
  if (!lineFloor) return false;

  const cleanFloor = lineFloor.trim().toLowerCase();
  const option = PRODUCTION_FLOOR_OPTIONS.find(f => f.id === selectedFloorId);
  if (!option) {
    return cleanFloor.includes(selectedFloorId.toLowerCase());
  }

  return option.matchPatterns.some(pattern => cleanFloor.includes(pattern));
}

/**
 * Normalizes any floor string or id into its official label (e.g. 'padma' -> 'Padma (Floor 1)')
 */
export function getProductionFloorLabel(floorIdOrName: string | undefined | null): string {
  if (!floorIdOrName || floorIdOrName === 'all') return 'All Production Floors';

  const clean = floorIdOrName.trim().toLowerCase();
  const exactOption = PRODUCTION_FLOOR_OPTIONS.find(f => f.id === clean || f.label.toLowerCase() === clean);
  if (exactOption) return exactOption.label;

  const patternMatch = PRODUCTION_FLOOR_OPTIONS.find(f =>
    f.matchPatterns.some(p => clean.includes(p))
  );
  return patternMatch ? patternMatch.label : floorIdOrName;
}

/**
 * Maps any floor string or label to its option id ('padma', 'meghna', etc.)
 */
export function getProductionFloorId(floorIdOrName: string | undefined | null): string {
  if (!floorIdOrName || floorIdOrName === 'all') return 'all';

  const clean = floorIdOrName.trim().toLowerCase();
  const exactOption = PRODUCTION_FLOOR_OPTIONS.find(f => f.id === clean || f.label.toLowerCase() === clean);
  if (exactOption) return exactOption.id;

  const patternMatch = PRODUCTION_FLOOR_OPTIONS.find(f =>
    f.matchPatterns.some(p => clean.includes(p))
  );
  return patternMatch ? patternMatch.id : 'all';
}

interface ProductionFloorCardProps {
  selectedFloor: string; // floor id ('all', 'padma', etc.) or label
  onSelectFloor: (floorId: string, floorLabel: string) => void;
  className?: string;
  showHeader?: boolean;
  showSubtitles?: boolean;
  onClose?: () => void;
}

/**
 * Pure card presentation exactly matching the user's uploaded image:
 * - Rounded white card container
 * - Divider between each option
 * - Label on the left
 * - Blue selected radio dot or gray unselected radio circle on the right
 */
export const ProductionFloorCard: React.FC<ProductionFloorCardProps> = ({
  selectedFloor,
  onSelectFloor,
  className = '',
  showHeader = false,
  showSubtitles = false,
  onClose
}) => {
  const currentId = getProductionFloorId(selectedFloor);

  return (
    <div
      className={`bg-white dark:bg-[#1a2327] rounded-3xl border border-[#d9d2c2]/80 dark:border-slate-700 shadow-xl overflow-hidden transition-all select-none ${className}`}
      style={{
        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.12), 0 1px 4px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#ece7dc] dark:border-slate-800 bg-[#faf8f4] dark:bg-[#151c20]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#176f78]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200">
              Select Production Floor
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {PRODUCTION_FLOOR_OPTIONS.map(option => {
          const isSelected = currentId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectFloor(option.id, option.label)}
              className={`w-full text-left flex items-center justify-between px-5 py-4 transition-colors cursor-pointer group ${
                isSelected
                  ? 'bg-blue-50/25 dark:bg-blue-950/20'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[16px] sm:text-[17px] text-[#17343a] dark:text-slate-100 font-normal tracking-tight group-hover:text-black dark:group-hover:text-white">
                  {option.label}
                </span>
                {showSubtitles && option.linesRange && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    {option.linesRange}
                  </span>
                )}
              </div>

              {/* iOS / modern radio selector exactly as in the user screenshot */}
              <div className="shrink-0 ml-4 flex items-center justify-center">
                {isSelected ? (
                  <div
                    className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full border-2 border-[#1976d2] dark:border-blue-400 flex items-center justify-center shadow-2xs transition-transform transform active:scale-90"
                    aria-label="Selected"
                  >
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#1976d2] dark:bg-blue-400" />
                  </div>
                ) : (
                  <div
                    className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-colors group-hover:border-slate-400"
                    aria-label="Unselected"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface ProductionFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloor: string;
  onSelectFloor: (floorId: string, floorLabel: string) => void;
}

/**
 * Modal overlay containing the Production Floor Selector
 */
export const ProductionFloorModal: React.FC<ProductionFloorModalProps> = ({
  isOpen,
  onClose,
  selectedFloor,
  onSelectFloor
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md animate-in zoom-in-95 duration-150">
        <ProductionFloorCard
          selectedFloor={selectedFloor}
          onSelectFloor={(id, label) => {
            onSelectFloor(id, label);
            onClose();
          }}
          showHeader={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

interface ProductionFloorDropdownProps {
  selectedFloor: string;
  onSelectFloor: (floorId: string, floorLabel: string) => void;
  variant?: 'header' | 'filter' | 'button';
  className?: string;
}

/**
 * Dropdown trigger button that pops open the exact Production Floor selection card
 */
export const ProductionFloorDropdown: React.FC<ProductionFloorDropdownProps> = ({
  selectedFloor,
  onSelectFloor,
  variant = 'header',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = getProductionFloorLabel(selectedFloor);
  const currentId = getProductionFloorId(selectedFloor);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {variant === 'header' && (
        <button
          type="button"
          id="header-floor-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title={`Active Floor: ${currentLabel}`}
          className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] flex items-center gap-1.5 sm:gap-2 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0"
        >
          <Building2 className="w-4 h-4 text-[#176f78] shrink-0" />
          <span className="max-w-[120px] sm:max-w-[150px] truncate">
            {currentId === 'all' ? 'All Floors' : currentLabel}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {variant === 'filter' && (
        <button
          type="button"
          id="btn-open-floor-selector"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 bg-[#f1eee6] hover:bg-[#e7e1d5] px-3 py-1.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] transition-colors cursor-pointer shadow-2xs"
          title="Filter by Production Floor"
        >
          <Building2 className="w-3.5 h-3.5 text-[#176f78]" />
          <span>{currentLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-slate-50 text-xs font-bold text-[#17343a] transition-all cursor-pointer shadow-2xs"
        >
          <Building2 className="w-4 h-4 text-[#176f78]" />
          <span>{currentLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Popover / Sheet Content */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-[290px] sm:w-[330px] animate-in fade-in zoom-in-95 duration-150">
          <ProductionFloorCard
            selectedFloor={selectedFloor}
            onSelectFloor={(id, label) => {
              onSelectFloor(id, label);
              setIsOpen(false);
            }}
            showHeader={true}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
