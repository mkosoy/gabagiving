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
  nyc: loadArt('./assets/bg-nyc.webp'),
  pines: loadArt('./assets/bg-pines.webp'),
  bodega: loadArt('./assets/bg-bodega.webp'),
  hubeast: loadArt('./assets/bg-hubeast.webp'),
  apartment: loadArt('./assets/bg-apartment-v2.webp'),
  vesuvio: loadArt('./assets/bg-vesuvio.webp'),
  monks: loadArt('./assets/bg-monks.webp'),
  soup: loadArt('./assets/bg-soup.webp'),
  yankees: loadArt('./assets/bg-yankees.webp'),
  melfi: loadArt('./assets/bg-melfi.webp'),
  costanza: loadArt('./assets/bg-apartment.webp'),
  chamber: loadArt('./assets/bg-chamber.webp'),
  rome: loadArt('./assets/bg-rome.webp'),
  club: loadArt('./assets/bg-club.webp'),
  satriale: loadArt('./assets/bg-satriale.webp'),
  plavStream: loadArt('./assets/plav-stream.webp'),
  cousinTony: loadArt('./assets/photo-cousin-tony.webp'),
  tonyHorse: loadArt('./assets/photo-tony-horse.webp'),
  tonyHead: loadArt('./assets/sprites/tony-head.webp'),
  boneroom: loadArt('./assets/bg-boneroom.webp')
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
    const idx = Math.floor((vy - 92) / 17) + (state.menu.scroll || 0);
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
  narrator: '', system: 'Objective', janice: 'Janice', guard: 'Roman Guard', steinbrenner: 'Steinbrenner', newman: 'Newman',
  womanA: 'Rose', womanB: 'Linda', womanC: 'Debbie', womanD: 'Marie', paulieSuit: 'Paulie',
  bobby: 'Bobby', artie: 'Artie', irina: 'Irina', junior: 'Uncle Junior', derek: 'Derek'
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
  if (state.flags.freeRoam && !state.flags.sandbox) {
    try {
      const existing = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (existing && existing.scene && existing.scene !== 'hub' && !existing.flags?.freeRoam) return;
    } catch (e) { /* fall through */ }
  }
  if (state.mode === 'title' || !state.flags) return;
  if (state.flags.sandbox) return;
  if (['bone', 'peptides', 'drive', 'bonus', 'produce', 'dream', 'ending'].includes(state.mode)) return;
  try {
    saveWorld();
    localStorage.setItem('gabagiving-save-v1', JSON.stringify({
      flags: state.flags,
      scene: state.scene,
      objective: state.objective,
      player: { x: state.player.x, y: state.player.y, dir: state.player.dir, kind: state.player.kind },
      returnTo: state.returnTo || null,
      stats: state.stats,
      unlocked: state.unlocked || {}
    }));
  } catch (e) { /* storage unavailable */ }
}

const WORLD_FLAGS = ['humanFund','marbleRye','trashEclair','deskNap','soupLesson','fakeDisability','cheapInvites','fedGeese','pawnedWatch','elaineDance','therapyDone','marineBiologist','festivus','serenityNow','packageHeist','latexExport','oilBladder','derekMission','derekCash','derekPaid','cashStash1','cashStash2','cashStash3','tribute','boughtPaper','atePretzel','baniaBit','russianFound','pinesCarLooted','pinesTalkedPaulie','pinesTalkedChris','gooseCaught','gotCoffee'];
function saveWorld() {
  try {
    const out = {};
    for (const k of WORLD_FLAGS) if (state.flags[k]) out[k] = state.flags[k];
    out.tribute = state.flags.tribute || 0; // zero balances must survive reloads — losses are real
    localStorage.setItem('gabagiving-world-v1', JSON.stringify(out));
  } catch (e) { /* storage unavailable */ }
}
function loadWorld() {
  try {
    const w = JSON.parse(localStorage.getItem('gabagiving-world-v1') || '{}');
    for (const k of WORLD_FLAGS) if (w[k]) state.flags[k] = w[k];
    if (typeof w.tribute === 'number') state.flags.tribute = w.tribute;
  } catch (e) { /* ignore */ }
}

function loadSave() {
  try {
    const raw = localStorage.getItem('gabagiving-save-v1');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function openMenu() {
  if (!['explore', 'dialogue'].includes(state.mode)) return;
  state.menu = { sel: 0, scroll: 0, returnMode: state.mode };
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
  if (state.flags.freeRoam || u.hub) {
    const schemes = [
      ['humanFund', 'Human Fund prototype', 'Jerry’s apartment'],
      ['marbleRye', 'Marble Rye Heist', 'the house'],
      ['trashEclair', 'Trash Éclair', 'Monk’s Café'],
      ['deskNap', 'Under-desk nap nook', 'Yankees office'],
      ['soupLesson', 'Soup discipline', 'the soup stand'],
      ['fakeDisability', 'Fake disability', 'Yankees office'],
      ['cheapInvites', 'Cheap invitations', 'Monk’s Café'],
      ['fedGeese', 'Feed the geese', 'Gabagool Park'],
      ['pawnedWatch', 'Fence goods at the pawn shop', 'east side'],
      ['elaineDance', 'Elaine’s little kicks', 'Monk’s jukebox'],
      ['therapyDone', 'Therapy session', 'Melfi’s office'],
      ['marineBiologist', 'Marine biologist', 'Monk’s payphone'],
      ['festivus', 'Aired grievances', 'Costanza house'],
      ['serenityNow', 'Serenity now', 'Costanza house'],
      ['packageHeist', 'Package interception', 'the neighborhood'],
      ['derekPaid', 'Junior’s burrito bail', 'the gas station']
    ];
    for (const [flag, label, where] of schemes) {
      const done = !!state.flags[flag];
      entries.push({
        label: `${done ? '✓' : '○'} Scheme — ${label}`,
        hint: done ? 'complete' : `incomplete — ${where}`,
        act: () => closeMenu(), open: true
      });
    }
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
  delete state.flags.pendingSurprise; // transient trigger — never survives a reload
  loadWorld(); // world autosave is newer than any checkpoint — it wins
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
  state.returnTo = s.returnTo || null;
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
  return state.dialog?.lines?.[state.dialog.i];
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

  if (!down(interactCodes)) d.holdT = 0;
  else if (d.chars >= line.text.length) d.holdT = (d.holdT || 0) + dt;
  const holdSkip = down(interactCodes) && (d.holdT || 0) > .45;
  if (interactPressed() || holdSkip) {
    if (d.chars < line.text.length) {
      d.chars = line.text.length;
    } else {
      d.i += 1;
      d.chars = 0;
      d.holdT = 0;
      audio.sfx('confirm');
      if (d.i >= d.lines.length) finishDialog();
    }
  }
}

function finishDialog() {
  const d = state.dialog;
  state.dialog = null;
  state.interactCooldown = Math.max(state.interactCooldown || 0, .45);
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
function costanzaInteractions() {
  return [
  { x: 40, y: 140, w: 60, h: 130, radius: 44, label: 'Festivus pole', action: () => {
    if (!state.flags.festivus) {
      state.flags.festivus = true;
      startDialog([
        { speaker: 'narrator', text: 'A bare aluminum pole. No tinsel. It has a very high strength-to-weight ratio.' },
        { speaker: 'steinbrenner', text: 'IT’S FESTIVUS FOR THE REST OF US! And tonight — the airing of grievances! I GOT A LOTTA PROBLEMS WITH YOU PEOPLE!' },
        { speaker: 'george', text: 'Dad, please. It’s Thanksgiving, not Festivus. Different nightmare.' },
        { speaker: 'steinbrenner', text: 'EVERY DAY IS FESTIVUS IF YOU’RE ANGRY ENOUGH!' }
      ]);
    } else startDialog([{ speaker: 'steinbrenner', text: 'The pole requires no decoration. I find tinsel distracting.' }]);
  } },
  { x: 140, y: 140, w: 100, h: 60, radius: 40, label: 'Frank', action: () => {
    if (!state.flags.serenityNow) {
      state.flags.serenityNow = true;
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - 1);
      audio.sfx('confession');
      startDialog([
        { speaker: 'steinbrenner', text: 'SERENITY NOW! SERENITY NOW! The doctor gave me a relaxation tape. Listen: “serenity nowww”… you feel calmer?' },
        { speaker: 'narrator', text: 'Oddly enough, screaming serenity actually lowers everyone’s stress. Heat drops.' },
        { speaker: 'womanB', text: 'Frank, the neighbors can HEAR you! The Fudges called twice!' }
      ]);
    } else startDialog([{ speaker: 'steinbrenner', text: 'INSANITY LATER! …That’s the sequel tape.' }]);
  } },
  { x: 500, y: 170, w: 100, h: 60, radius: 40, label: 'Estelle', action: () => {
    startDialog(state.player.kind === 'george' ? [
      { speaker: 'womanB', text: 'Georgie! You’re moving back in! I already told the women at the beauty parlor!' },
      { speaker: 'george', text: 'MA! I have a life! A career! …of sorts! People depend on me! …allegedly!' },
      { speaker: 'womanB', text: 'He’s delusional. The busboy at the coffee shop said so.' }
    ] : [
      { speaker: 'womanB', text: 'You’re the Soprano boy. Your mother — Livia? — she once said my kreplach was “aggressively beige.” I never forgot.' },
      { speaker: 'tony', text: 'That… sounds like her. Sorry about the kreplach.' }
    ]);
  } },
  { x: 18, y: 330, w: 80, h: 76, radius: 40, label: 'Leave for the neighborhood', action: leaveOutside }
  ];
}

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
      r(130,190,270,98), r(402,210,56,70), r(444,300,108,92),
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
  costanza: {
    w: 640, h: 416, label: 'The Costanza House · Queens', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(20,8,230,110), r(250,8,170,100), r(500,8,132,110),
      r(130,190,270,98), r(18,180,110,80), r(480,150,150,60)
    ],
    draw: drawCostanza,
    interactions: costanzaInteractions
  },
  melfi: {
    w: 640, h: 416, label: 'Dr. Melfi’s Office · By Appointment', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(24,8,260,120), r(300,8,200,110), r(540,8,92,140),
      r(560,150,72,190), r(180,200,110,80), r(380,200,110,80),
      r(18,200,80,120), r(300,240,120,60)
    ],
    draw: drawMelfiOffice,
    interactions: melfiInteractions
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
    w: 1280, h: 416, label: 'North Caldwell · Free Roam', music: 'house',
    colliders: [
      r(0,0,1280,8), r(0,408,1280,8), r(0,0,8,416), r(1272,0,8,416),
      r(20,8,280,136), r(420,8,210,142),
      r(18,248,150,130), r(448,232,184,158),
      r(260,292,120,68), r(330,168,92,36),
      r(672,8,180,120), r(920,8,170,120), r(1140,8,120,120),
      r(700,300,150,100), r(930,260,220,130), r(1160,300,100,100)
    ],
    draw: drawHub,
    interactions: hubInteractions
  },
  nyc: {
    w: 768, h: 416, label: 'Manhattan · Upper West Side', music: 'nyc',
    colliders: [
      r(0,0,768,8), r(0,408,768,8), r(0,0,4,416), r(764,0,4,416),
      // building rows with gaps at doorways: Monk's ~125, soup ~435, Jerry's ~650
      r(8,8,100,196), r(150,8,270,196), r(470,8,160,196), r(688,8,76,196),
      // sidewalk furniture: newsstand and subway stairwell
      r(500,200,58,34), r(4,200,26,52)
    ],
    draw: drawNyc,
    interactions: nycInteractions
  },
  bodega: {
    w: 640, h: 416, label: 'Bodega · W 81st', music: 'nyc',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      // shelf walls north/east/west, center aisle shelves, deli counter north-center
      r(8,8,250,120), r(390,8,242,120), r(8,128,60,200), r(572,128,60,200),
      r(258,8,124,90), r(180,180,120,60), r(340,180,120,60)
    ],
    draw: drawBodega,
    interactions: bodegaInteractions
  },
  pines: {
    w: 768, h: 416, label: 'The Pine Barrens · South Jersey', music: 'dream',
    colliders: [
      r(0,0,768,8), r(0,408,768,8), r(0,0,4,416), r(764,0,4,416),
      // dense treeline north and deep woods east/west — the clearing is open
      r(8,8,752,150), r(40,158,148,250), r(580,158,180,250),
      // frozen pond lower-left, rusty car right
      r(220,300,120,80), r(560,220,90,50)
    ],
    draw: drawPines,
    interactions: pinesInteractions
  },
  vesuvio: {
    w: 640, h: 416, label: 'Vesuvio · Dinner Service', music: 'vesuvio',
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
    w: 640, h: 416, label: 'Monk’s Café · Manhattan', music: 'monks',
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
    w: 640, h: 416, label: 'The Soup Stand · Manhattan', music: 'soup',
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
  yankees: {
    w: 640, h: 416, label: 'Yankee Stadium · Front Office', music: 'yankees',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(230,40,200,100),
      r(50,290,140,90),
      r(555,90,80,200),
      r(280,150,60,40)
    ],
    draw: drawYankees,
    interactions: yankeesInteractions
  },
  satriale: {
    w: 640, h: 416, label: 'Satriale’s Pork Store · Dream', music: 'satriale',
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
  if (blockedAt(x, y)) {
    // scripted moves must never end inside furniture — spiral out for open floor
    let found = null;
    for (let rad = 8; rad <= 96 && !found; rad += 8) {
      for (let ang = 0; ang < 360 && !found; ang += 45) {
        const cx = x + Math.cos(ang * Math.PI / 180) * rad;
        const cy = y + Math.sin(ang * Math.PI / 180) * rad;
        if (!blockedAt(cx, cy)) found = [cx, cy];
      }
    }
    if (found) { x = found[0]; y = found[1]; }
  }
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
    const nx = a.x + (dx / d) * step;
    const ny = a.y + (dy / d) * step;
    let progressed = false;
    if (!blockedAt(nx, a.y)) { a.x = nx; progressed = true; }
    if (!blockedAt(a.x, ny)) { a.y = ny; progressed = true; }
    if (!progressed) {
      m.stuck = (m.stuck || 0) + dt;
      if (m.stuck > 1.1) {
        a.x = m.x; a.y = m.y;
        m.done = true;
        if (m.onDone) m.onDone();
        continue;
      }
    } else m.stuck = 0;
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
    { kind: 'bobby', x: 330, y: 330, region: { x: 260, y: 310, w: 160, h: 60 }, speed: 24 },
    { kind: 'womanC', x: 760, y: 180, region: { x: 660, y: 140, w: 500, h: 50 }, speed: 34 },
    { kind: 'silvio', x: 900, y: 280, region: { x: 700, y: 198, w: 480, h: 90 }, speed: 30 },
    { kind: 'womanD', x: 1100, y: 180, region: { x: 660, y: 140, w: 500, h: 50 }, speed: 28 },
    { kind: 'bobby', x: 420, y: 260, region: { x: 300, y: 230, w: 260, h: 80 }, speed: 22, npc: 'newman' }
  ],
  nyc: [
    { kind: 'kramer', x: 300, y: 244, region: { x: 560, y: 236, w: 150, h: 36 }, speed: 44, npc: 'kramer' },
    { kind: 'elaine', x: 460, y: 254, region: { x: 90, y: 238, w: 300, h: 36 }, speed: 36 },
    { kind: 'womanA', x: 200, y: 250, region: { x: 60, y: 236, w: 640, h: 40 }, speed: 38 },
    { kind: 'jerry', x: 500, y: 246, region: { x: 420, y: 236, w: 300, h: 36 }, speed: 30 },
    { kind: 'womanD', x: 620, y: 252, region: { x: 200, y: 238, w: 520, h: 36 }, speed: 34 },
    { kind: 'christopher', x: 90, y: 258, region: { x: 50, y: 240, w: 240, h: 34 }, speed: 28 },
    { kind: 'womanC', x: 340, y: 380, region: { x: 60, y: 364, w: 640, h: 32 }, speed: 40 }
  ],
  club: [
    { kind: 'womanD', x: 120, y: 270, region: { x: 60, y: 250, w: 160, h: 80 }, speed: 30 },
    { kind: 'christopher', x: 500, y: 270, region: { x: 440, y: 250, w: 130, h: 80 }, speed: 34 },
    { kind: 'womanB', x: 240, y: 250, region: { x: 200, y: 240, w: 120, h: 70 }, speed: 38 },
    { kind: 'womanC', x: 400, y: 260, region: { x: 340, y: 245, w: 100, h: 60 }, speed: 36 }
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
  ],
  yankees: [
    { kind: 'womanB', x: 480, y: 200, region: { x: 430, y: 160, w: 100, h: 160 }, speed: 24 }
  ]
  // Newman is handled as a dedicated nemesis NPC in the hub, not a generic ambient walker
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
    if ((state.flags.heat || 0) >= 3 && pd < 90) {
      const ang = Math.atan2(n.y - p.y, n.x - p.x);
      n.tx = n.x + Math.cos(ang) * 120;
      n.ty = n.y + Math.sin(ang) * 120;
      n.pause = 0;
      if (!n.fleeing) { n.fleeing = true; n.bark = ['HELP!', 'IT’S HIM!', 'RUN!'][Math.floor(Math.random() * 3)]; n.barkT = 1.2; }
    } else if (n.fleeing && pd > 130) {
      n.fleeing = false;
      n.tx = n.region.x + Math.random() * n.region.w;
      n.ty = n.region.y + Math.random() * n.region.h;
    }
    if (pd < 22) continue; // don't overlap the player
    // notice the player: pause and face them like a real neighbor
    if (pd < 62 && (state.flags.heat || 0) < 3) {
      n.dir = Math.abs(p.x - n.x) > Math.abs(p.y - n.y) ? (p.x > n.x ? 'right' : 'left') : (p.y > n.y ? 'down' : 'up');
      n.moving = false;
      continue;
    }
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
    let spd = n.fleeing ? n.speed * 2.2 : n.speed;
    if (typeof weatherRain === 'function' && weatherRain()) {
      spd *= 1.6; // everyone hurries in the rain
      if (Math.random() < dt * .05 && !n.barkT) { n.bark = ['this rain!', 'my hair!', 'c’mon, MOVE'][Math.floor(Math.random() * 3)]; n.barkT = 1.2; }
    }
    n.x += (dx / d) * spd * dt;
    n.y += (dy / d) * spd * dt;
    n.moving = true;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    // random ambient mutters
    if (Math.random() < dt * .06) {
      n.bark = ['sigh', 'mmpf', 'yeah yeah', 'madone', 'anyway'][Math.floor(Math.random() * 5)];
      n.barkT = 1.4;
      audio.voice(n.kind);
    }
  }
}

function shoveNearest() {
  const p = state.player;
  const list = ambientFor(state.scene);
  let best = null; let bd = 30;
  for (const n of list) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d < bd) { best = n; bd = d; }
  }
  // determine what the punch connects with before touching the combo —
  // a whiffed punch at empty air must not build one
  const bw = state.brawler;
  const hitsBrawler = bw && bw.hp > 0 && Math.hypot(bw.x - state.player.x, bw.y - state.player.y) < 34;
  if (!hitsBrawler && !best) return false;
  // combo tracking: consecutive hits within 1.4s build a combo
  const now = state.time;
  if (!state.combo || now - (state.comboT || 0) > 1.4) state.combo = 0;
  state.combo += 1;
  state.comboT = now;
  const combo = state.combo;
  const comboMul = Math.min(3, 1 + (combo - 1) * .5);
  // a hostile brawler in range takes the hit instead
  if (hitsBrawler) {
    const brickHit = (state.flags.brick || 0) > 0;
    if (brickHit) state.flags.brick -= 1;
    bw.hp -= brickHit ? 2 : 1;
    bw.hitT = .5;
    bw.x += (bw.x - state.player.x) * .3 * comboMul;
    bw.y += (bw.y - state.player.y) * .3 * comboMul;
    bw.bark = bw.hp > 0 ? ['GAAH!', 'MY NOSE!', 'CHEAP SHOT!'][Math.floor(Math.random() * 3)] : 'MADONE...';
    bw.barkT = 1.4;
    const hitWord = brickHit ? 'BRICK!' : combo >= 3 ? 'UPPERCUT!' : combo === 2 ? 'POW POW!' : 'POW';
    spawnEffect(bw.x + 8, bw.y - 12, bw.hp > 0 ? hitWord : 'KNOCKOUT!', '#ffe78a');
    if (combo >= 2) spawnEffect(bw.x + 8, bw.y - 24, `COMBO x${combo}`, '#ff9a3e');
    audio.sfx('smash');
    if (bw.hp <= 0) {
      spawnEffect(state.player.x + 8, state.player.y - 22, state.player.kind === 'george' ? 'GEORGE WINS?!' : 'TONY WINS', '#9be59b');
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
    }
    return true;
  }
  if (!best) return false;
  const ang = Math.atan2(best.y - p.y, best.x - p.x) || 0;
  const knock = 26 * comboMul;
  best.x += Math.cos(ang) * knock;
  best.y += Math.sin(ang) * knock;
  best.diveT = .5 + combo * .1;
  best.bark = p.kind === 'george' ? 'SERENITY NOW!' : ['HEY!', 'WATCH IT!', 'THE NERVE!'][Math.floor(Math.random() * 3)];
  best.barkT = 1.6;
  state.flags.heat = Math.min(5, (state.flags.heat || 0) + (combo >= 3 ? 1.5 : 1));
  if (p.kind === 'george' && Math.random() < .3) {
    spawnEffect(p.x + 8, p.y - 14, 'MY BACK!', '#ff8e8e');
    best.bark = 'did… did you just hurt YOURSELF?';
    audio.sfx('denied');
  }
  spawnEffect(best.x + 8, best.y - 10, combo >= 3 ? 'LAUNCHED' : combo === 2 ? 'SHOVED x2' : 'SHOVED', '#ff9a7a');
  if (combo >= 2) spawnEffect(best.x + 8, best.y - 22, `COMBO x${combo}`, '#ff9a3e');
  // combo finishers drop extra cash
  const cashChance = p.kind === 'george' ? 0 : Math.min(.8, .45 + (combo - 1) * .2);
  if (Math.random() < cashChance) {
    if (!state.cash) state.cash = [];
    state.cash.push({ x: best.x + 6, y: best.y + 14, t: 0 });
    if (combo >= 3) state.cash.push({ x: best.x - 8, y: best.y + 18, t: 0 });
    best.bark = 'TAKE IT! JUST TAKE IT!';
  }
  audio.sfx('smash');
  audio.voice(best.kind);
  return true;
}

