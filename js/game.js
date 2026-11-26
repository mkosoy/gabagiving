import { AudioSys } from './audio.js';
import {
  px,
  outlineText,
  wrapText,
  drawPerson,
  drawPortrait,
  drawTurkey,
  drawBat,
  drawVial
} from './sprites.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const audio = new AudioSys();

const ASSET_V = '3';
function loadArt(src) {
  const img = new Image();
  img.src = src + (src.includes('?') ? '&' : '?') + 'v=' + ASSET_V;
  return img;
}
const sceneArt = {
  house: loadArt('./assets/bg-house-v2.webp'),
  hub: loadArt('./assets/bg-njhub.webp'),
  apartment: loadArt('./assets/bg-apartment-v2.webp'),
  vesuvio: loadArt('./assets/bg-vesuvio.webp'),
  monks: loadArt('./assets/bg-monks.webp'),
  soup: loadArt('./assets/bg-soup.webp'),
  rome: loadArt('./assets/bg-rome.webp'),
  club: loadArt('./assets/bg-club.webp'),
  satriale: loadArt('./assets/bg-satriale.webp'),
  plavStream: loadArt('./assets/plav-stream.webp'),
  cousinTony: loadArt('./assets/photo-cousin-tony.webp'),
  tonyHorse: loadArt('./assets/photo-tony-horse.webp'),
  tonyHead: loadArt('./assets/sprites/tony-head.webp')
};
function drawSceneArt(img, w, h) {
  if (!img.complete || !img.naturalWidth) return false;
  ctx.drawImage(img, 0, 0, w, h);
  return true;
}
function drawFramedPhoto(img, x, y, w, h) {
  px(ctx, x - 2, y - 2, w + 4, h + 4, '#4b2b1d');
  px(ctx, x, y, w, h, '#c49a55');
  if (img.complete && img.naturalWidth) ctx.drawImage(img, x + 2, y + 2, w - 4, h - 4);
  else px(ctx, x + 2, y + 2, w - 4, h - 4, '#9bc0d7');
  px(ctx, x + 3, y + 3, Math.max(3, w * .18), 2, 'rgba(255,255,255,.45)');
}

const keys = Object.create(null);
const pressed = new Set();
const axis = { x: 0, y: 0 };
let usingTouchControls = false;
const interactCodes = ['KeyE', 'Space', 'Enter'];
const cancelCodes = ['Escape', 'KeyQ'];

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  usingTouchControls = false;
  audio.unlock();
  if (!e.repeat) pressed.add(e.code);
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') usingTouchControls = true;
  if (state.mode === 'title') {
    const rect = canvas.getBoundingClientRect();
    const vx = (e.clientX - rect.left) / rect.width * W;
    const vy = (e.clientY - rect.top) / rect.height * H;
    if (vy >= 290 && vy <= 318 && vx >= 190 && vx <= 450) pressed.add('KeyO');
    else if (loadSave() && vy >= 256 && vy <= 282 && vx >= 340) pressed.add('KeyC');
    else if (loadSave() && vx >= W / 2) pressed.add('KeyC');
    else pressed.add('KeyE');
  } else if (state.mode === 'dialogue') pressed.add('KeyE');
  if (state.mode === 'ending') {
    const rect = canvas.getBoundingClientRect();
    const vx = (e.clientX - rect.left) / rect.width * W;
    const vy = (e.clientY - rect.top) / rect.height * H;
    if (vy >= 290 && vy <= 311 && vx >= 112 && vx <= 312) pressed.add('KeyE');
    else if (vy >= 290 && vy <= 311 && vx >= 328 && vx <= 528) pressed.add('KeyB');
    else if (vy >= 314 && vy <= 335 && vx >= 180 && vx <= 460) pressed.add('KeyF');
  }
  if (state.mode === 'menu' && state.menu) {
    const rect = canvas.getBoundingClientRect();
    const vx = (e.clientX - rect.left) / rect.width * W;
    const vy = (e.clientY - rect.top) / rect.height * H;
    const entries = menuEntries();
    const idx = Math.floor((vy - 92) / 17);
    if (vx >= 130 && vx <= 510 && idx >= 0 && idx < entries.length) {
      state.menu.sel = idx;
      const it = entries[idx];
      if (it.open) { audio.sfx('success'); it.act(); }
      else audio.sfx('denied');
    }
  }
}, { passive: true });
window.addEventListener('pointerup', () => audio.unlock(), { passive: true });
window.addEventListener('touchend', () => audio.unlock(), { passive: true });

function consume(codes) {
  for (const c of codes) {
    if (pressed.has(c)) {
      pressed.delete(c);
      return true;
    }
  }
  return false;
}
function interactPressed() { return consume(interactCodes); }
function down(codes) { return codes.some((c) => keys[c]); }

// Mobile controls: virtual stick plus A/B buttons.
const stickZone = document.getElementById('stickZone');
const stickNub = document.getElementById('stickNub');
let stickPointer = null;
function setStick(clientX, clientY) {
  const r = stickZone.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = (clientX - cx) / (r.width * .36);
  let dy = (clientY - cy) / (r.height * .36);
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  axis.x = Math.abs(dx) > .18 ? dx : 0;
  axis.y = Math.abs(dy) > .18 ? dy : 0;
  stickNub.style.transform = `translate(${dx * 31}px, ${dy * 31}px)`;
}
stickZone.addEventListener('pointerdown', (e) => {
  usingTouchControls = true;
  stickPointer = e.pointerId;
  stickZone.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
stickZone.addEventListener('pointermove', (e) => {
  if (stickPointer === e.pointerId) setStick(e.clientX, e.clientY);
});
function releaseStick(e) {
  if (stickPointer !== e.pointerId) return;
  stickPointer = null;
  axis.x = axis.y = 0;
  stickNub.style.transform = 'translate(0, 0)';
}
stickZone.addEventListener('pointerup', releaseStick);
const menuBtnEl = document.getElementById('menuBtn');
if (menuBtnEl) menuBtnEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  usingTouchControls = true;
  audio.unlock();
  pressed.add('Escape');
});
stickZone.addEventListener('pointercancel', releaseStick);

function bindButton(id, code) {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    usingTouchControls = true;
    audio.unlock();
    pressed.add(code);
    keys[code] = true;
  });
  const up = () => { keys[code] = false; };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}
bindButton('btnA', 'KeyE');
bindButton('btnB', 'KeyB');
bindButton('btnR', 'KeyR');
bindButton('btnF', 'KeyF');

document.getElementById('muteBtn').addEventListener('click', (e) => {
  audio.unlock();
  const on = audio.toggle();
  document.getElementById('muteBtn').textContent = on ? 'Sound' : 'Muted';
  e.currentTarget.blur();
});
document.getElementById('helpBtn').addEventListener('click', (e) => {
  state.help = !state.help;
  e.currentTarget.blur();
});

const names = {
  tony: 'Tony', aj: 'AJ', carmela: 'Carmela', meadow: 'Meadow', melfi: 'Dr. Melfi',
  augustus: 'Augustus', christopher: 'Christopher', paulie: 'Paulie', silvio: 'Silvio',
  jerry: 'Jerry', george: 'George', kramer: 'Kramer', elaine: 'Elaine', plav: 'Plav',
  narrator: '', system: 'Objective', janice: 'Janice', guard: 'Roman Guard',
  womanA: 'Rose', womanB: 'Linda', womanC: 'Debbie', womanD: 'Marie', paulieSuit: 'Paulie',
  bobby: 'Bobby', artie: 'Artie', irina: 'Irina', junior: 'Uncle Junior'
};

const state = {
  mode: 'title',
  scene: 'house',
  time: 0,
  frame: 0,
  camera: { x: 0, y: 0 },
  player: { x: 190, y: 124, dir: 'down', kind: 'tony', speed: 88 },
  flags: {
    houseStep: 0,
    tvChannel: 0,
    hasCard: false,
    sawGeese: false,
    ajDone: false,
    mirrorDone: false,
    romeStep: 0,
    hasBat: false,
    aptStep: 0,
    kramerIn: false,
    elaineIn: false,
    clubTalked: {},
    clubReady: false,
    augustusAJ: false,
    satStep: 0,
    freeRoam: false,
    humanFund: false
  },
  objective: 'Press start',
  dialog: null,
  phone: null,
  help: false,
  fade: 0,
  bone: null,
  pep: null,
  drive: null,
  bonus: null,
  produce: null,
  bonusReveal: false,
  effects: [],
  movers: [],
  npcs: {},
  unlocked: { house: true },
  menu: null,
  dreamT: 0,
  stats: { started: 0, calls: 0, vials: 0, smashes: 0, crashes: 0 }
};

function objective(text) { state.objective = text; saveProgress(); }

function saveProgress() {
  if (state.mode === 'title' || !state.flags) return;
  if (state.flags.sandbox) return;
  if (['bone', 'peptides', 'drive', 'bonus', 'produce', 'dream', 'ending'].includes(state.mode)) return;
  try {
    localStorage.setItem('gabagiving-save-v1', JSON.stringify({
      flags: state.flags,
      scene: state.scene,
      objective: state.objective,
      player: { x: state.player.x, y: state.player.y, dir: state.player.dir, kind: state.player.kind },
      stats: state.stats,
      unlocked: state.unlocked || {}
    }));
  } catch (e) { /* storage unavailable */ }
}

function loadSave() {
  try {
    const raw = localStorage.getItem('gabagiving-save-v1');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function openMenu() {
  if (!['explore', 'dialogue'].includes(state.mode)) return;
  state.menu = { sel: 0, returnMode: state.mode };
  state.mode = 'menu';
  audio.sfx('pause');
}

function closeMenu() {
  state.mode = state.menu?.returnMode || 'explore';
  state.menu = null;
}

function chapterPreset(key) {
  // Milestone flag presets so chapter select lands in a consistent story state.
  const base = { houseStep: 9, tvChannel: 3, hasCard: true, sawGeese: true, ajDone: true, mirrorDone: true, freeRoam: false };
  if (key === 'rome') Object.assign(state.flags, base, { romeStep: 0, boneDone: false });
  if (key === 'chamber') Object.assign(state.flags, base, { romeStep: 1, boneDone: false });
  if (key === 'drive') Object.assign(state.flags, base, { romeStep: 4, boneDone: true, hasBat: false, aptStep: 0 });
  if (key === 'apartment') Object.assign(state.flags, base, { romeStep: 4, boneDone: true, hasBat: false, aptStep: 0, kramerIn: false, elaineIn: false });
  if (key === 'club') Object.assign(state.flags, base, { romeStep: 4, boneDone: true, hasBat: true, aptStep: 4, kramerIn: true, elaineIn: true, clubTalked: {}, clubReady: false });
}

function jumpChapter(key) {
  closeMenu();
  state.menu = null;
  state.dialog = null;
  state.mode = 'explore';
  chapterPreset(key);
  if (key === 'house') { resetGame(); startGame(); return; }
  if (key === 'rome') { setScene('rome', 72, 350); state.mode = 'explore'; objective('Walk through Rome and meet Augustus'); return; }
  if (key === 'chamber') { setScene('chamber', 320, 330); state.mode = 'explore'; objective('Enter the glow-up chamber'); return; }
  if (key === 'drive') { initDrive(); state.mode = 'drive'; objective('Catch the debtor — grab money boosts'); return; }
  if (key === 'apartment') { enterApartment(); return; }
  if (key === 'club') { enterClub(); return; }
}

function menuEntries() {
  const u = state.unlocked || {};
  const entries = [{ label: 'Resume game', hint: 'back to where you were', act: () => closeMenu(), open: true }];
  if (state.flags.freeRoam) {
    entries.push({
      label: 'Story mode — continue story', hint: 'jump back into the plot at your furthest chapter',
      act: () => {
        closeMenu();
        state.flags.freeRoam = false;
        state.flags.sandbox = false;
        if (loadSave()) continueGame();
        else { resetGame(); startGame(); }
      }, open: true
    });
  }
  const chapters = [
    ['house', 'Ch.1 — Tony’s House'],
    ['rome', 'Ch.2 — Rome & Augustus'],
    ['chamber', 'Ch.3 — Glow-up Chamber'],
    ['drive', 'Ch.4 — Jersey Road Chase'],
    ['apartment', 'Ch.5 — Jerry’s Apartment'],
    ['club', 'Ch.6 — Bada Bing Finale']
  ];
  for (const [key, label] of chapters) {
    const open = !!u[key] || key === 'house';
    entries.push({
      label, hint: open ? 'chapter select' : 'locked — play the story',
      locked: !open,
      act: () => jumpChapter(key), open
    });
  }
  const games = [
    ['bone', 'Minigame — Bone Smashing', () => { closeMenu(); startBoneGame(); }, u.chamber],
    ['peptides', 'Minigame — Peptide Hunt', () => { closeMenu(); startPeptides(); }, u.rome],
    ['drive', 'Minigame — Road Chase', () => { closeMenu(); initDrive(); state.mode = 'drive'; }, u.apartment || u.drive],
    ['produce', 'Minigame — Produce Dodge', () => { closeMenu(); startProduceGame(); }, u.satriale],
    ['bachelor', 'Bonus — Paulie on The Bachelor', () => { closeMenu(); startBonusIntro(); }, u.club],
    ['augustusnj', 'Bonus — Augustus in NJ', () => { closeMenu(); startAugustusBonus(); }, u.club]
  ];
  for (const [, label, act, open] of games) {
    entries.push({ label, hint: open ? 'minigame' : 'locked', locked: !open, act, open: !!open });
  }
  entries.push({
    label: 'Free Roam — North Caldwell', hint: u.hub || state.flags.freeRoam ? 'open world' : 'unlocks after the finale',
    locked: !(u.hub || state.flags.freeRoam), open: !!(u.hub || state.flags.freeRoam),
    act: () => { closeMenu(); enterHub(!state.flags.freeRoam); }
  });
  entries.push({ label: 'Restart story', hint: 'erases checkpoint progress', act: () => { closeMenu(); resetGame(); startGame(); }, open: true });
  return entries;
}

function continueGame() {
  const s = loadSave();
  if (!s) { startGame(); return; }
  state.flags = Object.assign(state.flags, s.flags || {});
  state.flags.sandbox = false;
  state.unlocked = s.unlocked || { house: true };
  state.stats = Object.assign(state.stats, s.stats || {});
  state.mode = 'explore';
  if ((s.scene === 'apartment') && (state.flags.aptStep || 0) === 0 && !state.flags.freeRoam) {
    // The apartment introduction dialogue unlocks the bat; replay it instead of stranding the player.
    enterApartment();
    return;
  }
  setScene(s.scene || 'house', s.player?.x ?? 190, s.player?.y ?? 124);
  state.player.dir = s.player?.dir || 'down';
  state.player.kind = s.player?.kind || 'tony';
  objective(s.objective || 'Explore');
}
function speakerName(key) { return Object.prototype.hasOwnProperty.call(names, key) ? names[key] : (key || ''); }

function startDialog(lines, onDone, opts = {}) {
  state.dialog = {
    lines,
    i: 0,
    chars: 0,
    onDone,
    opts,
    lastVoice: 0,
    acted: -1
  };
  state.mode = 'dialogue';
}

function currentLine() {
  return state.dialog?.lines[state.dialog.i];
}

function updateDialog(dt) {
  const d = state.dialog;
  if (!d) return;
  const line = currentLine();
  if (!line) return finishDialog();
  if (d.acted !== d.i) {
    d.acted = d.i;
    if (line.action) line.action();
  }
  const speed = line.fast ? 58 : 34;
  const before = Math.floor(d.chars);
  d.chars = Math.min(line.text.length, d.chars + dt * speed);
  const after = Math.floor(d.chars);
  if (after > before && after % 3 === 0) audio.voice(line.speaker);

  if (interactPressed()) {
    if (d.chars < line.text.length) {
      d.chars = line.text.length;
    } else {
      d.i += 1;
      d.chars = 0;
      audio.sfx('confirm');
      if (d.i >= d.lines.length) finishDialog();
    }
  }
}

function finishDialog() {
  const d = state.dialog;
  state.dialog = null;
  state.mode = d?.opts?.returnMode || 'explore';
  const cb = d?.onDone;
  if (cb) cb();
}

function ringPhone(caller, lines, onDone) {
  state.phone = { caller, lines, onDone, t: 0, pulse: 0 };
  audio.sfx('phone');
}

function answerPhone() {
  const p = state.phone;
  if (!p) return;
  state.phone = null;
  state.stats.calls += 1;
  startDialog(p.lines, p.onDone, { phone: true, caller: p.caller });
}

function updatePhone(dt) {
  const p = state.phone;
  if (!p || state.mode === 'dialogue') return;
  p.t += dt;
  p.pulse += dt;
  if (p.pulse > 1.8) {
    p.pulse = 0;
    audio.sfx('phone');
  }
  if (interactPressed() || p.t > 3.2) answerPhone();
}

function drawPanel(x, y, w, h, fill = '#151d3a', border = '#e8e2c8') {
  px(ctx, x, y, w, h, '#07101e');
  px(ctx, x + 2, y + 2, w - 4, h - 4, border);
  px(ctx, x + 4, y + 4, w - 8, h - 8, fill);
}

function drawObjective() {
  if (state.mode === 'title' || state.mode === 'ending') return;
  const text = state.objective;
  const w = Math.min(330, 24 + text.length * 5.7);
  drawPanel(8, 8, w, 30, '#182448', '#c9c1a2');
  outlineText(ctx, '★ ' + text, 17, 17, '#ffe78a', 8);
}

function drawPrompt(inter) {
  if (!inter || state.mode !== 'explore') return;
  const sx = Math.max(50, Math.min(W - 50, inter.x + inter.w / 2 - state.camera.x));
  const sy = Math.max(20, inter.y - 15 - state.camera.y);
  drawPanel(sx - 42, sy - 5, 84, 18, '#1b2a55', '#f4df8e');
  outlineText(ctx, `${usingTouchControls ? 'A' : 'E'}  ${inter.label}`, sx, sy + 1, '#fff1a6', 8, 'center');
}

function drawPhoneIncoming() {
  const p = state.phone;
  if (!p || state.mode === 'dialogue') return;
  const blink = Math.sin(state.time * 12) > 0;
  const x = 464, y = 44;
  drawPanel(x, y, 166, 54, '#152646', '#87e29b');
  // pixel phone icon
  px(ctx, x + 13, y + 12, 18, 29, '#111827');
  px(ctx, x + 15, y + 15, 14, 20, blink ? '#64e58b' : '#254e39');
  px(ctx, x + 20, y + 38, 5, 2, '#c8d4e6');
  outlineText(ctx, 'INCOMING CALL', x + 40, y + 10, '#8fffad', 7);
  outlineText(ctx, speakerName(p.caller), x + 40, y + 22, '#ffffff', 9);
  outlineText(ctx, 'A / E to answer', x + 40, y + 36, '#ffe78a', 7);
}

function drawDialog() {
  const d = state.dialog;
  if (!d) return;
  const line = currentLine();
  if (!line) return;
  const isPhone = d.opts.phone;
  const boxY = isPhone ? 248 : 254;
  const boxX = isPhone ? 92 : 8;
  const boxW = isPhone ? 456 : 624;
  drawPanel(boxX, boxY, boxW, 96, isPhone ? '#102d2c' : '#182448', isPhone ? '#87e29b' : '#e8e2c8');
  if (isPhone) {
    px(ctx, boxX + 10, boxY - 20, 120, 20, '#102d2c');
    outlineText(ctx, `☎ ${speakerName(d.opts.caller)}`, boxX + 18, boxY - 15, '#8fffad', 8);
  }
  const portraitKind = line.portrait || line.speaker;
  if (portraitKind && portraitKind !== 'narrator' && portraitKind !== 'system') {
    drawPortrait(ctx, boxX + 11, boxY + 15, portraitKind);
  }
  const tx = boxX + 56;
  const name = line.name ?? speakerName(line.speaker);
  if (name) outlineText(ctx, name + ':', tx, boxY + 12, '#ffd34f', 10);
  const visible = line.text.slice(0, Math.floor(d.chars));
  const lines = wrapText(ctx, visible, boxW - 76, 10);
  lines.slice(0, 4).forEach((txt, idx) => outlineText(ctx, txt, tx, boxY + 29 + idx * 13, '#fff', 10));
  if (d.chars >= line.text.length) {
    const ax = boxX + boxW - 22;
    const ay = boxY + 78 + Math.sin(state.time * 8) * 2;
    px(ctx, ax, ay, 10, 4, '#fff1a6');
    px(ctx, ax + 2, ay + 4, 6, 4, '#fff1a6');
    px(ctx, ax + 4, ay + 8, 2, 3, '#fff1a6');
  }
}

function drawHelp() {
  if (!state.help) return;
  drawPanel(150, 64, 340, 150, '#121a35', '#e8e2c8');
  outlineText(ctx, 'CONTROLS', 320, 78, '#ffd34f', 12, 'center');
  outlineText(ctx, 'Move: WASD / Arrow keys / touch stick', 174, 104, '#fff', 9);
  outlineText(ctx, 'Interact / advance: E, Space, Enter, or A', 174, 122, '#fff', 9);
  outlineText(ctx, 'Minigames: use the same action button', 174, 140, '#fff', 9);
  outlineText(ctx, 'B switches Tony / George in free roam', 174, 158, '#fff', 9);
  outlineText(ctx, 'Click ? again to close', 320, 188, '#ffe78a', 8, 'center');
}

// ---------- Scene data ----------
function r(x, y, w, h) { return { x, y, w, h }; }
const scenes = {
  house: {
    w: 640, h: 416, label: 'North Caldwell · Thanksgiving Morning', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(252,8,16,66), r(252,136,16,46), r(352,8,16,58), r(352,126,16,56),
      r(8,174,262,16), r(330,174,302,16),
      r(352,190,16,76), r(352,322,16,86),
      r(62,45,110,80), r(200,20,62,55), r(18,70,54,58),
      r(392,26,138,76), r(568,86,56,88), r(408,122,70,28),
      r(55,280,175,100), r(24,318,42,42), r(392,210,190,36), r(414,292,160,96)
    ],
    draw: drawHouse,
    interactions: houseInteractions
  },
  rome: {
    w: 800, h: 440, label: 'Rome · Court of Augustus', music: 'rome',
    colliders: [
      r(0,0,800,8), r(0,432,800,8), r(0,0,8,440), r(792,0,8,440),
      r(96,48,22,92), r(150,48,22,92), r(350,40,28,112), r(408,40,28,112), r(560,40,28,112), r(618,40,28,112),
      r(238,220,52,32), r(214,260,128,30),
      r(700,128,66,34), r(716,196,52,78),
      r(744,150,48,24)
    ],
    draw: drawRome,
    interactions: romeInteractions
  },
  chamber: {
    w: 640, h: 416, label: 'Roman Glow-Up Chamber', music: 'rome',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(84,52,92,28), r(462,52,92,28), r(278,38,84,34), r(120,246,84,54), r(440,246,84,54)
    ],
    draw: drawChamber,
    interactions: chamberInteractions
  },
  apartment: {
    w: 640, h: 416, label: 'Jerry’s Apartment · Thanksgiving', music: 'apartment',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(0,0,250,106), r(70,112,120,56), r(254,40,94,110), r(354,104,108,52),
      r(556,12,76,240),
      r(186,204,204,76), r(402,210,56,70), r(444,300,108,92),
      r(242,296,120,46), r(14,304,136,100), r(530,368,98,44)
    ],
    draw: drawApartment,
    interactions: apartmentInteractions
  },
  club: {
    w: 640, h: 416, label: 'Bada Bing · Thanksgiving Night', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(34,38,168,82), r(446,38,150,82), r(246,184,148,58), r(82,302,96,52), r(458,302,96,52)
    ],
    draw: drawClub,
    interactions: clubInteractions
  },
  njstreet: {
    w: 640, h: 416, label: 'New Jersey · Augustus Dream', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(28,28,150,98), r(470,28,142,98), r(204,28,150,76)
    ],
    draw: drawNjStreet,
    interactions: njInteractions
  },
  hub: {
    w: 640, h: 416, label: 'North Caldwell · Free Roam', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(20,8,280,136), r(420,8,210,142),
      r(18,248,150,130), r(448,232,184,158),
      r(260,292,120,68), r(330,168,92,36)
    ],
    draw: drawHub,
    interactions: hubInteractions
  },
  vesuvio: {
    w: 640, h: 416, label: 'Vesuvio · Dinner Service', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(0,80,205,135), r(430,20,150,160),
      r(150,196,130,92), r(398,186,132,92),
      r(56,288,152,104), r(388,288,144,112),
      r(320,392,160,24)
    ],
    draw: drawVesuvio,
    interactions: vesuvioInteractions
  },
  monks: {
    w: 640, h: 416, label: 'Monk’s Café · Manhattan', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(30,30,580,68),
      r(120,150,96,70), r(420,150,96,70),
      r(120,290,96,70), r(420,290,96,70),
      r(268,200,104,88)
    ],
    draw: drawMonks,
    interactions: monksInteractions
  },
  soup: {
    w: 640, h: 416, label: 'The Soup Stand · Manhattan', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(8,50,240,150),
      r(268,70,96,230),
      r(520,20,112,270),
      r(40,300,200,100)
    ],
    draw: drawSoup,
    interactions: soupInteractions
  },
  satriale: {
    w: 640, h: 416, label: 'Satriale’s Pork Store · Dream', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(28,34,584,62), r(74,130,104,40), r(456,130,104,40),
      r(258,242,124,44), r(46,330,96,38), r(496,328,94,38)
    ],
    draw: drawSatriale,
    interactions: satrialeInteractions
  }
};

