export class AudioSys {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicTimer = null;
    this.musicMode = 'title';
    this.step = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.musicTimer) this.startMusic();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  now() { return this.ctx ? this.ctx.currentTime : 0; }

  tone(freq = 440, dur = 0.08, type = 'square', gain = 0.04, when = 0, slide = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.now() + when;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur = 0.1, gain = 0.04, when = 0, filterFreq = 900) {
    if (!this.ctx || !this.enabled) return;
    const t = this.now() + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(amp).connect(this.ctx.destination);
    src.start(t);
  }

  voice(speaker = 'tony') {
    if (!this.ctx || !this.enabled) return;
    const jitter = () => 0.92 + Math.random() * 0.16;
    const patterns = {
      // pitched syllable-like bursts: low Jersey grumble, nasal teen, frantic George, sliding Kramer, etc.
      tony: () => {
        this.tone(92 * jitter(), .07, 'sawtooth', .052, 0, -22);
        this.tone(74 * jitter(), .055, 'sawtooth', .04, .055, -14);
      },
      aj: () => {
        this.tone(178 * jitter(), .045, 'square', .034, 0, 28);
        this.tone(145 * jitter(), .04, 'square', .025, .045, -8);
      },
      carmela: () => {
        this.tone(222 * jitter(), .045, 'triangle', .034, 0, 18);
        this.tone(248 * jitter(), .04, 'triangle', .025, .04, -12);
      },
      augustus: () => {
        this.tone(126 * jitter(), .075, 'sawtooth', .048, 0, 28);
        this.tone(188 * jitter(), .05, 'triangle', .026, .06, 18);
      },
      christopher: () => {
        this.tone(150 * jitter(), .045, 'square', .04, 0, -10);
        this.noise(.025, .012, .02, 1400);
      },
      jerry: () => {
        this.tone(190 * jitter(), .04, 'triangle', .034, 0, 18);
        this.tone(226 * jitter(), .035, 'triangle', .022, .04, -10);
      },
      george: () => {
        this.tone(140 * jitter(), .035, 'square', .046, 0, 35);
        this.tone(118 * jitter(), .045, 'square', .038, .035, -22);
      },
      kramer: () => {
        this.tone(108 * jitter(), .09, 'sawtooth', .044, 0, 55);
        this.noise(.035, .015, .02, 1800);
      },
      elaine: () => {
        this.tone(230 * jitter(), .04, 'triangle', .034, 0, 16);
        this.tone(205 * jitter(), .04, 'triangle', .026, .038, -8);
      },
      paulie: () => {
        this.tone(104 * jitter(), .065, 'square', .052, 0, -24);
        this.noise(.045, .018, .015, 900);
      },
      bobby: () => {
        this.tone(94 * jitter(), .065, 'triangle', .045, 0, -12);
        this.tone(86 * jitter(), .05, 'triangle', .03, .05, -8);
      },
      artie: () => [148, 166].forEach((f, i) => this.tone(f * jitter(), .045, 'triangle', .03, i * .045, 8)),
      irina: () => [205, 232].forEach((f, i) => this.tone(f * jitter(), .04, 'triangle', .028, i * .04, 12)),
      junior: () => {
        this.tone(84 * jitter(), .08, 'sawtooth', .055, 0, -30);
        this.noise(.05, .018, .025, 700);
      },
      meadow: () => [212, 244].forEach((f, i) => this.tone(f * jitter(), .04, 'triangle', .026, i * .04, 10)),
      melfi: () => this.tone(176 * jitter(), .06, 'sine', .032, 0, -8),
      plav: () => {
        this.tone(164 * jitter(), .035, 'square', .032, 0, 40);
        this.tone(196 * jitter(), .03, 'square', .024, .032, 30);
      },
      janice: () => {
        this.tone(218 * jitter(), .055, 'sawtooth', .038, 0, 24);
        this.tone(238 * jitter(), .045, 'sawtooth', .028, .05, 18);
      }
    };
    if (patterns[speaker]) {
      patterns[speaker]();
      return;
    }
    if (speaker?.startsWith('woman')) {
      this.tone((195 + Math.random() * 40) * jitter(), .045, 'triangle', .03, 0, 12);
      return;
    }
    const fallback = speaker === 'system' ? 240 : 145;
    this.tone(fallback * jitter(), .05, speaker === 'system' ? 'sine' : 'triangle', speaker === 'system' ? .025 : .03, 0, 0);
  }

  sfx(name) {
    if (!this.ctx || !this.enabled) return;
    if (name === 'confirm') {
      this.tone(520, .07, 'square', .035);
      this.tone(780, .08, 'square', .025, .06);
    } else if (name === 'denied') {
      this.tone(140, .11, 'sawtooth', .05, 0, -55);
    } else if (name === 'pickup') {
      this.tone(620, .055, 'triangle', .04);
      this.tone(930, .07, 'triangle', .035, .045);
    } else if (name === 'smash') {
      this.noise(.12, .08, 0, 450);
      this.tone(90, .11, 'sawtooth', .07, 0, -35);
    } else if (name === 'crash') {
      this.noise(.28, .12, 0, 700);
      this.tone(70, .22, 'sawtooth', .09, 0, -28);
    } else if (name === 'honk') {
      this.tone(310, .12, 'square', .05);
      this.tone(310, .1, 'square', .04, .13);
    } else if (name === 'door') {
      this.noise(.08, .03, 0, 1200);
      this.tone(180, .08, 'triangle', .025, .025);
    } else if (name === 'success') {
      [392, 494, 587, 784].forEach((f, i) => this.tone(f, .09, 'square', .032, i * .07));
    } else if (name === 'turkey') {
      for (let i = 0; i < 4; i++) this.tone(350 + Math.random() * 160, .045, 'sawtooth', .025, i * .045, 120);
    } else if (name === 'splash') {
      this.noise(.18, .045, 0, 1800);
    } else if (name === 'phone') {
      for (let i = 0; i < 2; i++) {
        this.tone(880, .12, 'sine', .035, i * .28);
        this.tone(1174, .12, 'sine', .03, i * .28);
      }
    }
  }

  setMusic(mode) {
    this.musicMode = mode;
    this.step = 0;
  }

  startMusic() {
    if (this.musicTimer) return;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
      const s = this.step++;
      const modes = {
        title: [196, 0, 247, 294, 330, 294, 247, 0],
        house: [196, 0, 220, 0, 262, 0, 220, 0],
        rome: [147, 165, 196, 220, 196, 165, 147, 0],
        dream: [330, 311, 294, 262, 247, 220, 196, 165],
        drive: [110, 110, 131, 110, 165, 147, 131, 98],
        apartment: [220, 0, 262, 330, 262, 0, 220, 0],
        club: [98, 0, 123, 98, 147, 123, 165, 0],
        ending: [262, 330, 392, 523, 392, 330, 262, 0]
      };
      const seq = modes[this.musicMode] || modes.house;
      const root = seq[s % seq.length];
      if (root) {
        this.tone(root, .12, 'triangle', .018);
        this.tone(root * 1.5, .09, 'sine', .007, .018);
        if (s % 4 === 0) this.tone(root / 2, .22, 'sine', .018);
        if (s % 8 === 6) this.tone(root * 2, .11, 'triangle', .009, .02);
      }
      if ((this.musicMode === 'drive' || this.musicMode === 'club') && s % 2 === 0) this.noise(.035, .012, 0, 2800);
      if (this.musicMode === 'drive' && s % 4 === 1) this.tone(55, .16, 'sawtooth', .012, 0, 8);
      if (this.musicMode === 'house' && s % 5 === 0) this.noise(.025, .006, 0, 520);
      if (this.musicMode === 'rome' && s % 7 === 2) this.noise(.055, .006, 0, 720);
      if (this.musicMode === 'apartment' && s % 9 === 4) this.tone(520, .035, 'sine', .006, 0, -80);
    }, 180);
  }
}