function updateCash(dt) {
  if (!state.cash || !state.cash.length) return;
  const p = state.player;
  for (const c of state.cash) c.t += dt;
  for (let i = state.cash.length - 1; i >= 0; i--) {
    const c = state.cash[i];
    if (c.t > 20 || Math.hypot(c.x - p.x - 8, c.y - p.y - 10) < 18) {
      if (c.t <= 20) {
        state.stats.vials = state.stats.vials; // no-op guard
        spawnEffect(p.x + 8, p.y - 12, '+$50 TRIBUTE', '#9be59b');
        audio.sfx('pickup');
        state.flags.tribute = (state.flags.tribute || 0) + 50;
      }
      state.cash.splice(i, 1);
    }
  }
}

function drawCash() {
  if (!state.cash) return;
  for (const c of state.cash) {
    const bob = Math.sin(state.time * 4 + c.x) * 2;
    px(ctx, c.x - 7, c.y - 4 + bob, 14, 9, '#e2c88f');
    px(ctx, c.x - 5, c.y - 6 + bob, 5, 6, '#4c9a58');
    px(ctx, c.x + 1, c.y - 6 + bob, 5, 6, '#4c9a58');
    outlineText(ctx, '$', c.x + 1, c.y - 3 + bob, '#174d2b', 6, 'center');
  }
}

function drawAmbient() {
  const list = ambientFor(state.scene);
  for (const n of list) {
    const frame = n.moving ? state.frame * 1.6 : state.frame * .5;
    drawPerson(ctx, n.x, n.y, n.kind, n.dir, frame, n.diveT > 0 ? { pose: 'lean' } : {});
    if (n.npc === 'newman') {
      // mailbag and cap
      px(ctx, n.x + 3, n.y + 9, 9, 6, '#4a5f8a');
      px(ctx, n.x + 3, n.y + 9, 9, 2, '#33415e');
      px(ctx, n.x + 2, n.y - 3, 11, 3, '#4a5f8a');
      outlineText(ctx, 'NEWMAN', n.x + 8, n.y - 8, '#9fb8ec', 6, 'center');
    }
    if (n.barkT > 0 && n.bark) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, n.barkT);
      outlineText(ctx, n.bark, n.x + 10, n.y - 6, '#fff1a6', 7, 'center');
      ctx.restore();
    }
    n.moving = false;
  }
}

function isNight() {
  if (state.scene !== 'hub' && state.scene !== 'nyc') return false;
  const dayT = (state.time % 240) / 240;
  return dayT >= .62 && dayT < .95;
}

function updateCop(dt) {
  if (!state.flags.freeRoam || (state.scene !== 'hub' && state.scene !== 'nyc')) { state.cop = null; state.cop2 = null; return; }
  const heat = state.flags.heat || 0;
  // night makes the law jumpy — they come out earlier and backup arrives sooner
  const spawnAt = isNight() ? 2.2 : 3;
  const backupAt = isNight() ? 2.8 : 3.5;
  if (heat >= spawnAt && !state.cop) {
    state.cop = { x: 40, y: 100, flashT: 0, bustT: 0 };
    audio.sfx('honk');
    spawnEffect(state.player.x + 8, state.player.y - 20, 'COPS!', '#8fb8ff');
  }
  const c = state.cop;
  if (!c) return;
  if (heat < 1.5) {
    spawnEffect(c.x, c.y, 'HEAT CLEARED', '#8ffff2');
    state.cop = null;
    state.cop2 = null;
    return;
  }
  // wanted escalation: a second unit joins at high heat
  if (heat >= backupAt && !state.cop2) {
    state.cop2 = { x: state.scene === 'nyc' ? 740 : 1240, y: 380, flashT: 0, bustT: 0 };
    spawnEffect(state.player.x + 8, state.player.y - 20, 'BACKUP CALLED!', '#8fb8ff');
    audio.sfx('honk');
  }
  if (heat < backupAt - .5 && state.cop2) state.cop2 = null;
  const p = state.player;
  const speed = p.inCar ? 150 : 120;
  for (const unit of [c, state.cop2].filter(Boolean)) {
    unit.flashT += dt;
    // second unit approaches from a flanking angle
    const flank = unit === state.cop2 ? 60 : 0;
    const tx = (p.x + 8) + flank, ty = (p.y + 8) - flank * .5;
    const dx = tx - unit.x, dy = ty - unit.y;
    const d = Math.hypot(dx, dy) || 1;
    unit.x += dx / d * speed * dt;
    unit.y += dy / d * speed * dt;
    unit.angle = Math.atan2(dy, dx) + Math.PI / 2;
  }
  const dx = (p.x + 8) - c.x, dy = (p.y + 8) - c.y;
  const d = Math.hypot(dx, dy) || 1;
  // either unit close enough counts toward the bust
  const d2 = state.cop2 ? Math.hypot((p.x + 8) - state.cop2.x, (p.y + 8) - state.cop2.y) : 999;
  if (Math.min(d, d2) < 30) {
    c.bustT += dt;
    if (c.bustT > .8) {
      state.cop = null;
      state.cop2 = null;
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

function drawHubEventProps() {
  if (state.scene !== 'hub') return;
  if (state.flags.derekMission && !state.flags.derekPaid) {
    drawPerson(ctx, 972, 148, 'derek', 'down', state.frame * .5, {});
    outlineText(ctx, 'DEREK', 980, 128, '#9fb8ec', 6, 'center');
    if (Math.floor(state.time * 1.4) % 3 === 0) outlineText(ctx, '☎ …yes, he said BURN it down…', 980, 116, '#e8e2d0', 6, 'center');
  }
  // cash stash glints
  if (state.flags.derekMission) {
    const spots = [['cashStash1', 130, 168], ['cashStash2', 730, 268], ['cashStash3', 990, 228]];
    for (const [k, sx, sy] of spots) {
      if (!state.flags[k] && Math.sin(state.time * 4) > 0) outlineText(ctx, '✦', sx, sy, '#ffe78a', 8, 'center');
    }
  }
  if (state.iceCream) {
    const t = state.iceCream;
    px(ctx, t.x - 2, t.y - 2, 46, 20, 'rgba(0,0,0,.3)');
    px(ctx, t.x, t.y, 42, 16, '#f4f0e8');
    px(ctx, t.x, t.y, 42, 5, '#e88fb1');
    px(ctx, t.x + 30, t.y + 4, 10, 8, '#9fd4ec');
    px(ctx, t.x + 4, t.y - 4, 10, 4, '#e88fb1');
    outlineText(ctx, 'ICE', t.x + 12, t.y + 7, '#b3312c', 5, 'center');
    px(ctx, t.x + 6, t.y + 15, 7, 4, '#05070c');
    px(ctx, t.x + 30, t.y + 15, 7, 4, '#05070c');
    // music notes
    if (Math.floor(state.time * 2) % 2) outlineText(ctx, '♪', t.x + 48, t.y - 4, '#fff1a6', 7, 'center');
  }
  if (state.dogWalker) {
    const d = state.dogWalker;
    drawPerson(ctx, d.x, d.y, 'womanC', 'left', state.frame * 1.6, {});
    const bob = Math.sin(state.time * 6) * 1.5;
    px(ctx, d.x - 16, d.y + 8 + bob, 12, 6, '#8a6a42');
    px(ctx, d.x - 20, d.y + 6 + bob, 5, 5, '#8a6a42');
    px(ctx, d.x - 6, d.y + 8 + bob, 3, 1, '#c9a06a');
    px(ctx, d.x - 8, d.y + 4, 8, 1, '#888');
  }
}

function drawCop() {
  if (state.scene !== 'hub' && state.scene !== 'nyc') return;
  for (const c of [state.cop, state.cop2].filter(Boolean)) {
    drawCar(c.x, c.y, '#e8ecf2', false, c.angle || 0);
    // flashing lightbar
    const phase = Math.floor(c.flashT * 6) % 2;
    px(ctx, c.x - 7, c.y - 4, 6, 3, phase ? '#ff4444' : '#882222');
    px(ctx, c.x + 1, c.y - 4, 6, 3, phase ? '#222288' : '#4488ff');
  }
}

function updateKramerCycle(dt) {
  if (!state.flags.freeRoam || state.scene !== 'apartment') return;
  if (!state.kramerCycle) state.kramerCycle = { t: 8, phase: 'gone', x: 596, y: 130, dir: 'left' };
  const kc = state.kramerCycle;
  kc.t -= dt;
  if (kc.phase === 'gone' && kc.t <= 0) {
    kc.phase = 'enter'; kc.x = 596; kc.y = 130; kc.dir = 'left'; kc.t = 2;
    audio.voice('kramer');
  } else if (kc.phase === 'enter') {
    kc.x -= 190 * dt; kc.y += 20 * dt;
    if (kc.t <= 0 || kc.x < 400) { kc.phase = 'raid'; kc.t = 2.6; kc.dir = 'up'; }
  } else if (kc.phase === 'raid') {
    kc.x += (296 - kc.x) * dt * 3; kc.y += (150 - kc.y) * dt * 3;
    if (kc.t <= 0) {
      kc.phase = 'leave'; kc.dir = 'right';
      const lines = ['Jerry! I’m taking the juice!', 'These pretzels… I’m out!', 'You got mustard? Never mind, I got mustard.'];
      spawnEffect(kc.x + 8, kc.y - 14, lines[Math.floor(Math.random() * lines.length)], '#fff1a6');
      audio.voice('kramer');
    }
  } else if (kc.phase === 'leave') {
    kc.x += 200 * dt; kc.y -= 10 * dt;
    if (kc.x > 610) { kc.phase = 'gone'; kc.t = 14 + Math.random() * 10; }
  }
}

function updateBrawler(dt) {
  if (state.scene !== 'hub' || !state.flags.freeRoam) { state.brawler = null; return; }
  const p = state.player;
  if (!state.brawler && Math.random() < dt * .02) {
    state.brawler = { x: 680 + Math.random() * 540, y: 140 + Math.random() * 50, hp: 3, state: 'prowl', t: 0, tx: 700, ty: 240, barkT: 0, swingT: 0, hitT: 0 };
  }
  const b = state.brawler;
  if (!b) return;
  if (b.barkT > 0) b.barkT -= dt;
  if (b.hitT > 0) b.hitT -= dt;
  if (b.swingT > 0) b.swingT -= dt;
  const pd = Math.hypot(b.x - p.x, b.y - p.y);
  if (b.hp <= 0) {
    b.t += dt;
    if (b.t > 2.2) {
      if (Math.random() < .6) {
        if (!state.cash) state.cash = [];
        state.cash.push({ x: b.x, y: b.y + 10, t: 0 });
      }
      state.brawler = null;
    }
    return;
  }
  // notice the player: trash talk, then chase and swing
  if (pd < 120 && b.state === 'prowl') {
    b.state = 'chase';
    b.bark = p.kind === 'george' ? 'YOU! PARKS-WEARING GUY!' : 'SOPRANO! THIS IS OUR SIDE NOW!';
    b.barkT = 2;
    audio.voice('christopher');
  }
  if (b.state === 'chase') {
    if (pd > 26) {
      const ang = Math.atan2(p.y - b.y, p.x - b.x);
      const bx = b.x + Math.cos(ang) * 68 * dt;
      const by = b.y + Math.sin(ang) * 68 * dt;
      if (!blockedAt(bx, b.y)) b.x = bx;
      if (!blockedAt(b.x, by)) b.y = by;
      b.dir = Math.abs(p.x - b.x) > Math.abs(p.y - b.y) ? (p.x > b.x ? 'right' : 'left') : (p.y > b.y ? 'down' : 'up');
      b.moving = true;
    } else if (b.swingT <= 0) {
      b.swingT = 1.1;
      b.moving = false;
      if ((state.flags.hp || 3) <= 1) {
        state.flags.hp = 3;
        state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 40);
        spawnEffect(p.x, p.y - 18, '-$40 ROBBED', '#ff6a6a');
        b.bark = 'THANKS FOR THE DONATION!';
        b.barkT = 1.8;
      } else {
        state.flags.hp = (state.flags.hp || 3) - 1;
        spawnEffect(p.x, p.y - 18, 'OOF', '#ff6a6a');
      }
      audio.sfx('smash');
    }
  }
}

function drawBrawler() {
  const b = state.brawler;
  if (!b) return;
  if (b.hp <= 0) {
    drawPerson(ctx, b.x, b.y + 6, 'christopher', 'down', 0, { pose: 'lean' });
    outlineText(ctx, 'KNOCKED OUT', b.x + 8, b.y - 10, '#ff9a7a', 7, 'center');
    return;
  }
  drawPerson(ctx, b.x, b.y, 'christopher', b.dir || 'down', b.moving ? state.frame * 1.6 : state.frame * .5, b.hitT > 0 ? { pose: 'lean' } : {});
  // hp pips
  for (let i = 0; i < b.hp; i++) px(ctx, b.x + 2 + i * 6, b.y - 8, 4, 3, '#ff5a5a');
  if (b.barkT > 0 && b.bark) outlineText(ctx, b.bark, b.x + 8, b.y - 16, '#ffb1a1', 7, 'center');
}

function updateNycTaxis(dt) {
  if (state.scene !== 'nyc') return;
  if (!state.nycCars) {
    state.nycCars = [
      { x: 100, y: 292, dir: 1, speed: 66, brakeT: 0, honkT: 0 },
      { x: 500, y: 292, dir: 1, speed: 54, brakeT: 0, honkT: 0 },
      { x: 700, y: 322, dir: -1, speed: 74, brakeT: 0, honkT: 0 }
    ];
  }
  const p = state.player;
  for (const c of state.nycCars) {
    if (c.honkT > 0) c.honkT -= dt;
    if (c.brakeT > 0) c.brakeT -= dt;
    const blocked = !p.inCar && Math.abs(p.y - (c.y + 8)) < 22 && (c.dir > 0 ? (c.x < p.x && p.x - c.x < 92) : (c.x > p.x && c.x - p.x < 92));
    if (blocked) {
      c.brakeT = Math.max(c.brakeT, .3);
      c.stuckT = (c.stuckT || 0) + dt;
      if (c.stuckT > 1.2 && c.honkT <= 0) {
        c.honkT = 1.4;
        c.stuckT = 0;
        audio.sfx('honk');
        spawnEffect(c.x + 15, c.y - 6, 'HONK!', '#ffe78a');
      }
    } else c.stuckT = 0;
    if (c.brakeT > 0) {
      c.x += c.dir * 8 * dt;
    } else {
      c.x += c.dir * c.speed * dt;
    }
    if (c.dir > 0 && c.x > 840) { c.x = -70; c.brakeT = 0; }
    if (c.dir < 0 && c.x < -80) { c.x = 840; c.brakeT = 0; }
  }
}

function updateHubEvents(dt) {
  updateNycTaxis(dt);
  if (!state.flags.freeRoam || state.scene !== 'hub') return;
  // persistent reactive traffic: cars brake and honk at pedestrians, crash into the player's car
  if (!state.hubCars) {
    state.hubCars = [
      { x: 100, y: 246, dir: 1, speed: 54, color: '#31445e', honkT: 0, brakeT: 0 },
      { x: 900, y: 268, dir: -1, speed: 66, color: '#7e2733', honkT: 0, brakeT: 0 }
    ];
  }
  const p = state.player;
  for (const c of state.hubCars) {
    if (c.honkT > 0) c.honkT -= dt;
    if (c.brakeT > 0) c.brakeT -= dt;
    if (c.clipT > 0) c.clipT -= dt;
    // is the player in the road ahead of this car?
    const aheadX = c.x + c.dir * 40;
    const playerInPath = Math.abs(p.y - c.y) < 18 && ((c.dir > 0 && p.x > c.x - 10 && p.x < aheadX + 55) || (c.dir < 0 && p.x < c.x + 34 && p.x > aheadX - 55));
    let braking = false;
    if (!p.inCar && playerInPath) {
      braking = true;
      if (c.honkT <= 0) {
        c.honkT = 1.6 + Math.random();
        audio.sfx('honk');
        spawnEffect(c.x + 17, c.y - 12, 'HONK!', '#ffe78a');
      }
      // run-down at speed if the car isn't yet braking much
      const pd = Math.hypot((p.x + 8) - (c.x + 17), (p.y + 8) - (c.y + 7));
      if (pd < 20 && c.brakeT <= 0 && (c.clipT || 0) <= 0) {
        c.clipT = 1.2;
        p.inCar = false;
        spawnEffect(p.x + 8, p.y - 14, 'CLIP!', '#ff6a6a');
        // knockback must not shove the player through walls — step out as far as collision allows
        let knock = 30;
        while (knock > 0 && blockedAt(p.x + c.dir * knock, p.y)) knock -= 6;
        if (knock > 0) p.x += c.dir * knock;
        state.flags.hp = Math.max(1, (state.flags.hp || 3) - 1);
        audio.sfx('crash');
      }
    }
    // player driving into traffic: fender bender
    const cd = Math.hypot((p.x + 8) - (c.x + 17), (p.y + 10) - (c.y + 7));
    if (p.inCar) {
      if (cd < 26 && c.crashT === undefined) {
        c.crashT = 0;
        c.brakeT = 2.5;
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + .75);
        spawnEffect(c.x + 17, c.y - 10, 'CRUNCH!', '#ff9a7a');
        audio.sfx('crash');
        if (!state.cash) state.cash = [];
        if (Math.random() < .5) state.cash.push({ x: c.x + 22, y: c.y + 16, t: 0 });
        c.honkT = 2;
        audio.sfx('honk');
      }
    }
    if (c.crashT !== undefined) {
      c.crashT += dt;
      // cooldown only clears once the cars have actually separated,
      // so one sustained contact can never count as two crashes
      if (c.crashT > 2.5 && cd > 32) delete c.crashT;
    }
    if (!braking && c.brakeT <= 0) {
      c.x += c.dir * c.speed * dt;
      if (c.dir > 0 && c.x > 1400) { c.x = -60; c.y = 246; }
      if (c.dir < 0 && c.x < -70) { c.x = 1400; c.y = 268; }
    } else if (braking) {
      // crawl slowly while someone stands in the road
      c.x += c.dir * 9 * dt;
    }
  }
  if (state.iceCream) {
    state.iceCream.t += dt;
    state.iceCream.x += 52 * dt;
    if (state.iceCream.x > 1400) state.iceCream = null;
  }
  if (state.dogWalker) {
    state.dogWalker.t += dt;
    state.dogWalker.x -= 38 * dt;
    if (state.dogWalker.x < -60) state.dogWalker = null;
  }
  state.hubEventT = (state.hubEventT ?? 6) - dt;
  if (state.hubEventT > 0) return;
  state.hubEventT = 9 + Math.random() * 12;
  const npcs = ambientFor('hub');
  const roll = Math.random();
  if (roll < .12) {
    // ice cream truck rolls through playing its jingle; pedestrians drift toward it
    state.iceCream = { x: -80, y: 232, t: 0 };
    audio.sfx('turkey');
    const n = npcs[Math.floor(Math.random() * npcs.length)];
    if (n) { n.bark = 'ICE CREAM!'; n.barkT = 1.8; }
  } else if (roll < .24) {
    // dog walker crosses the neighborhood
    state.dogWalker = { x: 1290, y: 286, t: 0 };
  } else if (roll < .3 && npcs.length >= 2) {
    // two pedestrians argue about nothing
    const [a, b] = [npcs[0], npcs[npcs.length - 1]];
    a.bark = 'I’M WALKIN’ HERE!'; a.barkT = 2.2;
    b.bark = 'YOU GOTTA PROBLEM?!'; b.barkT = 2.6;
    audio.voice('tony');
  } else if (roll < .55) {
    // goose attack
    const n = npcs[Math.floor(Math.random() * npcs.length)];
    if (n) {
      n.bark = 'THE GEESE ARE BACK!'; n.barkT = 2.4;
      n.diveT = .8;
      spawnEffect(n.x + 10, n.y - 12, 'HONK!!', '#ffffff');
      audio.sfx('honk');
    }
  } else if (roll < .75) {
    // car backfire
    spawnEffect(300 + Math.random() * 200, 252, 'BACKFIRE!', '#ffb13e');
    audio.sfx('crash');
    for (const n of npcs) { n.pause = 1.2; }
  } else if (roll < .88) {
    // newman taunts
    const nm = npcs.find((x) => x.npc === 'newman');
    if (nm) {
      const taunts = state.player.kind === 'george'
        ? ['Hellooo, Costanza.', 'Your mail is… delayed. Forever.', 'I know about the rye, George.']
        : ['You’re the one they call Tony? Hm. I control the MAIL, you know.', 'Beautiful stamps you people steal— er, use.'];
      nm.bark = taunts[Math.floor(Math.random() * taunts.length)];
      nm.barkT = 2.6;
      nm.pause = 1.4;
    }
  } else {
    // neighborhood gossip
    const n = npcs[Math.floor(Math.random() * npcs.length)];
    if (n) {
      const gossip = ['Did you hear about the Bing?', 'Some guy hit three pedestrians. Allegedly.', 'Artie’s in love again.', 'They found coins in the pork store.'];
      n.bark = gossip[Math.floor(Math.random() * gossip.length)];
      n.barkT = 3;
    }
  }
}

function updateExplore(dt) {
  // anti-stuck beacon: idle players get a glowing hint toward the nearest interaction
  const moving = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].some((k) => keys[k]) || (state.player.movingScript);
  state.idleT = moving || state.dialog ? 0 : (state.idleT || 0) + dt;
  if (state.flags.pendingSurprise && !state.dialog && !state.phone) {
    state.flags.pendingSurprise = false;
    state.flags.surpriseShown = true;
    startDialog([
      { speaker: 'jerry', text: 'Five schemes. FIVE. I counted. The cane, the invitations, the éclair — Newman told me about the rye, by the way. NEWMAN knew before I did.' },
      { speaker: 'george', text: 'It’s not a scheme if it WORKS, Jerry. Then it’s just… initiative.' },
      { speaker: 'kramer', text: 'I want in on the next one. Whatever it is. I’m in. Don’t even tell me.' }
    ]);
  }
  if (state.interactCooldown > 0) state.interactCooldown -= dt;
  updatePhone(dt);
  if (state.phone) return;
  updateAmbient(dt);
  updateRyeHeist(dt);
  updateCop(dt);
  updateKramerCycle(dt);
  updateHubEvents(dt);
  updateBrawler(dt);
  updateCash(dt);
  state.worldSaveT = (state.worldSaveT || 0) + dt;
  if (state.worldSaveT > 8) { state.worldSaveT = 0; saveWorld(); }
  if (state.flags.heat > 0 && state.mode === 'explore') state.flags.heat = Math.max(0, state.flags.heat - dt * .03);
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
    p.carColor = null;
    p.speed = p.kind === 'george' ? 96 : 88;
    audio.sfx('door');
    spawnEffect(p.x + 8, p.y - 8, 'ON FOOT', '#8ffff2');
    return;
  }
  if (input.x || input.y) {
    if (Math.abs(input.x) > Math.abs(input.y)) p.dir = input.x > 0 ? 'right' : 'left';
    else p.dir = input.y > 0 ? 'down' : 'up';
    // cars carry momentum: spin up over ~1.2s instead of instant speed
    if (p.inCar) p.carV = Math.min(1, (p.carV || 0) + dt * 1.2);
    const sp = p.speed * dt * (p.inCar ? Math.max(.25, p.carV) : 1);
    p.stepAcc = (p.stepAcc || 0) + sp;
    if (p.stepAcc > (p.inCar ? 99999 : 26)) {
      p.stepAcc = 0;
      audio.step(p.kind);
    }
    const nx = p.x + input.x * sp;
    const hitWallX = blockedAt(nx, p.y);
    if (!hitWallX) p.x = nx;
    const ny = p.y + input.y * sp;
    const hitWallY = blockedAt(p.x, ny);
    if (!hitWallY) p.y = ny;
    if (p.inCar && (hitWallX || hitWallY) && (p.carV || 0) > .55) {
      p.carDamage = (p.carDamage || 0) + 1;
      p.carV = .2;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .4);
      audio.sfx('crash');
      spawnEffect(p.x + 8, p.y - 8, p.carDamage >= 3 ? 'TOTALED!' : 'CRUNCH', '#ff9a7a');
      if (p.carDamage >= 3) {
        p.inCar = false;
        p.carColor = null;
        p.carDamage = 0;
        p.speed = p.kind === 'george' ? 96 : 88;
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'The car is totaled. George exits through the door that no longer opens, onto the street, in front of witnesses.' },
          { speaker: 'george', text: 'The brakes! The BRAKES in this city are all defective! I’m writing a letter!' }
        ] : [
          { speaker: 'narrator', text: 'Totaled. Tony steps out, looks at the wreck, and walks away at exactly the speed of a man who has never seen this car before.' },
          { speaker: 'tony', text: 'What car? I’m a pedestrian. Always have been. Beautiful neighborhood for walking.' }
        ]);
      }
    }
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
    if (p.inCar) p.carV = Math.max(0, (p.carV || 0) - dt * 2);
    state.frame += dt * 2;
  }
  const scene = scenes[state.scene];
  state.camera.x = Math.max(0, Math.min(scene.w - W, p.x - W / 2));
  state.camera.y = Math.max(0, Math.min(scene.h - H, p.y - H / 2));

  const inter = nearestInteraction();
  if (!inter && interactPressed() && (state.interactCooldown || 0) <= 0 && state.flags.freeRoam) {
    // small talk: pedestrians answer when you walk up and engage them
    let talker = null; let td = 34;
    for (const n of ambientFor(state.scene)) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < td) { talker = n; td = d; }
    }
    if (talker) {
      state.interactCooldown = .6;
      const lines = state.player.kind === 'george'
        ? [['You look familiar. Do I owe you money?', 'george'], ['Nice walking weather. Terrible standing weather.', 'george']]
        : [['You didn’t see me here. Capisce?', 'tony'], ['Beautiful day. Shame to waste it, huh?', 'tony']];
      const pick = lines[Math.floor((state.time * .5) % lines.length)];
      talker.bark = state.player.kind === 'george' ? '...who are you?' : 'uh — yes sir, Mr. Soprano';
      talker.barkT = 2;
      audio.voice(p.kind === 'george' ? 'george' : 'tony');
      startDialog([
        { speaker: p.kind === 'george' ? 'george' : 'tony', text: pick[0] },
        { speaker: 'narrator', text: talker.bark }
      ]);
    }
  }
  if (inter && interactPressed() && (state.interactCooldown || 0) <= 0) {
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
  const list = scene.interactions().filter((i) => (typeof i.hidden === 'function' ? !i.hidden() : !i.hidden));
  if (state.flags.freeRoam && state.scene !== 'hub' && state.scene !== 'nyc') {
    list.push({ x: 272, y: 378, w: 116, h: 34, label: 'Exit → Neighborhood', action: () => {
      if (state.returnTo && scenes[state.returnTo.scene]) leaveOutside();
      else enterHub(false);
    } });
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
  if (g.caught >= 6) {
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
  if (!state.flags.derekPaid) state.flags.derekMission = true;
  objective(houseObjective());
  startDialog([
    { speaker: 'narrator', text: 'Tony jolts awake on the couch. The documentary credits roll. The robe is somehow tighter around the jaw.' },
    { speaker: 'tony', text: 'Groceries. Right. Carmela’s card. Focus.' }
  ], () => {
    ringPhone('derek', [
      { speaker: 'derek', text: 'Tony — Derek. Don’t panic, but Uncle Junior called his waiter a fed and threatened to burn down the new Chipotle on Bloomfield. I’m heading there RIGHT now.' },
      { speaker: 'tony', text: 'The guy’s ninety-something, what damage could he— you know what, don’t answer that.' },
      { speaker: 'derek', text: 'I can smooth this over, but we’ll need some cash. Walking-around money. Figure a hundred fifty.' },
      { speaker: 'tony', text: 'A hundred fifty. For a burrito incident. Fine — I know a few places money tends to fall outta people’s pockets. I’ll find you by the gas station.' },
      { speaker: 'derek', text: 'Hurry, Tony. And Tony — this stays between us. Attorney-client, whatever.' },
      ...(state.flags.derekPaid ? [
        { speaker: 'tony', text: 'Funny thing, Derek. I got this feelin’ I already paid you. Like a dream inside the dream.' },
        { speaker: 'derek', text: 'You DID look vaguely familiar at the gas station. Déjà vu. Billable either way.' }
      ] : [])
    ], () => {
      if (!state.flags.derekPaid) objective('Find $150 around the neighborhood for Derek');
    });
  });
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
    particles: [],
    shake: 0,
    boost: 0,
    speed: .42,
    finished: false
  };
}

function spawnSparks(d, x, y, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 40 + Math.random() * 90;
    d.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 30,
      life: .5 + Math.random() * .4,
      t: 0,
      color: Math.random() < .5 ? '#ffd76e' : Math.random() < .5 ? '#ff9a4a' : '#c8ccd4'
    });
  }
}

