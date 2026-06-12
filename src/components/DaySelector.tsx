/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface DaySelectorProps {
  id: string;
  selectedDays: number[]; // Array of active days (0 = Sunday... 6 = Saturday)
  onChange: (days: number[]) => void;
}

const DAYS_SHORT_LABEL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_FULL_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DaySelector({ id, selectedDays, onChange }: DaySelectorProps) {
  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      onChange(selectedDays.filter((d) => d !== dayIndex));
    } else {
      onChange([...selectedDays, dayIndex]);
    }
  };

  return (
    <div id={id} className="flex justify-between items-center w-full gap-1.5 py-1">
      {DAYS_SHORT_LABEL.map((label, index) => {
        const isSelected = selectedDays.includes(index);
        return (
          <button
            id={`day-btn-${index}`}
            key={index}
            type="button"
            title={DAYS_FULL_NAME[index]}
            onClick={() => toggleDay(index)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm font-medium transition-all duration-200 outline-none select-none ${
              isSelected
                ? 'bg-white text-slate-900 border border-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)] scale-110'
                : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