function moveActor(actor, x, y, speed = 92, onDone = null) {
  state.movers = state.movers.filter((m) => m.actor !== actor);
  state.movers.push({ actor, x, y, speed, onDone });
}

function updateMovers(dt) {
  for (const m of state.movers) {
    const a = m.actor;
    const dx = m.x - a.x;
    const dy = m.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) {
      a.x = m.x;
      a.y = m.y;
      m.done = true;
      if (m.onDone) m.onDone();
      continue;
    }
    const step = Math.min(d, m.speed * dt);
    a.x += (dx / d) * step;
    a.y += (dy / d) * step;
    a.moving = true;
    a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    state.frame += dt * 2.5;
  }
  state.movers = state.movers.filter((m) => !m.done);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function playerRect(x = state.player.x, y = state.player.y) {
  return { x: x + 3, y: y + 7, w: 11, h: 13 };
}
function movingCarRect(i, time = state.time) {
  const cx = ((time * (50 + i * 18) + i * 280) % 760) - 70;
  const x = i ? 690 - cx : cx;
  return { x, y: 304 + i * 18, w: 78, h: 32 };
}

function blockedAt(x, y) {
  const scene = scenes[state.scene];
  if (!scene) return false;
  const pr = playerRect(x, y);
  let colliders = scene.colliders;
  if (state.scene === 'njstreet') {
    const cars = [movingCarRect(0), movingCarRect(1)];
    const current = playerRect();
    colliders = colliders.concat(cars.filter((c) => !rectsOverlap(current, c)));
  }
  return colliders.some((c) => rectsOverlap(pr, c));
}

function setScene(name, x, y) {
  state.scene = name;
  state.player.x = x;
  state.player.y = y;
  if (state.unlocked) state.unlocked[name] = true;
  const scene = scenes[name];
  if (scene) audio.setMusic(scene.music);
  saveProgress();
}

function moveInput() {
  let x = axis.x;
  let y = axis.y;
  if (down(['ArrowLeft', 'KeyA'])) x -= 1;
  if (down(['ArrowRight', 'KeyD'])) x += 1;
  if (down(['ArrowUp', 'KeyW'])) y -= 1;
  if (down(['ArrowDown', 'KeyS'])) y += 1;
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  return { x, y };
}

// ---------- Living world: ambient pedestrians, heat, cars ----------
const ambientSpecs = {
  hub: [
    { kind: 'womanB', x: 210, y: 244, region: { x: 180, y: 222, w: 170, h: 70 }, speed: 32 },
    { kind: 'christopher', x: 480, y: 204, region: { x: 420, y: 178, w: 130, h: 66 }, speed: 36 },
    { kind: 'womanA', x: 100, y: 206, region: { x: 40, y: 168, w: 130, h: 70 }, speed: 28 },
    { kind: 'bobby', x: 330, y: 330, region: { x: 260, y: 310, w: 160, h: 60 }, speed: 24 }
  ],
  club: [
    { kind: 'womanD', x: 120, y: 270, region: { x: 60, y: 250, w: 160, h: 80 }, speed: 30 },
    { kind: 'christopher', x: 500, y: 270, region: { x: 440, y: 250, w: 130, h: 80 }, speed: 34 }
  ],
  vesuvio: [
    { kind: 'womanB', x: 250, y: 330, region: { x: 220, y: 300, w: 120, h: 70 }, speed: 26 },
    { kind: 'junior', x: 340, y: 120, region: { x: 290, y: 100, w: 100, h: 60 }, speed: 20 }
  ],
  satriale: [
    { kind: 'womanC', x: 300, y: 330, region: { x: 220, y: 300, w: 180, h: 70 }, speed: 30 }
  ],
  monks: [
    { kind: 'womanA', x: 320, y: 380, region: { x: 120, y: 372, w: 380, h: 28 }, speed: 34 },
    { kind: 'womanB', x: 560, y: 250, region: { x: 532, y: 130, w: 60, h: 220 }, speed: 26 },
    { kind: 'bobby', x: 60, y: 240, region: { x: 30, y: 130, w: 60, h: 220 }, speed: 20 }
  ],
  soup: [
    { kind: 'womanD', x: 430, y: 100, region: { x: 390, y: 40, w: 100, h: 240 }, speed: 22 },
    { kind: 'christopher', x: 300, y: 330, region: { x: 260, y: 310, w: 240, h: 60 }, speed: 26 }
  ]
};

function ambientFor(sceneName) {
  if (!state.ambient) state.ambient = {};
  if (!state.ambient[sceneName]) {
    state.ambient[sceneName] = (ambientSpecs[sceneName] || []).map((a) => ({
      ...a, tx: a.x, ty: a.y, pause: Math.random() * 2, dir: 'down', barkT: 0, diveT: 0
    }));
  }
  return state.ambient[sceneName];
}

function updateAmbient(dt) {
  const list = ambientFor(state.scene);
  const p = state.player;
  for (const n of list) {
    if (n.barkT > 0) n.barkT -= dt;
    if (n.diveT > 0) { n.diveT -= dt; continue; }
    const pd = Math.hypot(n.x - p.x, n.y - p.y);
    // heat 3+: pedestrians edge away from the player
    if ((state.flags.heat || 0) >= 3 && pd < 70) {
      const ang = Math.atan2(n.y - p.y, n.x - p.x);
      const fx = Math.max(n.region.x, Math.min(n.region.x + n.region.w, n.x + Math.cos(ang) * 30));
      const fy = Math.max(n.region.y, Math.min(n.region.y + n.region.h, n.y + Math.sin(ang) * 30));
      n.tx = fx; n.ty = fy; n.pause = 0;
    }
    if (pd < 22) continue; // don't overlap the player
    if (n.pause > 0) { n.pause -= dt; continue; }
    const dx = n.tx - n.x;
    const dy = n.ty - n.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      n.tx = n.region.x + Math.random() * n.region.w;
      n.ty = n.region.y + Math.random() * n.region.h;
      n.pause = .8 + Math.random() * 2.8;
      continue;
    }
    n.x += (dx / d) * n.speed * dt;
    n.y += (dy / d) * n.speed * dt;
    n.moving = true;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    // random ambient mutters
    if (Math.random() < dt * .06) {
      n.bark = ['sigh', 'mmpf', 'yeah yeah', 'madone', 'anyway'][Math.floor(Math.random() * 5)];
      n.barkT = 1.4;
      audio.voice(n.kind);
    }
  }
  state.flags.heat = Math.max(0, (state.flags.heat || 0) - dt * .08);
}

function shoveNearest() {
  const p = state.player;
  const list = ambientFor(state.scene);
  let best = null; let bd = 30;
  for (const n of list) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d < bd) { best = n; bd = d; }
  }
  if (!best) return false;
  const ang = Math.atan2(best.y - p.y, best.x - p.x) || 0;
  best.x += Math.cos(ang) * 26;
  best.y += Math.sin(ang) * 26;
  best.diveT = .5;
  best.bark = p.kind === 'george' ? 'SERENITY NOW!' : ['HEY!', 'WATCH IT!', 'THE NERVE!'][Math.floor(Math.random() * 3)];
  best.barkT = 1.6;
  state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
  spawnEffect(best.x + 8, best.y - 10, 'SHOVED', '#ff9a7a');
  audio.sfx('smash');
  audio.voice(best.kind);
  return true;
}

function drawAmbient() {
  const list = ambientFor(state.scene);
  for (const n of list) {
    const frame = n.moving ? state.frame * 1.6 : state.frame * .5;
    drawPerson(ctx, n.x, n.y, n.kind, n.dir, frame, n.diveT > 0 ? { pose: 'lean' } : {});
    if (n.barkT > 0 && n.bark) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, n.barkT);
      outlineText(ctx, n.bark, n.x + 10, n.y - 6, '#fff1a6', 7, 'center');
      ctx.restore();
    }
    n.moving = false;
  }
}

function updateCop(dt) {
  if (!state.flags.freeRoam || state.scene !== 'hub') { state.cop = null; return; }
  const heat = state.flags.heat || 0;
  if (heat >= 3.5 && !state.cop) {
    state.cop = { x: 40, y: 100, flashT: 0, bustT: 0 };
    audio.sfx('honk');
    spawnEffect(state.player.x + 8, state.player.y - 20, 'COPS!', '#8fb8ff');
  }
  const c = state.cop;
  if (!c) return;
  if (heat < 1.5) {
    spawnEffect(c.x, c.y, 'HEAT CLEARED', '#8ffff2');
    state.cop = null;
    return;
  }
  c.flashT += dt;
  const p = state.player;
  const dx = (p.x + 8) - c.x, dy = (p.y + 8) - c.y;
  const d = Math.hypot(dx, dy) || 1;
  const speed = p.inCar ? 150 : 120;
  c.x += dx / d * speed * dt;
  c.y += dy / d * speed * dt;
  if (d < 30) {
    c.bustT += dt;
    if (c.bustT > .8) {
      state.cop = null;
      state.flags.heat = 0;
      p.inCar = false;
      p.speed = p.kind === 'george' ? 96 : 88;
      audio.sfx('denied');
      startDialog(p.kind === 'george' ? [
        { speaker: 'narrator', text: 'A very unimpressed officer escorts George to the curb. The fine is twelve dollars and a lecture about civic responsibility.' },
        { speaker: 'george', text: 'Twelve dollars! You know what the Human Fund would say about this? Nothing, because it doesn’t exist!' }
      ] : [
        { speaker: 'narrator', text: 'The officer takes one look at Tony, decides this is above his pay grade, and writes a parking ticket instead.' },
        { speaker: 'tony', text: 'Smart kid. Here — for the policeman’s ball. Tell ‘em I said hi. Actually, don’t.' }
      ]);
    }
  } else c.bustT = Math.max(0, c.bustT - dt);
}

function drawCop() {
  const c = state.cop;
  if (!c || state.scene !== 'hub') return;
  drawCar(c.x, c.y, '#e8ecf2');
  // flashing lightbar
  const phase = Math.floor(c.flashT * 6) % 2;
  px(ctx, c.x - 7, c.y - 4, 6, 3, phase ? '#ff4444' : '#882222');
  px(ctx, c.x + 1, c.y - 4, 6, 3, phase ? '#222288' : '#4488ff');
}

function updateExplore(dt) {
  updatePhone(dt);
  if (state.phone) return;
  updateAmbient(dt);
  updateRyeHeist(dt);
  updateCop(dt);
  if (state.flags.heat > 0 && state.mode === 'explore') state.flags.heat = Math.max(0, state.flags.heat - dt * .06);
  const input = moveInput();
  const p = state.player;
  // GTA-lite: shove nearby pedestrians, or hop out of a borrowed car
  if (state.flags.freeRoam && consume(['KeyF']) && !p.inCar) shoveNearest();
  if (state.flags.freeRoam && consume(['KeyB']) && !p.inCar) {
    p.kind = p.kind === 'george' ? 'tonyMax' : 'george';
    p.speed = p.kind === 'george' ? 96 : 88;
    audio.voice(p.kind === 'george' ? 'george' : 'tony');
    spawnEffect(p.x + 8, p.y - 8, p.kind === 'george' ? 'GEORGE' : 'TONY', '#8ffff2');
  }
  // leaving a borrowed car takes priority over other interactions
  if (p.inCar && interactPressed()) {
    p.inCar = false;
    p.speed = p.kind === 'george' ? 96 : 88;
    audio.sfx('door');
    spawnEffect(p.x + 8, p.y - 8, 'ON FOOT', '#8ffff2');
    return;
  }
  if (input.x || input.y) {
    if (Math.abs(input.x) > Math.abs(input.y)) p.dir = input.x > 0 ? 'right' : 'left';
    else p.dir = input.y > 0 ? 'down' : 'up';
    const sp = p.speed * dt;
    const nx = p.x + input.x * sp;
    if (!blockedAt(nx, p.y)) p.x = nx;
    const ny = p.y + input.y * sp;
    if (!blockedAt(p.x, ny)) p.y = ny;
    if (p.inCar) {
      for (const n of ambientFor(state.scene)) {
        if (n.diveT > 0) continue;
        if (Math.abs(n.x - p.x) < 26 && Math.abs(n.y - p.y) < 20) {
          const side = n.y >= p.y ? 1 : -1;
          n.y += side * 30;
          n.diveT = .7;
          n.bark = ['WHOA!', 'MY LEGS!', 'CRAZY DRIVER!'][Math.floor(Math.random() * 3)];
          n.barkT = 1.6;
          state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
          audio.sfx('honk');
          audio.voice(n.kind);
          spawnEffect(n.x + 8, n.y - 12, 'DIVE!', '#ff9a7a');
        }
      }
    }
    state.frame += dt * 12;
    p.stepTick = (p.stepTick || 0) - dt;
    if (p.stepTick <= 0) {
      audio.tone(92 + Math.random() * 18, .025, 'triangle', .006);
      p.stepTick = .24;
    }
  } else {
    state.frame += dt * 2;
  }
  const scene = scenes[state.scene];
  state.camera.x = Math.max(0, Math.min(scene.w - W, p.x - W / 2));
  state.camera.y = Math.max(0, Math.min(scene.h - H, p.y - H / 2));

  const inter = nearestInteraction();
  if (inter && interactPressed()) {
    audio.sfx('confirm');
    spawnEffect(state.player.x + 8, state.player.y - 8, inter.label.toUpperCase().slice(0, 15), '#ffe78a');
    inter.action();
  }
}

function spawnEffect(x, y, text, color = '#ffe78a') {
  state.effects.push({ x, y, text, color, t: 0, life: 1.15 });
  if (state.effects.length > 12) state.effects.shift();
}

function drawEffects() {
  for (const e of state.effects) {
    const a = Math.max(0, 1 - e.t / e.life);
    ctx.save();
    ctx.globalAlpha = a;
    outlineText(ctx, e.text, e.x, e.y - e.t * 18, e.color, 7, 'center');
    ctx.restore();
  }
}