function updateDrive(dt) {
  updatePhone(dt);
  const d = state.drive;
  if (!d || d.finished) return;
  const input = moveInput();
  // acceleration physics: up = gas, down = brake, natural drift toward cruise speed
  const cruise = .42;
  if (input.y < 0) d.speed = Math.min(1, d.speed + .52 * dt);
  else if (input.y > 0) d.speed = Math.max(.12, d.speed - 1.15 * dt);
  else d.speed += (cruise - d.speed) * Math.min(1, .35 * dt);
  // steering tightens slightly at speed
  d.x = Math.max(180, Math.min(460, d.x + input.x * (140 + d.speed * 120) * dt));
  d.boost = Math.max(0, d.boost - dt);
  const boostMul = d.boost > 0 ? 1.6 : 1;
  const scroll = (110 + d.speed * 330) * boostMul;
  d.road += dt * scroll;
  d.progress += dt * 5.2 * d.speed * boostMul;
  // exhaust particles when flooring it
  if (input.y < 0 && Math.random() < dt * 14) {
    d.particles.push({ x: d.x + (Math.random() - .5) * 10, y: d.y + 20, vx: (Math.random() - .5) * 12, vy: 40 + Math.random() * 30, life: .5, t: 0, color: 'rgba(120,120,120,.5)', smoke: true });
  }
  d.spawn -= dt;
  if (d.spawn <= 0) {
    d.spawn = Math.max(.5, .95 - d.progress * .004);
    const typeRoll = Math.random();
    const type = typeRoll < .13 ? 'money' : typeRoll < .34 ? 'gabagool' : typeRoll < .5 ? 'nycrew' : typeRoll < .64 ? 'traffic' : typeRoll < .78 ? 'nycar' : typeRoll < .9 ? 'janice' : 'paulie';
    const lanes = [195, 250, 305, 360, 415, 455];
    d.obstacles.push({
      type,
      x: lanes[Math.floor(Math.random() * lanes.length)],
      y: -45,
      vx: type === 'janice' ? (Math.random() > .5 ? 70 : -70) : type === 'paulie' ? (Math.random() - .5) * 55 : type === 'nycrew' ? (Math.random() - .5) * 90 : type === 'nycar' ? (Math.random() - .5) * 40 : 0,
      hit: false,
      sprite: Math.random() < .5 ? 'silvio' : 'christopher',
      wobble: Math.random() * 10,
      carColor: ['#4a5e78', '#6e5540', '#556b4f', '#7a4a55'][Math.floor(Math.random() * 4)],
      speedMul: type === 'traffic' ? .45 + Math.random() * .2 : type === 'nycar' ? .7 : 1
    });
  }
  for (const o of d.obstacles) {
    o.y += dt * scroll * (o.speedMul || 1);
    o.x += o.vx * dt;
    if (o.spin) { o.y += dt * 160; o.x += o.vx * dt * 2.4; o.spin -= dt; }
    if (o.x < 178 || o.x > 462) o.vx *= -1;
    const ox = o.x - 13, oy = o.y - 12;
    const car = { x: d.x - 13, y: d.y - 18, w: 26, h: 34 };
    if (!o.hit && rectsOverlap(car, { x: ox, y: oy, w: 26, h: 24 })) {
      o.hit = true;
      if (o.type === 'money') {
        d.boost = 2.7;
        d.score += 100;
        spawnEffect(o.x, o.y - 8, '+$100', '#9be59b');
        audio.sfx('pickup');
      } else if (o.type === 'nycrew') {
        d.score += 250;
        d.boost = Math.max(d.boost, 1.1);
        o.spin = 1;
        spawnSparks(d, o.x, o.y, 8);
        spawnEffect(o.x, o.y - 8, '+250 NY CREW', '#ffe78a');
        audio.sfx('smash');
        audio.voice('junior');
      } else if (o.type === 'nycar' && d.speed > .62) {
        // ram them at speed: spin them out
        d.score += 400;
        o.spin = 1.2;
        d.speed = Math.max(.35, d.speed - .18);
        d.shake = .3;
        spawnSparks(d, o.x, o.y, 16);
        spawnEffect(o.x, o.y - 8, 'RAMMED +$400', '#ffe78a');
        audio.sfx('smash');
        audio.voice('tony');
      } else {
        // crash: lose speed hard
        d.health -= 1;
        d.speed = Math.max(.15, d.speed * .42);
        d.shake = .45;
        spawnSparks(d, (d.x + o.x) / 2, d.y - 10, 14);
        state.stats.crashes += 1;
        audio.sfx(o.type === 'gabagool' ? 'splash' : 'crash');
        if (o.type === 'traffic' || o.type === 'nycar') o.spin = .8;
        if (d.health <= 0) {
          d.health = 3;
          d.progress = Math.max(0, d.progress - 8);
          d.speed = .2;
        }
      }
    }
  }
  // particles
  for (const p of d.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (!p.smoke) p.vy += 120 * dt;
  }
  d.particles = d.particles.filter((p) => p.t < p.life);
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
    { speaker: 'narrator', text: 'Tony shoulders through the door into a familiar-looking sitcom apartment.', action: () => { audio.sfx('door'); moveActor(state.player, 300, 160, 150, () => moveActor(state.player, 130, 320, 150, () => moveActor(state.player, 296, 372, 150))); } },
    { speaker: 'tony', text: 'There you are.', action: () => { state.player.dir = 'left'; } },
    { speaker: 'jerry', text: 'George? Why is a large man jogging into my apartment?', action: () => { const j = state.npcs.jerryApt; if (j) { j.pose = 'stand'; moveActor(j, 222, 250, 90); } } },
    { speaker: 'narrator', text: 'George emerges from the kitchen holding a spoon and the expression of a man already negotiating.', action: () => moveActor(state.npcs.georgeApt, 300, 162, 64) },
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
    list.push({ x: 430, y: 250, w: 90, h: 50, radius: 46, label: 'Arm-wrestle the bouncer', action: () => {
      if ((state.flags.tribute || 0) < 25) {
        startDialog([{ speaker: 'narrator', text: 'Slippery Pete cracks knuckles the size of ham hocks. Twenty-five dollar entry, champ. You are short.' }]);
        return;
      }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Slippery Pete, house bouncer, arm-wrestling champion of the Route 22 corridor. George sits down across from him. The table creaks in fear.' },
        { speaker: 'george', text: 'I have VERY strong wrists. Decades of aggressive mouse use. And I carry spite in the forearms!' }
      ] : [
        { speaker: 'narrator', text: 'Slippery Pete cracks his neck. The crowd goes quiet. This is a man who once beat a horse at something.' },
        { speaker: 'tony', text: 'Twenty-five bucks says you go home cryin to your wife. Lets dance, big guy.' }
      ], () => { state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 25); initArmWrestle(); });
    } });
    list.push({ x: 520, y: 250, w: 80, h: 50, radius: 46, label: 'Blackjack table', action: () => {
      if ((state.flags.tribute || 0) < 50) {
        startDialog([{ speaker: 'narrator', text: 'The dealer doesn’t even look up. "Fifty minimum." The felt has seen men cry for less.' }]);
        return;
      }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A blackjack table in the back room. George has a SYSTEM. The system is: never hit on twelve. Or always hit on twelve. He’s written it down wrong.' },
        { speaker: 'george', text: 'Fifty dollars. But statistically, over time, the player edge with my system is… I’m going to lose this fifty dollars.' }
      ] : [
        { speaker: 'narrator', text: 'The back room blackjack table. Tony’s game. Tony’s room. Tony’s everything, technically, through a shell company.' },
        { speaker: 'tony', text: 'Deal. And remember — I know where the cards LIVE.' }
      ], () => initBlackjack());
    } });
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
    { x: 288, y: 200, w: 120, h: 100, radius: 22, label: 'The booth', action: () => {
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
    { x: 90, y: 320, w: 60, h: 60, radius: 40, label: 'Trash éclair', action: () => {
      if (state.player.kind !== 'george') {
        startDialog([{ speaker: 'tony', text: 'There’s a perfectly good éclair sitting on top of that trash can. And I mean ON TOP. Like it’s on a little pedestal of garbage.' }]);
      } else if (!state.flags.trashEclair) {
        state.flags.trashEclair = true;
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
        spawnEffect(state.player.x, state.player.y - 16, 'SHAME +1', '#ff8e8e');
        moveActor(state.player, 110, 330, 60);
        startDialog([
          { speaker: 'narrator', text: 'George spots the éclair. It is ON TOP of the trash. Technically not IN the trash. Important distinction.' },
          { speaker: 'george', text: 'It’s adjacent to refuse! Adjacency is not contact! I’m eating it.' },
          { speaker: 'jerry', text: 'You know I saw you eat that out of the garbage, right? There was a witness. There are always witnesses.' },
          { speaker: 'george', text: 'The chocolate wasn’t even smudged! Do you understand how rare that is?!' }
        ]);
      } else startDialog([{ speaker: 'george', text: 'No more trash pastries. I have a system now. I look for smudging.' }]);
    } },
    { x: 300, y: 236, w: 40, h: 40, radius: 40, label: 'Chip bowl', action: () => {
      if (state.player.kind !== 'george') {
        startDialog([{ speaker: 'jerry', text: 'Careful with that dip, Tony. There are rules. Unwritten, inviolable rules.' }]);
      } else startDialog([
        { speaker: 'george', text: 'You dip the chip, you take a bite, you dip again. That’s how chips work.' },
        { speaker: 'jerry', text: 'You can’t double-dip, George! It’s like putting your whole mouth in the dip!' },
        { speaker: 'elaine', text: 'Honestly? He’s got a point about the structural integrity of the second bite.' },
        { speaker: 'george', text: 'FINALLY! Science vindicates me!' }
      ]);
    } },
    { x: 460, y: 320, w: 80, h: 60, radius: 42, label: 'Payphone', action: () => {
      if (state.player.kind !== 'george') {
        startDialog([{ speaker: 'tony', text: 'A payphone. In a café. Next thing you’ll tell me there’s a horse in the hospital.' }]);
      } else if (!state.flags.marineBiologist) {
        state.flags.marineBiologist = true;
        audio.sfx('phone');
        startDialog([
          { speaker: 'narrator', text: 'George picks up the payphone and immediately begins lying to a woman about being a marine biologist.' },
          { speaker: 'george', text: 'Yes — a MARINE BIOLOGIST. I just got back from saving a whale! There was a hole in it. Somebody threw a golf ball into it! NOT ME.' },
          { speaker: 'jerry', text: 'The sea was angry that day, George. Like an old man trying to send back soup at a deli.' },
          { speaker: 'george', text: 'THE TITLEIST, JERRY! IT WAS ONE IN A MILLION!' }
        ]);
      } else startDialog([{ speaker: 'george', text: 'The lie is self-sustaining now. I get whale updates. I own a wetsuit.' }]);
    } },
    { x: 40, y: 130, w: 50, h: 50, radius: 38, label: 'Jukebox', action: () => {
      if (!state.flags.elaineDance) {
        state.flags.elaineDance = true;
        audio.sfx('success');
        startDialog([
          { speaker: 'narrator', text: 'The jukebox fires up. Elaine rises. What follows is technically dancing — a series of little kicks and thumb-pointing that defies several laws of rhythm.' },
          { speaker: 'elaine', text: 'What?! This is how I dance! This is dancing! I’m a great dancer!' },
          { speaker: 'jerry', text: 'It’s like a bee is attacking her feet and she’s politely fighting back.' },
          { speaker: 'george', text: 'I’ve seen worse. I’ve BEEN worse.' }
        ]);
      } else startDialog([{ speaker: 'elaine', text: 'The little kicks stay in the vault. You get one miracle per day.' }]);
    } },
    { x: 560, y: 130, w: 70, h: 60, radius: 40, label: 'Stationery box', action: () => {
      if (state.player.kind !== 'george') {
        startDialog([{ speaker: 'tony', text: 'Wedding invitations printed on paper so thin you can read ‘em through a closed envelope. Who cheap out on invitations?' }]);
      } else if (!state.flags.cheapInvites) {
        state.flags.cheapInvites = true;
        spawnEffect(state.player.x, state.player.y - 16, 'TOO CHEAP', '#ff8e8e');
        startDialog([
          { speaker: 'narrator', text: 'The invitations are indeed cheap. The glue is older than some of the guests. One envelope appears to be already sealed shut forever.' },
          { speaker: 'george', text: 'They’re priced to move, Jerry! Susan won’t even notice. What’s the worst that could happen with envelope glue?' },
          { speaker: 'jerry', text: 'George, historically speaking, you do NOT want to answer that question.' }
        ]);
      } else startDialog([{ speaker: 'george', text: 'I’m buying the next box one tier up. Lesson learned. No further questions.' }]);
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
    { x: 570, y: 330, w: 60, h: 80, radius: 42, label: 'Leave', action: leaveOutside }
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
    { x: 400, y: 356, w: 110, h: 50, radius: 44, label: 'Leave', action: leaveOutside }
  ];
}

function drawYankees() {
  if (drawSceneArt(sceneArt.yankees, 640, 416)) {
    // Steinbrenner paces in front of the big desk, trembling with fury
    const pace = Math.sin(state.time * .7);
    const sx2 = 322 + pace * 70;
    const shake = Math.sin(state.time * 13) * 1.2;
    drawPerson(ctx, sx2 + shake, 165, 'junior', pace > 0 ? 'right' : 'left', state.frame * 1.8, { pose: 'angry' });
    // steam of rage
    if (Math.sin(state.time * 2) > .6) {
      px(ctx, sx2 - 5, 150, 3, 6, 'rgba(255,120,90,.5)');
      px(ctx, sx2 + 9, 150, 3, 6, 'rgba(255,120,90,.5)');
    }
    // George sleeping under his desk when scheme active
    if (state.flags.deskNap) {
      px(ctx, 100, 372, 34, 10, '#3a2c1e');
      px(ctx, 104, 368, 12, 8, '#d19a73');
      outlineText(ctx, 'z z z', 118, 348 + Math.sin(state.time * 2) * 3, '#bcd8ff', 8, 'center');
    }
    return;
  }
  px(ctx, 0, 0, 640, 416, '#1c2a52');
  outlineText(ctx, 'YANKEES', 320, 200, '#fff', 16, 'center');
}

const steinbrennerRants = [
  'Costanza! The mustard! I specifically ordered the spicy brown! This is yellow! YELLOW!',
  'In my day, ballplayers ate dirt and thanked the diamond for the privilege!',
  'I want the stadium hot dogs elongated! Not longer — elongated! There’s a difference!',
  'Who authorized these expenditures?! Costanza, was it you? It has your stink on it!',
  'The cotton candy vendor looked at me funny. Fire him. Fire his family too!'
];

function yankeesInteractions() {
  return [
    { x: 250, y: 140, w: 150, h: 56, radius: 46, label: 'Steinbrenner', action: () => {
      const rant = steinbrennerRants[Math.floor(Math.random() * steinbrennerRants.length)];
      if (state.player.kind === 'george') startDialog([
        { speaker: 'steinbrenner', text: rant },
        { speaker: 'george', text: 'Sir, I — yes. Immediately. I was just about to elongate the mustard myself.' },
        { speaker: 'narrator', text: 'George backs away in the exact rhythm of a man who has never once done what he was asked.' }
      ]);
      else startDialog([
        { speaker: 'steinbrenner', text: 'Who are you?! You look like you intimidate people for a living!' },
        { speaker: 'tony', text: 'I’m in waste management. Same thing, different paperwork.' },
        { speaker: 'steinbrenner', text: 'HA! I like this guy! Costanza, why can’t you be more like waste management?' }
      ]);
    } },
    { x: 60, y: 300, w: 120, h: 80, radius: 44, label: 'George’s desk', action: () => {
      if (state.player.kind !== 'george') {
        startDialog([{ speaker: 'tony', text: 'There’s a pillow under this desk. A pillow. In an office. The youth today.' }]);
      } else if (!state.flags.deskNap) {
        state.flags.deskNap = true;
        state.flags.heat = Math.max(0, (state.flags.heat || 0) - 1);
        spawnEffect(state.player.x, state.player.y - 16, 'NAP MODE', '#bcd8ff');
        startDialog([
          { speaker: 'narrator', text: 'George slides under the desk into his custom nap nook. It has a pillow, a blanket, and a small framed photo of a sandwich.' },
          { speaker: 'george', text: 'This is not sleeping. This is horizontal productivity.' },
          { speaker: 'steinbrenner', text: 'COSTANZA! ...Huh. Where is he? Must be working hard somewhere.' }
        ]);
      } else {
        state.flags.deskNap = false;
        startDialog([{ speaker: 'george', text: 'Rested. Recharged. Ready to do approximately nothing for the rest of the day.' }]);
      }
    } },
    { x: 420, y: 300, w: 100, h: 80, radius: 44, label: 'Supply closet', action: () => {
      if (state.player.kind !== 'george') {
        startDialog([{ speaker: 'tony', text: 'A cane, a neck brace, and a pair of crutches. Either somebody here is fragile, or somebody here is George.' }]);
      } else if (!state.flags.fakeDisability) {
        state.flags.fakeDisability = true;
        state.flags.heat = Math.max(0, (state.flags.heat || 0) - 1);
        spawnEffect(state.player.x, state.player.y - 16, 'SYMPATHY +10', '#bcd8ff');
        startDialog([
          { speaker: 'narrator', text: 'George equips the cane. He immediately walks 30% slower and sighs 90% louder.' },
          { speaker: 'george', text: 'With this cane, I am unemployable AND unfireable. Checkmate, Steinbrenner.' },
          { speaker: 'steinbrenner', text: 'Costanza! You’re limping! Take the week off! Paid! That’s the kind of organization I run!' }
        ]);
      } else startDialog([{ speaker: 'george', text: 'The cane stays in the closet. Sympathy is a finite resource. You don’t waste it on a Tuesday.' }]);
    } },
    { x: 545, y: 100, w: 80, h: 120, radius: 42, label: 'Trophies', action: () => startDialog(
      state.player.kind === 'george' ? [
        { speaker: 'george', text: 'I told Susan I designed these. The trophies. She believed me for eleven minutes.' }
      ] : [
        { speaker: 'tony', text: 'Gold trophies in a case. Reminds me — I gotta collect something from a guy who collects things.' }
      ]) },
    { x: 560, y: 350, w: 70, h: 60, radius: 42, label: 'Leave', action: leaveOutside }
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

const SCHEME_FLAGS = ['humanFund','marbleRye','trashEclair','deskNap','soupLesson','fakeDisability','cheapInvites','fedGeese','pawnedWatch','elaineDance','therapyDone','marineBiologist','festivus','serenityNow','packageHeist','derekPaid','latexExport','oilBladder'];

function schemeCount() {
  return SCHEME_FLAGS.filter((k) => state.flags[k]).length;
}

function grabStash(key) {
  state.flags[key] = true;
  state.flags.derekCash = (state.flags.derekCash || 0) + 50;
  audio.sfx('cash');
  const left = ['cashStash1','cashStash2','cashStash3'].filter((k) => !state.flags[k]).length;
  startDialog([
    { speaker: 'narrator', text: `+50 bucks for the Junior defense fund. ($${state.flags.derekCash}/150)` },
    { speaker: 'tony', text: left ? 'Every little bit. Derek better appreciate this.' : 'That’s the hundred fifty. Time to pay the lawyer before Junior discovers guac.' }
  ]);
  if (!left) objective('Bring the cash to Derek at the gas station');
}

function leaveOutside() {
  const r = state.returnTo;
  if (r && r.scene !== state.scene && scenes[r.scene]) {
    setScene(r.scene, r.x, r.y);
    state.mode = 'explore';
  } else travelHub('hub');
}

function travelHub(place) {
  // remember which outdoor region we came from so interior exits return correctly
  if ((state.scene === 'hub' || state.scene === 'nyc') && place !== 'hub' && place !== 'nyc') {
    state.returnTo = null;
    const bx = Math.max(20, state.player.x);
    const by = state.player.y;
    for (const [ox, oy] of [[0, 26], [0, -26], [26, 0], [-26, 0], [0, 44], [0, -44]]) {
      const cx = bx + ox, cy = Math.max(20, Math.min(400, by + oy));
      if (!blockedAt(cx, cy) && !blockedAt(cx, cy + 14)) { state.returnTo = { scene: state.scene, x: cx, y: cy }; break; }
    }
  }
  // revisit surprises: the world remembers what you've been up to
  if (!state.flags.sandbox && schemeCount() >= 5 && !state.flags.surpriseShown && place === 'apartment') {
    state.flags.pendingSurprise = true;
  }
  const destinations = {
    house: ['house', 250, 306, 'Back to the house. The geese have been busy.'],
    satriale: ['satriale', 318, 354, 'Satriale’s smells like cured meat and unresolved grudges.'],
    rome: ['rome', 430, 330, 'The marble arch hums with imperial nonsense.'],
    club: ['club', 320, 330, 'The Bing is quiet again — suspiciously quiet.'],
    apartment: ['apartment', 498, 150, 'The purple door is somehow still unlocked.'],
    bodega: ['bodega', 60, 350, 'The bodega smells like coffee, lottery dreams, and cat.'],
    vesuvio: ['vesuvio', 320, 360, 'Vesuvio smells like garlic, woodsmoke, and Artie’s bad judgment.'],
    monks: ['monks', 590, 370, 'Monk’s Café. Coffee, big salads, and petty grievances.'],
    soup: ['soup', 450, 370, 'The soup stand. The rules are the rules.'],
    yankees: ['yankees', 590, 380, 'The Yankees front office. Somewhere, a typewriter is being yelled at.'],
    melfi: ['melfi', 320, 380, 'Dr. Melfi’s office. It smells like leather, tissues, and carefully withheld judgment.'],
    costanza: ['costanza', 320, 380, 'The Costanza house. You can hear the shouting from the driveway.'],
    hub: ['hub', 320, 240, 'Back out in the neighborhood.']
  };
  const d = destinations[place];
  if (!d) return;
  state.interactCooldown = .9;
  setScene(d[0], d[1], d[2]);
  state.mode = 'explore';
  objective('Explore — return to the neighborhood when ready');
  startDialog([{ speaker: 'narrator', text: d[3] }]);
}

function hubInteractions() {
  const list = [
    { x: 116, y: 128, w: 82, h: 46, label: 'Tony’s house', action: () => travelHub('house') },
    { x: 474, y: 126, w: 102, h: 50, label: 'Satriale’s', action: () => travelHub('satriale') },
    { x: 38, y: 284, w: 104, h: 66, label: 'Roman arch', action: () => travelHub('rome') },
    { x: 500, y: 386, w: 108, h: 22, radius: 44, label: 'Bada Bing', action: () => travelHub('club') },
    { x: 176, y: 248, w: 84, h: 56, label: 'Vesuvio', action: () => travelHub('vesuvio') },
    { x: 600, y: 388, w: 90, h: 26, radius: 50, label: 'Pine Barrens ↓', action: () => {
      audio.sfx('honk');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'South on the parkway, past where the trees stop being decorative and start being evidence.' },
        { speaker: 'george', text: 'Why are we going to the Pine Barrens? Nothing good happens in the Pine Barrens! I’ve seen exactly one documentary about this!' }
      ] : [
        { speaker: 'narrator', text: 'The parkway south. The pines close in. Tony drives quieter the deeper it gets. Everybody does. That’s the Barrens.' },
        { speaker: 'tony', text: 'Beautiful country. Very peaceful. Don’t ask me why I know that.' }
      ], () => startTransit('pines', 300, 240, 'GARDEN STATE PARKWAY · SOUTH'));
    } },
    { x: 1236, y: 210, w: 44, h: 90, radius: 52, label: 'NYC →', action: () => {
      audio.sfx('honk');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George takes the tunnel. He gripes about the toll the entire way through.' },
        { speaker: 'george', text: 'Eighteen dollars! For a hole in a river! I could SWIM for free!' }
      ] : [
        { speaker: 'narrator', text: 'Tony points the car east. Manhattan. More people to owe him money per square mile than anywhere on earth.' },
        { speaker: 'tony', text: 'The city. Love it. Hate the parking.' }
      ], () => startTransit('nyc', 40, 250, null));
    } },
    { x: 196, y: 250, w: 64, h: 44, radius: 46, label: 'Misdelivered package', action: () => {
      if (!state.flags.packageHeist) {
        state.flags.packageHeist = true;
        state.flags.tribute = (state.flags.tribute || 0) + 30;
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
        audio.sfx('cash');
        const nm = (ambientFor('hub') || []).find((x) => x.npc === 'newman');
        if (nm) { nm.bark = 'MY PACKAGE! THAT’S FEDERAL PROPERTY!'; nm.barkT = 3; }
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'George swipes a misdelivered package off the stoop. Inside: cassette tapes of wind sounds. $30 of pure profit, somehow.' },
          { speaker: 'george', text: 'It was misdelivered! Legally that’s a gray area! A very comfortable gray area!' },
          { speaker: 'jerry', text: 'You just robbed a federal mail carrier of whale noises, George. Congratulations. NEWMAN’S going to hear about this. From himself.' }
        ] : [
          { speaker: 'narrator', text: 'Tony palms the package. Wind-sound cassettes. The fencing guys pay $30 for anything in a box, don’t ask.' },
          { speaker: 'tony', text: 'Federal property my ass. It was sittin’ there. That’s not theft, that’s yard sales with extra steps.' }
        ]);
      } else startDialog([{ speaker: 'narrator', text: 'No more packages today. Newman counts them twice now.' }]);
    } },
    { x: 1160, y: 110, w: 80, h: 40, radius: 44, label: 'Melfi’s office', action: () => travelHub('melfi') },
    { x: 856, y: 300, w: 64, h: 56, radius: 52, label: 'Costanza house', action: () => travelHub('costanza') },
    { x: 100, y: 150, w: 60, h: 40, radius: 42, label: 'Loose envelope', hidden: () => !state.flags.derekMission || state.flags.cashStash1, action: () => grabStash('cashStash1') },
    { x: 700, y: 250, w: 60, h: 44, radius: 42, label: 'Dropped wallet', hidden: () => !state.flags.derekMission || state.flags.cashStash2, action: () => grabStash('cashStash2') },
    { x: 960, y: 210, w: 64, h: 44, radius: 42, label: 'Unattended tip jar', hidden: () => !state.flags.derekMission || state.flags.cashStash3, action: () => grabStash('cashStash3') },
    { x: 950, y: 130, w: 70, h: 50, radius: 46, label: 'Derek (your lawyer)', hidden: () => !state.flags.derekMission || state.flags.derekPaid, action: () => {
      const got = (state.flags.derekCash || 0) >= 150;
      if (!got) {
        startDialog([
          { speaker: 'derek', text: `You’ve got $${state.flags.derekCash || 0}. I said a hundred fifty, Tony. Junior’s currently asking the Chipotle line cook if he wears a wire.` },
          { speaker: 'tony', text: 'I’m workin’ on it. Cash doesn’t grow on trees — it grows in envelopes, tip jars, and the occasional dropped wallet.' }
        ]);
      } else {
        state.flags.derekPaid = true;
        state.flags.tribute = (state.flags.tribute || 0) + 75;
        audio.sfx('cash');
        startDialog([
          { speaker: 'narrator', text: 'Tony peels off the cash. Derek counts it twice, folds it into his jacket like it never existed.' },
          { speaker: 'derek', text: 'And this is why you’re my favorite client, Tony. Quick, quiet, no questions. Now if you’ll excuse me, I have a burrito-based arson threat to defuse.' },
          { speaker: 'tony', text: 'Tell Junior the feds don’t serve carnitas. He’ll lose interest.' },
          { speaker: 'derek', text: '…That’s actually not bad. Hey — you didn’t get this money anywhere weird, right? Don’t answer that. Don’t EVER answer that.' }
        ]);
      }
    } },
    { x: 960, y: 110, w: 100, h: 40, radius: 44, label: 'Moltisanti Motors', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'george', text: 'A gas station with no attendant. Self-serve. Like life, Jerry. Self-serve.' },
        { speaker: 'jerry', text: 'You don’t own a car, George. You’ve never pumped gas in your life.' },
        { speaker: 'george', text: 'I’ve been emotionally pumping gas for years!' }
      ]);
      else startDialog([
        { speaker: 'tony', text: 'Christopher’s cousin runs this place. Skims the register. I allow it. Family discount.' },
        { speaker: 'narrator', text: 'The pumps are old but the coffee inside is somehow older.' }
      ]);
    } },
    { x: 1158, y: 250, w: 80, h: 46, radius: 48, label: 'Pawn shop', action: () => {
      if ((state.flags.tribute || 0) >= 100 && !state.flags.pawnedWatch) {
        state.flags.pawnedWatch = true;
        state.flags.tribute += 150;
        spawnEffect(state.player.x, state.player.y - 16, '+$150 FENCED', '#9be59b');
        audio.sfx('pickup');
        startDialog([
          { speaker: 'tony', text: 'That watch? Fell off a truck. Then fell onto my wrist. Now it’s falling into your display case. Circle of life.' },
          { speaker: 'narrator', text: 'The pawnbroker doesn’t ask questions. Questions are bad for business in this neighborhood.' }
        ]);
      } else startDialog(state.player.kind === 'george' ? [
        { speaker: 'george', text: 'I once pawned a gift. Susan never found out. Well — she found out. But not immediately!' }
      ] : [
        { speaker: 'tony', text: 'Bring tribute over a hundred bucks and maybe we talk business. Otherwise it’s just VCRs and regret in there.' }
      ]);
    } },
    { x: 1036, y: 120, w: 60, h: 40, radius: 40, label: 'Steal coupe', action: () => {
      if (state.player.inCar) return;
      state.player.inCar = true;
      state.player.speed = 200;
      state.player.carColor = '#31445e';
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1.5);
      audio.sfx('door');
      audio.sfx('honk');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'GRAND THEFT AUTO', '#ff9a7a');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'george', text: 'Grand theft auto. GRAND. THEFT. I’m in a gang now. I have a gang nickname. They call me… Slippin’ Jimmy. No wait, that’s taken.' }
      ] : [
        { speaker: 'tony', text: 'Christopher’s cousin leaves the keys in every car. He’s either stupid or very generous. Either way — mine now.' }
      ]);
    } },
    { x: 1060, y: 300, w: 80, h: 50, radius: 52, label: 'Chase the loose goose', hidden: () => !!state.flags.gooseCaught, action: () => {
      startDialog([
        { speaker: 'narrator', text: 'A park ranger flags you down, out of breath. A goose has escaped the petting enclosure. It is, quote, “the mean one.” $60 reward. He hands you a pair of very small gloves.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Sixty dollars for a goose? What’s the goose’s side of this arrangement, economically? …Fine. I’m in. I was BORN for poultry pursuit!' : 'Sixty bucks to grab a bird. In my day the birds grabbed YOU. Times change. I’m in.' }
      ], () => initGooseChase());
    } },
    { x: 990, y: 250, w: 100, h: 40, radius: 58, label: 'Gabagool Park', action: () => {
      if (!state.flags.fedGeese) {
        state.flags.fedGeese = true;
        spawnEffect(state.player.x, state.player.y - 16, 'HONK HONK', '#fff1a6');
        audio.sfx('turkey');
        startDialog([
          { speaker: 'narrator', text: 'The geese accept the offering. This is a mistake. There are now forty percent more geese than a minute ago.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why do they keep looking at me like that? I’m not bread! I’M NOT BREAD!' : 'I’m not feeding these things. Last time they unionized.' }
        ]);
      } else startDialog([{ speaker: 'narrator', text: 'The geese remember you. Geese never forget. That’s not a comforting trait in a goose.' }]);
    } },
    { x: 400, y: 300, w: 90, h: 40, radius: 40, label: 'Borrow car', action: () => {
      if (state.player.inCar) return;
      state.player.inCar = true;
      state.player.speed = 190;
      state.player.carColor = '#3d6b35';
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
    } },
    { x: 530, y: 200, w: 60, h: 56, radius: 44, label: 'Newman', action: () => {
      if (state.player.kind === 'george') startDialog([
        { speaker: 'newman', text: 'Heh heh heh… Georgie boy. Out for a little walk? Careful — the mail never sleeps.' },
        { speaker: 'george', text: 'Newman! I know you’re the one writing COSTANZA on my packages! It stops TODAY!' },
        { speaker: 'newman', text: 'Oh, it never stops, George. Neither rain nor sleet nor your tiny little outrage.' }
      ]);
      else startDialog([
        { speaker: 'newman', text: 'A fellow patriot of the mail? I think not. I smell… garbage business. Hee hee.' },
        { speaker: 'tony', text: 'Waste management. And keep smiling like that — see what happens to your mail route.' },
        { speaker: 'newman', text: 'Noted. Filed. Catalogued. The mail remembers everything.' }
      ]);
    } }
  ];
  return list;
}

