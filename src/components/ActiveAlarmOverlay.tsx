/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, VolumeX, Clock } from 'lucide-react';
import { Alarm } from '../types';
import { formatTime12h } from '../lib/utils';

interface ActiveAlarmOverlayProps {
  alarm: Alarm | null;
  onSnooze: (alarm: Alarm) => void;
  onDismiss: (alarm: Alarm) => void;
}

export default function ActiveAlarmOverlay({ alarm, onSnooze, onDismiss }: ActiveAlarmOverlayProps) {
  useEffect(() => {
    if (!alarm) return;

    // Trigger standard physical haptic feedback loop on compatible smart devices
    let vibrateInterval: any = null;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([400, 200, 400, 200, 400]);
        vibrateInterval = setInterval(() => {
          navigator.vibrate([400, 200, 400, 200, 400]);
        }, 3000);
      } catch (err) {
        console.warn('Vibration API blocked or unallowed inside frame environment:', err);
      }
    }

    return () => {
      if (vibrateInterval) {
        clearInterval(vibrateInterval);
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(0); // Stop physical vibration
        } catch (err) {}
      }
    };
  }, [alarm]);

  if (!alarm) return null;

  const { timeStr, ampm } = formatTime12h(alarm.hour, alarm.minute);

  return (
    <AnimatePresence>
      <div 
        id="active-alarm-screen"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 bg-[#090a15]/90 backdrop-blur-3xl overflow-hidden"
      >
        {/* Animated Background Pulse circles */}
        <div className="absolute inset-x-0 top-1/4 flex justify-center -z-10 select-none pointer-events-none">
          <div className="w-[350px] h-[350px] rounded-full bg-red-500/10 blur-[90px] animate-pulse-slow absolute" />
          <div className="w-[200px] h-[200px] rounded-full bg-violet-600/15 blur-[60px] animate-pulse absolute" />
        </div>

        {/* Top Header Section */}
        <div className="flex flex-col items-center mt-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: 1
            }}
            transition={{
              type: 'spring',
              repeat: Infinity,
              duration: 2,
              repeatType: 'reverse'
            }}
            className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-red-400 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-bounce"
          >
            <Bell size={36} className="animate-wiggle" />
          </motion.div>
          
          <span className="text-[11px] font-bold text-red-400 tracking-widest uppercase mb-1 bg-red-950/40 border border-red-900/30 px-3 py-1 rounded-full">
            Alarm Ringing
          </span>

          <h2 className="text-xl font-display font-medium text-white/50 mt-3">
            {alarm.label || 'Alarm clock alert'}
          </h2>
        </div>

        {/* Huge Hero Clock digits */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-7xl font-mono font-bold tracking-tighter text-white sm:text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              {timeStr}
            </span>
            <span className="text-xl font-bold tracking-widest text-white/60 uppercase font-display select-none">
              {ampm}
            </span>
          </div>
          <p className="text-xs text-white/40 font-mono mt-2 uppercase tracking-wider">
            sound loop: {alarm.soundType} preset
          </p>
        </div>

        {/* Large Tactile Dismiss & Snooze controls */}
        <div className="w-full max-w-sm flex flex-col gap-4 mb-16 z-10">
          
          {/* BIG SNOOZE BUTTON */}
          <button
            id="snooze-action-btn"
            type="button"
            onClick={() => onSnooze(alarm)}
            className="w-full py-5 rounded-[22px] bg-white text-slate-900 text-lg font-bold tracking-wider hover:bg-slate-100 transition-all active:scale-95 shadow-[0_4px_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Clock size={20} strokeWidth={2.5} />
            Snooze ({alarm.snoozeDuration}m)
          </button>

          {/* LARGE DISMISS BUTTON */}
          <button
            id="dismiss-action-btn"
            type="button"
            onClick={() => onDismiss(alarm)}
            className="w-full py-4.5 rounded-[22px] bg-red-500 hover:bg-red-600 text-white text-md font-bold tracking-wide transition-all active:scale-95 shadow-[0_0_24px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 cursor-pointer border border-red-400/25"
          >
            <VolumeX size={18} />
            Dismiss Alarm
          </button>

        </div>
      </div>
    </AnimatePresence>
  );
}