function nearestInteraction() {
  const scene = scenes[state.scene];
  if (!scene) return null;
  const list = scene.interactions().filter((i) => !i.hidden);
  if (state.flags.freeRoam && state.scene !== 'hub') {
    list.push({ x: 272, y: 378, w: 116, h: 34, label: 'Exit → Neighborhood', action: () => enterHub(false) });
  }
  const pc = { x: state.player.x + 8, y: state.player.y + 12 };
  let best = null;
  let bestD = Infinity;
  for (const it of list) {
    const cx = Math.max(it.x, Math.min(pc.x, it.x + it.w));
    const cy = Math.max(it.y, Math.min(pc.y, it.y + it.h));
    const d = Math.hypot(pc.x - cx, pc.y - cy);
    if (d < (it.radius || 32) && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}

// ---------- House story ----------
function houseInteractions() {
  const s = state.flags.houseStep;
  const list = [];
  if (s === 0) list.push({ x: 214, y: 30, w: 38, h: 34, label: 'Flip TV', action: tvSequence });
  if (s === 1) list.push({ x: 20, y: 105, w: 34, h: 28, radius: 56, label: 'Read card', action: readCard });
  if (s === 2) list.push({ x: 108, y: 10, w: 58, h: 28, label: 'Look outside', action: lookWindow });
  if (s === 3) list.push({ x: 468, y: 86, w: 52, h: 42, radius: 60, label: 'Talk to AJ', action: talkAJ });
  if (s === 4) list.push({ x: 291, y: 24, w: 35, h: 44, label: 'Check mirror', action: checkMirror });
  if (s === 5) list.push({ x: 78, y: 240, w: 112, h: 46, label: 'Sit on couch', action: sitCouch });
  if (s === 6 && !state.flags.freeRoam) list.push({ x: 316, y: 386, w: 42, h: 22, label: 'Get groceries', action: leaveForGroceries });
  if (state.flags.freeRoam) {
    list.push({ x: 108, y: 10, w: 58, h: 28, label: 'Geese update', action: () => startDialog([
      { speaker: 'system', name: 'Geese', text: 'Honk. Hooonk. HONK.' },
      { speaker: 'tony', text: 'You’re still here? What are you, part owners?' },
      { speaker: 'narrator', text: 'One goose appears to be wearing a tiny laurel wreath. Nobody explains this.' }
    ]) });
    list.push({ x: 560, y: 22, w: 48, h: 42, label: 'Cousin photo', action: () => startDialog([
      { speaker: 'tony', text: 'Every time I look at this guy I feel like I owe him money.' },
      { speaker: 'aj', text: 'That’s what makes it art, Dad.' }
    ]) });
    if (state.player.kind === 'george' && !state.flags.marbleRye && !(state.rye && state.rye.active)) {
      list.push({ x: 300, y: 370, w: 90, h: 40, label: 'Marble Rye Heist', action: startRyeHeist });
    }
    if (state.rye && state.rye.active && !state.rye.hasRye) {
      list.push({ x: 440, y: 268, w: 90, h: 56, label: 'Grab the rye', action: grabRye });
    }
    if (state.rye && state.rye.active && state.rye.hasRye) {
      list.push({ x: 300, y: 370, w: 90, h: 40, label: 'Escape with rye', action: escapeRye });
    }
  }
  return list;
}

function startRyeHeist() {
  state.rye = {
    active: true,
    hasRye: false,
    caughtT: 0,
    guards: [
      { kind: 'carmela', x: 440, y: 240, wp: [[440, 230], [560, 230], [560, 330], [440, 330]], wi: 0, dir: 'down' },
      { kind: 'womanA', x: 300, y: 260, wp: [[140, 250], [330, 250], [330, 350], [140, 350]], wi: 0, dir: 'left' }
    ]
  };
  objective('Steal the marble rye — don’t get spotted!');
  audio.sfx('denied');
  startDialog([
    { speaker: 'george', text: 'The rye. They took it back uneaten. Uneaten! That bread cost me four dollars and my dignity.' },
    { speaker: 'narrator', text: 'Sneak to the kitchen table, grab the marble rye, and escape without being spotted. If they see you, you drop everything.' },
    { speaker: 'george', text: 'This is not stealing. This is bread repatriation.' }
  ]);
}

function grabRye() {
  state.rye.hasRye = true;
  audio.sfx('pickup');
  spawnEffect(state.player.x + 8, state.player.y - 10, 'RYE ACQUIRED', '#ffe78a');
  objective('Escape with the rye!');
}

function escapeRye() {
  state.flags.marbleRye = true;
  state.flags.heat = Math.max(0, (state.flags.heat || 0) - 1);
  state.rye.active = false;
  state.rye = null;
  audio.sfx('success');
  objective('Scheme complete: Marble Rye Heist');
  startDialog([
    { speaker: 'george', text: 'I got it! The bread is mine! Tell the Rosses nothing!' },
    { speaker: 'narrator', text: 'Somewhere, an elderly couple remains unaware that dinner-roll justice has been served.' },
    { speaker: 'tony', text: 'You risked a criminal record over bread. I almost respect it.' }
  ]);
}

function updateRyeHeist(dt) {
  const r = state.rye;
  if (!r || !r.active || state.scene !== 'house') return;
  r.caughtT = Math.max(0, r.caughtT - dt);
  const p = state.player;
  for (const g of r.guards) {
    const target = g.wp[g.wi];
    const dx = target[0] - g.x, dy = target[1] - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) g.wi = (g.wi + 1) % g.wp.length;
    else {
      g.x += dx / d * 42 * dt;
      g.y += dy / d * 42 * dt;
      g.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    if (r.caughtT <= 0 && Math.hypot(g.x + 8 - (p.x + 8), g.y + 12 - (p.y + 12)) < 44) {
      r.caughtT = 2.5;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
      if (r.hasRye) { r.hasRye = false; spawnEffect(p.x + 8, p.y - 10, 'DROPPED THE RYE', '#ff8e8e'); }
      p.x = 320; p.y = 380;
      audio.sfx('denied');
      audio.voice(g.kind === 'carmela' ? 'carmela' : 'tony');
      startDialog([
        { speaker: 'carmela', text: 'George?! What are you doing in my kitchen?' },
        { speaker: 'george', text: 'Inspecting! I inspect bread. Professional bread inspector. Vanderlay Industries, bread division!' }
      ]);
    }
  }
}

function drawSchemeProps() {
  const r = state.rye;
  if (!r || !r.active || state.scene !== 'house') return;
  if (!r.hasRye) {
    // marble rye on the kitchen table
    const bob = Math.sin(state.time * 3) * 1.5;
    px(ctx, 470, 290 + bob, 26, 12, '#8a5a2e');
    px(ctx, 472, 292 + bob, 22, 8, '#a86f3c');
    for (let i = 0; i < 4; i++) px(ctx, 474 + i * 5, 293 + bob + (i % 2), 2, 4, '#5e3a1c');
    const pulse = (Math.sin(state.time * 4) + 1) / 2;
    ctx.fillStyle = `rgba(255,216,92,${.12 + pulse * .18})`;
    ctx.beginPath();
    ctx.ellipse(483, 296, 26 + pulse * 5, 16 + pulse * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const g of r.guards) {
    drawPerson(ctx, g.x, g.y, g.kind, g.dir, state.frame);
    // vision indicator
    ctx.fillStyle = 'rgba(255,80,60,.18)';
    ctx.beginPath();
    const vx = g.x + 8 + (g.dir === 'right' ? 30 : g.dir === 'left' ? -30 : 0);
    const vy = g.y + 12 + (g.dir === 'down' ? 28 : g.dir === 'up' ? -28 : 0);
    ctx.ellipse(vx, vy, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function houseObjective() {
  return [
    'Flip the TV',
    'Read Carmela’s card',
    'Look at the geese',
    'Check on AJ',
    'Check the hallway mirror',
    'Sit on the couch',
    'Get the Thanksgiving groceries'
  ][state.flags.houseStep] || 'Enjoy Thanksgiving';
}

function tvSequence() {
  startDialog([
    { speaker: 'narrator', text: 'The TV is blaring a sweeping war epic. Explosions shake the nightstand.', action: () => { state.flags.tvChannel = 1; } },
    { speaker: 'tony', text: 'Jesus. Tom Hanks and the whole war of the world, first thing in the morning.' },
    { speaker: 'narrator', text: 'Click. A cake competition. Click. A vacuum infomercial. Click. A documentary about ancient Rome.', action: () => { state.flags.tvChannel = 2; } },
    { speaker: 'system', name: 'TV', text: 'Tonight: Augustus — first emperor of Rome, master of image, power, and the perfect profile.', action: () => { state.flags.tvChannel = 3; } },
    { speaker: 'tony', text: 'Augustus, huh? Guy knew how to run a crew.' }
  ], () => {
    state.flags.houseStep = 1;
    objective(houseObjective());
  });
}

function readCard() {
  startDialog([
    { speaker: 'narrator', text: 'A cream-colored card sits on the nightstand, weighted down by a turkey-shaped magnet.' },
    { speaker: 'carmela', text: 'Tony — errands. Bread, mozzarella, prosciutto, pie. And please do not come home with only gabagool. — Carmela' },
    { speaker: 'tony', text: 'Four things. How hard could that be?' }
  ], () => {
    state.flags.hasCard = true;
    objective('Answer Meadow’s call');
    ringPhone('meadow', [
      { speaker: 'meadow', text: 'Dad, remember to pay the deposit on my dorm. It is literally due today.' },
      { speaker: 'tony', text: 'Yeah, yeah. I got it. Don’t worry.' },
      { speaker: 'meadow', text: 'You said that yesterday.' },
      { speaker: 'tony', text: 'And I meant it yesterday too.' }
    ], () => {
      state.flags.houseStep = 2;
      objective(houseObjective());
    });
  });
}

function lookWindow() {
  startDialog([
    { speaker: 'narrator', text: 'Outside, the geese patrol the lawn like they pay the mortgage.' },
    { speaker: 'tony', text: 'Look at these freeloaders. No respect for property lines.' },
    { speaker: 'system', name: 'Geese', text: 'Honk. Honk honk. Hooooonk.', action: () => audio.sfx('turkey') },
    { speaker: 'tony', text: 'Yeah, Happy Thanksgiving to you too.' }
  ], () => {
    state.flags.sawGeese = true;
    state.flags.houseStep = 3;
    objective(houseObjective());
  });
}

function talkAJ() {
  startDialog([
    { speaker: 'narrator', text: 'A jittery stream flashes on AJ’s monitor. The streamer calls himself Plav and rates jawlines like Roman coins.' },
    { speaker: 'plav', text: 'Bro. BRO. If you are not looksmaxxing, you are getting replaced. It is over for uncooked bones.' },
    { speaker: 'tony', text: 'Will you shut that off?' },
    { speaker: 'aj', text: 'You just revealed your own ignorance.' },
    { speaker: 'tony', text: 'Will you shut up?' },
    { speaker: 'aj', text: 'Seriously, Dad. Looksmaxxing. The guys from New York are all doing it now. Especially Uncle Phil.' },
    { speaker: 'tony', text: 'Uncle Phil couldn’t max a credit card.' },
    { speaker: 'narrator', text: 'On the wall, a framed photo of a bug-eyed cousin is labeled “Cousin Tony.” AJ refuses to explain it.' }
  ], () => {
    state.flags.ajDone = true;
    objective('Answer Paulie’s call');
    ringPhone('paulie', [
      { speaker: 'paulie', text: 'Ton’, I’d really love to have you sit for a portrait with my mother and I. I got the painter coming, all the way from Buffalo. Can you be there?' },
      { speaker: 'tony', text: 'A portrait? Paulie, I’m trying to get through Thanksgiving here.' },
      { speaker: 'paulie', text: 'He’s very reasonable. For Buffalo.' },
      { speaker: 'tony', text: 'I’ll circle back. Don’t let the painter paint my mother into the background.' }
    ], () => {
      state.flags.houseStep = 4;
      objective(houseObjective());
    });
  });
}

function checkMirror() {
  startDialog([
    { speaker: 'narrator', text: 'Tony stops at the hallway mirror. He turns left. Then right. Then lifts the robe an inch and regrets it.' },
    { speaker: 'tony', text: 'You know… maybe I could use a little looksmaxxing.' },
    { speaker: 'tony', text: 'Not a lot. Just enough to intimidate the mashed potatoes.' }
  ], () => {
    state.flags.mirrorDone = true;
    objective('Answer Dr. Melfi’s call');
    ringPhone('melfi', [
      { speaker: 'melfi', text: 'Tony, I haven’t seen you in a few weeks. Please call my office to schedule an appointment.' },
      { speaker: 'tony', text: 'I been a little busy, you know? Romans, protein, the holidays.' },
      { speaker: 'melfi', text: '…Call the office, Tony.' },
      { speaker: 'tony', text: 'Yeah. Soon as I figure out which century I’m in.' }
    ], () => {
      state.flags.houseStep = 5;
      objective(houseObjective());
    });
  });
}

function sitCouch() {
  startDialog([
    { speaker: 'narrator', text: 'Tony sinks into the couch. The Rome documentary hums. His eyes get heavy.' },
    { speaker: 'tony', text: 'Five minutes. That’s all. Five minutes.' }
  ], () => {
    state.mode = 'dream';
    state.dreamT = 0;
    audio.setMusic('dream');
  });
}

function leaveForGroceries() {
  objective('Answer Christopher’s call');
  ringPhone('christopher', [
    { speaker: 'christopher', text: 'Ton’, that guy that owes us money — I saw him by your house.' },
    { speaker: 'tony', text: 'By my house? On Thanksgiving?' },
    { speaker: 'christopher', text: 'Black sedan. Real slippery type. He just pulled away.' },
    { speaker: 'tony', text: 'I see him. I’m on it.' }
  ], () => {
    initDrive();
    state.mode = 'drive';
    audio.setMusic('drive');
    objective('Chase the black sedan');
  });
}

// ---------- Rome ----------
function romeInteractions() {
  const list = [
    { x: 226, y: 205, w: 80, h: 72, label: 'Watch square', action: watchRomanStreamer }
  ];
  if (state.flags.romeStep === 0) list.push({ x: 642, y: 138, w: 52, h: 50, label: 'Meet Augustus', action: talkAugustus });
  if (state.flags.romeStep === 1) list.push({ x: 744, y: 150, w: 48, h: 34, label: 'Enter chamber', action: enterChamber });
  if (state.flags.freeRoam) {
    list.push({ x: 238, y: 210, w: 70, h: 70, label: 'Encore stream', action: () => startDialog([
      { speaker: 'plav', name: 'Roman Plav', text: 'Back by popular demand! Today we rate marble busts by jawline.' },
      { speaker: 'tony', text: 'Guy somehow has a residency across two millennia. I respect the grind.' }
    ]) });
    list.push({ x: 650, y: 138, w: 58, h: 52, label: 'Augustus encore', action: () => startDialog([
      { speaker: 'augustus', text: 'Cousin Tony! Rome has installed a juice bar in your honor.' },
      { speaker: 'tony', text: 'That’s actually the nicest thing anybody did for me all holiday.' }
    ]) });
  }
  return list;
}

function watchRomanStreamer() {
  startDialog([
    { speaker: 'narrator', text: 'A Roman influencer poses inside an empty wooden square while a crowd watches him “stream.”' },
    { speaker: 'plav', name: 'Roman Plav', text: 'Citizens! Mog the weak frame! Mewing is the law of the empire!' },
    { speaker: 'tony', text: 'Two thousand years and somehow this guy is still streaming.' }
  ]);
}

function talkAugustus() {
  startDialog([
    { speaker: 'augustus', text: 'Cousin Tony!', action: () => { audio.sfx('success'); state.player.x = 614; state.player.y = 148; state.player.dir = 'right'; } },
    { speaker: 'narrator', text: 'Augustus kisses Tony on both cheeks. His jawline could open mail.', action: () => { state.player.x = 632; state.player.y = 148; state.player.dir = 'right'; state.playerPose = 'lean'; } },
    { speaker: 'augustus', text: 'You look rough, Ton.' },
    { speaker: 'tony', text: 'Really? You think so?' },
    { speaker: 'augustus', text: 'You have to max, Ton. You cannot be a boss like this. It is a new era.' },
    { speaker: 'augustus', text: 'Come. Get glammed out. Rome did not become Rome with a recessed chin.' }
  ], () => {
    state.playerPose = null;
    state.flags.romeStep = 1;
    objective('Enter the glow-up chamber');
  });
}

function enterChamber() {
  setScene('chamber', 320, 330);
  objective('Stand at the mirror');
}

function chamberInteractions() {
  if (!state.flags.boneDone) return [{ x: 280, y: 42, w: 80, h: 46, label: 'Use mirror', action: startBoneIntro }];
  return [];
}

function startBoneIntro() {
  startDialog([
    { speaker: 'augustus', text: 'Stand before the mirror. Strike only when the meter hits gold.' },
    { speaker: 'augustus', text: 'Remember to get the microfractures.' },
    { speaker: 'tony', text: 'This is the dumbest thing I ever agreed to.' }
  ], () => startBoneGame());
}

function startBoneGame() {
  state.mode = 'bone';
  state.bone = { power: 8, dir: 1, hits: 0, combo: 0, flash: 0, message: 'Press A / Space in the gold zone' };
}
function boneZone(b) {
  const width = Math.max(8, 20 - b.hits * 2);
  const start = 24 + (b.hits % 3) * 12;
  return { start, end: start + width, width };
}

function updateBone(dt) {
  const b = state.bone;
  b.power += b.dir * dt * 120;
  if (b.power > 100) { b.power = 100; b.dir = -1; }
  if (b.power < 0) { b.power = 0; b.dir = 1; }
  b.flash = Math.max(0, b.flash - dt);
  if (interactPressed()) {
    const zone = boneZone(b);
    if (b.power >= zone.start && b.power <= zone.end) {
      const center = (zone.start + zone.end) / 2;
      const perfect = Math.abs(b.power - center) < 2.5;
      b.combo = perfect ? b.combo + 1 : 0;
      b.hits += perfect && b.combo >= 2 ? 2 : 1;
      state.stats.smashes += 1;
      b.flash = perfect ? .48 : .3;
      b.message = perfect ? `PERFECT microfracture x${b.combo + 1}` : ['Hollow bones activated', 'Jawline forming', 'Cheekbones: imperial', 'Mewing intensity rising'][Math.min(3, b.hits - 1)] || 'Maxxing';
      audio.sfx('smash');
    } else {
      b.combo = 0;
      b.message = 'Too soft. Wait for gold.';
      audio.sfx('denied');
    }
    if (b.hits >= 6) {
      state.flags.boneDone = true;
      startDialog([
        { speaker: 'augustus', text: 'Excellent. The bones are properly intimidated.' },
        { speaker: 'augustus', text: 'Now — peptides. They will be evasive. The room may spin. Catch them.' },
        { speaker: 'tony', text: 'Why is everything in this empire a lawsuit?' }
      ], () => startPeptides());
    }
  }
}

function startPeptides() {
  state.mode = 'peptides';
  state.pep = {
    caught: 0,
    time: 0,
    spawn: 0,
    vials: [],
    dizzy: 0,
    x: 320,
    y: 220,
    boost: 0,
    flashT: 0,
    message: 'Catch glowing peptides'
  };
}

function updatePeptides(dt) {
  const g = state.pep;
  g.time += dt;
  g.flashT = Math.max(0, (g.flashT || 0) - dt);
  g.dizzy = (Math.sin(g.time * 1.1) + 1) / 2;
  g.spawn -= dt;
  if (g.spawn <= 0) {
    g.spawn = .75;
    const roll = Math.random();
    const kind = roll < .18 ? 'gold' : roll < .34 ? 'bad' : 'normal';
    g.vials.push({ kind, x: 80 + Math.random() * 480, y: 70 + Math.random() * 240, vx: (Math.random() - .5) * (kind === 'gold' ? 90 : 45), vy: (Math.random() - .5) * (kind === 'gold' ? 90 : 45) });
  }
  const input = moveInput();
  const inversion = g.dizzy > .62 ? -1 : 1;
  const sway = Math.sin(g.time * 3) * .35 * g.dizzy;
  const ix = input.x * inversion + input.y * sway;
  const iy = input.y * inversion - input.x * sway;
  g.boost = Math.max(0, g.boost - dt);
  const moveSpeed = 125 * (g.boost > 0 ? 1.55 : 1);
  g.x = Math.max(45, Math.min(595, g.x + ix * moveSpeed * dt));
  g.y = Math.max(65, Math.min(325, g.y + iy * moveSpeed * dt));
  for (const v of g.vials) {
    v.x += v.vx * dt;
    v.y += v.vy * dt;
    if (v.x < 45 || v.x > 595) v.vx *= -1;
    if (v.y < 65 || v.y > 325) v.vy *= -1;
  }
  for (let i = g.vials.length - 1; i >= 0; i--) {
    const v = g.vials[i];
    if (Math.hypot(v.x - g.x, v.y - g.y) < 17) {
      g.vials.splice(i, 1);
      if (v.kind === 'bad') {
        g.caught = Math.max(0, g.caught - 1);
        g.dizzy = 1;
        g.message = 'CONTAMINATED! -1 peptide';
        audio.sfx('crash');
      } else {
        g.caught += v.kind === 'gold' ? 2 : 1;
        state.stats.vials += 1;
        g.flashT = 1.2;
        spawnEffect(g.x, g.y - 18, v.kind === 'gold' ? 'IN THE BLOOD!' : '+peptide', v.kind === 'gold' ? '#ffe78a' : '#8ffff2');
        if (v.kind === 'gold') {
          g.boost = 2.6;
          g.message = 'GOLD PEPTIDE: speed boost, +2';
        } else g.message = 'Peptide secured';
        audio.sfx('pickup');
      }
    }
  }
  if (g.caught >= 8) {
    state.player.kind = 'tonyMax';
    setScene('rome', 650, 205);
    state.mode = 'explore';
    startDialog([
      { speaker: 'augustus', text: 'Okay. Time to go, Ton. You look great.' },
      { speaker: 'narrator', text: 'Tony’s reflection now has the confidence of a marble statue and the haircut of a man who owns three juice blenders.' },
      { speaker: 'tony', text: 'I do look pretty good. Still wouldn’t trust these peptides near a ziti.' },
      { speaker: 'augustus', text: 'Go, cousin. Thanksgiving waits for no emperor.' }
    ], wakeFromDream);
  }
}

function wakeFromDream() {
  setScene('house', 250, 306);
  state.mode = 'explore';
  state.flags.houseStep = 6;
  objective(houseObjective());
  startDialog([
    { speaker: 'narrator', text: 'Tony jolts awake on the couch. The documentary credits roll. The robe is somehow tighter around the jaw.' },
    { speaker: 'tony', text: 'Groceries. Right. Carmela’s card. Focus.' }
  ]);
}

// ---------- Driving ----------
function initDrive() {
  if (state.unlocked) state.unlocked.drive = true;
  state.drive = {
    x: 320,
    y: 292,
    progress: 0,
    score: 0,
    health: 3,
    road: 0,
    spawn: .2,
    obstacles: [],
    shake: 0,
    boost: 0,
    finished: false
  };
}

function updateDrive(dt) {
  updatePhone(dt);
  const d = state.drive;
  if (!d || d.finished) return;
  const input = moveInput();
  d.x = Math.max(205, Math.min(435, d.x + input.x * 190 * dt));
  d.boost = Math.max(0, d.boost - dt);
  const boostMul = d.boost > 0 ? 1.75 : 1;
  d.road += dt * (185 + d.progress * .6) * boostMul;
  d.progress += dt * 2.7 * boostMul;
  d.spawn -= dt;
  if (d.spawn <= 0) {
    d.spawn = Math.max(.45, .88 - d.progress * .004);
    const typeRoll = Math.random();
    const type = typeRoll < .14 ? 'money' : typeRoll < .42 ? 'gabagool' : typeRoll < .58 ? 'nycrew' : typeRoll < .78 ? 'janice' : 'paulie';
    const lanes = [220, 275, 330, 385, 430];
    d.obstacles.push({
      type,
      x: lanes[Math.floor(Math.random() * lanes.length)],
      y: -45,
      vx: type === 'janice' ? (Math.random() > .5 ? 70 : -70) : type === 'paulie' ? (Math.random() - .5) * 55 : type === 'nycrew' ? (Math.random() - .5) * 90 : 0,
      hit: false,
      sprite: Math.random() < .5 ? 'silvio' : 'christopher',
      wobble: Math.random() * 10
    });
  }
  for (const o of d.obstacles) {
    o.y += dt * (150 + d.progress * .8);
    o.x += o.vx * dt;
    if (o.spin) { o.y += dt * 160; o.x += o.vx * dt * 2.4; o.spin -= dt; }
    if (o.x < 190 || o.x > 450) o.vx *= -1;
    const ox = o.x - 13, oy = o.y - 12;
    const car = { x: d.x - 13, y: d.y - 18, w: 26, h: 34 };
    if (!o.hit && rectsOverlap(car, { x: ox, y: oy, w: 26, h: 24 })) {
      o.hit = true;
      if (o.type === 'money') {
        d.boost = 2.7;
        d.progress = Math.min(100, d.progress + 4);
        audio.sfx('pickup');
      } else if (o.type === 'nycrew') {
        d.score += 250;
        d.progress = Math.min(100, d.progress + 2.5);
        d.boost = Math.max(d.boost, 1.1);
        o.spin = 1;
        spawnEffect(o.x, o.y - 8, '+250 NY CREW', '#ffe78a');
        audio.sfx('smash');
        audio.voice('junior');
      } else {
        d.health -= 1;
        d.progress = Math.max(0, d.progress - 3);
        d.shake = .45;
        state.stats.crashes += 1;
        audio.sfx(o.type === 'gabagool' ? 'splash' : 'crash');
        if (d.health <= 0) {
          d.health = 3;
          d.progress = Math.max(0, d.progress - 8);
        }
      }
    }
  }
  d.obstacles = d.obstacles.filter((o) => o.y < 410);
  d.shake = Math.max(0, d.shake - dt);
  if (d.progress >= 100) {
    d.finished = true;
    if (state.flags.freeRoam) {
      startDialog([
        { speaker: 'narrator', text: 'The debtor escapes again, but Tony considers the chase a successful cardio exercise.' },
        { speaker: 'tony', text: 'That’s enough driving. I’m gonna go annoy somebody in person.' }
      ], () => enterHub(false));
    } else {
      startDialog([
        { speaker: 'narrator', text: 'The black sedan jerks into a narrow apartment lot. A nervous little man bolts inside.' },
        { speaker: 'tony', text: 'Now I got him.' }
      ], () => enterApartment());
    }
  }
}

// ---------- Apartment ----------
function enterApartment() {
  setScene('apartment', 498, 126);
  state.flags.aptStep = 0;
  state.player.dir = 'down';
  state.npcs.jerryApt = { x: 266, y: 212, dir: 'right', pose: 'sit' };
  state.npcs.georgeApt = { x: 42, y: 122, dir: 'down', pose: 'stand' };
  state.mode = 'explore';
  objective('Follow the debtor inside');
  startDialog([
    { speaker: 'narrator', text: 'Tony shoulders through the door into a familiar-looking sitcom apartment.', action: () => { audio.sfx('door'); moveActor(state.player, 300, 176, 150, () => moveActor(state.player, 146, 246, 150, () => moveActor(state.player, 296, 372, 150))); } },
    { speaker: 'tony', text: 'There you are.', action: () => { state.player.dir = 'left'; } },
    { speaker: 'jerry', text: 'George? Why is a large man jogging into my apartment?', action: () => { const j = state.npcs.jerryApt; if (j) { j.pose = 'stand'; moveActor(j, 222, 250, 90); } } },
    { speaker: 'narrator', text: 'George emerges from the kitchen holding a spoon and the expression of a man already negotiating.', action: () => moveActor(state.npcs.georgeApt, 280, 166, 64) },
    { speaker: 'george', text: 'Jerry, I can explain. Legally speaking, I probably cannot explain.' }
  ], () => {
    state.flags.aptStep = 1;
    objective('Pick up the bat');
  });
}

function apartmentInteractions() {
  const s = state.flags.aptStep;
  const list = [];
  if (s === 1 && !state.flags.hasBat) list.push({ x: 204, y: 308, w: 44, h: 36, label: 'Pick up bat', action: pickBat });
  if (s === 2) list.push({ x: 262, y: 152, w: 46, h: 42, label: 'Confront George', action: confrontGeorge });
  if (s === 3) list.push({ x: 240, y: 300, w: 110, h: 40, label: 'Sit for dinner', action: sitDinner });
  if (state.flags.freeRoam) {
    if (state.player.kind === 'george' && !state.flags.humanFund) list.push({ x: 232, y: 306, w: 164, h: 52, label: 'Human Fund', action: humanFundScheme });
    list.push({ x: 78, y: 8, w: 150, h: 100, radius: 44, label: 'Cereal shelf', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'george', text: 'Jerry, the cereal-to-company ratio in this kitchen is why I am the way I am.' },
        { speaker: 'jerry', text: 'You were like this before the cereal, George.' },
        { speaker: 'george', text: 'The cereal accelerated it!' }
      ]);
      else startDialog([
        { speaker: 'jerry', text: 'You can tell a lot about a man by his cereal-to-company ratio.' },
        { speaker: 'tony', text: 'I’m more of a pork store guy.' },
        { speaker: 'george', text: 'That explains the fiscal structure of your pantry.' }
      ]);
    } });
    list.push({ x: 556, y: 20, w: 74, h: 134, radius: 44, label: 'Bike', action: () => startDialog([
      { speaker: 'tony', text: 'Who keeps a bike inside? Guy’s afraid of the outdoors?' },
      { speaker: 'jerry', text: 'It’s decorative transportation.' }
    ]) });
  }
  return list;
}

function humanFundScheme() {
  state.playerPose = 'perform';
  state.player.x = 188;
  state.player.y = 202;
  state.player.dir = 'left';
  spawnEffect(126, 206, 'FLYER', '#8ffff2');
  audio.sfx('pickup');
  startDialog([
    { speaker: 'george', text: 'Jerry, before you say anything — the Human Fund. Money for people.' },
    { speaker: 'jerry', text: 'George, this is a blank index card with a turkey drawn on it.' },
    { speaker: 'george', text: 'It is a prototype of generosity. The branding is very fluid.' },
    { speaker: 'elaine', text: 'You are charging people for a fake charity in my pie kitchen?' },
    { speaker: 'george', text: 'Not charging. Cultivating donors. There is a difference, legally speaking. Probably.' },
    { speaker: 'narrator', text: 'George physically presses the “donation card” into Jerry’s hand. Jerry immediately hands it back.' , action: () => { spawnEffect(122, 198, 'NOPE', '#ff8f8f'); audio.sfx('denied'); } },
    { speaker: 'jerry', text: 'Congratulations. You invented a charity with negative donations.' },
    { speaker: 'george', text: 'Negative donations are still donations, Jerry.' }
  ], () => {
    state.playerPose = null;
    state.flags.humanFund = true;
    objective('Scheme complete: Human Fund prototype');
    spawnEffect(state.player.x + 8, state.player.y - 8, 'SCHEME +1', '#ffe78a');
    audio.sfx('success');
  });
}

function pickBat() {
  state.flags.hasBat = true;
  startDialog([
    { speaker: 'tony', text: 'You know, my Uncle Junior took me to see the Yankees as a kid.', action: () => { state.player.dir = 'left'; audio.voice('tony'); } },
    { speaker: 'jerry', text: 'Hmm. You don’t look like a varsity athlete.' },
    { speaker: 'george', text: 'What are you, a scout?' },
    { speaker: 'jerry', text: 'Woah, George — is this guy here because of your Human Fund?' },
    { speaker: 'george', text: 'Steinbrenner’s not going to like this. I need to be back at the office in an hour.' },
    { speaker: 'narrator', text: 'The door explodes open.', action: () => { state.flags.kramerIn = true; audio.sfx('door'); } },
    { speaker: 'kramer', text: 'Ohhh, tension. I love Thanksgiving tension.' },
    { speaker: 'jerry', text: 'Alright, sit down, fella. We’re about to have Thanksgiving.' },
    { speaker: 'narrator', text: 'Tony looks at George. Then at the food. Then back at George.' }
  ], () => {
    state.flags.aptStep = 2;
    objective('Walk over to George');
  });
}

function confrontGeorge() {
  startDialog([
    { speaker: 'tony', text: 'You know what happens to guys who make me drive across Jersey on Thanksgiving?' },
    { speaker: 'george', text: 'Can we arbitrate? I’m very good with deadlines. Sometimes I extend them myself.' },
    { speaker: 'narrator', text: 'The door opens again — slower this time.', action: () => { state.flags.elaineIn = true; audio.sfx('door'); } },
    { speaker: 'elaine', text: 'What is going on in here?' },
    { speaker: 'tony', text: 'Woah. Who’s that?' },
    { speaker: 'elaine', text: 'The person who brought pie, unlike some people.' },
    { speaker: 'jerry', text: 'Sit down, big guy. Nobody collects debts at Thanksgiving. It’s in the Constitution.' }
  ], () => {
    state.flags.aptStep = 3;
    objective('Sit down for Thanksgiving');
  });
}

function sitDinner() {
  startDialog([
    { speaker: 'narrator', text: 'Tony sits. George slides the mashed potatoes away very slowly.' },
    { speaker: 'jerry', text: 'Happy Thanksgiving, everybody. And remember: no politics, no loans, no Human Fund.' },
    { speaker: 'kramer', text: 'You know, you should do this at your club. Big table. Dark lights. Very forgiving atmosphere.' },
    { speaker: 'tony', text: 'Huh. Thanksgiving at the Bing. That’s not the worst idea I ever heard.' }
  ], () => enterClub());
}

// ---------- Club finale ----------
function enterClub() {
  setScene('club', 320, 350);
  objective('Talk to the crew');
  startDialog([
    { speaker: 'narrator', text: 'That night, the Bing is closed for a private Thanksgiving. Neon warmth, autumn centerpieces, and absolutely no discussion of business.' },
    { speaker: 'tony', text: 'Alright. Before anybody eats, we’re doing gratitude. Quick. Like a stickup.' }
  ]);
}

function clubInteractions() {
  const talked = state.flags.clubTalked;
  const list = [];
  if (!talked.christopher) list.push({ x: 202, y: 182, w: 40, h: 42, label: 'Christopher', action: () => clubTalk('christopher') });
  if (!talked.paulie) list.push({ x: 396, y: 182, w: 40, h: 42, label: 'Paulie', action: () => clubTalk('paulie') });
  if (!talked.silvio) list.push({ x: 304, y: 132, w: 40, h: 42, label: 'Silvio', action: () => clubTalk('silvio') });
  if (state.flags.clubReady && !state.flags.freeRoam) list.push({ x: 292, y: 246, w: 58, h: 36, label: 'Carve turkey', action: finalDinner });
  if (state.flags.freeRoam) {
    list.push({ x: 230, y: 176, w: 180, h: 76, label: 'Table surprise', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'george', text: 'Gentlemen. Art Vandelay. Importer-exporter. I’m looking for investors.' },
        { speaker: 'paulie', text: 'Investors in what?' },
        { speaker: 'george', text: 'Importing. And exporting. Some light smuggling-adjacent consulting.' },
        { speaker: 'silvio', text: 'You got five seconds to stop talking or become a story we tell.' }
      ]);
      else startDialog([
        { speaker: 'paulie', text: 'I saved you a seat, Ton. Also somebody left four roses in the basement. Don’t ask.' },
        { speaker: 'silvio', text: 'The camera is still down there. Hypothetically.' },
        { speaker: 'tony', text: 'What am I, the Museum of Bad Decisions?' }
      ]);
    } });
  }
  return list;
}

