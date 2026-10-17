// Procedural Web Audio API Adaptive Soundtrack & SFX Synthesizer for "Signal 5"
// Generates a multi-layered Filipino-inspired soundtrack (Kulintang/Bamboo Marimba lead,
// warm island pad chords, bassline, and percussion) that dynamically adapts to the game phase
// and Round 5 Super Typhoon Signal 5. Works 100% offline with zero external audio files.

export type MusicTheme =
  | 'CALM_BARANGAY'
  | 'TENSION_DRILL'
  | 'KALIKASAN_STORM'
  | 'SIGNAL_5_FINALE';

export const MUSIC_THEME_LABELS: Record<MusicTheme, string> = {
  CALM_BARANGAY: 'Umaga sa Barangay (Island Breeze)',
  TENSION_DRILL: 'PAGASA Preparedness Drill',
  KALIKASAN_STORM: 'Bagsik ng Kalikasan (Storm Front)',
  SIGNAL_5_FINALE: 'Super Typhoon Signal No. 5'
};

// Helper: MIDI note number to frequency in Hz
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface ThemePattern {
  bpm: number;
  // 4 chords (16 steps each = 64 steps per full cycle), represented as MIDI note arrays
  chords: number[][];
  // 16-step bassline MIDI notes (0 = rest) for each of the 4 chords
  bass: number[][];
  // 16-step melody MIDI notes (0 = rest) for each of the 4 bars
  melody: number[][];
  // Percussion pattern (16 steps): 'K' = kick, 'S' = shaker, 'W' = woodblock/rim, 'B' = both kick+shaker
  drums: string[];
  padWave: OscillatorType;
  leadWave: OscillatorType;
}