function drawCostanza() {
  const img = sceneArt.costanza;
  if (img.complete && img.naturalWidth) ctx.drawImage(img, 8, 8, 624, 400);
  const frankX = 150, estX = 520;
  drawPerson(ctx, frankX, 172, 'steinbrenner', 'right', state.frame * .5, { pose: 'sit' });
  if (!state.flags.serenityNow) outlineText(ctx, 'SERENITY NOW!', frankX + 30, 118, '#ff9a7a', 8, 'center');
  drawPerson(ctx, estX, 190, 'womanB', 'left', state.frame * .5, {});
  if (!state.flags.serenityNow) outlineText(ctx, 'Frank, stop yelling!', estX - 24, 148, '#e8e2d0', 7, 'center');
  // festivus pole in the corner
  px(ctx, 66, 150, 5, 120, '#c9ccd6');
  px(ctx, 60, 268, 18, 5, '#8a8f9c');
  outlineText(ctx, 'FESTIVUS POLE', 68, 140, '#9fd4ec', 6, 'center');
  outlineText(ctx, 'Frank', frankX, 205, '#ffb16a', 7, 'center');
  outlineText(ctx, 'Estelle', estX, 225, '#e8e2d0', 7, 'center');
}


function drawMelfiOffice() {
  const img = sceneArt.melfi;
  if (img && img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, 640, 416);
  else px(ctx, 0, 0, 640, 416, '#4a3a2c');
  // dr. melfi in her chair, sometimes jotting notes
  const jot = Math.sin(state.time * .8) > .6;
  // dr. melfi stands by her chair, jotting notes between patients
  const sway = Math.sin(state.time * .7) * 3;
  drawPerson(ctx, 470 + sway, 244, 'melfi', 'left', state.frame * .5, {});
  if (jot) outlineText(ctx, '✎ hmm…', 478 + sway, 218, '#e8e2d0', 7, 'center');
}