function clubTalk(who) {
  const lines = {
    christopher: [
      { speaker: 'christopher', text: 'I’m grateful for family, Ton’. And that the black sedan guy had such a small head start.' },
      { speaker: 'tony', text: 'That’s almost sentimental. Don’t make a thing of it.' }
    ],
    paulie: [
      { speaker: 'paulie', text: 'I’m grateful my mother’s portrait came out regal. The Buffalo guy gave me wings. Very tasteful.' },
      { speaker: 'tony', text: 'You look like a sofa in a steakhouse, but congratulations.' }
    ],
    silvio: [
      { speaker: 'silvio', text: 'I’m grateful the club is full, the turkey is moist, and nobody is quoting ancient Rome.' },
      { speaker: 'tony', text: 'Don’t knock Rome. You never met Augustus.' }
    ]
  };
  startDialog(lines[who], () => {
    state.flags.clubTalked[who] = true;
    const count = Object.keys(state.flags.clubTalked).length;
    if (count >= 3) {
      state.flags.clubReady = true;
      objective('Carve the Thanksgiving turkey');
    } else {
      objective(`Talk to the crew (${count}/3)`);
    }
  });
}

function finalDinner() {
  startDialog([
    { speaker: 'narrator', text: 'Tony walks to the head of the table. The crew goes quiet.', action: () => { moveActor(state.player, 320, 150, 110); } },
    { speaker: 'narrator', text: 'He raises the carving knife over the turkey. Somewhere outside, a goose honks with respect.', action: () => { state.playerPose = 'perform'; state.player.dir = 'down'; audio.sfx('turkey'); spawnEffect(320, 176, 'CARVE', '#ffe78a'); } },
    { speaker: 'tony', text: 'Family. That’s the thing. Complicated, loud, sometimes they owe you money — but family.' },
    { speaker: 'christopher', text: 'Beautiful, Ton’.' },
    { speaker: 'paulie', text: 'Can we eat now? The painter says hunger ages the neck.' },
    { speaker: 'tony', text: 'Yeah. Happy Thanksgiving.', action: () => { state.playerPose = null; } }
  ], () => {
    state.mode = 'ending';
    audio.setMusic('ending');
    audio.sfx('success');
  });
}

// ---------- Bonus: Augustus in New Jersey / Satriale's ----------
function startAugustusBonus() {
  state.flags.freeRoam = false;
  state.player.kind = 'augustus';
  state.flags.augustusAJ = false;
  state.flags.satStep = 0;
  setScene('njstreet', 170, 276);
  state.mode = 'explore';
  objective('Bonus: find AJ in New Jersey');
  startDialog([
    { speaker: 'narrator', text: 'BONUS LEVEL — After too much imperial looksmaxxing, Augustus falls asleep in Rome and wakes up in suburban New Jersey.' },
    { speaker: 'augustus', text: 'Either the gods have punished me, or this is New Jersey.' },
    { speaker: 'narrator', text: 'In the distance: a teenager, a phone, and the unmistakable voice of Plav.' }
  ]);
}

function njInteractions() {
  if (!state.flags.augustusAJ) return [{ x: 448, y: 154, w: 44, h: 44, label: 'Talk to AJ', action: meetAugustusAJ }];
  return [];
}

function meetAugustusAJ() {
  startDialog([
    { speaker: 'narrator', text: 'AJ is sitting outside, watching Plav rate jawlines at maximum volume.' },
    { speaker: 'plav', text: 'Bro, even emperors had to max. Augustus was the original mogger.' },
    { speaker: 'augustus', text: 'Young citizen. Why does the tiny rectangular oracle shout about bones?' },
    { speaker: 'aj', text: 'Are you like… a cosplayer? You sound exactly like my dad’s weird dream.' },
    { speaker: 'augustus', text: 'I am Augustus. First citizen of Rome. Here — coins. Follow me, kid.', action: () => audio.sfx('pickup') },
    { speaker: 'aj', text: 'Wait. Is this gold? Oh my god. Okay, I’m following you.' },
    { speaker: 'narrator', text: 'The coins flash. New Jersey folds like a turkey-covered wormhole…', action: () => { setScene('satriale', 318, 354); audio.sfx('success'); } },
    { speaker: 'augustus', text: 'Behold. Satriale’s. A temple of pork, prophecy, and men ignoring their heirs.' }
  ], () => {
    state.flags.augustusAJ = true;
    state.flags.satStep = 0;
    objective('Talk to Bobby');
  });
}

function drawVesuvio() {
  if (drawSceneArt(sceneArt.vesuvio, 640, 416)) {
    // Waitress circulates between tables; Artie fusses near the oven.
    const wx = 320 + Math.sin(state.time * .35) * 110;
    const wy = 240 + Math.cos(state.time * .22) * 60;
    drawPerson(ctx, wx, wy, 'womanD', Math.sin(state.time * .35) > 0 ? 'right' : 'left', state.frame * 2);
    drawPerson(ctx, 338 + Math.sin(state.time * 1.3) * 2, 192, 'artie', 'down', state.frame, { pose: 'stand' });
    drawPerson(ctx, 180, 246, 'womanC', 'right', state.frame + 1, { pose: 'stand' });
    // oven fire flicker
    const f = Math.sin(state.time * 11) * 2;
    px(ctx, 478, 96 + f * .4, 34, 22 + f, '#ff9b32');
    px(ctx, 486, 102 + f * .5, 18, 14 + f, '#ffd23e');
    return;
  }
  px(ctx, 0, 0, 640, 416, '#7a2e22');
  outlineText(ctx, 'VESUVIO', 320, 200, '#ffd872', 16, 'center');
}

function vesuvioInteractions() {
  const list = [
    { x: 320, y: 176, w: 48, h: 44, label: 'Artie', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'george', text: 'You ever pretend to own a restaurant to impress a waitress? Asking for a friend.' },
        { speaker: 'artie', text: 'I actually own the restaurant. It impresses nobody. Less than nobody.' },
        { speaker: 'george', text: 'See, that’s your problem. No mystique. You need an alias. Art Vandelay, importer-exporter.' }
      ]);
      else startDialog([
        { speaker: 'artie', text: 'Tony! You see the new waitress? She refilled my water twice. Twice, Tony.' },
        { speaker: 'tony', text: 'She’s a waitress, Artie. That’s the job.' },
        { speaker: 'artie', text: 'Charmaine says the same thing. But there was eye contact. Very meaningful. Very moist.' },
        { speaker: 'tony', text: 'Moist eye contact. That’s a new one. Eat something, you’re getting lightheaded.' }
      ]);
    } },
    { x: 160, y: 232, w: 46, h: 44, label: 'Charmaine', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'george', text: 'If a man — hypothetically — wanted a free meal, what would be the policy here?' },
        { speaker: 'charmaine', text: 'The policy is you pay, hypothetically.' }
      ]);
      else startDialog([
        { speaker: 'charmaine', text: 'Tony. Tell my husband the waitress is not in love with him.' },
        { speaker: 'tony', text: 'Artie’s a romantic. It’s his worst quality. Also the veal’s good.' },
        { speaker: 'charmaine', text: 'He wrote her initials in the risotto special. In balsamic.' }
      ]);
    } },
    { x: 430, y: 30, w: 130, h: 130, radius: 48, label: 'Brick oven', action: () => startDialog([
      { speaker: 'tony', text: 'Real fire. Real crust. This place beats that pie joint across town.' },
      { speaker: 'artie', text: 'Careful. I almost cried hearing that.' }
    ]) }
  ];
  return list;
}

function drawMonks() {
  if (drawSceneArt(sceneArt.monks, 640, 416)) {
    // the gang occupies the center booth; Kramer slides in and out
    const boothY = 236 + Math.sin(state.time * 1.6) * 1;
    drawPerson(ctx, 254, boothY, 'jerry', 'right', state.frame, { pose: 'sit' });
    drawPerson(ctx, 386, boothY, state.player.kind === 'george' ? 'elaine' : 'george', 'left', state.frame + 1, { pose: 'sit' });
    if (state.player.kind === 'george') drawPerson(ctx, 254, boothY + 34, 'elaine', 'right', state.frame, { pose: 'sit' });
    // Kramer bursts through the door on a loop
    const kcycle = (state.time % 14);
    if (kcycle < 5) {
      const kt = kcycle < 2.2 ? kcycle / 2.2 : Math.max(0, 1 - (kcycle - 2.2) / 2.8);
      const kx = 596 - kt * 130;
      const ky = 388 - kt * 130;
      drawPerson(ctx, kx, ky, 'kramer', 'left', state.frame * 2.2);
    }
    // waitress with coffee pot
    const wob = Math.sin(state.time * .8);
    drawPerson(ctx, 320 + wob * 170, 82, 'womanC', wob > 0 ? 'right' : 'left', state.frame * 1.8);
    // pie carousel glint
    const glint = (Math.sin(state.time * 2.4) + 1) / 2;
    px(ctx, 210, 44, 26, 3, `rgba(255,240,180,${.25 + glint * .5})`);
    return;
  }
  px(ctx, 0, 0, 640, 416, '#3f6a66');
  outlineText(ctx, 'MONK’S CAFÉ', 320, 200, '#ffe5a0', 16, 'center');
}

function monksInteractions() {
  const list = [
    { x: 288, y: 200, w: 120, h: 100, radius: 44, label: 'The booth', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'george', text: 'Jerry. Big Salad. I bought it for Elaine once and she never thanked me properly. The thanks ratio was all wrong.' },
        { speaker: 'jerry', text: 'You handed her a salad, George. It wasn’t a kidney.' },
        { speaker: 'elaine', text: 'It had big lettuce, Jerry. Big lettuce.' },
        { speaker: 'george', text: 'Finally! Someone acknowledges the lettuce!' }
      ]);
      else startDialog([
        { speaker: 'jerry', text: 'Tony Soprano in Monk’s. What’s a Jersey guy doing in a Manhattan coffee shop?' },
        { speaker: 'tony', text: 'Heard the coffee’s good. Also your friend owes me a Yankee favor.' },
        { speaker: 'george', text: 'One favor! I mentioned Steinbrenner one time!' },
        { speaker: 'tony', text: 'That’s how it starts, Georgie boy. One favor.' }
      ]);
    } },
    { x: 240, y: 30, w: 160, h: 60, radius: 40, label: 'Order coffee', action: () => {
      audio.sfx('pickup');
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
      spawnEffect(state.player.x, state.player.y - 16, 'COFFEE +calm', '#d8b878');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'george', text: 'Decaf. No — regular. No — decaf in a regular cup. I need people to think I’m reckless.' }
      ] : [
        { speaker: 'tony', text: 'Coffee. Black. Like my soul after talking to my mother.' }
      ]);
    } },
    { x: 570, y: 330, w: 60, h: 80, radius: 42, label: 'Leave', action: () => travelHub('hub') }
  ];
  return list;
}

function drawSoup() {
  if (drawSceneArt(sceneArt.soup, 640, 416)) {
    // the Soup Man glares from behind the counter
    drawPerson(ctx, 180 + Math.sin(state.time * .5) * 18, 120, 'artie', 'right', state.frame, { pose: 'stand' });
    // steam rises off the pots
    for (let i = 0; i < 3; i++) {
      const sy = (state.time * 26 + i * 40) % 70;
      const sx = 60 + i * 52;
      ctx.fillStyle = `rgba(255,255,255,${.3 - sy * .004})`;
      ctx.beginPath();
      ctx.ellipse(sx + Math.sin(state.time * 2 + i) * 4, 60 - sy * .5, 5 + sy * .08, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // impatient line shuffles
    drawPerson(ctx, 410, 96, 'womanA', 'left', state.frame + 1, { pose: 'stand' });
    return;
  }
  px(ctx, 0, 0, 640, 416, '#5a6a72');
  outlineText(ctx, 'SOUP', 320, 200, '#ffe5a0', 16, 'center');
}

function soupInteractions() {
  return [
    { x: 370, y: 110, w: 60, h: 80, radius: 42, label: 'Order soup', action: () => {
      if (state.player.kind === 'george' && !state.flags.soupLesson) {
        state.flags.soupLesson = true;
        audio.sfx('denied');
        spawnEffect(state.player.x, state.player.y - 16, 'NO SOUP FOR YOU!', '#ff8e8e');
        moveActor(state.player, state.player.x + 60, state.player.y + 60, 170);
        startDialog([
          { speaker: 'george', text: 'Yes, hi, hello — I was wondering, and feel free to say no — but is the mulligatawny today truly—' },
          { speaker: 'artie', text: 'You are talking too much! NO SOUP FOR YOU! Next!' },
          { speaker: 'george', text: 'But I— I rehearsed it! I had a whole rhythm!' },
          { speaker: 'narrator', text: 'George is swept toward the door by the sheer force of soup discipline.' }
        ]);
      } else if (state.player.kind === 'george') {
        audio.sfx('pickup');
        state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
        spawnEffect(state.player.x, state.player.y - 16, 'SOUP +1', '#ffe78a');
        startDialog([
          { speaker: 'george', text: 'Crab bisque. Bread. No questions. I know the rules now. I respect the rules.' },
          { speaker: 'artie', text: 'Good. You learn. Next!' }
        ]);
      } else {
        audio.sfx('pickup');
        spawnEffect(state.player.x, state.player.y - 16, 'SOUP +1', '#ffe78a');
        startDialog([
          { speaker: 'tony', text: 'Lobster bisque. And the bread better be fresh.' },
          { speaker: 'artie', text: '...For you, extra bread. Big man, big soup. Next!' },
          { speaker: 'tony', text: 'Guy knows how to run a line. Satriale’s could use him.' }
        ]);
      }
    } },
    { x: 460, y: 90, w: 60, h: 120, radius: 42, label: 'Bread shelf', action: () => startDialog(
      state.player.kind === 'george' ? [
        { speaker: 'george', text: 'If you take the bread before you pay, is it stealing or is it pre-ownership? Asking for me.' }
      ] : [
        { speaker: 'tony', text: 'Nice bread. At my house, Carmela hides the good bread from me. Don’t ask.' }
      ]) },
    { x: 400, y: 356, w: 110, h: 50, radius: 44, label: 'Leave', action: () => travelHub('hub') }
  ];
}

function satrialeInteractions() {
  if (state.flags.freeRoam) {
    return [
      { x: 46, y: 320, w: 96, h: 44, label: 'Produce crate', action: () => startDialog([
        { speaker: 'tony', text: 'After what Junior did, this stuff should be registered as ammunition.' },
        { speaker: 'bobby', text: 'We keep the dangerous tomatoes in the back now.' }
      ]) },
      { x: 262, y: 238, w: 116, h: 42, label: 'Meat table', action: () => startDialog([
        { speaker: 'artie', text: 'Tony! I’m working on a Thanksgiving special: turkey-stuffed capicola.' },
        { speaker: 'tony', text: 'That sounds illegal in at least three states.' }
      ]) }
    ];
  }
  const s = state.flags.satStep;
  if (s === 0) return [{ x: 100, y: 142, w: 42, h: 42, label: 'Talk to Bobby', action: talkSatBobby }];
  if (s === 1) return [{ x: 476, y: 140, w: 42, h: 42, label: 'Talk to Artie', action: talkSatArtie }];
  if (s === 2) return [{ x: 512, y: 304, w: 42, h: 44, label: 'Talk to Irina', action: talkSatIrina }];
  if (s === 3) return [{ x: 300, y: 132, w: 46, h: 44, label: 'Talk to Junior', action: talkSatJunior }];
  return [];
}

function talkSatBobby() {
  startDialog([
    { speaker: 'augustus', text: 'Citizen Bobby, your frame is powerful but your bones are being mogged by gravity.' },
    { speaker: 'bobby', text: 'I’m sorry—mogged? I just came in for capicola.' },
    { speaker: 'augustus', text: 'Mew gently. Hydrate. Never let a chariot see your weak side.' },
    { speaker: 'bobby', text: 'You know, I got a carnival to run. Good luck with… whatever this is.' },
    { speaker: 'narrator', text: 'Bobby shrugs and returns to the counter with the serenity of a man immune to all imperial advice.' }
  ], () => {
    state.flags.satStep = 1;
    objective('Talk to Artie Bucco');
  });
}

function talkSatArtie() {
  startDialog([
    { speaker: 'artie', text: 'You want dimension? Grow a beard. Not Roman emperor giant — a little shadow, clean edges.' },
    { speaker: 'augustus', text: 'A beard? Augustus is already perfect.' },
    { speaker: 'artie', text: 'Perfect is boring. A beard frames the jaw. It adds mystery. Also hides gravy.' },
    { speaker: 'aj', text: 'He’s kind of cooking, Mr. Emperor.' },
    { speaker: 'augustus', text: 'Fine. I shall consider a beard of tasteful conquest.' }
  ], () => {
    state.flags.satStep = 2;
    objective('Talk to Irina');
  });
}

function talkSatIrina() {
  startDialog([
    { speaker: 'irina', text: 'Why are you dressed like museum?' },
    { speaker: 'augustus', text: 'I am giga famous. Statues. Coins. Obituaries in marble.' },
    { speaker: 'irina', text: 'That is nice. I dated a man who thinks he is famous because he owns a garbage truck.' },
    { speaker: 'augustus', text: 'A garbage truck? Rome had those. Very important.' },
    { speaker: 'irina', text: 'You are strange. But confident. I respect this.' }
  ], () => {
    state.flags.satStep = 3;
    objective('Talk to Uncle Junior');
  });
}

function talkSatJunior() {
  startDialog([
    { speaker: 'augustus', text: 'You look like a fed. What’s your age?' },
    { speaker: 'junior', text: 'A fed? I’m standing in a pork store, you overdressed nincompoop.' },
    { speaker: 'junior', text: 'Cazzata, Malanga!', action: () => audio.sfx('crash') },
    { speaker: 'narrator', text: 'Junior starts throwing produce with surprising rotational velocity.' },
    { speaker: 'aj', text: 'Run, Mr. Emperor!' }
  ], () => startProduceGame());
}

function startProduceGame() {
  state.mode = 'produce';
  state.produce = {
    x: 320,
    y: 282,
    hearts: 3,
    time: 0,
    score: 0,
    spawn: .2,
    items: [],
    invuln: 0,
    shake: 0,
    level: 1,
    message: 'Dodge the produce!'
  };
  objective('Dodge Junior’s produce');
}

function updateProduce(dt) {
  const g = state.produce;
  if (!g) return;
  g.time += dt;
  g.score = Math.floor(g.time * 10);
  g.level = 1 + Math.floor(g.time / 12);
  g.invuln = Math.max(0, g.invuln - dt);
  g.shake = Math.max(0, g.shake - dt);
  const input = moveInput();
  const speed = 150 + Math.min(50, g.level * 6);
  g.x = Math.max(42, Math.min(598, g.x + input.x * speed * dt));
  g.y = Math.max(126, Math.min(356, g.y + input.y * speed * dt));
  g.spawn -= dt;
  if (g.spawn <= 0) {
    const difficulty = Math.min(8, g.level);
    g.spawn = Math.max(.18, .72 - difficulty * .065);
    const type = ['tomato', 'pepper', 'lettuce', 'onion'][Math.floor(Math.random() * 4)];
    g.items.push({
      type,
      x: 34 + Math.random() * 572,
      y: 88,
      vx: (Math.random() < .5 ? -1 : 1) * (35 + Math.random() * (75 + difficulty * 14)),
      vy: 95 + difficulty * 18 + Math.random() * 40,
      spin: Math.random() * 8
    });
  }
  for (const it of g.items) {
    it.spin += dt * 8;
    it.x += it.vx * dt;
    it.y += it.vy * dt;
    if (it.x < 30 || it.x > 610) it.vx *= -1;
  }
  for (let i = g.items.length - 1; i >= 0; i--) {
    const it = g.items[i];
    if (it.y > 390) {
      g.items.splice(i, 1);
      continue;
    }
    if (g.invuln <= 0 && Math.hypot(it.x - g.x, it.y - g.y) < 15) {
      g.items.splice(i, 1);
      g.hearts -= 1;
      g.invuln = 1.3;
      g.shake = .45;
      g.message = it.type === 'tomato' ? 'Tomato to the imperial jaw!' : 'Produce impact!';
      audio.sfx('crash');
      if (g.hearts <= 0) {
        loseProduceGame();
        return;
      }
    }
  }
}

function loseProduceGame() {
  const score = state.produce.score;
  startDialog([
    { speaker: 'junior', text: 'Cazzata! Malanga! And stay out!' },
    { speaker: 'narrator', text: `A final tomato strikes Augustus directly on the imperial jawline. Survival score: ${score}.`, action: () => audio.sfx('smash') },
    { speaker: 'narrator', text: 'Augustus jolts awake in his Roman chamber. No Jersey. No pork store. Only laurels, marble, and the distant memory of produce.' },
    { speaker: 'augustus', text: 'Strange. I suddenly desire capicola.' }
  ], () => {
    state.mode = 'ending';
    state.produce = null;
    audio.setMusic('ending');
  }, { cinematic: 'romanWake' });
}

function enterHub(first = false) {
  state.flags.freeRoam = true;
  if (state.player.kind !== 'george') state.player.kind = 'tonyMax';
  state.player.speed = state.player.kind === 'george' ? 96 : 88;
  setScene('hub', 320, 214);
  state.mode = 'explore';
  objective('Free roam: choose a landmark');
  if (first) {
    startDialog([
      { speaker: 'narrator', text: 'Thanksgiving is saved — but North Caldwell is now open. Old places have new surprises.' },
      { speaker: 'tony', text: 'A little fresh air. Maybe I go bother some people recreationally.' }
    ]);
  }
}

function travelHub(place) {
  const destinations = {
    house: ['house', 250, 306, 'Back to the house. The geese have been busy.'],
    satriale: ['satriale', 318, 354, 'Satriale’s smells like cured meat and unresolved grudges.'],
    rome: ['rome', 430, 330, 'The marble arch hums with imperial nonsense.'],
    club: ['club', 320, 330, 'The Bing is quiet again — suspiciously quiet.'],
    apartment: ['apartment', 498, 150, 'The purple door is somehow still unlocked.'],
    vesuvio: ['vesuvio', 320, 360, 'Vesuvio smells like garlic, woodsmoke, and Artie’s bad judgment.'],
    monks: ['monks', 590, 370, 'Monk’s Café. Coffee, big salads, and petty grievances.'],
    soup: ['soup', 450, 370, 'The soup stand. The rules are the rules.'],
    hub: ['hub', 320, 240, 'Back out in the neighborhood.']
  };
  const d = destinations[place];
  if (!d) return;
  setScene(d[0], d[1], d[2]);
  state.mode = 'explore';
  objective('Explore — return to the neighborhood when ready');
  startDialog([{ speaker: 'narrator', text: d[3] }]);
}

function hubInteractions() {
  return [
    { x: 116, y: 128, w: 82, h: 46, label: 'Tony’s house', action: () => travelHub('house') },
    { x: 474, y: 126, w: 102, h: 50, label: 'Satriale’s', action: () => travelHub('satriale') },
    { x: 38, y: 284, w: 104, h: 66, label: 'Roman arch', action: () => travelHub('rome') },
    { x: 500, y: 386, w: 108, h: 22, radius: 44, label: 'Bada Bing', action: () => travelHub('club') },
    { x: 260, y: 292, w: 120, h: 68, label: 'Jerry’s ride', action: () => travelHub('apartment') },
    { x: 176, y: 248, w: 84, h: 56, label: 'Vesuvio', action: () => travelHub('vesuvio') },
    { x: 46, y: 130, w: 66, h: 44, label: 'Monk’s Café', action: () => travelHub('monks') },
    { x: 240, y: 118, w: 86, h: 40, label: 'Soup stand', action: () => travelHub('soup') },
    { x: 400, y: 300, w: 90, h: 40, radius: 40, label: 'Borrow car', action: () => {
      if (state.player.inCar) return;
      state.player.inCar = true;
      state.player.speed = 190;
      audio.sfx('door');
      audio.sfx('honk');
      spawnEffect(state.player.x + 8, state.player.y - 8, state.player.kind === 'george' ? 'BORROWED' : 'MY CAR NOW', '#ffe78a');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'george', text: 'Borrowing. Permanent borrowing. Vandelay Industries has a fleet, technically.' }
      ] : [
        { speaker: 'tony', text: 'Nice car. Means it’s my car now. That’s how that works.' }
      ]);
    } },
    { x: 330, y: 168, w: 92, h: 36, label: 'Chase replay', action: () => {
      initDrive();
      state.mode = 'drive';
      objective('Catch the debtor — grab money boosts');
    } }
  ];
}

