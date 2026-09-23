/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineEntry } from '../types';
import { DEBONAIR_SEPTEMBER_17_DATE, DEBONAIR_SEPTEMBER_17_LINES } from './debonairSeptember17Data';
import { DEBONAIR_SEPTEMBER_19_DATE, DEBONAIR_SEPTEMBER_19_LINES } from './debonairSeptember19Data';
import { DEBONAIR_SEPTEMBER_20_DATE, DEBONAIR_SEPTEMBER_20_LINES } from './debonairSeptember20Data';
import { DEBONAIR_SEPTEMBER_21_DATE, DEBONAIR_SEPTEMBER_21_LINES } from './debonairSeptember21Data';

export {
  DEBONAIR_SEPTEMBER_17_DATE,
  DEBONAIR_SEPTEMBER_17_LINES,
  DEBONAIR_SEPTEMBER_19_DATE,
  DEBONAIR_SEPTEMBER_19_LINES,
  DEBONAIR_SEPTEMBER_20_DATE,
  DEBONAIR_SEPTEMBER_20_LINES,
  DEBONAIR_SEPTEMBER_21_DATE,
  DEBONAIR_SEPTEMBER_21_LINES
};

export const ALL_IMPORTED_DEBONAIR_LINES: LineEntry[] = [
  ...DEBONAIR_SEPTEMBER_21_LINES,
  ...DEBONAIR_SEPTEMBER_20_LINES,
  ...DEBONAIR_SEPTEMBER_19_LINES,
  ...DEBONAIR_SEPTEMBER_17_LINES
];

export const DEBONAIR_AVAILABLE_DATES: { date: string; label: string; lineCount: number }[] = [
  { date: '2026-09-21', label: '21 Sep 2026', lineCount: DEBONAIR_SEPTEMBER_21_LINES.length },
  { date: '2026-09-20', label: '20 Sep 2026', lineCount: DEBONAIR_SEPTEMBER_20_LINES.length },
  { date: '2026-09-19', label: '19 Sep 2026', lineCount: DEBONAIR_SEPTEMBER_19_LINES.length },
  { date: '2026-09-17', label: '17 Sep 2026', lineCount: DEBONAIR_SEPTEMBER_17_LINES.length }
];
