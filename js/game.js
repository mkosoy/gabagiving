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

function loadArt(src) {
  const img = new Image();
  img.src = src;
  return img;
}
const sceneArt = {
  house: loadArt('./assets/bg-house-v2.webp'),
  hub: loadArt('./assets/bg-njhub.webp'),
  apartment: loadArt('./assets/bg-apartment.webp'),
  rome: loadArt('./assets/bg-rome.webp'),
  club: loadArt('./assets/bg-club.webp'),
  satriale: loadArt('./assets/bg-satriale.webp'),
  cousinTony: loadArt('./assets/photo-cousin-tony.webp'),
  tonyHorse: loadArt('./assets/photo-tony-horse.webp')
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
const interactCodes = ['KeyE', 'Space', 'Enter'];
const cancelCodes = ['Escape', 'KeyQ'];

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  audio.unlock();
  if (!e.repeat) pressed.add(e.code);
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
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
stickZone.addEventListener('pointercancel', releaseStick);

function bindButton(id, code) {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
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
    freeRoam: false
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
  dreamT: 0,
  stats: { started: 0, calls: 0, vials: 0, smashes: 0, crashes: 0 }
};

function objective(text) { state.objective = text; }
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
  const sx = inter.x + inter.w / 2 - state.camera.x;
  const sy = inter.y - 15 - state.camera.y;
  drawPanel(sx - 42, sy - 5, 84, 18, '#1b2a55', '#f4df8e');
  outlineText(ctx, `A  ${inter.label}`, sx, sy + 1, '#fff1a6', 8, 'center');
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
  outlineText(ctx, 'M or Sound button toggles audio', 174, 158, '#fff', 9);
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
      r(62,45,110,100), r(200,20,62,55), r(18,70,54,58),
      r(392,26,138,108), r(568,86,56,88), r(408,122,70,28),
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
      r(34,42,126,58), r(440,26,144,74), r(48,232,132,58), r(254,216,132,48),
      r(496,194,82,118), r(232,306,164,52)
    ],
    draw: drawApartment,
    interactions: apartmentInteractions
  },
  club: {
    w: 640, h: 416, label: 'Bada Bing · Thanksgiving Night', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(34,38,168,82), r(446,38,150,82), r(238,178,164,70), r(82,302,96,52), r(458,302,96,52)
    ],
    draw: drawClub,
    interactions: clubInteractions
  },
  njstreet: {
    w: 640, h: 416, label: 'New Jersey · Augustus Dream', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(28,28,150,98), r(470,28,142,98), r(204,28,150,76),
      r(54,304,90,44), r(498,304,86,44)
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
  satriale: {
    w: 640, h: 416, label: 'Satriale’s Pork Store · Dream', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(28,34,584,62), r(70,136,118,52), r(448,136,118,52),
      r(244,236,152,58), r(46,320,110,48), r(482,318,108,48)
    ],
    draw: drawSatriale,
    interactions: satrialeInteractions
  }
};

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function playerRect(x = state.player.x, y = state.player.y) {
  return { x: x + 3, y: y + 7, w: 11, h: 13 };
}
function blockedAt(x, y) {
  const scene = scenes[state.scene];
  if (!scene) return false;
  const pr = playerRect(x, y);
  return scene.colliders.some((c) => rectsOverlap(pr, c));
}

