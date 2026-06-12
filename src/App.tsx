/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Moon, HelpCircle, Clock } from 'lucide-react';
import { Alarm } from './types';
import { getNextAlarmDetails, formatRemainingTime, padZero } from './lib/utils';
import { audioManager } from './lib/audioManager';

import ClockHeader from './components/ClockHeader';
import AlarmCard from './components/AlarmCard';
import AlarmEditor from './components/AlarmEditor';
import ActiveAlarmOverlay from './components/ActiveAlarmOverlay';

const LOCAL_STORAGE_KEY = 'liquid_glass_alarms';

// Setup beautiful mock alarm starters for first-time visits
const STARTER_ALARMS: Alarm[] = [
  {
    id: 'starter-1',
    hour: 7,
    minute: 0,
    label: 'Rise & Shine',
    repeatDays: [1, 2, 3, 4, 5], // Monday - Friday
    enabled: true,
    snoozeDuration: 9,
    soundType: 'gentle',
    snoozedUntil: null,
    lastTriggered: null,
  },
  {
    id: 'starter-2',
    hour: 9,
    minute: 30,
    label: 'Weekend Rest',
    repeatDays: [0, 6], // Saturday, Sunday
    enabled: true,
    snoozeDuration: 15,
    soundType: 'gentle',
    snoozedUntil: null,
    lastTriggered: null,
  },
];

