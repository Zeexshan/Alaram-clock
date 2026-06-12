/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundType } from '../types';

class AudioManager {
  private ctx: AudioContext | null = null;
  private timer: any = null;
  private currentSoundType: SoundType | null = null;
  private masterGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public play(type: SoundType) {
    try {
      this.stop();
      const ctx = this.initCtx();
      this.currentSoundType = type;

      // Master gain for clean fade/stop
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
      this.masterGain.connect(ctx.destination);

      let step = 0;

      if (type === 'classic') {
        // Simple pulsing double mono-frequency beep
        // 880Hz sine wave pulsing twice a second
        this.timer = setInterval(() => {
          if (!this.ctx || !this.masterGain) return;
          const now = this.ctx.currentTime;
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, now);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
          gain.gain.setValueAtTime(0.5, now + 0.15);
          gain.gain.linearRampToValueAtTime(0, now + 0.18);
          
          osc.connect(gain);
          gain.connect(this.masterGain);
          
          osc.start(now);
          osc.stop(now + 0.2);
        }, 500);

      } else if (type === 'gentle') {
        // Rich sweet pentatonic melody that feels peaceful but notice-worthy
        // A, C#, E, G#, A
        const notes = [440.00, 554.37, 659.25, 830.61, 880.00];
        
        this.timer = setInterval(() => {
          if (!this.ctx || !this.masterGain) return;
          const now = this.ctx.currentTime;
          
          const o1 = this.ctx.createOscillator();
          const o2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          // Arpeggiate
          const noteIndex = step % notes.length;
          const baseFreq = notes[noteIndex];
          
          o1.type = 'sine';
          o1.frequency.setValueAtTime(baseFreq, now);
          
          o2.type = 'triangle';
          o2.frequency.setValueAtTime(baseFreq * 2, now); // Sweet sub-harmonic octave
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
          
          o1.connect(gain);
          o2.connect(gain);
          gain.connect(this.masterGain);
          
          o1.start(now);
          o2.start(now);
          o1.stop(now + 0.8);
          o2.stop(now + 0.8);
          
          step++;
        }, 350);

      } else if (type === 'urgent') {
        // High intensity dual-tone ringing alarm pulses
        this.timer = setInterval(() => {
          if (!this.ctx || !this.masterGain) return;
          const now = this.ctx.currentTime;
          
          // Quick double chirp
          for (let i = 0; i < 2; i++) {
            const startOffset = i * 0.15;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(1000, now + startOffset);
            o.frequency.linearRampToValueAtTime(1400, now + startOffset + 0.08); // brief frequency sweep
            
            g.gain.setValueAtTime(0, now + startOffset);
            g.gain.linearRampToValueAtTime(0.6, now + startOffset + 0.01);
            g.gain.setValueAtTime(0.6, now + startOffset + 0.06);
            g.gain.linearRampToValueAtTime(0.0001, now + startOffset + 0.09);
            
            o.connect(g);
            g.connect(this.masterGain);
            
            o.start(now + startOffset);
            o.stop(now + startOffset + 0.1);
          }
          
          step++;
        }, 600);
      }

    } catch (e) {
      console.error("AudioManager Play Error:", e);
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.masterGain) {
      try {
        if (this.ctx) {
          this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        }
      } catch (err) {
        console.warn("Error fading out alarm:", err);
      }
      this.masterGain = null;
    }
    this.currentSoundType = null;
  }
}

export const audioManager = new AudioManager();
