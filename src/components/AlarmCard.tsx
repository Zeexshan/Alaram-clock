/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Trash2, Volume2, Clock, Bell } from 'lucide-react';
import { Alarm } from '../types';
import { formatTime12h, getRepeatDaysLabel } from '../lib/utils';
import ToggleSwitch from './ToggleSwitch';

interface AlarmCardProps {
  key?: string | number;
  alarm: Alarm;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
}

export default function AlarmCard({ alarm, onToggle, onEdit, onDelete }: AlarmCardProps) {
  const { timeStr, ampm } = formatTime12h(alarm.hour, alarm.minute);
  const repeatText = getRepeatDaysLabel(alarm.repeatDays);

  // Format snoozed display if relevant
  let snoozeTimeText = '';
  if (alarm.snoozedUntil) {
    const sDate = new Date(alarm.snoozedUntil);
    const { timeStr: sTimeStr, ampm: sAmpm } = formatTime12h(sDate.getHours(), sDate.getMinutes());
    snoozeTimeText = `${sTimeStr} ${sAmpm}`;
  }

  // Exact border gradients and opacity from theme setup
  const isSnoozed = alarm.enabled && alarm.snoozedUntil;
  const isEnabledOnly = alarm.enabled && !alarm.snoozedUntil;

  let cardClass = '';
  if (isSnoozed) {
    cardClass = 'backdrop-blur-[24px] bg-white/15 border-t border-white/40 border-l border-white/20 border-r border-white/10 border-b border-white/5 shadow-2xl outline outline-2 outline-orange-400/50';
  } else if (isEnabledOnly) {
    cardClass = 'backdrop-blur-[24px] bg-white/10 border-t border-white/30 border-l border-white/20 border-r border-white/10 border-b border-white/5 shadow-2xl';
  } else {
    // Inactive state
    cardClass = 'backdrop-blur-[24px] bg-white/5 border-t border-white/10 border-l border-white/5 border-r border-white/3 border-b border-white/2 shadow-sm opacity-60 hover:opacity-100 transition-opacity';
  }

  const daysLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <motion.div
      id={`alarm-card-${alarm.id}`}
      layout
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      onClick={() => onEdit(alarm)}
      className={`relative p-6 rounded-[32px] cursor-pointer select-none flex flex-col justify-between group specular-highlight overflow-hidden ${cardClass}`}
    >
      {/* Light sweep specular effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-gradient-shift pointer-events-none" />

      {/* Top half: Time, label & Switch */}
      <div className="flex justify-between items-start w-full gap-4">
        <div className="flex flex-col">
          <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-display">
            {timeStr} <span className="text-2xl font-light opacity-50 uppercase">{ampm}</span>
          </span>
          
          <div className="mt-2 flex flex-col gap-1">
            <span className={`text-xs font-semibold tracking-wide uppercase ${
              alarm.enabled ? 'text-blue-300' : 'text-gray-400'
            }`}>
              {alarm.label || 'Alarm clock alert'}
            </span>
            {/* Audio preset label */}
            <span className="text-[10px] text-white/30 font-mono capitalize tracking-wider flex items-center gap-1">
              <Volume2 size={10} /> {alarm.soundType} preset • {alarm.snoozeDuration}m snooze
            </span>
          </div>
        </div>

        {/* Action Controls Side */}
        <div className="flex items-center gap-3.5" onClick={(e) => e.stopPropagation()}>
          <ToggleSwitch
            id={`toggle-${alarm.id}`}
            checked={alarm.enabled}
            onChange={(val) => onToggle(alarm.id, val)}
          />

          <button
            id={`delete-${alarm.id}`}
            type="button"
            onClick={() => onDelete(alarm.id)}
            className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:text-white transition-all duration-200 cursor-pointer"
            title="Delete Alarm"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Snooze dynamic alert bar */}
      {isSnoozed && (
        <div className="mt-4 px-3 py-1.5 bg-orange-500/40 border border-orange-400/50 rounded-full flex items-center gap-2 self-start animate-pulse-slow">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
          <span className="text-[10px] font-bold tracking-tight uppercase text-orange-200">
            Snoozed until {snoozeTimeText}
          </span>
        </div>
      )}

      {/* Bottom half: Days selector circles & text summary */}
      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap border-t border-white/5 pt-4">
        <div className="flex gap-1.5">
          {daysLabel.map((dayName, idx) => {
            const isDaySelected = alarm.repeatDays.includes(idx);
            let dayCircleClass = '';
            if (isDaySelected) {
              dayCircleClass = alarm.enabled 
                ? 'bg-blue-500 border-blue-400/30 text-white font-bold' 
                : 'bg-white/20 border-white/10 text-white/70';
            } else {
              dayCircleClass = 'bg-white/5 text-white/25 border-white/5';
            }

            return (
              <span
                key={idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] border transition-all ${dayCircleClass}`}
                title={`Repeats on ${dayName}`}
              >
                {dayName}
              </span>
            );
          })}
        </div>
        
        <span className="text-[10px] font-bold tracking-wider uppercase opacity-50 font-display">
          {repeatText}
        </span>
      </div>

    </motion.div>
  );
}