export default function App() {
  const [time, setTime] = useState<Date>(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [hideBanner, setHideBanner] = useState<boolean>(false);
  
  // Editor state
  const [editor, setEditor] = useState<{ isOpen: boolean; alarm: Alarm | null }>({
    isOpen: false,
    alarm: null,
  });

  const initialized = useRef(false);

  // 1. Load Alarms from localStorage on Initial Mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Alarm[];
          // Clean/sanitize sTimestamp or triggered blocks on page boot is good practice
          const sanitized = parsed.map(a => ({
            ...a,
            snoozedUntil: a.snoozedUntil && a.snoozedUntil > Date.now() ? a.snoozedUntil : null,
          }));
          setAlarms(sanitized);
        } else {
          // Commit starter alarms to give a satisfying first-use experience
          setAlarms(STARTER_ALARMS);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(STARTER_ALARMS));
        }
      } catch (err) {
        console.error('Failed reading native localStorage data state:', err);
        setAlarms(STARTER_ALARMS);
      }
    }
  }, []);

  // 2. Persist Alarms on mutation
  useEffect(() => {
    if (initialized.current) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(alarms));
    }
  }, [alarms]);

  // 3. Heartbeat Scheduler Loop (Every Second)
  useEffect(() => {
    const intervalTimer = setInterval(() => {
      const now = new Date();
      setTime(now);

      // Extract current matching triggers: Hour, Minute, weekDay
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDayOfWeek = now.getDay();
      
      const blockStr = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())} ${padZero(currentHour)}:${padZero(currentMinute)}`;

      // Skip evaluation if an alarm is already ringing
      if (ringingAlarm) return;

      setAlarms((currentAlarms) => {
        let alarmToRing: Alarm | null = null;
        let updateRequired = false;

        const updatedAlarms = currentAlarms.map((curr) => {
          if (!curr.enabled) return curr;

          let isTriggered = false;

          // Check Snooze timeout first
          if (curr.snoozedUntil && now.getTime() >= curr.snoozedUntil && curr.lastTriggered !== blockStr) {
            isTriggered = true;
          } 
          // Check regular time matching
          else if (curr.hour === currentHour && curr.minute === currentMinute && curr.lastTriggered !== blockStr) {
            if (curr.repeatDays.length === 0) {
              // Single time alarm matches
              isTriggered = true;
            } else if (curr.repeatDays.includes(currentDayOfWeek)) {
              // Regular repeating schedule matches
              isTriggered = true;
            }
          }

          if (isTriggered) {
            alarmToRing = {
              ...curr,
              snoozedUntil: null, // clear active snooze once matching/ringing transitions
              lastTriggered: blockStr,
            };
            updateRequired = true;
            return alarmToRing;
          }

          return curr;
        });

        if (alarmToRing) {
          setRingingAlarm(alarmToRing);
          audioManager.play((alarmToRing as Alarm).soundType);
        }

        return updateRequired ? updatedAlarms : currentAlarms;
      });

    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [ringingAlarm]);

  // 4. Sort Alarms Chronologically by Time for Beautiful Ordering
  const sortedAlarms = [...alarms].sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.minute - b.minute;
  });

  // Calculate remaining timer readout
  const nextAlarmDetails = getNextAlarmDetails(alarms, time);
  const nextAlarmText = nextAlarmDetails ? formatRemainingTime(nextAlarmDetails.remainingMs) : null;

  // Toggle switch trigger
  const handleToggleAlarm = (id: string, enabled: boolean) => {
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            enabled,
            snoozedUntil: null, // reset active snoozes
            lastTriggered: null, // reset double trigger block
          };
        }
        return a;
      })
    );
  };

  // Delete Alarm
  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // Custom Edit Trigger
  const handleEditAlarm = (alarm: Alarm) => {
    setEditor({ isOpen: true, alarm });
  };

  // Custom Add Trigger
  const handleAddAlarm = () => {
    setEditor({ isOpen: true, alarm: null });
  };

  // Save changes from Editor Modal
  const handleSaveAlarm = (alarmData: Omit<Alarm, 'id' | 'enabled' | 'snoozedUntil' | 'lastTriggered'> & { id?: string }) => {
    if (alarmData.id) {
      // Update existing
      setAlarms((prev) =>
        prev.map((a) => {
          if (a.id === alarmData.id) {
            return {
              ...a,
              ...alarmData,
              snoozedUntil: null,  // Clear any active snooze when edited
              lastTriggered: null, // Clear trigger safety block
            } as Alarm;
          }
          return a;
        })
      );
    } else {
      // Create new
      const newAlarm: Alarm = {
        ...alarmData,
        id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        enabled: true,
        snoozedUntil: null,
        lastTriggered: null,
      };
      setAlarms((prev) => [...prev, newAlarm]);
    }
  };

  // Trigger Snooze of active ring
  const handleSnooze = (alarm: Alarm) => {
    audioManager.stop();
    const snoozeTargetMs = Date.now() + alarm.snoozeDuration * 60 * 1000;
    
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === alarm.id) {
          return {
            ...a,
            snoozedUntil: snoozeTargetMs,
          };
        }
        return a;
      })
    );
    setRingingAlarm(null);
  };

  // Dismiss ringing alarm
  const handleDismiss = (alarm: Alarm) => {
    audioManager.stop();
    
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === alarm.id) {
          // If it was a one-time alarm, turn toggle off
          const shouldDisable = a.repeatDays.length === 0;
          return {
            ...a,
            enabled: !shouldDisable,
            snoozedUntil: null,
          };
        }
        return a;
      })
    );
    setRingingAlarm(null);
  };

  const handleTestTrigger = () => {
    const now = new Date();
    const testAlarm: Alarm = {
      id: 'test-alarm-' + Date.now(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      label: 'Demo Instant Trigger Alert',
      repeatDays: [],
      enabled: true,
      snoozeDuration: 1,
      soundType: 'classic',
      snoozedUntil: null,
      lastTriggered: null,
    };
    setRingingAlarm(testAlarm);
    audioManager.play('classic');
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center py-8 px-4 sm:px-8 select-none overflow-x-hidden font-sans text-white"
      style={{
        background: 'radial-gradient(circle at top left, #2e1065, #1e1b4b), radial-gradient(circle at bottom right, #701a75, #1e1b4b)'
      }}
    >
      
      {/* Glassy Background Orbs for Refraction matching Vibrant Palette */}
      <div className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[120px] opacity-20 pointer-events-none select-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[150px] opacity-20 pointer-events-none select-none"></div>

      {/* Primary Main Widescreen Interface Frame */}
      <div className="w-full max-w-[1024px] backdrop-blur-[24px] bg-white/5 border border-white/15 rounded-[40px] shadow-2xl z-10 select-none specular-highlight relative overflow-hidden flex flex-col min-h-[720px] justify-between p-6 sm:p-10">
        
        {/* Subtle glass brand/status indicator */}
        <div className="flex justify-between items-center w-full px-2 mb-4 opacity-60">
          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
            SOLAR ALARM LABS • v1.1.0
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-white/40 tracking-tight">VIBRANT CLOCK ENGINE ACTIVE</span>
          </div>
        </div>

        {/* Dynamic Header */}
        <div className="w-full">
          <ClockHeader time={time} nextAlarmText={nextAlarmText} />
        </div>

        {/* Separator glass border */}
        <div className="h-px w-full bg-white/10 my-6" />

        {/* Dismissible Test Alert Banner */}
        <AnimatePresence>
          {!hideBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, scale: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, scale: 0.95, marginBottom: 0 }}
              className="relative overflow-hidden w-full backdrop-blur-xl bg-indigo-500/10 border border-indigo-400/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none group shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30 animate-pulse">
                  <span className="text-xl">🔔</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">Instant Alarm Testing Mode</h4>
                  <p className="text-xs text-indigo-200/70 mt-0.5 leading-relaxed">
                    To test the Web Audio sound oscillator chimes, haptics, and frosted-glass ringing overlay instantly, tap the trigger button.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleTestTrigger}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold tracking-wider uppercase transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
                >
                  Trigger Test Alarm
                </button>
                <button
                  type="button"
                  onClick={() => setHideBanner(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Dismiss Tip"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alarms Grid Listing Area */}
        <div className="flex-1 flex flex-col gap-5 my-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-display font-semibold tracking-widest text-white/40 uppercase">
              Alarms List ({alarms.length})
            </h3>
            {alarms.length > 0 && (
              <span className="text-[10px] uppercase font-semibold opacity-40 tracking-wider">
                Click any card to modify
              </span>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pr-1">
              {sortedAlarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggleAlarm}
                  onEdit={handleEditAlarm}
                  onDelete={handleDeleteAlarm}
                />
              ))}

              {/* Seamless Add New Alarm dashed card inside grid matching theme design */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 0.7, scale: 1 }}
                whileHover={{ opacity: 1, scale: 1.02 }}
                onClick={handleAddAlarm}
                className="backdrop-blur-[24px] bg-white/5 border border-dashed border-white/20 hover:border-white/40 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[175px] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Plus size={22} className="text-white/60" />
                </div>
                <span className="text-xs font-semibold opacity-50 uppercase tracking-widest">
                  Add Alarm
                </span>
              </motion.div>
            </div>
          </AnimatePresence>

          {/* Fallback Empty State when empty */}
          {alarms.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 px-6 rounded-3xl bg-white/2 border border-white/5 text-center my-2"
            >
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/35 mb-4 shadow-sm">
                <Moon size={20} />
              </div>
              <h4 className="text-sm font-semibold text-white/70">
                All Alarms Inactive
              </h4>
              <p className="text-xs text-white/40 mt-1 max-w-[280px]">
                Create your first customized wake cycle or standard timer block using the grid option above or the primary controller.
              </p>
            </motion.div>
          )}
        </div>

        {/* Separator before interactive footer */}
        <div className="h-px w-full bg-white/5 my-6" />

        {/* Premium Bottom Controls Frame from Vibrant Palette layout */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          {/* Aesthetic tabs structure */}
          <div className="flex gap-6">
            <button 
              type="button"
              onClick={handleAddAlarm}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Plus size={18} className="text-white" />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase opacity-80 text-blue-300 font-display">Alarms</span>
            </button>
            
            <button 
              type="button"
              className="flex flex-col items-center gap-1.5 opacity-45 hover:opacity-100 transition-opacity cursor-not-allowed group"
              title="Workplace module coming soon in custom builds"
              disabled
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform text-white/70">
                <Clock size={16} />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase font-display text-white/60">World</span>
            </button>

            <button 
              type="button"
              className="flex flex-col items-center gap-1.5 opacity-45 hover:opacity-100 transition-opacity cursor-not-allowed group"
              title="Timer block module coming soon"
              disabled
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform text-white/70">
                <HelpCircle size={16} />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase font-display text-white/60">Timer</span>
            </button>
          </div>

          {/* Target sleep indicators matching Vibrant Palette markup */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Sleep Target</div>
              <div className="text-sm font-semibold text-white/90">8h 00m</div>
            </div>
            
            <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-blue-400 rotate-45 flex items-center justify-center">
              <span className="text-[9px] font-bold -rotate-45 block text-sky-300 font-mono">85%</span>
            </div>
          </div>
        </footer>

        {/* Floating Action Button (Vibrant blue glowing orb at bottom-right) */}
        <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-20">
          <button
            id="floating-add-alarm-btn"
            type="button"
            onClick={handleAddAlarm}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.6)] border-t border-white/40 active:scale-95 hover:scale-105 transition-all text-white cursor-pointer"
            title="Create New Alarm"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

      </div>

      {/* Trigger Modal Editor Panel */}
      <AlarmEditor
        isOpen={editor.isOpen}
        alarm={editor.alarm}
        onSave={handleSaveAlarm}
        onClose={() => setEditor({ isOpen: false, alarm: null })}
      />

      {/* Full-Screen Frosted Glass Ringing Alarm Overlay */}
      <ActiveAlarmOverlay
        alarm={ringingAlarm}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
      />
      
    </div>
  );
}
