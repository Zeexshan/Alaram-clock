/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SoundType = 'classic' | 'gentle' | 'urgent';

export interface Alarm {
  id: string;
  hour: number;      // 0-23
  minute: number;    // 0-59
  label: string;
  repeatDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  snoozeDuration: number; // in minutes (e.g. 1, 5, 9, 15)
  soundType: SoundType;
  snoozedUntil: number | null; // Milliseconds timestamp of snooze target, or null
  lastTriggered: string | null; // "YYYY-MM-DD HH:MM" block to prevent double triggers in same minute
}

export interface SoundPreset {
  id: SoundType;
  name: string;
  description: string;
}

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'gentle', name: 'Gentle Chime', description: 'Soft melodic arpeggio synth chime' },
  { id: 'classic', name: 'Classic Beep', description: 'Retro recurring clean square tone beep' },
  { id: 'urgent', name: 'Urgent Pulse', description: 'High-frequency recurring double-pulse alert' },
];