function drawHub() {
  if (drawSceneArt(sceneArt.hub, 640, 416)) {
    // Traffic keeps the free-roam neighborhood alive.
    for (let i = 0; i < 2; i++) {
      const cx = ((state.time * (54 + i * 22) + i * 310) % 760) - 60;
      const cy = i ? 268 : 246;
      // horizontal traffic: sideways-simplified but detailed enough to read as cars
      const tx = i ? 700 - cx : cx;
      px(ctx, tx - 2, cy - 2, 38, 17, 'rgba(0,0,0,.3)');
      px(ctx, tx, cy, 34, 13, '#0d1017');
      px(ctx, tx + 1, cy + 1, 32, 11, i ? '#7e2733' : '#31445e');
      px(ctx, tx + 8, cy + 2, 15, 9, '#9fd4ec');
      px(ctx, tx + 10, cy + 4, 11, 5, i ? '#8e3542' : '#3f5a78');
      px(ctx, tx + 3, cy - 2, 6, 3, '#05070c');
      px(ctx, tx + 25, cy - 2, 6, 3, '#05070c');
      px(ctx, tx + 3, cy + 12, 6, 3, '#05070c');
      px(ctx, tx + 25, cy + 12, 6, 3, '#05070c');
      px(ctx, tx + (i ? 1 : 30), cy + 4, 3, 4, '#fff3b0');
    }
    const pulse = (Math.sin(state.time * 4) + 1) / 2;
    ctx.fillStyle = `rgba(255,210,92,${.12 + pulse * .16})`;
    ctx.beginPath();
    ctx.ellipse(92, 318, 44 + pulse * 8, 54 + pulse * 8, 0, 0, Math.PI * 2);
    ctx.fill();
    outlineText(ctx, 'ROME', 92, 360, '#ffe28a', 7, 'center');
    const vpulse = (Math.sin(state.time * 4 + 2) + 1) / 2;
    ctx.fillStyle = `rgba(255,120,72,${.1 + vpulse * .14})`;
    ctx.beginPath();
    ctx.ellipse(218, 276, 30 + vpulse * 5, 24 + vpulse * 5, 0, 0, Math.PI * 2);
    ctx.fill();
    outlineText(ctx, 'VESUVIO', 218, 288, '#ffb98a', 7, 'center');
    // geese wandering near Tony's lawn
    for (let i = 0; i < 3; i++) {
      const gx = 72 + i * 24 + Math.sin(state.time * 1.4 + i) * 4;
      const gy = 150 + (i % 2) * 10;
      px(ctx, gx, gy, 10, 4, '#f4f0dc');
      px(ctx, gx + 7, gy - 3, 3, 5, '#f4f0dc');
      px(ctx, gx + 10, gy - 2, 2, 1, '#e58d2a');
    }
    // parked borrowable car by the curb
    if (!state.player.inCar) {
      drawCar(444, 322, '#31445e');
      const cp = (Math.sin(state.time * 4 + 1) + 1) / 2;
      ctx.fillStyle = `rgba(143,255,242,${.1 + cp * .12})`;
      ctx.beginPath();
      ctx.ellipse(444, 322, 30 + cp * 4, 30 + cp * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    outlineText(ctx, 'FREE ROAM', 320, 24, '#ffe78a', 10, 'center');
    return;
  }
  drawNjStreet();
}

function drawNjStreet() {
  px(ctx, 0, 0, 640, 416, '#83a766');
  // autumn lawns and suburban houses
  px(ctx, 0, 232, 640, 30, '#8a8d86');
  px(ctx, 0, 262, 640, 154, '#6f954f');
  for (let x = 20; x < 640; x += 45) px(ctx, x, 240, 22, 4, '#e5d66a');
  const houses = [[28,28,'#b8754e'],[204,28,'#c4b39a'],[470,28,'#a96b58']];
  houses.forEach(([x,y,c],i)=>{
    px(ctx,x,y, i===1?150:142, i===1?76:98, c);
    px(ctx,x-4,y-8, i===1?158:150, 16, '#5c342c');
    px(ctx,x+18,y+22,26,28,'#e8d6ad');
    px(ctx,x+64,y+22,26,28,'#e8d6ad');
    px(ctx,x+50,y+50,28,42,'#5c342c');
  });
  // autumn trees
  for (let i = 0; i < 8; i++) {
    const x = 28 + i * 82;
    px(ctx,x,196,8,34,'#70462d');
    px(ctx,x-12,174,32,28, ['#d9782e','#c9492e','#dda23a'][i%3]);
    px(ctx,x-5,164,20,18, ['#e58e35','#d35a31','#e6b646'][i%3]);
  }
  // cars moving along the road
  for (let i = 0; i < 2; i++) {
    const cx = ((state.time * (50 + i * 18) + i * 280) % 760) - 70;
    const x = i ? 690 - cx : cx;
    const y = 304 + i * 18;
    const car = movingCarRect(i);
    px(ctx,car.x,car.y,78,32,'#161920'); px(ctx,car.x+6,car.y+6,66,20,i?'#7e2733':'#31445e');
  }
  // AJ with glowing phone showing tiny Plav
  drawPerson(ctx, 454, 166, 'aj', 'left', state.frame);
  px(ctx, 444, 177, 9, 14, '#111827');
  px(ctx, 446, 179, 5, 9, '#45ff98');
  outlineText(ctx, 'PLAV', 430, 160, '#8ffff2', 6);
  outlineText(ctx, 'SUBURBAN DREAM', 320, 392, 'rgba(60,40,20,.35)', 8, 'center');
}

function drawSatriale() {
  const t = state.time;
  const ajX = 350 + Math.sin(t * .85) * 15;
  const ajY = 354 + Math.cos(t * .7) * 4;
  const bobbyX = 112 + Math.sin(t * .55) * 5;
  const artieX = 488 + Math.sin(t * 1.8) * 3;
  const irinaX = 524 + Math.sin(t * .62) * 22;
  const juniorX = 316 + Math.sin(t * 1.1) * 4;
  if (drawSceneArt(sceneArt.satriale, 640, 416)) {
    // AJ trails Augustus while the pork-store regulars work, lean, and react.
    drawPerson(ctx, ajX, ajY, 'aj', 'up', state.frame, { pose: 'phone' });
    drawPerson(ctx, bobbyX, 150, 'bobby', 'down', state.frame, { pose: 'lean' });
    drawPerson(ctx, artieX, 148, 'artie', 'down', state.frame + 1, { pose: 'work' });
    drawPerson(ctx, irinaX, 314, 'irina', irinaX > 524 ? 'left' : 'right', state.frame + 2, { pose: 'lean' });
    drawPerson(ctx, juniorX, 140, 'junior', 'down', state.frame + 3, { pose: 'angry' });
    return;
  }
  px(ctx, 0, 0, 640, 416, '#6c3d32');
  // checker floor
  for (let x = 0; x < 640; x += 20) for (let y = 96; y < 416; y += 20) px(ctx,x,y,20,20,(x/20+y/20)%2?'#7a4a3b':'#9b6a54');
  // back deli counter
  px(ctx, 28, 34, 584, 62, '#4b2b25');
  px(ctx, 38, 44, 564, 28, '#e2d5bd');
  px(ctx, 46, 74, 548, 12, '#8d2e34');
  outlineText(ctx, 'SATRIALE’S PORK STORE', 320, 47, '#7a1f2c', 13, 'center');
  outlineText(ctx, 'EST. MEAT · SANDWICHES · PRODUCE (REGRETTABLY)', 320, 64, '#7a4a32', 6, 'center');
  // hanging meats
  for (let i=0;i<9;i++) {
    const x=52+i*62;
    px(ctx,x,102,18,34,'#9e3f32');
    px(ctx,x+4,96,10,8,'#d7c4a1');
    px(ctx,x+5,110,8,15,'#c96b4d');
  }
  // side tables/cases
  px(ctx,70,136,118,52,'#5b352b'); px(ctx,78,144,102,34,'#c7b18d');
  px(ctx,448,136,118,52,'#5b352b'); px(ctx,456,144,102,34,'#c7b18d');
  for(let i=0;i<5;i++) {
    px(ctx,84+i*18,153,12,8,'#b94134');
    px(ctx,462+i*18,153,12,8,'#e0b64a');
  }
  px(ctx,244,236,152,58,'#5b352b'); px(ctx,252,244,136,40,'#b98c62');
  // produce crates
  px(ctx,46,320,110,48,'#5f3b26');
  px(ctx,482,318,108,48,'#5f3b26');
  for(let i=0;i<6;i++) {
    px(ctx,56+i*15,330,10,8,'#c84435');
    px(ctx,492+i*15,328,10,8,'#699b42');
  }
  // AJ follower
  drawPerson(ctx, ajX, ajY, 'aj', 'up', state.frame);
  // characters pace and react rather than standing frozen
  drawPerson(ctx, bobbyX, 150, 'bobby', 'down', state.frame);
  drawPerson(ctx, artieX, 148, 'artie', 'down', state.frame + 1);
  drawPerson(ctx, irinaX, 314, 'irina', irinaX > 524 ? 'left' : 'right', state.frame + 2);
  drawPerson(ctx, juniorX, 140, 'junior', 'down', state.frame + 3);
}

function drawProduce() {
  const g = state.produce;
  if (!g) return;
  const shakeX = g.shake ? (Math.random() - .5) * 6 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  px(ctx, 0, 0, W, H, '#6c3d32');
  for (let x = 0; x < 640; x += 20) for (let y = 96; y < 416; y += 20) px(ctx,x,y,20,20,(x/20+y/20)%2?'#7a4a3b':'#9b6a54');
  px(ctx, 28, 34, 584, 62, '#4b2b25');
  px(ctx, 38, 44, 564, 28, '#e2d5bd');
  outlineText(ctx, 'SATRIALE’S PRODUCE INCIDENT', 320, 54, '#7a1f2c', 12, 'center');
  drawPerson(ctx, 314, 98, 'junior', 'down', state.frame * 2);
  outlineText(ctx, 'CAZZATA, MALANGA!', 320, 82, '#ffdf6e', 8, 'center');
  const blink = g.invuln > 0 && Math.sin(state.time * 18) > 0;
  if (!blink) drawPerson(ctx, g.x - 8, g.y - 14, 'augustus', 'down', state.frame);
  // flying produce stays visually above the large illustrated avatar for fair dodging
  for (const it of g.items) {
    ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.spin);
    if (it.type === 'tomato') {
      px(ctx,-6,-5,12,10,'#c9332f'); px(ctx,-2,-7,5,3,'#4a8c3e');
    } else if (it.type === 'pepper') {
      px(ctx,-4,-8,8,15,'#4f9b42'); px(ctx,-2,-10,5,3,'#2e6429');
    } else if (it.type === 'lettuce') {
      px(ctx,-7,-6,14,12,'#87b85a'); px(ctx,-4,-4,8,8,'#b5d67c');
    } else {
      px(ctx,-6,-4,12,8,'#d29b3c'); px(ctx,-3,-6,6,3,'#eee0b6');
    }
    ctx.restore();
  }
  ctx.restore();
  drawPanel(10, 10, 280, 42, '#141f3a', '#e5c36a');
  outlineText(ctx, `PRODUCE DODGE  ♥${g.hearts}`, 20, 18, '#ffe78a', 9);
  outlineText(ctx, `Score ${g.score}  Difficulty ${g.level}`, 20, 33, '#fff', 8);
  drawPanel(390, 10, 240, 42, '#141f3a', '#92896f');
  outlineText(ctx, g.message, 510, 25, '#fff', 8, 'center');
}

function drawRomanWake() {
  px(ctx,0,0,W,H,'#211629');
  for (let x=0;x<W;x+=36) for(let y=0;y<H;y+=28) px(ctx,x,y,30,22,(x+y)%72?'#2d2037':'#352744');
  drawColumn(80,70); drawColumn(510,70);
  px(ctx,210,104,220,92,'#5f342c');
  px(ctx,220,114,200,66,'#efe0c5');
  px(ctx,232,122,70,22,'#fff0d6');
  drawPerson(ctx, 306, 130, 'augustus', 'down', state.frame);
  px(ctx,230,164,182,28,'#a52531');
  outlineText(ctx,'ROME AGAIN',320,52,'#ffd978',16,'center');
}

// ---------- Bonus: Paulie Walnuts on The Bachelor ----------
function startBonusIntro() {
  state.bonusReveal = false;
  objective('Bonus level: Paulie’s rose ceremony');
  audio.setMusic('club');
  startDialog([
    { speaker: 'narrator', text: 'BONUS LEVEL — Paulie Walnuts stands in a very serious suit before five women and exactly four roses.' },
    { speaker: 'paulieSuit', name: 'Paulie', text: 'Now you know how much you’ve all meant to me.' },
    { speaker: 'womanA', name: 'Rose', text: 'Oh, get it over with.' },
    { speaker: 'janice', text: 'Paulie, I don’t even know how you got me here, but you better pick me.' },
    { speaker: 'womanB', name: 'Linda', text: 'Wait a second — how did we get here?' },
    { speaker: 'womanC', name: 'Debbie', text: 'Wait… this isn’t The Bachelor.' },
    { speaker: 'narrator', text: 'The camera pans out. This is not a mansion. It is the basement of the Bada Bing, decorated with clip-on roses and one smoke machine.', action: () => { state.bonusReveal = true; audio.sfx('denied'); } },
    { speaker: 'narrator', text: 'Silvio is behind the camera. He slowly lowers it.' },
    { speaker: 'silvio', text: 'Paulie, I told you the lighting guy was non-union.' },
    { speaker: 'janice', text: 'Get him!' },
    { speaker: 'narrator', text: 'Grab turkeys to power up. One woman chases at first — the rest join in. This is now a matter of survival.' }
  ], () => initBonus(), { cinematic: 'bonus' });
}

const BONUS_W = 32;
const BONUS_H = 18;
const BONUS_T = 20;
function bonusWall(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= BONUS_W || ty >= BONUS_H) return true;
  if (tx === 0 || ty === 0 || tx === BONUS_W - 1 || ty === BONUS_H - 1) return true;
  if ((tx === 5 || tx === 26) && ty >= 2 && ty <= 15 && ty !== 8) return true;
  if ((ty === 4 || ty === 13) && tx >= 7 && tx <= 24 && tx !== 15 && tx !== 16) return true;
  if ((tx === 11 || tx === 20) && [6, 7, 10, 11].includes(ty)) return true;
  if ((ty === 7 || ty === 10) && [8, 9, 22, 23].includes(tx)) return true;
  if ((tx === 14 || tx === 17) && ty >= 7 && ty <= 10) return true;
  return false;
}
function openTile(tx, ty) { return !bonusWall(tx, ty); }
function tileCenter(tx, ty) { return { x: tx * BONUS_T + BONUS_T / 2, y: ty * BONUS_T + BONUS_T / 2 }; }
function tileOf(x, y) { return { tx: Math.floor(x / BONUS_T), ty: Math.floor(y / BONUS_T) }; }
function bonusBlocked(x, y, rad = 7) {
  const points = [[x-rad,y-rad],[x+rad,y-rad],[x-rad,y+rad],[x+rad,y+rad]];
  return points.some(([pxx, pyy]) => bonusWall(Math.floor(pxx / BONUS_T), Math.floor(pyy / BONUS_T)));
}
function nearestOpen(tx, ty) {
  if (openTile(tx, ty)) return { tx, ty };
  for (let rad = 1; rad < 8; rad++) {
    for (let yy = ty-rad; yy <= ty+rad; yy++) for (let xx = tx-rad; xx <= tx+rad; xx++) {
      if (openTile(xx, yy)) return { tx: xx, ty: yy };
    }
  }
  return { tx: 1, ty: 1 };
}
function moveBonusEntity(e, dx, dy, rad = 7) {
  if (dx && !bonusBlocked(e.x + dx, e.y, rad)) e.x += dx;
  if (dy && !bonusBlocked(e.x, e.y + dy, rad)) e.y += dy;
}
function findNextTile(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return { tx, ty };
  const key = (x, y) => `${x},${y}`;
  const q = [{ tx: sx, ty: sy }];
  const seen = new Set([key(sx, sy)]);
  const parent = new Map();
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (q.length) {
    const cur = q.shift();
    if (cur.tx === tx && cur.ty === ty) {
      let node = cur;
      let prev = parent.get(key(node.tx, node.ty));
      while (prev && !(prev.tx === sx && prev.ty === sy)) {
        node = prev;
        prev = parent.get(key(node.tx, node.ty));
      }
      return node;
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.tx + dx, ny = cur.ty + dy;
      const k = key(nx, ny);
      if (!openTile(nx, ny) || seen.has(k)) continue;
      seen.add(k);
      parent.set(k, cur);
      q.push({ tx: nx, ty: ny });
    }
  }
  return { tx: sx, ty: sy };
}

function initBonus() {
  const turkeyTiles = [[2,2],[29,2],[2,16],[29,16],[8,8],[23,8],[8,11],[23,11]].map(([x,y]) => nearestOpen(x,y));
  const petals = [];
  for (let ty = 1; ty < BONUS_H - 1; ty++) for (let tx = 1; tx < BONUS_W - 1; tx++) {
    if (openTile(tx, ty) && (tx + ty) % 2 === 0 && !(tx > 13 && tx < 19 && ty > 14)) petals.push({ x: tx * BONUS_T + 10, y: ty * BONUS_T + 10, taken: false });
  }
  const start = tileCenter(16, 16);
  const women = [
    ['janice', 'Janice'], ['womanA', 'Rose'], ['womanB', 'Linda'], ['womanC', 'Debbie'], ['womanD', 'Marie']
  ].map(([kind, name], i) => {
    const home = tileCenter(14 + i, 1);
    return { kind, name, x: home.x, y: home.y, homeX: home.x, homeY: home.y, active: i === 0, respawn: i === 0 ? 0 : 999, pathT: 0, next: null, scared: 0 };
  });
  state.bonus = {
    player: { x: start.x, y: start.y, dir: 'up' },
    turkeys: turkeyTiles.map((t) => ({ ...tileCenter(t.tx, t.ty), taken: false })),
    petals,
    women,
    score: 0,
    level: 1,
    turkeysGot: 0,
    hearts: 3,
    power: 0,
    invuln: 0,
    time: 0,
    status: 'playing',
    message: 'Grab turkeys. Do not get grabbed.'
  };
  state.mode = 'bonus';
  objective('Bonus: collect all 8 turkeys');
  audio.setMusic('club');
}

