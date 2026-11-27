export class AudioSys {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicTimer = null;
    this.musicMode = 'title';
    this.musicStep = 0;
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

  formant(freq = 150, dur = 0.07, type = 'sawtooth', gain = 0.04, when = 0, slide = 0, formantFreq = 800) {
    // Vocal-ish timbre: oscillator through a bandpass "mouth" filter.
    if (!this.ctx || !this.enabled) return;
    const t = this.now() + when;
    const osc = this.ctx.createOscillator();
    const filt = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    filt.type = 'bandpass';
    filt.frequency.value = formantFreq;
    filt.Q.value = 1.1;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filt).connect(amp).connect(this.ctx.destination);
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
        // gravelly low Jersey two-syllable grumble with breath
        this.formant(88 * jitter(), .085, 'sawtooth', .06, 0, -20, 620);
        this.formant(72 * jitter(), .07, 'sawtooth', .05, .08, -16, 540);
        this.noise(.04, .012, .01, 500);
      },
      aj: () => {
        this.tone(178 * jitter(), .045, 'square', .034, 0, 28);
        this.tone(145 * jitter(), .04, 'square', .025, .045, -8);
      },
      carmela: () => {
        // sharp nasal 'Toneh!' high-low
        this.formant(250 * jitter(), .045, 'sawtooth', .04, 0, 30, 1300);
        this.formant(200 * jitter(), .06, 'sawtooth', .034, .048, -28, 1100);
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
        // nasal rhetorical question lilt: up, hold, down
        this.formant(185 * jitter(), .05, 'sawtooth', .038, 0, 26, 1050);
        this.formant(215 * jitter(), .045, 'sawtooth', .032, .05, 6, 1100);
        this.formant(172 * jitter(), .05, 'sawtooth', .03, .095, -22, 950);
      },
      george: () => {
        // frantic nasal rise-and-fall chatter, three quick syllables
        this.formant(150 * jitter(), .04, 'square', .045, 0, 42, 1150);
        this.formant(168 * jitter(), .035, 'square', .04, .042, 30, 1250);
        this.formant(122 * jitter(), .05, 'square', .042, .08, -34, 1000);
      },
      kramer: () => {
        // sliding giddyup swoop plus clatter
        this.formant(120 * jitter(), .1, 'sawtooth', .05, 0, 78, 900);
        this.formant(180 * jitter(), .05, 'sawtooth', .03, .09, -40, 1100);
        this.noise(.03, .016, .02, 2000);
      },
      elaine: () => {
        this.tone(230 * jitter(), .04, 'triangle', .034, 0, 16);
        this.tone(205 * jitter(), .04, 'triangle', .026, .038, -8);
      },
      paulie: () => {
        // staccato old-man mutter with a wheeze
        this.formant(100 * jitter(), .05, 'square', .05, 0, -18, 700);
        this.formant(96 * jitter(), .04, 'square', .04, .05, -10, 680);
        this.noise(.05, .02, .09, 800);
      },
      bobby: () => {
        this.tone(94 * jitter(), .065, 'triangle', .045, 0, -12);
        this.tone(86 * jitter(), .05, 'triangle', .03, .05, -8);
      },
      artie: () => [148, 166].forEach((f, i) => this.tone(f * jitter(), .045, 'triangle', .03, i * .045, 8)),
      irina: () => [205, 232].forEach((f, i) => this.tone(f * jitter(), .04, 'triangle', .028, i * .04, 12)),
      steinbrenner: () => {
        // blustery booming boss bark, three explosive syllables
        this.formant(96 * jitter(), .06, 'sawtooth', .07, 0, 42, 700);
        this.formant(118 * jitter(), .05, 'sawtooth', .06, .055, -18, 820);
        this.formant(88 * jitter(), .09, 'sawtooth', .065, .1, -34, 600);
        this.noise(.05, .02, .03, 900);
      },
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
    } else if (name === 'skid') {
      const nowT = this.ctx.currentTime;
      for (let i = 0; i < 14; i++) {
        this.tone(900 - i * 45 + Math.random() * 120, .03, 'sawtooth', .018);
      }
    } else if (name === 'crash') {
      this.noise(.28, .12, 0, 700);
      this.tone(70, .22, 'sawtooth', .09, 0, -28);
    } else if (name === 'honk') {
      this.tone(310, .12, 'square', .05);
      this.tone(310, .1, 'square', .04, .13);
    } else if (name === 'cash') {
      this.tone(1180, .05, 'square', .03);
      this.tone(1560, .07, 'square', .025, .05);
      this.noise(.05, .015, .02, 5200);
    } else if (name === 'ring') {
      for (let i = 0; i < 2; i++) {
        this.tone(880, .18, 'sine', .03, i * .5);
        this.tone(1100, .18, 'sine', .025, i * .5);
      }
    } else if (name === 'thud') {
      this.noise(.06, .04, 0, 300);
      this.tone(90, .08, 'sine', .04);
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

  step(kind = 'tony') {
    if (!this.ctx || !this.enabled) return;
    const heavy = kind === 'tony' || kind === 'tonyMax' || kind === 'bobby';
    this.noise(.028, heavy ? .014 : .008, 0, heavy ? 300 : 500);
  }

  setMusic(mode) {
    this.musicMode = mode;
    this.musicStep = 0;
  }

  startMusic() {
    if (this.musicTimer) return;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
      const s = this.musicStep++;
      const modes = {
        title: [196, 0, 247, 294, 330, 294, 247, 0],
        house: [196, 0, 220, 0, 262, 0, 220, 0],
        rome: [147, 165, 196, 220, 196, 165, 147, 0],
        dream: [330, 311, 294, 262, 247, 220, 196, 165],
        drive: [110, 110, 131, 110, 165, 147, 131, 98],
        apartment: [220, 0, 262, 330, 262, 0, 220, 0],
        club: [98, 0, 123, 98, 147, 123, 165, 0],
        monks: [262, 311, 349, 392, 349, 311, 262, 233],
        nyc: [233, 262, 0, 311, 349, 311, 262, 233],
        soup: [220, 0, 0, 233, 0, 0, 220, 196],
        vesuvio: [262, 330, 392, 330, 349, 392, 523, 392],
        satriale: [147, 0, 175, 147, 196, 175, 147, 131],
        yankees: [196, 196, 262, 196, 294, 262, 330, 262],
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
      // ambient life per location
      if (this.musicMode === 'house' && Math.random() < .09) this.noise(.03 + Math.random() * .04, .007, 0, 400 + Math.random() * 500); // fire crackle
      if (this.musicMode === 'apartment' && Math.random() < .04) { const f = 200 + Math.random() * 120; this.tone(f, .18, 'sine', .004, 0, -40); } // traffic hum
      if (this.musicMode === 'apartment' && Math.random() < .012) this.sfx('honk'); // distant honk
      if (this.musicMode === 'club' && Math.random() < .05) this.noise(.025, .008, 0, 3200 + Math.random() * 1200); // glass clink
      if (this.musicMode === 'club' && s % 2 === 0) this.tone(60, .1, 'sine', .012); // bass pulse
      if (this.musicMode === 'rome' && Math.random() < .03) this.tone(1100 + Math.random() * 500, .09, 'sine', .004, 0, 200); // birds
      if (this.musicMode === 'house' && Math.random() < .012) this.sfx('turkey'); // distant geese
      if (this.musicMode === 'nyc' && Math.random() < .07) { const f = 150 + Math.random() * 130; this.tone(f, .22, 'sine', .005, 0, -30); } // traffic rumble
      if (this.musicMode === 'nyc' && Math.random() < .02) this.sfx('honk'); // cabbies
      if (this.musicMode === 'nyc' && Math.random() < .008) { for (let i = 0; i < 5; i++) setTimeout(() => this.tone(660 + i * 90, .06, 'sine', .006), i * 90); } // distant siren
      if (this.musicMode === 'nyc' && Math.random() < .025) this.noise(.02 + Math.random() * .03, .005, 0, 2400 + Math.random() * 800); // bus brakes
      if (this.musicMode === 'dream' && Math.random() < .12) this.noise(.3 + Math.random() * .25, .006, 0, 500 + Math.random() * 300); // waves rolling in
      if (this.musicMode === 'dream' && Math.random() < .008) this.tone(1400 + Math.random() * 600, .16, 'sine', .004, 0, -300); // gull cry
      if (this.musicMode === 'dream' && Math.random() < .03) this.noise(.5, .004, 0, 900); // wind
      if (this.musicMode === 'monks' && Math.random() < .05) this.noise(.02, .006, 0, 2600 + Math.random() * 800); // coffee shop murmur
      if (this.musicMode === 'monks' && Math.random() < .015) this.tone(1900, .05, 'sine', .004, 0, -200); // espresso steam
      if (this.musicMode === 'soup' && Math.random() < .02) this.noise(.05, .005, 0, 500); // ladle on steel
      if (this.musicMode === 'satriale' && Math.random() < .03) this.noise(.04, .006, 0, 700 + Math.random() * 400); // the bandsaw hum
      if (this.musicMode === 'satriale' && Math.random() < .015) this.sfx('honk'); // Pork Store traffic
      if (this.musicMode === 'vesuvio' && Math.random() < .04) this.noise(.03, .005, 0, 2000); // cutlery and quiet opera
      if (this.musicMode === 'vesuvio' && Math.random() < .02) this.tone(520, .3, 'sine', .003, 0, 60); // a violin somewhere
      if (this.musicMode === 'yankees' && Math.random() < .02) this.noise(.06, .005, 0, 1200); // stadium crowd memory
      if (this.musicMode === 'yankees' && Math.random() < .012) this.tone(880, .1, 'sine', .004, 0, 220); // a bat crack, somewhere in the past
    }, 180);
  }
}
