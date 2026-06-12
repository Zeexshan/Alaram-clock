/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Alarm } from '../types';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Cleanly format repeat summary text
 */
export function getRepeatDaysLabel(repeatDays: number[]): string {
  if (repeatDays.length === 0) {
    return 'One-time';
  }
  if (repeatDays.length === 7) {
    return 'Every day';
  }
  
  const isWeekdays = repeatDays.length === 5 && 
    [1, 2, 3, 4, 5].every(d => repeatDays.includes(d));
  if (isWeekdays) {
    return 'Weekdays';
  }

  const isWeekends = repeatDays.length === 2 && 
    [0, 6].every(d => repeatDays.includes(d));
  if (isWeekends) {
    return 'Weekends';
  }

  // Individual days ordered custom
  const sorted = [...repeatDays].sort((a, b) => a - b);
  return sorted.map(d => DAYS_SHORT[d]).join(', ');
}

/**
 * Pad a number with leading zeroes
 */
export function padZero(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Format 24 hour to 12 hour presentation object
 */
export function formatTime12h(hour: number, minute: number): { timeStr: string; ampm: string } {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let formattedHour = hour % 12;
  if (formattedHour === 0) formattedHour = 12;
  return {
    timeStr: `${formattedHour}:${padZero(minute)}`,
    ampm,
  };
}

/**
 * Return remaining millisecond duration to nearest upcoming enabled alarm
 */
export function getNextAlarmDetails(alarms: Alarm[], now: Date): { alarm: Alarm; triggerTime: Date; remainingMs: number } | null {
  const enabledAlarms = alarms.filter(a => a.enabled);
  if (enabledAlarms.length === 0) return null;

  let nearestTargetDate: Date | null = null;
  let nearestAlarm: Alarm | null = null;

  for (const alarm of enabledAlarms) {
    let alarmTargetDate: Date | null = null;

    // A. Check if currently snoozed (supercedes scheduling)
    if (alarm.snoozedUntil) {
      const snoozeDate = new Date(alarm.snoozedUntil);
      if (snoozeDate > now) {
        alarmTargetDate = snoozeDate;
      }
    }

    if (!alarmTargetDate) {
      if (alarm.repeatDays.length === 0) {
        // B. One-time alarm calculation
        const todayAtTime = new Date(now);
        todayAtTime.setHours(alarm.hour, alarm.minute, 0, 0);

        if (todayAtTime > now) {
          alarmTargetDate = todayAtTime;
        } else {
          const tomorrowAtTime = new Date(todayAtTime);
          tomorrowAtTime.setDate(tomorrowAtTime.getDate() + 1);
          alarmTargetDate = tomorrowAtTime;
        }
      } else {
        // C. Repeating alarm Day Walk calculation
        let minDiffDays = 8; // Max day walk is to next week (up to 7 days)
        const currentDayOfW = now.getDay();

        // Check each repeating day
        for (const targetDayOfW of alarm.repeatDays) {
          let diffDays = targetDayOfW - currentDayOfW;
          
          if (diffDays === 0) {
            // Check if alarm time already passed today
            const testDate = new Date(now);
            testDate.setHours(alarm.hour, alarm.minute, 0, 0);
            if (testDate > now) {
              diffDays = 0;
            } else {
              diffDays = 7; // Next week
            }
          } else if (diffDays < 0) {
            diffDays += 7; // Next week
          }

          if (diffDays < minDiffDays) {
            minDiffDays = diffDays;
          }
        }

        const calculatedDate = new Date(now);
        calculatedDate.setDate(calculatedDate.getDate() + minDiffDays);
        calculatedDate.setHours(alarm.hour, alarm.minute, 0, 0);
        alarmTargetDate = calculatedDate;
      }
    }

    if (alarmTargetDate) {
      if (!nearestTargetDate || alarmTargetDate < nearestTargetDate) {
        nearestTargetDate = alarmTargetDate;
        nearestAlarm = alarm;
      }
    }
  }

  if (nearestAlarm && nearestTargetDate) {
    return {
      alarm: nearestAlarm,
      triggerTime: nearestTargetDate,
      remainingMs: nearestTargetDate.getTime() - now.getTime(),
    };
  }

  return null;
}

/**
 * Format milliseconds remaining into human-readable Xh Ym
 */
export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) return 'firing...';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