function setScene(name, x, y) {
  state.scene = name;
  state.player.x = x;
  state.player.y = y;
  const scene = scenes[name];
  if (scene) audio.setMusic(scene.music);
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

function updateExplore(dt) {
  updatePhone(dt);
  if (state.phone) return;
  const input = moveInput();
  const p = state.player;
  if (input.x || input.y) {
    if (Math.abs(input.x) > Math.abs(input.y)) p.dir = input.x > 0 ? 'right' : 'left';
    else p.dir = input.y > 0 ? 'down' : 'up';
    const sp = p.speed * dt;
    const nx = p.x + input.x * sp;
    if (!blockedAt(nx, p.y)) p.x = nx;
    const ny = p.y + input.y * sp;
    if (!blockedAt(p.x, ny)) p.y = ny;
    state.frame += dt * 12;
  } else {
    state.frame += dt * 2;
  }
  const scene = scenes[state.scene];
  state.camera.x = Math.max(0, Math.min(scene.w - W, p.x - W / 2));
  state.camera.y = Math.max(0, Math.min(scene.h - H, p.y - H / 2));

  const inter = nearestInteraction();
  if (inter && interactPressed()) {
    audio.sfx('confirm');
    inter.action();
  }
}

function nearestInteraction() {
  const scene = scenes[state.scene];
  if (!scene) return null;
  const list = scene.interactions().filter((i) => !i.hidden);
  if (state.flags.freeRoam && state.scene !== 'hub') {
    list.push({ x: 292, y: 382, w: 96, h: 30, label: 'Neighborhood', action: () => enterHub(false) });
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
  if (s === 3) list.push({ x: 474, y: 82, w: 38, h: 36, label: 'Talk to AJ', action: talkAJ });
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
  }
  return list;
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
      { speaker: 'tony', text: 'I’ll circle back. Don’t let the guy paint my mother-in-law into the background.' }
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
    { speaker: 'augustus', text: 'Cousin Tony!', action: () => audio.sfx('success') },
    { speaker: 'narrator', text: 'Augustus kisses Tony on both cheeks. His jawline could open mail.' },
    { speaker: 'augustus', text: 'You look rough, Ton.' },
    { speaker: 'tony', text: 'Really? You think so?' },
    { speaker: 'augustus', text: 'You have to max, Ton. You cannot be a boss like this. It is a new era.' },
    { speaker: 'augustus', text: 'Come. Get glammed out. Rome did not become Rome with a recessed chin.' }
  ], () => {
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
    message: 'Catch glowing peptides'
  };
}

function updatePeptides(dt) {
  const g = state.pep;
  g.time += dt;
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
  state.flags.houseStep = 6;
  objective(houseObjective());
  startDialog([
    { speaker: 'narrator', text: 'Tony jolts awake on the couch. The documentary credits roll. The robe is somehow tighter around the jaw.' },
    { speaker: 'tony', text: 'Groceries. Right. Carmela’s card. Focus.' }
  ]);
}