function updateBonus(dt) {
  const g = state.bonus;
  if (!g) return;
  if (g.status !== 'playing') {
    if (interactPressed()) {
      if (g.status === 'won') resetGame();
      else initBonus();
    }
    return;
  }
  g.time += dt;
  g.power = Math.max(0, g.power - dt);
  g.invuln = Math.max(0, g.invuln - dt);
  const input = moveInput();
  const p = g.player;
  if (input.x || input.y) {
    if (Math.abs(input.x) > Math.abs(input.y)) p.dir = input.x > 0 ? 'right' : 'left';
    else p.dir = input.y > 0 ? 'down' : 'up';
  }
  const speed = 86 + g.level * 10 + (g.power ? 18 : 0);
  moveBonusEntity(p, input.x * speed * dt, input.y * speed * dt, 7);

  for (const petal of g.petals) {
    if (!petal.taken && Math.hypot(petal.x - p.x, petal.y - p.y) < 9) {
      petal.taken = true;
      g.score += 10;
    }
  }
  for (const t of g.turkeys) {
    if (!t.taken && Math.hypot(t.x - p.x, t.y - p.y) < 13) {
      t.taken = true;
      g.turkeysGot += 1;
      g.level += 1;
      g.power = 5.2;
      g.score += 250 * g.level;
      g.message = `Turkey power! Level ${g.level}`;
      audio.sfx('turkey');
      const activeWanted = Math.min(5, 1 + Math.floor(g.turkeysGot / 2));
      g.women.forEach((w, i) => {
        if (i < activeWanted && !w.active) {
          w.active = true;
          w.respawn = 0;
          g.message = `${w.name} joined the chase!`;
        }
      });
    }
  }
  if (!g.turkeys.some((t) => !t.taken)) {
    g.status = 'won';
    g.message = 'Paulie escapes with the roses and the catering tray.';
    audio.sfx('success');
    return;
  }

  const playerTile = tileOf(p.x, p.y);
  for (const w of g.women) {
    if (!w.active) continue;
    if (w.respawn > 0) {
      w.respawn -= dt;
      if (w.respawn <= 0) { w.x = w.homeX; w.y = w.homeY; }
      else continue;
    }
    w.pathT -= dt;
    const wt = tileOf(w.x, w.y);
    let target = playerTile;
    if (g.power > 0) {
      // Frightened women retreat toward decorative corners of the basement.
      const corners = [[1,1],[30,1],[1,16],[30,16]];
      target = { tx: corners[w.name.length % 4][0], ty: corners[w.name.length % 4][1] };
    }
    if (w.pathT <= 0 || !w.next) {
      w.next = findNextTile(wt.tx, wt.ty, target.tx, target.ty);
      w.pathT = .18 + Math.random() * .08;
    }
    const c = tileCenter(w.next.tx, w.next.ty);
    const dx = c.x - w.x, dy = c.y - w.y;
    const len = Math.hypot(dx, dy) || 1;
    const chaseSpeed = (g.power ? 65 : 78 + g.level * 4) * dt;
    moveBonusEntity(w, dx / len * chaseSpeed, dy / len * chaseSpeed, 7);

    if (g.invuln <= 0 && Math.hypot(w.x - p.x, w.y - p.y) < 14) {
      if (g.power > 0) {
        w.respawn = 7;
        w.x = w.homeX;
        w.y = w.homeY;
        g.score += 500;
        g.message = `${w.name} got turkey-mogged!`;
        audio.sfx('smash');
      } else {
        g.hearts -= 1;
        g.invuln = 2.2;
        g.power = 0;
        p.x = tileCenter(16, 16).x;
        p.y = tileCenter(16, 16).y;
        g.message = `${w.name} caught Paulie!`;
        audio.sfx('crash');
        if (g.hearts <= 0) {
          g.status = 'lost';
          g.message = 'The women caught Paulie. Silvio is still rolling.';
        }
      }
    }
  }
}

function drawRose(ctx, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  px(ctx, -1, 1, 2, 9, '#2f7a3e');
  px(ctx, -4, 5, 3, 2, '#2f7a3e');
  px(ctx, 2, 7, 3, 2, '#2f7a3e');
  px(ctx, -4, -5, 8, 7, '#c82145');
  px(ctx, -2, -7, 5, 4, '#ee4765');
  px(ctx, 1, -3, 4, 4, '#8f1731');
  ctx.restore();
}

function drawBonusIntro() {
  px(ctx, 0, 0, W, H, '#18101f');
  if (!state.bonusReveal) {
    // fake mansion rose-ceremony staging
    px(ctx, 0, 0, W, H, '#3d2434');
    px(ctx, 58, 28, 524, 216, '#59324a');
    px(ctx, 80, 46, 150, 110, '#2c1728');
    // framed photo-like parody picture of Tony and his horse
    drawFramedPhoto(sceneArt.tonyHorse, 392, 44, 150, 92);
    outlineText(ctx, 'TONY & HORSE', 467, 140, '#f4d98c', 7, 'center');
    // women line-up
    const women = ['womanA','womanB','janice','womanC','womanD'];
    women.forEach((kind, i) => drawPerson(ctx, 126 + i * 76, 184, kind, 'down', state.frame + i));
    drawPerson(ctx, 306, 108, 'paulieSuit', 'down', state.frame);
    // rose table, four roses, kept in front of the lineup instead of covering faces
    px(ctx, 392, 216, 110, 24, '#5a321f');
    for (let i = 0; i < 4; i++) drawRose(ctx, 410 + i * 24, 216, 1.2);
    outlineText(ctx, 'THE BACHELOR?', 320, 34, '#ff8ebc', 13, 'center');
  } else {
    // basement wide shot
    px(ctx, 0, 0, W, H, '#15101c');
    for (let x = 0; x < W; x += 28) for (let y = 0; y < H; y += 22) px(ctx, x, y, 24, 18, '#211629');
    // string lights and basement clutter
    for (let x = 30; x < 610; x += 42) {
      px(ctx, x, 26 + Math.sin(x) * 4, 5, 7, ['#ff4f92','#ffd34f','#7de7ff'][Math.floor(x/42)%3]);
    }
    px(ctx, 240, 34, 160, 36, '#230d1d');
    outlineText(ctx, 'BADA BING BASEMENT', 320, 46, '#ff4f92', 11, 'center');
    px(ctx, 70, 72, 160, 60, '#351326');
    px(ctx, 406, 68, 140, 54, '#2a1726');
    // camera tripod and Silvio
    px(ctx, 98, 184, 46, 28, '#171a22');
    px(ctx, 106, 176, 30, 18, '#293140');
    px(ctx, 118, 181, 8, 8, '#77a8c8');
    px(ctx, 118, 212, 5, 42, '#111');
    px(ctx, 100, 250, 40, 4, '#111');
    drawPerson(ctx, 148, 196, 'silvio', 'right', state.frame);
    // women advancing and Paulie panicking
    const women = ['womanA','womanB','janice','womanC','womanD'];
    women.forEach((kind, i) => drawPerson(ctx, 282 + i * 54, 210 - (i%2)*12, kind, 'left', state.frame + i));
    drawPerson(ctx, 530, 250, 'paulieSuit', 'right', state.frame);
    for (let i = 0; i < 4; i++) drawRose(ctx, 414 + i * 24, 264, 1);
    outlineText(ctx, 'NOT THE BACHELOR', 320, 104, '#ffd34f', 15, 'center');
  }
}

function drawBonus() {
  const g = state.bonus;
  if (!g) return;
  px(ctx, 0, 0, W, H, '#120d18');
  // maze floor/walls
  for (let ty = 0; ty < BONUS_H; ty++) for (let tx = 0; tx < BONUS_W; tx++) {
    const x = tx * BONUS_T, y = ty * BONUS_T;
    if (bonusWall(tx, ty)) {
      px(ctx, x, y, BONUS_T, BONUS_T, '#3b1832');
      px(ctx, x + 2, y + 2, BONUS_T - 4, 3, '#743052');
    } else {
      px(ctx, x, y, BONUS_T, BONUS_T, (tx + ty) % 2 ? '#1e1728' : '#211a2e');
    }
  }
  // Bing basement decorations
  for (let x = 28; x < 620; x += 56) px(ctx, x, 6, 5, 5, ['#ff4f92','#ffd34f','#7de7ff'][Math.floor(x/56)%3]);
  // petals
  for (const petal of g.petals) if (!petal.taken) {
    px(ctx, petal.x - 2, petal.y - 1, 4, 2, '#e75480');
    px(ctx, petal.x - 1, petal.y - 2, 2, 4, '#ff9fbd');
  }
  // turkeys
  for (const t of g.turkeys) if (!t.taken) drawTurkey(ctx, t.x, t.y + Math.sin(state.time * 5 + t.x) * 1.5, .9, true);
  // player/chasers
  const blink = g.invuln > 0 && Math.sin(state.time * 18) > 0;
  if (!blink) drawPerson(ctx, g.player.x - 8, g.player.y - 12, 'paulieSuit', g.player.dir, state.frame);
  for (const w of g.women) {
    if (!w.active || w.respawn > 0) continue;
    const scared = g.power > 0;
    if (scared) {
      px(ctx, w.x - 8, w.y - 10, 16, 18, 'rgba(65,110,255,.38)');
    }
    drawPerson(ctx, w.x - 8, w.y - 12, w.kind, 'down', state.frame);
    if (scared) px(ctx, w.x - 5, w.y - 2, 10, 2, '#7de7ff');
  }
  // HUD
  drawPanel(8, 8, 286, 42, '#141f3a', '#ff8ebc');
  outlineText(ctx, `BONUS  ♥${g.hearts}  LV${g.level}  ${g.score}`, 18, 17, '#ffe78a', 9);
  outlineText(ctx, `Turkeys ${g.turkeysGot}/8 ${g.power ? ` POWER ${g.power.toFixed(1)}` : ''}`, 18, 32, g.power ? '#8ffff2' : '#fff', 8);
  drawPanel(386, 8, 246, 42, '#141f3a', '#92896f');
  outlineText(ctx, g.message, 522, 24, '#fff', 7, 'center');
  if (g.status !== 'playing') {
    drawPanel(122, 92, 396, 156, '#181631', g.status === 'won' ? '#ffd34f' : '#ff6d8e');
    outlineText(ctx, g.status === 'won' ? 'PAULIE ESCAPES!' : 'PAULIE GOT CAUGHT', 320, 118, g.status === 'won' ? '#ffd34f' : '#ff8ebc', 17, 'center');
    outlineText(ctx, g.message, 320, 154, '#fff', 9, 'center');
    outlineText(ctx, `Final score: ${g.score}`, 320, 180, '#c8d7ff', 9, 'center');
    outlineText(ctx, g.status === 'won' ? 'Press A / E to restart the story' : 'Press A / E to retry the bonus', 320, 214, '#8ffff2', 9, 'center');
  }
}

// ---------- Drawing helpers ----------
function gridFloor(x, y, w, h, base, line, step = 16) {
  px(ctx, x, y, w, h, base);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let xx = x; xx <= x + w; xx += step) {
    ctx.beginPath(); ctx.moveTo(xx + .5, y); ctx.lineTo(xx + .5, y + h); ctx.stroke();
  }
  for (let yy = y; yy <= y + h; yy += step) {
    ctx.beginPath(); ctx.moveTo(x, yy + .5); ctx.lineTo(x + w, yy + .5); ctx.stroke();
  }
}

function drawWindow(x, y, w = 58, h = 34) {
  px(ctx, x, y, w, h, '#6d4631');
  px(ctx, x + 3, y + 3, w - 6, h - 6, '#7ec7e8');
  px(ctx, x + w / 2 - 1, y + 3, 2, h - 6, '#6d4631');
  px(ctx, x + 3, y + h / 2 - 1, w - 6, 2, '#6d4631');
  px(ctx, x + 6, y + 21, 15, 5, '#e48739');
  px(ctx, x + 31, y + 17, 18, 7, '#d8792f');
  // geese
  for (let i = 0; i < 3; i++) {
    const gx = x + 8 + i * 15;
    px(ctx, gx, y + 23 + (i % 2), 8, 3, '#f4f0dc');
    px(ctx, gx + 6, y + 20 + (i % 2), 2, 4, '#f4f0dc');
    px(ctx, gx + 8, y + 21 + (i % 2), 2, 1, '#e58d2a');
  }
}

function drawTV(x, y) {
  const t = state.time;
  px(ctx, x, y, 38, 30, '#161a20');
  px(ctx, x + 3, y + 4, 32, 20, state.flags.tvChannel === 3 ? '#315aa8' : state.flags.tvChannel ? '#332b32' : '#263141');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 3, y + 4, 32, 20);
  ctx.clip();
  if (state.flags.tvChannel === 1) {
    // war documentary: drifting smoke, moving tracer fire, marching silhouettes
    px(ctx, x + 3, y + 4, 32, 20, '#263141');
    for (let i = 0; i < 4; i++) {
      const sx = x + 4 + ((t * 7 + i * 11) % 34);
      px(ctx, sx, y + 7 + i * 3, 5, 2, 'rgba(180,190,200,.55)');
    }
    for (let i = 0; i < 3; i++) {
      const sx = x + 4 + ((t * 28 + i * 13) % 34);
      px(ctx, sx, y + 12 + i * 3, 7, 1, '#ffb453');
    }
    for (let i = 0; i < 3; i++) px(ctx, x + 6 + i * 9, y + 17 + Math.sin(t * 8 + i) * 1, 3, 5, '#17191f');
  } else if (state.flags.tvChannel === 2) {
    // baking show: rotating cake and sliding mixer
    px(ctx, x + 3, y + 4, 32, 20, '#4a2d42');
    const spin = Math.sin(t * 6) * 2;
    px(ctx, x + 6, y + 9, 11 + spin, 8, '#f0c0d8');
    px(ctx, x + 8, y + 7, 7, 3, '#fff0f7');
    px(ctx, x + 20 + Math.sin(t * 3) * 4, y + 8, 10, 5, '#c7c7c7');
    px(ctx, x + 23 + Math.sin(t * 3) * 4, y + 13, 3, 6, '#777');
  } else if (state.flags.tvChannel === 3) {
    // Rome documentary: sunlight sweeps columns while a tiny procession moves
    px(ctx, x + 3, y + 4, 32, 20, '#315aa8');
    const sweep = x + 3 + ((t * 12) % 38) - 6;
    ctx.fillStyle = 'rgba(255,225,120,.18)';
    ctx.fillRect(sweep, y + 4, 8, 20);
    for (let i = 0; i < 3; i++) px(ctx, x + 7 + i * 10, y + 7, 5, 14, '#d8d1bd');
    const march = (t * 8) % 36;
    for (let i = 0; i < 3; i++) px(ctx, x + 3 + march + i * 5, y + 18, 3, 3, '#5e1f27');
    outlineText(ctx, 'ROME', x + 6, y + 18, '#ffd34f', 5);
  } else {
    for (let i = 0; i < 18; i++) {
      const flicker = Math.sin(t * 17 + i * 4) > 0 ? 1 : 0;
      px(ctx, x + 5 + (i * 7 + Math.floor(t * 9)) % 27, y + 6 + (i * 5) % 15, 2, 2, flicker ? '#fff' : '#5e6f82');
    }
  }
  // CRT scanline glides over every channel
  const scan = y + 4 + ((t * 18) % 20);
  px(ctx, x + 3, scan, 32, 1, 'rgba(255,255,255,.10)');
  ctx.restore();
  px(ctx, x + 10, y + 30, 18, 4, '#101318');
}