function melfiInteractions() {
  const list = [];
  list.push({ x: 170, y: 200, w: 120, h: 90, radius: 40, label: 'Your chair', action: () => {
    if (state.player.kind === 'george') {
      startDialog([
        { speaker: 'melfi', text: 'I’m sorry — you want ME to analyze YOU? I specialize in anxiety, not… whatever constellation this is.' },
        { speaker: 'george', text: 'It’s all one session! Tony and I are practically the same patient. Ask anything. Lie about a firing? Check. Yell at children? Check.' },
        { speaker: 'melfi', text: '…I’m going to need a bigger notebook.' }
      ]);
    } else if (!state.flags.therapyDone) {
      state.flags.therapyDone = true;
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - 2);
      spawnEffect(state.player.x, state.player.y - 16, 'INNER PEACE', '#bcd8ff');
      startDialog([
        { speaker: 'narrator', text: 'Tony sits. The chair knows things about him that the FBI never will.' },
        { speaker: 'melfi', text: 'You mentioned stress. A neighborhood brawler. A stolen coupe. Several geese. Let’s unpack the geese first.' },
        { speaker: 'tony', text: 'The geese know what they did. Anyway — I feel better already. This talkin’ thing works.' },
        { speaker: 'melfi', text: 'That was fourteen seconds. The copay is still two hundred.' }
      ]);
    } else startDialog([{ speaker: 'melfi', text: 'Same time next week, Tony. And please stop shoving pedestrians — we talked about this.' }]);
  } });
  list.push({ x: 300, y: 8, w: 200, h: 110, radius: 40, label: 'Diplomas', action: () => startDialog([
    { speaker: 'narrator', text: 'Degrees in psychiatry, psychoanalysis, and — framed identically, suspiciously — a certificate for a rye bread of the month club.' }
  ]) });
  list.push({ x: 560, y: 150, w: 72, h: 190, radius: 42, label: 'Chaise', action: () => {
    if (state.player.kind === 'george') startDialog([
      { speaker: 'george', text: 'A recliner you can nap on during a session you’re paying for? Finally — a healthcare model that works.' }
    ]);
    else startDialog([{ speaker: 'tony', text: 'I don’t lie down. Guys in my position lie down once, they don’t get up.' }]);
  } });
  return list;
}

function drawHubEast() {
  // illustrated east neighborhood backdrop (art spans scene x 640-1280)
  const img = sceneArt.hubeast;
  if (img && img.complete && img.naturalWidth) {
    ctx.drawImage(img, 640, 8, 632, 400);
  } else {
    px(ctx, 640, 8, 640, 408, '#3d5a34');
  }
  // baked-art-aware overlay details
  // geese animated around the pond
  for (let i = 0; i < 3; i++) {
    const gx = 1040 + i * 30 + Math.sin(state.time * 1.2 + i * 2) * 8;
    const gy = 330 + (i % 2) * 12;
    px(ctx, gx, gy, 10, 4, '#f4f0dc');
    px(ctx, gx + 7, gy - 3, 3, 5, '#f4f0dc');
    px(ctx, gx + 10, gy - 2, 2, 1, '#e58d2a');
  }
  outlineText(ctx, 'GABAGOOL PARK', 1100, 396, '#eaf4d8', 7, 'center');
  outlineText(ctx, 'MOLTISANTI MOTORS', 1010, 60, '#ffe1b0', 7, 'center');
  outlineText(ctx, 'COSTANZA CT', 745, 52, '#ffe1b0', 7, 'center');
  // parked stealable coupe at the gas station
  if (!state.player.inCar) drawCar(1058, 132, '#7e2733');
  outlineText(ctx, '← WEST SIDE', 656, 220, '#ffe78a', 7, 'left');
}

function initGooseChase() {
  state.goosechase = {
    gx: 320, gy: 200, gvx: 0, gvy: 0,
    px: 320, py: 340,
    t: 0, duration: 25, done: false, resultT: 0, won: false, panic: 0
  };
  state.mode = 'goosechase';
  audio.sfx('turkey');
}

function updateGooseChase(dt) {
  const g = state.goosechase;
  if (!g) { state.mode = 'explore'; return; }
  if (g.done) {
    g.resultT += dt;
    if (g.resultT > 2.2) {
      const won = g.won;
      state.mode = 'explore';
      state.goosechase = null;
      if (won) {
        state.flags.tribute = (state.flags.tribute || 0) + 60;
        state.flags.gooseCaught = true;
        audio.sfx('cash');
        spawnEffect(state.player.x + 8, state.player.y - 8, '+$60 · GOOSE CAUGHT', '#8ffff2');
        startDialog([
          { speaker: 'narrator', text: 'CAUGHT! The goose is returned to the grateful park ranger, who pays a small reward and asks no questions about the wrenches.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I caught a goose! With my HANDS! Nobody can ever take this away from me!' : 'Tell the ranger the goose is lucky I respect wildlife. Also tell him the goose started it.' }
        ]);
      } else {
        startDialog([
          { speaker: 'narrator', text: 'Time. The goose stands at the far end of the park, breathing evenly, making direct eye contact. It knows.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'It CHEATED! It used the pond! Waterfowl home advantage!' : 'I got respect for that goose. I also got a hat full of nothin’. We’re done here.' }
        ]);
      }
    }
    return;
  }
  g.t += dt;
  // player control
  const inp = moveInput();
  const spd = 130;
  if (inp.x || inp.y) {
    g.px = Math.max(40, Math.min(600, g.px + inp.x * spd * dt));
    g.py = Math.max(90, Math.min(360, g.py + inp.y * spd * dt));
  }
  // goose flees the player, panics harder when close; slight random wobble
  const dx = g.gx - g.px, dy = g.gy - g.py;
  const d = Math.hypot(dx, dy) || 1;
  const fear = d < 130 ? (130 - d) / 130 : 0;
  g.panic = Math.max(g.panic - dt, fear > 0 ? .8 : 0);
  const fleeSpd = fear > 0 ? (90 + fear * 95) : 26;
  if (fear > 0) {
    g.gvx = (dx / d) * fleeSpd + Math.sin(state.time * 5) * 30;
    g.gvy = (dy / d) * fleeSpd + Math.cos(state.time * 4.3) * 26;
  } else {
    g.gvx = Math.sin(state.time * .9) * 26;
    g.gvy = Math.cos(state.time * .7) * 20;
  }
  g.gx = Math.max(40, Math.min(600, g.gx + g.gvx * dt));
  g.gy = Math.max(90, Math.min(360, g.gy + g.gvy * dt));
  if (d < 22) {
    g.done = true;
    g.won = true;
    audio.sfx('success');
    audio.sfx('turkey');
  }
  if (g.t >= g.duration) { g.done = true; g.won = false; audio.sfx('denied'); }
}

function drawGoose(gx, gy, panic) {
  const flap = panic > 0 ? Math.sin(state.time * 24) * 3 : 0;
  px(ctx, gx - 7, gy - 2 + flap, 5, 4, '#f4f0dc');
  px(ctx, gx + 2, gy - 2 - flap, 5, 4, '#f4f0dc');
  px(ctx, gx - 4, gy, 9, 6, '#fffbe8');
  px(ctx, gx + 3, gy - 5, 3, 5, '#fffbe8');
  px(ctx, gx + 4, gy - 6, 2, 2, '#222');
  px(ctx, gx + 6, gy - 4, 3, 2, '#e8a020');
  px(ctx, gx - 2, gy + 6, 2, 3, '#e8a020');
  px(ctx, gx + 1, gy + 6, 2, 3, '#e8a020');
}

function drawGooseChase() {
  const g = state.goosechase;
  px(ctx, 0, 0, 640, 416, '#3d6b35');
  // park detail
  for (let i = 0; i < 30; i++) px(ctx, (i * 97) % 640, 80 + (i * 61) % 300, 3, 2, '#2e5428');
  ctx.fillStyle = '#4a7a40';
  ctx.beginPath();
  ctx.ellipse(320, 420, 380, 100, 0, 0, Math.PI * 2);
  ctx.fill();
  // pond corner
  ctx.fillStyle = '#3a6a8f';
  ctx.beginPath();
  ctx.ellipse(590, 100, 80, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  outlineText(ctx, 'GABAGOOL PARK · CATCH THE GOOSE', 320, 40, '#ffe78a', 11, 'center');
  if (!g) return;
  if (!g.done) outlineText(ctx, `${Math.max(0, g.duration - g.t).toFixed(1)}s`, 320, 62, '#fffbe8', 10, 'center');
  drawGoose(g.gx, g.gy, g.panic);
  if (g.panic > .2 && Math.floor(state.time * 4) % 2 === 0) outlineText(ctx, 'HONK!', g.gx + 10, g.gy - 12, '#ffe78a', 6, 'left');
  drawPerson(ctx, g.px, g.py, state.player.kind === 'george' ? 'george' : 'tonyMax', state.time % .8 < .4 ? 'down' : 'up', state.frame * 2, {});
  if (!g.done) {
    outlineText(ctx, 'arrows to run — touch the goose to catch it', 320, 390, '#e8e2d0', 8, 'center');
  } else {
    outlineText(ctx, g.won ? 'CAUGHT! +$60' : 'THE GOOSE ENDURES.', 320, 390, g.won ? '#8ffff2' : '#ff8a7a', 10, 'center');
  }
}

function initBlackjack() {
  const deck = () => Math.min(10, 1 + Math.floor(Math.random() * 13));
  const card = () => { const v = deck(); return v === 1 ? 11 : v; };
  state.blackjack = {
    player: [card(), card()], dealer: [card(), card()],
    phase: 'player', result: null, t: 0, bet: 50
  };
  state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 50);
  state.mode = 'blackjack';
  audio.sfx('pickup');
}

function bjTotal(hand) {
  let t = hand.reduce((a, b) => a + b, 0);
  let aces = hand.filter((v) => v === 11).length;
  while (t > 21 && aces > 0) { t -= 10; aces -= 1; }
  return t;
}

function bjCard() { const v = Math.min(10, 1 + Math.floor(Math.random() * 13)); return v === 1 ? 11 : v; }

function updateBlackjack(dt) {
  const bj = state.blackjack;
  if (!bj) { state.mode = 'explore'; return; }
  bj.t += dt;
  if (bj.phase === 'player') {
    const hint = bjTotal(bj.player) >= 17 ? 'stand?' : 'hit?';
    const inp = { x: axis.x, y: axis.y }; // touch stick only — keyboard must not feed gesture detection
    // dominant-axis only, and the stick must return to neutral between gestures
    const hitDir = inp.x < -.6 && Math.abs(inp.x) > Math.abs(inp.y) * 1.3;
    const standDir = (inp.x > .6 && Math.abs(inp.x) > Math.abs(inp.y) * 1.3) || (inp.y > .6 && inp.y > Math.abs(inp.x) * 1.3);
    if (!bj.stickLock && (consume(['ArrowLeft', 'KeyA', 'KeyH']) || interactPressed() || hitDir)) {
      bj.stickLock = true;
      bj.player.push(bjCard());
      audio.sfx('pickup');
      if (bjTotal(bj.player) > 21) { bj.phase = 'done'; bj.result = 'bust'; bj.t = 0; audio.sfx('denied'); }
    } else if (!bj.stickLock && (consume(['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS']) || standDir)) {
      bj.stickLock = true;
      bj.phase = 'dealer';
      bj.t = 0;
    }
    if (!hitDir && !standDir) bj.stickLock = false;
  } else if (bj.phase === 'dealer') {
    if (bj.t > .7) {
      bj.t = 0;
      if (bjTotal(bj.dealer) < 17) { bj.dealer.push(bjCard()); audio.sfx('pickup'); }
      else {
        const pt = bjTotal(bj.player), dt2 = bjTotal(bj.dealer);
        bj.result = dt2 > 21 || pt > dt2 ? 'win' : pt === dt2 ? 'push' : 'lose';
        bj.phase = 'done';
        audio.sfx(bj.result === 'win' ? 'success' : bj.result === 'push' ? 'pickup' : 'denied');
      }
    }
  } else if (bj.phase === 'done' && bj.t > 1.8) {
    const r = bj.result;
    state.mode = 'explore';
    state.blackjack = null;
    if (r === 'win') {
      state.flags.tribute = (state.flags.tribute || 0) + 100;
      audio.sfx('cash');
      spawnEffect(state.player.x + 8, state.player.y - 8, '+$100 · BLACKJACK PAYS', '#8ffff2');
      startDialog([
        { speaker: 'narrator', text: state.player.kind === 'george' ? 'George wins! He immediately asks the dealer about the surrender rule, the insurance rule, and whether tips are mandatory.' : 'Tony wins. The dealer slides the chips over. He has been instructed, at length, to be very fast about it.' }
      ]);
    } else if (r === 'push') {
      state.flags.tribute = (state.flags.tribute || 0) + 50;
      startDialog([{ speaker: 'narrator', text: 'Push. Nobody wins. Somehow the least satisfying outcome in all of gambling.' }]);
    } else {
      startDialog([
        { speaker: 'narrator', text: r === 'bust' ? 'Bust. The dealer collects without looking up, the way they do.' : 'Dealer wins. The felt absorbs your fifty dollars like it was never there.' }
      ]);
    }
  }
}

function bjDrawHand(hand, x, y, hideFirst) {
  for (let i = 0; i < hand.length; i++) {
    const cx = x + i * 34;
    const hidden = hideFirst && i === 0;
    px(ctx, cx - 14, y - 20, 28, 40, hidden ? '#2a4a8f' : '#f4efdc');
    px(ctx, cx - 11, y - 17, 22, 34, hidden ? '#3a5a9f' : '#fffbe8');
    if (!hidden) {
      const v = hand[i];
      outlineText(ctx, v === 11 ? 'A' : String(v), cx, y + 5, v === 11 ? '#c02828' : '#222', 12, 'center');
    }
  }
}

function drawBlackjack() {
  px(ctx, 0, 0, 640, 416, '#0d2818');
  outlineText(ctx, 'BLACKJACK · THE BING BACK ROOM', 320, 46, '#ffe78a', 11, 'center');
  const bj = state.blackjack;
  if (!bj) return;
  // felt table
  ctx.fillStyle = '#1a4a2e';
  ctx.beginPath();
  ctx.ellipse(320, 240, 260, 130, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8a040';
  ctx.lineWidth = 3;
  ctx.stroke();
  const hideDealer = bj.phase === 'player';
  bjDrawHand(bj.dealer, 290, 150, hideDealer);
  outlineText(ctx, 'DEALER' + (hideDealer ? '' : ` · ${bjTotal(bj.dealer)}`), 320, 112, '#fffbe8', 8, 'center');
  bjDrawHand(bj.player, 290, 300, false);
  outlineText(ctx, `YOU · ${bjTotal(bj.player)}`, 320, 344, '#fffbe8', 8, 'center');
  if (bj.phase === 'player') {
    outlineText(ctx, 'A / E = HIT · D / S = STAND', 320, 386, '#ffe78a', 9, 'center');
  } else if (bj.phase === 'done') {
    const msg = { win: 'YOU WIN! +$100', bust: 'BUST — HOUSE TAKES IT', lose: 'DEALER WINS', push: 'PUSH — BET RETURNED' }[bj.result];
    outlineText(ctx, msg, 320, 386, bj.result === 'win' ? '#8ffff2' : bj.result === 'push' ? '#ffe78a' : '#ff8a7a', 10, 'center');
  } else {
    outlineText(ctx, 'dealer plays…', 320, 386, '#9d8fc9', 8, 'center');
  }
}

function startTransit(destScene, x, y, flavor) {
  state.transit = { dest: destScene, x, y, t: 0, dur: 3.6, flavor };
  state.mode = 'transit';
  state.dialog = null;
  audio.sfx('door');
}

function updateTransit(dt) {
  const tr = state.transit;
  if (!tr) { state.mode = 'explore'; return; }
  tr.t += dt;
  if (tr.t >= tr.dur) {
    setScene(tr.dest, tr.x, tr.y);
    state.mode = 'explore';
    state.transit = null;
    objective(tr.dest === 'nyc' ? 'Manhattan — Seinfeld country' : 'North Caldwell — free roam');
  }
}

function drawTransit() {
  const tr = state.transit;
  px(ctx, 0, 0, 640, 416, '#060608');
  if (!tr) return;
  const speed = 1 + Math.sin(tr.t * 2) * .1;
  // tunnel walls with perspective
  ctx.fillStyle = '#141210';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(240, 140); ctx.lineTo(240, 300); ctx.lineTo(0, 416); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(640, 0); ctx.lineTo(400, 140); ctx.lineTo(400, 300); ctx.lineTo(640, 416); ctx.closePath();
  ctx.fill();
  // road
  ctx.fillStyle = '#232028';
  ctx.beginPath();
  ctx.moveTo(240, 140); ctx.lineTo(400, 140); ctx.lineTo(520, 416); ctx.lineTo(120, 416); ctx.closePath();
  ctx.fill();
  // moving lane dashes + tunnel lights streaking past
  for (let i = 0; i < 6; i++) {
    const k = ((tr.t * 2.2 * speed + i / 6) % 1);
    const y = 140 + k * 276;
    const w = 3 + k * 10;
    const laneX = 320 - (k * 60);
    px(ctx, 320 - w / 2, y, w, 8 + k * 22, '#8a8358');
    px(ctx, laneX - w / 2, y, w * .6, 6 + k * 16, '#5a5548');
    px(ctx, 640 - laneX - w / 2, y, w * .6, 6 + k * 16, '#5a5548');
  }
  // overhead tunnel lights
  for (let i = 0; i < 4; i++) {
    const k = ((tr.t * 1.6 * speed + i / 4) % 1);
    const y = 60 + k * 100;
    const spread = 20 + k * 200;
    ctx.fillStyle = `rgba(255,220,140,${.1 + k * .3})`;
    ctx.fillRect(320 - spread, y, spread * 2, 2 + k * 3);
  }
  // the car, centered, slight weave
  const weave = Math.sin(tr.t * 3.2) * 6;
  drawCar(320 + weave, 330, state.player.carColor || '#8f1f2e', false, 0);
  // progress flavor
  const heads = { nyc: ['HOLLAND TUNNEL → MANHATTAN', 'MANHATTAN · UPPER WEST SIDE'], hub: ['HOLLAND TUNNEL → NEW JERSEY', 'NORTH CALDWELL · NEW JERSEY'], pines: ['GARDEN STATE PARKWAY · SOUTH', 'THE PINE BARRENS'] };
  const hh = heads[tr.dest] || heads.hub;
  if (tr.t < 1.4) outlineText(ctx, hh[0], 320, 96, '#ffe78a', 10, 'center');
  else if (tr.t > tr.dur - 1.2) outlineText(ctx, hh[1], 320, 96, '#8ffff2', 11, 'center');
  if (tr.flavor && tr.t > 1.4 && tr.t <= tr.dur - 1.2) outlineText(ctx, tr.flavor, 320, 96, '#9d8fc9', 8, 'center');
}

function drawBodega() {
  if (!drawSceneArt(sceneArt.bodega, 640, 416)) px(ctx, 0, 0, 640, 416, '#4a3a28');
  // the cat shifts position slightly, as cats do
  const cx = 480 + Math.sin(state.time * .3) * 4;
  px(ctx, cx, 60, 14, 8, '#3a3430');
  px(ctx, cx + 11, 57, 5, 5, '#3a3430');
  px(ctx, cx + 12, 56, 1, 1, '#e8b822');
  px(ctx, cx + 14, 56, 1, 1, '#e8b822');
  if (Math.floor(state.time * 2) % 4 === 0) px(ctx, cx + 2, 68, 10, 2, '#3a3430'); // tail twitch
  outlineText(ctx, 'Exit', 24, 380, '#ffe78a', 7, 'left');
}

function bodegaInteractions() {
  return [
    { x: 4, y: 330, w: 60, h: 76, radius: 42, label: 'Leave', action: leaveOutside },
    { x: 258, y: 8, w: 124, h: 90, radius: 52, label: 'Deli counter', action: () => {
      if (!state.flags.gotCoffee) {
        state.flags.gotCoffee = true;
        state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 2);
        audio.sfx('pickup');
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'Bodega coffee, $2, hot enough to strip paint. George adds six sugars and calls it breakfast.' },
          { speaker: 'george', text: 'This is the best coffee in Manhattan. Don’t tell Monk’s I said that. Don’t tell anyone anything I say, ever.' }
        ] : [
          { speaker: 'narrator', text: 'Bodega coffee. Tony judges it against a lifetime of espresso and finds it… acceptable. Barely. It’s hot.' },
          { speaker: 'tony', text: 'Two bucks. In Jersey this is a dollar. In Manhattan it’s two. That’s the whole economy in one cup.' }
        ]);
      } else startDialog([{ speaker: 'narrator', text: 'More coffee? Your heart says yes. Your other organs are holding a vote.' }]);
    } },
    { x: 460, y: 40, w: 80, h: 60, radius: 44, label: 'Pet the cat', action: () => {
      audio.sfx('turkey');
      startDialog([
        { speaker: 'narrator', text: 'The bodega cat allows exactly two pets, then bites the air near your hand as a warning. Standard bodega cat contract.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I respect a cat with boundaries. I have NO boundaries and look how that’s working out!' : 'This cat’s got more authority than most of my captains.' }
      ]);
    } },
    { x: 390, y: 100, w: 120, h: 40, radius: 44, label: 'Scratch ticket', action: () => {
      const cd = 30;
      if ((state.flags.scratchT || 0) + cd > Date.now() / 1000) {
        startDialog([{ speaker: 'narrator', text: 'The clerk shakes his head. One ticket per customer per… while. He doesn’t make the rules. He absolutely makes the rules.' }]);
        return;
      }
      if ((state.flags.tribute || 0) < 5) {
        startDialog([{ speaker: 'narrator', text: 'Scratch tickets are $5. You have less than $5. The lottery is not for you today.' }]);
        return;
      }
      state.flags.scratchT = Date.now() / 1000;
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 5);
      audio.sfx('pickup');
      const roll = Math.random();
      if (roll < .12) {
        state.flags.tribute = (state.flags.tribute || 0) + 100;
        audio.sfx('success');
        audio.sfx('cash');
        spawnEffect(state.player.x + 8, state.player.y - 8, 'JACKPOT! +$100', '#8ffff2');
        startDialog([
          { speaker: 'narrator', text: 'A HUNDRED DOLLARS! The clerk is genuinely happy for you. He’s never seen this happen. Nobody has.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I WON! I NEVER WIN! This changes EVERYTHING! …It’s a hundred dollars. It changes nothing! BUT STILL!' : 'Heh. Reminds me of the numbers game, except legal and worse odds. I’ll take it.' }
        ]);
      } else if (roll < .35) {
        state.flags.tribute = (state.flags.tribute || 0) + 10;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'Ten dollars. You doubled your money. You are now up $5 on the transaction and down nothing on the dream.' }]);
      } else {
        startDialog([
          { speaker: 'narrator', text: 'Nothing. Three shiny little nothing symbols. The ticket goes in the gutter outside, where it joins its family.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'RIGGED! The whole lottery is a tax on people who are bad at math! …I’ll take another.' : 'Shoulda bought the cannoli instead.' }
        ]);
      }
    } }
  ];
}

