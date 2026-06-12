/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function ToggleSwitch({ id, checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // Prevent card tap
        onChange(!checked);
      }}
      className={`relative w-12 h-7 rounded-full p-0.5 cursor-pointer transition-colors duration-300 outline-none select-none focus:ring-2 focus:ring-white/30 ${
        checked 
          ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
          : 'bg-white/10 border border-white/5'
      }`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-6 h-6 rounded-full shadow-md bg-white ${
          checked ? 'ml-5' : 'ml-0'
        }`}
      />
    </button>
  );
}