const THEME_PATTERNS: Record<MusicTheme, ThemePattern> = {
  // 1. Warm D-Major / B-Minor Pentatonic Tropical Barangay Theme (Title, Draft, Build R1-R3)
  CALM_BARANGAY: {
    bpm: 106,
    chords: [
      [62, 66, 69, 73], // Dmaj7 (D4, F#4, A4, C#5)
      [59, 62, 66, 69], // Bm7   (B3, D4, F#4, A4)
      [55, 59, 62, 66], // Gmaj7 (G3, B3, D4, F#4)
      [57, 62, 64, 69]  // Asus4/A6 (A3, D4, E4, A4)
    ],
    bass: [
      [38, 0, 0, 38, 0, 0, 45, 0, 38, 0, 0, 42, 0, 45, 0, 0],
      [35, 0, 0, 35, 0, 0, 42, 0, 35, 0, 0, 38, 0, 42, 0, 0],
      [43, 0, 0, 43, 0, 0, 50, 0, 43, 0, 0, 47, 0, 50, 0, 0],
      [45, 0, 0, 45, 0, 0, 52, 0, 45, 0, 40, 0, 45, 0, 52, 0]
    ],
    melody: [
      [74, 0, 78, 0, 81, 0, 78, 74, 0, 76, 0, 74, 71, 0, 69, 0],
      [71, 0, 74, 0, 78, 0, 81, 0, 78, 0, 74, 0, 71, 0, 69, 0],
      [67, 0, 71, 0, 74, 0, 78, 74, 0, 71, 0, 74, 76, 0, 74, 0],
      [76, 0, 74, 0, 69, 0, 71, 74, 0, 76, 78, 0, 74, 0, 0, 0]
    ],
    drums: ['K', '.', 'S', 'W', '.', 'S', 'K', '.', 'K', '.', 'S', 'W', '.', 'S', '.', 'S'],
    padWave: 'triangle',
    leadWave: 'triangle'
  },

  // 2. Tactical Preparedness Pulse in D Dorian (Forecast & Defender Cards)
  TENSION_DRILL: {
    bpm: 118,
    chords: [
      [62, 65, 69, 72], // Dm7 (D4, F4, A4, C5)
      [60, 64, 67, 72], // C   (C4, E4, G4, C5)
      [55, 58, 62, 65], // Gm7 (G3, Bb3, D4, F4)
      [57, 62, 64, 69]  // Asus4 (A3, D4, E4, A4)
    ],
    bass: [
      [38, 0, 38, 0, 45, 0, 38, 0, 38, 0, 45, 0, 50, 0, 45, 0],
      [36, 0, 36, 0, 43, 0, 36, 0, 36, 0, 43, 0, 48, 0, 43, 0],
      [43, 0, 43, 0, 50, 0, 43, 0, 43, 0, 50, 0, 46, 0, 43, 0],
      [45, 0, 45, 0, 52, 0, 45, 0, 45, 0, 40, 0, 43, 0, 45, 0]
    ],
    melody: [
      [74, 0, 69, 74, 0, 77, 0, 76, 74, 0, 72, 0, 69, 0, 0, 0],
      [72, 0, 67, 72, 0, 76, 0, 74, 72, 0, 69, 0, 67, 0, 0, 0],
      [70, 0, 74, 0, 77, 0, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0],
      [69, 0, 74, 0, 76, 0, 77, 0, 76, 0, 74, 0, 73, 0, 69, 0]
    ],
    drums: ['B', 'S', 'W', 'S', 'K', 'S', 'W', 'S', 'B', 'S', 'W', 'S', 'K', 'S', 'W', 'S'],
    padWave: 'triangle',
    leadWave: 'triangle'
  },

  // 3. Kalikasan Storm Front in D Harmonic Minor (Kalikasan Card Phase & Resolve)
  KALIKASAN_STORM: {
    bpm: 128,
    chords: [
      [62, 65, 69, 74], // Dm
      [58, 62, 65, 70], // Bb
      [55, 58, 62, 67], // Gm
      [57, 61, 64, 69]  // A7 (A3, C#4, E4, A4)
    ],
    bass: [
      [38, 38, 0, 38, 45, 0, 38, 0, 38, 38, 0, 45, 50, 0, 45, 0],
      [34, 34, 0, 34, 41, 0, 34, 0, 34, 34, 0, 41, 46, 0, 41, 0],
      [43, 43, 0, 43, 50, 0, 43, 0, 43, 43, 0, 50, 46, 0, 43, 0],
      [33, 33, 0, 33, 40, 0, 45, 0, 33, 33, 0, 40, 49, 0, 45, 0]
    ],
    melody: [
      [74, 77, 74, 69, 0, 74, 77, 81, 0, 77, 74, 70, 69, 0, 0, 0],
      [70, 74, 70, 65, 0, 70, 74, 77, 0, 74, 70, 69, 65, 0, 0, 0],
      [67, 70, 74, 79, 0, 77, 74, 70, 0, 74, 70, 67, 65, 0, 0, 0],
      [69, 73, 76, 81, 0, 79, 76, 73, 0, 76, 73, 69, 73, 0, 76, 0]
    ],
    drums: ['B', 'S', 'K', 'S', 'W', 'S', 'K', 'S', 'B', 'S', 'K', 'K', 'W', 'S', 'K', 'S'],
    padWave: 'sawtooth',
    leadWave: 'triangle'
  },

  // 4. Super Typhoon Signal 5 Finale Anthem (Round 5 & Signal 5 Landfall)
  SIGNAL_5_FINALE: {
    bpm: 142,
    chords: [
      [62, 65, 69, 74], // Dm
      [55, 58, 62, 67], // Gm
      [58, 62, 65, 70], // Bb
      [57, 61, 64, 69]  // A7
    ],
    bass: [
      [38, 38, 50, 38, 38, 50, 38, 45, 38, 38, 50, 38, 45, 38, 50, 45],
      [43, 43, 55, 43, 43, 55, 43, 50, 43, 43, 55, 43, 50, 43, 55, 50],
      [34, 34, 46, 34, 34, 46, 34, 41, 34, 34, 46, 34, 41, 34, 46, 41],
      [33, 33, 45, 33, 33, 45, 33, 40, 33, 37, 40, 45, 49, 45, 40, 37]
    ],
    melody: [
      [86, 0, 81, 77, 74, 0, 81, 0, 86, 0, 88, 86, 81, 0, 77, 0],
      [82, 0, 79, 74, 70, 0, 79, 0, 82, 0, 86, 82, 79, 0, 74, 0],
      [77, 0, 74, 70, 74, 0, 77, 0, 82, 0, 81, 77, 74, 0, 70, 0],
      [73, 0, 76, 79, 81, 0, 76, 0, 81, 0, 85, 81, 88, 0, 85, 0]
    ],
    drums: ['B', 'S', 'K', 'S', 'W', 'S', 'B', 'S', 'B', 'S', 'K', 'K', 'W', 'S', 'B', 'W'],
    padWave: 'sawtooth',
    leadWave: 'sawtooth'
  }
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicMasterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  public muted = false;
  private currentTheme: MusicTheme = 'CALM_BARANGAY';
  private stepTimer: number | null = null;
  private currentStep = 0; // 0..63 (4 bars of 16 sixteenth notes)
  private isPlayingMusic = false;
  private unlockBound = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindFirstInteractionUnlock();
    }
  }

  private bindFirstInteractionUnlock(): void {
    if (this.unlockBound) return;
    this.unlockBound = true;

    const unlock = () => {
      if (!this.muted) {
        this.startMusicLoop();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupAudioGraph(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupAudioGraph(ctx: AudioContext): void {
    // Master Music Gain Bus
    this.musicMasterGain = ctx.createGain();
    this.musicMasterGain.gain.setValueAtTime(0.28, ctx.currentTime);
    this.musicMasterGain.connect(ctx.destination);

    // Warm Stereo Delay / Echo Bus for Kulintang Marimba & Pads
    const delay = ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.27, ctx.currentTime);

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.26, ctx.currentTime);

    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(1750, ctx.currentTime);

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.24, ctx.currentTime);

    delay.connect(toneFilter);
    toneFilter.connect(feedback);
    feedback.connect(delay);
    toneFilter.connect(wetGain);
    wetGain.connect(this.musicMasterGain);

    this.delayNode = delay;

    // Pre-generate 1 second of white noise for percussion & weather SFX
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public getTheme(): MusicTheme {
    return this.currentTheme;
  }

  public setMusicTheme(theme: MusicTheme): void {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    // Restart step timer at new theme's BPM seamlessly
    if (this.isPlayingMusic && !this.muted) {
      this.scheduleNextTick();
    }
  }

  public cycleMusicTheme(): MusicTheme {
    const order: MusicTheme[] = [
      'CALM_BARANGAY',
      'TENSION_DRILL',
      'KALIKASAN_STORM',
      'SIGNAL_5_FINALE'
    ];
    const nextIdx = (order.indexOf(this.currentTheme) + 1) % order.length;
    this.setMusicTheme(order[nextIdx]);
    return this.currentTheme;
  }

  // ============================================================================
  // SYNTHESIZED MUSICAL VOICES (Kulintang/Marimba, Warm Pad, Bass, Percussion)
  // ============================================================================

  private playMarimbaNote(ctx: AudioContext, midi: number, wave: OscillatorType): void {
    if (!this.musicMasterGain) return;
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    // Fundamental oscillator
    const osc = ctx.createOscillator();
    osc.type = wave === 'sawtooth' ? 'triangle' : wave;
    osc.frequency.setValueAtTime(freq, now);

    // woody 4th-harmonic overtone for authentic bamboo marimba / kulintang attack
    const overtone = ctx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 4, now);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.14, now + 0.008);
    mainGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.36);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.045, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.065);

    osc.connect(mainGain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(mainGain);

    mainGain.connect(this.musicMasterGain);
    if (this.delayNode) {
      mainGain.connect(this.delayNode);
    }

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.38);
    overtone.stop(now + 0.08);
  }

  private playPadChord(
    ctx: AudioContext,
    midiNotes: number[],
    durationSec: number,
    wave: OscillatorType
  ): void {
    if (!this.musicMasterGain) return;
    const now = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(wave === 'sawtooth' ? 880 : 1200, now);

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.001, now);
    chordGain.gain.linearRampToValueAtTime(0.045, now + 0.25);
    chordGain.gain.setValueAtTime(0.042, now + Math.max(0.3, durationSec - 0.35));
    chordGain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

    filter.connect(chordGain);
    chordGain.connect(this.musicMasterGain);
    if (this.delayNode) {
      chordGain.connect(this.delayNode);
    }

    midiNotes.forEach((midi, i) => {
      const osc = ctx.createOscillator();
      osc.type = wave;
      // Slight chorus detune for warmth
      osc.frequency.setValueAtTime(midiToFreq(midi), now);
      osc.detune.setValueAtTime((i % 2 === 0 ? 1 : -1) * 4, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    });
  }

  private playBassNote(ctx: AudioContext, midi: number, stepSec: number): void {
    if (!this.musicMasterGain) return;
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.5, now);

    const gain = ctx.createGain();
    const dur = stepSec * 1.85;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.musicMasterGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + dur + 0.02);
    sub.stop(now + dur + 0.02);
  }

  private playPercussion(ctx: AudioContext, code: string): void {
    if (!this.musicMasterGain || code === '.') return;
    const now = ctx.currentTime;

    // Soft Kick ('K' or 'B')
    if (code === 'K' || code === 'B') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(118, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.musicMasterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // Bamboo Shaker ('S' or 'B')
    if ((code === 'S' || code === 'B') && this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5200, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicMasterGain);
      noise.start(now, Math.random() * 0.5, 0.05);
    }

    // Woodblock / Rim Clave ('W')
    if (code === 'W') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.035);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(this.musicMasterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  private scheduleNextTick(): void {
    if (this.stepTimer !== null) {
      window.clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.muted || !this.isPlayingMusic) return;

    const pattern = THEME_PATTERNS[this.currentTheme];
    // 1 sixteenth note duration in ms = (60 / bpm / 4) * 1000
    const stepMs = (60 / pattern.bpm / 4) * 1000;
    const stepSec = stepMs / 1000;

    this.stepTimer = window.setTimeout(() => {
      if (this.muted || !this.isPlayingMusic) return;
      const ctx = this.getContext();
      if (ctx) {
        const barIndex = Math.floor(this.currentStep / 16) % 4;
        const stepInBar = this.currentStep % 16;

        // 1. Trigger warm pad chord on beat 0 of each 16-step bar
        if (stepInBar === 0) {
          this.playPadChord(
            ctx,
            pattern.chords[barIndex],
            stepSec * 15.8,
            pattern.padWave
          );
        }

        // 2. Trigger bass note if present
        const bassMidi = pattern.bass[barIndex][stepInBar];
        if (bassMidi > 0) {
          this.playBassNote(ctx, bassMidi, stepSec);
        }

        // 3. Trigger Kulintang / Marimba lead note if present
        const melodyMidi = pattern.melody[barIndex][stepInBar];
        if (melodyMidi > 0) {
          this.playMarimbaNote(ctx, melodyMidi, pattern.leadWave);
        }

        // 4. Trigger Percussion
        const drumCode = pattern.drums[stepInBar];
        if (drumCode) {
          this.playPercussion(ctx, drumCode);
        }

        this.currentStep = (this.currentStep + 1) % 64;
      }

      this.scheduleNextTick();
    }, stepMs);
  }

  public startMusicLoop(): void {
    if (this.muted) return;
    this.getContext();
    if (this.isPlayingMusic && this.stepTimer !== null) return;
    this.isPlayingMusic = true;
    this.scheduleNextTick();
  }

  public stopMusicLoop(): void {
    this.isPlayingMusic = false;
    if (this.stepTimer !== null) {
      window.clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusicLoop();
    } else {
      this.startMusicLoop();
    }
    return this.muted;
  }

  // ============================================================================
  // SOUND EFFECTS (SFX)
  // ============================================================================

  /**
   * Playful, tactile popping sound synthesized for each entering tile.
   * Features a fast upward-pitch chirp with a clean transient attack,
   * mapped across an ascending pentatonic arpeggio (D-Major / B-Minor)
   * with micro-variation to create a lively, musical cascading ripple.
   */
  public playTilePop(index = 0, total = 52, isSea = false): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const norm = Math.max(0, Math.min(1, index / Math.max(1, total - 1)));

    // Pentatonic scale degrees in D-Major / B-Minor pentatonic: [D, E, F#, A, B]
    // Matches the game's Umaga sa Barangay theme.
    // Progressively ascends across ~4.8 octaves from deep sea (A2/D3) to central plaza (D6).
    const PENTATONIC = [0, 2, 4, 7, 9];
    const totalSteps = 24;
    const stepIdx = Math.floor(norm * totalSteps);
    const octave = Math.floor(stepIdx / 5);
    const semitone = PENTATONIC[stepIdx % 5];
    const baseMidi = (isSea ? 45 : 50) + octave * 12 + semitone;
    const jitter = 1 + (Math.random() - 0.5) * 0.04;
    const targetFreq = midiToFreq(baseMidi) * jitter;

    // 1. Resonant Bubble/Pop Body (sine oscillator with upward pitch chirp)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    // Upward pitch bend (classic "pop / bloop" envelope)
    const startFreq = targetFreq * (isSea ? 0.65 : 0.72);
    const peakFreq = targetFreq * (isSea ? 1.38 : 1.48);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.022);
    osc.frequency.exponentialRampToValueAtTime(targetFreq * 0.98, now + 0.055);

    const bodyVol = isSea ? 0.08 : 0.095;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(bodyVol, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + (isSea ? 0.075 : 0.065));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // 2. Tactile transient click (crisp wood / bubble snap)
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = isSea ? 'sine' : 'triangle';
    click.frequency.setValueAtTime(targetFreq * (isSea ? 2.5 : 3.2), now);
    click.frequency.exponentialRampToValueAtTime(targetFreq * 1.5, now + 0.016);

    const clickVol = isSea ? 0.028 : 0.045;
    clickGain.gain.setValueAtTime(clickVol, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.02);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.025);
  }

  public playCard(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.11);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playBuild(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [293.66, 369.99, 440.0, 587.33].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.14, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.17);
    });
  }

  public playFire(): void {
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now, 0, 0.4);
  }

  public playRain(): void {
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + 0.48);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now, 0, 0.5);
  }

  public playRescue(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.075);
      gain.gain.setValueAtTime(0.14, now + i * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.075);
      osc.stop(now + i * 0.075 + 0.26);
    });
  }

  public playSignal5Siren(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.45);
    osc.frequency.linearRampToValueAtTime(440, now + 0.9);
    osc.frequency.linearRampToValueAtTime(880, now + 1.35);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.58);
  }
}

export const soundFX = new SoundManager();