function drawPines() {
  if (!drawSceneArt(sceneArt.pines, 768, 416)) px(ctx, 0, 0, 768, 416, '#2a3324');
  // drifting mist
  for (let i = 0; i < 4; i++) {
    const mx = ((state.time * (6 + i * 3) + i * 200) % 900) - 60;
    ctx.globalAlpha = .1 + Math.sin(state.time * .5 + i) * .04;
    ctx.fillStyle = '#c8d4c8';
    ctx.beginPath();
    ctx.ellipse(mx, 240 + i * 40, 120, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // frost sparkle
  if (Math.random() < .3) {
    const fx = 200 + Math.random() * 360, fy = 180 + Math.random() * 180;
    px(ctx, fx, fy, 1, 1, '#e8f4ff');
  }
  outlineText(ctx, '← BACK TO CIVILIZATION', 8, 400, '#ffe78a', 7, 'left');
  if (!state.flags.russianFound) outlineText(ctx, 'fresh footprints in the frost…', 420, 190, '#9ab8c8', 6, 'center');
}

function pinesInteractions() {
  return [
    { x: 4, y: 270, w: 30, h: 100, radius: 48, label: '← Drive back north', action: () => {
      audio.sfx('honk');
      startDialog([{ speaker: 'narrator', text: 'The pines shrink in the mirror. Whatever happened back there stays back there. That’s the rule of the Barrens.' }], () => startTransit('hub', 640, 380, null));
    } },
    { x: 400, y: 160, w: 130, h: 90, radius: 52, label: 'Follow the footprints', hidden: () => !!state.flags.russianFound, action: () => {
      state.flags.russianFound = true;
      audio.sfx('turkey');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Footprints in the frost. They lead in a circle. A perfect, deranged circle. George follows them for twenty minutes and ends up exactly here.' },
        { speaker: 'george', text: 'He’s OUT there! A Russian! He killed sixteen Czechoslovakians! Or he WAS sixteen Czechoslovakians — the story keeps changing!' },
        { speaker: 'narrator', text: 'A branch cracks somewhere deep in the pines. George leaves. George leaves very quickly. +$40 in loose change abandoned along the footprints.' }
      ] : [
        { speaker: 'narrator', text: 'The footprints loop, double back, and vanish at a tree. The tree is just a tree. Probably. Tony looks up into it for a long time.' },
        { speaker: 'tony', text: 'Guy was an interior decorator. Killed sixteen Czechoslovakians. You’re not gonna believe this — his house looked like shit.' },
        { speaker: 'narrator', text: 'Something moves in the deep pines. Or nothing does. The Barrens don’t say. Tony finds $40 in shell casings and loose change along the trail.' }
      ], () => {
        state.flags.tribute = (state.flags.tribute || 0) + 40;
        spawnEffect(state.player.x + 8, state.player.y - 8, '+$40 · THE BARRENS PROVIDE', '#8ffff2');
        audio.sfx('cash');
      });
    } },
    { x: 250, y: 190, w: 200, h: 130, radius: 40, label: 'Paulie', hidden: () => !!state.flags.pinesTalkedPaulie, action: () => {
      state.flags.pinesTalkedPaulie = true;
      startDialog([
        { speaker: 'paulie', text: 'What are YOU doing here? …Actually, don’t answer that. We’re both not here. That’s the beauty of the Barrens — nobody’s ever here.' },
        { speaker: 'paulie', text: 'Christopher lost his shoes. Don’t ask. It’s a whole thing. We’re looking for the van. The van is… somewhere. Trees all look the same out here. THAT’S the problem with nature.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m just hiking! People hike! Hiking is a thing people do voluntarily!' : 'Paulie. You didn’t see me, I didn’t see you, the trees saw nothing. Standard arrangement.' }
      ]);
    } },
    { x: 300, y: 220, w: 220, h: 120, radius: 40, label: 'Christopher', hidden: () => !!state.flags.pinesTalkedChris, action: () => {
      state.flags.pinesTalkedChris = true;
      startDialog([
        { speaker: 'christopher', text: 'Yo. You didn’t happen to see a van? Or a shoe? Or a Russian? …Forget I asked. All three of those questions are rhetorical.' },
        { speaker: 'christopher', text: 'It’s beautiful out here though, right? Very serene. I’m thinking of writing a screenplay about it. “A guy loses a shoe in the woods.” It writes itself!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'That’s a terrible premise. No offense. Actually — what if the shoe is a metaphor?' : 'Stick to hurricanes, Christopher. And get your shoes. It’s November.' }
      ]);
    } },
    { x: 560, y: 200, w: 90, h: 50, radius: 46, label: 'Rusty abandoned car', action: () => {
      if (!state.flags.pinesCarLooted) {
        state.flags.pinesCarLooted = true;
        state.flags.tribute = (state.flags.tribute || 0) + 25;
        audio.sfx('door');
        audio.sfx('cash');
        startDialog([
          { speaker: 'narrator', text: 'An abandoned sedan, vines through the windows. Glovebox: $25, a cassette of Romanian folk music, and a parking ticket from 1986.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Finders keepers! That’s the LAW. Maritime law! …We’re nowhere near water, but still!' : 'Romanian folk. Guy had taste. Shame about whatever happened to him. Which I know nothing about.' }
        ]);
      } else startDialog([{ speaker: 'narrator', text: 'Nothing left but rust and Romanian folk. The cassette is starting to grow on you, honestly.' }]);
    } },
    { x: 220, y: 290, w: 120, h: 80, radius: 54, label: 'Frozen pond', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The pond is frozen solid-ish. George tests it with one foot. The ice makes a sound like a threat.' },
        { speaker: 'george', text: 'I’m not falling through ice in SOUTH JERSEY. That’s not how I go. I go in a way that embarrasses my family, not one that confuses them!' }
      ] : [
        { speaker: 'narrator', text: 'Frozen pond. Still. The kind of still that makes a man think about things. Tony thinks about things for exactly four seconds, then stops.' },
        { speaker: 'tony', text: 'Nice spot. Very undisturbed. Let’s keep it that way.' }
      ]);
    } }
  ];
}

function initArmWrestle() {
  state.armwrestle = { power: .5, t: 0, duration: 8, done: false, resultT: 0, won: false };
  state.mode = 'armwrestle';
  audio.sfx('confirm');
}

function updateArmWrestle(dt) {
  const a = state.armwrestle;
  if (!a) { state.mode = 'explore'; return; }
  if (a.done) {
    a.resultT += dt;
    if (a.resultT > 2.2) {
      const won = a.won;
      state.mode = 'explore';
      state.armwrestle = null;
      if (won) {
        state.flags.tribute = (state.flags.tribute || 0) + 75;
        audio.sfx('cash');
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'GEORGE WINS! The Bing erupts! Somewhere, a single tear rolls down a bouncer’s cheek.' },
          { speaker: 'george', text: 'FIFTY YEARS of repressed rage, all in the wrist! I could arm-wrestle GOD right now!' }
        ] : [
          { speaker: 'narrator', text: 'Tony slams the bouncer’s hand through the table. Literally through it. The table is two tables now.' },
          { speaker: 'tony', text: 'Tell Paulie he owes me seventy-five bucks. Also tell him he owes me a new table, but he already knew that.' }
        ]);
      } else {
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'The bouncer barely moved. George’s hand hit the table with the sound of a damp sock.' },
          { speaker: 'george', text: 'My hand slipped! There was lotion! WHO HAS LOTION in a strip club?!' }
        ] : [
          { speaker: 'narrator', text: 'The bouncer wins. Tony nods once. This has never happened before and will be discussed never.' },
          { speaker: 'tony', text: 'Good arm, kid. You got a future. Not HERE, because I control this place, but somewhere. Canada, maybe.' }
        ]);
      }
    }
    return;
  }
  a.t += dt;
  if (consume(['KeyE', 'Space'])) a.power = Math.min(1, a.power + .055);
  if (a.power >= 1) { a.done = true; a.won = true; audio.sfx('success'); return; } // slamming the meter wins instantly
  a.power -= dt * (.09 + a.t * .008);
  if (a.power <= 0) { a.power = 0; a.done = true; a.won = false; audio.sfx('denied'); }
  if (a.t >= a.duration) { a.done = true; a.won = a.power >= .62; audio.sfx(a.won ? 'success' : 'denied'); }
}

function drawArmWrestle() {
  px(ctx, 0, 0, 640, 416, '#171019');
  outlineText(ctx, 'ARM WRESTLING · THE BING', 320, 56, '#ffe78a', 12, 'center');
  const a = state.armwrestle;
  if (!a) return;
  px(ctx, 220, 200, 200, 16, '#6b4f2a');
  px(ctx, 220, 216, 200, 8, '#4a3520');
  drawPerson(ctx, 250, 185, state.player.kind === 'george' ? 'george' : 'tonyMax', 'right', state.frame * .5, {});
  drawPerson(ctx, 390, 185, 'silvio', 'left', state.frame * .5, {});
  const hx = 320 + (a.power - .5) * 90;
  px(ctx, hx - 8, 176, 16, 14, '#d5a075');
  px(ctx, hx - 8, 176, 16, 14, '#c08a60');
  px(ctx, 120, 290, 400, 22, '#1a1020');
  px(ctx, 122, 292, 396 * a.power, 18, a.power > .62 ? '#4a8f3d' : a.power > .38 ? '#e8b822' : '#c02828');
  outlineText(ctx, 'YOU', 112, 304, '#8ffff2', 7, 'right');
  outlineText(ctx, 'SLIPPERY PETE', 528, 304, '#ff8a7a', 7, 'left');
  if (!a.done) {
    outlineText(ctx, 'MASH E TO WIN', 320, 340, '#ffe78a', 10, 'center');
    outlineText(ctx, `${Math.max(0, a.duration - a.t).toFixed(1)}`, 320, 258, '#fffbe8', 10, 'center');
  } else {
    outlineText(ctx, a.won ? 'YOU WIN! +$75' : 'CRUSHED. NO PAYOUT.', 320, 340, a.won ? '#8ffff2' : '#ff8a7a', 10, 'center');
  }
}

function initMonte() {
  state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 50);
  state.monte = {
    phase: 'show', t: 0,
    queen: Math.floor(Math.random() * 3),
    pos: [0, 1, 2], // card index -> slot
    px: [0, 1, 2].map((s) => 200 + s * 120), // animated pixel x per card
    sel: 1, swaps: 0, swapT: 0, reveal: -1,
    won: false, selEdge: 0
  };
  state.mode = 'monte';
  audio.sfx('pickup');
}

function monteCardX(slot) { return 200 + slot * 120; }

function updateMonte(dt) {
  const m = state.monte;
  if (!m) { state.mode = 'explore'; return; }
  m.t += dt;
  // cards glide toward their slot positions — the shuffle is watchable
  for (let c = 0; c < 3; c++) {
    const target = monteCardX(m.pos[c]);
    m.px[c] += (target - m.px[c]) * Math.min(1, dt * 14);
  }
  if (m.phase === 'show' && m.t > 1.6) {
    m.phase = 'shuffle';
    m.t = 0;
    m.swapT = 0;
  } else if (m.phase === 'shuffle') {
    m.swapT += dt;
    if (m.swapT > .42) {
      m.swapT = 0;
      m.swaps += 1;
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      if (b === a) b = (a + 1) % 3;
      const ia = m.pos.indexOf(a), ib = m.pos.indexOf(b);
      m.pos[ia] = b; m.pos[ib] = a;
      audio.sfx('pickup');
    }
    if (m.swaps >= 7 && m.px.every((x, c) => Math.abs(x - monteCardX(m.pos[c])) < 4)) { m.phase = 'pick'; m.t = 0; }
  } else if (m.phase === 'pick') {
    const inp = moveInput();
    if (consume(['ArrowLeft', 'KeyA']) || (inp.x < -.5 && m.selEdge <= 0)) { m.sel = Math.max(0, m.sel - 1); m.selEdge = .25; audio.sfx('pickup'); }
    if (consume(['ArrowRight', 'KeyD']) || (inp.x > .5 && m.selEdge <= 0)) { m.sel = Math.min(2, m.sel + 1); m.selEdge = .25; audio.sfx('pickup'); }
    if (m.selEdge > 0) m.selEdge -= dt;
    if (interactPressed()) {
      m.reveal = m.sel;
      m.won = m.pos[m.queen] === m.sel;
      m.phase = 'reveal';
      m.t = 0;
      audio.sfx(m.won ? 'success' : 'denied');
    }
  } else if (m.phase === 'reveal' && m.t > 2) {
    const won = m.won;
    state.mode = 'explore';
    state.monte = null;
    if (won) {
      state.flags.tribute = (state.flags.tribute || 0) + 150;
      spawnEffect(state.player.x + 8, state.player.y - 8, '+$150 · WINNER!', '#8ffff2');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George finds the queen! The hustler pays out with the dead-eyed smile of a man reconsidering his career.', action: () => audio.sfx('cash') },
        { speaker: 'george', text: 'I BEAT THE STREET! I am OF the street! I could do this for a living!' },
        { speaker: 'narrator', text: 'He could not do this for a living. The first win is always free. That’s how they get you.' }
      ] : [
        { speaker: 'narrator', text: 'Tony’s eyes never left the queen. The hustler hands over the cash with respect.', action: () => audio.sfx('cash') },
        { speaker: 'tony', text: 'I ran card games before you were a gleam in some degenerate’s eye. Double or nothing? …Nah. I’m here for the soup.' }
      ]);
    } else {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Wrong card. The hustler pockets George’s fifty before the disappointment even lands.' },
        { speaker: 'george', text: 'IT SWITCHED! I SAW it switch! This is rigged! There’s a plant! There’s ALWAYS a plant!' }
      ] : [
        { speaker: 'narrator', text: 'Wrong card. Tony watches his fifty disappear into a front pocket.' },
        { speaker: 'tony', text: 'Cute. It’s a good scam. I know because I invented it in 1979 and they stole it from ME.' }
      ]);
    }
  }
}

