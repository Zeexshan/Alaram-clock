/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Clock, Calendar, BellRing } from 'lucide-react';
import { formatTime12h, padZero } from '../lib/utils';

interface ClockHeaderProps {
  time: Date;
  nextAlarmText: string | null;
}

export default function ClockHeader({ time, nextAlarmText }: ClockHeaderProps) {
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();
  
  const { timeStr, ampm } = formatTime12h(hour, minute);
  const secondStr = padZero(second);

  // Format Date gracefully: Monday, May 12 (or matching locale format)
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div id="clock-header" className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between w-full gap-4 pb-6 border-b border-white/10">
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-1 select-none font-display drop-shadow-[0_4px_30px_rgba(255,255,255,0.08)]">
          {timeStr}
          <span className="text-white/30 text-3xl sm:text-4xl font-light mx-0.5 animate-pulse">:</span>
          <span className="text-2xl sm:text-3xl text-white/50 font-light mr-1.5">{secondStr}</span>
          <span className="text-2xl sm:text-3xl font-light opacity-60 uppercase">{ampm}</span>
        </h1>
        <span className="text-sm sm:text-base font-medium opacity-80 uppercase tracking-widest text-[#a5b4fc] font-sans">
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center">
        {nextAlarmText ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={nextAlarmText}
            className="backdrop-blur-xl bg-white/10 border border-white/20 px-5 py-2.5 rounded-full flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide uppercase text-white shadow-xl"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Next Alarm in {nextAlarmText}</span>
          </motion.div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide uppercase text-white/50">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
            <span>No Active Alarms</span>
          </div>
        )}
      </div>
    </div>
  );
}