// ---------- Driving ----------
function initDrive() {
  state.drive = {
    x: 320,
    y: 292,
    progress: 0,
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
    const type = typeRoll < .12 ? 'money' : typeRoll < .48 ? 'gabagool' : typeRoll < .72 ? 'janice' : 'paulie';
    const lanes = [220, 275, 330, 385, 430];
    d.obstacles.push({
      type,
      x: lanes[Math.floor(Math.random() * lanes.length)],
      y: -45,
      vx: type === 'janice' ? (Math.random() > .5 ? 70 : -70) : type === 'paulie' ? (Math.random() - .5) * 55 : 0,
      hit: false,
      wobble: Math.random() * 10
    });
  }
  for (const o of d.obstacles) {
    o.y += dt * (150 + d.progress * .8);
    o.x += o.vx * dt;
    if (o.x < 190 || o.x > 450) o.vx *= -1;
    const ox = o.x - 13, oy = o.y - 12;
    const car = { x: d.x - 13, y: d.y - 18, w: 26, h: 34 };
    if (!o.hit && rectsOverlap(car, { x: ox, y: oy, w: 26, h: 24 })) {
      o.hit = true;
      if (o.type === 'money') {
        d.boost = 2.7;
        d.progress = Math.min(100, d.progress + 4);
        audio.sfx('pickup');
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
  setScene('apartment', 316, 370);
  state.flags.aptStep = 0;
  objective('Follow the debtor inside');
  startDialog([
    { speaker: 'narrator', text: 'Tony follows him through a purple door into a familiar-looking sitcom apartment.' },
    { speaker: 'tony', text: 'There you are.' }
  ], () => {
    state.flags.aptStep = 1;
    objective('Pick up the bat');
  });
}

function apartmentInteractions() {
  const s = state.flags.aptStep;
  const list = [];
  if (s === 1 && !state.flags.hasBat) list.push({ x: 275, y: 224, w: 34, h: 24, label: 'Pick up bat', action: pickBat });
  if (s === 2) list.push({ x: 340, y: 270, w: 38, h: 40, label: 'Confront George', action: confrontGeorge });
  if (s === 3) list.push({ x: 280, y: 312, w: 42, h: 34, label: 'Sit for dinner', action: sitDinner });
  if (state.flags.freeRoam) {
    list.push({ x: 48, y: 96, w: 96, h: 34, label: 'Cereal shelf', action: () => startDialog([
      { speaker: 'jerry', text: 'You can tell a lot about a man by his cereal-to-company ratio.' },
      { speaker: 'tony', text: 'I’m more of a pork store guy.' },
      { speaker: 'george', text: 'That explains the fiscal structure of your pantry.' }
    ]) });
    list.push({ x: 538, y: 98, w: 50, h: 48, label: 'Bike', action: () => startDialog([
      { speaker: 'tony', text: 'Who keeps a bike inside? Guy’s afraid of the outdoors?' },
      { speaker: 'jerry', text: 'It’s decorative transportation.' }
    ]) });
  }
  return list;
}

function pickBat() {
  state.flags.hasBat = true;
  startDialog([
    { speaker: 'tony', text: 'There you are.' },
    { speaker: 'jerry', text: 'Woah, George — is this guy here because of your Human Fund?' },
    { speaker: 'george', text: 'Steinbrenner’s not going to like this. I need to be back at the office in an hour.' },
    { speaker: 'tony', text: 'You need George Steinbrenner?' },
    { speaker: 'george', text: 'What are you, a scout?' },
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
  if (!talked.christopher) list.push({ x: 224, y: 154, w: 38, h: 42, label: 'Christopher', action: () => clubTalk('christopher') });
  if (!talked.paulie) list.push({ x: 400, y: 154, w: 38, h: 42, label: 'Paulie', action: () => clubTalk('paulie') });
  if (!talked.silvio) list.push({ x: 312, y: 118, w: 38, h: 42, label: 'Silvio', action: () => clubTalk('silvio') });
  if (state.flags.clubReady && !state.flags.freeRoam) list.push({ x: 292, y: 246, w: 58, h: 36, label: 'Carve turkey', action: finalDinner });
  if (state.flags.freeRoam) {
    list.push({ x: 230, y: 176, w: 180, h: 76, label: 'Table surprise', action: () => startDialog([
      { speaker: 'paulie', text: 'I saved you a seat, Ton. Also somebody left four roses in the basement. Don’t ask.' },
      { speaker: 'silvio', text: 'The camera is still down there. Hypothetically.' },
      { speaker: 'tony', text: 'What am I, the Museum of Bad Decisions?' }
    ]) });
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
    { speaker: 'narrator', text: 'Tony raises the carving knife. The crew goes quiet. Somewhere outside, a goose honks with respect.', action: () => audio.sfx('turkey') },
    { speaker: 'tony', text: 'Family. That’s the thing. Complicated, loud, sometimes they owe you money — but family.' },
    { speaker: 'christopher', text: 'Beautiful, Ton’.' },
    { speaker: 'paulie', text: 'Can we eat now? The painter says hunger ages the neck.' },
    { speaker: 'tony', text: 'Yeah. Happy Thanksgiving.' }
  ], () => {
    state.mode = 'ending';
    audio.setMusic('ending');
    audio.sfx('success');
  });
}

// ---------- Bonus: Augustus in New Jersey / Satriale's ----------
function startAugustusBonus() {
  state.player.kind = 'augustus';
  state.flags.augustusAJ = false;
  state.flags.satStep = 0;
  setScene('njstreet', 170, 330);
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

function satrialeInteractions() {
  if (state.flags.freeRoam) {
    return [
      { x: 46, y: 318, w: 110, h: 50, label: 'Produce crate', action: () => startDialog([
        { speaker: 'tony', text: 'After what Junior did, this stuff should be registered as ammunition.' },
        { speaker: 'bobby', text: 'We keep the dangerous tomatoes in the back now.' }
      ]) },
      { x: 244, y: 236, w: 152, h: 58, label: 'Meat table', action: () => startDialog([
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
  state.player.kind = 'tonyMax';
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
    apartment: ['apartment', 316, 370, 'The purple door is somehow still unlocked.']
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
    { x: 330, y: 168, w: 92, h: 36, label: 'Chase replay', action: () => {
      initDrive();
      state.mode = 'drive';
      objective('Catch the debtor — grab money boosts');
    } }
  ];
}

function drawHub() {
  if (drawSceneArt(sceneArt.hub, 640, 416)) {
    const pulse = (Math.sin(state.time * 4) + 1) / 2;
    ctx.fillStyle = `rgba(255,210,92,${.12 + pulse * .16})`;
    ctx.beginPath();
    ctx.ellipse(92, 318, 44 + pulse * 8, 54 + pulse * 8, 0, 0, Math.PI * 2);
    ctx.fill();
    outlineText(ctx, 'ROME', 92, 360, '#ffe28a', 7, 'center');
    // geese wandering near Tony's lawn
    for (let i = 0; i < 3; i++) {
      const gx = 72 + i * 24 + Math.sin(state.time * 1.4 + i) * 4;
      const gy = 150 + (i % 2) * 10;
      px(ctx, gx, gy, 10, 4, '#f4f0dc');
      px(ctx, gx + 7, gy - 3, 3, 5, '#f4f0dc');
      px(ctx, gx + 10, gy - 2, 2, 1, '#e58d2a');
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
  // cars along road
  px(ctx,54,304,90,44,'#161920'); px(ctx,60,310,78,32,'#31445e');
  px(ctx,498,304,86,44,'#161920'); px(ctx,504,310,74,32,'#7e2733');
  // AJ with glowing phone showing tiny Plav
  drawPerson(ctx, 454, 166, 'aj', 'left', state.frame);
  px(ctx, 444, 177, 9, 14, '#111827');
  px(ctx, 446, 179, 5, 9, '#45ff98');
  outlineText(ctx, 'PLAV', 430, 160, '#8ffff2', 6);
  outlineText(ctx, 'SUBURBAN DREAM', 320, 392, 'rgba(60,40,20,.35)', 8, 'center');
}

function drawSatriale() {
  if (drawSceneArt(sceneArt.satriale, 640, 416)) {
    // AJ trails Augustus while the pork-store regulars work, lean, and react.
    drawPerson(ctx, 350, 354, 'aj', 'up', state.frame, { pose: 'phone' });
    drawPerson(ctx, 112, 150, 'bobby', 'down', state.frame, { pose: 'lean' });
    drawPerson(ctx, 488, 148, 'artie', 'down', state.frame + 1, { pose: 'work' });
    drawPerson(ctx, 524, 314, 'irina', 'left', state.frame + 2, { pose: 'lean' });
    drawPerson(ctx, 316, 140, 'junior', 'down', state.frame + 3, { pose: 'angry' });
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
  drawPerson(ctx, 350, 354, 'aj', 'up', state.frame);
  // characters in fixed spots
  drawPerson(ctx, 112, 150, 'bobby', 'down', state.frame);
  drawPerson(ctx, 488, 148, 'artie', 'down', state.frame + 1);
  drawPerson(ctx, 524, 314, 'irina', 'left', state.frame + 2);
  drawPerson(ctx, 316, 140, 'junior', 'down', state.frame + 3);
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
  // flying produce
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
  const blink = g.invuln > 0 && Math.sin(state.time * 18) > 0;
  if (!blink) drawPerson(ctx, g.x - 8, g.y - 14, 'augustus', 'down', state.frame);
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
  px(ctx, x, y, 38, 30, '#161a20');
  px(ctx, x + 3, y + 4, 32, 20, state.flags.tvChannel === 3 ? '#315aa8' : state.flags.tvChannel ? '#332b32' : '#263141');
  if (state.flags.tvChannel === 1) {
    px(ctx, x + 5, y + 8, 12, 6, '#5f6a78');
    px(ctx, x + 22, y + 7, 8, 8, '#d8d3c0');
    px(ctx, x + 7, y + 18, 22, 2, '#d66b3e');
  } else if (state.flags.tvChannel === 2) {
    px(ctx, x + 5, y + 7, 10, 10, '#f0c0d8');
    px(ctx, x + 19, y + 8, 12, 5, '#c7c7c7');
  } else if (state.flags.tvChannel === 3) {
    px(ctx, x + 7, y + 7, 6, 13, '#d8d1bd');
    px(ctx, x + 18, y + 6, 5, 14, '#d8d1bd');
    px(ctx, x + 27, y + 8, 4, 12, '#d8d1bd');
    outlineText(ctx, 'ROME', x + 6, y + 18, '#ffd34f', 5);
  } else {
    for (let i = 0; i < 14; i++) px(ctx, x + 5 + (i * 7) % 27, y + 6 + (i * 5) % 15, 2, 2, i % 2 ? '#fff' : '#5e6f82');
  }
  px(ctx, x + 10, y + 30, 18, 4, '#101318');
}

function drawHouse() {
  if (drawSceneArt(sceneArt.house, 640, 416)) {
    // Interactive channels and characters sit over the illustrated room art.
    drawTV(214, 30);
    // Plav's stream glows inside AJ's monitor.
    px(ctx, 414, 31, 66, 26, '#101820');
    px(ctx, 418, 35, 58, 18, '#1d4d67');
    // Tiny streamer face clipped visually to the monitor.
    px(ctx, 438, 37, 16, 14, '#d99b68');
    px(ctx, 436, 34, 20, 5, '#151312');
    px(ctx, 441, 42, 3, 2, '#111');
    px(ctx, 449, 42, 3, 2, '#111');
    px(ctx, 443, 48, 7, 2, '#6f3c2d');
    px(ctx, 486, 34, 20, 10, '#78ff9b');
    drawFramedPhoto(sceneArt.cousinTony, 560, 22, 48, 42);
    // AJ leans into the desk instead of standing in empty space.
    drawPerson(ctx, 486, 86, 'aj', 'left', state.frame, { pose: 'lean' });
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
  if (drawSceneArt(sceneArt.rome, 800, 440)) {
    // Living “empty-square” stream performance and imperial court over the illustrated forum.
    drawPerson(ctx, 266, 228, 'plav', 'down', state.frame, { pose: 'perform' });
    drawPerson(ctx, 212, 284, 'guard', 'up', state.frame, { pose: 'watch' });
    drawPerson(ctx, 238, 296, 'meadow', 'up', state.frame + 2, { pose: 'watch' });
    drawPerson(ctx, 296, 296, 'carmela', 'up', state.frame + 3, { pose: 'watch' });
    drawPerson(ctx, 326, 284, 'aj', 'up', state.frame + 4, { pose: 'watch' });
    drawPerson(ctx, 660, 150, 'augustus', 'down', state.frame, { pose: 'imperial' });
    drawPerson(ctx, 724, 154, 'guard', 'down', state.frame, { pose: 'guard' });
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
  drawPerson(ctx, 252, 236, 'plav', 'down', state.frame);
  px(ctx, 238, 210, 58, 5, '#9a623b');
  px(ctx, 238, 281, 58, 5, '#9a623b');
  px(ctx, 238, 210, 5, 76, '#9a623b');
  px(ctx, 291, 210, 5, 76, '#9a623b');
  drawPerson(ctx, 206, 274, 'guard', 'up', state.frame);
  drawPerson(ctx, 230, 286, 'meadow', 'up', state.frame + 2);
  drawPerson(ctx, 286, 286, 'carmela', 'up', state.frame + 3);
  drawPerson(ctx, 316, 274, 'aj', 'up', state.frame + 4);
  outlineText(ctx, 'LIVE-ish', 244, 198, '#7b2f23', 7);

  // Augustus dais
  px(ctx, 690, 130, 84, 52, '#c4b48e');
  px(ctx, 700, 140, 64, 32, '#e4d7b7');
  drawPerson(ctx, 660, 150, 'augustus', 'down', state.frame);
  drawPerson(ctx, 724, 154, 'guard', 'down', state.frame);
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
    if (!state.flags.hasBat) drawBat(ctx, 288, 230, -0.7);
    // The apartment group is staged in poses instead of a standing line-up.
    drawPerson(ctx, 108, 226, 'jerry', 'right', state.frame, { pose: 'sit' });
    if (state.flags.aptStep >= 2 || state.flags.hasBat) drawPerson(ctx, 350, 282, 'george', 'up', state.frame, { pose: 'sit' });
    if (state.flags.kramerIn) drawPerson(ctx, 500, 116, 'kramer', 'down', state.frame + 2, { pose: 'burst' });
    if (state.flags.elaineIn) drawPerson(ctx, 146, 230, 'elaine', 'left', state.frame + 1, { pose: 'sit' });
    // Recognizable apartment details: cereal shelf, Superman figurine, and the bike by the entry.
    for (let i = 0; i < 5; i++) {
      px(ctx, 52 + i * 16, 106, 11, 17, ['#d94b35','#f0c84d','#4d88c9','#65a848','#c65ca2'][i]);
      px(ctx, 54 + i * 16, 109, 7, 3, '#fff2c8');
    }
    px(ctx, 174, 82, 5, 10, '#2457a8');
    px(ctx, 174, 78, 5, 5, '#d8a077');
    px(ctx, 171, 84, 11, 3, '#c73432');
    // bicycle silhouette near the purple door
    ctx.strokeStyle = '#263b4d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(548, 126, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(574, 126, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(548,126); ctx.lineTo(560,108); ctx.lineTo(574,126); ctx.lineTo(558,126); ctx.lineTo(548,126); ctx.moveTo(560,108); ctx.lineTo(566,100); ctx.stroke();
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
  drawPerson(ctx, 130, 170, 'jerry', 'down', state.frame);
  if (state.flags.aptStep >= 2 || state.flags.hasBat) drawPerson(ctx, 350, 282, 'george', 'up', state.frame);
  if (state.flags.kramerIn) drawPerson(ctx, 500, 116, 'kramer', 'down', state.frame + 2);
  if (state.flags.elaineIn) drawPerson(ctx, 468, 138, 'elaine', 'down', state.frame + 1);
  outlineText(ctx, 'APARTMENT 5A', 320, 396, 'rgba(80,40,20,.25)', 8, 'center');
}

function drawClub() {
  if (drawSceneArt(sceneArt.club, 640, 416)) {
    drawTurkey(ctx, 320, 204, 1.6, true);
    // Crew members sit around the private table with individual idle motion.
    drawPerson(ctx, 250, 156, 'christopher', 'down', state.frame, { pose: 'sit' });
    drawPerson(ctx, 390, 156, 'paulie', 'down', state.frame + 1, { pose: 'sit' });
    drawPerson(ctx, 320, 126, 'silvio', 'down', state.frame + 2, { pose: 'sit' });
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
  drawPerson(ctx, 232, 154, 'christopher', 'down', state.frame);
  drawPerson(ctx, 404, 154, 'paulie', 'down', state.frame + 1);
  drawPerson(ctx, 320, 118, 'silvio', 'down', state.frame + 2);
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
  drawPerson(ctx, state.player.x, state.player.y, kind, state.player.dir, state.frame);
  if (state.flags.hasBat && state.scene === 'apartment') drawBat(ctx, state.player.x + 17, state.player.y + 11, -0.7);
}

function drawWorld() {
  const scene = scenes[state.scene];
  if (!scene) return;
  ctx.save();
  ctx.translate(-Math.round(state.camera.x), -Math.round(state.camera.y));
  scene.draw();
  drawPlayer();
  ctx.restore();
  // location badge
  drawPanel(8, 42, 172, 25, '#182448', '#92896f');
  outlineText(ctx, scene.label, 16, 50, '#ddd5bd', 7);
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
  drawPerson(ctx, 235, 120, state.player.kind, 'down', state.frame);
  // giant reflection face
  px(ctx, 376, 76, 104, 118, '#c8875f');
  px(ctx, 382, 82, 92, 24, '#2a211e');
  px(ctx, 392, 126, 18, 8, '#111');
  px(ctx, 444, 126, 18, 8, '#111');
  px(ctx, 404, 164, 48, 8, '#70422f');
  px(ctx, 384, 186, 88, 10, '#9b5f42');
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
  for (const v of g.vials) drawVial(ctx, v.x, v.y, g.time, v.kind);
  drawPerson(ctx, g.x - 8, g.y - 12, state.player.kind, 'down', state.frame);
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
  px(ctx, x - 14, y - 20, 28, 40, '#161920');
  px(ctx, x - 11, y - 17, 22, 34, color);
  px(ctx, x - 8, y - 11, 16, 9, '#78a9c8');
  px(ctx, x - 8, y + 4, 16, 8, '#32445a');
  px(ctx, x - 16, y - 13, 4, 9, '#111');
  px(ctx, x + 12, y - 13, 4, 9, '#111');
  px(ctx, x - 16, y + 8, 4, 9, '#111');
  px(ctx, x + 12, y + 8, 4, 9, '#111');
  if (target) px(ctx, x - 8, y - 26, 16, 3, '#ffe06e');
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
    } else {
      drawCar(o.x, o.y, '#59624a');
      drawPerson(ctx, o.x - 7, o.y - 16, 'paulie', 'down', state.frame);
    }
  }
  if (d.boost > 0) {
    for (let i = 0; i < 4; i++) px(ctx, d.x - 10 + i * 6, d.y + 22 + i * 5, 3, 12, i % 2 ? '#ffb13e' : '#f4e27a');
  }
  drawCar(d.x, d.y, d.boost > 0 ? '#b82835' : '#8f1f2e');
  ctx.restore();
  // HUD
  drawPanel(10, 10, 280, 44, '#141f3a', '#e5c36a');
  outlineText(ctx, `CHASE ${Math.floor(d.progress)}%`, 20, 19, '#ffe78a', 10);
  px(ctx, 20, 38, 180, 7, '#30384d');
  px(ctx, 20, 38, Math.min(180, d.progress * 1.8), 7, '#e45445');
  outlineText(ctx, `♥ ${d.health}`, 216, 31, '#ff8e8e', 10);
  if (d.boost > 0) {
    px(ctx, 306, 18, 110, 14, '#173521');
    px(ctx, 308, 20, Math.min(106, d.boost / 2.7 * 106), 10, '#69e26e');
    outlineText(ctx, 'MONEY BOOST', 361, 21, '#102415', 7, 'center');
  }
  outlineText(ctx, 'Grab money envelopes for speed · dodge gabagool, Janice, and Paulie', 320, 340, '#fff', 8, 'center');
}

function drawTitle() {
  px(ctx, 0, 0, W, H, '#11162f');
  // comic four-panel backdrop
  const panels = [
    [18, 40, 140, 92, '#7a5139', 'NEW JERSEY'],
    [172, 40, 140, 92, '#d1b98d', 'ROME'],
    [326, 40, 140, 92, '#4c4f55', 'THE CHASE'],
    [480, 40, 140, 92, '#614145', '5A']
  ];
  for (const [x, y, w, h, c, label] of panels) {
    drawPanel(x, y, w, h, c, '#594b39');
    outlineText(ctx, label, x + w / 2, y + 8, '#ffe5a0', 8, 'center');
  }
  drawPerson(ctx, 68, 85, 'tony', 'down', state.frame);
  drawTurkey(ctx, 122, 112, 1.1, true);
  drawPerson(ctx, 224, 78, 'augustus', 'down', state.frame);
  drawPerson(ctx, 270, 92, 'plav', 'down', state.frame);
  drawCar(396, 110, '#8f1f2e');
  drawPerson(ctx, 516, 84, 'jerry', 'down', state.frame);
  drawPerson(ctx, 558, 84, 'kramer', 'down', state.frame + 2);
  drawPerson(ctx, 594, 94, 'george', 'down', state.frame + 1);

  outlineText(ctx, 'TONY SOPRANO', W / 2, 162, '#ffd34f', 25, 'center');
  outlineText(ctx, 'THANKSGIVING', W / 2, 194, '#fff4c8', 28, 'center');
  outlineText(ctx, 'A linear pixel-art holiday misadventure', W / 2, 232, '#c8d7ff', 10, 'center');
  const blink = Math.sin(state.time * 5) > 0;
  if (blink) outlineText(ctx, 'PRESS E / SPACE / A TO START', W / 2, 284, '#8ffff2', 11, 'center');
  outlineText(ctx, 'Laptop: WASD/arrows + E · Mobile: touch stick + A', W / 2, 316, '#aeb8d8', 8, 'center');
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
  outlineText(ctx, 'A/E: Paulie on The Bachelor   ·   B: Augustus in New Jersey', 320, 302, '#ffe78a', 8, 'center');
  outlineText(ctx, 'F: FREE ROAM North Caldwell', 320, 316, '#8ffff2', 9, 'center');
  if (Math.sin(state.time * 5) > 0) outlineText(ctx, 'R replays the story', 320, 334, '#aeb8d8', 8, 'center');
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

  drawAtmosphere();
  if (!['title', 'ending', 'dream', 'bone', 'peptides', 'drive', 'bonus', 'produce'].includes(state.mode)) drawObjective();
  if (state.mode === 'explore') drawPrompt(nearestInteraction());
  drawPhoneIncoming();
  drawDialog();
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
  audio.setMusic('title');
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
  if (consume(['KeyM'])) {
    const on = audio.toggle();
    document.getElementById('muteBtn').textContent = on ? 'Sound' : 'Muted';
  }
  if (state.help && consume(cancelCodes)) state.help = false;
  if (!['title', 'ending'].includes(state.mode) && consume(['KeyR'])) {
    resetGame();
    pressed.clear();
    return;
  }

  if (state.mode === 'title') {
    if (interactPressed()) startGame();
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
      objective('Walk through Rome and meet Augustus');
      state.mode = 'explore';
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
