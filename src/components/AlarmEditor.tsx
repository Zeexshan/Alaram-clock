/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronUp, ChevronDown, Check, Info } from 'lucide-react';
import { Alarm, SoundType, SOUND_PRESETS } from '../types';
import DaySelector from './DaySelector';
import { padZero } from '../lib/utils';

interface AlarmEditorProps {
  isOpen: boolean;
  alarm: Alarm | null; // Null means we are creating a new alarm
  onSave: (alarmData: Omit<Alarm, 'id' | 'enabled' | 'snoozedUntil' | 'lastTriggered'> & { id?: string }) => void;
  onClose: () => void;
}

export default function AlarmEditor({ isOpen, alarm, onSave, onClose }: AlarmEditorProps) {
  const [hour, setHour] = useState<number>(7);
  const [minute, setMinute] = useState<number>(0);
  const [label, setLabel] = useState<string>('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(9);
  const [soundType, setSoundType] = useState<SoundType>('gentle');

  // Populate state when opening
  useEffect(() => {
    if (isOpen) {
      if (alarm) {
        setHour(alarm.hour);
        setMinute(alarm.minute);
        setLabel(alarm.label);
        setRepeatDays(alarm.repeatDays || []);
        setSnoozeDuration(alarm.snoozeDuration || 9);
        setSoundType(alarm.soundType || 'gentle');
      } else {
        // Set smart default: current hour + 1 or default morning
        const d = new Date();
        setHour(d.getHours());
        setMinute(d.getMinutes());
        setLabel('');
        setRepeatDays([]);
        setSnoozeDuration(9);
        setSoundType('gentle');
      }
    }
  }, [isOpen, alarm]);

  if (!isOpen) return null;

  // Handle Hour adjustments
  const incrementHour = () => setHour((h) => (h + 1) % 24);
  const decrementHour = () => setHour((h) => (h - 1 + 24) % 24);
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setHour(Math.min(Math.max(val, 0), 23));
    } else {
      setHour(0);
    }
  };

  // Handle Minute adjustments
  const incrementMinute = () => setMinute((m) => (m + 1) % 60);
  const decrementMinute = () => setMinute((m) => (m - 1 + 60) % 60);
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setMinute(Math.min(Math.max(val, 0), 59));
    } else {
      setMinute(0);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: alarm?.id,
      hour,
      minute,
      label: label.trim(),
      repeatDays,
      snoozeDuration,
      soundType,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="alarm-editor-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="alarm-editor-container"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="glass-panel-heavy specular-highlight w-full max-w-md rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <h3 className="text-xl font-display font-semibold tracking-tight text-white">
              {alarm ? 'Edit Alarm' : 'New Alarm'}
            </h3>
            <button
              id="close-editor-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable form inside */}
          <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {/* Time Picker Controls */}
            <div className="flex flex-col items-center">
              <label className="text-[11px] font-semibold text-white/40 tracking-widest uppercase mb-3">
                Select Time
              </label>
              
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                {/* Hour selection */}
                <div className="flex flex-col items-center gap-1.5 w-18">
                  <button
                    id="inc-hour-btn"
                    type="button"
                    onClick={incrementHour}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronUp size={20} />
                  </button>
                  <input
                    id="hour-textbox"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={padZero(hour)}
                    onChange={handleHourChange}
                    className="w-full text-center font-mono text-4xl font-bold bg-transparent border-0 outline-none text-white focus:ring-0 select-all"
                  />
                  <button
                    id="dec-hour-btn"
                    type="button"
                    onClick={decrementHour}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Separator colon */}
                <span className="font-mono text-4xl font-bold text-white/40 select-none pb-2 animate-pulse-slow">:</span>

                {/* Minute selection */}
                <div className="flex flex-col items-center gap-1.5 w-18">
                  <button
                    id="inc-min-btn"
                    type="button"
                    onClick={incrementMinute}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronUp size={20} />
                  </button>
                  <input
                    id="minute-textbox"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={padZero(minute)}
                    onChange={handleMinuteChange}
                    className="w-full text-center font-mono text-4xl font-bold bg-transparent border-0 outline-none text-white focus:ring-0 select-all"
                  />
                  <button
                    id="dec-min-btn"
                    type="button"
                    onClick={decrementMinute}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Quick AM/PM feedback preview */}
                <div className="flex flex-col justify-center items-center ml-2 border-l border-white/10 pl-4 h-16">
                  <span className={`text-xs font-bold tracking-wider ${hour >= 12 ? 'text-white/40' : 'text-emerald-400'}`}>AM</span>
                  <span className={`text-xs font-bold tracking-wider ${hour >= 12 ? 'text-emerald-400' : 'text-white/40'}`}>PM</span>
                </div>
              </div>
            </div>

            {/* Label Row */}
            <div className="flex flex-col gap-2">
              <label htmlFor="alarm-label-input" className="text-[11px] font-semibold text-white/40 tracking-widest uppercase">
                Alarm Label
              </label>
              <input
                id="alarm-label-input"
                type="text"
                maxLength={25}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Wake up, Gym, Meditate..."
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
              />
            </div>

            {/* Repeat Selector Row */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[11px] font-semibold text-white/40 tracking-widest uppercase">
                  Repeat Weekly
                </label>
                {repeatDays.length === 0 && (
                  <span className="text-[10px] text-amber-300 flex items-center gap-1">
                    <Info size={10} /> Will play once, then auto-disable
                  </span>
                )}
              </div>
              <DaySelector id="weekly-day-selector" selectedDays={repeatDays} onChange={setRepeatDays} />
            </div>

            {/* Sound Preset Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-white/40 tracking-widest uppercase">
                Alarm Sound
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                {SOUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    id={`sound-preset-${preset.id}`}
                    type="button"
                    onClick={() => setSoundType(preset.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl text-left border cursor-pointer select-none transition-all ${
                      soundType === preset.id
                        ? 'bg-white/10 border-white text-white'
                        : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-medium">{preset.name}</h4>
                      <p className="text-[11px] opacity-60 mt-0.5">{preset.description}</p>
                    </div>
                    {soundType === preset.id && (
                      <div className="w-5 h-5 bg-white text-slate-900 rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Snooze Duration Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-white/40 tracking-widest uppercase">
                Snooze Interval
              </label>
              
              <div className="flex gap-2">
                {[1, 5, 9, 15].map((mins) => (
                  <button
                    key={mins}
                    id={`snooze-duration-${mins}`}
                    type="button"
                    onClick={() => setSnoozeDuration(mins)}
                    className={`flex-1 py-2.5 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                      snoozeDuration === mins
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/8'
                    }`}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>

            {/* Save & Cancel Row */}
            <div className="flex gap-3 pt-4">
              <button
                id="cancel-save-btn"
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold tracking-wide transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                id="submit-save-btn"
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold tracking-wide transition-all duration-300 scale-100 hover:scale-[1.02] shadow-[0_4px_20px_rgba(56,189,248,0.3)] active:scale-95 cursor-pointer"
              >
                Save Alarm
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
