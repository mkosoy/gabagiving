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
    const profiles = {
      tony: [92, 'sawtooth', 0.055, -24],
      aj: [168, 'square', 0.035, 18],
      carmela: [210, 'triangle', 0.035, 10],
      augustus: [126, 'sawtooth', 0.05, 30],
      christopher: [146, 'square', 0.042, -8],
      jerry: [184, 'triangle', 0.038, 8],
      george: [132, 'square', 0.048, -16],
      kramer: [116, 'sawtooth', 0.046, 38],
      elaine: [225, 'triangle', 0.038, 14],
      paulie: [108, 'square', 0.05, -20],
      bobby: [96, 'triangle', 0.05, -12],
      artie: [150, 'triangle', 0.042, 8],
      irina: [205, 'triangle', 0.04, 16],
      junior: [86, 'sawtooth', 0.055, -28],
      womanA: [215, 'triangle', 0.035, 12],
      womanB: [190, 'triangle', 0.035, 8],
      womanC: [230, 'triangle', 0.035, 14],
      womanD: [200, 'triangle', 0.035, 10],
      system: [240, 'sine', 0.025, 0],
      narrator: [145, 'triangle', 0.03, 0]
    };
    const [freq, type, gain, slide] = profiles[speaker] || profiles.tony;
    this.tone(freq * (0.92 + Math.random() * 0.16), 0.055 + Math.random() * 0.03, type, gain, 0, slide);
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
        if (s % 4 === 0) this.tone(root / 2, .22, 'sine', .018);
      }
      if ((this.musicMode === 'drive' || this.musicMode === 'club') && s % 2 === 0) this.noise(.035, .012, 0, 2800);
      if (this.musicMode === 'house' && s % 5 === 0) this.noise(.025, .006, 0, 520);
    }, 180);
  }
}