function drawHouse() {
  if (drawSceneArt(sceneArt.house, 640, 416)) {
    // Interactive channels and characters sit over the illustrated room art.
    drawTV(214, 30);
    // Geese visibly patrol outside the bedroom window.
    ctx.save();
    ctx.beginPath();
    ctx.rect(112, 14, 58, 34);
    ctx.clip();
    for (let i = 0; i < 3; i++) {
      const gx = 108 + ((state.time * 8 + i * 25) % 72);
      const gy = 29 + Math.sin(state.time * 3 + i) * 3 + i * 4;
      px(ctx, gx, gy, 10, 4, '#f3eedc');
      px(ctx, gx + 7, gy - 3, 3, 5, '#f3eedc');
      px(ctx, gx + 10, gy - 2, 2, 1, '#e58d2a');
    }
    ctx.restore();
    // Mirror catches a small animated reflection when Tony is nearby.
    if (Math.abs(state.player.x - 292) < 55 && state.player.y < 120) {
      px(ctx, 294, 28, 30, 54, 'rgba(160,210,230,.18)');
      px(ctx, 303, 38 + Math.sin(state.time * 3) * 1, 12, 12, '#c8875f');
      px(ctx, 301, 35, 16, 5, '#27201d');
      px(ctx, 305, 52, 8, 14, '#5a1f2e');
    }
    // Turkey steam moves in the kitchen.
    for (let i = 0; i < 4; i++) {
      const sy = 360 - ((state.time * 13 + i * 11) % 34);
      const sx = 486 + i * 7 + Math.sin(state.time * 2 + i) * 3;
      px(ctx, sx, sy, 2, 5, 'rgba(235,235,220,.38)');
    }
    // Carmela paces through the kitchen instead of the house feeling frozen.
    const carmX = 486 + Math.sin(state.time * .9) * 34;
    drawPerson(ctx, carmX, 270, 'carmela', Math.cos(state.time * .9) > 0 ? 'right' : 'left', state.frame * 1.4, { pose: 'stand' });
    // Carmela's card is a visible objective object, not an invisible pixel hunt.
    if (!state.flags.hasCard) {
      const pulse = (Math.sin(state.time * 6) + 1) / 2;
      ctx.fillStyle = `rgba(255,220,105,${.18 + pulse * .22})`;
      ctx.beginPath();
      ctx.ellipse(37, 115, 18 + pulse * 4, 13 + pulse * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      px(ctx, 28, 106, 18, 13, '#f4e5bc');
      px(ctx, 30, 108, 14, 2, '#caa46c');
      px(ctx, 31, 113, 10, 1, '#7a4936');
      px(ctx, 31, 116, 12, 1, '#7a4936');
      px(ctx, 41, 104, 4, 4, '#b23b32');
    }
    // Fireplace flame flicker in the den.
    // Layered stepped flame with glow and rising embers.
    ctx.fillStyle = 'rgba(255,102,31,.22)';
    ctx.beginPath();
    ctx.ellipse(34, 294, 28 + Math.sin(state.time * 5) * 3, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let row = 0; row < 15; row++) {
      const yy = 306 - row * 2;
      const taper = 1 - row / 15;
      const wobble = Math.sin(state.time * 8 + row * .9) * 3;
      const width = 31 * taper + Math.sin(state.time * 11 + row) * 2;
      px(ctx, 34 - width / 2 + wobble * taper, yy, width, 2, row % 3 ? '#e85424' : '#ff8c2e');
      if (row < 10) {
        const inner = width * .48;
        px(ctx, 34 - inner / 2 + wobble * taper * .7, yy, inner, 2, row % 2 ? '#ffd857' : '#fff09a');
      }
    }
    for (let i = 0; i < 5; i++) {
      const ey = 298 - ((state.time * 18 + i * 13) % 32);
      const ex = 22 + i * 6 + Math.sin(state.time * 4 + i) * 3;
      px(ctx, ex, ey, 2, 2, i % 2 ? '#ffcf65' : '#f06b2c');
    }
    px(ctx, 12, 306, 44, 5, '#2b1710');
    // Plav's stream glows inside AJ's monitor.
    px(ctx, 414, 31, 66, 26, '#101820');
    if (sceneArt.plavStream.complete && sceneArt.plavStream.naturalWidth) {
      ctx.drawImage(sceneArt.plavStream, 418, 35, 58, 18);
      const scan = 35 + ((state.time * 9) % 18);
      px(ctx, 418, scan, 58, 1, 'rgba(255,255,255,.16)');
      if (Math.sin(state.time * 5) > 0) px(ctx, 419, 36, 5, 3, '#f04b4b');
    } else {
      px(ctx, 418, 35, 58, 18, '#1d4d67');
      px(ctx, 438, 37, 16, 14, '#d99b68');
    }
    px(ctx, 486, 34, 20, 10, '#78ff9b');
    drawFramedPhoto(sceneArt.cousinTony, 560, 22, 48, 42);
    // AJ shifts in his chair and leans into the desk instead of standing frozen.
    drawPerson(ctx, 486 + Math.sin(state.time * 2.1) * 1.8, 88, 'aj', 'left', state.frame * 1.5, { pose: 'sit' });
    return;
  }
  // floor zones
  gridFloor(8, 8, 244, 166, '#7a5139', '#684430');
  gridFloor(268, 8, 84, 366, '#6d4934', '#5d3c2c');
  gridFloor(368, 8, 264, 166, '#354762', '#2c3b52');
  gridFloor(8, 190, 344, 218, '#5e4337', '#52382f');
  gridFloor(368, 190, 264, 218, '#806d55', '#6e5d48');

  // walls
  px(ctx, 0, 0, 640, 8, '#c4b69e');
  px(ctx, 0, 408, 640, 8, '#c4b69e');
  px(ctx, 0, 0, 8, 416, '#b8aa91');
  px(ctx, 632, 0, 8, 416, '#b8aa91');
  px(ctx, 252, 8, 16, 66, '#c4b69e');
  px(ctx, 252, 136, 16, 46, '#c4b69e');
  px(ctx, 352, 8, 16, 58, '#c4b69e');
  px(ctx, 352, 126, 16, 56, '#c4b69e');
  px(ctx, 8, 174, 262, 16, '#c4b69e');
  px(ctx, 330, 174, 302, 16, '#c4b69e');
  px(ctx, 352, 190, 16, 76, '#c4b69e');
  px(ctx, 352, 322, 16, 86, '#c4b69e');
  // door mats/openings
  px(ctx, 254, 76, 12, 56, '#8a5a3a');
  px(ctx, 354, 68, 12, 56, '#8a5a3a');
  px(ctx, 270, 176, 58, 12, '#8a5a3a');
  px(ctx, 354, 268, 12, 52, '#8a5a3a');
  px(ctx, 316, 404, 42, 4, '#5f3425');

  // bedroom
  px(ctx, 22, 28, 86, 44, '#5a3526'); // bed frame
  px(ctx, 28, 34, 74, 32, '#eee6d5');
  px(ctx, 30, 36, 30, 12, '#f5f1e4');
  px(ctx, 54, 49, 48, 17, '#6e1e2e');
  px(ctx, 18, 105, 38, 28, '#69432d');
  px(ctx, 25, 111, 18, 10, '#f2e6c9');
  outlineText(ctx, 'C', 32, 112, '#b4232e', 8);
  drawWindow(108, 10);
  drawTV(214, 30);
  px(ctx, 211, 63, 44, 8, '#5c3928');
  // framed photos / crucifix-inspired but original decor
  px(ctx, 34, 12, 13, 16, '#533521'); px(ctx, 37, 15, 7, 9, '#a07154');
  px(ctx, 61, 13, 13, 15, '#533521'); px(ctx, 64, 16, 7, 8, '#c69a69');
  px(ctx, 82, 12, 4, 18, '#6a4328'); px(ctx, 77, 18, 14, 4, '#6a4328');

  // hallway mirror
  px(ctx, 291, 24, 35, 44, '#6e432c');
  px(ctx, 295, 28, 27, 34, '#8fc7da');
  px(ctx, 299, 31, 7, 24, 'rgba(255,255,255,.35)');

  // AJ room
  px(ctx, 402, 26, 120, 42, '#422b21');
  px(ctx, 414, 31, 66, 26, '#121923');
  px(ctx, 418, 35, 58, 18, '#1d354d');
  drawPerson(ctx, 438, 33, 'plav', 'down', state.frame);
  px(ctx, 486, 34, 20, 10, '#78ff9b');
  outlineText(ctx, 'PLAV LIVE', 489, 36, '#102015', 4);
  px(ctx, 560, 22, 48, 42, '#6d4932');
  px(ctx, 564, 26, 40, 28, '#c4a179');
  drawPortrait(ctx, 567, 24, 'kramer');
  outlineText(ctx, 'COUSIN TONY', 565, 57, '#2f1d16', 4);
  px(ctx, 408, 122, 70, 28, '#3d2f29');
  drawPerson(ctx, 486, 86, 'aj', 'left', state.frame);

  // living room
  px(ctx, 70, 238, 128, 54, '#442b2e');
  px(ctx, 78, 244, 112, 24, '#7b3240');
  px(ctx, 82, 266, 44, 20, '#6b2c38');
  px(ctx, 132, 266, 44, 20, '#6b2c38');
  px(ctx, 102, 230, 68, 10, '#442b2e');
  px(ctx, 24, 318, 60, 42, '#4e3326');
  px(ctx, 32, 326, 44, 22, '#1b2638');
  px(ctx, 122, 315, 116, 72, '#8b3e32');
  px(ctx, 128, 321, 104, 60, '#d3b17c');
  for (let i = 0; i < 5; i++) px(ctx, 138 + i * 18, 330, 9, 42, i % 2 ? '#b65a3c' : '#e2c58f');
  // lamps/decor
  px(ctx, 220, 218, 12, 26, '#7c5235'); px(ctx, 214, 210, 24, 13, '#f0d083');

  // kitchen
  px(ctx, 392, 210, 190, 36, '#705f49');
  px(ctx, 398, 214, 178, 12, '#c7b99b');
  px(ctx, 420, 228, 36, 12, '#39404b');
  px(ctx, 504, 228, 44, 12, '#39404b');
  px(ctx, 414, 292, 112, 70, '#6a4a34');
  px(ctx, 421, 299, 98, 56, '#e0cda6');
  drawTurkey(ctx, 470, 324, 1.5, true);
  px(ctx, 570, 270, 30, 70, '#5c3928');
  for (let i = 0; i < 4; i++) px(ctx, 576, 278 + i * 14, 18, 5, ['#b73e35', '#e5bb47', '#5d9a58', '#d8d1c1'][i]);

  // room labels on floor, subtle
  outlineText(ctx, 'BEDROOM', 92, 158, 'rgba(255,255,255,.16)', 7, 'center');
  outlineText(ctx, 'AJ', 510, 158, 'rgba(255,255,255,.16)', 7, 'center');
  outlineText(ctx, 'LIVING ROOM', 160, 394, 'rgba(255,255,255,.16)', 7, 'center');
  outlineText(ctx, 'KITCHEN', 500, 394, 'rgba(255,255,255,.16)', 7, 'center');
}

function drawColumn(x, y) {
  px(ctx, x, y, 26, 100, '#d8d0bd');
  px(ctx, x + 3, y + 4, 4, 92, '#eee6d2');
  px(ctx, x + 16, y + 4, 4, 92, '#aaa28f');
  px(ctx, x - 5, y - 8, 36, 10, '#eee6d2');
  px(ctx, x - 6, y + 96, 38, 12, '#c6bda8');
}

function drawRome() {
  const t = state.time;
  const crowd = [
    [212, 284, 'romanGuard', 0], [238, 296, 'romanNoblewoman', 1], [296, 296, 'romanCitizenWoman', 2], [326, 284, 'romanCitizen', 3]
  ];
  if (drawSceneArt(sceneArt.rome, 800, 440)) {
    // Living “empty-square” stream performance and imperial court over the illustrated forum.
    drawPerson(ctx, 266 + Math.sin(t * 1.5) * 5, 228, 'romanPerformer', 'down', state.frame, { pose: 'perform' });
    crowd.forEach(([x, y, kind, i]) => drawPerson(ctx, x + Math.sin(t * .9 + i) * 3, y + Math.cos(t * 1.2 + i) * 2, kind, 'up', state.frame + i, { pose: 'watch' }));
    drawPerson(ctx, 660 + Math.sin(t * .8) * 4, 150, 'augustus', 'down', state.frame, { pose: 'imperial' });
    drawPerson(ctx, 724 + Math.sin(t * .7) * 3, 154, 'romanGuard', 'down', state.frame, { pose: 'guard' });
    return;
  }
  // sky/warm backdrop and street
  px(ctx, 0, 0, 800, 440, '#d1b98d');
  px(ctx, 0, 250, 800, 190, '#a99169');
  for (let x = 0; x < 800; x += 34) for (let y = 252; y < 440; y += 24) px(ctx, x + ((y / 24) % 2) * 10, y, 28, 18, '#b79d73');
  px(ctx, 330, 0, 470, 250, '#d9d0bb');
  for (let x = 340; x < 800; x += 32) for (let y = 10; y < 250; y += 26) px(ctx, x, y, 26, 20, (x + y) % 64 ? '#e2d9c4' : '#d3c8ad');
  [96, 150, 350, 408, 560, 618].forEach((x) => drawColumn(x, 48));
  // banners
  for (const x of [455, 680]) {
    px(ctx, x, 18, 40, 92, '#9d2532');
    px(ctx, x + 6, 24, 28, 72, '#bd3541');
    px(ctx, x + 16, 34, 8, 34, '#e0bf52');
    px(ctx, x + 11, 72, 18, 5, '#e0bf52');
  }
  // street buildings left
  px(ctx, 10, 34, 120, 140, '#b9784e');
  px(ctx, 18, 48, 34, 44, '#72452e');
  px(ctx, 66, 48, 34, 44, '#72452e');
  px(ctx, 8, 26, 126, 18, '#7b3e2e');
  outlineText(ctx, 'FORUM', 49, 30, '#ffd78e', 7);

  // empty square livestream performer + crowd
  px(ctx, 238, 210, 58, 76, '#7c4a2d');
  px(ctx, 245, 218, 44, 58, 'rgba(0,0,0,0)');
  drawPerson(ctx, 252, 236, 'romanPerformer', 'down', state.frame);
  px(ctx, 238, 210, 58, 5, '#9a623b');
  px(ctx, 238, 281, 58, 5, '#9a623b');
  px(ctx, 238, 210, 5, 76, '#9a623b');
  px(ctx, 291, 210, 5, 76, '#9a623b');
  crowd.forEach(([x, y, kind, i]) => drawPerson(ctx, x - 6 + Math.sin(t * .9 + i) * 3, y - 10 + Math.cos(t * 1.2 + i) * 2, kind, 'up', state.frame + i));
  outlineText(ctx, 'LIVE-ish', 244, 198, '#7b2f23', 7);

  // Augustus dais
  px(ctx, 690, 130, 84, 52, '#c4b48e');
  px(ctx, 700, 140, 64, 32, '#e4d7b7');
  drawPerson(ctx, 660 + Math.sin(t * .8) * 4, 150, 'augustus', 'down', state.frame);
  drawPerson(ctx, 724 + Math.sin(t * .7) * 3, 154, 'romanGuard', 'down', state.frame);
  // glow-up chamber entrance
  px(ctx, 744, 150, 48, 34, '#6b442e');
  px(ctx, 750, 156, 36, 28, '#2a1724');
  px(ctx, 746, 146, 44, 8, '#d8c27a');
  outlineText(ctx, 'MAXIMVS', 748, 140, '#ffe28a', 6);
  outlineText(ctx, 'ROME · 27 BC', 16, 420, 'rgba(80,40,20,.42)', 8);
}

function drawChamber() {
  px(ctx, 0, 0, 640, 416, '#b9aa8c');
  for (let x = 12; x < 628; x += 28) for (let y = 12; y < 404; y += 24) px(ctx, x, y, 22, 18, (x + y) % 56 ? '#c7b99a' : '#b4a488');
  px(ctx, 84, 52, 92, 28, '#d7caa9');
  px(ctx, 462, 52, 92, 28, '#d7caa9');
  // central mirror
  px(ctx, 278, 38, 84, 52, '#6b442e');
  px(ctx, 286, 46, 68, 38, '#93d4e9');
  px(ctx, 292, 50, 16, 28, 'rgba(255,255,255,.35)');
  drawColumn(120, 246);
  drawColumn(440, 246);
  px(ctx, 236, 114, 168, 44, '#8c3040');
  outlineText(ctx, 'BONAE SVPER OMNIA', 320, 130, '#ffd872', 8, 'center');
  outlineText(ctx, 'mirror of imperial jawlines', 320, 170, 'rgba(70,35,25,.5)', 8, 'center');
}

function drawApartment() {
  if (drawSceneArt(sceneArt.apartment, 640, 416)) {
    if (!state.flags.hasBat) {
      const pulse = (Math.sin(state.time * 5) + 1) / 2;
      ctx.fillStyle = `rgba(255,216,92,${.18 + pulse * .2})`;
      ctx.beginPath();
      ctx.ellipse(224, 330, 22 + pulse * 5, 10 + pulse * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      drawBat(ctx, 224, 324, -1.1);
    }
    const j = state.npcs.jerryApt || { x: 266, y: 212, dir: 'right', pose: 'sit' };
    const g = state.npcs.georgeApt || { x: 42, y: 122, dir: 'down', pose: 'stand' };
    const jiggle = Math.sin(state.time * .9) * 1.5;
    drawPerson(ctx, j.x, j.y + (j.pose === 'sit' ? 0 : jiggle), 'jerry', j.dir || 'right', state.frame, { pose: j.pose || 'sit' });
    drawPerson(ctx, g.x, g.y, 'george', g.dir || 'down', state.frame * 1.3, { pose: g.pose || 'stand' });
    if (state.flags.kramerIn) drawPerson(ctx, 490 + Math.sin(state.time * 5) * 2, 118, 'kramer', 'down', state.frame + 2, { pose: 'burst' });
    if (state.flags.elaineIn) drawPerson(ctx, 466 + Math.sin(state.time * 1.1) * 2, 158, 'elaine', 'left', state.frame + 1, { pose: 'stand' });
    return;
  }
  px(ctx, 0, 0, 640, 416, '#c5ad86');
  // wood floor
  for (let y = 0; y < 416; y += 12) px(ctx, 0, y, 640, 6, y % 24 ? '#b98a5d' : '#ad8054');
  // back wall and purple door
  px(ctx, 0, 0, 640, 78, '#c9b28e');
  px(ctx, 454, 18, 74, 82, '#6f4c93');
  px(ctx, 464, 30, 54, 70, '#7f58a9');
  px(ctx, 510, 62, 5, 5, '#e2c15e');
  // kitchen counter
  px(ctx, 34, 42, 126, 58, '#e2d7bf');
  px(ctx, 42, 52, 110, 18, '#f2ead7');
  px(ctx, 48, 78, 24, 16, '#66717c');
  px(ctx, 100, 76, 34, 18, '#66717c');
  // shelves/books
  px(ctx, 36, 122, 104, 64, '#6a472e');
  for (let i = 0; i < 18; i++) px(ctx, 43 + (i % 6) * 15, 130 + Math.floor(i / 6) * 17, 8, 13, ['#9e2f3c', '#2e627e', '#d6b34c', '#496b3f'][i % 4]);
  // couch/coffee table
  px(ctx, 48, 232, 132, 58, '#614145');
  px(ctx, 58, 238, 112, 24, '#83535b');
  px(ctx, 60, 262, 46, 20, '#744a52');
  px(ctx, 114, 262, 46, 20, '#744a52');
  px(ctx, 254, 216, 132, 48, '#6e452d');
  px(ctx, 262, 224, 116, 32, '#a9774c');
  drawTurkey(ctx, 314, 240, 1.2, true);
  px(ctx, 278, 224, 28, 8, '#d8d1be');
  if (!state.flags.hasBat) drawBat(ctx, 288, 230, -0.7);
  // dining table
  px(ctx, 232, 306, 164, 52, '#70462d');
  px(ctx, 240, 312, 148, 36, '#a8744d');
  drawTurkey(ctx, 300, 330, 1.3, true);
  px(ctx, 338, 322, 22, 10, '#f0e7c8');
  px(ctx, 364, 330, 18, 8, '#a93232');
  // bathroom/bedroom doors and wall art
  px(ctx, 550, 122, 48, 88, '#8a5b38');
  px(ctx, 556, 130, 36, 72, '#9b6840');
  px(ctx, 230, 104, 42, 52, '#6e4a31');
  px(ctx, 236, 111, 30, 36, '#e0d2a8');
  outlineText(ctx, 'YANKEES', 236, 124, '#2f4b78', 5);
  // characters
  drawPerson(ctx, 130 + Math.sin(state.time * .8) * 8, 170, 'jerry', Math.sin(state.time * .8) > 0 ? 'right' : 'left', state.frame);
  if (state.flags.aptStep >= 2 || state.flags.hasBat) drawPerson(ctx, 350 + Math.sin(state.time * 3.2) * 3, 282, 'george', 'up', state.frame * 1.3);
  if (state.flags.kramerIn) drawPerson(ctx, 500 + Math.sin(state.time * 5) * 2, 116, 'kramer', 'down', state.frame + 2);
  if (state.flags.elaineIn) drawPerson(ctx, 468 + Math.sin(state.time * 1.1) * 5, 138, 'elaine', 'down', state.frame + 1);
  outlineText(ctx, 'APARTMENT 5A', 320, 396, 'rgba(80,40,20,.25)', 8, 'center');
}

function drawClub() {
  if (drawSceneArt(sceneArt.club, 640, 416)) {
    drawTurkey(ctx, 320, 204, 1.6, true);
    // Crew members sit around the private table with individual idle motion.
    drawPerson(ctx, 218 + Math.sin(state.time * .9) * 1.5, 192, 'christopher', 'right', state.frame, { pose: 'sit' });
    drawPerson(ctx, 408 + Math.sin(state.time * 1.2) * 1.5, 192, 'paulie', 'left', state.frame + 1, { pose: 'sit' });
    drawPerson(ctx, 320 + Math.sin(state.time * .7) * 1.5, 142, 'silvio', 'down', state.frame + 2, { pose: 'sit' });
    return;
  }
  px(ctx, 0, 0, 640, 416, '#160e1e');
  // neon floor
  for (let x = 0; x < 640; x += 32) for (let y = 0; y < 416; y += 24) px(ctx, x, y, 28, 20, (x + y) % 64 ? '#24152d' : '#2d1936');
  // stage left and bar right, intentionally abstract/no explicit content
  px(ctx, 34, 38, 168, 82, '#351326');
  px(ctx, 42, 46, 152, 20, '#b22955');
  px(ctx, 42, 70, 152, 40, '#4a1834');
  for (let i = 0; i < 5; i++) px(ctx, 55 + i * 28, 75, 10, 28, '#5f2345');
  px(ctx, 446, 38, 150, 82, '#2a1726');
  px(ctx, 456, 48, 130, 16, '#d49b43');
  for (let i = 0; i < 5; i++) px(ctx, 462 + i * 24, 72, 12, 32, ['#ad3049', '#315f86', '#d7b04e'][i % 3]);
  // sign
  px(ctx, 240, 28, 160, 40, '#230d1d');
  outlineText(ctx, 'BADA BING!', 320, 40, '#ff4f92', 14, 'center');
  px(ctx, 258, 64, 124, 3, '#ffbf54');
  // long thanksgiving table
  px(ctx, 238, 178, 164, 70, '#4b261d');
  px(ctx, 246, 186, 148, 54, '#7b3f2c');
  drawTurkey(ctx, 320, 212, 1.7, true);
  for (let i = 0; i < 4; i++) {
    px(ctx, 258 + i * 32, 194, 18, 10, '#eee2c8');
    px(ctx, 258 + i * 32, 224, 18, 10, '#eee2c8');
  }
  // crew
  drawPerson(ctx, 232 + Math.sin(state.time * .9) * 3, 154, 'christopher', 'down', state.frame);
  drawPerson(ctx, 404 + Math.sin(state.time * 1.2) * 3, 154, 'paulie', 'down', state.frame + 1);
  drawPerson(ctx, 320 + Math.sin(state.time * .7) * 2, 118, 'silvio', 'down', state.frame + 2);
  // empty head chair
  px(ctx, 292, 248, 58, 34, '#382015');
  px(ctx, 302, 252, 38, 22, '#6d3427');
  // candles/autumn leaves
  for (let i = 0; i < 7; i++) {
    const x = 80 + i * 76;
    px(ctx, x, 300 + (i % 2) * 24, 5, 10, '#eadfb8');
    px(ctx, x + 1, 296 + (i % 2) * 24, 3, 4, '#ffb23e');
    px(ctx, x + 14, 310, 8, 4, '#b64e2e');
  }
  outlineText(ctx, 'PRIVATE THANKSGIVING', 320, 396, 'rgba(255,170,210,.28)', 8, 'center');
}

// ---------- Minigame/cinematic rendering ----------
function drawPlayer() {
  const kind = state.player.kind;
  if (state.player.inCar) {
    drawCar(state.player.x - 12, state.player.y + 2, '#8f1f2e');
    return;
  }
  drawPerson(ctx, state.player.x, state.player.y, kind, state.player.dir, state.frame, state.playerPose ? { pose: state.playerPose } : {});
  if (state.flags.hasBat && state.scene === 'apartment') drawBat(ctx, state.player.x + 17, state.player.y + 11, -0.7);
}

function drawInteractionMarkers() {
  const scene = scenes[state.scene];
  if (!scene || state.mode !== 'explore') return;
  const list = scene.interactions().filter((i) => !i.hidden);
  for (const it of list) {
    const cx = it.x + it.w / 2;
    const cy = it.y - 8 + Math.sin(state.time * 5 + cx * .1) * 2;
    const pulse = (Math.sin(state.time * 6 + cx) + 1) / 2;
    ctx.fillStyle = `rgba(255,216,92,${.55 + pulse * .35})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 5, cy - 8);
    ctx.lineTo(cx + 5, cy - 8);
    ctx.closePath();
    ctx.fill();
    px(ctx, cx - 1, cy - 14, 2, 5, '#fff0a6');
  }
}

function objectiveTarget() {
  const scene = scenes[state.scene];
  if (!scene || state.mode !== 'explore') return null;
  const list = scene.interactions().filter((i) => !i.hidden && !/leave|exit/i.test(i.label));
  return list[0] || null;
}

function drawObjectiveArrow() {
  const t = objectiveTarget();
  if (!t || state.mode !== 'explore') return;
  const tx = t.x + t.w / 2 - state.camera.x;
  const ty = t.y + t.h / 2 - state.camera.y;
  const pxp = state.player.x + 8 - state.camera.x;
  const pyp = state.player.y + 12 - state.camera.y;
  const dist = Math.hypot(tx - pxp, ty - pyp);
  if (dist < 70) return; // close enough that the prompt shows instead
  // clamp to screen edges with margin
  const cx = W / 2, cy = H / 2;
  let dx = tx - pxp, dy = ty - pyp;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  // place arrow at fixed radius around player, clamped on screen
  let ax = pxp + dx * 44, ay = pyp + dy * 44;
  ax = Math.max(24, Math.min(W - 24, ax));
  ay = Math.max(64, Math.min(H - 30, ay));
  const ang = Math.atan2(dy, dx);
  const pulse = (Math.sin(state.time * 5) + 1) / 2;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(ang);
  ctx.fillStyle = `rgba(255,216,92,${.7 + pulse * .3})`;
  ctx.beginPath();
  ctx.moveTo(10 + pulse * 3, 0);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  outlineText(ctx, `${Math.max(1, Math.round(dist / 40)) * 5}m`, ax, ay + 12, '#ffe78a', 6, 'center');
}

function drawWorld() {
  const scene = scenes[state.scene];
  if (!scene) return;
  ctx.save();
  ctx.translate(-Math.round(state.camera.x), -Math.round(state.camera.y));
  scene.draw();
  drawAmbient();
  drawSchemeProps();
  drawCop();
  drawInteractionMarkers();
  drawPlayer();
  drawEffects();
  ctx.restore();
  drawObjectiveArrow();
  // location badge
  drawPanel(8, 42, 172, 25, '#182448', '#92896f');
  outlineText(ctx, scene.label, 16, 50, '#ddd5bd', 7);
  if (state.flags.freeRoam) {
    drawPanel(W - 104, 42, 96, 25, '#182448', '#8ffff2');
    outlineText(ctx, state.player.kind === 'george' ? 'GEORGE' : 'TONY', W - 56, 50, '#8ffff2', 8, 'center');
    if ((state.flags.heat || 0) > 0.3) {
      drawPanel(W - 172, H - 50, 164, 20, '#33141a', '#ff7a5e');
      outlineText(ctx, `HEAT ${'!'.repeat(Math.max(1, Math.round(state.flags.heat)))}`, W - 162, H - 44, '#ff9a7a', 7);
      px(ctx, W - 90, H - 46, Math.min(76, state.flags.heat * 15), 6, '#ff7a5e');
    }
    const blink = (Math.sin(state.time * 3) + 1) / 2;
    drawPanel(W - 172, H - 26, 164, 20, '#182448', '#8ffff2');
    ctx.globalAlpha = .75 + blink * .25;
    outlineText(ctx, `${usingTouchControls ? 'B' : 'B'}: switch to ${state.player.kind === 'george' ? 'Tony' : 'George'}`, W - 90, H - 20, '#8ffff2', 7, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawDream() {
  const t = state.dreamT;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1c123c');
  grad.addColorStop(1, '#512541');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 28; i++) {
    const x = (i * 83 + Math.sin(i) * 30) % W;
    const y = ((t * 95 + i * 67) % (H + 70)) - 50;
    if (i % 5 === 0) drawTurkey(ctx, x, y, 1.1, true);
    else if (i % 5 === 1) {
      px(ctx, x - 7, y - 7, 14, 14, '#a9502b');
      px(ctx, x - 3, y - 9, 6, 4, '#d88247');
    } else if (i % 5 === 2) {
      px(ctx, x - 8, y - 14, 16, 28, '#d8d0bd');
      px(ctx, x - 11, y - 17, 22, 5, '#eee6d2');
    } else if (i % 5 === 3) {
      // sunglasses
      px(ctx, x - 12, y - 4, 9, 6, '#0e1520');
      px(ctx, x + 3, y - 4, 9, 6, '#0e1520');
      px(ctx, x - 3, y - 2, 6, 2, '#0e1520');
    } else {
      // goose/duck abstraction
      px(ctx, x - 7, y, 13, 6, '#f2edd7');
      px(ctx, x + 4, y - 5, 4, 6, '#f2edd7');
      px(ctx, x + 8, y - 3, 3, 2, '#e58d2a');
    }
  }
  drawPerson(ctx, 310 + Math.sin(t * 4) * 20, 120 + Math.cos(t * 3) * 14, 'tony', 'down', state.frame);
  outlineText(ctx, 'THANKSGIVING DREAM', W / 2, 42, '#ffd978', 15, 'center');
  outlineText(ctx, 'geese · gabagool · empire · protein', W / 2, 64, '#f4c6d8', 8, 'center');
}

function drawBone() {
  const b = state.bone;
  px(ctx, 0, 0, W, H, '#21182b');
  // mirror background
  px(ctx, 72, 24, 496, 258, '#684226');
  px(ctx, 86, 38, 468, 230, '#8cc9df');
  px(ctx, 104, 54, 120, 190, 'rgba(255,255,255,.2)');
  const striking = b.flash > 0;
  drawPerson(ctx, 235, 120, state.player.kind, 'right', striking ? state.frame * 3 : state.frame, { pose: striking ? 'perform' : 'angry' });
  // Animated arms physically reach toward the mirror; alternating fists sell the strikes.
  const pump = Math.sin(state.time * (striking ? 18 : 5));
  const reach = striking ? 1 : .55 + pump * .12;
  const fistX = 296 + reach * 62;
  const fistY = 143 + pump * 8;
  px(ctx, 288, 146, fistX - 288, 6, '#c8875f');
  px(ctx, fistX, fistY, 13, 13, '#d89a70');
  px(ctx, fistX + 2, fistY + 3, 9, 3, '#efb287');
  if (striking) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + state.time;
      px(ctx, 360 + Math.cos(a) * 13, 145 + Math.sin(a) * 13, 7, 2, '#fff0a6');
    }
    outlineText(ctx, 'CRACK', 334, 118, '#ffe78a', 10);
  }
  // Tony's real illustrated reflection, scaled up inside the mirror — and visibly deforming per hit.
  if (sceneArt.tonyHead.complete && sceneArt.tonyHead.naturalWidth) {
    ctx.save();
    if (b.hits >= 4) {
      // jaw visibly knocked sideways: shear the reflection
      ctx.transform(1, 0, -.08 * Math.min(2, b.hits - 3), 1, 30, 0);
    }
    ctx.drawImage(sceneArt.tonyHead, 362, 72, 132, 114);
    ctx.restore();
  } else {
    px(ctx, 376, 76, 104, 118, '#c8875f');
    px(ctx, 382, 82, 92, 24, '#2a211e');
  }
  // progressive damage overlays: swelling, black eye, bandage, circling stars
  if (b.hits >= 2) {
    px(ctx, 388, 96, 26, 18, 'rgba(200,60,50,.45)');
    px(ctx, 452, 118, 22, 16, 'rgba(200,60,50,.4)');
  }
  if (b.hits >= 3) {
    ctx.fillStyle = 'rgba(40,20,40,.65)';
    ctx.beginPath();
    ctx.ellipse(408, 102, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.hits >= 5) {
    px(ctx, 376, 84, 40, 12, '#e8e2d0');
    px(ctx, 376, 88, 40, 3, '#c94f42');
    for (let i = 0; i < 4; i++) {
      const a = state.time * 3 + i * 1.6;
      outlineText(ctx, '✦', 428 + Math.cos(a) * 52, 84 + Math.sin(a) * 22, '#ffe78a', 9, 'center');
    }
  }
  if (b.hits >= 6) {
    px(ctx, 424, 132, 44, 22, 'rgba(230,225,205,.85)');
    outlineText(ctx, 'JAW!', 446, 137, '#a03a2c', 8, 'center');
  }
  ctx.strokeStyle = 'rgba(255,246,190,.72)';
  ctx.lineWidth = 1;
  for (let i = 0; i < Math.min(6, b.hits); i++) {
    const sx = 398 + i * 13;
    ctx.beginPath();
    ctx.moveTo(sx, 104 + (i % 2) * 18);
    ctx.lineTo(sx - 7, 126 + i * 5);
    ctx.lineTo(sx + 4, 144 + (i % 3) * 8);
    ctx.stroke();
  }
  if (b.flash) px(ctx, 370, 70, 116, 130, 'rgba(255,235,120,.28)');
  outlineText(ctx, 'BONE SMASHING', 320, 24, '#ffd978', 14, 'center');
  outlineText(ctx, b.message, 320, 292, '#fff', 9, 'center');
  // power meter
  drawPanel(150, 312, 340, 30, '#101a30', '#e8d493');
  const zone = boneZone(b);
  const zx = 162 + (zone.start / 100) * 316;
  px(ctx, zx, 321, Math.max(10, zone.width / 100 * 316), 12, '#d9a93f');
  px(ctx, zx + Math.max(10, zone.width / 100 * 316) / 2 - 2, 320, 4, 14, '#fff2a6');
  px(ctx, 162 + (b.power / 100) * 316, 316, 5, 22, '#ffffff');
  outlineText(ctx, `Hits ${Math.min(6, b.hits)}/6  Combo ${b.combo}`, 44, 322, '#ffe78a', 9);
}

function drawPeptides() {
  const g = state.pep;
  const wobbleX = Math.sin(g.time * 8) * g.dizzy * 5;
  const wobbleY = Math.cos(g.time * 7) * g.dizzy * 4;
  px(ctx, 0, 0, W, H, '#172235');
  ctx.save();
  ctx.translate(wobbleX, wobbleY);
  for (let x = 20; x < 620; x += 28) for (let y = 40; y < 340; y += 24) px(ctx, x, y, 24, 20, (x + y) % 56 ? '#22304a' : '#1c293f');
  px(ctx, 34, 54, 572, 282, 'rgba(28,40,64,.5)');
  drawPerson(ctx, g.x - 8, g.y - 12, state.player.kind, 'down', state.frame);
  for (const v of g.vials) drawVial(ctx, v.x, v.y, g.time, v.kind);
  // bloodstream vessels pulse through the scene as peptides enter his system
  const vessels = Math.min(6, g.caught);
  for (let i = 0; i < vessels; i++) {
    const pulse = (Math.sin(g.time * 6 - i * .8) + 1) / 2;
    ctx.strokeStyle = `rgba(220,40,50,${.12 + pulse * .3})`;
    ctx.lineWidth = 1.5 + pulse;
    ctx.beginPath();
    ctx.moveTo(30 + i * 100, 340);
    ctx.bezierCurveTo(70 + i * 96, 240 - i * 12, 10 + i * 108, 160 + i * 8, 60 + i * 94, 60);
    ctx.stroke();
  }
  if (g.flashT > 0) {
    ctx.fillStyle = `rgba(255,80,90,${g.flashT * .12})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  // dizzy overlay
  if (g.dizzy > .45) {
    ctx.strokeStyle = `rgba(116,220,255,${(g.dizzy - .4) * .7})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(320, 180, 70 + i * 42 + Math.sin(g.time * 4) * 8, 34 + i * 28, g.time * .4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  drawPanel(10, 10, 260, 34, '#162441', '#7de7ff');
  outlineText(ctx, `PEPTIDES ${g.caught}/8`, 20, 20, '#8ffff2', 10);
  outlineText(ctx, g.dizzy > .62 ? `DIZZY: CONTROLS REVERSED · ${g.message}` : g.message, 286, 20, g.dizzy > .62 ? '#ff9d9d' : '#fff', 8);
}

function drawCar(x, y, color = '#8f1f2e', target = false) {
  // shadow
  px(ctx, x - 15, y - 19, 30, 40, 'rgba(0,0,0,.35)');
  // body
  px(ctx, x - 13, y - 20, 26, 40, '#0d1017');
  px(ctx, x - 11, y - 18, 22, 36, color);
  // hood shine + trunk
  px(ctx, x - 9, y - 17, 18, 4, 'rgba(255,255,255,.22)');
  px(ctx, x - 9, y + 13, 18, 3, 'rgba(0,0,0,.25)');
  // windshield + rear window
  px(ctx, x - 9, y - 11, 18, 8, '#9fd4ec');
  px(ctx, x - 9, y - 11, 18, 2, '#d6f1ff');
  px(ctx, x - 9, y + 5, 18, 6, '#6f97b4');
  // roof
  px(ctx, x - 9, y - 2, 18, 6, color);
  px(ctx, x - 9, y - 2, 18, 1, 'rgba(255,255,255,.28)');
  // headlights + taillights
  px(ctx, x - 10, y - 20, 5, 3, '#fff3b0');
  px(ctx, x + 5, y - 20, 5, 3, '#fff3b0');
  px(ctx, x - 10, y + 17, 5, 3, '#ff5d52');
  px(ctx, x + 5, y + 17, 5, 3, '#ff5d52');
  // wheels
  px(ctx, x - 15, y - 13, 4, 9, '#05070c');
  px(ctx, x + 11, y - 13, 4, 9, '#05070c');
  px(ctx, x - 15, y + 6, 4, 9, '#05070c');
  px(ctx, x + 11, y + 6, 4, 9, '#05070c');
  if (target) px(ctx, x - 8, y - 27, 16, 3, '#ffe06e');
}

function drawDrive() {
  const d = state.drive;
  if (!d) return;
  const shakeX = d.shake ? (Math.random() - .5) * 6 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  // autumn suburbs
  px(ctx, 0, 0, W, H, '#7c8c58');
  for (let i = 0; i < 12; i++) {
    const y = ((i * 90 + d.road * .45) % 430) - 60;
    const left = i % 2 === 0;
    px(ctx, left ? 40 : 535, y, 54, 34, '#8d5b3d');
    px(ctx, left ? 48 : 543, y + 8, 38, 22, '#d6bf91');
    px(ctx, left ? 25 : 510, y + 30, 22, 18, '#c86d31');
    px(ctx, left ? 100 : 480, y + 26, 18, 18, '#d79531');
  }
  // road
  px(ctx, 170, 0, 300, H, '#4c4f55');
  px(ctx, 182, 0, 8, H, '#d7d0bc');
  px(ctx, 450, 0, 8, H, '#d7d0bc');
  for (let y = ((d.road) % 52) - 52; y < H; y += 52) px(ctx, 316, y, 8, 28, '#e8d66c');
  // target black sedan far ahead
  const targetY = 48 + Math.sin(state.time * 3) * 3;
  drawCar(320, targetY, '#111722', true);
  outlineText(ctx, 'DEBTOR', 320, 24, '#ffe06e', 7, 'center');
  // obstacles
  for (const o of d.obstacles) {
    if (o.hit && o.type === 'money') continue;
    if (o.type === 'money') {
      const bob = Math.sin(state.time * 8 + o.wobble) * 2;
      px(ctx, o.x - 12, o.y - 8 + bob, 24, 15, '#d8c28a');
      px(ctx, o.x - 10, o.y - 6 + bob, 20, 11, '#f0dfaa');
      px(ctx, o.x - 8, o.y - 4 + bob, 7, 6, '#4c9a58');
      px(ctx, o.x + 2, o.y - 4 + bob, 7, 6, '#4c9a58');
      px(ctx, o.x - 1, o.y - 8 + bob, 2, 15, '#8a6a3c');
      outlineText(ctx, '$', o.x, o.y - 5 + bob, '#174d2b', 8, 'center');
    } else if (o.type === 'gabagool') {
      px(ctx, o.x - 13, o.y - 9, 26, 18, '#9a4f2b');
      px(ctx, o.x - 8, o.y - 12, 16, 6, '#d88949');
      px(ctx, o.x - 4, o.y - 2, 4, 3, '#f0d19a');
    } else if (o.type === 'janice') {
      drawPerson(ctx, o.x - 8, o.y - 14, 'janice', o.vx > 0 ? 'right' : 'left', state.frame);
    } else if (o.type === 'nycrew') {
      ctx.save();
      if (o.spin) {
        ctx.translate(o.x, o.y);
        ctx.rotate((1 - o.spin) * 9);
        ctx.translate(-o.x, -o.y);
      }
      drawPerson(ctx, o.x - 8, o.y - 14, o.sprite, o.vx > 0 ? 'right' : 'left', state.frame * 1.4);
      ctx.restore();
      if (!o.hit) outlineText(ctx, 'NY', o.x, o.y - 22, '#ff8e8e', 6, 'center');
    } else {
      drawCar(o.x, o.y, '#59624a');
      drawPerson(ctx, o.x - 7, o.y - 16, 'paulie', 'down', state.frame);
    }
  }
  if (d.boost > 0) {
    for (let i = 0; i < 4; i++) px(ctx, d.x - 10 + i * 6, d.y + 22 + i * 5, 3, 12, i % 2 ? '#ffb13e' : '#f4e27a');
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    for (let i = 0; i < 7; i++) {
      const lx = 190 + ((i * 53 + d.road * 2.2) % 260);
      const ly = ((i * 97 + d.road * 3.2) % 360) - 20;
      ctx.fillRect(lx, ly, 2, 26);
    }
  }
  drawCar(d.x, d.y, d.boost > 0 ? '#b82835' : '#8f1f2e');
  ctx.restore();
  // HUD
  drawPanel(10, 10, 280, 44, '#141f3a', '#e5c36a');
  outlineText(ctx, `CHASE ${Math.floor(d.progress)}%`, 20, 19, '#ffe78a', 10);
  px(ctx, 20, 38, 180, 7, '#30384d');
  px(ctx, 20, 38, Math.min(180, d.progress * 1.8), 7, '#e45445');
  outlineText(ctx, `♥ ${d.health}`, 216, 31, '#ff8e8e', 10);
  outlineText(ctx, `$${d.score || 0}`, 216, 19, '#9be59b', 9);
  if (d.boost > 0) {
    px(ctx, 306, 18, 110, 14, '#173521');
    px(ctx, 308, 20, Math.min(106, d.boost / 2.7 * 106), 10, '#69e26e');
    outlineText(ctx, 'MONEY BOOST', 361, 21, '#102415', 7, 'center');
  }
  outlineText(ctx, 'Money = speed boost · run down NY crew for cash · dodge gabagool and family', 320, 340, '#fff', 8, 'center');
}

function drawTitle() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0b1028');
  grad.addColorStop(.55, '#151b3e');
  grad.addColorStop(1, '#090b18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  function artPanel(img, x, y, w, h, label) {
    drawPanel(x - 2, y - 2, w + 4, h + 4, '#15172c', '#9d7745');
    if (img.complete && img.naturalWidth) {
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      ctx.fillStyle = 'rgba(5,8,20,.16)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    } else px(ctx, x, y, w, h, '#273052');
    px(ctx, x, y, w, 15, 'rgba(5,8,20,.72)');
    outlineText(ctx, label, x + w / 2, y + 4, '#ffe5a0', 7, 'center');
  }

  artPanel(sceneArt.house, 18, 34, 140, 92, 'NEW JERSEY');
  artPanel(sceneArt.rome, 172, 34, 140, 92, 'ROME');
  artPanel(sceneArt.hub, 326, 34, 140, 92, 'THE CHASE');
  artPanel(sceneArt.apartment, 480, 34, 140, 92, 'JERRY’S');

  // animated foreground cast and holiday props
  drawPerson(ctx, 68, 86, 'tony', 'down', state.frame);
  drawTurkey(ctx, 124, 113 + Math.sin(state.time * 3) * 2, 1.1, true);
  drawPerson(ctx, 224, 78, 'augustus', 'down', state.frame);
  drawCar(396, 110, '#8f1f2e');
  if (state.time % 2 < 1.35) {
    px(ctx, 382, 103, 7, 3, '#ffe27a');
    px(ctx, 406, 103, 7, 3, '#ffe27a');
  }
  drawPerson(ctx, 512, 84, 'jerry', 'down', state.frame);
  drawPerson(ctx, 552, 82, 'kramer', 'down', state.frame + 2, { pose: 'burst' });
  drawPerson(ctx, 594, 94, 'george', 'down', state.frame + 1);

  // warmer theatrical title treatment
  px(ctx, 110, 153, 420, 3, '#6b3e24');
  outlineText(ctx, 'TONY SOPRANO', W / 2, 164, '#ffd34f', 25, 'center');
  outlineText(ctx, 'THANKSGIVING', W / 2, 196, '#fff4c8', 28, 'center');
  outlineText(ctx, 'A linear pixel-art holiday misadventure', W / 2, 234, '#c8d7ff', 10, 'center');
  const blink = Math.sin(state.time * 5) > 0;
  const hasSave = !!loadSave();
  // stylized menu buttons
  const bw = hasSave ? 172 : 220;
  const bx1 = hasSave ? 128 : 210;
  drawPanel(bx1, 256, bw, 26, '#12324a', '#8ffff2');
  outlineText(ctx, hasSave ? 'NEW STORY  (E)' : 'START STORY  (E)', bx1 + bw / 2, 264, '#8ffff2', 9, 'center');
  if (hasSave) {
    drawPanel(340, 256, 172, 26, '#3a2c10', '#ffe78a');
    outlineText(ctx, 'CONTINUE  (C)', 340 + 86, 264, '#ffe78a', 9, 'center');
  }
  const owPulse = (Math.sin(state.time * 3) + 1) / 2;
  drawPanel(190, 290, 260, 28, '#2c1440', '#c993ff');
  px(ctx, 194, 294, 252, 3, `rgba(201,147,255,${.3 + owPulse * .5})`);
  outlineText(ctx, '★ OPEN WORLD  (O) ★', 320, 298, '#e3c2ff', 10, 'center');
  outlineText(ctx, 'roam NJ + NY freely · all locations unlocked', 320, 322, '#9d8fc9', 7, 'center');
  if (!hasSave) outlineText(ctx, 'Laptop: WASD/arrows + E · Mobile: touch stick + A', W / 2, 334, '#aeb8d8', 7, 'center');
  outlineText(ctx, 'Unofficial parody fan game · original art and synthesized voices', W / 2, 342, '#777fa5', 7, 'center');
}

function drawEnding() {
  px(ctx, 0, 0, W, H, '#130d1e');
  for (let i = 0; i < 80; i++) {
    const x = (i * 97) % W;
    const y = (i * 53 + state.time * 8) % H;
    px(ctx, x, y, 2, 2, i % 3 ? '#ffb84e' : '#ff5e9a');
  }
  drawPanel(110, 54, 420, 230, '#1b1733', '#e0ba62');
  drawTurkey(ctx, 320, 110, 2.1, true);
  outlineText(ctx, 'HAPPY THANKSGIVING', 320, 152, '#ffd34f', 20, 'center');
  outlineText(ctx, 'Tony made it home to the crew.', 320, 184, '#fff', 10, 'center');
  outlineText(ctx, `Calls answered: ${state.stats.calls}  ·  Peptides: ${state.stats.vials}  ·  Imperial smashes: ${state.stats.smashes}`, 320, 211, '#c8d7ff', 8, 'center');
  outlineText(ctx, `Driving incidents: ${state.stats.crashes} (mostly gabagool)`, 320, 230, '#c8d7ff', 8, 'center');
  outlineText(ctx, 'THE END', 320, 258, '#ff8ebc', 13, 'center');
  outlineText(ctx, 'BONUS LEVELS UNLOCKED', 320, 284, '#ff8ebc', 10, 'center');
  drawPanel(112, 290, 200, 21, '#2c2344', '#ffe78a');
  outlineText(ctx, 'Paulie on The Bachelor', 212, 296, '#ffe78a', 8, 'center');
  drawPanel(328, 290, 200, 21, '#2c2344', '#ffe78a');
  outlineText(ctx, 'Augustus in New Jersey', 428, 296, '#ffe78a', 8, 'center');
  drawPanel(180, 314, 280, 21, '#1d3a44', '#8ffff2');
  outlineText(ctx, 'FREE ROAM North Caldwell', 320, 320, '#8ffff2', 9, 'center');
  if (Math.sin(state.time * 5) > 0) outlineText(ctx, 'tap a bonus · R replays the story', 320, 346, '#aeb8d8', 8, 'center');
}

function drawMenu() {
  ctx.fillStyle = 'rgba(5,8,20,.72)';
  ctx.fillRect(0, 0, W, H);
  drawPanel(130, 30, 380, 326, '#141a33', '#e0ba62');
  outlineText(ctx, 'MENU', 320, 42, '#ffd34f', 13, 'center');
  outlineText(ctx, `${usingTouchControls ? 'tap' : 'W/S + E'} to choose · ${usingTouchControls ? 'Menu btn' : 'Esc'} closes`, 320, 62, '#aeb8d8', 7, 'center');
  const entries = menuEntries();
  entries.forEach((it, i) => {
    const y = 92 + i * 17;
    const sel = i === state.menu.sel;
    if (sel) {
      ctx.fillStyle = 'rgba(255,211,79,.14)';
      ctx.fillRect(142, y - 4, 356, 16);
    }
    const color = it.locked ? '#5a6076' : sel ? '#ffe78a' : '#d8deef';
    outlineText(ctx, `${sel ? '> ' : ''}${it.label}`, 156, y, color, 8);
    outlineText(ctx, it.locked ? 'locked' : it.hint, 494, y + 1, it.locked ? '#5a6076' : '#8f9ab8', 6, 'right');
  });
}

function drawAtmosphere() {
  // Subtle scanlines and vignette sell the retro handheld look without hurting readability.
  ctx.fillStyle = 'rgba(0,0,0,.055)';
  for (let y = 1; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, W * .68);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,.32)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (state.dialog?.opts?.cinematic === 'bonus') drawBonusIntro();
  else if (state.dialog?.opts?.cinematic === 'romanWake') drawRomanWake();
  else if (state.mode === 'title') drawTitle();
  else if (state.mode === 'dream') drawDream();
  else if (state.mode === 'bone') drawBone();
  else if (state.mode === 'peptides') drawPeptides();
  else if (state.mode === 'drive') drawDrive();
  else if (state.mode === 'bonus') drawBonus();
  else if (state.mode === 'produce') drawProduce();
  else if (state.mode === 'ending') drawEnding();
  else drawWorld();

  if (state.mode === 'menu') drawMenu();
  drawAtmosphere();
  if (!['title', 'ending', 'dream', 'bone', 'peptides', 'drive', 'bonus', 'produce', 'menu'].includes(state.mode)) drawObjective();
  if (state.mode === 'explore') drawPrompt(nearestInteraction());
  drawPhoneIncoming();
  if (state.mode !== 'menu') drawDialog();
  drawHelp();
}

function resetGame() {
  state.mode = 'title';
  state.scene = 'house';
  state.player = { x: 190, y: 124, dir: 'down', kind: 'tony', speed: 88 };
  state.flags = {
    houseStep: 0, tvChannel: 0, hasCard: false, sawGeese: false, ajDone: false, mirrorDone: false,
    romeStep: 0, boneDone: false, hasBat: false, aptStep: 0, kramerIn: false, elaineIn: false,
    clubTalked: {}, clubReady: false, augustusAJ: false, satStep: 0, freeRoam: false
  };
  state.stats = { started: performance.now(), calls: 0, vials: 0, smashes: 0, crashes: 0 };
  state.objective = 'Press start';
  state.phone = null;
  state.dialog = null;
  state.bonus = null;
  state.produce = null;
  state.bonusReveal = false;
  state.unlocked = Object.assign({ house: true }, state.unlocked || {});
  state.menu = null;
  state.npcs = {};
  state.movers = [];
  audio.setMusic('title');
}

function startOpenWorld() {
  resetGame();
  state.flags.sandbox = true;
  state.unlocked = { house: true, hub: true, drive: true, chamber: true, club: true, rome: true, apartment: true, satriale: true, vesuvio: true, monks: true, soup: true };
  state.flags.hasBat = true;
  state.flags.houseStep = 9;
  state.player.kind = 'tonyMax';
  startGame.__skipIntro = true;
  setScene('hub', 320, 240);
  state.mode = 'explore';
  state.flags.freeRoam = true;
  objective('Open world — explore, scheme, or pick a story chapter from MENU');
  startDialog([
    { speaker: 'narrator', text: 'OPEN WORLD — the whole neighborhood is yours. Every door is open, every scheme is available.' },
    { speaker: 'tony', text: 'No errands, no schedule. Just me, the wind, and whatever trouble I feel like causin’.' }
  ]);
}

function startGame() {
  setScene('house', 190, 124);
  state.mode = 'explore';
  objective(houseObjective());
  startDialog([
    { speaker: 'narrator', text: 'Thanksgiving morning. North Caldwell, New Jersey. Tony Soprano wakes to the sound of television artillery.' },
    { speaker: 'tony', text: 'Another beautiful Thanksgiving in New Jersey. Let’s get this day goin’.' }
  ]);
}

function update(dt) {
  state.time += dt;
  updateMovers(dt);
  for (const e of state.effects) e.t += dt;
  state.effects = state.effects.filter((e) => e.t < e.life);
  if (consume(['KeyM'])) {
    const on = audio.toggle();
    document.getElementById('muteBtn').textContent = on ? 'Sound' : 'Muted';
  }
  if (state.help && consume(cancelCodes)) state.help = false;
  if (consume(['Escape', 'KeyP'])) {
    if (state.mode === 'menu') closeMenu();
    else openMenu();
  }
  if (state.mode === 'menu') {
    const entries = menuEntries();
    if (consume(['ArrowDown', 'KeyS'])) { state.menu.sel = (state.menu.sel + 1) % entries.length; audio.sfx('pickup'); }
    if (consume(['ArrowUp', 'KeyW'])) { state.menu.sel = (state.menu.sel - 1 + entries.length) % entries.length; audio.sfx('pickup'); }
    if (interactPressed()) {
      const it = entries[state.menu.sel];
      if (it && it.open) { audio.sfx('success'); it.act(); }
      else audio.sfx('denied');
    }
    pressed.clear();
    return;
  }
  if (!['title', 'ending'].includes(state.mode) && consume(['KeyR'])) {
    resetGame();
    pressed.clear();
    return;
  }

  if (state.mode === 'title') {
    if (consume(['KeyO'])) startOpenWorld();
    else if (consume(['KeyC']) && loadSave()) continueGame();
    else if (interactPressed()) startGame();
  } else if (state.mode === 'dialogue') {
    updateDialog(dt);
  } else if (state.mode === 'explore') {
    updateExplore(dt);
  } else if (state.mode === 'dream') {
    state.dreamT += dt;
    state.frame += dt * 12;
    if (state.dreamT > 5.4) {
      setScene('rome', 72, 350);
      state.flags.romeStep = 0;
      state.mode = 'explore';
      objective('Walk through Rome and meet Augustus');
      startDialog([
        { speaker: 'narrator', text: 'Tony lands in a marble court. The air smells of laurel, incense, and aggressively optimized skin care.' }
      ]);
    }
  } else if (state.mode === 'bone') {
    updateBone(dt);
  } else if (state.mode === 'peptides') {
    updatePeptides(dt);
  } else if (state.mode === 'drive') {
    updateDrive(dt);
  } else if (state.mode === 'bonus') {
    updateBonus(dt);
  } else if (state.mode === 'produce') {
    updateProduce(dt);
  } else if (state.mode === 'ending') {
    if (interactPressed()) startBonusIntro();
    else if (consume(['KeyB'])) startAugustusBonus();
    else if (consume(['KeyF'])) enterHub(true);
    else if (consume(['KeyR'])) resetGame();
  }
  pressed.clear();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

if (new URLSearchParams(location.search).has('debug')) {
  window.__game = { state, scenes, startGame, setScene, startDialog, ringPhone, resetGame, nearestInteraction };
}

resetGame();
requestAnimationFrame(loop);