function drawMonte() {
  px(ctx, 0, 0, 640, 416, '#1c1710');
  px(ctx, 0, 200, 640, 216, '#2c2419');
  outlineText(ctx, 'THREE-CARD MONTE', 320, 60, '#ffe78a', 12, 'center');
  const m = state.monte;
  if (!m) return;
  drawPerson(ctx, 320, 130, 'christopher', 'down', state.frame * .3, {});
  px(ctx, 150, 210, 340, 90, '#6b4f2a');
  px(ctx, 150, 210, 340, 8, '#8a6a3a');
  for (let card = 0; card < 3; card++) {
    const slot = m.pos[card];
    let cx = m.px[card];
    const cy = 235;
    const isQueen = card === m.queen;
    // reveal flips the card sitting in the SLOT the player picked — not the card index
    const inPickedSlot = slot === m.reveal;
    const faceUp = (m.phase === 'show' && isQueen) || (m.phase === 'reveal' && inPickedSlot) || (m.phase === 'reveal' && m.t > 1 && isQueen);
    px(ctx, cx - 28, cy - 38, 56, 76, faceUp ? '#f4efdc' : '#2a4a8f');
    px(ctx, cx - 24, cy - 34, 48, 68, faceUp ? '#fffbe8' : '#3a5a9f');
    if (faceUp && isQueen) {
      outlineText(ctx, 'Q', cx, cy + 8, '#c02828', 26, 'center');
    } else if (faceUp) {
      outlineText(ctx, 'J', cx, cy + 8, '#333', 26, 'center');
    } else {
      px(ctx, cx - 16, cy - 26, 32, 52, '#24407e');
    }
    if (m.phase === 'pick' && m.sel === slot) {
      const pulse = .5 + Math.sin(state.time * 8) * .3;
      ctx.strokeStyle = `rgba(255,231,138,${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 32, cy - 42, 64, 84);
    }
  }
  if (m.phase === 'show') outlineText(ctx, 'Follow the QUEEN…', 320, 350, '#fffbe8', 9, 'center');
  if (m.phase === 'shuffle') outlineText(ctx, 'Eyes on the cards…', 320, 350, '#fffbe8', 9, 'center');
  if (m.phase === 'pick') outlineText(ctx, '← → choose · E to pick — $50 on the line', 320, 350, '#ffe78a', 9, 'center');
  if (m.phase === 'reveal') outlineText(ctx, m.won ? 'THE QUEEN! YOU WIN $150' : 'NOT THE QUEEN. THE HOUSE THANKS YOU.', 320, 350, m.won ? '#8ffff2' : '#ff8a7a', 9, 'center');
}

function drawNyc() {
  if (!drawSceneArt(sceneArt.nyc, 768, 416)) {
    px(ctx, 0, 0, 768, 416, '#5a4a3a');
  }
  // persistent reactive taxis — they brake and honk at jaywalkers
  if (!state.nycCars) updateNycTaxis(0);
  for (const c of (state.nycCars || [])) {
    const tx = c.x, cy = c.y;
    px(ctx, tx - 2, cy - 2, 34, 15, 'rgba(0,0,0,.3)');
    px(ctx, tx, cy, 30, 11, '#c9a015');
    px(ctx, tx + 2, cy + 1, 26, 9, '#e8b822');
    px(ctx, tx + 7, cy + 2, 14, 7, '#9fd4ec');
    px(ctx, tx + 12, cy - 2, 6, 3, '#fff3b0');
    px(ctx, tx + 3, cy + 10, 5, 3, '#05070c');
    px(ctx, tx + 22, cy + 10, 5, 3, '#05070c');
    if (c.brakeT > 0) { px(ctx, tx + (c.dir > 0 ? -3 : 28), cy + 3, 3, 4, '#ff3b2e'); px(ctx, tx + (c.dir > 0 ? -3 : 28), cy + 7, 3, 3, '#ff3b2e'); }
    if (c.honkT > .4) outlineText(ctx, 'HONK!', tx + 15, cy - 8, '#ffe78a', 6, 'center');
  }
  // parked stealable taxi
  if (!state.player.inCar) {
    px(ctx, 380, 356, 30, 11, '#c9a015');
    px(ctx, 382, 357, 26, 9, '#e8b822');
    px(ctx, 387, 358, 14, 7, '#9fd4ec');
    px(ctx, 392, 354, 6, 3, '#fff3b0');
    px(ctx, 383, 365, 5, 3, '#05070c');
    px(ctx, 402, 365, 5, 3, '#05070c');
  }
  // pigeon flock that scatters when the player plows through
  if (!state.pigeons) {
    state.pigeons = [];
    for (let i = 0; i < 6; i++) state.pigeons.push({ hx: 260 + (i % 3) * 18, hy: 340 + Math.floor(i / 3) * 14, x: 260 + (i % 3) * 18, y: 340 + Math.floor(i / 3) * 14, fly: 0, seed: i * 1.7 });
  }
  for (const pg of state.pigeons) {
    const dist = Math.hypot(state.player.x - pg.x, state.player.y - pg.y);
    if (dist < 26 && pg.fly <= 0) { pg.fly = 1.4 + Math.random() * .5; pg.vx = (pg.x - state.player.x || 1) * 3; pg.vy = -60 - Math.random() * 40; if (Math.random() < .3) audio.sfx('thud'); }
    if (pg.fly > 0) {
      pg.fly -= 1 / 60;
      pg.x += pg.vx / 60;
      pg.y += pg.vy / 60;
      pg.vy += 3;
      if (pg.fly <= 0) { pg.hx = Math.max(60, Math.min(720, pg.x)); pg.hy = Math.max(300, Math.min(390, pg.y)); }
    } else {
      pg.x += (pg.hx - pg.x) * .02 + Math.sin(state.time * 2 + pg.seed) * .3;
      pg.y += (pg.hy - pg.y) * .02;
    }
    const flap = Math.sin(state.time * 18 + pg.seed) > 0 ? -1 : 0;
    px(ctx, pg.x - 3, pg.y - 2 + flap, 2, 2, '#8a8a92');
    px(ctx, pg.x + 1, pg.y - 2 + flap, 2, 2, '#8a8a92');
    px(ctx, pg.x - 1, pg.y, 3, 3, '#a8a8b0');
    px(ctx, pg.x + 1, pg.y - 1, 1, 1, '#d8d8e0');
  }
  // steam curling from the manhole
  const steamX = 420, steamY = 306;
  for (let s = 0; s < 3; s++) {
    const st = (state.time * 1.2 + s * .5) % 1.5;
    ctx.globalAlpha = Math.max(0, .5 - st * .35);
    ctx.fillStyle = '#d8d8d0';
    ctx.beginPath();
    ctx.arc(steamX + Math.sin(st * 4 + s) * 6, steamY - st * 30, 3 + st * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  outlineText(ctx, 'MONK’S', 125, 218, '#fff1a6', 7, 'center');
  outlineText(ctx, 'SOUP', 435, 210, '#fff1a6', 7, 'center');
  outlineText(ctx, 'JERRY’S', 650, 210, '#fff1a6', 7, 'center');
  outlineText(ctx, 'SUBWAY', 18, 196, '#8ffff2', 6, 'center');
  outlineText(ctx, '← NJ TURNPIKE', 6, 300, '#ffe78a', 7, 'left');
}

function nycInteractions() {
  return [
    { x: 100, y: 200, w: 52, h: 44, radius: 42, label: 'Monk’s Café', action: () => travelHub('monks') },
    { x: 410, y: 196, w: 52, h: 40, radius: 42, label: 'Soup stand', action: () => travelHub('soup') },
    { x: 624, y: 200, w: 52, h: 44, radius: 42, label: 'Jerry’s apartment', action: () => travelHub('apartment') },
    { x: 4, y: 200, w: 28, h: 52, radius: 40, label: 'Subway to Yankees', action: () => {
      audio.sfx('honk');
      startDialog([
        { speaker: 'narrator', text: 'The 1 train wheezes uptown. Someone is performing magic tricks for no one.' }
      ], () => travelHub('yankees'));
    } },
    { x: 540, y: 196, w: 46, h: 40, radius: 40, label: 'Bodega', action: () => travelHub('bodega') },
    { x: 500, y: 200, w: 58, h: 34, radius: 40, label: 'Newsstand', action: () => {
      if (!state.flags.boughtPaper) {
        state.flags.boughtPaper = true;
        state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 2);
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'George buys a paper. Headline: LOCAL MAN’S CHARITY REVEALED AS INDEX CARD. He buys every copy.' },
          { speaker: 'george', text: 'Damage control. Standard damage control.' }
        ] : [
          { speaker: 'narrator', text: 'Tony buys a paper. He reads the horses, then the horoscope Carmela likes, then nothing else.' },
          { speaker: 'tony', text: 'Two dollars for bad news. At least the bagels here are honest.' }
        ]);
        audio.sfx('pickup');
      } else startDialog([{ speaker: 'narrator', text: 'Same headlines. Somehow worse the second time.' }]);
    } },
    { x: 600, y: 290, w: 90, h: 46, radius: 44, label: 'Payphone', hidden: () => !!state.flags.latexExport, action: () => {
      if (state.player.kind === 'george') {
        startDialog([
          { speaker: 'narrator', text: 'A payphone rings. Nobody answers payphones. George answers the payphone.', action: () => audio.sfx('ring') },
          { speaker: 'george', text: 'Vandelay Industries, import-export. Latex. Yes, we HAVE the latex. Tell the buyers the latex is en route!' },
          { speaker: 'jerry', text: 'George, you are screaming into a payphone on 81st street about latex that does not exist.' },
          { speaker: 'george', text: 'Perception IS inventory, Jerry! Word of this gets out, we move UNITS!' },
          { speaker: 'narrator', text: 'A confused tourist hands George $40 to stop shouting. Vandelay Industries has its first revenue.' }
        ], () => {
          state.flags.latexExport = true;
          state.flags.tribute = (state.flags.tribute || 0) + 40;
          spawnEffect(state.player.x + 8, state.player.y - 8, 'SCHEME +1 · +$40', '#ffe78a');
          audio.sfx('success');
          objective('Scheme complete: Vandelay latex export');
        });
      } else {
        startDialog([
          { speaker: 'narrator', text: 'A payphone rings. Tony picks it up out of pure instinct. It’s a wrong number asking about latex.' },
          { speaker: 'tony', text: 'Latex? Yeah, we got latex. Cash only, pick up at Satriale’s, tell NOBODY.' },
          { speaker: 'narrator', text: 'There is no latex. But somebody is now driving to a pork store with $40. That’s business.' }
        ], () => {
          state.flags.latexExport = true;
          state.flags.tribute = (state.flags.tribute || 0) + 40;
          spawnEffect(state.player.x + 8, state.player.y - 8, 'SCHEME +1 · +$40', '#ffe78a');
          audio.sfx('success');
          objective('Scheme complete: the latex that never existed');
        });
      }
    } },
    { x: 560, y: 236, w: 150, h: 36, radius: 40, label: 'Kramer', hidden: () => !!state.flags.oilBladder, action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'kramer', text: 'George! Perfect timing. Kramerica Industries is THIS close to cracking the oil bladder. Ships full of oil, George, floating on giant rubber bladders!' },
        { speaker: 'george', text: 'And you need what, exactly?' },
        { speaker: 'kramer', text: 'Venture capital. Sixty bucks. In return — I name a bladder after you. THE COSTANZA. Imagine it sailing into harbor!' },
        { speaker: 'narrator', text: 'George hands over $60. Somewhere, a rubber bladder with his name on it does not exist.', action: () => audio.sfx('cash') }
      ] : [
        { speaker: 'kramer', text: 'Tone! Tony Soprano in the flesh! Kramerica Industries — ever hear of it? Oil bladders, my friend. The future of maritime petroleum transport!' },
        { speaker: 'tony', text: 'The future of what now? …Alright, here’s sixty. But this is an INVESTMENT. Weekly points. Friday.' },
        { speaker: 'kramer', text: 'Friday! Absolutely! Totally doable! …What’s today?', action: () => audio.sfx('cash') },
        { speaker: 'narrator', text: 'Tony invests $60 in a man he just met. It is somehow still not his worst business decision this year.' }
      ], () => {
        state.flags.oilBladder = true;
        state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 60);
        spawnEffect(state.player.x + 8, state.player.y - 8, 'SCHEME +1 · KRAMERICA', '#ffe78a');
        audio.sfx('success');
        objective('Scheme complete: Kramerica oil bladder');
      });
    } },
    { x: 330, y: 330, w: 44, h: 30, radius: 42, label: 'Pretzel cart', action: () => {
      if (!state.flags.atePretzel) {
        state.flags.atePretzel = true;
        state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 3);
        startDialog([
          { speaker: 'narrator', text: 'A hot pretzel, $3, mustard optional. The salt-to-dough ratio is the best deal in Manhattan.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'These pretzels are making me thirsty!' : 'Gabagool this ain’t. But it’s got salt. I respect salt.' }
        ]);
        audio.sfx('pickup');
      } else startDialog([{ speaker: 'narrator', text: 'The cart guy nods at you like a regular. You are a regular now. This is your cart.' }]);
    } },
    { x: 250, y: 296, w: 30, h: 26, radius: 40, label: 'Parking meter', action: () => {
      const cd = 20;
      if ((state.flags.meterT || 0) + cd > Date.now() / 1000) {
        startDialog([{ speaker: 'narrator', text: 'Empty. The city refills these things slower than you can rob them. Impressive, really.' }]);
        return;
      }
      state.flags.meterT = Date.now() / 1000;
      const loot = 8 + Math.floor(Math.random() * 10);
      state.flags.tribute = (state.flags.tribute || 0) + loot;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
      audio.sfx('smash');
      audio.sfx('cash');
      spawnEffect(state.player.x + 8, state.player.y - 8, `+$${loot} · QUARTERS EVERYWHERE`, '#ffe78a');
      if (Math.random() < .35) startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George smashes a parking meter open with the brick of civic virtue. Quarters. So many quarters.' },
        { speaker: 'george', text: 'This is reclaiming! They owe us! You know how much I’ve paid these machines in my LIFE?!' }
      ] : [
        { speaker: 'narrator', text: 'Tony pops the meter like a bottle cap. Quarters scatter. Nobody in Manhattan looks up. Nobody ever looks up.' },
        { speaker: 'tony', text: 'The city’s been taxin’ me since ‘78. This is just a rebate.' }
      ]);
    } },
    { x: 700, y: 330, w: 40, h: 30, radius: 40, label: 'Loose brick', hidden: () => (state.flags.brick || 0) > 0, action: () => {
      state.flags.brick = 3;
      audio.sfx('pickup');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'BRICK x3 · USE WISELY', '#ff9a7a');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A loose brick. George pockets it with the confidence of a man who has never thrown anything in his life.' },
        { speaker: 'george', text: 'For protection! The city is dangerous! Also it was FREE. A free brick!' }
      ] : [
        { speaker: 'narrator', text: 'A loose brick. In Tony’s hands, masonry is just unfiled paperwork.' },
        { speaker: 'tony', text: 'Three good swings in this. Maybe four. We’ll see how the brick feels.' }
      ]);
    } },
    { x: 380, y: 356, w: 66, h: 36, radius: 44, label: 'Steal taxi', hidden: () => !!state.player.inCar, action: () => {
      state.player.inCar = true;
      state.player.speed = 210;
      state.player.carColor = '#e8b822';
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1.5);
      audio.sfx('door');
      audio.sfx('honk');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'GRAND THEFT TAXI', '#ff9a7a');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George steals a cab. Within forty seconds, three tourists climb in the back before he can object.' },
        { speaker: 'george', text: 'I’m not a cab! …I mean, technically NOW I am a cab. Times Square, I guess. Meter’s running!' }
      ] : [
        { speaker: 'tony', text: 'A yellow cab. Perfect. Nobody looks twice at a cab in Manhattan. That’s not theft, that’s camouflage.' }
      ]);
    } },
    { x: 150, y: 330, w: 56, h: 40, radius: 42, label: 'Card hustler', action: () => {
      if ((state.flags.tribute || 0) < 50) {
        startDialog([{ speaker: 'narrator', text: 'The hustler flips his cards invitingly, then sees your wallet. "Fifty minimum, pal." You do not have fifty.' }]);
        return;
      }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A three-card monte game on a folding crate. The crowd of "winners" around it all have the same shoes. George notices the shoes. George plays anyway.' },
        { speaker: 'george', text: 'Fifty bucks. But I’m WATCHING. I have very good eyes. LASIK-adjacent eyes!' }
      ] : [
        { speaker: 'narrator', text: 'Three-card monte on 81st street. The hustler does not know whose neighborhood this technically isn’t.' },
        { speaker: 'tony', text: 'Fifty says I know where the lady is. Deal the cards, Shakespeare.' }
      ], () => initMonte());
    } },
    { x: 690, y: 250, w: 60, h: 40, radius: 42, label: 'Guy in the doorway', action: () => {
      if (!state.flags.baniaBit) {
        state.flags.baniaBit = true;
        startDialog([
          { speaker: 'narrator', text: 'A cheerful man in a very good suit blocks the stoop. It’s Bania. He’s been waiting out here for Jerry for six hours.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Oh no. Not the Ovaltine bit. Anything but the Ovaltine bit.' : 'The hell is Ovaltine? Is that a thing people know? I don’t know that thing.' },
          { speaker: 'narrator', text: '"Why do they call it Ovaltine? The mug is round! They should call it ROUND-tine!" — you hear the whole bit. All of it. Twice.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'That’s GOLD, Bania. Gold. …It’s horrible. It’s so horrible I’m angry.' : 'I don’t know why, but I feel like I owe you money after that. Here’s five bucks. Never do it again.' }
        ], () => {
          state.flags.tribute = (state.flags.tribute || 0) + 5;
          audio.sfx('cash');
          spawnEffect(state.player.x + 8, state.player.y - 8, '+$5 · YOU HEARD THE BIT', '#ffe78a');
        });
      } else startDialog([{ speaker: 'narrator', text: 'Bania waves warmly. He is doing the bit again for a new victim. You feel nothing. You have been immunized.' }]);
    } },
    { x: 4, y: 270, w: 30, h: 90, radius: 46, label: '← Drive to New Jersey', action: () => {
      audio.sfx('honk');
      startDialog([
        { speaker: 'narrator', text: 'Back through the tunnel. The skyline shrinks in the mirror. Jersey spreads out like a forgiving buffet.' }
      ], () => startTransit('hub', 1196, 250, null));
    } }
  ];
}

function drawHub() {
  drawHubEast();
  if (drawSceneArt(sceneArt.hub, 640, 416)) {
    // Traffic keeps the free-roam neighborhood alive — persistent reactive cars when available
    const cars = state.hubCars || [
      { x: ((state.time * 54) % 1400) - 60, y: 246, dir: 1, color: '#31445e', brakeT: 0 },
      { x: 1340 - (((state.time * 76 + 310) % 1400) - 60), y: 268, dir: -1, color: '#7e2733', brakeT: 0 }
    ];
    for (const c of cars) {
      const tx = c.x, cy = c.y, i = c.dir < 0 ? 1 : 0;
      px(ctx, tx - 2, cy - 2, 38, 17, 'rgba(0,0,0,.3)');
      px(ctx, tx, cy, 34, 13, '#0d1017');
      px(ctx, tx + 1, cy + 1, 32, 11, c.color || (i ? '#7e2733' : '#31445e'));
      px(ctx, tx + 8, cy + 2, 15, 9, '#9fd4ec');
      px(ctx, tx + 10, cy + 4, 11, 5, i ? '#8e3542' : '#3f5a78');
      px(ctx, tx + 3, cy - 2, 6, 3, '#05070c');
      px(ctx, tx + 25, cy - 2, 6, 3, '#05070c');
      px(ctx, tx + 3, cy + 12, 6, 3, '#05070c');
      px(ctx, tx + 25, cy + 12, 6, 3, '#05070c');
      px(ctx, tx + (i ? 1 : 30), cy + 4, 3, 4, '#fff3b0');
      // brake lights while braking
      if ((c.brakeT || 0) > 0) px(ctx, tx + (i ? 30 : 1), cy + 6, 3, 4, '#ff3b2e');
      if ((c.honkT || 0) > .6) outlineText(ctx, '♪HONK', tx + 17, cy - 8, '#ffe78a', 6, 'center');
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
    // Newman loiters near the mailbox, plotting postal crimes
    const nl = Math.sin(state.time * 1.1) * 3;
    drawPerson(ctx, 556 + nl, 226, 'bobby', 'left', state.frame * .8);
    outlineText(ctx, 'Newman', 556, 210, '#cfe0ff', 6, 'center');
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
  if (drawSceneArt(sceneArt.chamber, 640, 416)) {
    // torchlight shimmer
    for (const [fx, fy] of [[60, 60], [560, 60]]) {
      const fl = Math.sin(state.time * 9 + fx) * 2;
      ctx.fillStyle = `rgba(255,160,60,${.16 + Math.sin(state.time * 5 + fx) * .06})`;
      ctx.beginPath();
      ctx.ellipse(fx, fy + 20, 30 + fl * 2, 44 + fl * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
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
    if (state.flags.freeRoam && state.kramerCycle) {
      const kc = state.kramerCycle;
      if (kc.phase !== 'gone') drawPerson(ctx, kc.x, kc.y, 'kramer', kc.dir, state.frame * 2.2, { pose: kc.phase === 'enter' ? 'burst' : 'stand' });
    }
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
    const angles = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
    drawCar(state.player.x, state.player.y, state.player.carColor || '#8f1f2e', false, angles[state.player.dir] || 0);
    return;
  }
  drawPerson(ctx, state.player.x, state.player.y, kind, state.player.dir, state.frame, state.playerPose ? { pose: state.playerPose } : {});
  if (state.flags.hasBat && state.scene === 'apartment') drawBat(ctx, state.player.x + 17, state.player.y + 11, -0.7);
}

function drawInteractionMarkers() {
  const scene = scenes[state.scene];
  if (!scene || state.mode !== 'explore') return;
  const list = scene.interactions().filter((i) => (typeof i.hidden === 'function' ? !i.hidden() : !i.hidden));
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
  // free roam has no single objective — the arrow would just be noise
  if (state.scene === 'hub' || state.scene === 'nyc') return null;
  const list = scene.interactions().filter((i) => (typeof i.hidden === 'function' ? !i.hidden() : !i.hidden) && !/leave|exit/i.test(i.label));
  const priority = list.filter((i) => /talk|meet|speak|order|enter|use|take|sit|answer|carve|answer|glow|drive|start|confront/i.test(i.label));
  return priority[0] || list[0] || null;
}

function drawBeacon() {
  if (!state || (state.idleT || 0) < 5 || state.dialog || state.mode !== 'explore') return;
  const it = nearestInteraction();
  if (!it) return;
  const t = state.time;
  const cx = it.x + it.w / 2 - (state.camera?.x || 0), cy = it.y + it.h / 2 - (state.camera?.y || 0);
  const pulse = 1 + Math.sin(t * 5) * .25;
  const r = (16 + (t % 1.4) * 26) * pulse;
  const fade = Math.max(0, .8 - (t % 1.4) * .55);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = .9;
  // bouncing chevron above the target
  const bob = Math.sin(t * 6) * 4;
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 34 - bob); ctx.lineTo(cx + 8, cy - 34 - bob); ctx.lineTo(cx, cy - 22 - bob);
  ctx.closePath(); ctx.fill();
  outlineText(ctx, it.label || 'here', cx, cy - 44 - bob, '#ffe8a3', 7, 'center');
  ctx.restore();
}

function drawMinimap() {
  if (!state.flags.freeRoam || (state.scene !== 'hub' && state.scene !== 'nyc') || state.mode !== 'explore') return;
  const mx = 8, my = H - 46, mw = 110, mh = 34;
  const sceneW = state.scene === 'nyc' ? 768 : 1280;
  const sx = mw / sceneW, sy = mh / 416;
  ctx.save();
  ctx.globalAlpha = .88;
  drawPanel(mx, my, mw, mh, '#0d1424', '#4a5a78');
  ctx.restore();
  // road band
  px(ctx, mx + 2, my + 198 * sy, mw - 4, 90 * sy, '#3a3f48');
  // landmark dots
  const marks = state.scene === 'nyc' ? [
    [125, 230, '#ffb98a'], [435, 220, '#ffe78a'], [650, 228, '#9fd4ec'], [18, 226, '#8ffff2'],
    [500, 220, '#e8e2d0'], [160, 350, '#c09aff'], [390, 370, '#e8b822']
  ] : [
    [157, 150, '#ffd34f'], [525, 150, '#ff9a7a'], [90, 315, '#c09aff'], [554, 395, '#ff6a8a'],
    [320, 325, '#9fd4ec'], [218, 276, '#ffb98a'], [80, 150, '#e8e2d0'], [283, 138, '#e8e2d0'], [609, 162, '#8fb8ff'],
    [1010, 100, '#ff8a8a'], [1100, 350, '#9be59b']
  ];
  for (const [lx, ly, c] of marks) px(ctx, mx + lx * sx - 1, my + ly * sy - 1, 2, 2, c);
  // brawler/cop threat blips
  if (state.cop) px(ctx, mx + state.cop.x * sx - 1, my + state.cop.y * sy - 1, 3, 3, state.time % .5 < .25 ? '#4a8aff' : '#ff4a4a');
  if (state.brawler && state.brawler.hp > 0) px(ctx, mx + state.brawler.x * sx - 1, my + state.brawler.y * sy - 1, 2, 2, '#ff4a4a');
  // player arrow
  const ppx = mx + state.player.x * sx, ppy = my + state.player.y * sy;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(ppx, ppy - 3);
  ctx.lineTo(ppx - 2.4, ppy + 2.4);
  ctx.lineTo(ppx + 2.4, ppy + 2.4);
  ctx.closePath();
  ctx.fill();
  outlineText(ctx, 'N', mx + mw - 7, my + 3, '#8f9ab8', 5, 'center');
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
  drawHubEventProps();
  drawBrawler();
  drawCash();
  drawInteractionMarkers();
  drawPlayer();
  drawEffects();
  ctx.restore();
  drawObjectiveArrow();
  drawMinimap();
  drawBeacon();
  // location badge
  drawPanel(8, 42, 172, 25, '#182448', '#92896f');
  outlineText(ctx, scene.label, 16, 50, '#ddd5bd', 7);
  if (state.flags.freeRoam) {
    drawPanel(W - 104, 42, 96, 25, '#182448', '#8ffff2');
    outlineText(ctx, state.player.kind === 'george' ? 'GEORGE' : 'TONY', W - 56, 50, '#8ffff2', 8, 'center');
    if ((state.flags.hp || 3) < 3) {
      for (let i = 0; i < 3; i++) px(ctx, W - 100 + i * 12, 52, 9, 7, i < (state.flags.hp || 3) ? '#ff5a5a' : '#3a2a2a');
    }
    if (state.flags.tribute) {
      drawPanel(W - 104, 70, 96, 18, '#14261a', '#9be59b');
      outlineText(ctx, `$${state.flags.tribute}`, W - 56, 75, '#9be59b', 7, 'center');
    }
    if ((state.flags.heat || 0) > 0.3) {
      drawPanel(W - 172, H - 50, 164, 20, '#33141a', '#ff7a5e');
      // GTA-style wanted stars
      const stars = Math.min(5, Math.max(1, Math.round(state.flags.heat)));
      for (let si = 0; si < 5; si++) {
        const sx = W - 162 + si * 15, sy = H - 44;
        const lit = si < stars;
        const flash = lit && state.flags.heat >= 3 && Math.floor(state.time * 4) % 2 === 0;
        ctx.fillStyle = lit ? (flash ? '#fff1a6' : '#ffd24a') : 'rgba(255,255,255,.16)';
        ctx.beginPath();
        for (let pi = 0; pi < 10; pi++) {
          const ang = -Math.PI / 2 + pi * Math.PI / 5;
          const rad = pi % 2 === 0 ? 6 : 2.6;
          const x = sx + Math.cos(ang) * rad, y = sy + Math.sin(ang) * rad;
          pi === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
      }
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
  // illustrated grimy gym-bathroom backdrop
  const art = sceneArt.boneroom;
  if (art && art.complete && art.naturalWidth) ctx.drawImage(art, 0, 0, W, H);
  else px(ctx, 0, 0, W, H, '#21182b');
  const striking = b.flash > 0;
  drawPerson(ctx, 168, 196, state.player.kind, 'right', striking ? state.frame * 3 : state.frame, { pose: striking ? 'perform' : 'angry' });
  // Animated arms physically reach toward the mirror; alternating fists sell the strikes.
  const pump = Math.sin(state.time * (striking ? 18 : 5));
  const reach = striking ? 1 : .55 + pump * .12;
  const fistX = 236 + reach * 62;
  const fistY = 158 + pump * 8;
  px(ctx, 228, 160, fistX - 228, 6, '#c8875f');
  px(ctx, fistX, fistY, 13, 13, '#d89a70');
  px(ctx, fistX + 2, fistY + 3, 9, 3, '#efb287');
  if (striking) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + state.time;
      px(ctx, 316 + Math.cos(a) * 13, 130 + Math.sin(a) * 13, 7, 2, '#fff0a6');
    }
    outlineText(ctx, 'CRACK', 296, 106, '#ffe78a', 10);
  }
  // Tony's real illustrated reflection, scaled up inside the mirror — and visibly deforming per hit.
  if (sceneArt.tonyHead.complete && sceneArt.tonyHead.naturalWidth) {
    ctx.save();
    if (b.hits >= 4) {
      // jaw visibly knocked sideways: shear the reflection
      ctx.transform(1, 0, -.08 * Math.min(2, b.hits - 3), 1, 30, 0);
    }
    ctx.drawImage(sceneArt.tonyHead, 306, 52, 126, 104);
    ctx.restore();
  } else {
    px(ctx, 316, 56, 100, 104, '#c8875f');
    px(ctx, 322, 62, 88, 22, '#2a211e');
  }
  // progressive damage overlays: swelling, black eye, bandage, circling stars
  if (b.hits >= 2) {
    px(ctx, 330, 76, 24, 16, 'rgba(200,60,50,.45)');
    px(ctx, 392, 96, 20, 14, 'rgba(200,60,50,.4)');
  }
  if (b.hits >= 3) {
    ctx.fillStyle = 'rgba(40,20,40,.65)';
    ctx.beginPath();
    ctx.ellipse(348, 82, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.hits >= 5) {
    px(ctx, 318, 64, 38, 11, '#e8e2d0');
    px(ctx, 318, 68, 38, 3, '#c94f42');
    for (let i = 0; i < 4; i++) {
      const a = state.time * 3 + i * 1.6;
      outlineText(ctx, '✦', 368 + Math.cos(a) * 50, 66 + Math.sin(a) * 20, '#ffe78a', 9, 'center');
    }
  }
  if (b.hits >= 6) {
    px(ctx, 364, 112, 42, 20, 'rgba(230,225,205,.85)');
    outlineText(ctx, 'JAW!', 385, 117, '#a03a2c', 8, 'center');
  }
  ctx.strokeStyle = 'rgba(255,246,190,.72)';
  ctx.lineWidth = 1;
  for (let i = 0; i < Math.min(6, b.hits); i++) {
    const sx = 338 + i * 12;
    ctx.beginPath();
    ctx.moveTo(sx, 84 + (i % 2) * 16);
    ctx.lineTo(sx - 7, 104 + i * 5);
    ctx.lineTo(sx + 4, 122 + (i % 3) * 7);
    ctx.stroke();
  }
  if (b.flash) px(ctx, 300, 44, 130, 120, 'rgba(255,235,120,.28)');
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

function drawCar(x, y, color = '#8f1f2e', target = false, angle = 0) {
  if (angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
  }
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
  if (angle) ctx.restore();
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
  // sky strip with distant NYC skyline scrolling very slowly
  px(ctx, 0, 0, W, H, '#7c8c58');
  const skyOff = (d.road * .06) % 640;
  for (let i = 0; i < 2; i++) {
    const bx = i * 640 - skyOff;
    // distant skyline silhouette in the upper-left horizon gap
    ctx.fillStyle = 'rgba(60,70,95,.45)';
    const towers = [[30, 26], [44, 40], [58, 30], [74, 48], [92, 22], [108, 34]];
    for (const [tx, th] of towers) ctx.fillRect(bx + tx, 0, 10, th);
  }
  for (let i = 0; i < 8; i++) {
    const y = ((i * 120 + d.road * .3) % 460) - 60;
    const left = i % 2 === 0;
    // distant houses
    px(ctx, left ? 20 : 560, y, 60, 40, '#8d5b3d');
    px(ctx, left ? 16 : 556, y - 8, 68, 12, '#5c342c');
    px(ctx, left ? 28 : 570, y + 12, 14, 14, '#e8d6ad');
    px(ctx, left ? 52 : 596, y + 12, 14, 14, '#e8d6ad');
    // autumn trees
    px(ctx, left ? 105 : 500, y + 20, 8, 16, '#5c4030');
    px(ctx, left ? 96 : 491, y + 6, 26, 18, i % 3 ? '#c86d31' : '#d79531');
    px(ctx, left ? 100 : 495, y + 2, 18, 10, '#e0a33c');
  }
  // billboards with Jersey flavor, alternating sides
  const billboards = [
    ['SATRIALE’S', 'PORK STORE · 2 MI', '#8f1f2e'],
    ['MOLTISANTI', 'MOTORS · CERTIFIED', '#1f3a8f'],
    ['GABAGOOL', 'EXIT 13 · FRESH', '#3d6b35'],
    ['VESUVIO', 'FINE DINING', '#7a4a12']
  ];
  for (let i = 0; i < 4; i++) {
    const y = ((i * 190 + d.road * .45) % 760) - 120;
    if (y < -70 || y > H + 20) continue;
    const left = i % 2 === 0;
    const bx = left ? 52 : 508;
    const [line1, line2, bg] = billboards[i % billboards.length];
    px(ctx, bx + 18, y + 26, 6, 26, '#4a3a28');
    px(ctx, bx, y, 64, 30, '#20180f');
    px(ctx, bx + 2, y + 2, 60, 26, bg);
    outlineText(ctx, line1, bx + 32, y + 6, '#fff', 6, 'center');
    outlineText(ctx, line2, bx + 32, y + 17, '#ffd98a', 5, 'center');
  }
  for (let i = 0; i < 10; i++) {
    const y = ((i * 70 + d.road * .62) % 440) - 50;
    // near fences + mailboxes whipping past
    const left = i % 2 === 0;
    for (let f = 0; f < 4; f++) px(ctx, (left ? 130 : 480) + f * 8, y, 3, 10, '#e8e0c8');
    px(ctx, left ? 128 : 478, y + 3, 34, 3, '#e8e0c8');
    if (i % 3 === 0) {
      px(ctx, left ? 120 : 516, y + 12, 5, 10, '#4a3226');
      px(ctx, left ? 116 : 512, y + 8, 13, 8, '#8a2f2f');
    }
  }
  // road with asphalt speckle — 4 lanes
  px(ctx, 170, 0, 300, H, '#4c4f55');
  for (let i = 0; i < 26; i++) {
    const sy = ((i * 61 + d.road) % 400) - 20;
    px(ctx, 195 + (i * 97) % 250, sy, 3, 2, 'rgba(255,255,255,.06)');
    px(ctx, 210 + (i * 53) % 230, sy + 8, 2, 2, 'rgba(0,0,0,.15)');
  }
  // guardrails: metal band + posts
  px(ctx, 172, 0, 4, H, '#9aa2ad');
  px(ctx, 464, 0, 4, H, '#9aa2ad');
  for (let y = ((d.road * .95) % 30) - 30; y < H; y += 30) {
    px(ctx, 171, y, 6, 4, '#6e757f');
    px(ctx, 463, y + 15, 6, 4, '#6e757f');
  }
  px(ctx, 182, 0, 8, H, '#d7d0bc');
  px(ctx, 450, 0, 8, H, '#d7d0bc');
  // curb grass fringe
  for (let y = ((d.road * .9) % 26) - 26; y < H; y += 26) {
    px(ctx, 172, y, 8, 8, '#6f954f');
    px(ctx, 460, y + 13, 8, 8, '#6f954f');
  }
  // 3 dashed lane lines for 4 lanes
  for (const lx of [245, 320, 395]) {
    for (let y = ((d.road) % 52) - 52; y < H; y += 52) px(ctx, lx - 3, y, 6, 28, '#e8d66c');
  }
  // speed-dependent road vibration streaks at high speed
  if (d.speed > .75) {
    ctx.fillStyle = `rgba(255,255,255,${(d.speed - .75) * .5})`;
    for (let i = 0; i < 6; i++) {
      const lx = 190 + ((i * 71 + 40) % 260);
      const ly = ((i * 137 + d.road * 3.6) % 380) - 20;
      ctx.fillRect(lx, ly, 2, 30);
    }
  }
  // target black sedan far ahead
  const targetY = 48 + Math.sin(state.time * 3) * 3;
  drawCar(320, targetY, '#111722', true);
  outlineText(ctx, 'DEBTOR', 320, 24, '#ffe06e', 7, 'center');
  // obstacles
  for (const o of d.obstacles) {
    if (o.hit && o.type === 'money') continue;
    if (o.type === 'money') {
      const bob = Math.sin(state.time * 8 + o.wobble) * 2;
      // fat cash envelope: manila with green bills fanning out and a rubber band
      px(ctx, o.x - 13, o.y - 8 + bob, 26, 16, '#c8a869');
      px(ctx, o.x - 11, o.y - 6 + bob, 22, 12, '#e2c88f');
      for (let b = 0; b < 3; b++) {
        px(ctx, o.x - 8 + b * 7, o.y - 10 + bob - b, 6, 8, '#4c9a58');
        px(ctx, o.x - 7 + b * 7, o.y - 9 + bob - b, 4, 3, '#6cc47a');
      }
      px(ctx, o.x - 2, o.y - 8 + bob, 4, 16, '#8a3f34');
      outlineText(ctx, '$', o.x + 1, o.y - 4 + bob, '#174d2b', 8, 'center');
    } else if (o.type === 'gabagool') {
      // proper capicola roll: dark cured crust, fatty veins, netting
      px(ctx, o.x - 13, o.y - 9, 26, 18, '#7c3a20');
      px(ctx, o.x - 11, o.y - 7, 22, 14, '#9a4f2b');
      px(ctx, o.x - 9, o.y - 5, 5, 4, '#e8c9a0');
      px(ctx, o.x + 2, o.y - 2, 6, 4, '#e8c9a0');
      px(ctx, o.x - 5, o.y + 2, 4, 3, '#d8b088');
      for (let n = 0; n < 3; n++) px(ctx, o.x - 13, o.y - 6 + n * 6, 26, 1, 'rgba(240,220,190,.5)');
      px(ctx, o.x - 8, o.y - 12, 16, 5, '#b85e33');
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
    } else if (o.type === 'traffic') {
      ctx.save();
      if (o.spin) {
        ctx.translate(o.x, o.y);
        ctx.rotate((1.2 - o.spin) * 7);
        ctx.translate(-o.x, -o.y);
      }
      drawCar(o.x, o.y, o.carColor || '#4a5e78');
      ctx.restore();
    } else if (o.type === 'nycar') {
      ctx.save();
      if (o.spin) {
        ctx.translate(o.x, o.y);
        ctx.rotate((1.2 - o.spin) * 8);
        ctx.translate(-o.x, -o.y);
      }
      drawCar(o.x, o.y, '#14181f');
      // NY crew passengers visible in the rear window
      px(ctx, o.x - 6, o.y + 6, 4, 4, '#e8b88a');
      px(ctx, o.x + 2, o.y + 6, 4, 4, '#d8a878');
      ctx.restore();
      if (!o.hit) outlineText(ctx, 'NY CREW', o.x, o.y - 26, '#ff8e8e', 6, 'center');
    } else {
      drawCar(o.x, o.y, '#59624a');
      drawPerson(ctx, o.x - 7, o.y - 16, 'paulie', 'down', state.frame);
    }
  }
  // particles: sparks and exhaust smoke
  for (const p of d.particles) {
    const a = Math.max(0, 1 - p.t / p.life);
    ctx.globalAlpha = a;
    if (p.smoke) {
      const r = 3 + p.t * 14;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      px(ctx, p.x - 1, p.y - 1, 3, 3, p.color);
    }
    ctx.globalAlpha = 1;
  }
  if (d.boost > 0) {
    for (let i = 0; i < 4; i++) px(ctx, d.x - 10 + i * 6, d.y + 22 + i * 5, 3, 12, i % 2 ? '#ffb13e' : '#f4e27a');
  }
  // player car: lean into steering, brake lights flare when slowing
  const input = moveInput();
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(input.x * .06 * (0.5 + d.speed));
  ctx.translate(-d.x, -d.y);
  drawCar(d.x, d.y, d.boost > 0 ? '#b82835' : '#8f1f2e');
  if (input.y > 0) {
    ctx.fillStyle = 'rgba(255,60,50,.55)';
    ctx.fillRect(d.x - 11, d.y + 15, 7, 6);
    ctx.fillRect(d.x + 4, d.y + 15, 7, 6);
  }
  ctx.restore();
  ctx.restore();
  // HUD
  drawPanel(10, 10, 280, 44, '#141f3a', '#e5c36a');
  outlineText(ctx, `CHASE ${Math.floor(d.progress)}%`, 20, 19, '#ffe78a', 10);
  px(ctx, 20, 38, 180, 7, '#30384d');
  px(ctx, 20, 38, Math.min(180, d.progress * 1.8), 7, '#e45445');
  outlineText(ctx, `♥ ${d.health}`, 216, 31, '#ff8e8e', 10);
  outlineText(ctx, `$${d.score || 0}`, 216, 19, '#9be59b', 9);
  // speedometer
  drawPanel(306, 10, 110, 30, '#141f3a', '#e5c36a');
  const mph = Math.round(25 + d.speed * 85);
  outlineText(ctx, `${mph} MPH`, 318, 16, d.speed > .75 ? '#ffe06e' : '#cfd8ea', 10);
  px(ctx, 318, 33, 86, 4, '#30384d');
  px(ctx, 318, 33, Math.round(d.speed * 86), 4, d.speed > .75 ? '#ffe06e' : '#69a2e2');
  if (d.boost > 0) {
    px(ctx, 306, 46, 110, 14, '#173521');
    px(ctx, 308, 48, Math.min(106, d.boost / 2.7 * 106), 10, '#69e26e');
    outlineText(ctx, 'MONEY BOOST', 361, 48, '#102415', 7, 'center');
  }
  outlineText(ctx, '↑ gas · ↓ brake · ram NY crew cars at speed for cash · money = boost', 320, 340, '#fff', 8, 'center');
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
  outlineText(ctx, 'An open-world holiday misadventure', W / 2, 234, '#c8d7ff', 10, 'center');
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
  const MAXROWS = 14;
  if (state.menu.sel < state.menu.scroll) state.menu.scroll = state.menu.sel;
  if (state.menu.sel >= state.menu.scroll + MAXROWS) state.menu.scroll = state.menu.sel - MAXROWS + 1;
  const scroll = state.menu.scroll || 0;
  entries.slice(scroll, scroll + MAXROWS).forEach((it, j) => {
    const i = scroll + j;
    const y = 92 + j * 17;
    const sel = i === state.menu.sel;
    if (sel) {
      ctx.fillStyle = 'rgba(255,211,79,.14)';
      ctx.fillRect(142, y - 4, 356, 16);
    }
    const color = it.locked ? '#5a6076' : sel ? '#ffe78a' : '#d8deef';
    outlineText(ctx, `${sel ? '> ' : ''}${it.label}`, 156, y, color, 8);
    outlineText(ctx, it.locked ? 'locked' : it.hint, 494, y + 1, it.locked ? '#5a6076' : '#8f9ab8', 6, 'right');
  });
  if (scroll > 0) outlineText(ctx, '▲ more', 320, 84, '#8f9ab8', 7, 'center');
  if (scroll + MAXROWS < entries.length) outlineText(ctx, '▼ more', 320, 344, '#e8d493', 7, 'center');
}

function weatherRain() {
  if (state.scene !== 'hub' && state.scene !== 'nyc') return 0;
  // rain for ~90s out of every 360s, offset so it doesn't sync with night
  const wt = state.time % 360;
  return wt > 240 && wt < 330 ? 1 : 0;
}

function drawAtmosphere() {
  // rain — slanted streaks + ground darkening, before everything else atmospheric
  if (weatherRain() && (state.mode === 'explore' || state.mode === 'transit')) {
    ctx.fillStyle = 'rgba(40,50,80,.14)';
    ctx.fillRect(0, 0, W, H);
    const seed = Math.floor(state.time * 24);
    for (let i = 0; i < 46; i++) {
      const rx = ((seed * 37 + i * 89) % 700) - 30;
      const ry = ((seed * 53 + i * 61) % 440) - 20;
      ctx.fillStyle = `rgba(170,190,230,${.25 + (i % 3) * .1})`;
      ctx.fillRect(rx, ry, 1, 7);
      ctx.fillRect(rx - 1, ry + 7, 1, 3);
    }
    if (Math.random() < .02) audio.noise(.06, .008, 0, 2600); // patter
  }
  // day/night cycle for the outdoor open world — 4-minute days, warm dusk, blue night
  if ((state.scene === 'hub' || state.scene === 'nyc') && (state.mode === 'explore' || state.mode === 'monte')) {
    const dayT = (state.time % 240) / 240;
    // daylight 0-.5, dusk .5-.65, night .65-.9, dawn .9-1
    let dark = 0, warm = 0;
    if (dayT < .5) dark = 0;
    else if (dayT < .65) { const k = (dayT - .5) / .15; dark = k * .34; warm = Math.sin(k * Math.PI) * .5; }
    else if (dayT < .9) dark = .34;
    else dark = .34 * (1 - (dayT - .9) / .1);
    if (warm > 0) {
      ctx.fillStyle = `rgba(255,120,40,${warm * .16})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (dark > 0) {
      ctx.fillStyle = `rgba(8,12,48,${dark})`;
      ctx.fillRect(0, 0, W, H);
      // streetlamps and windows glow at night
      if (dark > .2) {
        const sceneW = scenes[state.scene]?.w || 1280;
        for (let wx = 100; wx < sceneW; wx += 220) {
          const lx = wx - (state.camera?.x || 0);
          if (lx < -50 || lx > W + 50) continue;
          const g = ctx.createRadialGradient(lx, 210, 4, lx, 210, 46);
          g.addColorStop(0, 'rgba(255,220,120,.24)');
          g.addColorStop(1, 'rgba(255,220,120,0)');
          ctx.fillStyle = g;
          ctx.fillRect(lx - 46, 164, 92, 92);
        }
      }
    }
  }
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
  else if (state.mode === 'monte') drawMonte();
  else if (state.mode === 'armwrestle') drawArmWrestle();
  else if (state.mode === 'transit') drawTransit();
  else if (state.mode === 'blackjack') drawBlackjack();
  else if (state.mode === 'goosechase') drawGooseChase();
  else if (state.mode === 'bonus') drawBonus();
  else if (state.mode === 'produce') drawProduce();
  else if (state.mode === 'ending') drawEnding();
  else drawWorld();

  if (state.mode === 'menu') drawMenu();
  drawAtmosphere();
  if (!['title', 'ending', 'dream', 'bone', 'peptides', 'drive', 'bonus', 'produce', 'menu', 'transit', 'monte', 'armwrestle'].includes(state.mode)) drawObjective();
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
  loadWorld();
  audio.setMusic('title');
}

function startOpenWorld() {
  resetGame();
  state.flags.sandbox = true;
  state.unlocked = { house: true, hub: true, drive: true, chamber: true, club: true, rome: true, apartment: true, satriale: true, vesuvio: true, monks: true, soup: true, yankees: true, melfi: true, costanza: true };
  state.flags.hasBat = true;
  state.flags.houseStep = 9;
  state.flags.derekMission = true;
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
  if (consume(['KeyN'])) {
    const on = audio.toggle();
    document.getElementById('muteBtn').textContent = on ? 'Sound' : 'Muted';
  }
  if (state.help && consume(cancelCodes)) state.help = false;
  if (consume(['Escape', 'KeyP', 'KeyM'])) {
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
  } else if (state.mode === 'monte') {
    updateMonte(dt);
  } else if (state.mode === 'armwrestle') {
    updateArmWrestle(dt);
  } else if (state.mode === 'transit') {
    updateTransit(dt);
  } else if (state.mode === 'blackjack') {
    updateBlackjack(dt);
  } else if (state.mode === 'goosechase') {
    updateGooseChase(dt);
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
  window.__game = { state, scenes, startGame, setScene, startDialog, ringPhone, resetGame, nearestInteraction, blockedAt, initDrive };
}

resetGame();
requestAnimationFrame(loop);
