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
const carSprites = {};
const CAR_SPRITE_MAP = {
  '#8f1f2e': 'sedan', '#7e2733': 'sedan', '#a02828': 'corvette', '#e8b822': 'cab',
  '#2848a0': 'cruiser', '#e8e4da': 'mailtruck', '#b8a888': 'wagon', '#3d6b35': 'sedan-green2',
  '#4a5e78': 'sedan-bluegray', '#6e5540': 'sedan-brown', '#556b4f': 'sedan-green', '#7a4a55': 'sedan-maroon',
  '#e8e4d8': 'mailtruck', '#dcd8cc': 'mailtruck', '#c03838': 'corvette', '#31445e': 'sedan-bluegray'
};
for (const n of ['sedan', 'corvette', 'cab', 'cruiser', 'mailtruck', 'wagon', 'sedan-bluegray', 'sedan-brown', 'sedan-green', 'sedan-maroon', 'sedan-green2']) {
  carSprites[n] = loadArt('./assets/cars/' + n + '.webp');
}

const sceneArt = {
  house: loadArt('./assets/bg-house-v2.webp'),
  hub: loadArt('./assets/bg-njhub.webp'),
  nyc: loadArt('./assets/bg-nyc.webp'),
  pines: loadArt('./assets/bg-pines.webp'),
  bodega: loadArt('./assets/bg-bodega.webp'),
  shore: loadArt('./assets/bg-shore.webp'),
  hubeast: loadArt('./assets/bg-hubeast.webp'),
  apartment: loadArt('./assets/bg-apartment-v2.webp'),
  vesuvio: loadArt('./assets/bg-vesuvio.webp'),
  costanza: loadArt('./assets/bg-costanza.webp'),
  njstreet: loadArt('./assets/bg-njstreet.webp'),
  diner: loadArt('./assets/bg-diner.webp'),
  dmv: loadArt('./assets/bg-dmv.webp'),
  mgPoker: loadArt('./assets/mg-poker.webp'),
  mgKitchen: loadArt('./assets/mg-kitchen.webp'),
  mgBlackjack: loadArt('./assets/mg-blackjack.webp'),
  mgPinball: loadArt('./assets/mg-pinball.webp'),
  mgSkeeball: loadArt('./assets/mg-skeeball.webp'),
  mgDarts: loadArt('./assets/mg-darts.webp'),
  mgMonte: loadArt('./assets/mg-monte.webp'),
  mgRoulette: loadArt('./assets/mg-roulette.webp'),
  mgSlots: loadArt('./assets/mg-slots.webp'),
  mgDanceoff: loadArt('./assets/mg-danceoff.webp'),
  mgHorsetrack: loadArt('./assets/mg-horsetrack.webp'),
  ac: loadArt('./assets/bg-ac.webp'),
  map: loadArt('./assets/bg-map.webp'),
  casino: loadArt('./assets/bg-casino.webp'),
  cabin: loadArt('./assets/bg-cabin.webp'),
  meadow: loadArt('./assets/bg-meadow.webp'),
  queens: loadArt('./assets/bg-queens.webp'),
  taffy: loadArt('./assets/bg-taffy.webp'),
  slice: loadArt('./assets/bg-slice.webp'),
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
  if (state.mode === 'fasttravel') {
    const rect = canvas.getBoundingClientRect();
    const vx = (e.clientX - rect.left) / rect.width * W;
    const vy = (e.clientY - rect.top) / rect.height * H;
    if (vx <= 52 && vy <= 34) { state.mode = state.dialog ? 'dialogue' : 'explore'; pressed.clear(); audio.sfx('denied'); return; }
    for (let ni = 0; ni < FT_NODES.length; ni++) {
      const n = FT_NODES[ni];
      if (Math.hypot(vx - n.x, vy - n.y) < 24) {
        if (state.ftSel === ni) pressed.add('KeyE');
        else { state.ftSel = ni; audio.sfx('pickup'); }
        return;
      }
    }
    return;
  }
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
    if (vy >= 74 && vy <= 91 && (state.menu.scroll || 0) > 0) { state.menu.scroll -= 1; state.menu.sel = Math.max(0, state.menu.sel - 1); audio.sfx('pickup'); return; }
    if (vy >= 336 && vy <= 356 && (state.menu.scroll || 0) + 14 < entries.length) { state.menu.scroll += 1; state.menu.sel = Math.min(entries.length - 1, state.menu.sel + 1); audio.sfx('pickup'); return; }
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
bindButton('btnS', 'ShiftLeft');

document.getElementById('muteBtn').addEventListener('click', (e) => {
  audio.unlock();
  const on = audio.toggle();
  document.getElementById('muteBtn').textContent = on ? 'Sound' : 'Muted';
  e.currentTarget.blur();
});
const rotateHintEl = document.getElementById('rotateHint');
if (rotateHintEl) rotateHintEl.addEventListener('click', () => rotateHintEl.classList.add('dismissed'));
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

// one wallet — money and tribute were parallel currencies; money is now an alias of the tribute in the HUD
Object.defineProperty(state, 'money', {
  get() { return state.flags.tribute || 0; },
  set(v) { state.flags.tribute = Math.max(0, Math.round(v)); },
  configurable: true
});

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

const WORLD_FLAGS = ['humanFund','marbleRye','trashEclair','deskNap','soupLesson','fakeDisability','cheapInvites','fedGeese','pawnedWatch','elaineDance','therapyDone','marineBiologist','festivus','serenityNow','packageHeist','latexExport','oilBladder','derekMission','derekCash','derekPaid','cashStash1','cashStash2','cashStash3','tribute','boughtPaper','atePretzel','baniaBit','russianFound','pinesCarLooted','pinesTalkedPaulie','pinesTalkedChris','gooseCaught','gotCoffee','russianSeen','packageJobDone','catalogCaperDone','ryeExpressDone','pineFreshDone','libraryRunDone','serenityTapesDone','featsOfStrengthDone','calzoneProtocolDone','cottonUniformsDone','urbanSombreroDone','jPetermanBurmaDone','turkeyTaxDone','heatMagnetDone','bigSaladDone','soupNaziRunDone','muffinTopsDone','bladderRunDone','cannonballDone','bigOneDone','bigMouthDone','pineRunnerDone','gravyChainDone','fixedRaceDone','trackSystemDone','saunaSerenityDone','kramericaBookDone','bottleRunDone','feastDone','acLoan','pkg0','pkg1','pkg2','pkg3','pkg4','pkg5','pkg6','pkg7','pkg8','pkg9','pkg10','pkg11','newmanCaught','helpSeen','whaleHero','fountainDive','banked','deskNap','armoredDone','trotCd','metalChat','mailCd','mapHintShown','tailgateFood','cabinBeans','fudgeSample','cabinFound','artiesMenuDone','shrinkRapDone','paulieShoeDone','screenplayDone','engineTune','jerrysFavorDone','leoScarfDone','robCount','stash','hp','sitDownDone','bigScoreDone','soupSummitDone','noSoup','truckerSystemDone','assmanDone','dmvSeen','dmvTicket','dmvServing','interventionDone'];
function saveWorld() {
  try {
    const out = {};
    for (const k of WORLD_FLAGS) if (state.flags[k]) out[k] = state.flags[k];
    out.tribute = state.flags.tribute || 0; // zero balances must survive reloads — losses are real
    out.stash = state.flags.stash || 0; // same — an emptied mattress must stay empty
    out.money = state.money || 0;
    out.heat = state.flags.heat || 0;
    if (state.mission) out.mission = { id: state.mission.id, step: state.mission.step, steps: state.mission.steps, payout: state.mission.payout, timeLeft: state.mission.deadline ? (state.mission.deadline - state.time) : null };
    if (state.player.x !== undefined) { out.scene = state.scene; out.px = Math.round(state.player.x); out.py = Math.round(state.player.y); }
    localStorage.setItem('gabagiving-world-v1', JSON.stringify(out));
  } catch (e) { /* storage unavailable */ }
}
function loadWorld() {
  try {
    const w = JSON.parse(localStorage.getItem('gabagiving-world-v1') || '{}');
    for (const k of WORLD_FLAGS) if (w[k]) state.flags[k] = w[k];
    if (typeof w.tribute === 'number') state.flags.tribute = w.tribute;
    if (typeof w.stash === 'number') state.flags.stash = w.stash;
    if (typeof w.money === 'number' || typeof w.tribute === 'number') {
      // legacy saves had two wallets — merge them; unified saves carry identical values
      const wm = typeof w.money === 'number' ? w.money : 0;
      const wt = typeof w.tribute === 'number' ? w.tribute : 0;
      state.money = (wm !== wt) ? wm + wt : wm;
    }
    if (typeof w.heat === 'number') state.flags.heat = w.heat;
    if (w.scene && scenes[w.scene] && typeof w.px === 'number' && state.flags.freeRoam) {
      state.scene = w.scene;
      state.player.x = w.px;
      state.player.y = w.py;
    }
    const isRepeatable = ['oddJob', 'kramerJob', 'collection', 'frankJob', 'sliceJob'].includes(w.mission && w.mission.id);
    if (w.mission && MISSION_DEFS[w.mission.id] && (isRepeatable || !state.flags[w.mission.id + 'Done'])) {
      const def = MISSION_DEFS[w.mission.id];
      state.mission = {
        id: w.mission.id,
        step: Math.min(w.mission.step, def.steps.length - 1),
        deadline: ('timeLeft' in w.mission) ? (typeof w.mission.timeLeft === 'number' ? state.time + w.mission.timeLeft : null) : (def.timeLimit ? state.time + def.timeLimit : null),
        steps: (w.mission.id === 'jerrysFavor' ? def.steps : (w.mission.steps || def.steps)).map(s => ({ ...s })),
        payout: w.mission.payout || def.payout
      };
    }
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
  entries.push({
    label: 'Cell phone — jobs & messages', hint: state.mission ? 'a job is ACTIVE — check it' : 'your mission tracker',
    act: () => {
      closeMenu();
      if (state.dialog) { toast('Finish the conversation first.'); return; }
      const lines = [];
      if (state.mission) {
        const def = MISSION_DEFS[state.mission.id] || {};
        const st = (state.mission.steps || def.steps || [])[state.mission.step] || {};
        lines.push({ speaker: 'system', text: `CURRENT JOB: ${def.title || state.mission.id} — ${st.objective || 'see it through'}${state.mission.payout ? ` ($${state.mission.payout})` : ''}` });
        if (st.label) lines.push({ speaker: 'system', text: `Next stop: ${st.label}. Follow the pulsing beacon — or the edge arrow when it’s off-screen.` });
      } else {
        lines.push({ speaker: 'system', text: 'No active job. Talk to people with a ! overhead — the world is hiring.' });
        const work = [];
        if (state.flags.bigOneDone) work.push('Newman (neighborhood) — odd jobs, the mail never ends');
        if (state.flags.kramericaBookDone) work.push('Kramer (Manhattan) — Kramerica errands');
        if (state.flags.fixedRaceDone) work.push('Silvio (the Bing) — collections');
        if (state.flags.saunaSerenityDone) work.push('Frank (Queens) — Festivus errands');
        work.push('The counter guy at Ray’s (Manhattan) — pie deliveries, ALWAYS hiring');
        work.push('The chop shop (Meadowlands, drive in) — cash for borrowed cars');
        if (!state.flags.freeRoam) lines.push({ speaker: 'system', text: 'You’re mid-story — the work directory unlocks in the open world. MENU → Open world anytime.' });
        else if (work.length) {
          lines.push({ speaker: 'system', text: 'REPEATABLE WORK:' });
          for (const wl of work) lines.push({ speaker: 'system', text: '· ' + wl });
        }
        else lines.push({ speaker: 'system', text: 'Nothing repeatable yet — finish story jobs and the phone fills up with work.' });
      }
      const doneCnt = ['packageJobDone','bigSaladDone','ryeExpressDone','turkeyTaxDone','bigMouthDone','gravyChainDone','fixedRaceDone','serenityTapesDone','featsOfStrengthDone','saunaSerenityDone','calzoneProtocolDone','cottonUniformsDone','kramericaBookDone','artiesMenuDone','shrinkRapDone','paulieShoeDone','screenplayDone','jerrysFavorDone','trackSystemDone'].filter(f => state.flags[f]).length;
      lines.push({ speaker: 'system', text: `Career: ${doneCnt} jobs finished, ${state.stats.carsStolen || 0} cars borrowed, $${state.money} on hand${state.flags.stash ? ` (+$${state.flags.stash} in the mattress)` : ''}, heat ${(state.flags.heat || 0).toFixed(1)}/5.` });
      lines.push({ speaker: 'narrator', text: 'The phone is a 2004 flip phone. It has one game. The game is Snake. You do not have time for Snake. You are IN Snake.' });
      startDialog(lines);
    }, open: true
  });
  entries.push({
    label: 'World map — pick a destination', hint: 'the big Garden State atlas, tap a place twice',
    act: () => {
      closeMenu();
      state.mode = 'fasttravel';
      state.ftSel = 0;
      pressed.clear();
    }, open: true
  });
  if (!state.flags.freeRoam) entries.push({
    label: 'Open world — skip to free roam', hint: 'the whole state, right now — story optional',
    act: () => {
      closeMenu();
      state.flags.sandbox = true;
      enterHub(false);
      objective('Free roam: choose a landmark — press T or MENU for the map');
    }, open: true
  });
  if (state.flags.freeRoam) entries.push({
    label: 'Criminal record', hint: 'your career in numbers — the feds wish they had this',
    act: () => {
      closeMenu();
      const s = state.stats || {};
      const lines = [
        { speaker: 'narrator', text: `CRIMINAL RECORD — ${state.player.kind === 'george' ? 'Costanza, George L.' : 'Soprano, Anthony J.'} — compilation of the season’s activities to date:` },
        { speaker: 'system', text: `Cars “borrowed”: ${s.carsStolen || 0} · Punches thrown: ${s.punches || 0} · Missions completed: ${s.missions || 0}` },
        { speaker: 'system', text: `Cash on hand: $${state.money} · Current heat: ${(state.flags.heat || 0).toFixed(1)} stars · Gabagool packages: ${[0,1,2,3,4,5,6,7,8,9,10,11].filter(i => state.flags['pkg' + i]).length}/12` },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'This is a résumé! If you squint, and lie, and notarize it — it’s a RÉSUMÉ!' : 'You know what the feds got? Paperwork. What I got? A legacy. Big difference. Both admissible, unfortunately.' }
      ];
      startDialog(lines);
    }, open: true
  });
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

function drawToast() {
  const tm = state.toastMsg;
  if (!tm) return;
  ctx.font = '10px monospace';
  const maxW = 540;
  const words = String(tm.text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  const h2 = 16 + lines.length * 13;
  const w2 = Math.min(600, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 30);
  const y0 = 330 - h2;
  ctx.fillStyle = 'rgba(10,10,16,.88)';
  ctx.fillRect((640 - w2) / 2, y0, w2, h2);
  ctx.strokeStyle = '#d4a017';
  ctx.strokeRect((640 - w2) / 2, y0, w2, h2);
  ctx.fillStyle = '#f5efdc';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, 320, y0 + 16 + i * 13));
  ctx.textAlign = 'left';
}

function drawTrot() {
  const tr = state.trot;
  if (!tr) return;
  const wps = [[250, 200], [600, 200], [600, 370], [250, 370]];
  if (tr.wp < wps.length) {
    const wp = wps[tr.wp % wps.length];
    const pulse = 3 + Math.sin(state.time * 5) * 2;
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wp[0], wp[1], 16 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = 'rgba(8,10,16,.85)';
  ctx.fillRect(240, 8, 160, 26);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TROT ' + Math.min(tr.wp, 4) + '/4 — ' + Math.max(0, tr.limit - tr.t).toFixed(0) + 's', 320, 25);
  ctx.textAlign = 'left';
}

function drawFishing() {
  const f = state.fishing;
  if (!f) return;
  ctx.fillStyle = 'rgba(8,10,16,.85)';
  ctx.fillRect(190, 300, 260, 44);
  ctx.strokeStyle = '#8fd8ff';
  ctx.strokeRect(190, 300, 260, 44);
  ctx.fillStyle = '#f5efdc';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  if (f.phase === 'cast') ctx.fillText('…waiting for a bite…', 320, 325);
  else {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('BITE! — press E NOW!', 320, 325);
  }
  ctx.textAlign = 'left';
}

function drawClaw() {
  const cl = state.claw;
  if (!cl) return;
  ctx.fillStyle = 'rgba(8,6,12,.9)';
  ctx.fillRect(170, 70, 300, 260);
  ctx.strokeStyle = '#d4a017';
  ctx.strokeRect(170, 70, 300, 260);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CLAW MACHINE — $5', 320, 94);
  const px0 = 200, pw = 240;
  // prize pit
  ctx.fillStyle = '#2a2030';
  ctx.fillRect(px0, 240, pw, 60);
  const prizeX = px0 + cl.prize * pw;
  px(ctx, prizeX - 8, 264, 16, 14, '#c05a3a');
  px(ctx, prizeX - 8, 264, 16, 4, '#8a2f23');
  // rail + claw
  px(ctx, px0, 120, pw, 4, '#555');
  const cx = px0 + cl.x * pw;
  if (cl.phase === 'aim') {
    px(ctx, cx - 2, 110, 4, 120, '#999');
    px(ctx, cx - 8, 226, 16, 10, '#d4a017');
    ctx.fillStyle = '#f5efdc';
    ctx.font = '10px monospace';
    ctx.fillText('←→ move · E drop · ' + Math.max(0, cl.t).toFixed(1) + 's', 320, 320);
  } else {
    const prog = 1 - cl.dropT / 1.3;
    const clawY = 110 + prog * 130;
    px(ctx, cx - 2, 110, 4, clawY - 104, '#999');
    px(ctx, cx - 8, clawY, 16, 10, '#d4a017');
    ctx.fillStyle = '#f5efdc';
    ctx.font = '10px monospace';
    ctx.fillText('…', 320, 320);
  }
  ctx.textAlign = 'left';
}

function drawTrivia() {
  const tv = state.trivia;
  if (!tv) return;
  const q = tv.qs[tv.i];
  ctx.fillStyle = 'rgba(8,6,12,.92)';
  ctx.fillRect(130, 90, 380, 220);
  ctx.strokeStyle = '#d4a017';
  ctx.strokeRect(130, 90, 380, 220);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`TRIVIA NIGHT — Q${tv.i + 1}/3`, 320, 116);
  ctx.fillStyle = '#f5efdc';
  ctx.font = '11px monospace';
  if (q) {
    const lines = wrapText(ctx, q.q, 320, 11);
    lines.forEach((ln, li) => ctx.fillText(ln, 320, 146 + li * 14));
    if (tv.resultT > 0) {
      ctx.fillStyle = tv.lastCorrect ? '#7ad47a' : '#d47a7a';
      ctx.fillText(tv.lastCorrect ? 'CORRECT!' : `wrong — it was “${q.a}”`, 320, 216);
    } else {
      ctx.fillStyle = tv.pick === 0 ? '#ffd23e' : '#f5efdc';
      ctx.fillText('◀ ' + q.opts[0], 320, 200);
      ctx.fillStyle = tv.pick === 1 ? '#ffd23e' : '#f5efdc';
      ctx.fillText(q.opts[1] + ' ▶', 320, 224);
      ctx.fillStyle = '#888';
      ctx.font = '9px monospace';
      ctx.fillText('←→ choose · E answer · Q bail', 320, 256);
    }
  }
  ctx.textAlign = 'left';
}

const FT_NODES = [
  { id: 'hub', x: 408, y: 82, dx: 320, dy: 250, name: 'North Caldwell', flavor: 'GARDEN STATE PARKWAY', desc: 'the neighborhood — Newman, Satriale\'s, Vesuvio' },
  { id: 'nyc', x: 475, y: 50, dx: 300, dy: 250, name: 'Manhattan', flavor: 'HOLLAND TUNNEL', desc: 'Monk\'s, the soup stand, Jerry\'s, the bodega' },
  { id: 'meadow', x: 442, y: 108, dx: 300, dy: 250, name: 'The Meadowlands', flavor: 'ROUTE 3 · RACE DAY', desc: 'the track, the tailgate, the stadium — real ponies' },
  { id: 'queens', x: 562, y: 56, dx: 300, dy: 250, name: 'Queens', flavor: 'THE 7 TRAIN', desc: 'the Costanzas, the sauna, the shampoo factory' },
  { id: 'pines', x: 316, y: 212, dx: 300, dy: 250, name: 'Pine Barrens', flavor: 'GSP SOUTH — EXIT 63', desc: 'the woods. nobody looks inside the box' },
  { id: 'shore', x: 452, y: 184, dx: 300, dy: 250, name: 'The Shore', flavor: 'EXIT 88 — THE BOARDWALK', desc: 'off-season boardwalk, skeeball, the pier' },
  { id: 'ac', x: 416, y: 282, dx: 300, dy: 250, name: 'Atlantic City', flavor: 'AC EXPRESSWAY', desc: 'neon, high-roller slots, the loan shark' }
];

function drawFastTravel() {
  // the painted Garden State atlas
  ctx.fillStyle = '#0a0f16';
  ctx.fillRect(0, 0, 640, 360);
  if (sceneArt.map && sceneArt.map.complete && sceneArt.map.naturalWidth) {
    ctx.drawImage(sceneArt.map, 0, 0, 640, 360);
    ctx.fillStyle = 'rgba(6,10,18,.25)';
    ctx.fillRect(0, 0, 640, 360);
  } else {
    ctx.fillStyle = '#0e1a12';
    ctx.fillRect(14, 8, 612, 344);
  }
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 632, 352);

  // region nodes
  FT_NODES.forEach((n, i) => {
    const sel = i === (state.ftSel || 0);
    const here = n.id === state.scene;
    const pulse = (Math.sin(state.time * 4) + 1) / 2;
    if (sel) {
      ctx.strokeStyle = `rgba(255,210,62,${.45 + pulse * .5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 13 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = here ? '#3a6' : sel ? '#ffd23e' : '#c33';
    ctx.beginPath();
    ctx.arc(n.x, n.y, sel ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // label backing for readability over the painted map
    const label = n.name + (here ? '  ★ you are here' : '');
    ctx.font = (sel ? 'bold ' : '') + '9px monospace';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(6,10,18,.72)';
    ctx.fillRect(n.x - tw / 2 - 3, n.y - 22, tw + 6, 11);
    ctx.fillStyle = sel || here ? '#fff3c4' : '#ddd';
    ctx.fillText(label, n.x, n.y - 13);
  });

  // active mission objective pulses on the atlas
  if (state.mission && MISSION_DEFS[state.mission.id]) {
    const mstep = missionStep();
    if (mstep) {
      const hostRegion = { club: 'hub', vesuvio: 'hub', satriale: 'hub', house: 'hub', monks: 'nyc', soup: 'nyc', apartment: 'nyc', bodega: 'nyc', yankees: 'nyc', slice: 'nyc', costanza: 'queens', cabin: 'pines', taffy: 'shore', casino: 'ac' };
      const targetScene = hostRegion[mstep.scene] || mstep.scene;
      const target = FT_NODES.find((n) => n.id === targetScene);
      if (target) {
        const mp = (Math.sin(state.time * 5) + 1) / 2;
        ctx.strokeStyle = `rgba(255,90,90,${.5 + mp * .5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(target.x, target.y - 22 - mp * 4);
        ctx.lineTo(target.x + 9, target.y - 8 - mp * 4);
        ctx.lineTo(target.x, target.y + 6 - mp * 4);
        ctx.lineTo(target.x - 9, target.y - 8 - mp * 4);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#ff9a9a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OBJECTIVE', target.x, target.y - 28 - mp * 4);
      }
    }
  }

  // header + footer backing bar
  ctx.fillStyle = 'rgba(6,10,18,.78)';
  ctx.fillRect(0, 0, 640, 24);
  ctx.fillRect(0, 316, 640, 44);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE GARDEN STATE — THANKSGIVING EVE', 320, 17);
  const cur = FT_NODES[state.ftSel || 0];
  if (cur) {
    ctx.fillStyle = '#9ab';
    ctx.font = '9px monospace';
    ctx.fillText(cur.desc, 320, 332);
    ctx.fillStyle = '#e8722a';
    ctx.fillText('route: ' + cur.flavor, 320, 344);
  }
  ctx.fillStyle = '#888';
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(usingTouchControls ? 'tap a place twice to drive there' : '↑↓ or CLICK choose · E travel · T close', 12, 344);
  // touch close button — top right
  ctx.fillStyle = 'rgba(180,40,40,.85)';
  ctx.fillRect(10, 8, 34, 22);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(10, 8, 34, 22);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('✕', 27, 23);
  ctx.textAlign = 'left';
  ctx.textAlign = 'left';
}

const EXIT_HINTS = {
  hub: '→ EAST: Holland Tunnel to Manhattan · ↓ SOUTH: Parkway to the Pines, Shore & AC · map in MENU',
  nyc: '← WEST: tunnel home to Jersey · map in MENU',
  pines: '↑ NORTH: back to the neighborhood · → EAST: the Shore · map in MENU',
  shore: '← WEST: the Pine Barrens · → EAST: Atlantic City · map in MENU',
  ac: '← WEST: the Shore · map in MENU',
  meadow: '← WEST: Route 3 home · EAST: tunnel to Manhattan · map in MENU',
  queens: '← WEST: subway to Manhattan · map in MENU',
  njstreet: 'map in MENU · the neighborhood hub is the center of everything'
};

function drawExitHints() {
  const hint = EXIT_HINTS[state.scene];
  if (!hint || !state.flags.freeRoam) return;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  const w = ctx.measureText(hint).width + 16;
  ctx.fillStyle = 'rgba(8,10,16,.55)';
  ctx.fillRect(320 - w / 2, 344, w, 14);
  ctx.fillStyle = '#cfe3ff';
  ctx.fillText(hint, 320, 354);
  ctx.textAlign = 'left';
}

function drawHelp() {
  if (!state.help) return;
  drawPanel(150, 64, 340, 196, '#121a35', '#e8e2c8');
  outlineText(ctx, 'CONTROLS', 320, 78, '#ffd34f', 12, 'center');
  outlineText(ctx, 'Move: WASD / Arrow keys / touch stick', 174, 104, '#fff', 9);
  outlineText(ctx, 'Interact / advance: E, Space, Enter, or A', 174, 122, '#fff', 9);
  outlineText(ctx, 'Minigames: use the same action button', 174, 140, '#fff', 9);
  outlineText(ctx, 'B switches Tony / George in free roam', 174, 158, '#fff', 9);
  outlineText(ctx, 'F: PUNCH people (some fight back!) · horn in cars', 174, 170, '#ffe78a', 9);
  outlineText(ctx, 'Shift / RUN button: sprint · mattress at home hides cash from busted fines', 174, 182, '#fff', 9);
  outlineText(ctx, 'MENU: world map · cell phone jobs · open world anytime', 174, 194, '#fff', 9);
  outlineText(ctx, 'H or ? toggles this card — cheats exist. Type them.', 174, 206, '#fff', 9);
  const st = state.stats;
  outlineText(ctx, `lifetime: ${st.punches || 0} punches · ${st.carsStolen || 0} cars borrowed · ${st.missions || 0} missions`, 320, 214, '#8fb8ff', 8, 'center');
  outlineText(ctx, 'Click ? again to close', 320, 228, '#ffe78a', 8, 'center');
}

// ---------- Scene data ----------
function r(x, y, w, h) { return { x, y, w, h }; }
function costanzaInteractions() {
  return [
  { x: 340, y: 120, w: 44, h: 30, radius: 42, label: 'The marble rye', action: () => {
    audio.sfx('pickup');
    startDialog([
      { speaker: 'narrator', text: 'A marble rye sits on the windowsill, cooling like a crime scene. Nobody knows how it got here. Somebody knows exactly how it got here. Nobody is asking, because asking means hearing the story, and the story takes forty minutes.' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I don’t know anything about a rye. Why would you ask ME? Who told you?! WAS IT FRANK?' : 'That’s a nice-looking rye. In my family, bread on a windowsill means somebody owes somebody. Here it probably means the same thing, somehow.' }
    ]);
  } },
  { x: 480, y: 90, w: 44, h: 34, radius: 40, label: 'Frank’s computer', action: () => {
    audio.sfx('pickup');
    startDialog([
      { speaker: 'narrator', text: 'Frank Costanza’s computer: a 1997 desktop running a solitaire win streak of 41 games and a document titled SERENITY NOW — VOLUME 2 (LOUDER). The mouse is taped to the desk. For control.' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He’s been writing the sequel! “Serenity now, insanity later” was just VOLUME ONE! I’m in the acknowledgments! WHY AM I IN THE ACKNOWLEDGMENTS?' : 'Guy’s got a system for solitaire, rage issues, and a son who lives at home. Frank Costanza is three bad breaks from being in my crew.' }
    ]);
  } },
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
    } else if (!state.mission && state.flags.saunaSerenityDone && state.flags.freeRoam) {
      const errands = [
        { x: 390, y: 160, radius: 50, objective: 'Check the sauna — a man was WHISTLING in it. Confirm the acoustics', name: 'the sauna', line: 'That sauna is stealing my SERENITY and some maniac is WHISTLING in it! Go confirm the acoustics are criminal!' },
        { x: 120, y: 300, radius: 50, objective: 'Inspect the neighbor’s new lawn gnome — measure it', name: 'the gnome', line: 'The Fudges got a LAWN GNOME. It faces OUR house. It faces our house, George! Go measure it! There are HEIGHT ORDINANCES!' },
        { x: 500, y: 250, radius: 50, objective: 'Price aluminum poles at the hardware lot — IN WRITING', name: 'the poles', line: 'Festivus is coming and I need POLE PRICES in WRITING! Last year they gouged me! ALUMINUM! Very high strength-to-weight ratio!' }
      ];
      const err = errands[Math.floor(Math.random() * errands.length)];
      const rolledPayF = 45 + Math.floor(Math.random() * 30);
      startMission('frankJob');
      state.mission.payout = rolledPayF;
      state.mission.steps = [
        { scene: 'queens', x: err.x, y: err.y, radius: err.radius, objective: err.objective, label: err.name },
        { scene: 'costanza', x: 140, y: 140, radius: 60, objective: 'Report back to Frank', label: 'Frank' }
      ];
      startDialog([
        { speaker: 'womanB', text: err.line },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I live thirty-seven years in this house and THIS is my inheritance — errands with VOLUME!' : 'This man’s a natural earner. Everything’s a scheme, everything’s an emergency.' },
        { speaker: 'system', text: `Mission accepted: THE FESTIVUS ERRAND. Repeatable — serenity never lasts. $${rolledPayF}.` }
      ]);
    } else if (!state.mission && state.flags.featsOfStrengthDone && !state.flags.saunaSerenityDone && state.flags.freeRoam) {
      startMission('saunaSerenity');
      startDialog([
        { speaker: 'steinbrenner', text: 'The tapes are USELESS now — USELESS! The serenity is being DRAINED. I know where it’s going. THE SAUNA. That steam isn’t steam — it’s MY CALM. And the shampoo people are in on it. Investigate! $240 and my gratitude — both worthless, GO!' },
        { speaker: 'system', text: 'Mission accepted: STEAM OF SERENITY. The calm must flow.' }
      ]);
    } else if (!state.mission && state.flags.serenityTapesDone && !state.flags.featsOfStrengthDone && state.flags.freeRoam) {
      startMission('featsOfStrength');
      startDialog([
        { speaker: 'steinbrenner', text: 'It’s time. FESTIVUS IS NOT OVER UNTIL YOU PIN ME. I don’t care what month it is — the feats don’t wait for the calendar! Train first. You’ll need it.' },
        { speaker: 'system', text: 'Mission accepted: FEATS OF STRENGTH. Festivus, for the rest of us.' }
      ]);
    } else if (!state.mission && !state.flags.serenityTapesDone && state.flags.freeRoam) {
      startMission('serenityTapes');
      startDialog([
        { speaker: 'steinbrenner', text: 'You look tense. EVERYBODY looks tense. My serenity tapes — I had a whole system, and now they’re scattered! George borrowed one for a work thing. WORK. Hah! Bring them back and there’s money in it — serenity pays, kid!' },
        { speaker: 'system', text: 'Mission accepted: SERENITY NOW. Insanity later is not a valid strategy.' }
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
      r(130,190,270,86), r(402,210,56,70), r(444,300,108,92),
      r(250,300,104,38), r(14,320,110,84), r(530,368,98,44)
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
  shore: {
    w: 768, h: 416, label: 'Jersey Shore · Off Season', music: 'dream',
    colliders: [
      r(0,0,768,8), r(0,0,8,416), r(760,0,8,416),
      // ocean/beach blocked bottom, shop row blocked top with door gaps
      r(8,330,752,86), r(8,8,240,110), r(520,8,240,110), r(8,118,60,120), r(700,118,60,120)
    ],
    draw: drawShore,
    interactions: shoreInteractions
  },
  ac: {
    w: 768, h: 416, label: 'Atlantic City · Always Season', music: 'club',
    colliders: [
      r(0,0,768,8), r(0,0,8,416), r(760,0,8,416),
      r(8,300,752,116), r(8,8,752,100), r(600,180,120,120), r(30,180,110,120)
    ],
    draw: drawAC,
    interactions: acInteractions
  },
  meadow: {
    w: 768, h: 416, label: 'The Meadowlands · Race Day', music: 'club',
    colliders: [
      r(0,0,768,8), r(0,0,8,416), r(760,0,8,416),
      r(280,60,220,130), r(540,8,220,110), r(8,8,180,90),
      r(600,240,120,90), r(60,280,110,80)
    ],
    draw: drawMeadow,
    interactions: meadowInteractions
  },
  queens: {
    w: 768, h: 416, label: 'Queens · The Costanzas’ Turf', music: 'house',
    colliders: [
      r(0,0,768,8), r(0,0,8,416), r(760,0,8,416),
      r(40,30,180,110), r(300,30,180,110), r(560,30,170,110),
      r(8,300,752,116),
      r(30,185,170,50), r(250,185,180,50), r(500,185,180,50)
    ],
    draw: drawQueens,
    interactions: queensInteractions
  },
  casino: {
    w: 640, h: 416, label: 'The Dunes Casino · Atlantic City', music: 'club',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(20,20,240,80), r(380,20,240,80), r(140,240,140,80), r(400,240,140,80)
    ],
    draw: drawCasino,
    interactions: casinoInteractions
  },
  slice: {
    w: 640, h: 416, label: 'Famous Original Ray’s · Manhattan', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(20,20,600,110), r(480,220,130,90)
    ],
    draw: drawSlice,
    interactions: sliceInteractions
  },
  taffy: {
    w: 640, h: 416, label: 'Salty’s Taffy · Boardwalk', music: 'house',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(30,30,200,90), r(420,30,190,90), r(240,300,180,70)
    ],
    draw: drawTaffy,
    interactions: taffyInteractions
  },
  cabin: {
    w: 640, h: 416, label: 'Hunting Cabin · Deep in the Barrens', music: 'dream',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(80,8,150,110), r(480,8,152,180), r(80,160,200,130), r(612,80,28,240)
    ],
    draw: drawCabin,
    interactions: cabinInteractions
  },
  dmv: {
    w: 640, h: 416, label: 'Department of Motor Vehicles · Manhattan', music: 'monks',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(8,8,624,142), r(160,148,130,10), r(330,148,130,10),
      r(48,208,155,52), r(238,208,165,52), r(428,208,155,52),
      r(38,296,220,74), r(338,296,245,74),
      r(8,148,44,130), r(58,122,52,30)
    ],
    draw: drawDmv,
    interactions: dmvInteractions
  },
  diner: {
    w: 640, h: 416, label: 'Endgame Diner · Route 46', music: 'monks',
    colliders: [
      r(0,0,640,8), r(0,408,640,8), r(0,0,8,416), r(632,0,8,416),
      r(30,30,580,68), r(120,150,96,70), r(420,150,96,70),
      r(120,280,96,70), r(420,280,96,70), r(560,200,60,140)
    ],
    draw: drawDiner,
    interactions: dinerInteractions
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
    { kind: 'manC', x: 760, y: 180, region: { x: 660, y: 140, w: 500, h: 50 }, speed: 34 },
    { kind: 'silvio', x: 900, y: 280, region: { x: 700, y: 198, w: 480, h: 90 }, speed: 30 },
    { kind: 'manA', x: 1100, y: 180, region: { x: 660, y: 140, w: 500, h: 50 }, speed: 28 },
    { kind: 'bobby', x: 420, y: 260, region: { x: 300, y: 230, w: 260, h: 80 }, speed: 22, npc: 'newman' }
  ],
  queens: [
    { kind: 'womanA', x: 200, y: 270, region: { x: 60, y: 250, w: 640, h: 40 }, speed: 30 },
    { kind: 'manB', x: 500, y: 280, region: { x: 80, y: 255, w: 600, h: 40 }, speed: 26 },
    { kind: 'trucker', x: 350, y: 264, region: { x: 100, y: 250, w: 560, h: 40 }, speed: 24 }
  ],
  meadow: [
    { kind: 'bobby', x: 200, y: 300, region: { x: 100, y: 260, w: 300, h: 90 }, speed: 26 },
    { kind: 'womanA', x: 350, y: 330, region: { x: 120, y: 280, w: 400, h: 80 }, speed: 30 },
    { kind: 'christopher', x: 480, y: 290, region: { x: 300, y: 250, w: 240, h: 90 }, speed: 28 },
    { kind: 'manB', x: 150, y: 210, region: { x: 80, y: 190, w: 380, h: 60 }, speed: 26 }
  ],
  shore: [
    { kind: 'manC', x: 200, y: 240, region: { x: 80, y: 150, w: 500, h: 160 }, speed: 26 },
    { kind: 'bobby', x: 500, y: 260, region: { x: 120, y: 150, w: 500, h: 160 }, speed: 20 }
  ],
  nyc: [
    { kind: 'kramer', x: 300, y: 244, region: { x: 560, y: 236, w: 150, h: 36 }, speed: 44, npc: 'kramer' },
    { kind: 'elaine', x: 460, y: 254, region: { x: 90, y: 238, w: 300, h: 36 }, speed: 36 },
    { kind: 'womanA', x: 200, y: 250, region: { x: 60, y: 236, w: 640, h: 40 }, speed: 38 },
    { kind: 'jerry', x: 500, y: 246, region: { x: 420, y: 236, w: 300, h: 36 }, speed: 30 },
    { kind: 'manA', x: 620, y: 252, region: { x: 200, y: 238, w: 520, h: 36 }, speed: 34 },
    { kind: 'cop', x: 90, y: 258, region: { x: 50, y: 240, w: 240, h: 34 }, speed: 24 },
    { kind: 'manC', x: 340, y: 380, region: { x: 60, y: 364, w: 640, h: 32 }, speed: 40 }
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
    { kind: 'waitress', x: 560, y: 250, region: { x: 532, y: 130, w: 60, h: 220 }, speed: 26 },
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
  const nightThin = typeof isNight === 'function' && isNight() && ['hub', 'nyc', 'njstreet', 'shore'].includes(state.scene);
  let ni = -1;
  for (const n of list) {
    ni++;
    if (nightThin && !n.npc && ni % 2 === 1) continue;
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
    if (!n.barkT && Math.random() < dt * .008) {
      const grateful = state.flags.feastDone && Math.random() < .3;
      if (grateful) {
        const thanks = ['the feast! legendary!', 'you did that, didn’t ya', 'best thanksgiving in years', 'artie sends his love'];
        n.bark = thanks[Math.floor(Math.random() * thanks.length)];
        n.barkT = 1.8;
        continue;
      }
      const idle = state.scene === 'nyc'
        ? (state.flags.heat || 0) >= 4.5
          ? ['that’s HIM!', 'it’s the poster guy!', 'somebody call — actually don’t', 'I saw him first!']
          : ['these streets…', 'cab! CAB!', 'I’m walkin’ here!', 'best city on earth', 'rent’s due again', 'parade traffic was murder', 'turkey price this year — forget about it', 'you see the line at the soup place?', 'my landlord knows NOTHING about thanksgiving', 'famous original whatever — they all say that', 'the tunnel. ALWAYS the tunnel.', 'I heard the track’s fixed. I heard it AGAIN.']
        : state.scene === 'shore' || state.scene === 'ac'
          ? ['boardwalk’s empty — perfect', 'off-season is the best season', 'turkey on the beach, why not', 'the gulls are thankful for nothing']
          : state.scene === 'queens'
            ? ['the 7 is delayed AGAIN', 'serenity now! serenity now!', 'that’s my spot. that’s MY SPOT', 'the curtain saw everything', 'queens — the borough of kings']
            : state.scene === 'meadow'
              ? ['the four horse is a criminal', 'big race tonight', 'sausage and peppers, two dollars', 'I had the winner. I HAD him']
              : state.scene === 'pines' 
            ? ['quiet out here…', 'too quiet', 'pine fresh, they say']
            : ['lovely evening', 'smells like gravy', 'quiet night tonight', 'somebody double-parked', 'gabagool!', 'in-laws incoming', 'turkey’s in the oven', 'happy thanksgiving!'];
      n.bark = idle[Math.floor(Math.random() * idle.length)];
      n.barkT = 1.8;
    }
    if (typeof weatherRain === 'function' && weatherRain()) {
      spd *= 1.6; // everyone hurries in the rain
      if (Math.random() < dt * .05 && !n.barkT) { n.bark = ['this rain!', 'my hair!', 'c’mon, MOVE'][Math.floor(Math.random() * 3)]; n.barkT = 1.2; }
    } else if (typeof weatherSnow === 'function' && weatherSnow()) {
      if (Math.random() < dt * .04 && !n.barkT) { n.bark = ['flurries!', 'it’s really coming down', 'not before the turkey…', 'roads’ll be murder'][Math.floor(Math.random() * 4)]; n.barkT = 1.4; }
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
  if (!hitsBrawler && !best) {
    // swinging at empty air near the turkey is a mistake the turkey remembers
    const tk = state.turkey;
    if (tk && state.scene === 'hub' && Math.hypot(tk.x - p.x, tk.y - p.y) < 36 && !tk.enraged) {
      tk.enraged = 8;
      audio.sfx('turkey');
      spawnEffect(tk.x, tk.y - 16, 'GOBBLE GOBBLE GOBBLE', '#ff5040');
      startDialog([{ speaker: 'narrator', text: 'You swing at the turkey. The turkey does not forgive. The turkey has never forgiven anything. RUN.' }]);
    }
    return false;
  }
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
    const batDmg = state.flags.hasBat && state.flags.freeRoam;
    bw.hp -= brickHit ? Math.max(2, batDmg ? (state.player.kind === 'george' ? 1.75 : 2.5) : 0) : batDmg ? (state.player.kind === 'george' ? 1.75 : 2.5) : (state.player.kind === 'george' ? 1 : 1.5);
    bw.hitT = .5;
    bw.x += (bw.x - state.player.x) * .3 * comboMul;
    bw.y += (bw.y - state.player.y) * .3 * comboMul;
    bw.bark = bw.hp > 0 ? ['GAAH!', 'MY NOSE!', 'CHEAP SHOT!'][Math.floor(Math.random() * 3)] : 'MADONE...';
    bw.barkT = 1.4;
    const hitWord = brickHit ? 'BRICK!' : batDmg ? ['BATTING PRACTICE!', 'CRACK!', 'LOUISVILLE!'][Math.floor(Math.random() * 3)] : combo >= 3 ? 'UPPERCUT!' : combo === 2 ? 'POW POW!' : 'POW';
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
  // sometimes they don't dive — sometimes they square up. Jersey rules.
  if (!state.brawler && Math.random() < .3) {
    state.brawler = { x: best.x, y: best.y, hp: 3, state: 'prowl', t: 0, tx: best.x, ty: best.y, barkT: 1.6, bark: 'YOU WANT SOME?!', swingT: 0, hitT: 0 };
    best.diveT = 4; // the victim "becomes" the brawler — keep the original floored out of sight meanwhile
    spawnEffect(best.x, best.y - 22, 'IT’S A FIGHT!', '#ff9a3e');
    audio.sfx('denied');
  }
  state.stats.punches = (state.stats.punches || 0) + 1;
  state.flags.heat = Math.min(5, (state.flags.heat || 0) + (combo >= 3 ? 1.5 : 1));
  // witnesses: other pedestrians nearby see it and somebody always knows a cop
  const witnesses = ambientFor(state.scene).filter(w => w !== best && Math.hypot(w.x - best.x, w.y - best.y) < 130).length;
  if (witnesses >= 2) {
    state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
    const w = ambientFor(state.scene).find(w => w !== best && Math.hypot(w.x - best.x, w.y - best.y) < 130);
    if (w) { w.bark = state.scene === 'nyc' ? 'I’M CALLING THE COPS!' : 'I know a guy who knows a cop!'; w.barkT = 1.8; }
  }
  if (p.kind === 'george' && Math.random() < .3) {
    spawnEffect(p.x + 8, p.y - 14, 'MY BACK!', '#ff8e8e');
    best.bark = 'did… did you just hurt YOURSELF?';
    audio.sfx('denied');
  }
  spawnEffect(best.x + 8, best.y - 10, combo >= 3 ? 'LAUNCHED' : combo === 2 ? 'SHOVED x2' : 'SHOVED', '#ff9a7a');
  if (combo >= 2) spawnEffect(best.x + 8, best.y - 22, `COMBO x${combo}`, '#ff9a3e');
  // combo finishers drop extra cash
  const cashChance = p.kind === 'george' ? .3 : Math.min(.8, .45 + (combo - 1) * .2);
  if (p.kind === 'george' && Math.random() < .3) best.bark = 'MY WALLET! …wait, I don’t carry a wallet. HA!';
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
  const nightThin = typeof isNight === 'function' && isNight() && ['hub', 'nyc', 'njstreet', 'shore'].includes(state.scene);
  if (state.mugger) {
    const mg = state.mugger;
    drawPerson(ctx, mg.x, mg.y, 'manB', 'down', state.frame * 1.2, {});
    px(ctx, mg.x + 3, mg.y + 2, 11, 4, '#2a2a30');
    outlineText(ctx, mg.phase === 'demand' ? 'MONEY. NOW.' : '…', mg.x + 8, mg.y - 10, '#ff8e8e', 6, 'center');
  }
  let di = -1;
  for (const n of list) {
    di++;
    if (nightThin && !n.npc && di % 2 === 1) continue;
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
  if (!state.flags.freeRoam || !['hub', 'nyc', 'pines', 'shore', 'ac', 'meadow', 'queens'].includes(state.scene)) { state.cop = null; state.cop2 = null; state.copCar = null; return; }
  const heat = state.flags.heat || 0;
  // night makes the law jumpy — they come out earlier and backup arrives sooner
  const spawnAt = isNight() ? 2.2 : 3;
  const backupAt = isNight() ? 2.8 : 3.5;
  if (heat >= spawnAt && !state.cop) {
    state.cop = { x: 40, y: 100, flashT: 0, bustT: 0 };
    audio.sfx('honk');
    audio.sfx('denied');
    spawnEffect(state.player.x + 8, state.player.y - 34, isNight() ? 'NIGHT PATROL!' : 'WANTED!', '#ff6a6a');
    spawnEffect(state.player.x + 8, state.player.y - 20, 'COPS!', '#8fb8ff');
  }
  const c = state.cop;
  if (!c) return;
  if (heat < 1.5) {
    spawnEffect(c.x, c.y, 'HEAT CLEARED', '#8ffff2');
    state.cop = null;
    state.cop2 = null;
    state.copCar = null;
    return;
  }
  // wanted escalation: a second unit joins at high heat
  if (heat >= backupAt && !state.cop2) {
    state.cop2 = { x: state.scene === 'nyc' ? 740 : 1240, y: 380, flashT: 0, bustT: 0 };
    spawnEffect(state.player.x + 8, state.player.y - 20, 'BACKUP CALLED!', '#8fb8ff');
    audio.sfx('honk');
  }
  if (heat < backupAt - .5 && state.cop2) state.cop2 = null;
  // heat 4+: a patrol car joins in — the only thing in Jersey that drives worse than you
  if (heat >= 4 && !state.copCar) {
    state.copCar = { x: state.scene === 'nyc' ? 30 : 60, y: 60, angle: 0, flashT: 0 };
    spawnEffect(state.player.x + 8, state.player.y - 34, 'PATROL CAR INBOUND!', '#ff6a6a');
    audio.sfx('honk');
  }
  if (heat < 3.5 && state.copCar) state.copCar = null;
  if (state.copCar) {
    const cc = state.copCar;
    cc.flashT += dt;
    const pdx = state.player.x - cc.x, pdy = state.player.y - cc.y;
    const pdist = Math.hypot(pdx, pdy) || 1;
    const cspd = 168;
    cc.x += pdx / pdist * cspd * dt;
    cc.y += pdy / pdist * cspd * dt;
    cc.angle = Math.atan2(pdy, pdx) + Math.PI / 2;
    if (pdist < 26 && state.player.inCar) {
      state.player.carV = (state.player.carV || 1) * .25;
      state.player.carDamage = (state.player.carDamage || 0) + 1;
      spawnEffect(state.player.x, state.player.y - 20, 'RAMMED!', '#ff8e8e');
      audio.sfx('crash');
      cc.x -= pdx / pdist * 30;
      cc.y -= pdy / pdist * 30;
    }
  }
  const p = state.player;
  const maxHeat = (state.flags.heat || 0) >= 4.5;
  const speed = (p.inCar ? 150 : 120) * (maxHeat ? 1.3 : 1);
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
  // GTA rules: they can't cuff a moving car — you have to stop or be on foot
  // a cop within arm's reach can be reasoned with — Jersey reasoning, $100 a dose
  if (Math.min(d, d2) < 44 && consume(['KeyG']) && (state.money || 0) >= 100 && !state.bribeCd) {
    state.money -= 100;
    state.flags.heat = 0;
    state.cop = null;
    state.cop2 = null;
    state.copCar = null;
    state.bribeCd = true;
    setTimeout(() => { state.bribeCd = false; }, 4000);
    audio.sfx('cash');
    spawnEffect(p.x, p.y - 20, 'CONTRIBUTION ACCEPTED', '#ffd23e');
    startDialog([{ speaker: 'narrator', text: 'A hundred dollars changes hands with the practiced smoothness of a transaction older than the republic. The officer remembers a pressing appointment elsewhere. “Nice neighborhood,” he says, meaning it sincerely for the first time.' }]);
  }
  const evading = p.inCar && (p.carV || 0) > .45;
  if (Math.min(d, d2) < 30 && !evading) {
    c.bustT += dt;
    if (c.bustT > (maxHeat ? .5 : .8)) {
      state.cop = null;
      state.cop2 = null;
      state.copCar = null;
      state.flags.heat = 0;
      p.inCar = false;
      p.speed = p.kind === 'george' ? 96 : 88;
      audio.sfx('denied');
      const fine = Math.min(state.money, Math.max(12, Math.round(state.money * .15)));
      state.money -= fine;
      startDialog(p.kind === 'george' ? [
        { speaker: 'narrator', text: `A very unimpressed officer escorts George to the curb. The fine is $${fine} — “processing fees” — and a lecture about civic responsibility.` },
        { speaker: 'george', text: 'Twelve dollars! You know what the Human Fund would say about this? Nothing, because it doesn’t exist!' }
      ] : [
        { speaker: 'narrator', text: `The officer takes one look at Tony, decides this is above his pay grade, and writes a $${fine} parking ticket instead. The ticket is, somehow, exactly as expensive as justice.` },
        { speaker: 'tony', text: 'Smart kid. Here — for the policeman’s ball. Tell ‘em I said hi. Actually, don’t.' }
      ]);
    }
  } else c.bustT = Math.max(0, c.bustT - dt);
  if (evading && Math.min(d, d2) < 130 && Math.random() < dt * .5) {
    spawnEffect(c.x + 8, c.y - 14, 'PULL OVER!', '#9fc4ec');
    audio.sfx('honk');
  }
}

function drawHubEventProps() {
  // Newman loiters by the park fence awaiting couriers
  if (state.flags.freeRoam) {
    drawPerson(ctx, 552, 206, 'newman', 'down', state.frame * .5, {});
    if (typeof nextMission === 'function' && nextMission() && !state.mission && Math.sin(state.time * 3) > 0) outlineText(ctx, '!', 560, 192, '#ffe78a', 10, 'center');
  }

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


function drawRussian() {
  const ru = state.russian;
  if (state.scene !== 'pines' || !ru || !ru.active) return;
  const fade = Math.min(1, ru.life);
  ctx.globalAlpha = .35 + fade * .5;
  px(ctx, ru.x - 4, ru.y - 10, 9, 12, '#2c2620');
  px(ctx, ru.x - 3, ru.y - 14, 7, 5, '#4a4238');
  px(ctx, ru.x - 2, ru.y - 9, 5, 3, '#c8b89a');
  px(ctx, ru.x - 3, ru.y + 2, 3, 4, '#1c1814');
  px(ctx, ru.x + 1, ru.y + 2, 3, 4, '#1c1814');
  ctx.globalAlpha = 1;
}

function drawWildTurkey() {
  const tk = state.turkey;
  if (!tk || state.scene !== 'hub') return;
  const bob = Math.sin(state.time * 6) * 1;
  px(ctx, tk.x - 4 - state.camera.x, tk.y - 8 + bob - state.camera.y, 9, 8, '#5a3a20');
  px(ctx, tk.x - 6 - state.camera.x, tk.y - 12 + bob - state.camera.y, 12, 5, '#7a5230');
  px(ctx, tk.x + 3 - state.camera.x, tk.y - 13 + bob - state.camera.y, 3, 4, '#c03838');
  px(ctx, tk.x + 4 - state.camera.x, tk.y - 10 + bob - state.camera.y, 2, 2, '#ffd23e');
  px(ctx, tk.x - 2 - state.camera.x, tk.y + bob - state.camera.y, 2, 3, '#8a6a30');
  px(ctx, tk.x + 1 - state.camera.x, tk.y + bob - state.camera.y, 2, 3, '#8a6a30');
}

function drawIceCream() {
  const ic = state.iceCream;
  if (!ic || state.scene !== 'hub' || isNight() || ic.t > 0) return;
  drawCar(ic.x, ic.y, '#fff0f5', false, Math.PI / 2);
  px(ctx, ic.x - 8, ic.y - 12, 16, 4, '#ff8ab0');
  px(ctx, ic.x - 3, ic.y - 18, 6, 6, '#ffe78a');
}

function drawParadeCrowd() {
  if (state.scene !== 'nyc') return;
  if (typeof isNight === 'function' && isNight()) return;
  // spectators lined up for the parade — they’re not moving, they’re NEVER moving, the good spots were taken at 5am
  const coats = ['#8a3a3a', '#3a5a8a', '#5a8a3a', '#8a6a2a', '#6a3a7a', '#4a6a6a'];
  for (let i = 0; i < 9; i++) {
    const cx = 90 + i * 68;
    const cy = 218 + (i % 3) * 5;
    const bob = Math.sin(state.time * 1.4 + i * 1.7) * 1.2;
    px(ctx, cx, cy - 8 + bob, 8, 7, '#d8a980');
    px(ctx, cx - 2, cy - 2 + bob, 12, 14, coats[i % coats.length]);
    px(ctx, cx - 1, cy - 11 + bob, 10, 3, '#e23e3e'); // scarf/hat
    if (i % 4 === 0) outlineText(ctx, 'GOBBLE!', cx + 4, cy - 16 + bob, '#ffe78a', 5, 'center');
  }
  // the marching band — eternal, tuneless, deeply sincere
  for (let i = 0; i < 4; i++) {
    const bx = 140 + ((state.time * 14 + i * 40) % 460);
    const by = 238;
    px(ctx, bx, by - 8, 8, 7, '#d8a980');
    px(ctx, bx - 2, by - 2, 12, 13, '#7a1f2e');
    px(ctx, bx + 6, by - 10, 8, 4, '#c9a227'); // brass
    px(ctx, bx + 12, by - 12, 4, 3, '#e8d98a');
  }
}

function drawParadeBalloon() {
  if (state.scene !== 'nyc') return;
  const t = state.time * .12;
  const bx = 800 - ((t * 60) % 1000);
  const by = 30 + Math.sin(t * 2) * 6;
  // turkey-shaped balloon, because of course it is
  px(ctx, bx - 16, by - 10, 32, 20, '#c05a3a');
  px(ctx, bx - 8, by - 18, 16, 10, '#8a2f23');
  px(ctx, bx + 10, by - 14, 8, 8, '#caa07a');
  px(ctx, bx + 12, by - 10, 4, 4, '#e23e3e');
  // tethers to invisible handlers far below
  ctx.strokeStyle = 'rgba(220,220,220,.35)';
  for (const off of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.moveTo(bx + off, by + 10);
    ctx.lineTo(bx + off * 1.6, by + 120);
    ctx.stroke();
  }
}

function drawRaccoons() {
  if (state.scene !== 'hub' || !isNight()) return;
  const t = state.time;
  for (let i = 0; i < 2; i++) {
    const rx = 240 + i * 130 + Math.sin(t * .5 + i * 2) * 30;
    const ry = 350 + Math.cos(t * .7 + i) * 8;
    px(ctx, rx - 5, ry - 4, 10, 7, '#5a5a62');
    px(ctx, rx + 3, ry - 7, 5, 5, '#6a6a72');
    px(ctx, rx - 8, ry - 3, 4, 3, '#3a3a42'); // striped tail, allegedly
  }
}

function drawWantedPoster() {
  if (state.scene !== 'hub' || (state.flags.heat || 0) < 4) return;
  const wx = 620, wy = 108;
  px(ctx, wx - 14, wy - 18, 28, 36, '#e8ddc0');
  px(ctx, wx - 14, wy - 18, 28, 3, '#c9b98a');
  ctx.fillStyle = '#3a2c1c';
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WANTED', wx, wy - 12);
  // crude sketch of the player — spitting image, unfortunately
  const kind = state.player.kind;
  px(ctx, wx - 5, wy - 8, 10, 8, kind === 'george' ? '#caa07a' : '#d8b08a');
  px(ctx, wx - 5, wy - 9, 10, 2, kind === 'george' ? '#6b4a2f' : '#2c2018');
  px(ctx, wx - 4, wy + 1, 8, 7, kind === 'george' ? '#7a8a5a' : '#3a3a44');
  const flicker = Math.floor(state.time * 2) % 2;
  ctx.fillStyle = flicker ? '#8a2020' : '#5a1414';
  ctx.font = '4px monospace';
  ctx.fillText('$5000 REWARD', wx, wy + 12);
  ctx.textAlign = 'left';
}

function drawUmbrellaGuy() {
  if (state.scene !== 'nyc' || !weatherRain()) return;
  const t = state.time * .8;
  const ux = 640 - (t * 60 % 700);
  const uy = 330 + Math.sin(t * 2) * 3;
  px(ctx, ux - 3, uy - 14, 6, 10, '#4a4a52');
  px(ctx, ux - 3, uy - 18, 6, 5, '#caa07a');
  // inside-out umbrella, tragic and proud
  px(ctx, ux - 8, uy - 26, 16, 4, '#222');
  px(ctx, ux - 2, uy - 24, 4, 8, '#666');
}

function drawLawnmower() {
  if (state.scene !== 'hub' || isNight()) return;
  const t = state.time * .5;
  const lane = Math.floor(t / 4) % 4;
  const dir = Math.floor(t / 4) % 2 === 0 ? 1 : -1;
  const prog = (t % 4) / 4;
  const mx = dir === 1 ? 90 + prog * 130 : 220 - prog * 130;
  const my = 70 + lane * 14;
  // freshly mowed stripes behind
  for (let i = 0; i < lane; i++) px(ctx, 90, 70 + i * 14, 130, 12, 'rgba(70,130,50,.35)');
  px(ctx, 90, 70 + lane * 14, dir === 1 ? (prog * 130) : 130 - (prog * 130), 12, 'rgba(70,130,50,.35)');
  // the mower man
  px(ctx, mx - 4, my - 12, 8, 9, '#d8c9a0');
  px(ctx, mx - 3, my - 16, 6, 5, '#caa07a');
  px(ctx, mx + (dir === 1 ? 3 : -8), my - 8, 6, 5, '#c0392b');
  if (Math.random() < .02) audio.sfx && null;
}

function drawKite() {
  if (!['shore', 'ac'].includes(state.scene) || isNight()) return;
  const t = state.time;
  const kx = 350 + Math.sin(t * .4) * 90 + Math.sin(t * 1.1) * 20;
  const ky = 100 + Math.cos(t * .7) * 22;
    // string
  ctx.strokeStyle = 'rgba(240,240,240,.5)';
  ctx.beginPath();
  ctx.moveTo(350, 290);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  px(ctx, kx - 4, ky - 3, 9, 6, '#ff6a8a');
  px(ctx, kx - 4, ky - 3, 4, 6, '#ffd23e');
  // the kid holding it
  if (!state.kiteKid) state.kiteKid = true;
}

function drawFireworks() {
  if (!['shore', 'ac'].includes(state.scene) || !isNight()) { state.fireworks = null; return; }
  if (!state.fireworks) state.fireworks = [];
  if (Math.random() < .012 && state.fireworks.length < 3) {
    state.fireworks.push({ x: 120 + Math.random() * 520, y: 40 + Math.random() * 90, t: 0, hue: ['#ff6a8a', '#ffd23e', '#8ffff2', '#c09aff'][Math.floor(Math.random() * 4)] });
    if (audio && audio.sfx) audio.sfx('thud');
  }
  for (const fw of state.fireworks) {
    fw.t += .016;
    const r = fw.t * 60;
    const alpha = Math.max(0, 1 - fw.t / 1.3);
    ctx.globalAlpha = alpha;
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * Math.PI * 2;
      px(ctx, fw.x - state.camera.x + Math.cos(ang) * r, fw.y - state.camera.y + Math.sin(ang) * r * .8, 2, 2, fw.hue);
    }
    ctx.globalAlpha = 1;
  }
  state.fireworks = state.fireworks.filter(f => f.t < 1.3);
}

function drawPackages() {
  if (!state.pkgSpots) return;
  for (let pi = 0; pi < state.pkgSpots.length; pi++) {
    const spot = state.pkgSpots[pi];
    if (spot.scene !== state.scene || state.flags['pkg' + pi]) continue;
    const bob = Math.sin(state.time * 2.4 + pi) * 2;
    const sx = spot.x - state.camera.x, sy = spot.y - state.camera.y + bob;
    px(ctx, sx - 5, sy - 4, 10, 8, '#8a2f23');
    px(ctx, sx - 5, sy - 4, 10, 2, '#c05a3a');
    if (Math.floor(state.time * 2) % 2) px(ctx, sx - 1, sy - 8, 2, 2, '#ffd23e');
  }
}

function drawLeaves() {
  if (!['hub', 'njstreet', 'pines', 'shore', 'ac'].includes(state.scene)) return;
  if (!state.leaves) {
    state.leaves = [];
    for (let i = 0; i < 14; i++) state.leaves.push({ x: Math.random() * 640, y: Math.random() * 416, ph: Math.random() * 6.28, sp: 14 + Math.random() * 18, hue: Math.random() });
  }
  const cam = state.camera;
  for (const lf of state.leaves) {
    const lx = (lf.x + Math.sin(state.time * 1.2 + lf.ph) * 22) - cam.x;
    const ly = ((lf.y + state.time * lf.sp) % 430) - cam.y;
    if (lx < -10 || lx > 650 || ly < -10 || ly > 426) continue;
    if (state.scene === 'pines') {
      ctx.fillStyle = 'rgba(232,240,252,.85)';
      ctx.fillRect(lx, ly, 2, 2);
    } else {
      ctx.fillStyle = lf.hue < .33 ? '#c8822a' : lf.hue < .66 ? '#a84e22' : '#d4a838';
      ctx.fillRect(lx, ly, 3, 2);
    }
  }
}

function drawSnatcher() {
  const sn = state.snatcher;
  if (!sn || state.scene !== 'nyc') return;
  const bob = Math.sin(state.time * 18) * 2;
  px(ctx, sn.x - 3, sn.y - 12 + bob * .3, 7, 10, '#303030');
  px(ctx, sn.x - 2, sn.y - 16 + bob * .3, 5, 5, '#d8b090');
  px(ctx, sn.x + 3, sn.y - 10, 6, 4, '#a02828');
  px(ctx, sn.x - 3, sn.y - 2, 3, 5, '#282828');
  px(ctx, sn.x + 1, sn.y - 2, 3, 5, '#282828');
}

function drawRoadblock() {
  const rb = state.roadblock;
  if (!rb || rb.scene !== state.scene) return;
  drawCar(rb.x - 24, rb.y, '#e8ecf2', false, Math.PI / 2);
  drawCar(rb.x + 24, rb.y, '#e8ecf2', false, -Math.PI / 2);
  const phase = Math.floor(rb.flareT * 5) % 2;
  px(ctx, rb.x - 30, rb.y - 6, 6, 3, phase ? '#ff4444' : '#4488ff');
  px(ctx, rb.x + 22, rb.y - 6, 6, 3, phase ? '#4488ff' : '#ff4444');
  px(ctx, rb.x - 8, rb.y + 8, 16, 3, '#ff8c1a');
}

function drawTailCourier() {
  const tl = state.tail;
  if (!tl || state.scene !== 'hub') return;
  drawPerson(ctx, tl.x, tl.y, 'bobby', 'down', Math.floor(state.time * 6) % 4, { pose: 'walk' });
  // suspicion indicator
  if (tl.suspicion > .3) {
    px(ctx, tl.x - 10, tl.y - 26, 20 * Math.min(1, tl.suspicion / 3), 3, '#ff5040');
    px(ctx, tl.x - 10, tl.y - 26, 20, 1, '#802020');
  }
}

function drawCop() {
  if (!['hub', 'nyc', 'pines', 'shore', 'ac', 'meadow', 'queens'].includes(state.scene)) return;
  for (const c of [state.cop, state.cop2, state.copCar].filter(Boolean)) {
    drawCar(c.x, c.y, c.color || '#e8ecf2', false, c.angle || 0);
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
  if (!['hub', 'nyc', 'meadow', 'queens'].includes(state.scene) || !state.flags.freeRoam) { state.brawler = null; return; }
  const p = state.player;
  if (!state.brawler && Math.random() < dt * .02) {
    const inNyc = state.scene === 'nyc';
    state.brawler = { x: inNyc ? 200 + Math.random() * 400 : 680 + Math.random() * 540, y: inNyc ? 250 + Math.random() * 90 : 140 + Math.random() * 50, hp: 3, state: 'prowl', t: 0, tx: inNyc ? 380 : 700, ty: inNyc ? 280 : 240, barkT: 0, swingT: 0, hitT: 0 };
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
        if (Math.random() < .5) {
          state.flags.hp = 0;
          if (!state.wasted) state.wasted = { t: 0 };
        } else {
          state.flags.hp = 3;
          state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 40);
          spawnEffect(p.x, p.y - 18, '-$40 ROBBED', '#ff6a6a');
          b.bark = 'THANKS FOR THE DONATION!';
          b.barkT = 1.8;
        }
      } else {
        state.flags.hp = (state.flags.hp || 3) - 1;
        spawnEffect(p.x, p.y - 18, 'OOF', '#ff6a6a');
      }
      audio.sfx('smash');
    }
  }
  // the turkey defends its person
  const tk = state.turkey;
  if (tk && tk.friend && b.hp > 0 && !tk.enraged && !tk.racing && state.scene === 'hub' && b.state === 'chase') {
    tk.peckT = (tk.peckT || 0) - dt;
    const td = Math.hypot(tk.x - b.x, tk.y - b.y);
    if (td > 22) {
      const ang = Math.atan2(b.y - tk.y, b.x - tk.x);
      tk.x += Math.cos(ang) * 92 * dt;
      tk.y += Math.sin(ang) * 92 * dt;
    } else if (tk.peckT <= 0) {
      tk.peckT = 1.6;
      b.hp -= .5;
      b.hitT = .4;
      spawnEffect(b.x + 6, b.y - 14, 'PECK!', '#ffe78a');
      audio.sfx('turkey');
      b.bark = ['THE BIRD! NOT THE BIRD!', 'IT’S IN MY EYES!', 'WHO TRAINED THIS THING?!'][Math.floor(Math.random() * 3)];
      b.barkT = 1.4;
    }
  }

}

function updateWasted(dt) {
  if (!state.wasted) return;
  state.wasted.t += dt;
  if (state.wasted.t > 3.4) {
    const spots = { hub: [350, 200], njstreet: [320, 240], nyc: [320, 250], queens: [400, 250], meadow: [400, 300], pines: [320, 300], shore: [400, 250], ac: [400, 250] };
    const spot = spots[state.scene] || [320, 250];
    state.player.x = spot[0]; state.player.y = spot[1];
    state.player.inCar = null;
    state.player.carColor = null;
    state.player.carName = null;
    state.player.speed = state.player.kind === 'george' ? 96 : 88;
    state.flags.hp = 2;
    const fine = Math.floor(state.money * .1);
    state.money -= fine;
    state.flags.heat = 0;
    state.brawler = null;
    if (state.mission) {
      setTimeout(() => { if (!state.wasted) startDialog([{ speaker: 'narrator', text: 'The job you were on? Fell through. Whatever it was, it goes to someone else now — someone who doesn’t get knocked unconscious in the street. The neighborhood notices.' }]); }, 400);
      state.mission = null;
    }
    state.wasted = null;
    toast(state.player.kind === 'george' ? 'You wake up in a hospital gown. The nurse says you were very loud about the gown. -$' + fine : 'You wake up in a hospital gown and a bill. -$' + fine);
    saveProgress();
  }
}

function drawWasted() {
  if (!state.wasted) return;
  const t = state.wasted.t;
  const a = Math.min(1, t * 1.4);
  ctx.fillStyle = `rgba(0,0,0,${a * .92})`;
  ctx.fillRect(0, 0, 640, 360);
  if (t > .5) {
    const sc = Math.min(1, (t - .5) * 2);
    ctx.save();
    ctx.translate(320, 170);
    ctx.scale(sc, sc);
    outlineText(ctx, 'WASTED', 0, 0, '#c03028', 34, 'center');
    ctx.restore();
    if (t > 1.6) outlineText(ctx, 'the meadowlands hospital is not covered by your plan', 320, 210, '#8a8a92', 8, 'center');
  }
}


// ——— taxi fares: anybody with a car is a cab in this economy ———
function updateFares(dt) {
  if (!state.flags.freeRoam || !OUTDOOR_SCENES.includes(state.scene)) { state.fare = null; return; }
  const p = state.player;
  // the yellow cab in Manhattan has its own deeper gypsy-cab mode — don't compete with it
  if (state.scene === 'nyc' && p.carColor === '#e8b822') return;
  if (!p.inCar) { if (state.fare && state.fare.stage === 'aboard') { /* they bail */ state.fare = null; toast('Your fare bails. People talk. This is why nobody stops.'); } return; }
  if (!state.fare) {
    state.fareT = (state.fareT || 8) - dt;
    if (state.fareT <= 0) {
      state.fareT = 25 + Math.random() * 25;
      // spawn a fare at the road edge ahead of the player
      let fx = Math.max(120, Math.min(1160, p.x + (Math.random() < .5 ? -1 : 1) * (140 + Math.random() * 160)));
      // never hail from inside a parked car — nudge clear of anything curbside
      for (const s2 of (PARKED_CARS[state.scene] || [])) {
        if (Math.abs(s2.x - fx) < 46) fx = s2.x + (fx >= s2.x ? 52 : -52);
      }
      fx = Math.max(120, Math.min(1160, fx));
      const spots = { hub: [330, 700, 1100], nyc: [330, 550, 900], queens: [330, 500, 800] };
      const dests = { hub: [[1200, 238, 'the tunnel'], [150, 238, 'the west side'], [885, 160, 'the diner']], nyc: [[620, 236, 'Jerry’s'], [150, 240, 'the park'], [1100, 240, 'the bridge and tunnel crowd']], queens: [[500, 240, 'the sauna'], [200, 240, 'the boulevard'], [700, 240, 'the Costanza place — no wait, anywhere BUT']] };
      const dl = dests[state.scene];
      if (!dl) return;
      const d = dl[Math.floor(Math.random() * dl.length)];
      state.fare = { x: fx, y: 236, stage: 'hail', dx: d[0], dy: d[1], dname: d[2], t: 0, pay: 30 + Math.floor(Math.random() * 40) };
    }
    return;
  }
  const f = state.fare;
  f.t += dt;
  if (f.stage === 'hail') {
    if (f.t > 30) { state.fare = null; return; } // gives up
    const d = Math.hypot(p.x - f.x, p.y - f.y);
    if (d < 42 && Math.abs(p.carV || 0) < .35) {
      f.stage = 'aboard';
      f.t = 0;
      f.limit = 45;
      audio.sfx('door');
      spawnEffect(f.x, f.y - 14, 'WHERE TO?', '#ffe78a');
      startDialog([{ speaker: 'narrator', text: 'A passenger slides in. "' + f.dname + ', and step on it." No hello. This is the tri-state area; hello is implied by the absence of hostility. The meter — your meter — is running. ish.' }]);
    }
    return;
  }
  if (f.stage === 'aboard') {
    if (f.t > f.limit) {
      state.fare = null;
      audio.sfx('denied');
      startDialog([{ speaker: 'narrator', text: 'Too slow. The passenger mutters something anatomical, pays nothing, and is gone at the next light. In this economy, punctuality is the whole product.' }]);
      return;
    }
    const d = Math.hypot(p.x - f.dx, p.y - f.dy);
    if (d < 46 && Math.abs(p.carV || 0) < .4) {
      const quick = f.t < f.limit * .55;
      const tip = quick ? Math.floor(f.pay * .5) : 0;
      state.money += f.pay + tip;
      audio.sfx('cash');
      spawnEffect(p.x + 8, p.y - 18, 'FARE +$' + (f.pay + tip), '#9be59b');
      state.stats.fares = (state.stats.fares || 0) + 1;
      startDialog([{ speaker: 'narrator', text: 'The passenger peels off bills without looking at you — the highest form of respect available — and is gone. ' + (quick ? 'A tip, even. You drove like you meant it.' : 'No tip. You drove like a person with nowhere to be.') }]);
      state.fare = null;
    }
  }
}

function drawFares() {
  const f = state.fare;
  if (!f || state.scene !== undefined && !OUTDOOR_SCENES.includes(state.scene)) return;
  if (f.stage === 'hail') {
    // waving figure at the curb
    const wave = Math.sin(state.time * 8) * 4;
    px(ctx, f.x - 4, f.y - 14, 8, 12, '#d0a060');
    px(ctx, f.x - 3, f.y - 20, 6, 6, '#e8c8a0');
    px(ctx, f.x + 4, f.y - 18 - wave, 2, 8, '#d0a060');
    outlineText(ctx, 'TAXI!', f.x, f.y - 26, '#ffd23e', 7, 'center');
  } else if (f.stage === 'aboard') {
    // destination marker — pulsing chevron + distance ticker
    const pulse = 1 + Math.sin(state.time * 5) * .2;
    ctx.save();
    ctx.fillStyle = '#ffd23e';
    ctx.globalAlpha = .85;
    ctx.beginPath();
    ctx.moveTo(f.dx, f.dy - 26 * pulse);
    ctx.lineTo(f.dx - 7, f.dy - 38 * pulse);
    ctx.lineTo(f.dx + 7, f.dy - 38 * pulse);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    outlineText(ctx, 'fare: ' + Math.max(0, Math.ceil(f.limit - f.t)) + 's', f.dx, f.dy - 44 * pulse, '#ffd23e', 7, 'center');
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
      { x: 700, y: 322, dir: -1, speed: 74, brakeT: 0, honkT: 0 },
      { x: 350, y: 322, dir: -1, speed: 40, brakeT: 0, honkT: 0, color: '#dcd8cc' }
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
        state.flags.hp = Math.max(0, (state.flags.hp || 3) - 1);
        if ((state.flags.hp || 3) <= 0 && !state.wasted) state.wasted = { t: 0 };
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

// ---------- Mission system: multi-step jobs with objective HUD ----------
const MISSION_DEFS = {
  packageJob: {
    title: 'THE PACKAGE JOB',
    payout: 200, heat: 1,
    steps: [
      { scene: 'bodega', x: 320, y: 90, radius: 62, objective: 'Deliver the package to the bodega clerk in Manhattan', label: 'Hand off the package' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman in North Caldwell', label: 'Report the delivery' }
    ]
  },
  catalogCaper: {
    title: 'THE CATALOG CAPER',
    payout: 150, heat: .5,
    steps: [
      { scene: 'yankees', x: 320, y: 300, radius: 58, objective: 'Drop the catalogs at the Yankees office', label: 'Drop the catalogs' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman in North Caldwell', label: 'Report the delivery' }
    ]
  },
  ryeExpress: {
    title: 'THE RYE EXPRESS',
    payout: 300, heat: 0, timeLimit: 210,
    steps: [
      { scene: 'costanza', x: 320, y: 260, radius: 90, objective: 'Get the marble rye to the Costanza house — before Frank notices — NOW', label: 'Deliver the rye' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman', label: 'Collect payment' }
    ]
  },
  muffinTops: {
    title: 'THE MUFFIN TOPS',
    payout: 140, heat: 0,
    steps: [
      { scene: 'bodega', x: 320, y: 90, radius: 62, objective: 'Unload the muffin stumps at the bodega. They take anything.', label: 'Dump the stumps' },
      { scene: 'nyc', x: 300, y: 250, radius: 55, objective: 'Report back to Kramer on the street', label: 'Report to Kramer' }
    ]
  },
  bladderRun: {
    title: 'THE PETROLEUM PIPELINE',
    payout: 200, heat: 1,
    steps: [
      { scene: 'pines', x: 400, y: 260, radius: 70, objective: 'Empty the oil bladder in the Pine Barrens. Legally distinct from dumping.', label: 'Empty the bladder' },
      { scene: 'nyc', x: 300, y: 250, radius: 55, objective: 'Report back to Kramer', label: 'Report to Kramer' }
    ]
  },
  bigSalad: {
    title: 'THE BIG SALAD',
    payout: 120, heat: 0,
    steps: [
      { scene: 'monks', x: 320, y: 300, radius: 80, objective: 'Pick up the big salad at Monk’s. A BIG salad. Big.', label: 'Pick up the salad' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman', label: 'Deliver the salad' }
    ]
  },
  soupNaziRun: {
    title: 'SOUP FOR NEWMAN',
    payout: 160, heat: .5,
    steps: [
      { scene: 'soup', x: 320, y: 300, radius: 80, objective: 'Get the soup. Follow the rules. Do NOT annoy the man.', label: 'Order the soup' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman — soup unopened', label: 'Deliver the soup' }
    ]
  },
  cannonball: {
    title: 'THE CANNONBALL',
    payout: 350, heat: 1.5, timeLimit: 260,
    steps: [
      { scene: 'pines', x: 400, y: 260, radius: 70, objective: 'RACE: reach the Pine Barrens clearing before time runs out', label: 'Tag the clearing' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'RACE BACK to Newman — clock is running', label: 'Win the bet' }
    ]
  },
  libraryRun: {
    title: 'THE LIBRARY RUN',
    payout: 190, heat: 1, timeLimit: 200,
    steps: [
      { scene: 'nyc', x: 320, y: 300, radius: 80, objective: 'NEWMAN: grab the overdue books — 23 YEARS overdue', label: 'books acquired — they smell like 1971' },
      { scene: 'monks', x: 300, y: 250, radius: 70, objective: 'NEWMAN: the library cop is at Monk’s — do NOT be seen reading', label: 'cop avoided' },
      { scene: 'hub', x: 560, y: 210, radius: 80, objective: 'NEWMAN: return the books to the drop — the fines are HIS problem', label: 'books returned' }
    ]
  },
  bigOne: {
    title: 'THE BIG ONE',
    payout: 500, heat: 2.5,
    steps: [
      { scene: 'bodega', x: 320, y: 90, radius: 62, objective: 'THE BIG ONE: collect the package from the bodega', label: 'Collect the package' },
      { scene: 'satriale', x: 262, y: 300, radius: 62, objective: 'Move it through Satriale’s — Bobby signs for it', label: 'Move through Satriale’s' },
      { scene: 'shore', x: 384, y: 260, radius: 80, objective: 'Final leg: the boardwalk drop. Nobody looks at anyone in the off-season.', label: 'Boardwalk drop' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman. It never happened.', label: 'Finish the job' }
    ]
  },
  bottleRun: {
    title: 'THE BOTTLE RUN',
    payout: 320, heat: .5, timeLimit: 240,
    steps: [
      { scene: 'nyc', x: 500, y: 200, radius: 60, objective: 'KRAMERICA: collect the bottles at the bodega', label: 'bottles acquired — 10 cents each in Michigan!' },
      { scene: 'hub', x: 320, y: 250, radius: 90, objective: 'KRAMERICA: haul the bottles through the tunnel — NO SUDDEN STOPS', label: 'bottles secured' },
      { scene: 'hub', x: 560, y: 210, radius: 60, objective: 'KRAMERICA: meet the Michigan connection', label: 'the refund is real' }
    ]
  },
  kramericaBook: {
    title: 'THE COFFEE TABLE BOOK',
    payout: 280, heat: 1,
    steps: [
      { scene: 'yankees', x: 320, y: 300, radius: 62, objective: 'KRAMERICA: deliver the coffee-table book prototype to the Yankees office', label: 'Deliver the prototype' },
      { scene: 'monks', x: 300, y: 250, radius: 60, objective: 'The book fell apart — salvage the legs at Monk’s', label: 'Salvage at Monk’s' },
      { scene: 'nyc', x: 300, y: 232, radius: 52, objective: 'Report back to Kramer. Kramerica Industries endures.', label: 'Finish the job' }
    ]
  },
  bigMouth: {
    title: 'BIG MOUTH',
    payout: 250, heat: 0, tail: true,
    steps: [
      { scene: 'hub', x: 320, y: 290, radius: 60, objective: 'BIG MOUTH: tail the courier — close enough to see, far enough to breathe', label: 'Tail the courier' }
    ]
  },
  serenityTapes: {
    title: 'SERENITY NOW',
    payout: 170, heat: 0, timeLimit: 220,
    steps: [
      { scene: 'costanza', x: 340, y: 120, radius: 70, objective: 'FRANK: the tapes — SERENITY NOW. Get them from the den', label: 'tapes found — the man on the tape is screaming' },
      { scene: 'yankees', x: 480, y: 150, radius: 70, objective: 'FRANK: George’s copy is at the stadium — INSANITY LATER is NOT a valid strategy', label: 'copy recovered' },
      { scene: 'costanza', x: 480, y: 90, radius: 80, objective: 'FRANK: return them before your mother starts the airing of grievances EARLY', label: 'serenity achieved, briefly' }
    ]
  },
  calzoneProtocol: {
    title: 'THE CALZONE PROTOCOL',
    payout: 210, heat: 0, timeLimit: 240,
    steps: [
      { scene: 'yankees', x: 480, y: 150, radius: 70, objective: 'STEINBRENNER: get the lunch order — he wants the calzone. THE CALZONE.', label: 'order memorized — calzone, extra napkins' },
      { scene: 'monks', x: 430, y: 120, radius: 70, objective: 'STEINBRENNER: pick up the calzone — and NO, the tip does not go in the counter jar', label: 'calzone acquired — it’s heavier than expected' },
      { scene: 'yankees', x: 560, y: 100, radius: 80, objective: 'STEINBRENNER: deliver before the fifth inning or there will be HELL TO PAY', label: 'the calzone has landed' }
    ]
  },
  cottonUniforms: {
    title: 'THE COTTON UNIFORMS',
    payout: 280, heat: 1, timeLimit: 260,
    steps: [
      { scene: 'yankees', x: 480, y: 150, radius: 70, objective: 'STEINBRENNER: cotton uniforms — they breathe! BREATHE! Get the samples', label: 'samples acquired — so natural, so breathable' },
      { scene: 'nyc', x: 320, y: 300, radius: 80, objective: 'STEINBRENNER: pick up the dye lot — cotton SHRINKS, keep that quiet', label: 'dye lot secured' },
      { scene: 'yankees', x: 560, y: 100, radius: 80, objective: 'STEINBRENNER: deliver the uniforms — sizing is NOT your problem', label: 'the uniforms are in — they will shrink. they always shrink.' }
    ]
  },
  featsOfStrength: {
    title: 'FEATS OF STRENGTH',
    payout: 300, heat: .5,
    steps: [
      { scene: 'costanza', x: 340, y: 120, radius: 70, objective: 'FRANK: Festivus is not over until you PIN ME. Warm up at the pole', label: 'aluminum pole — very high strength-to-weight ratio' },
      { scene: 'club', x: 400, y: 250, radius: 80, objective: 'FRANK: train with Slippery Pete — DO NOT LET HIM PIN YOU TOO, IT COSTS $25', label: 'training complete — forearms of spite' },
      { scene: 'costanza', x: 480, y: 90, radius: 80, objective: 'FRANK: FESTIVUS IS NOT OVER UNTIL YOU PIN ME', label: 'Festivus — for the rest of us' }
    ]
  },
  urbanSombrero: {
    title: 'THE URBAN SOMBRERO',
    payout: 230, heat: .5, timeLimit: 240,
    steps: [
      { scene: 'nyc', x: 200, y: 236, radius: 60, objective: 'ELAINE: take the sombrero prototype — DO NOT BE SEEN ENJOYING IT', label: 'sombrero acquired — it’s urban, it’s a sombrero' },
      { scene: 'monks', x: 430, y: 120, radius: 70, objective: 'ELAINE: the catalog photographer is at Monk’s — get the shots', label: 'photographed — the hat tested very well' },
      { scene: 'nyc', x: 200, y: 236, radius: 60, objective: 'ELAINE: bring it back before Peterman writes it into the catalog as a LIFESTYLE', label: 'the sombrero is delivered' }
    ]
  },
  jPetermanBurma: {
    title: 'THE BURMA SHAVE',
    payout: 290, heat: 1, timeLimit: 250,
    steps: [
      { scene: 'nyc', x: 320, y: 300, radius: 70, objective: 'ELAINE: Peterman overbought Burma — pick up the surplus trinkets', label: 'trinkets acquired — so much Burma' },
      { scene: 'bodega', x: 200, y: 60, radius: 70, objective: 'ELAINE: offload them at the bodega — tell no one the provenance', label: 'Burma liquidated' },
      { scene: 'nyc', x: 200, y: 236, radius: 60, objective: 'ELAINE: report back — and no, you may NOT read the catalog copy aloud', label: 'the catalog is saved, again' }
    ]
  },
  gravyChain: {
    title: 'THE GRAVY CHAIN',
    payout: 260, heat: 1.5, timeLimit: 260,
    steps: [
      { scene: 'vesuvio', x: 280, y: 330, radius: 70, objective: 'pick up Artie’s emergency gravy reserve', label: 'gravy reserve acquired — handle like a newborn' },
      { scene: 'satriale', x: 262, y: 300, radius: 70, objective: 'the gravy needs the pork store’s spice blend', label: 'spice blend folded in' },
      { scene: 'club', x: 400, y: 250, radius: 80, objective: 'deliver to the Bing before the rush', label: 'the gravy has landed' }
    ]
  },
  trackSystem: {
    title: 'THE TRACK SYSTEM',
    payout: 280, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'meadow', x: 200, y: 230, radius: 48, objective: 'Consult the railbirds — Kramer swears by the guy in the cap', label: 'the railbirds' },
      { scene: 'meadow', x: 98, y: 130, radius: 46, objective: 'Place the bet per the SYSTEM', label: 'the betting window' },
      { scene: 'meadow', x: 370, y: 130, radius: 46, objective: 'Watch the race — the system cannot lose', label: 'the track rail' }
    ]
  },
  saunaSerenity: {
    title: 'STEAM OF SERENITY',
    payout: 240, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'queens', x: 390, y: 160, radius: 46, objective: 'Test the sauna — is it stealing Frank’s serenity?', label: 'the sauna' },
      { scene: 'queens', x: 640, y: 160, radius: 46, objective: 'Investigate the shampoo factory runoff', label: 'the shampoo factory' },
      { scene: 'costanza', x: 140, y: 150, radius: 44, objective: 'Report back to Frank', label: 'Frank' }
    ]
  },
  fixedRace: {
    title: 'THE FIXED RACE',
    payout: 320, heat: 1, timeLimit: 0,
    steps: [
      { scene: 'meadow', x: 98, y: 130, radius: 46, objective: 'Put $50 on CRANBERRY SAUCE at the Meadowlands window', label: 'the betting window' },
      { scene: 'meadow', x: 370, y: 130, radius: 46, objective: 'Watch the race from the rail — don’t blink', label: 'the track rail' },
      { scene: 'club', x: 304, y: 132, radius: 42, objective: 'Report back to Silvio at the Bing', label: 'Silvio' }
    ]
  },
  sitDown: {
    title: 'THE SIT-DOWN',
    payout: 220, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'diner', x: 270, y: 240, radius: 60, objective: 'Mediate the beef at the Endgame Diner — the booth, back corner', label: 'the sit-down' },
      { scene: 'club', x: 304, y: 132, radius: 42, objective: 'Report back to Silvio at the Bing', label: 'Silvio' }
    ]
  },
  bigScore: {
    title: 'THE BIG SCORE',
    payout: 400, heat: 2, timeLimit: 420,
    failDialog: [
      { speaker: 'narrator', text: 'Too slow. The registers get refilled, the cage gets a second guard, and the window closes. Silvio doesn’t say anything. Silvio not saying anything is the worst sound in the world.' },
      { speaker: 'system', text: 'MISSION FAILED — talk to Silvio to retry.' }
    ],
    steps: [
      { scene: 'bodega', x: 340, y: 130, radius: 52, objective: 'First hit — the bodega register, Washington Heights', label: 'the bodega takes the fall' },
      { scene: 'slice', x: 540, y: 130, radius: 52, objective: 'Second hit — Ray’s register, during the oven rush', label: 'the slice joint takes the fall' },
      { scene: 'casino', x: 540, y: 118, radius: 52, objective: 'The big one — the Dunes cashier cage, Atlantic City', label: 'the cage takes the fall' },
      { scene: 'club', x: 304, y: 132, radius: 46, objective: 'Get the take back to Silvio — do NOT get busted on the way', label: 'Silvio' }
    ]
  },
  soupSummit: {
    title: 'THE SOUP SUMMIT',
    payout: 260, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'soup', x: 450, y: 340, radius: 56, objective: 'Acquire the soup — follow the rules, exact change, NO small talk', label: 'the transaction' },
      { scene: 'vesuvio', x: 320, y: 250, radius: 56, objective: 'Artie inspects the competition’s product', label: 'the inspection' },
      { scene: 'club', x: 304, y: 132, radius: 46, objective: 'Deliver the dossier to Silvio', label: 'Silvio' }
    ]
  },
  truckerSystem: {
    title: 'THE TRUCKER SYSTEM',
    payout: 190, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'diner', x: 270, y: 240, radius: 56, objective: 'Interview the trucker at the Endgame Diner — truckers know EVERY road', label: 'the trucker' },
      { scene: 'meadow', x: 400, y: 330, radius: 56, objective: 'Verify the shortcut — the service road past the track', label: 'the shortcut' },
      { scene: 'apartment', x: 300, y: 232, radius: 50, objective: 'Report the route to Kramer', label: 'Kramer' }
    ]
  },
  assman: {
    title: 'THE ASSMAN',
    payout: 240, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'queens', x: 150, y: 242, radius: 52, objective: 'Spot the car with the ASSMAN plates — last seen in Queens', label: 'the plates' },
      { scene: 'nyc', x: 300, y: 240, radius: 52, objective: 'The car moved — Manhattan. Plates don’t lie', label: 'the plates again' },
      { scene: 'apartment', x: 300, y: 232, radius: 50, objective: 'Report the truth to Kramer', label: 'Kramer' }
    ]
  },
  intervention: {
    title: 'THE INTERVENTION',
    payout: 260, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'satriale', x: 320, y: 200, radius: 56, objective: 'Round up Paulie at Satriale’s — he’s “busy” with the cat', label: 'Paulie' },
      { scene: 'vesuvio', x: 320, y: 176, radius: 52, objective: 'Get Artie — he’s crying into the sauce again but he’s coming', label: 'Artie' },
      { scene: 'melfi', x: 170, y: 200, radius: 56, objective: 'Dr. Melfi must attend — professionally. Not socially. Professionally.', label: 'Dr. Melfi' },
      { scene: 'club', x: 304, y: 132, radius: 46, objective: 'Everyone assembled — back to the Bing for the big talk', label: 'Silvio' }
    ]
  },
  artiesMenu: {
    title: 'THE LAST SUPPLY',
    payout: 280, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'satriale', x: 320, y: 200, radius: 60, objective: 'Pick up the gabagool reserve at Satriale’s', label: 'the gabagool reserve' },
      { scene: 'bodega', x: 320, y: 200, radius: 60, objective: 'Get the good bread from the bodega in Manhattan', label: 'the bread' },
      { scene: 'shore', x: 380, y: 140, radius: 52, objective: 'Catch a fresh fish off the shore pier', label: 'the pier' },
      { scene: 'vesuvio', x: 320, y: 176, radius: 52, objective: 'Deliver everything to Artie at Vesuvio — before the rush', label: 'Artie' }
    ]
  },
  shrinkRap: {
    title: 'THE SHRINK RAP',
    payout: 220, heat: 0, timeLimit: 0, maxHeat: 3,
    steps: [
      { scene: 'nyc', x: 400, y: 250, radius: 80, objective: 'Return the “grateful patient” watch to a Manhattan shop — calmly', label: 'the return' },
      { scene: 'melfi', x: 170, y: 200, radius: 60, objective: 'Report back to Dr. Melfi — heat under 3 the whole way', label: 'Dr. Melfi' }
    ]
  },
  paulieShoe: {
    title: 'THE MISSING SHOE',
    payout: 190, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'pines', x: 260, y: 260, radius: 60, objective: 'Search the deep treeline in the Pine Barrens for Paulie’s shoe', label: 'the treeline' },
      { scene: 'pines', x: 240, y: 385, radius: 64, objective: 'Check the frozen pond — maybe it flew far', label: 'the frozen pond' },
      { scene: 'club', x: 396, y: 182, radius: 46, objective: 'Bring whatever you found back to Paulie at the Bing', label: 'Paulie' }
    ]
  },
  screenplay: {
    title: 'THE SCREENPLAY',
    payout: 210, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'club', x: 320, y: 330, radius: 50, objective: 'Burn the copy in the Bing’s back room — near the dice game, quietly', label: 'the back-room copy' },
      { scene: 'satriale', x: 320, y: 200, radius: 60, objective: 'Recover the copy at Satriale’s before the guys read it aloud', label: 'the pork-store copy' },
      { scene: 'cabin', x: 180, y: 300, radius: 60, objective: 'Destroy the “writer’s retreat” draft hidden in the cabin', label: 'the retreat draft' },
      { scene: 'club', x: 202, y: 182, radius: 46, objective: 'Report back to Christopher — tell him NOTHING was read', label: 'Christopher' }
    ]
  },
  oddJob: {
    title: 'ODD JOB',
    payout: 80, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'vesuvio', x: 320, y: 250, radius: 60, objective: 'Deliver the parcel', label: 'the drop' },
      { scene: 'hub', x: 552, y: 220, radius: 52, objective: 'Report back to Newman', label: 'Newman' }
    ]
  },
  kramerJob: {
    title: 'KRAMERICA ERRAND',
    payout: 70, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'monks', x: 320, y: 250, radius: 60, objective: 'Kramerica business — make the pickup', label: 'the pickup' },
      { scene: 'nyc', x: 300, y: 232, radius: 52, objective: 'Report back to Kramer', label: 'Kramer' }
    ]
  },
  collection: {
    title: 'THE COLLECTION',
    payout: 100, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'vesuvio', x: 320, y: 250, radius: 60, objective: 'Collect the envelope', label: 'the envelope' },
      { scene: 'club', x: 304, y: 132, radius: 46, objective: 'Bring the envelope to Silvio', label: 'Silvio' }
    ]
  },
  frankJob: {
    title: 'THE FESTIVUS ERRAND',
    payout: 60, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'queens', x: 300, y: 200, radius: 60, objective: 'Run Frank’s errand', label: 'the errand' },
      { scene: 'costanza', x: 140, y: 140, radius: 60, objective: 'Report back to Frank', label: 'Frank' }
    ]
  },
  sliceJob: {
    title: 'THE SLICE RUN',
    payout: 25, heat: 0, timeLimit: 150,
    failDialog: [
      { speaker: 'narrator', text: 'The pie goes cold in your hands. Somewhere, a customer looks out the window one last time and orders Chinese. Back at Ray’s, the counter guy doesn’t yell. He just makes the next pie. Somehow that’s worse.' },
      { speaker: 'system', text: 'MISSION FAILED — the oven never stops. Talk to the counter guy at Ray’s to retry.' }
    ],
    steps: [
      { scene: 'hub', x: 320, y: 260, radius: 70, objective: 'Deliver the pie while it’s hot', label: 'the customer' },
      { scene: 'slice', x: 320, y: 200, radius: 60, objective: 'Report back to Ray’s', label: 'Ray’s' }
    ]
  },
  leoScarf: {
    title: 'THE RE-GIFT',
    payout: 15, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'apartment', x: 320, y: 250, radius: 80, objective: 'Retrieve the scarf from Jerry’s apartment — quietly', label: 'the scarf' },
      { scene: 'queens', x: 560, y: 210, radius: 50, objective: 'Return the scarf to Uncle Leo — say NOTHING about the monogram', label: 'Uncle Leo' }
    ]
  },
  jerrysFavor: {
    title: 'THE FAVOR',
    payout: 20, heat: 0, timeLimit: 0,
    steps: [
      { scene: 'bodega', x: 320, y: 200, radius: 60, objective: 'Acquire the cereal — the GOOD cereal, the one with the toy', label: 'the cereal' },
      { scene: 'apartment', x: 320, y: 250, radius: 80, objective: 'Bring the cereal up to Jerry’s apartment. Say nothing. This never happened', label: 'Jerry’s apartment' }
    ]
  },
  pineRunner: {
    title: 'PINE RUNNER',
    payout: 300, heat: 0, timeLimit: 200,
    steps: [
      { scene: 'pines', x: 384, y: 210, radius: 90, objective: 'PINE RUNNER: heat on your tail — lose yourself in the Pine Barrens before time runs out', label: 'Vanish in the pines' }
    ]
  },
  heatMagnet: {
    title: 'HEAT MAGNET',
    payout: 220, heat: 0, survive: 30,
    steps: [
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Survive the heat, then report back to Newman', label: 'Report back' }
    ]
  },
  turkeyTax: {
    title: 'THE TURKEY TAX',
    payout: 180, heat: 1,
    steps: [
      { scene: 'vesuvio', x: 320, y: 300, radius: 62, objective: 'Collect the Thanksgiving donation from Vesuvio', label: 'Collect from Artie' },
      { scene: 'satriale', x: 262, y: 300, radius: 62, objective: 'Collect the donation from Satriale’s', label: 'Collect the envelope' },
      { scene: 'club', x: 300, y: 150, radius: 55, objective: 'Bring the envelopes back to Silvio at the Bing', label: 'Deliver the take' }
    ]
  },
  pineFresh: {
    title: 'PINE FRESH',
    payout: 250, heat: 2,
    steps: [
      { scene: 'pines', x: 400, y: 260, radius: 70, objective: 'Leave the box in the Pine Barrens clearing. Don’t look.', label: 'Leave the box' },
      { scene: 'hub', x: 560, y: 210, radius: 52, objective: 'Report back to Newman. Act natural.', label: 'Report the burial' }
    ]
  }
};
const MISSION_CHAIN = ['packageJob', 'bigSalad', 'catalogCaper', 'soupNaziRun', 'cannonball', 'ryeExpress', 'heatMagnet', 'pineFresh', 'libraryRun', 'bigOne'];
const KRAMER_CHAIN = ['muffinTops', 'bladderRun', 'bottleRun', 'trackSystem', 'kramericaBook'];
function nextKramerMission() {
  return KRAMER_CHAIN.find((id) => !state.flags[id + 'Done']);
}
function nextMission() {
  return MISSION_CHAIN.find((id) => !state.flags[id + 'Done']);
}

function startMission(id) {
  const def = MISSION_DEFS[id];
  state.mission = { id, step: 0, deadline: def.timeLimit ? state.time + def.timeLimit : null, surviveT: def.survive || 0, steps: def.steps.map(s => ({ ...s })), payout: def.payout };
  audio.sfx('success');
  if (def.survive) state.flags.heat = Math.min(5, (state.flags.heat || 0) + 3);
}

function advanceMission() {
  const m = state.mission;
  if (!m) return;
  const def = MISSION_DEFS[m.id];
  m.step += 1;
  if (m.id === 'sliceJob' && m.step >= 1 && (!m.deadline || state.time <= m.deadline)) m.deadline = null; // on-time pie delivered — the clock stops
  const msteps = m.steps || def.steps;
  if (m.step >= msteps.length) {
    // mission complete
    state.mission = null;
    state.flags[m.id + 'Done'] = true; state.stats.missions = (state.stats.missions || 0) + 1;;
    state.flags.tribute = (state.flags.tribute || 0) + (m.payout || def.payout);
    state.flags.heat = Math.min(5, (state.flags.heat || 0) + def.heat);
    audio.sfx('cash');
    audio.sfx('success');
    for (let ei = 0; ei < 6; ei++) spawnEffect(state.player.x + (ei - 2.5) * 14, state.player.y - 24 - (ei % 2) * 10, '★', '#ffd23e');
    const endings = {
      packageJob: state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George returns the receipt. $200, minus what Newman calls "handling." Plus heat. Newman whistles, suddenly very busy with absolutely nothing.' },
        { speaker: 'george', text: 'What was IN that package?!' },
        { speaker: 'newman', text: 'Vanity press cassettes. Pirate whale songs. The whales never see a dime, George. And now… neither do you. Not legally!' }
      ] : [
        { speaker: 'narrator', text: 'Tony reports the delivery. $200 for an hour of driving. Honest work, dishonest cargo.' },
        { speaker: 'tony', text: 'You never ask what’s in the box. That’s rule one. Rule two is you take the cash and forget the box.' }
      ],
      bottleRun: [
        { speaker: 'kramer', text: 'TEN CENTS A BOTTLE! In Michigan, Jerry — er, boss — TEN CENTS! The math is UNBEATABLE! Sure, the gas costs more than the refund, and the tunnel tolls, and the truck rental — but the VOLUME! We make it up in volume!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I drove glass bottles through the Holland Tunnel for a net LOSS and I’d do it again! That’s the Kramerica difference!' : 'Hauled empty bottles across state lines for a guy who doesn’t know what a margin is. I’ve laundered money with less risk. Here’s your cut — don’t spend it all in Michigan.' }
      ],
      urbanSombrero: [
        { speaker: 'elaine', text: 'You got the shots?! Peterman saw them and whispered “…the streets of Rangoon” — I don’t know what it means either! He’s putting it in the catalog! $230, and if anyone asks, you never wore the hat. NO ONE wore the hat.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I may have worn the hat. Briefly! It has a very good brim! The URBAN part is key — it’s not a party sombrero, it’s a sombrero with a JOB!' : 'Drove a hat across town. A hat. I’m in waste management and I’m moving novelty headwear. You know what — the money spends the same.' }
      ],
      jPetermanBurma: [
        { speaker: 'elaine', text: 'The Burma situation is CONTAINED! Peterman almost wrote an entire catalog from a hammock — do you know how hard it is to copyedit a hammock?! $290! And here — take this. It’s a small carved elephant. We have NINE HUNDRED.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I liquidated Burma! Me! A nation-state, laundered through a bodega! This goes on the resume RIGHT between marine biologist and latex!' : 'Moved some trinkets. Quiet, no questions — that’s how I like it. Tell your boss the catalog business is a lot like my business, except he writes his evidence down.' }
      ],
      sitDown: state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Flashback, ninety minutes ago, the Endgame Diner: George mediates the beef by explaining, at length, that HE once lost a parking spot at Willowbrook in 1987 and it haunts him still. Both parties are so moved — or so exhausted — that they shake on it. Nobody touches their pie. Nobody ever touches the pie.' },
        { speaker: 'silvio', text: 'You mediated it with a STORY? No threats? Huh. Unorthodox. Effective. The cart guy sends his regards and also his medical bills, which I have lost. $220, peacemaker.' },
        { speaker: 'george', text: 'Conflict resolution is about empathy! Empathy and the strategic deployment of personal trauma! I should do this professionally!' }
      ] : [
        { speaker: 'narrator', text: 'Flashback, ninety minutes ago, the Endgame Diner: Tony sits down between the two of them and says nothing for four full minutes. Then he orders onion rings for the table. Then he says, “we’re done here, yeah?” They are done there. The rings were excellent. Nobody touched the pie — nobody EVER touches the pie.' },
        { speaker: 'silvio', text: 'The four-minute silence. The rings for the table. Classic. You know the man in the members-only jacket nodded at you? He never nods. $220.' },
        { speaker: 'tony', text: 'Half of this job is knowing when to shut up. The other half is onion rings.' }
      ],
      bigScore: [
        { speaker: 'narrator', text: 'Three registers, one night, one very unhappy police precinct. You slide the bundle across the table at the Bing. Silvio counts it without licking his thumb, because he’s a professional.' },
        { speaker: 'silvio', text: 'The bodega. The slice joint. The CAGE? In one night? You know what the crew’s calling you behind your back? Don’t answer — it’s respectful, that’s the point. $400. And lay LOW for a while.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I can’t believe it worked! I mean — I CAN believe it! I planned it! Vandelay Industries doesn’t DO small-time! …please stop looking at me like that.' : 'The cage guy had a sandwich in his hand. Never even put it down. That’s professionalism. We’re all professionals out here.' }
      ],
      soupSummit: [
        { speaker: 'narrator', text: 'Silvio reads Artie’s tasting notes like a war briefing. “The crab bisque is a problem,” he says finally. “A structural problem. Nobody tells Artie — he’d never recover. It stays in the family.”' },
        { speaker: 'silvio', text: 'You carried soup across state lines without spilling a drop, which — between us — is more than I can say for the last three guys we trusted with liquid assets. $260. And remember: the bisque conversation never happened.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I followed every rule! Exact change! No small talk! I ordered like a MACHINE! …I did look at the bread a little longingly, but who didn’t!' : 'Two and a half hours to move soup. You know what — worth it. Artie cried a little. I ain’t saying why.' }
      ],
      truckerSystem: [
        { speaker: 'kramer', text: 'The service road! Of course! Trucks avoid the tolls, the tolls avoid the trucks, and Kramerica avoids BOTH — it’s the circle of freight, buddy! The logistics division is ALIVE! $190 — and I’m naming the route after you. Well — after the trucker. Well — it’s gonna have a name, that’s the point!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m a logistics pioneer! They’ll write case studies! Bad ones! But still!' : 'Interviewed a trucker, drove a service road, got paid. Easiest money since the last time somebody paid me to drive around. Which is often. It’s a good racket.' }
      ],
      intervention: [
        { speaker: 'silvio', text: 'Everybody sat down. Everybody talked. Christopher cried — don’t you DARE repeat that — and the vetting process for his new no-show job has been thoroughly discussed. $260. You do the Lord’s work, my friend. The very specific, highly regional Lord’s work.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'An intervention! I’ve always wanted to be in one! Well — not IN one. NEAR one. At a safe, supportive distance!' : 'You don’t intervene on people like Christopher. You just… circle closer. Anyway, he cried. Nobody saw anything.' }
      ],
      assman: [
        { speaker: 'kramer', text: 'You saw it?! With your own eyes! The DMV made those plates for ME, buddy — a clerical error, a beautiful mistake — and now they’re out there, on some other man’s car, living their best life. Some proctologist is driving around with MY destiny on his bumper. Well. Let him have it. I’ve moved on. I’m the ASSMAN of the mind now. $240.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Wait — the plates were supposed to be HIS? The universe almost gave KRAMER the respect he never earned! …I’m going to start ordering vanity plates for everyone I know. This is a GOLDMINE of confusion!' : 'Two boroughs of driving to look at a license plate. This city makes philosopers of us all — or at least guys who read bumpers for money.' }
      ],
      calzoneProtocol: [
        { speaker: 'steinbrenner', text: 'The calzone! Hot, folded, POINTLESS geometry in any other context. You know what I admire, kid? Follow-through. Most people today — no follow-through. $210, and take a napkin.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He paid! The calzone system WORKS! I’m telling you, this is the beginning of a beautiful lunch-based relationship! …Wait, did he say no tip? I always tip! I OVERtip!' : 'Carried folded pizza across Manhattan for a baseball man. The Bing’s gonna love this one.' }
      ],
      cottonUniforms: [
        { speaker: 'steinbrenner', text: 'Cotton breathes! You can’t put a price on breathability! Well — you can, it’s $280, here you go. Now if they shrink, that’s a laundry problem, and I know NOTHING about laundry.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'They’re going to shrink! I KNOW they’re going to shrink! Polyester doesn’t shrink! Why does no one listen to me about fabrics?! …The money’s good though. The money’s very good.' : 'Delivered shrinkin’ uniforms to the Yankees. In my line of work that’s called a long con with good lighting.' }
      ],
      serenityTapes: [
        { speaker: 'frank', text: 'SERENITY NOW! You did good, kid. The man on those tapes? That’s Lloyd Braun’s uncle. HE knows serenity. And for the record — I don’t yell. I PROJECT. $170, and your mother never finds out.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Dad, the tape is just a man SCREAMING serenity! That’s not serenity, that’s rage with better branding! …I feel great actually! SERENITY NOW!' : 'Frank Costanza’s anger management program. I’ve seen worse techniques. Most of ’em mine, actually.' }
      ],
      featsOfStrength: [
        { speaker: 'frank', text: 'You couldn’t pin me! NOBODY pins me! …Okay, you pinned me. FESTIVUS IS OVER. Take the $300 — it was in the aluminum pole. THAT’S where I keep the holiday fund, Estelle!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I PINNED HIM! I pinned my own father at feats of strength! Do you understand what this means?! IT MEANS NOTHING GOOD, BUT IT HAPPENED!' : 'Pinned the old man. Respectfully. Frank Costanza’s got a grip like a bear trap — this guy coulda been in the family.' }
      ],
      libraryRun: [
        { speaker: 'newman', text: 'Twenty-three years! “Tropic of Cancer,” overdue since before you were born! The library cop — Mr. Bookman — has been WAITING. And now the trail goes cold. HEE hee hee! You have no idea what you’ve done for the postal community!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I handled library contraband! HOT BOOKS! I’m in the literary underground now! Does the library cop have a gun?!' : 'Moved books for a mailman. Books. That’s a new low and a new high at the same time. Whatever — cash is cash, and Bookman ain’t got nothin’.' }
      ],
      catalogCaper: [
        { speaker: 'newman', text: 'The Yankee organization will RECEIVE their L.L. Bean catalogs. Eventually. In bulk. Unsorted. Hee hee hee.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'You had me hand-deliver MAIL to sabotage the MAIL?! I’m an accessory to postal treason!' : 'A hundred fifty to carry catalogs. I’ve done worse for less. Don’t tell anybody that.' }
      ],
      trackSystem: [
        { speaker: 'narrator', text: 'The railbird in the cap — Kramer’s oracle — sells you the system for five dollars: “Always bet the horse that looks like it knows something.” You study the field. One horse, fourth from the rail, unmistakably looks like it knows something. You bet it. It comes in second. SECOND. The system has never come in second before. The railbird is inconsolable. You are somehow up anyway — place money is money.' },
        { speaker: 'kramer', text: 'Second?! It never comes in second! That’s not — the SYSTEM doesn’t DO second! …Although. Huh. You know what, second place money is still money, buddy. The system evolves. THE SYSTEM EVOLVES!' },
        { speaker: 'system', text: 'MISSION PASSED — THE TRACK SYSTEM. Place money is money. $280.' }
      ],
      saunaSerenity: [
        { speaker: 'narrator', text: 'The sauna checks out — just steam. The shampoo factory checks out — just chemicals and broken dreams. There is no serenity theft. There never was. The tapes were eaten by the garage sale guy in 1994, if anyone is keeping score.' },
        { speaker: 'steinbrenner', text: 'NOTHING?! You found NOTHING?! …Huh. So the tapes just DON’T WORK. Interesting. Very interesting. That means the serenity was inside me all along. SERENITY NOW! …Nope. Nope, it’s gone. Here’s your money. GET OUT OF MY HOUSE.' },
        { speaker: 'system', text: 'MISSION PASSED — STEAM OF SERENITY. $240. The calm was inside him all along. Briefly.' }
      ],
      fixedRace: [
        { speaker: 'narrator', text: 'You put the fifty down. You watch the rail. CRANBERRY SAUCE — the surest thing in the history of sure things — breaks dead last, shows briefly in the middle, and finishes last again with the enthusiasm of a horse that knows something you don’t.' },
        { speaker: 'silvio', text: 'It lost. THE FIXED HORSE LOST. You know what that means, right? The fix was fixed. Somebody fixed our fix. …Come here. The fifty you lost? You’re not paying it back. THAT’S how much I respect the audacity. $320 for the story. This one gets told at the Bing forever.' },
        { speaker: 'system', text: 'MISSION PASSED — THE FIXED RACE. The house always wins, except when a different house wins.' }
      ],
      artiesMenu: [
        { speaker: 'artie', text: 'The gabagool — the bread — is that FISH still moving? Tony, tonight’s menu writes itself! The rush is SAVED! Charmaine! CHARMAINE — cancel the emergency frozen calamari!' },
        { speaker: 'narrator', text: 'Artie presses $280 into your hand with both of his, the way a man hands over gratitude when words have a health-code violation. The kitchen roars to life behind him.' },
        { speaker: 'system', text: 'MISSION PASSED — THE LAST SUPPLY. Vesuvio lives to feed another rush.' }
      ],
      shrinkRap: [
        { speaker: 'melfi', text: 'You returned it. Without violence, without threats, without — and I want you to hear the significance of this — a SINGLE police interaction. Tony, this is what progress looks like. It’s boring and it’s progress.' },
        { speaker: 'tony', text: 'Two hundred and twenty bucks to walk a watch across the river like a civilian. You know what the worst part is? …I feel GOOD about it. What’re you doing to me?' },
        { speaker: 'system', text: 'MISSION PASSED — THE SHRINK RAP. Impulse control: one (1) time.' }
      ],
      paulieShoe: [
        { speaker: 'narrator', text: 'The shoe is not in the treeline. The shoe is not at the pond. What IS at the pond: one (1) frozen footprint, size extra-wide, leading in a circle. You bring Paulie a pinecone, a frozen sock of indeterminate ownership, and the truth.' },
        { speaker: 'paulie', text: 'A SOCK?! I don’t wanna hear about no sock! That shoe was ITALIAN! …The Russian’s still out there, you know. Guy took my shoe AND my dignity. Here — hundred ninety. For the search. And hey — you see a guy out there with an interior decorator’s eye, you know what to do.' },
        { speaker: 'system', text: 'MISSION PASSED — THE MISSING SHOE. Some pines are just barren.' }
      ],
      screenplay: [
        { speaker: 'christopher', text: 'You didn’t read it. Swear. SWEAR. …Okay. Okay. Because the part where the mobster’s mother is ALSO his therapist — that’s fiction. That’s pure fiction, it’s not — people wouldn’t understand the layers. Here. $210. You’re a good friend of mine, you know that?' },
        { speaker: 'narrator', text: 'Three copies of “BARKATHTON” — a revenge epic about a man whose dog is elected senator — are gone forever. Cinema mourns quietly, not knowing why.' },
        { speaker: 'system', text: 'MISSION PASSED — THE SCREENPLAY. Some stories must never be told.' }
      ],
      oddJob: [
        { speaker: 'newman', text: 'Delivered. On time. Undamaged. Unopened — mostly certain. The mail machine grinds on, and you, my friend, are a very small but very reliable cog. Hee hee.' },
        { speaker: 'system', text: 'ODD JOB COMPLETE. There will always be another parcel. The mail is eternal.' }
      ],
      kramerJob: [
        { speaker: 'kramer', text: 'GIDDY UP! Another successful Kramerica transaction. You know what that makes this quarter? Positive. In SOME columns. The important columns are confidential, buddy.' },
        { speaker: 'system', text: 'KRAMERICA ERRAND COMPLETE. Kramerica Industries endures.' }
      ],
      leoScarf: [
        { speaker: 'narrator', text: 'Leo sniffs the scarf once, decisively. “Still got the gift smell! Danny will never know. You’re a good boy. The eyebrows never lie.” He presses $15 into your hand. It is, somehow, also damp.' },
        { speaker: 'system', text: 'THE RE-GIFT COMPLETE. The circle of giving continues, minus the giving.' }
      ],
      sliceJob: [
        { speaker: 'narrator', text: 'The pie arrives hot. The customer tips in exact change and a conspiracy theory about the other Ray’s. Back at the shop, the counter guy slides your cut across the marble without a word. The oven never stops.' },
        { speaker: 'system', text: 'THE SLICE RUN COMPLETE. New York is eight million people standing between you and a hot pie.' }
      ],
      frankJob: [
        { speaker: 'womanB', text: 'You did it? Without incident? In THIS neighborhood? Frank, he did it without incident!' },
        { speaker: 'system', text: 'THE FESTIVUS ERRAND COMPLETE. Serenity — temporarily — restored.' }
      ],
      collection: [
        { speaker: 'silvio', text: 'Moist envelope, correct amount, no discussion. You know what that is? That’s a dying art, kid. Half the guys today would’ve opened it. You didn’t open it. …You didn’t, right? Don’t answer. That’s the other half of the art.' },
        { speaker: 'system', text: 'THE COLLECTION COMPLETE. The tribute flows.' }
      ],
      jerrysFavor: [
        { speaker: 'jerry', text: 'You got it. You actually — did anyone see you? Doesn’t matter. Here. Twenty bucks. And before you say anything — YES, I know twenty dollars is an absurd amount to pay a man for cereal. It’s called being appreciative. It’s a quality!' },
        { speaker: 'narrator', text: 'No laws were broken. No heat was generated. Somewhere, Silvio senses a job completed with zero felony content and feels physically ill without knowing why.' },
        { speaker: 'system', text: 'MISSION PASSED — THE FAVOR. The cleanest $20 in the tri-state area. It feels wrong.' }
      ],
      gravyChain: [
        { speaker: 'silvio', text: 'Hot, spiced, unspilled. You know what you are? You’re a gravy professional. There’s maybe six of you in the country. $260, and the first plate’s on the house.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I transported gravy across two municipalities without a single spill! Put it on my resume! MAKE it my resume!' : 'Gravy’s here, Sil. And for the record — nobody touches the gravy. That’s always been the rule.' }
      ],
      turkeyTax: [
        { speaker: 'silvio', text: 'Moist but complete. The bird, she is paid for. You did good — keep the vig.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I collected protection money and everyone was SO POLITE. Is this what power feels like?!' : 'Happy Thanksgiving, Sil. Tell the bird I said so.' }
      ],
      muffinTops: [
        { speaker: 'kramer', text: 'The stumps are MOVED, baby! Kramerica Foods is officially a going concern! Well — a going concern! Ha-YEAH!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I trucked garbage muffins across town for a hundred forty dollars. There are children with lemonade stands out-earning me!' : 'The best part of the muffin IS the top. The man’s not wrong. The rest is garbage logistics.' }
      ],
      bladderRun: [
        { speaker: 'kramer', text: 'Beautiful. The bladder is empty, the pipeline flows, and the environment? She’ll bounce back. She’s resilient, buddy. They’re very resilient.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I dumped industrial oil in a protected forest! I’m a polluter! A POLLUTER! …It was a lot of money.' : 'Two hundred to empty a balloon in the woods. I’ve buried worse things there. Don’t ask. Seriously — don’t.' }
      ],
      cannonball: [
        { speaker: 'newman', text: 'HA! IN YOUR FACE, FIREMAN LENNY! Er — well done. The $350, minus the standard courier tithe. Hee hee. The tithe is most of it.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I drove like a maniac through a tunnel for a BET?! People bet on me?! I’m a HORSE! …A fast horse. Fastest in the stable, actually.' : 'Fast driving, no questions, cash at the end. Best job all week.' }
      ],
      kramericaBook: [
        { speaker: 'kramer', text: 'They laughed, buddy. LAUGHED. At a book about coffee tables that BECOMES a coffee table! Visionaries are never appreciated in their own time! Here — Kramerica Industries pays in full. Always. Usually!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I delivered a broken book and got PAID! This is the greatest company in the world! I want IN! I want stock! Is there stock?!' : 'Legs fell off a book. I don’t ask questions anymore. The money spends the same.' }
      ],
      pineRunner: [
        { speaker: 'narrator', text: 'The trees swallow the road behind you. Sirens fade into hypothetical. Whatever the heat was, the Pine Barrens is where heat goes to be nobody’s problem.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I outran the LAW! In a borrowed car! I’m basically a folk hero! A very nervous, sweaty folk hero!' : 'They always lose interest at the treeline. Everybody does. That’s the whole point of the place.' }
      ],
      bigOne: [
        { speaker: 'newman', text: 'It is done. IT IS DONE! The mail — er, the PARCELS — flow once more through the arteries of this great state! $500, minus administrative tribute. The administrative tribute is significant. It is most of it. HEE HEE HEE!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Four counties! I’m a courier kingpin! A low-level, poorly-paid courier kingpin, but the TITLE!' : 'Five hundred for a drive down the shore with stops. Easiest money since the cigarette boat. Don’t ask.' }
      ],
      bigSalad: [
        { speaker: 'newman', text: 'Yes. YES. Look at the SIZE of it. Big. You have done well. The mail provides. Well — YOU provided. Same thing, essentially.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I carried a salad across state lines! I peaked in college, you know! I had a future!' : 'I’ve moved a lotta things for a lotta people. First salad.' }
      ],
      soupNaziRun: [
        { speaker: 'newman', text: 'Mulligatawny! You actually GOT it! You followed the rules? The line? The ordering? Then you are… adequate!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I did it. Perfect order. I want that on my tombstone.' : 'Guy runs soup like a crime family. Respect. No bread, though. Cost extra. Even for me.' }
      ],
      pineFresh: [
        { speaker: 'narrator', text: 'The box is in the ground. You did not look inside. You will never know. Some things are better buried — literally everything, in New Jersey.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I buried a BOX for a MAILMAN in a HAUNTED FOREST and a large Russian watched me do it! I need to sit down. Forever!' : 'Pine Barrens. Always the Pine Barrens. Tell Paulie the spot’s taken.' }
      ]
    };
    startDialog(endings[m.id] || [{ speaker: 'system', text: 'Mission complete.' }]);
  } else {
    audio.sfx('confirm');
    const st = (m.steps || def.steps)[m.step];
    startDialog([{ speaker: 'system', text: `New objective: ${st.objective}` }]);
  }
}

function missionStep() {
  if (!state.mission) return null;
  const steps = state.mission.steps || MISSION_DEFS[state.mission.id].steps;
  return steps[state.mission.step];
}

function updateHeatDecay(dt) {
  const h = state.flags.heat || 0;
  if (h > 0 && !state.cop) {
    state.heatDecayT = (state.heatDecayT || 0) + dt;
    const interval = state.player.inCar ? 26 : 18;
    if (state.heatDecayT >= interval) {
      state.heatDecayT = 0;
      state.flags.heat = Math.max(0, h - .25);
    }
  } else state.heatDecayT = 0;
}

function updateBanking(dt) {
  if ((state.flags.banked || 0) > 0) {
    state.bankAccrual = (state.bankAccrual || 0) + dt;
    if (state.bankAccrual >= 30) {
      state.bankAccrual = 0;
      const gain = Math.max(1, Math.round(state.flags.banked * .01));
      state.flags.banked += gain;
    }
  }
}

function updateMission(dt) {
  const st = missionStep();
  if (!st) return;
  const m0 = state.mission;
  if (m0.deadline && state.time > m0.deadline) {
    const id = m0.id;
    state.mission = null;
    audio.sfx('denied');
    const failLines = MISSION_DEFS[id].failDialog || [
      { speaker: 'narrator', text: 'Too slow. The job falls through. Newman will pretend he never offered it, out loud, repeatedly, to everyone.' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'The traffic! The tunnel! I demand a recount!' : 'Yeah, yeah. Another day, another blown deadline in this economy.' },
      { speaker: 'system', text: 'MISSION FAILED — talk to Newman to retry.' }
    ];
    startDialog([
      ...failLines,
      ...(MISSION_DEFS[id].failExtra || [])
    ]);
    return;
  }
  if (MISSION_DEFS[m0.id].tail) {
    const p0 = state.player;
    if (!state.tail) state.tail = { x: 200, y: 250, wp: 0, progress: 0, suspicion: 0, barkT: 0 };
    const tl = state.tail;
    if (state.scene !== 'hub') { return; }
    const wps = [[200, 250], [430, 250], [430, 340], [200, 340], [320, 210]];
    const wp = wps[tl.wp];
    const dx = wp[0] - tl.x, dy = wp[1] - tl.y;
    const dd = Math.hypot(dx, dy) || 1;
    if (dd < 8) tl.wp = (tl.wp + 1) % wps.length;
    else { tl.x += (dx / dd) * 42 * dt; tl.y += (dy / dd) * 42 * dt; }
    const pd = Math.hypot(tl.x - p0.x, tl.y - p0.y);
    if (pd < 200 && pd > 34) {
      tl.progress += dt;
      tl.suspicion = Math.max(0, tl.suspicion - dt * .5);
    } else if (pd <= 34) {
      tl.suspicion += dt;
      if (tl.barkT <= 0) { tl.barkT = 2.5; spawnEffect(tl.x, tl.y - 20, 'why are you following me?!', '#ffb0a0'); }
      tl.barkT -= dt;
    }
    if (tl.suspicion >= 3) {
      state.mission = null;
      state.tail = null;
      audio.sfx('denied');
      startDialog([
        { speaker: 'narrator', text: 'The courier wheels around. “I KNEW IT!” He power-walks away, looking backwards the entire time. The tail is blown.' },
        { speaker: 'system', text: 'MISSION FAILED — talk to Silvio to retry.' }
      ]);
      return;
    }
    if (pd > 260) {
      tl.progress = Math.max(0, tl.progress - dt * 2);
    }
    if (tl.progress >= 45) {
      const def = MISSION_DEFS[m0.id];
      state.mission = null;
      state.tail = null;
      state.flags.bigMouthDone = true;
      state.money += def.payout;
      audio.sfx('cash');
      startDialog([
        { speaker: 'narrator', text: 'Forty-five seconds of perfect surveillance. The courier’s route, his stops, his little sandwich break — all yours. Silvio listens without blinking, which for Silvio is a standing ovation.' },
        { speaker: 'silvio', text: 'Good. Here. You didn’t see anything, and neither did he. That’s the whole job.' },
        { speaker: 'system', text: `MISSION COMPLETE — BIG MOUTH. +$${def.payout}` }
      ]);
    }
    return;
  }
  if (state.scene !== st.scene) return;
  const p = state.player;
  if (m0.surviveT > 0) {
    m0.surviveT -= dt;
    if (m0.surviveT <= 0) spawnEffect(state.player.x + 8, state.player.y - 20, 'HEAT WEATHERED', '#8ffff2');
  }
  if (m0.surviveT > 0) return;
  const crimeGated = m0.id === 'bigScore' && m0.step < 3; // the registers only count if you actually rob them
  if (crimeGated && Math.hypot(st.x - p.x, st.y - p.y) < st.radius && interactPressed() && (state.interactCooldown || 0) <= 0) {
    // the heist press IS the crime — the beacon zone triggers the robbery directly,
    // so overlapping furniture hotspots can't eat the keypress
    const rob = (scenes[state.scene].interactions() || []).find(a => /Rob the (register|cashier cage)/.test(a.label || ''));
    if (rob) {
      state.interactCooldown = .8;
      rob.action(); // the register's own cooldown is the farm protection — the accept-time reset opens the window exactly once
    }
  } else if (!crimeGated && Math.hypot(st.x - p.x, st.y - p.y) < st.radius && interactPressed() && (state.interactCooldown || 0) <= 0) {
    state.interactCooldown = .8;
    spawnEffect(st.x, st.y - 20, st.label.toUpperCase(), '#8ffff2');
    if (state.mission.step === 0) {
      const dropLines = {
        packageJob: [
          { speaker: 'narrator', text: 'The clerk takes the package without looking at it, slides it under the counter, and resumes being deeply interested in a lottery magazine. Professional.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why do I feel like I just committed three crimes? It was a BODEGA drop. People do bodega drops!' : 'Smooth. In and out. The way she goes.' }
        ],
        catalogCaper: [
          { speaker: 'narrator', text: 'A thousand mail-order catalogs, stacked neatly outside the Yankees supply office. Somewhere inside, Steinbrenner senses a disturbance in the mailstream.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I used to WORK here! I’m pretty sure I’m still technically employed here! This is a conflict of EVERYTHING!' : 'Catalogs. This is what the mail does to a man. Remember me when they write the ballad.' }
        ],
        artiesMenu: [
          { speaker: 'narrator', text: 'Behind the counter, under the scale, behind the good prosciutto: the reserve gabagool. Wrapped in butcher paper, then in a second layer of butcher paper, then in silence. The kid at the counter hands it over like it weighs exactly what it weighs.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why is meat heavier when it’s a favor?! There should be a study!' : 'The reserve. Means Artie’s desperate. Means he pays happy. Everybody wins — especially the veal.' }
        ],
        paulieShoe: [
          { speaker: 'narrator', text: 'You part the frozen brush where Paulie swears — SWEARS — he was only slightly disoriented. Nothing but frost, a rusted can of something unlabeled, and the deep suspicion that the trees are laughing.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m shoe-hunting in a haunted forest! For PAULIE! He doesn’t even tip!' : 'The shoe’s a size extra-wide. The forest is four hundred acres. This is what we in the business call a long shot.' }
        ],
        soupSummit: [
          { speaker: 'narrator', text: 'The transaction is flawless. Exact change, order stated plainly, no small talk, move to the left. The Soup Man hands over the containers with the solemnity of a man defusing ordnance. One mulligatawny. One crab bisque. Do not shake them. Do not even THINK about the bread.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I did it! PERFECT protocol! He almost — ALMOST — nodded at me!' : 'Guy runs soup like I run waste management. Respect. Quiet, exact, no questions.' }
        ],
        truckerSystem: [
          { speaker: 'narrator', text: 'The trucker doesn’t look up from his coffee, but he talks. Forty years of roads in one monologue: the service road behind the Meadowlands — no tolls, no scales, no troopers, just reeds and the occasional smell of money being laundered. “You didn’t hear it from me,” he says, to nobody, because he never looked at you.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Fascinating! The trucker economy! A shadow logistics network hiding in plain sight! I must document everything!' : 'Truckers and my crew got the same road-map, turns out. Small world. No — small TOLLS.' }
        ],
        intervention: [
          { speaker: 'narrator', text: 'Paulie resists with the force of a man defending a lifetime of never processing anything. Then you mention there’s free food at the Bing and suddenly he’s helping you load the car.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He came willingly! Once food was involved! The system works!' : 'Paulie’s in. Guy’s a sucker for antipasto. Aren’t we all.' }
        ],
        assman: [
          { speaker: 'narrator', text: 'And there it is — parked plain as day. A cream-colored sedan wearing plates that read, in bold state-issue blue: ASSMAN. A man in a white coat gets out, locks it, and walks into a medical building with the serenity of someone who has made peace with his plates.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A DOCTOR. Of course a doctor has them! A proctologist — it has to be! It’s TOO PERFECT!' : 'A doctor. The plates belong to a doctor. I don’t know what I expected but it wasn’t a guy with a stethoscope.' }
        ],
        bigScore: [
          { speaker: 'narrator', text: 'The bodega register never stood a chance. The cat watches from the counter with the detached interest of a creature that has seen eleven robberies this month. Lotto scratchers rain like confetti.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m doing it! I’m actually — this is a CRIME. An actual crime! …I feel ALIVE!' : 'One down. Clock’s ticking.' }
        ],
        sitDown: [
          { speaker: 'narrator', text: 'The back booth. Two associates, one laminated menu between them like a demilitarized zone. The beef: a parking spot. The shopping-cart incident is not discussed. It hangs in the air like the pie nobody will touch.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Gentlemen. I too have lost a spot at Willowbrook. November 14th, 1987. I circled for forty minutes. FORTY. So when I say I understand — I mean it from the scar tissue!' : 'Sit down. Both of ya. …We’re gonna sit here until this is done. I got nowhere to be. I got ALL night. The coffee’s bottomless. Think about that.' },
          { speaker: 'narrator', text: 'Ninety minutes later — or four minutes, depending on the mediator — it is resolved. Hands are shaken. The pie, untouched, is boxed for nobody. The man in the members-only jacket does not look up.' }
        ],
        screenplay: [
          { speaker: 'narrator', text: 'A hundred pages, still warm from the club office printer. The title page reads “BARKATHTON — by C.M.” You burn it without reading a word, which is either loyalty or a crime against comedy. Page forty-three curls away last: “the dog filibusters for nine hours…”' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A dog senator is ridiculous. A dog COMPTROLLER — now that has teeth. I should write my own!' : 'I didn’t read nothin’. I burned it with my eyes closed. …The dog part was almost good, though. I’m not made of stone.' }
        ],
        oddJob: [
          { speaker: 'narrator', text: 'The parcel changes hands. No names. No questions. Somewhere, a sorting machine hums with approval.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Delivered! I’m a machine! A very tired, underpaid machine!' : 'Yeah, yeah. Next one. The mail’s eternal — so’s my cut.' }
        ],
        kramerJob: [
          { speaker: 'narrator', text: 'The Kramerica cargo changes hands. Legally ambiguous, structurally unsound, somehow profitable. The Kramerica way.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m a Kramerica VP now! Of logistics! There’s no pay but the TITLE, Jerry, the TITLE!' : 'Guy runs an empire outta his neighbor’s apartment. I seen worse organizational structures. Mine, for instance.' }
        ],
        leoScarf: [
          { speaker: 'narrator', text: 'The scarf. Cashmere-ish. Monogrammed “J.S.” — or is it? On closer inspection the monogram is stitched OVER another monogram. This scarf has been gifted before. Possibly several times. Possibly since the 1970s.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A re-gift in PROGRESS?! I’m a courier of BETRAYAL! …I’ll still take the fifteen.' : 'In my business we call this inventory redistribution. Leo’s a natural.' }
        ],
        frankJob: [
          { speaker: 'narrator', text: 'Errand accomplished. Somewhere in Queens, a vein in a man’s neck relaxes by roughly four percent.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why am I the family courier?! I have a SYSTEM of my own! It involves napping!' : 'Guy yells at me from the porch and I do the errand anyway. Something wrong with ME? Don’t answer that.' }
        ],
        collection: [
          { speaker: 'narrator', text: 'The envelope is handed over with both hands and zero eye contact. It is damp. It is always damp. Nobody knows why. Nobody asks why. That’s the business.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why is it damp?! WHY is it always damp?!' : 'Count it later. You never count in front of them. That’s respect.' }
        ],
        jerrysFavor: [
          { speaker: 'narrator', text: 'The cereal. Box in hand, toy inside — the good one, the submarine, not the whistle. You carry it like contraband out of pure habit. The clerk does not care. Nobody has ever cared less.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why am I nervous?! It’s CEREAL! There’s no victim! My hands are shaking!' : 'First job I ever done with zero felonies. Feels unnatural. Like jogging.' }
        ],
        turkeyTax: [
          { speaker: 'artie', text: 'The donation. Sure. It’s just — business is slow, and — here. Here it is. Tell Silvio the veal was perfect.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I feel terrible doing this. I also feel terrible NOT doing this. I feel terrible! That’s the constant!' : 'The veal WAS perfect. That’s why you’re still open, Artie.' }
        ],
        muffinTops: [
          { speaker: 'narrator', text: 'Forty pounds of muffin stumps, accepted without a word. The bodega has seen stranger cargo. This week.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'They TOOK them! No questions! What is this city!' : 'Stumps moved. The muffin economy hums along.' }
        ],
        bladderRun: [
          { speaker: 'narrator', text: 'The bladder deflates into the frozen earth with a noise like a dying accordion. Somewhere, a fish lawyer weeps.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'It’s fine! It’s biodegradable! …Is oil biodegradable? IS IT?!' : 'What spills in the Barrens stays in the Barrens.' }
        ],
        kramericaBook: [
          { speaker: 'narrator', text: 'The prototype is placed on the desk with reverence. It is a coffee-table book about coffee tables, with little folding legs, so that it becomes a coffee table. It immediately collapses. The legs were decorative. They were ALWAYS decorative.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'The legs are LOAD-BEARING in spirit! That’s what matters! Tell Kramer the concept is SOUND!' : 'A book that’s a table. I seen worse business ideas become nicknames. Salvage what you can.' }
        ],
        bigOne: [
          { speaker: 'narrator', text: 'The package changes hands in the cold fluorescent light of the bodega. Nobody looks at anybody. The clerk slides a scratch ticket across the counter like a tip. It wins nothing. It was never going to.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'First leg done! I’m a courier! A courier of MYSTERY!' : 'One down. Smooth. Next stop, the pork store.' }
        ],
        pineRunner: [
          { speaker: 'narrator', text: 'You don’t stop moving. The trees get denser, the road gets worse, and the heat — the heat just gives up. There are no witnesses in the Pine Barrens. There are barely even trees that admit to anything.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I MADE it! The forest doesn’t even want me! NOTHING wants me! That’s camouflage!' : 'Like I said. Treeline. End of interest.' }
        ],
        bigSalad: [
          { speaker: 'narrator', text: 'One big salad, boxed. It is, undeniably, big. The waitress knows better than to ask who it’s for.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why am I the salad guy? When did I become the salad guy?!' : 'Big salad. Heavy, too. Must be the croutons. Dense croutons.' }
        ],
        soupNaziRun: [
          { speaker: 'narrator', text: 'You stand in line correctly. You order without small talk. You pay without comment. The soup is yours. The system WORKS.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I did it. Perfect order. PERFECTLY.' : 'In and out. Quiet. Respectful. Like a hit, but with soup.' }
        ],
        pineFresh: [
          { speaker: 'narrator', text: 'The clearing. Frozen earth, no witnesses — except, in the distance, a large shape that does not hurry. The box goes in the ground. It never happened.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m digging a hole in a mafia forest with my HANDS for a postal worker! This is the low point! …It’s not the low point, is it. There’s lower!' : 'Soft ground. Good. Means nobody else dug here first. Means nobody else WILL.' }
        ]
      };
      startDialog(dropLines[state.mission.id] || [], () => advanceMission());
    } else advanceMission();
  }
}

function drawMissionHud() {
  const m = state.mission;
  if (!m) return;
  const def = MISSION_DEFS[m.id];
  const st = (m.steps || def.steps)[m.step];
  // objective banner, fixed to screen
  ctx.fillStyle = 'rgba(5,8,14,.72)';
  ctx.fillRect(140, 8, 360, 30);
  outlineText(ctx, `★ ${def.title}`, 152, 20, '#ffe78a', 7, 'left');
  outlineText(ctx, st.objective, 152, 32, '#cfe4f8', 6, 'left');
  if (state.mission.deadline) {
    const left = Math.max(0, state.mission.deadline - state.time);
    outlineText(ctx, `⏱ ${left.toFixed(0)}s`, 490, 20, left < 20 ? '#ff7a6a' : '#ffe78a', 8, 'right');
  }
  if (state.mission.surviveT > 0) {
    outlineText(ctx, `SURVIVE ${state.mission.surviveT.toFixed(0)}s`, 490, 20, '#ff9a3e', 8, 'right');
  }
  // world-space beacon at the step target when in the right scene
  if (state.scene === st.scene) {
    const bx = st.x - state.camera.x, by = st.y - state.camera.y;
    if (bx < -10 || bx > 650 || by < -10 || by > 426) {
      // offscreen: edge arrow pointing the way, GTA-style
      const cx2 = 320, cy2 = 208;
      const ang = Math.atan2(by - cy2, bx - cx2);
      const ex = cx2 + Math.cos(ang) * 268, ey = cy2 + Math.sin(ang) * 172;
      const ax = Math.max(18, Math.min(622, ex)), ay = Math.max(46, Math.min(398, ey));
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang + Math.PI / 2);
      ctx.globalAlpha = .75 + Math.sin(state.time * 5) * .25;
      outlineText(ctx, '▲', 0, 0, '#ffe78a', 12, 'center');
      ctx.restore();
      return;
    }
    const bob = Math.sin(state.time * 3) * 4;
    outlineText(ctx, '▼', bx, by - 26 + bob, '#ffe78a', 10, 'center');
    ctx.save();
    ctx.globalAlpha = .5 + Math.sin(state.time * 4) * .25;
    ctx.strokeStyle = '#ffe78a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (state.mission && state.mission.id === 'bigMouth' && state.tail) {
    const tl = state.tail;
    ctx.fillStyle = '#202028';
    ctx.fillRect(230, 40, 180, 8);
    ctx.fillStyle = '#8ffff2';
    ctx.fillRect(230, 40, 180 * Math.min(1, tl.progress / 45), 8);
    ctx.fillStyle = '#f5efdc';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TAIL ' + Math.floor(tl.progress) + '/45s — not too close, not too far', 320, 58);
    ctx.textAlign = 'left';
  }

}

function updateExplore(dt) {
  // ambient street events — the world bumps into you once in a while
  if (!state.dialog && !state.mission && OUTDOOR_SCENES.includes(state.scene) && !state.player.inCar) {
    state.streetEventT = (state.streetEventT || 20 + Math.random() * 30) - dt;
    if (state.streetEventT <= 0) {
      state.streetEventT = 45 + Math.random() * 45;
      const p = state.player;
      const geo = p.kind === 'george';
      const roll = Math.random();
      if (roll < .3) {
        const find = 3 + Math.floor(Math.random() * 12);
        state.money += find;
        audio.sfx('cash');
        spawnEffect(p.x + 8, p.y - 12, `+$${find}`, '#9fe89a');
        toast(geo ? `A crumpled $${find} on the sidewalk! You check both ways. Nobody saw. It's yours now. YOURS.` : `You spot a crumpled $${find} on the pavement. You pick it up smooth, like it was always yours. Because now it is.`);
      } else if (roll < .55) {
        spawnEffect(p.x + 8, p.y - 12, 'SPLAT', '#e8e4da');
        toast(geo ? 'A pigeon. Direct hit. On the JACKET. This is why you can’t have nice things. This is EXACTLY why.' : 'A pigeon gets you right on the shoulder. You look up. The pigeon is already gone. Somehow that’s the disrespectful part.');
      } else if (roll < .75) {
        toast(geo ? 'A guy brushes past you — “watch it, huh?” — and is gone before you can think of a comeback. You think of one eleven seconds later. It was PERFECT.' : 'Some guy shoulder-checks you and keeps walking. You memorize the back of his head. It’s a long list. He’s on it now.');
      } else if (roll < .9) {
        toast('Somewhere nearby a car alarm starts up, wails for exactly long enough to become part of you, then stops.');
      } else {
        const skid = 1 + Math.floor(Math.random() * 4);
        state.money += skid;
        audio.sfx('cash');
        spawnEffect(p.x + 8, p.y - 12, `+$${skid}`, '#9fe89a');
        toast(`You fish $${skid} in change out of a storm drain grate with a bit of chewing gum on a stick. Worth it.`);
      }
    }
  }

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
  if (state.scene === 'nyc') {
    for (const c of (state.nycCars || [])) {
      if (c.honkBack > 0) {
        c.honkBack -= dt;
        if (c.honkBack <= 0 && !c.honked) { c.honked = true; audio.sfx('honk'); }
      } else c.honked = false;
    }
  }
  // Pine Barrens: the Russian is out there. Rarely, a figure crosses the treeline.
  if (state.scene === 'pines') {
    if (!state.russian) state.russian = { t: 14 + Math.random() * 20, active: false };
    if (!isNight() && state.russian) state.russian.mugged = false;
    const ru = state.russian;
    if (!ru.active) {
      ru.t -= dt;
      if (ru.t <= 0) {
        ru.active = true;
        ru.x = Math.random() < .5 ? 60 : 700;
        ru.dir = ru.x < 300 ? 1 : -1;
        ru.y = 150 + Math.random() * 30;
        ru.life = 2.6;
        if (!state.flags.russianSeen) {
          state.flags.russianSeen = true;
          startDialog([
            { speaker: 'narrator', text: 'A figure moves between the trees. Big. Fur hat. He is not running from anything. He is simply… enduring.' },
            { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Did you see that?! That guy looked like he survived things! TERRIBLE things! I don’t want to know what things!' : 'Guy’s an interior decorator. That’s a joke. You had to be there. Paulie almost died making that joke.' }
          ]);
        } else spawnEffect(ru.x, ru.y - 16, '…he’s still out here…', '#b8c8e0');
      }
    } else {
      const hunting = isNight() && !ru.mugged && !state.player.inCar;
      if (!hunting) ru.life -= dt;
      if (isNight() && !ru.mugged) {
        // night in the Barrens: he hunts
        ru.hunter = true;
        const dx = state.player.x - ru.x;
        const dy = state.player.y - ru.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!state.player.inCar) {
          ru.x += (dx / d) * 46 * dt;
          ru.y += (dy / d) * 46 * dt;
          if (d < 16) {
            ru.mugged = true;
            ru.active = false;
            ru.t = 40 + Math.random() * 30;
            const take = Math.min(20, state.money);
            state.money -= take;
            audio.sfx('thud');

            startDialog([
              { speaker: 'narrator', text: 'The fur hat fills your vision. A hand the size of a Christmas ham takes ' + (take ? '$' + take : 'nothing — you are broke, which he seems to respect') + '. He says one word: "Interior… decorator." Then the trees take him back.' },
              { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He TOOK my money and COMPLIMENTED his own murderer aesthetic! I’m cold and I’m poor and I’m in a FOREST!' : '…Paulie’s never hearing about this. NEVER. Guy hits like a tranquilized bear. I’m not even mad — that’s respect.' }
            ]);
          }
        }
      } else {
        ru.x += ru.dir * 34 * dt;
      }
      if (ru.life <= 0) { ru.active = false; ru.hunter = false; ru.t = 26 + Math.random() * 30; }
    }
  }
  // street event: a purse snatcher bolts through Manhattan — clip him for a reward
  if (state.scene === 'nyc' && !state.snatcher && Math.random() < dt * .04) {
    state.snatcher = { x: Math.random() < .5 ? -10 : 650, y: 200 + Math.random() * 120, dir: 0, t: 9 };
    state.snatcher.dir = state.snatcher.x < 300 ? 1 : -1;
    spawnEffect(320, 150, 'STOP HIM! HE TOOK MY PURSE!', '#ffd0b0');
    audio.sfx('denied');
  }
  if (state.snatcher && state.scene === 'nyc') {
    const sn = state.snatcher;
    sn.t -= dt;
    sn.x += sn.dir * 130 * dt;
    if (sn.t <= 0 || sn.x < -30 || sn.x > 670) {
      state.snatcher = null;
    } else {
      // player punch catches him — reuse brawler hit detection: close + punch pressed is handled in shove; here: contact knockdown if player sprints into him
      const p0 = state.player;
      if (Math.hypot(sn.x - p0.x, sn.y - p0.y) < 18 && !sn.caught) {
        sn.caught = true;
        const reward = 30 + Math.floor(Math.random() * 25);
        state.money += reward;
        audio.sfx('cash');
        spawnEffect(sn.x, sn.y - 20, 'SNATCHER DOWN! +$' + reward, '#9be59b');
        startDialog([{ speaker: 'narrator', text: `You clip the snatcher mid-stride. He eats pavement, the purse goes flying, and a very relieved tourist presses $${reward} into your hand before you can explain that this was not kindness, exactly.` }]);
        state.snatcher = null;
      }
    }
  }
  // roadblocks at maximum heat — the whole township knows your car
  if ((state.flags.heat || 0) >= 4.5 && ['hub', 'nyc'].includes(state.scene) && state.player.inCar) {
    if (!state.roadblock) {
      const p0 = state.player;
      const ahead = ((p0.carV || 0) >= 0 ? 1 : -1) * 130;
      const maxX = state.scene === 'hub' ? 1200 : 700;
      const rx = Math.max(80, Math.min(maxX, p0.x + ahead));
      state.roadblock = { x: rx, y: 296, hp: 2, scene: state.scene, flareT: 0 };
    }
    const rb = state.roadblock;
    if (rb.scene !== state.scene) state.roadblock = null;
    else {
      rb.flareT += dt;
      const p = state.player;
      if (Math.abs(p.x - rb.x) < 46 && Math.abs(p.y - rb.y) < 22 && !rb.hit) {
        rb.hit = true;
        const speed = Math.abs(p.carV || 0);
        if (speed > 1.2) {
          rb.hp = 0;
          p.carDamage = (p.carDamage || 0) + 30;
          p.carV *= -.25;
          spawnEffect(p.x, p.y - 30, 'THROUGH THE ROADBLOCK!', '#ffd23e');
          audio.sfx('crash');
        } else {
          p.carV = 0;
          spawnEffect(p.x, p.y - 30, 'STOPPED — they’re coming!', '#ff6a6a');
          state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
          audio.sfx('thud');
        }
      }
      if (rb.hp <= 0 || Math.abs(p.x - rb.x) > 500) state.roadblock = null;
    }
  } else if (state.roadblock && ((state.flags.heat || 0) < 4.5 || !state.player.inCar)) {
    state.roadblock = null;
  }
  // gypsy cab mode: driving the stolen taxi in Manhattan attracts fares
  if (state.scene === 'nyc' && state.player.inCar && state.player.carColor === '#e8b822') {
    if (!state.fare) {
      state.fareCd = (state.fareCd || 6) - dt;
      if (state.fareCd <= 0) {
        const spots = [[150, 280], [320, 300], [520, 280], [620, 300], [250, 340]];
        const s = spots[Math.floor(Math.random() * spots.length)];
        state.fare = { stage: 'pickup', x: s[0], y: s[1], t: 0 };
      }
    } else {
      const f = state.fare;
      if (f.stage === 'pickup') {
        if (Math.hypot(f.x - state.player.x, f.y - state.player.y) < 46) {
          const dests = [[700, 120, 'the park'], [80, 120, 'the west side'], [640, 300, 'the east end']];
          const d = dests[Math.floor(Math.random() * dests.length)];
          f.stage = 'dropoff'; f.x = d[0]; f.y = d[1]; f.name = d[2]; f.t = 0;
          audio.sfx('door');
          startDialog([
            { speaker: 'narrator', text: `A fare climbs in. "${d[2].charAt(0).toUpperCase() + d[2].slice(1)}, and step on it." He does not notice anything unusual about this cab. They never do.` },
            { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Step on it? I’m a careful driver! I have NEVER been in a high-speed — okay, twice. Twice I have been.' : 'Wherever you’re going, you’re going. Meter’s running. Actually it ain’t, but that’s between us.' }
          ]);
        }
      } else if (Math.hypot(f.x - state.player.x, f.y - state.player.y) < 52) {
        const pay = 35 + Math.floor(Math.random() * 45);
        state.flags.tribute = (state.flags.tribute || 0) + pay;
        audio.sfx('cash');
        spawnEffect(state.player.x + 8, state.player.y - 12, `FARE PAID +$${pay}`, '#8ffff2');
        state.fare = null;
        state.fareCd = 10 + Math.random() * 14;
        audio.sfx('door');
      }
    }
  } else if (state.fare && (state.fare.stage === 'pickup' || state.fare.stage === 'dropoff')) {
    state.fare = null;
    state.fareCd = 8;
  }
  // the occasional Manhattan mugger — this is canon, not commentary
  if (state.scene === 'nyc' && !state.player.inCar) {
    state.muggerT = (state.muggerT || 40) - dt;
    if (!state.mugger && state.muggerT <= 0) {
      const ang = Math.random() * Math.PI * 2;
      state.mugger = { x: state.player.x + Math.cos(ang) * 220, y: state.player.y + Math.sin(ang) * 160, phase: 'approach', t: 0 };
    }
    const mg = state.mugger;
    if (mg) {
      const md = Math.hypot(mg.x - state.player.x, mg.y - state.player.y);
      if (consume(['KeyF']) && md < 40) {
        // you do not mug a man from North Caldwell
        state.mugger = null; state.muggerT = 90 + Math.random() * 60;
        const grab = 8 + Math.floor(Math.random() * 15);
        state.money += grab;
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + .3);
        audio.sfx('punch');
        spawnEffect(state.player.x, state.player.y - 20, `HE DROPPED $${grab}!`, '#ffe78a');
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'George swings with the desperate accuracy of a man defending his exact-change. The mugger, unprepared for resistance of any kind, drops loose cash and flees.' },
          { speaker: 'george', text: 'THAT’S RIGHT! I’m a NEW YORKER! I’ve been bumped into by THOUSANDS! I know violence!' }
        ] : [
          { speaker: 'narrator', text: 'The mugger picks the one guy in Manhattan who does this professionally. Bad luck follows some people like a tail. He drops cash running.' },
          { speaker: 'tony', text: 'You believe this guy? In MY city? …Alright, it’s not my city. It’s nobody’s city. That’s the whole point of the city.' }
        ]);
      }
      if (mg.phase === 'approach') {
        if (md > 26) { mg.x += ((state.player.x - mg.x) / md) * 66 * dt; mg.y += ((state.player.y - mg.y) / md) * 66 * dt; }
        else {
          mg.phase = 'demand'; mg.t = 3.2;
          audio.sfx('denied');
          spawnEffect(state.player.x, state.player.y - 20, '“YOUR MONEY. NOW.”', '#ff8e8e');
        }
      } else if (mg.phase === 'demand') {
        mg.t -= dt;
        if (mg.t <= 0) {
          const loss = Math.min(state.money, 25);
          state.money -= loss;
          spawnEffect(state.player.x, state.player.y - 20, loss > 0 ? `MUGGED! -$${loss}` : 'MUGGED! — you were broke, awkward for everyone', '#ff8e8e');
          if (loss > 0) startDialog([{ speaker: 'narrator', text: 'A man with a scarf over his face takes twenty-five dollars and vanishes into a crowd of witnesses who are suddenly all very interested in a pretzel cart. Welcome to Manhattan.' }]);
          else startDialog([{ speaker: 'narrator', text: 'The mugger finds nothing. You both stand there in the failure of it. He leaves first, which somehow makes it worse.' }]);
          state.mugger = null; state.muggerT = 75 + Math.random() * 60;
        }
      }
    }
  } else if (state.mugger) { state.mugger = null; state.muggerT = 40; }
  if (state.scene === 'hub' && state.flags.freeRoam && !state.flags.mapHintShown) {
    state.flags.mapHintShown = true;
    toast(usingTouchControls ? 'MENU → World map — tap a place twice to drive there.' : 'Press T for the Garden State map — click anywhere to drive there.');
  }
  // the white van speaker guy — a New Jersey constant, like property taxes
  if (state.scene === 'hub' && state.vanHere === undefined) state.vanHere = Math.random() < .5;
  if (state.scene !== 'hub') state.vanHere = undefined;
  state.worldSaveT = (state.worldSaveT || 0) + dt;
  if (state.worldSaveT > 8) { state.worldSaveT = 0; saveWorld(); }
  if (state.flags.heat > 0 && state.mode === 'explore') {
    // the wagon is invisible to law enforcement. the ex-cop car is the opposite.
    const carMul = !state.player.inCar ? 1 : state.player.carColor === '#b8a888' ? 2.2 : state.player.carColor === '#2848a0' ? .5 : 1;
    state.flags.heat = Math.max(0, state.flags.heat - dt * (state.player.kind === 'george' ? .022 : .03) * carMul);
  }
  const input = moveInput();
  const p = state.player;
  // the wild turkey of North Caldwell — unbothered, unhurried, unarmed
  if (state.scene === 'hub') {
    if (!state.turkey) state.turkey = { x: 600, y: 300, wx: 600, wy: 300, t: 0 };
    const tk = state.turkey;
    tk.t -= dt;
    if (tk.t <= 0) {
      tk.t = 2 + Math.random() * 3;
      tk.wx = Math.max(200, Math.min(1100, tk.x + (Math.random() - .5) * 220));
      tk.wy = Math.max(230, Math.min(360, tk.y + (Math.random() - .5) * 120));
    }
    const dx = tk.wx - tk.x, dy = tk.wy - tk.y;
    const dd = Math.hypot(dx, dy);
    if (dd > 4) { tk.x += (dx / dd) * 22 * dt; tk.y += (dy / dd) * 22 * dt; }
    if (tk.friend && !tk.enraged) {
      // a befriended turkey escorts you through the neighborhood. this is normal here.
      const fdx = state.player.x - tk.x, fdy = state.player.y - tk.y;
      const fd = Math.hypot(fdx, fdy) || 1;
      if (fd > 46) {
        const sp = state.player.inCar ? 130 : 55;
        tk.x += (fdx / fd) * sp * dt;
        tk.y += (fdy / fd) * sp * dt;
      }
      if (Math.random() < dt * .25) spawnEffect(tk.x, tk.y - 16, '♥', '#ff8fb0');
    }
    if (tk.enraged) {
      tk.enraged -= dt;
      const dxp = state.player.x - tk.x, dyp = state.player.y - tk.y;
      const dp = Math.hypot(dxp, dyp) || 1;
      if (!state.player.inCar) {
        tk.x += (dxp / dp) * 62 * dt;
        tk.y += (dyp / dp) * 62 * dt;
        if (dp < 14) {
          spawnEffect(state.player.x, state.player.y - 18, 'PECKED!', '#ff8e8e');
          audio.sfx('turkey');
          tk.enraged = 0;
          state.money = Math.max(0, state.money - 3);
          startDialog([{ speaker: 'narrator', text: 'The turkey exacts its price: three dollars, in the sense that you drop three dollars while fleeing. North Caldwell belongs to the turkey now. It always did.' }]);
        }
      }
    }
    // gobble at the player if close
    const pd = Math.hypot(tk.x - state.player.x, tk.y - state.player.y);
    if (pd < 60 && Math.random() < dt * .3) {
      audio.sfx('turkey');
      spawnEffect(tk.x, tk.y - 14, ['GOBBLE', 'gobble gobble', 'GLUB'][Math.floor(Math.random() * 3)], '#d4a838');
    }
  }
  // ice cream truck — drifts through the neighborhood by day, forever out of reach
  if (state.scene === 'hub' && !isNight()) {
    if (!state.iceCream) state.iceCream = { x: -80, y: 300, t: 20 + Math.random() * 30 };
    const ic = state.iceCream;
    ic.t -= dt;
    if (ic.t <= 0) {
      ic.x += 42 * dt;
      if (!ic.jingled) { ic.jingled = true; audio.sfx('pickup'); spawnEffect(Math.min(600, Math.max(40, ic.x + 40)), 270, '~ ice cream ~', '#ffe7f0'); }
      if (ic.x > 1360) { ic.x = -80; ic.t = 60 + Math.random() * 60; ic.jingled = false; }
    }
  }
  // hidden gabagool packages — find all ten
  if (!state.pkgSpots) {
    state.pkgSpots = [
      { scene: 'hub', x: 210, y: 330 }, { scene: 'hub', x: 1120, y: 130 },
      { scene: 'nyc', x: 60, y: 350 }, { scene: 'nyc', x: 700, y: 340 },
      { scene: 'pines', x: 270, y: 320 }, { scene: 'pines', x: 330, y: 200 },
      { scene: 'shore', x: 150, y: 300 }, { scene: 'shore', x: 600, y: 160 },
      { scene: 'ac', x: 210, y: 240 }, { scene: 'ac', x: 540, y: 240 },
      { scene: 'meadow', x: 400, y: 340 }, { scene: 'cabin', x: 590, y: 330 }
    ];
  }
  for (let pi = 0; pi < state.pkgSpots.length; pi++) {
    const spot = state.pkgSpots[pi];
    if (spot.scene !== state.scene || state.flags['pkg' + pi]) continue;
    if (Math.hypot(spot.x - state.player.x, spot.y - state.player.y) < 20) {
      state.flags['pkg' + pi] = true;
      const found = state.pkgSpots.filter((s2, i2) => state.flags['pkg' + i2]).length;
      state.money += 25;
      audio.sfx('cash');
      spawnEffect(spot.x, spot.y - 16, 'GABAGOOL! +$25 — ' + found + '/' + state.pkgSpots.length, '#ffd23e');
      if (found >= state.pkgSpots.length) {
        state.money += 250;
        startDialog([
          { speaker: 'narrator', text: 'EVERY SINGLE ONE. The complete tri-state gabagool sweep. Somewhere, a cured meat sommelier sheds a single proud tear. $250 completion bonus — the meat provides.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I found them ALL! Every meat! I am a MEAT EXPLORER!' : 'Every last one. That’s a lotta gabagool. Don’t tell the doctor.' }
        ]);
      }
    }
  }
  // typed cheat codes — GTA heritage
  if (state.mode === 'explore') {
    for (const k of pressed) {
      if (/^Key[A-Z]$/.test(k)) {
        state.cheatBuf = ((state.cheatBuf || '') + k[3]).slice(-12);
        if (state.cheatBuf.endsWith('GABAGOOL')) {
          state.money += 500;
          state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
          audio.sfx('cash');
          spawnEffect(state.player.x, state.player.y - 20, '+$500 — THE CURED MEATS PROVIDE', '#ffd23e');
          state.cheatBuf = '';
        } else if (state.cheatBuf.endsWith('SERENITY')) {
          state.flags.heat = 0;
          if (state.cop) state.cop = null;
          if (state.cop2) state.cop2 = null;
          if (state.copCar) state.copCar = null;
          audio.sfx('success');
          spawnEffect(state.player.x, state.player.y - 20, 'SERENITY NOW — heat cleared', '#8ffff2');
          state.cheatBuf = '';
        } else if (state.cheatBuf.endsWith('FEAST')) {
          state.money += 50;
          audio.sfx('pickup');
          spawnEffect(state.player.x, state.player.y - 20, '+$50 — leftovers money', '#ffe78a');
          state.cheatBuf = '';
        } else if (state.cheatBuf.endsWith('TURKEYDAY')) {
          state.money += 100;
          if (!state.turkey) state.turkey = { x: state.player.x + 30, y: state.player.y, wx: state.player.x, wy: state.player.y, t: 0 };
          state.turkey.friend = true;
          state.turkey.enraged = 0;
          audio.sfx('turkey');
          spawnEffect(state.player.x, state.player.y - 20, '+$100 — HAPPY THANKSGIVING. the turkey knows you now', '#ffb35e');
          startDialog([{ speaker: 'narrator', text: 'Somewhere in North Caldwell, a wild turkey looks up from absolutely nothing and understands, in the hollowed-out center of its dinosaur heart, that it has a family now. It is already walking toward you.' }]);
          state.cheatBuf = '';
        } else if (state.cheatBuf.endsWith('BIZARRO')) {
          state.money = Math.max(0, state.money - 50);
          audio.sfx('success');
          spawnEffect(state.player.x, state.player.y - 20, 'BIZARRO WORLD — you pay THEM. goodbye $50', '#c09aff');
          startDialog([{ speaker: 'narrator', text: 'In the Bizarro world, crime pays YOU negative money. Up is down. Cats chase dogs. Newman is a humanitarian. You feel strangely at peace, and fifty dollars poorer.' }]);
          state.cheatBuf = '';
        }
      }
    }
  }
  // GTA-lite: shove nearby pedestrians, or hop out of a borrowed car
  if (state.flags.freeRoam && !p.inCar && consume(['KeyF'])) shoveNearest();
  if (state.flags.freeRoam && consume(['KeyB']) && !p.inCar) {
    p.kind = p.kind === 'george' ? 'tonyMax' : 'george';
    p.speed = p.kind === 'george' ? 96 : 88;
    audio.voice(p.kind === 'george' ? 'george' : 'tony');
    spawnEffect(p.x + 8, p.y - 8, p.kind === 'george' ? 'GEORGE' : 'TONY', '#8ffff2');
  }
  if (state.flags.freeRoam && p.inCar && consume(['Space']) && (p.carV || 0) > .3) {
    p.carV = Math.max(0, p.carV - .45);
    audio.sfx('skid');
    spawnEffect(p.x, p.y + 10, 'screeee', '#cccccc');
    state.interactCooldown = Math.max(state.interactCooldown || 0, .4);
  }
  // GTA staples: horn and radio in a borrowed car
  if (state.flags.freeRoam && p.inCar && (consume(['KeyH']) || consume(['KeyF']))) {
    audio.sfx('honk');
    for (const n of ambientFor(state.scene)) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < 90) {
        n.diveT = Math.max(n.diveT || 0, .6);
        n.bark = ['WATCH IT!', 'I’M WALKIN HERE!', 'THE NERVE!', 'LEARN TO DRIVE!'][Math.floor(Math.random() * 4)];
        n.barkT = 1.4;
      }
    }
    if (state.scene === 'nyc') {
      for (const c of (state.nycCars || [])) {
        if (Math.hypot(c.x - p.x, (c.y || 0) - p.y) < 200 && Math.random() < .6) {
          c.honkBack = .5 + Math.random();
        }
      }
    }
    spawnEffect(p.x + 8, p.y - 10, 'HONK!', '#ffe78a');
  }
  if (state.flags.freeRoam && p.inCar && consume(['KeyR'])) {
    const stations = ['drive', 'nyc', 'club', 'rome', 'dream', 'scanner'];
    state.carRadio = ((state.carRadio ?? -1) + 1) % stations.length;
    audio.setMusic(stations[state.carRadio]);
    const names = ['WBPM 88.1 — the drive mix', 'WNYC — traffic & smooth', 'WBING — club classics', 'WROME — amore hour', 'WPINE — late night static', 'WSCAN — police band (illegal receiver)'];
    if (state.carRadio === 5) {
      const h = state.flags.heat || 0;
      const scan = h >= 4 ? '“…ALL UNITS — suspect described as ‘a fella in a borrowed car’…”'
        : h >= 2.5 ? '“…increased patrols holiday weekend, report of a man yelling SERENITY…”'
        : h >= 1 ? '“…minor disturbance, probable gull-related. all units resume normal…”'
        : '“…quiet night out there. too quiet. happy thanksgiving, dispatch out.”';
      spawnEffect(p.x + 8, p.y - 46, scan, '#ff9a7a');
    }
    if (state.carRadio === 2) spawnEffect(p.x + 8, p.y - 34, '“…all Thanksgiving weekend, NONSTOP club classics…”', '#8ffff2');
    spawnEffect(p.x + 8, p.y - 22, names[state.carRadio], '#8ffff2');
  }
  // WSCAN ambient chatter — the scanner mutters about you when you're hot
  if (state.player.inCar && state.carRadio === 5 && !state.dialog) {
    state.scanT = (state.scanT || 14) - dt;
    if (state.scanT <= 0) {
      state.scanT = 16 + Math.random() * 14;
      const h = state.flags.heat || 0;
      const p = state.player;
      if (h >= 4) spawnEffect(p.x + 8, p.y - 46, '“…unit 12 in pursuit — suspect vehicle is DEFINITELY borrowed…”', '#ff9a7a');
      else if (h >= 2) spawnEffect(p.x + 8, p.y - 46, '“…reports of a disturbance — holiday weekend, use discretion…”', '#ffcf9a');
      else if (Math.random() < .4) spawnEffect(p.x + 8, p.y - 46, '“…dispatch to nothing. quiet night. too quiet.”', '#9ac8ff');
    }
  }
  // reckless driving — speeding through the neighborhood draws heat
  if (state.player.inCar && Math.abs(state.player.carV || 0) > .85 && ['hub', 'queens', 'njstreet'].includes(state.scene) && !state.dialog) {
    state.recklessT = (state.recklessT || 0) + dt;
    if (state.recklessT > 6) {
      state.recklessT = 0;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .25);
      spawnEffect(state.player.x + 8, state.player.y - 24, 'reckless! heat +', '#ff9a7a');
      audio.sfx('honk');
      if (!state.flags.recklessWarned) {
        state.flags.recklessWarned = true;
        toast('You’re driving like a maniac in a residential area. People are writing down plate numbers. Slow down or enjoy the heat.');
      }
    }
  } else state.recklessT = Math.max(0, (state.recklessT || 0) - dt * 2);
  // leaving a borrowed car takes priority over other interactions
  if (p.inCar && !(nearestInteraction() && nearestInteraction().inCarOk) && interactPressed()) {
    p.inCar = false;
    p.carColor = null;
    p.carName = null;
    p.speed = p.kind === 'george' ? 96 : 88;
    state.carRadio = undefined;
    const sc = scenes[state.scene];
    if (sc) audio.setMusic(sc.music);
    audio.sfx('door');
    spawnEffect(p.x + 8, p.y - 8, 'ON FOOT', '#8ffff2');
    return;
  }
  if (input.x || input.y) {
    if (Math.abs(input.x) > Math.abs(input.y)) p.dir = input.x > 0 ? 'right' : 'left';
    else p.dir = input.y > 0 ? 'down' : 'up';
    // cars carry momentum: spin up over ~1.2s instead of instant speed
    if (p.inCar) {
      const wet = weatherRain() && OUTDOOR_SCENES.includes(state.scene);
      p.carV = Math.min(1, (p.carV || 0) + dt * (wet ? .8 : 1.2));
      if (wet && Math.abs(p.carV) > .7 && (input.x || input.y) && Math.random() < dt * .5) {
        spawnEffect(p.x, p.y + 10, 'screech', '#b8d0e0');
      }
    }
    const mi0 = moveInput(); const sprinting = !p.inCar && (keys.ShiftLeft || keys.ShiftRight) && Math.hypot(mi0.x, mi0.y) > .1;
    const sp = p.speed * dt * (p.inCar ? Math.max(.25, p.carV) : 1) * (sprinting ? 1.55 : 1);
    if (sprinting) {
      state.frame += dt * 8;
      if (!state.sprintFxT || state.sprintFxT <= 0) { state.sprintFxT = .3; if (Math.random() < .4) spawnEffect(p.x, p.y + 8, '', '#cccccc'); }
      else state.sprintFxT -= dt;
    }
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
    if (p.inCar) p.carV = Math.max(0, (p.carV || 0) - dt * (weatherRain() ? 1.2 : 2));
    state.frame += dt * 2;
  }
  const scene = scenes[state.scene];
  state.camera.x = Math.max(0, Math.min(scene.w - W, p.x - W / 2));
  state.camera.y = Math.max(0, Math.min(scene.h - H, p.y - H / 2));

  updateMission(dt);
  updateBanking(dt);
  updateHeatDecay(dt);
  const inter = nearestInteraction();
  let jackTarget = null;
  if (!p.inCar && state.hubCars && state.flags.freeRoam && state.scene === 'hub') {
    let jd = 36;
    for (const c of state.hubCars) {
      const d = Math.hypot((p.x + 8) - (c.x + 17), (p.y + 8) - (c.y + 7));
      if (d < jd) { jackTarget = c; jd = d; }
    }
  }
  // parked cars — the quiet kind of grand theft auto
  if (!p.inCar && state.flags.freeRoam && (state.interactCooldown || 0) <= 0) {
    const spots = PARKED_CARS[state.scene];
    if (spots) {
      for (const s of spots) {
        if ((state['parkedCd' + s.id] || 0) > state.time) continue;
        if (Math.hypot(p.x - s.x, p.y - s.y) < 36 && interactPressed()) {
          state.interactCooldown = .8;
          state['parkedCd' + s.id] = state.time + 240;
          p.inCar = true;
          p.speed = Math.round(s.speed * (state.flags.engineTune ? 1.15 : 1));
          p.carColor = s.color;
          p.carName = s.name;
          p.carDamage = 0; p.carV = 0;
          if (!blockedAt(s.x + 9, s.y - 2)) { p.x = s.x + 9; p.y = s.y - 2; }
          state.stats.carsStolen = (state.stats.carsStolen || 0) + 1;
          const alarm = Math.random() < .4;
          if (alarm) {
            state.flags.heat = Math.min(5, (state.flags.heat || 0) + .8);
            audio.sfx('honk'); audio.sfx('denied');
            spawnEffect(s.x, s.y - 18, 'ALARM!', '#ff5a5a');
          } else audio.sfx('door');
          spawnEffect(s.x, s.y - 8, s.name.toUpperCase(), '#ffe78a');
          startDialog([
            { speaker: 'narrator', text: `${s.desc} Keys in the visor — New Jersey and Queens run on trust and poor judgment. ${alarm ? 'The alarm screams for exactly as long as it takes you to remember you do not care.' : 'No alarm. Nobody ever locks anything worth stealing.'}` },
            { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? (alarm ? 'EVERYBODY RELAX! It’s my car! I mean — it WILL be my car! Once I move it!' : 'Parked, unlocked, keys in the visor. This city WANTS me to succeed!') : (alarm ? 'Yeah, yeah. Sing me a song. You’re mine now.' : s.line) }
          ]);
          break;
        }
      }
    }
  }
  if (jackTarget && (state.interactCooldown || 0) <= 0 && state.flags.freeRoam && interactPressed()) {
    // GTA carjacking: yank a driver out of a passing car
    const jack = jackTarget;
    state.interactCooldown = .8;
    state.hubCars.splice(state.hubCars.indexOf(jack), 1);
    p.inCar = true;
    p.speed = Math.round((185 + Math.random() * 40) * (state.flags.engineTune ? 1.15 : 1));
    p.carColor = jack.color;
    p.carDamage = 0; p.carV = 0;
    if (!blockedAt(jack.x + 9, jack.y - 2)) { p.x = jack.x + 9; p.y = jack.y - 2; }
    state.flags.heat = Math.min(5, (state.flags.heat || 0) + .6);
    state.stats.carsStolen = (state.stats.carsStolen || 0) + 1;
    audio.sfx('door'); audio.sfx('crash');
    spawnEffect(p.x + 8, p.y - 10, 'OUT OF THE CAR!', '#ff9a7a');
    const roll = Math.random();
    if (roll < .12) {
      // unmarked cop car. bad choice.
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1.4);
      audio.sfx('honk');
      startDialog([
        { speaker: 'narrator', text: 'The driver flashes a badge, sighs the sigh of a man whose paperwork just doubled, and radios it in. Unmarked unit. Of course.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A COP?! I thought the mustache was a fashion choice! I want it on the record that I was BORROWING!' : 'Maronn’ — a cop. Nothing personal, officer. It’s a Jersey thing.' }
      ]);
    } else if (roll < .27) {
      // wrong guy to jack: he squares up
      spawnEffect(jack.x + 8, jack.y - 24, 'BAD PICK!', '#ff6a6a');
      state.brawler = { x: jack.x + 4, y: jack.y - 18, hp: 3, state: 'prowl', t: 0, tx: jack.x, ty: jack.y, barkT: 2.4, bark: 'You picked the WRONG car, pal!', swingT: 0, hitT: 0 };
      startDialog([
        { speaker: 'narrator', text: 'The driver does NOT exit through the door. He exits through his OPTIONS — and he’s all out. He squares up.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why is everyone in this state so angry?! It’s a lease — I checked the registration!' : 'Oh, you wanna go? Over a four-cylinder? Fine. FINE.' }
      ]);
    } else {
      const victim = { kind: ['womanC', 'womanD', 'womanB'][Math.floor(Math.random() * 3)], x: jack.x + 4, y: jack.y - 18, region: { x: 40, y: 40, w: 600, h: 300 }, speed: 46, tx: jack.x - 120, ty: jack.y - 60, pause: 0, dir: 'down', barkT: 2.4, diveT: 0, fleeing: true, bark: state.player.kind === 'george' ? 'MY CAR! That’s a lease!' : 'please — I have a family — take the car!' };
      ambientFor(state.scene).push(victim);
      startDialog([
        { speaker: 'narrator', text: 'You open the door. The driver opens his mouth, thinks better of it, and exits through it.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m not stealing — I’m relocating! That’s a thing! People relocate cars!' : 'You shoulda locked the door, pal. First rule of Jersey.' }
      ]);
    }
  } else if (!inter && interactPressed() && (state.interactCooldown || 0) <= 0 && state.flags.freeRoam) {
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
    } else if (inter && interactPressed() && (state.interactCooldown || 0) <= 0) {
    audio.sfx('confirm');
    spawnEffect(state.player.x + 8, state.player.y - 8, inter.label.toUpperCase().slice(0, 15), '#ffe78a');
    inter.action();
  }
}

function toast(text) {
  state.toastMsg = { text, t: 2.6 };
  audio.sfx && audio.sfx('denied');
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

let _niKey = '';
function nearestInteraction() {
  const key = state.frameCount + '|' + state.scene;
  if (key === _niKey && nearestInteraction._cache !== undefined) return nearestInteraction._cache;
  const v = nearestInteractionImpl();
  nearestInteraction._cache = v;
  _niKey = key;
  return v;
}
function nearestInteractionImpl() {
  const scene = scenes[state.scene];
  if (!scene) return null;
  const list = scene.interactions().filter((i) => (typeof i.hidden === 'function' ? !i.hidden() : !i.hidden));
  if (state.flags.freeRoam && state.scene === 'yankees') {
    list.push({ x: 560, y: 100, w: 40, h: 30, radius: 40, label: 'The intercom', action: () => {
    audio.sfx('denied');
    const rants = [
      'WHO TOUCHED THE INTERCOM?! COSTANZA?! IS THAT YOU?! GET IN HERE! Actually — DON’T! I’m in a meeting with myself!',
      'This is Steinbrenner! Whoever pressed this button — I admire the initiative! You’re fired! The initiative doesn’t matter!',
      'INTERCOMS are for EMERGENCIES! Is the mustard spicy brown yet?! THEN IT’S NOT AN EMERGENCY!',
      'I was in the middle of a very important nap— MEETING! A very important MEETING about naps— NAPS OF BUSINESS!'
    ];
    startDialog([
      { speaker: 'narrator', text: 'You press the intercom. Every speaker in the stadium clears its throat at once.' },
      { speaker: 'steinbrenner', text: rants[Math.floor(Math.random() * rants.length)] }
    ]);
  } });
  list.push({ x: 480, y: 150, w: 44, h: 34, radius: 40, label: 'George’s desk', action: () => {
    if (state.player.kind === 'george') {
      if (!state.flags.deskNap) {
        state.flags.deskNap = true;
        state.money += 60;
        audio.sfx('cash');
        startDialog([
          { speaker: 'narrator', text: 'George’s desk: a monument to appearing busy. The drawer contains a nap mat, a sandwich from March, and $60 in per diem George never reported. It’s yours now. It was always yours.' },
          { speaker: 'george', text: 'The nap mat! My sweet nap mat! I wondered where — I mean, I’ve never seen this desk before in my life!' }
        ]);
      } else startDialog([{ speaker: 'narrator', text: 'The desk sits quiet, its nap mat undisturbed, its sandwich unaged beyond what science can explain.' }]);
    } else {
      startDialog([
        { speaker: 'narrator', text: 'Tony studies the desk of a man who is paid to do nothing and does it poorly. Somewhere deep in his soul, a respect forms — the purest grift he has ever witnessed, and the man doesn’t even know he’s running it.' },
        { speaker: 'tony', text: 'This Costanza. He’s got the safest job in America and he complains about it. That’s not a worker. That’s an artist.' }
      ]);
    }
  } });
  }
  if (state.flags.freeRoam && !OUTDOOR_SCENES.includes(state.scene)) {
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
    if (d < (it.radius || 32) && (d < bestD - .01 || (Math.abs(d - bestD) <= .01 && best && it.w * it.h < best.w * best.h))) {
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
  if (state.flags.freeRoam) list.push({ x: 500, y: 60, w: 44, h: 50, radius: 46, label: 'Mattress — stash cash', action: () => {
    if (state.money < 20) { startDialog([{ speaker: 'narrator', text: 'The mattress. King size, queen problems. You need at least $20 on you to make a deposit worth hiding. Every dollar you carry is a dollar the cops can fine — what’s in the mattress, they never find.' }]); return; }
    const amt = Math.max(20, Math.floor(state.money * .6));
    state.money -= amt;
    state.flags.stash = (state.flags.stash || 0) + amt;
    audio.sfx('cash');
    startDialog([
      { speaker: 'narrator', text: `You fold $${amt} into the mattress, in the spot even Carmela doesn’t know. Mattress total: $${state.flags.stash}. The mattress does not judge. The mattress does not testify.` },
      { speaker: 'system', text: `Carrying $${state.money} · mattress $${state.flags.stash}. Busted fines only touch what you carry.` }
    ]);
  } });
  if (state.flags.freeRoam) list.push({ x: 548, y: 60, w: 44, h: 50, radius: 46, label: 'Mattress — pull the stash', action: () => {
    const stash = state.flags.stash || 0;
    if (!stash) { toast('Nothing in the mattress but springs and secrets.'); return; }
    state.money += stash;
    state.flags.stash = 0;
    audio.sfx('cash');
    saveWorld();
    startDialog([{ speaker: 'narrator', text: `You pull the whole stash — $${stash} — out of the mattress. It smells faintly of sleep and good decisions. You’re carrying $${state.money}. Spend it before you’re in a position to explain it.` }]);
  } });
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
    const small = o.type === 'money' || o.type === 'gabagool';
    const ow = small ? 18 : 24, oh = small ? 14 : 40;
    const ox = o.x - ow / 2, oy = o.y - oh / 2;
    const car = { x: d.x - 12, y: d.y - 24, w: 24, h: 46 };
    if (!o.hit && rectsOverlap(car, { x: ox, y: oy, w: ow, h: oh })) {
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
    list.push({ x: 242, y: 60, w: 30, h: 24, radius: 42, label: 'The Superman figurine', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The Superman figurine stands on the shelf, mid-stride, eternal. George regards it with the reverence of a man who once tried to get into a shootout over a parking space because — and this is documented — Superman would never back down from a spot.' },
        { speaker: 'george', text: 'You know what Superman’s greatest power is? Restraint. The man could END you, but no. Flight is second. Restraint is first. I have flight.' },
        { speaker: 'narrator', text: 'He does not have flight.' }
      ] : [
        { speaker: 'narrator', text: 'A Superman figurine on the shelf. Jerry’s whole deal in one object: the strongest guy in the world, permanently walking nowhere, dusted twice a week. Tony doesn’t get it, then gets it completely, then stops getting it out of respect.' }
      ]);
    } });
    list.push({ x: 500, y: 200, w: 40, h: 30, radius: 34, label: 'The stereo', action: () => {
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'Jerry’s stereo: tuner, tape deck, turntable, and a CD rack alphabetized by a mind that has nothing — NOTHING — more urgent to do. The record currently on the turntable is a comedy album. The comic is nobody you’ve heard of. The comic is somebody Jerry opened for once, a fact now etched into the vinyl itself.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He alphabetized VINYL. You can’t alphabetize vinyl! The genre IS the alphabet! I’m not even mad. I’m impressed, and I hate that I’m impressed.' : 'Guy alphabetizes records but can’t remember to lock his door. Priorities. Honestly? I respect it a little. Don’t tell him.' }
      ]);
    } });
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
    list.push({ x: 20, y: 120, w: 46, h: 70, radius: 44, label: 'The fridge', action: () => {
      startDialog([
        { speaker: 'narrator', text: 'Jerry’s fridge: twelve condiments, a jungle of leftover containers labeled in his handwriting — “TURKEY — DO NOT OPEN UNTIL THURSDAY” — it is Wednesday. The tension is exquisite.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He LABELS them! With the DATE! You know who else labels food with dates? NOBODY! Civilization is a LIE, Jerry!' : 'Guy’s got a system for leftovers. In my family, leftovers are a rumor. The food never lives that long.' },
        { speaker: 'jerry', text: 'Touch nothing. The containers are in a very specific order. There’s a dairy rotation. DAIRY. ROTATION.' }
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
  list.push({ x: 60, y: 120, w: 40, h: 34, radius: 40, label: 'Jukebox — $1 a song', action: () => {
    if (state.money < 1) { toast('A dollar. The jukebox is the cheapest vice in this building.'); return; }
    state.money -= 1;
    audio.sfx('pickup');
    const picks = [
      { m: 'club', t: 'Woke Up This Morning — the house standard. Silvio nods once, the highest honor the Bing bestows.' },
      { m: 'house', t: 'The Godfather waltz. Half the room goes quiet out of pure instinct. The other half out of respect.' },
      { m: 'dream', t: 'A slow one. The dancers hold still, unsure. Somewhere in the back, Paulie starts telling the same story for the fourth time.' }
    ];
    const pick = picks[Math.floor(Math.random() * picks.length)];
    audio.setMusic(pick.m);
    startDialog([{ speaker: 'narrator', text: 'Your dollar clunks down. ' + pick.t }]);
  } });
  list.push({ x: 590, y: 120, w: 40, h: 34, radius: 40, label: 'Back office safe', action: () => {
    if ((state.money || 0) < 50) { toast('Silvio doesn’t hold less than $50. It’s a dignity thing.'); return; }
    const deposit = Math.min(state.money, Math.floor(state.money / 2));
    state.money -= deposit;
    state.flags.banked = (state.flags.banked || 0) + deposit;
    audio.sfx('cash');
    startDialog([
      { speaker: 'narrator', text: `Silvio counts $${deposit} into the office safe with the tenderness of a man tucking in a child. “Half of what you carry — house rules. It’s safe here. Safer than you are.” Total banked: $${state.flags.banked}.` },
      { speaker: 'silvio', text: 'Busted out there, they take what you’re carrying. What’s in here? Never happened. That’s the beauty of a safe — officially, it’s empty.' }
    ]);
  } });
  list.push({ x: 590, y: 160, w: 40, h: 30, radius: 40, label: 'Withdraw from safe', action: () => {
    if (!(state.flags.banked > 0)) { toast('The safe is empty. Officially it was always empty.'); return; }
    const amt = state.flags.banked;
    state.flags.banked = 0;
    state.money += amt;
    audio.sfx('cash');
    startDialog([{ speaker: 'narrator', text: `Silvio opens the safe and hands you $${amt} in bills that have never met a serial number database. “Spend it in good health. Or bad health. Health is your business.”` }]);
  } });
  list.push({ x: 300, y: 320, w: 60, h: 34, radius: 42, label: 'Executive game — $20 ante', action: () => {
      if (!state.flags.freeRoam) return;
      startDialog([
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A card game! With CRIMINALS! …I mean — what criminals. These are businessmen. I’m also a businessman. Vandelay. You may have heard.' : 'The executive game. Silvio’s been running it since before the floods. Twenty in, cards don’t lie — people do, constantly, but the cards are straight.' }
      ], () => initPoker());
    } },
    { x: 400, y: 250, w: 60, h: 50, radius: 44, label: 'Dance floor', action: () => {
    audio.sfx('pickup');
    startDialog(state.player.kind === 'george' ? [
      { speaker: 'narrator', text: 'George hits the dance floor with the confidence of a man who has never once been filmed dancing. The little kicks! The thumbs! Somewhere, Elaine feels a disturbance, as if a million happy feet cried out at once.' },
      { speaker: 'george', text: 'This is it! This is the move! …Why is everyone looking at me? LOOK AWAY!' }
    ] : [
      { speaker: 'narrator', text: 'Tony Soprano does not dance. Tony stands on the dance floor moving with the gravity of a glacier that has decided, tonight only, to slightly groove. The floor clears around him out of respect. Or fear. Same thing.' },
      { speaker: 'tony', text: 'What? A guy can’t enjoy music? It’s Thanksgiving. Even the Bing has a heart.' }
    ], () => initDanceOff());
  } });
  list.push({ x: 150, y: 380, w: 40, h: 28, radius: 40, label: 'Janice', action: () => {
    startDialog([
      { speaker: 'narrator', text: 'The laugh hits you before the person does — a sound like a seagull being interrogated. Janice. OH. MY. GOD.' },
      { speaker: 'janice', text: 'Oh my GOD! Look at you! Out on Thanksgiving eve! Living your LIFE! I love that! I LOVE that for you!' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'The laugh. THE LAUGH! It’s in my bones now! It lives there! I’ll hear it in the SHOWER!' : 'Janice. Always a pleasure. …I gotta go check on a thing. In the back. Permanently.' },
      { speaker: 'janice', text: 'You know who needs a man with YOUR energy? Everybody! EVERYBODY NEEDS THAT! Oh my god — is that the buffet?! Later, handsome!' }
    ]);
  } });
  list.push({ x: 240, y: 380, w: 60, h: 28, radius: 40, label: 'Buy a round', action: () => {
    if (state.money < 100) { toast('A round for the house is $100.'); return; }
    state.money -= 100;
    state.flags.heat = Math.max(0, (state.flags.heat || 0) - 1);
    audio.sfx('cash');
    audio.sfx('success');
    startDialog([
      { speaker: 'narrator', text: 'You put a hundred on the bar and say the two most beautiful words in the English language. The Bing erupts. Glasses rise. Somewhere, a cop losing your description in his notebook.' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A HUNDRED DOLLARS! I just spent a HUNDRED DOLLARS on STRANGERS! …They love me though. They really love me!' : 'Everybody eats, everybody drinks, everybody forgets what I look like. Best hundred in the business.' }
    ]);
  } });
  list.push({ x: 320, y: 330, w: 60, h: 30, radius: 42, label: 'Dice game', action: () => {
    if (state.mode === 'craps') return;
    if (state.money < 25) { toast('The dice game is $25 minimum.'); return; }
    state.mode = 'craps';
    state.craps = { bet: 25, phase: 'choose', pick: null, t: 0 };
    audio.sfx('pickup');
  } });
  list.push({ x: 202, y: 182, w: 40, h: 42, label: 'Christopher', action: () => {
    if (!state.mission && state.flags.freeRoam && state.flags.gravyChainDone && !state.flags.screenplayDone) {
      startMission('screenplay');
      startDialog([
        { speaker: 'christopher', text: 'T’ — hey. You can’t tell nobody. I wrote a screenplay. It’s — look, the guys CANNOT read it. There are copies. Three. One in the back, one at the pork store, one I was workshopping at this cabin in the Pines — don’t ask. Destroy them. ALL of them. $210 and my eternal gratitude. You read NONE of it.' },
        { speaker: 'system', text: 'Mission accepted: THE SCREENPLAY. Destroy all copies. Do not read the copies.' }
      ]);
      return;
    }
    if (!talked.christopher) { clubTalk('christopher'); return; }
    startDialog([{ speaker: 'christopher', text: state.flags.screenplayDone ? 'I’m outlining a new one. It’s about a guy who can’t get a pilot made. It’s called a TRAGEDY. You heard nothin’.' : 'You hear that engine? Could be nothin’. Could be a guy with a small head start.' }]);
  } });
  list.push({ x: 396, y: 182, w: 40, h: 42, label: 'Paulie', action: () => {
    if (!state.mission && state.flags.freeRoam && state.flags.fixedRaceDone && !state.flags.paulieShoeDone) {
      startMission('paulieShoe');
      startDialog([
        { speaker: 'paulie', text: 'I been waitin’ for somebody I can trust. Couple months back — hypothetical — a guy loses a shoe in the Pine Barrens. ITALIAN shoe. Hand-stitched. The circumstances are nobody’s business but they involve a Russian and a severe underestimation of a civilian. Go find it. $190. And if anybody asks — it’s YOUR shoe.' },
        { speaker: 'system', text: 'Mission accepted: THE MISSING SHOE. The Pine Barrens keep what they keep.' }
      ]);
      return;
    }
    if (!talked.paulie) { clubTalk('paulie'); return; }
    startDialog([
      { speaker: 'paulie', text: state.flags.paulieShoeDone ? 'Still no shoe. I wear the galoshes now. My mother says they’re “sensible.” It’s the worst thing she’s ever said to me.' : ['Heh? Oh. Don’t sneak up like that.', 'Wings are growin’ in nice. Very regal.', 'You hear that? Sounds like pine trees. Laughing.'][Math.floor((state.time / 30) % 3)] }
    ]);
  } });
  list.push({ x: 304, y: 132, w: 40, h: 42, label: 'Silvio', action: () => {
    if (!state.mission && state.flags.freeRoam && state.flags.bigScoreDone && !state.flags.soupSummitDone) {
      startMission('soupSummit');
      state.money += 12;
      startDialog([
        { speaker: 'silvio', text: 'Competitive intelligence. There’s a soup operation in Manhattan — you know the one. Lines around the block. A dictator with a ladle. Artie’s losing customers to a COUNTER.' },
        { speaker: 'silvio', text: 'Here — twelve bucks, expense account. EXACT change, remember. You come back with soup or you come back with twelve bucks. You do NOT come back with explanations.' },
        { speaker: 'silvio', text: 'Get me two containers — mulligatawny and the crab bisque — unshaken, unspilled, and you do NOT anger the man. Artie tastes, we assess. This is industrial espionage, soup division. $260. And kid — exact change.' },
        { speaker: 'system', text: 'Mission accepted: THE SOUP SUMMIT. Two worlds. One ladle.' }
      ]);
    } else if (!state.mission && state.flags.freeRoam && state.flags.sitDownDone && !state.flags.bigScoreDone) {
      startMission('bigScore');
      state.registerCd_bodega = 0;
      state.registerCd_slice = 0;
      state.registerCd_casino = 0; // the window only opens if the registers are actually robbable
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
      startDialog([
        { speaker: 'silvio', text: 'You want the big one? The BIG one? Fine. Three hits, one night: the bodega in the Heights, the slice joint, and then — the Dunes cage. In and out, no stopping, no heroics. The clock is your worst enemy. Well — second worst.' },
        { speaker: 'silvio', text: '$400 for the night’s work. You get busted, you never heard of me, and I DEFINITELY never heard of you. Clock starts now.' },
        { speaker: 'system', text: 'Mission accepted: THE BIG SCORE. Three hits before the window closes.' }
      ]);
    } else if (!state.mission && state.flags.freeRoam && state.flags.soupSummitDone && !state.flags.interventionDone) {
      startMission('intervention');
      startDialog([
        { speaker: 'silvio', text: 'It’s Christopher. He’s been… erratic. The screenplay thing was a cry for help. Possibly the noise he makes IS the cry, nobody’s sure. We’re doing an intervention — tonight, back room. I need bodies. Paulie, Artie, the doctor. Nobody volunteers for these things, which is why you’re volunteering. $260.' },
        { speaker: 'system', text: 'Mission accepted: THE INTERVENTION. Supportive confrontation, Jersey style.' }
      ]);
    } else if (!state.mission && state.flags.freeRoam && state.flags.screenplayDone && !state.flags.sitDownDone) {
      startMission('sitDown');
      startDialog([
        { speaker: 'silvio', text: 'One more thing. Two of our — associates — got a beef over a parking spot at the Willowbrook Mall. It’s escalated. There was a shopping cart incident. It needs a sit-down before somebody does something we all gotta explain.' },
        { speaker: 'silvio', text: 'The Endgame Diner, back booth, tonight. Neutral ground — nobody gets clipped in a diner. It’s a law of physics. You mediate. $220 for keeping the peace.' },
        { speaker: 'system', text: 'Mission accepted: THE SIT-DOWN. Neutral ground. Bottomless coffee.' }
      ]);
    } else if (!state.mission && state.flags.bigMouthDone && !state.flags.pineRunnerDone && state.flags.freeRoam) {
      startMission('pineRunner');
      state.flags.heat = Math.max(state.flags.heat || 0, 3);
      startDialog([
        { speaker: 'silvio', text: 'Last thing. You’re hot right now — I may have made you hot, details. The heat dies in the Pine Barrens. Get there before the clock does. $300, and don’t stop for the geese.' },
        { speaker: 'system', text: 'Mission accepted: PINE RUNNER. The heat is ON — drive south!' }
      ]);
    } else if (!state.mission && state.flags.fixedRaceDone && state.flags.freeRoam) {
      const drops = [
        { scene: 'vesuvio', x: 320, y: 250, radius: 60, name: 'Vesuvio — Artie’s expecting you. He’s always expecting you. That’s the problem with Artie' },
        { scene: 'satriale', x: 320, y: 200, radius: 60, name: 'the pork store — the back office, not the counter' },
        { scene: 'slice', x: 320, y: 200, radius: 60, name: 'Ray’s in the city — the ORIGINAL Ray’s. they know which one' },
        { scene: 'taffy', x: 320, y: 200, radius: 60, name: 'the taffy shop on the boardwalk — even the shore pays tribute in season. it’s ALWAYS season' }
      ];
      const drop = drops[Math.floor(Math.random() * drops.length)];
      const rolledPayC = 90 + Math.floor(Math.random() * 50);
      startMission('collection');
      state.mission.payout = rolledPayC;
      state.mission.steps = [
        { scene: drop.scene, x: drop.x, y: drop.y, radius: drop.radius, objective: `Collect the envelope — ${drop.name.split('—')[0].trim()}`, label: 'the envelope' },
        { scene: 'club', x: 304, y: 132, radius: 46, objective: 'Bring the envelope to Silvio', label: 'Silvio' }
      ];
      startDialog([
        { speaker: 'silvio', text: `Collections, kid. ${drop.name}. Don’t count it in front of them — that’s respect. $${rolledPayC} for the walk.` },
        { speaker: 'system', text: 'Mission accepted: THE COLLECTION. Repeatable — the tribute never sleeps.' }
      ]);
    } else if (!state.mission && state.flags.gravyChainDone && !state.flags.fixedRaceDone && state.flags.freeRoam) {
      startMission('fixedRace');
      startDialog([
        { speaker: 'silvio', text: 'One more. A horse named CRANBERRY SAUCE runs at the Meadowlands in the fifth. The fix is in — our guy knows the guy who walks the guy. Fifty on the nose, watch it come in, bring me the word. $320.' },
        { speaker: 'system', text: 'Mission accepted: THE FIXED RACE. What could go wrong — it’s fixed.' }
      ]);
    } else if (!state.mission && state.flags.pineRunnerDone && !state.flags.gravyChainDone && state.flags.freeRoam) {
      startMission('gravyChain');
      startDialog([
        { speaker: 'silvio', text: 'Emergency, kid. Tonight’s rush at the Bing and the gravy situation is CRITICAL. Artie keeps a reserve — get it, spice it at the pork store, bring it here hot. Nothing gets cold tonight. Nothing. $260.' },
        { speaker: 'system', text: 'Mission accepted: THE GRAVY CHAIN. The gravy must flow.' }
      ]);
    } else if (!state.mission && state.flags.turkeyTaxDone && !state.flags.bigMouthDone && state.flags.freeRoam) {
      startMission('bigMouth');
      startDialog([
        { speaker: 'silvio', text: 'One more thing. A courier’s been walking envelopes through the neighborhood that ain’t ours. Tail him. Close enough to see, far enough he don’t feel you. He makes you, you’re done. $250.' },
        { speaker: 'system', text: 'Mission accepted: BIG MOUTH. Follow the objective banner.' }
      ]);
    } else if (!state.mission && !state.flags.turkeyTaxDone && state.flags.freeRoam) {
      startMission('turkeyTax');
      startDialog([
        { speaker: 'silvio', text: 'Hey. Boss’s orders — the Thanksgiving envelopes don’t collect themselves. Vesuvio first, then Satriale’s. Bring ’em back moist. $180 for the legwork.' },
        { speaker: 'system', text: 'Mission accepted: THE TURKEY TAX. Follow the objective banner.' }
      ]);
    } else clubTalk('silvio');
  } });
  if (state.flags.clubReady && !state.flags.freeRoam) list.push({ x: 292, y: 246, w: 58, h: 36, label: 'Carve turkey', action: finalDinner });
  if (state.flags.freeRoam) {
    list.push({ x: 430, y: 250, w: 90, h: 50, radius: 28, label: 'Arm-wrestle the bouncer', action: () => {
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
    list.push({ x: 600, y: 250, w: 40, h: 50, radius: 26, label: 'Slot machine', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The Bing’s one slot machine. Silvio won it in a card game. The previous owner won it in a worse card game. It has never paid out since 1987, allegedly.' },
        { speaker: 'george', text: 'Slots! The thinking man’s no-skill game! Twenty bucks a pull — I have a system: I pull exactly until I’m out of money!' }
      ] : [
        { speaker: 'narrator', text: 'The back-corner slot. It eats coins, dreams, and Christopher’s paychecks, in that order.' },
        { speaker: 'tony', text: 'One machine, no witnesses, infinite hope. The perfect Italian dessert.' }
      ], () => initSlots());
    } });
    list.push({ x: 100, y: 260, w: 50, h: 40, radius: 30, label: 'Racing form', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A racing form, grease-stained, annotated in three different pens. Kramer’s handwriting: “NO SOUP — SURE THING.” A second annotation: “KRAMER IS AN IDIOT —SURE THING.” Same handwriting.' },
        { speaker: 'george', text: 'Twenty dollars a race! I once won forty dollars on a horse named after a sandwich! This is my HERITAGE!' }
      ] : [
        { speaker: 'narrator', text: 'The Bing’s racing form. Paulie’s system: bet the horse with the funniest name. Paulie is currently banned from two tracks.' },
        { speaker: 'tony', text: 'Horses. The one thing in this world that runs honest. Everything else — meh.' }
      ], () => initRacing());
    } });
    list.push({ x: 520, y: 180, w: 40, h: 40, radius: 28, label: 'Dartboard', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The Bing’s dartboard. Someone has thrown a dart into the “wasted” region of a family photo pinned beside it. Nobody remembers whose family.' },
        { speaker: 'george', text: 'Darts! A game of pure geometry! I have a mathematically perfect throw — high elbow, dead wrist, ZERO follow-through! The follow-through is a scam!' }
      ] : [
        { speaker: 'narrator', text: 'The dartboard. Silvio once hit a bullseye from the door. Nobody saw it. Everyone agreed they saw it.' },
        { speaker: 'tony', text: 'Darts at the Bing. The only place in Jersey where sharp objects flyin’ is a game and not a Tuesday.' }
      ], () => initDarts());
    } });
    list.push({ x: 520, y: 250, w: 80, h: 50, radius: 28, label: 'Blackjack table', action: () => {
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
    { x: 400, y: 120, w: 50, h: 34, radius: 42, label: 'The private room', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Vesuvio’s private party room: red leather, low light, a table for twelve that has hosted more “legitimate business” than any courthouse in Essex County. George sits at the head chair for exactly four seconds before fear removes him.' },
        { speaker: 'george', text: 'I sat in the chair! Did anyone see?! Was that the boss chair?! I don’t want to be a boss! I barely want to be a middle manager! IS THERE A MIDDLE-MANAGER CHAIR?' }
      ] : [
        { speaker: 'narrator', text: 'The private room at Vesuvio. Tony runs a hand along the table — same scratches, same wine ring from 1987, same everything. Some things hold. He sits for a moment in the quiet, and the restaurant noise dims like the room itself is being respectful.' },
        { speaker: 'tony', text: 'Artie keeps this room perfect. You know how rare that is? Perfect? You eat the meal, you drink the wine, you don’t ask what the table heard. That’s the deal.' }
      ]);
    } },
    { x: 300, y: 120, w: 44, h: 34, radius: 44, label: 'Grappa for the kitchen', action: () => {
      if (state.money < 30) { toast('Grappa for the whole kitchen runs $30.'); return; }
      state.money -= 30;
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .75);
      audio.sfx('cash');
      spawnEffect(state.player.x, state.player.y - 16, 'SALUTE!', '#ffd23e');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George buys the kitchen a round of grappa. Artie emerges, red-faced and glowing, and hugs him like family. In this restaurant, for this one night, George Costanza is family.' },
        { speaker: 'artie', text: 'The man! THE MAN! Anything — anything — you ever need, George. Private table. Off-menu. The good chairs!' },
        { speaker: 'george', text: 'The GOOD chairs? …Why are there bad chairs? WHAT DO YOU KNOW ABOUT THE CHAIRS?' }
      ] : [
        { speaker: 'narrator', text: 'Tony sends grappa to the kitchen. Artie comes out weeping with gratitude — a grown man crying over distilled stems and skins, and everyone present respects it.' },
        { speaker: 'artie', text: 'Tony. TONY. You remember the little guys. THAT’S why they say what they say about you.' },
        { speaker: 'tony', text: 'What do they say? …No, seriously. What exactly are they saying? Tell me everything.' }
      ]);
    } },
    { x: 280, y: 330, w: 80, h: 40, radius: 46, label: 'The Feast', action: () => {
      if (!state.flags.bigOneDone || !state.flags.kramericaBookDone || !state.flags.pineRunnerDone) {
        toast('Something’s being prepared here. Finish the crews’ work first — Newman, Kramer, Silvio.');
        return;
      }
      if (state.flags.feastDone) {
        startDialog([{ speaker: 'artie', text: 'The leftovers are in the back. They are, technically, eternal. Help yourself — forever.' }]);
        return;
      }
      state.flags.feastDone = true;
      state.money += 1000;
      state.flags.heat = 0;
      audio.sfx('cash');
      audio.sfx('success');
      startDialog([
        { speaker: 'narrator', text: 'The doors close. The sign flips to PRIVATE. Every table in Vesuvio fills at once — Silvio, Paulie, Christopher, Artie, Kramer sliding in sideways, Newman uninvited but present, even the Soup Man’s nephew. The table groans under the weight of it.' },
        { speaker: 'artie', text: 'For the two who ran every job this season — the courier kings of the tri-state area! Veal, turkey, the big salad, and ONE — count it — ONE marble rye!' },
        { speaker: 'silvio', text: 'You moved product through three counties and a boardwalk. The boss says the tribute is forgiven, the heat is forgotten, and this — a thousand, cash — is the cleanest money you’ll ever make. Salut.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m being TOASTED! By MOBSTERS! This is the greatest day of my life and I can never tell my parents!' : 'This is what it’s about. The food, the family — even the mailman. Everybody eats. HAPPY THANKSGIVING, ya miserable convicts.' },
        { speaker: 'system', text: 'THE FEAST — all mission chains complete. +$1000, heat cleared. The world stays open — the shore, the city, the Pines are all still out there.' }
      ]);
    } },
    { x: 210, y: 140, w: 60, h: 34, radius: 42, label: 'Help in the kitchen', action: () => {
      if (!state.flags.freeRoam) return;
      startDialog([
        { speaker: 'artie', text: 'You want to help? During the RUSH? …You know what, yes. God help me, yes. Tickets come up, you build the plate — sauce, cheese, basil, fire, in the order on the slip. Wrong ingredient and the plate is dead. You get paid per plate. Don’t burn anything that isn’t supposed to be burnt.' }
      ], () => initKitchen());
    } },
    { x: 320, y: 176, w: 48, h: 44, label: 'Artie', action: () => {
      if (!state.mission && !state.flags.artiesMenuDone && state.flags.turkeyTaxDone && state.flags.freeRoam) {
        startMission('artiesMenu');
        startDialog([
          { speaker: 'artie', text: 'Tony — thank god — a FRIEND! Tonight’s rush and I got NOTHING — the supplier shorted me, the fish guy’s at his mother’s, the bread — don’t ask about the bread! Get me the reserve gabagool from the pork store, bread from that bodega in the city, a fish — fresh — and I owe you forever. $280!' },
          { speaker: 'system', text: 'Mission accepted: THE LAST SUPPLY. The rush waits for no man.' }
        ]);
        return;
      }
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
    { x: 270, y: 220, w: 60, h: 40, radius: 42, label: 'Trivia night', action: () => {
      if (state.mode === 'trivia') return;
      if (state.money < 10) { toast('Trivia entry is $10.'); return; }
      state.money -= 10;
      state.mode = 'trivia';
      const bank = [
        { q: 'The Soup Man’s most famous rule?', a: 'no soup for you', opts: ['no soup for you', 'soup for all'] },
        { q: 'What’s in the Pine Barrens?', a: 'an interior decorator', opts: ['an interior decorator', 'a picnic'] },
        { q: 'Vandelay Industries exports…', a: 'latex', opts: ['latex', 'coffee tables'] },
        { q: 'Frank Costanza’s holiday?', a: 'festivus', opts: ['festivus', 'feastivus'] },
        { q: 'Satriale’s is a…', a: 'pork store', opts: ['pork store', 'bakery'] },
        { q: 'George’s alter ego architect?', a: 'art vandelay', opts: ['art vandelay', 'buck n'] },
        { q: 'The big salad requires…', a: 'big lettuce', opts: ['big lettuce', 'small forks'] },
        { q: 'Tony sees Dr. Melfi for…', a: 'panic attacks', opts: ['panic attacks', 'foot pain'] }
      ];
      const qs = [];
      const pool = bank.slice();
      while (qs.length < 3 && pool.length) qs.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      state.trivia = { qs, i: 0, right: 0, pick: null, resultT: 0 };
      audio.sfx('pickup');
    } },
    { x: 520, y: 160, w: 60, h: 40, radius: 40, label: 'Open mic', action: () => {
      const sets = [
        [
          { speaker: 'jerry', text: 'What is the deal with Thanksgiving? It’s the only holiday where the main event is a creature that can’t even fly properly. It’s not a bird, it’s a rumor with feathers!' },
          { speaker: 'narrator', text: 'The crowd chuckles. One man in the back laughs too hard and is quietly asked to leave. This is how comedy stays pure.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He’s gotten better! I hate that. His improvement is a personal attack on me!' : 'Kid’s got timing. Reminds me of a guy we used to know. Don’t ask what happened to the guy.' }
        ],
        [
          { speaker: 'bania', text: 'So I’m at the dry cleaner — and I just want to say: where do the hangers GO?! They come from nowhere, they return to nowhere — it’s the Circle of Hangers!' },
          { speaker: 'narrator', text: 'Somewhere, Kenny Bania is doing crowd work at a table that did not consent. The set is mercifully short. The crowd applauds mostly in relief.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'That was AWFUL. Awful! And he’s doing Jerry’s dinner slot next week! I have to fix this! I HAVE to!' : 'I seen worse acts get better tables. I said what I said.' }
        ],
        [
          { speaker: 'jerry', text: 'People in this city don’t walk, they migrate. It’s a crosswalk, not a savanna! Pick a direction and commit — this isn’t a relationship!' },
          { speaker: 'narrator', text: 'A solid little set. The waitress comped his coffee, which in this room is a Grammy.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I could do this. I could absolutely do this. I have observations! SO many observations. I’m told they’re mostly complaints, but still!' : 'He ain’t wrong about the walking. I once followed a guy three blocks just to see if he’d ever decide. He didn’t.' }
        ]
      ];
      const idx = (state.flags.openMicCount || 0) % sets.length;
      state.flags.openMicCount = (state.flags.openMicCount || 0) + 1;
      audio.sfx('pickup');
      startDialog(sets[idx]);
    } },
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
    { x: 420, y: 130, w: 60, h: 30, radius: 38, label: 'Ask about the bread', action: () => {
      audio.sfx('denied');
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .3);
      if (!state.flags.noSoup) {
        state.flags.noSoup = 1;
        startDialog([
          { speaker: 'narrator', text: 'You ask about the bread. The line goes silent. Somewhere in the back, a ladle stops mid-stir. The man looks at you the way a hanging judge looks at a vocabulary test.' },
          { speaker: 'soupNazi', text: 'NO SOUP FOR YOU! Come back — NEVER. One year! You are BANNED. The bread is not for you. NOTHING is for you. NEXT!' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'BANNED?! For a bread INQUIRY?! This is a constitutional issue! There are amendments!' : 'I been thrown outta better places by worse people. You ain’t seen the last of me. …He’s right though. I seen the last of the bread.' }
        ]);
      } else {
        state.flags.noSoup = (typeof state.flags.noSoup === 'number' ? state.flags.noSoup : 1) + 1;
        const yrs = ['ONE', 'TWO', 'THREE', 'FIVE', 'TEN'][Math.min(4, state.flags.noSoup - 1)];
        startDialog([
          { speaker: 'narrator', text: 'You ask about the bread AGAIN. The audacity hangs in the air like a violated prime directive.' },
          { speaker: 'soupNazi', text: `${yrs} YEARS! You want MORE? KEEP TALKING. NEXT!` },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? `The escalation is EXPONENTIAL! At this rate I’m banned until the heat death of the universe!` : `${yrs} years. Guy runs bans like compound interest. I almost respect it. Almost.` }
        ]);
      }
    } },
    { x: 490, y: 268, w: 40, h: 28, radius: 30, label: 'The rules sign', action: () => {
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'The rules, laminated, at eye level: 1) KNOW YOUR ORDER. 2) MONEY READY. 3) MOVE TO THE LEFT. 4) NO COMMENTS. 5) THE BREAD IS NOT FREE. 6) YOU DO NOT ASK ABOUT THE BREAD. There is no rule 7. The absence of rule 7 feels intentional, like a trap.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Rule 5 and rule 6 CONTRADICT! If I can’t ask about the bread, how do I know it’s not free?! It’s a bread paradox! HE’S BUILT A BREAD PARADOX!' : 'Six rules. I know guys with crews that run on fewer. Honestly? Tighter operation than most of Jersey. The bread thing though — that’s just good business.' }
      ]);
    } },
    { x: 300, y: 352, w: 46, h: 26, radius: 30, label: 'The eating counter — soup $6', action: () => {
      if (state.flags.noSoup) {
        audio.sfx('denied');
        startDialog([
          { speaker: 'soupNazi', text: 'YOU! I KNOW YOUR FACE! The bread man! NO SOUP! The ban stands. The ban ALWAYS stands. NEXT!' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He remembers! Of course he remembers! Men like that never forget a bread violation!' : 'Yeah, yeah. I’ll send a guy for mine. Everybody’s got a guy. Even for soup.' }
        ]);
        return;
      }
      if (state.money < 6) { toast('Soup is six dollars, exact change, move to the left.'); return; }
      state.money -= 6;
      audio.sfx('pickup');
      state.time += 2;
      if ((state.flags.hp || 3) < 3) { state.flags.hp = (state.flags.hp || 3) + 1; spawnEffect(state.player.x + 8, state.player.y - 20, '+1 HEALTH', '#9be59b'); }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George eats the mulligatawny in the corner, hunched over the cup like it might be repossessed. It is, he admits privately and only to himself, the best soup he has ever had. He would never say this out loud. Saying it out loud is how they take things away from you.' },
        { speaker: 'george', text: '(whispering) it’s perfect. it’s PERFECT. …you didn’t hear anything.' }
      ] : [
        { speaker: 'narrator', text: 'Tony eats the soup standing at the counter, per the rules, in silence, per the rules. It is excellent soup. Nobody in the place makes eye contact with anyone else. It is the most peaceful meal he has had in months. He understands immediately why there is always a line.' }
      ]);
    } },
    { x: 420, y: 220, w: 44, h: 34, radius: 42, label: 'Mention Newman', action: () => {
      audio.sfx('denied');
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .3);
      startDialog([
        { speaker: 'narrator', text: 'You say the name “Newman” inside the soup stand. The ladles stop. The steam itself seems to flinch. A breadstick falls somewhere in the back, in slow motion.' },
        { speaker: 'artie', text: 'THAT NAME! NOT IN MY STORE! He knew the rules! The bread is for CUSTOMERS! The line is for MOVING! GET OUT BEFORE I— actually, you know what? You stay. You look like you understand soup. But HIM — never again!' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I barely know the man! We’re not close! I mean we’re close-adjacent! DON’T BAN ME, I’M BREAD-COMPLIANT!' : 'Guy runs a tight ship. I respect it. Also, noted: don’t mention the mailman.' }
      ]);
    } },
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
    { x: 140, y: 386, w: 46, h: 22, radius: 30, label: 'The bobblehead shelf', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A shelf of Yankees bobbleheads nods in perfect sync with the office air conditioning. George recognizes every face. He nods back, once, at one of them. It keeps nodding. He nods again. He is in a relationship now.' },
        { speaker: 'george', text: 'This one gets it. This one has ALWAYS gotten it. I want one for the dashboard. Nobody would know. They have dozens. They wouldn’t MISS one—' },
        { speaker: 'narrator', text: 'He does not take it. The nodding continues. It feels like approval.' }
      ] : [
        { speaker: 'narrator', text: 'A wall of bobbleheads nodding in the draft. Tony nods back once, out of respect for the posture. One of them is slightly newer than the rest. Even the shelf has a guy who just made his bones.' }
      ]);
    } },
    { x: 490, y: 55, w: 40, h: 30, radius: 30, label: 'The cotton uniforms file', action: () => {
      if (!state.flags.cottonUniformsDone) { toast('The file cabinet is locked. Something about it feels — breathable, yet secure.'); return; }
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'The uniforms file, now unsealed: fabric swatches, ventilation diagrams, and a memo titled simply “THE BREATHING — RESULTS.” The results are a single line: “They breathe too much.” Under it, in different handwriting: “They breathed EXACTLY the right amount. — W.” The war over the uniforms is in its fifth year. Both sides have lost.' },
        { speaker: 'system', text: 'A piece of Yankees history. Polyester never had a chance.' }
      ]);
    } },
    { x: 480, y: 386, w: 60, h: 22, radius: 28, label: 'The stadium seats view', action: () => {
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'Through the office window: the stadium seats in the rain, empty, row on row. Somewhere down there a tarp crew is losing a fight with geometry. It’s the off-season. Even the hot dogs are asleep. You stand there a while. It’s not a bad view for an office that smells faintly of calzone.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'One hundred fifty-two home games I could’ve been watching from here. Instead — the parking. THE PARKING. I want it noted: I invented a system.' : 'Nice view. Better view than the Bing’s back room, worse view than a courtroom acquittal. That’s a joke. Kind of.' }
      ]);
    } },
    { x: 250, y: 140, w: 150, h: 56, radius: 46, label: 'Steinbrenner', action: () => {
      if (!state.mission && state.flags.calzoneProtocolDone && !state.flags.cottonUniformsDone && state.flags.freeRoam) {
        startMission('cottonUniforms');
        startDialog([
          { speaker: 'steinbrenner', text: 'The uniforms! Polyester — it DOESN’T BREATHE, it never breathed, it will NEVER breathe! I need cotton samples and I need them fast. There’s money in it. There’s money in everything if you yell loud enough!' },
          { speaker: 'system', text: 'Mission accepted: THE COTTON UNIFORMS. They will shrink. They always shrink.' }
        ]);
        return;
      }
      if (!state.mission && !state.flags.calzoneProtocolDone && state.flags.freeRoam) {
        startMission('calzoneProtocol');
        startDialog([
          { speaker: 'steinbrenner', text: 'Hungry! I’m hungry and I want the calzone — THE CALZONE — from that place by the coffee shop! You look like a man who can move a calzone. Prove me right. $210!' },
          { speaker: 'system', text: 'Mission accepted: THE CALZONE PROTOCOL. No tipping in the counter jar.' }
        ]);
        return;
      }
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
    { x: 60, y: 110, w: 40, h: 30, radius: 30, label: 'The espresso machine', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The espresso machine at Satriale’s hisses like it knows what happens in the back room and disapproves. George orders a decaf. The room — somehow — notices. A man at the corner table slowly turns a newspaper page with unusual emphasis.' },
        { speaker: 'george', text: 'What? WHAT? I have a heart condition! …I don’t have a heart condition. I have a FEAR of a heart condition. It’s completely different and much worse!' }
      ] : [
        { speaker: 'narrator', text: 'The espresso machine is older than most of the made guys in North Jersey and better maintained than any of them. Tony takes his standing up, in three sips, like his grandfather did, like the machine expects. It never burns him. That’s respect, in both directions.' },
        { speaker: 'tony', text: 'Machine like this, you don’t lean on it. You VISIT it.' }
      ]);
    } },
    { x: 500, y: 110, w: 40, h: 30, radius: 30, label: 'The meat case', action: () => {
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'Behind the glass: capicola, soppressata, prosciutto hanging like a meat chandelier. The gabagool glistens under the deli lights with a confidence most people never achieve. A small sign says YOU BREAK IT YOU BOUGHT IT, and the “it” is doing a lot of work in that sentence.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Look at it glisten. WHY is it glistening? Meat shouldn’t glisten! …I’d still eat it. I’d eat it right now. I’d eat it off the FLOOR.' : 'That’s the stuff. You can tell a place by the case. This case? This case never lies to you. Rare quality in anything.' }
      ]);
    } },
    { x: 450, y: 388, w: 40, h: 20, radius: 28, label: 'The framed photo', action: () => {
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'A framed photo by the door: the original Satriale, 1962, standing in front of the same counter with the same cleaver and the same expression, which is the expression of a man deciding something about you. Some things in this neighborhood change. The important things get framed.' },
        { speaker: 'system', text: 'The pork store has been the pork store since before the highway. It will be the pork store after.' }
      ]);
    } },
      { x: 262, y: 200, w: 60, h: 30, radius: 40, label: 'Order a sandwich', action: () => {
        if (state.money < 12) { toast('The gabagool special is $12.'); return; }
        state.money -= 12;
        audio.sfx('pickup');
        startDialog([
          { speaker: 'narrator', text: 'Gabagool, provolone, hot peppers, on bread that was baked this morning by a man who has never once been late in thirty years. It is, objectively, one of the greatest sandwiches on the eastern seaboard.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Oh. OH. This is — I’m having a moment. A private moment. With a sandwich. Don’t look at me!' : 'See, this is the stuff they don’t put in the papers. The sandwiches. The family. The — hand me another napkin.' }
        ]);
      } },
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
  const firstTime = !state.flags.helpSeen;
  if (firstTime) {
    state.flags.helpSeen = true;
    state.help = true;
  }
  if (state.player.kind !== 'george') state.player.kind = 'tonyMax';
  state.player.speed = state.player.kind === 'george' ? 96 : 88;
  setScene('hub', 320, 214);
  state.mode = 'explore';
  objective('Free roam: choose a landmark');
  if (firstTime) startDialog([
    { speaker: 'system', text: 'WELCOME TO THE OPEN WORLD. The F button PUNCHES people — some fight back, some drop wallets. A interacts. The stick moves. MENU has the world map, your cell phone (jobs), and your criminal record.' },
    { speaker: 'system', text: 'People with a ! overhead are hiring. The pulsing beacon marks your current job. Everything else is yours to steal.' }
  ]);
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
  state.returnTo = null;
  if (r && r.scene !== state.scene && scenes[r.scene]) {
    setScene(r.scene, r.x, r.y);
    state.mode = 'explore';
  } else travelHub('hub');
}

function travelHub(place) {
  // remember which outdoor region we came from so interior exits return correctly
  const outdoors = ['hub', 'nyc', 'njstreet', 'pines', 'shore', 'ac', 'meadow', 'queens'];
  if (outdoors.includes(state.scene) && !outdoors.includes(place)) {
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
    casino: ['casino', 320, 360, 'The Dunes. Oxygen-pumped air, no clocks, no mercy.'],
    slice: ['slice', 320, 360, 'Inside: heat, grease, glory. The real Ray’s — probably.'],
    dmv: ['dmv', 320, 360, 'The DMV. Bring nothing. Expect less.'],
    diner: ['diner', 320, 380, 'The Endgame Diner. Open 24 hours, because some decisions can’t wait for morning.'],
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

function stealRandomCar() {
  if (state.player.inCar) return;
  const fleet = [
    { speed: 230, color: '#a02828', name: 'a CORVETTE', line: state.player.kind === 'george' ? 'A CORVETTE! Midlife crisis complete! I’ve never felt so alive and so doomed!' : 'Red Corvette. Subtle as a heart attack. Perfect.' },
    { speed: 190, color: '#3d6b35', name: 'a sensible sedan', line: state.player.kind === 'george' ? 'Borrowing. Permanent borrowing. Vandelay Industries has a fleet, technically.' : 'Nice car. Means it’s my car now. That’s how that works.' },
    { speed: 160, color: '#b8a888', name: 'a wood-paneled station wagon', line: state.player.kind === 'george' ? 'A station wagon. Wood paneling. This is exactly the car I deserve and I hate it!' : 'A wagon. Slow. But nobody — NOBODY — suspects the wagon.' },
    { speed: 200, color: '#e8b822', name: 'a yellow cab', line: state.player.kind === 'george' ? 'A CAB! I’m a cab driver now! Do I need a license? I don’t have a regular license!' : 'Yellow cab. In Manhattan this thing is invisible — and the back seat pays cash.' },
    { speed: 205, color: '#2848a0', name: 'an unmarked-looking cruiser', line: state.player.kind === 'george' ? 'Is this a cop car? It LOOKS like a cop car. If it’s a cop car I’m just — test driving it! For the city!' : 'Ex-cop car. Still got the spotlight. Heh.' }
  ];
  const car = fleet[Math.floor(Math.random() * fleet.length)];
  state.player.inCar = true;
  state.player.speed = Math.round(car.speed * (state.flags.engineTune ? 1.15 : 1));
  state.player.carColor = car.color;
  state.player.carName = car.name;
  state.player.carDamage = 0;
  state.player.carV = 0;
  audio.sfx('door');
  audio.sfx('honk');
  state.stats.carsStolen = (state.stats.carsStolen || 0) + 1;
  spawnEffect(state.player.x + 8, state.player.y - 8, state.player.kind === 'george' ? 'BORROWED' : 'MY CAR NOW', '#ffe78a');
  startDialog([
    { speaker: 'narrator', text: `It's ${car.name}. Keys in the ignition, because New Jersey.` },
    { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: car.line }
  ]);
}

function hubInteractions() {
  const list = [
    { x: 885, y: 150, w: 50, h: 34, radius: 46, label: 'Endgame Diner', action: () => {
      if (!state.flags.dinerSeen) {
        state.flags.dinerSeen = true;
        startDialog([
          { speaker: 'narrator', text: 'A stainless-steel diner glowing against the Jersey sky. The sign says ENDGAME. Underneath: OPEN 24 HRS — BEST ONION RINGS IN THE STATE (SELF-REPORTED).' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A diner! A real Jersey diner! This is where civilization peaked and I will die on this hill!' : 'Twenty-four hours. Because trouble don’t keep a schedule.' }
        ], () => travelHub('diner'));
      } else travelHub('diner');
    } },
    { x: 10, y: 210, w: 26, h: 90, radius: 46, label: '← West: the Meadowlands', action: () => {
      startDialog([{ speaker: 'narrator', text: 'West on Route 3. The reeds get taller, the lots get bigger, and suddenly you can hear hooves. The Meadowlands.' }], () => startTransit('meadow', 700, 250, 'ROUTE 3 · EAST'));
    } },
    { x: 420, y: 340, w: 60, h: 34, radius: 44, label: 'Pay’n’Spray', action: () => {
      if (!state.player.inCar) { toast('Drive a car in first. The garage only does cars.'); return; }
      if ((state.flags.heat || 0) <= 0 && !state.player.carDamage) { toast('Car’s clean. Nothing to spray.'); return; }
      if (state.money < 50) { toast('Respray is $50. Cash. No invoices, obviously.'); return; }
      state.money -= 50;
      state.flags.heat = 0;
      state.player.carDamage = 0;
      if (!state.player.carModel) state.player.carModel = CAR_SPRITE_MAP[state.player.carColor] || 'sedan';
      const colors = ['#3d6b35', '#6b3d3d', '#3d3d6b', '#6b6b3d', '#444'];
      state.player.carColor = colors[Math.floor(Math.random() * colors.length)];
      if (state.cop) state.cop = null;
      if (state.cop2) state.cop2 = null;
      audio.sfx('cash');
      startDialog([{ speaker: 'narrator', text: 'Forty minutes of compressed air and no questions. The car comes out a different color; the heat stays in the paint fumes. The mechanic’s name tag says HESH but it is not Hesh. Do not ask.' }]);
    } },
    { x: 490, y: 340, w: 50, h: 30, radius: 42, label: 'The export list', action: () => {
      const want = state.exportWant;
      if (!want || want.until < state.time) {
        const kinds = [
          ['corvette', 'a red Corvette', 250],
          ['mail', 'a mail truck — don’t ask. a guy in Ohio collects them', 200],
          ['cruiser', 'an ex-cop cruiser', 180],
          ['wagon', 'a wood-paneled wagon — the overseas market is strange and wealthy', 150],
          ['sedan', 'a sensible sedan', 130]
        ];
        const k = kinds[Math.floor(Math.random() * kinds.length)];
        state.exportWant = { key: k[0], label: k[1], pay: k[2], until: state.time + 600 };
        startDialog([
          { speaker: 'narrator', text: 'The mechanic slides a greasy index card across the counter. The EXPORT LIST. This week’s market: ' + k[1] + '. Pays $' + k[2] + ', no questions, no paperwork, no returns. The card smells like transmission fluid and opportunity.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A car-finding LIST! Like a scavenger hunt, but grand theft! Finally — a crime with STRUCTURE!' : 'Yeah, yeah. I know the drill. Don’t scratch it on the way in — I don’t pay extra for detail work.' }
        ]);
        return;
      }
      if (!state.player.inCar) { toast('The list wants ' + want.label + ' — drive it in. $' + want.pay + '.'); return; }
      const cn = (state.player.carName || '') + ' ' + (state.player.carColor || '');
      const keys = { corvette: /corvette/i, mail: /mail/i, cruiser: /cruiser/i, wagon: /wagon/i, sedan: /sedan/i };
      if (!keys[want.key] || !keys[want.key].test(state.player.carName || '')) {
        toast('The mechanic shakes his head — not the car on the list. He wants ' + want.label + '.');
        return;
      }
      state.money += want.pay;
      state.exportWant = null;
      state.player.inCar = false;
      state.player.carColor = null;
      state.player.carName = null;
      state.player.speed = state.player.kind === 'george' ? 96 : 88;
      audio.sfx('cash');
      spawnEffect(state.player.x + 8, state.player.y - 16, 'EXPORTED +$' + want.pay, '#ffd23e');
      startDialog([
        { speaker: 'narrator', text: 'The mechanic circles the car once, nods twice, and it vanishes into the shop before the door finishes rolling. Somewhere — a port, a container ship, a market you will never see — it becomes someone else’s problem. $' + want.pay + ', cash, in an envelope that is somehow already greasy.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m an EXPORTER now! Vandelay Industries — import AND export! The circle is complete!' : 'Easy money. The car never existed. I never existed. Nobody exists. Get me another list.' }
      ]);
    } },
    { x: 420, y: 300, w: 60, h: 30, radius: 40, label: 'Engine tune', action: () => {
      if (state.flags.engineTune) { toast('Already tuned. She purrs. Don’t push your luck.'); return; }
      if (state.money < 200) { toast('The tune-up is $200. Parts fall off trucks; labor doesn’t.'); return; }
      state.money -= 200;
      state.flags.engineTune = true;
      audio.sfx('cash');
      audio.sfx('success');
      startDialog([
        { speaker: 'narrator', text: 'Two hours, three cigarettes, one torch-lit manifold. Every car you “borrow” from now on runs fifteen percent faster. The mechanic wipes his hands and says, with total sincerity, that you never came here.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Faster! In every car I don’t own! Finally — an investment with no traceable paper trail!' : 'Fifteen percent. That’s the difference between goodbye and goodbye forever. Money well spent.' }
      ]);
    } },
    { x: 210, y: 330, w: 30, h: 24, radius: 40, label: 'Mailbox', action: () => {
      if ((state.mailboxCd || 0) > state.time) { toast('Empty. You already… checked. Yeah. Checked.'); return; }
      state.mailboxCd = state.time + 30;
      const take = 4 + Math.floor(Math.random() * 12);
      state.money += take;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .4);
      audio.sfx('pickup');
      spawnEffect(state.player.x, state.player.y - 16, 'MAIL THEFT +$' + take, '#ffd0a0');
      if (Math.random() < .25 && !state.flags.newmanCaught) {
        state.flags.newmanCaught = true;
        startDialog([
          { speaker: 'newman', text: 'WHAT— you! I saw that! MY route! MY mail! That is a FEDERAL offense, committed by a rank AMATEUR! …Technique was decent though. A little hunched. Heh heh.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'It’s a federal offense?! It’s MAIL! Who reads mail! I was BORROWING the mail!' : 'Relax, mailman. I was checking for anthrax. Community service. You’re welcome.' }
        ]);
      }
    } },
    { x: 250, y: 370, w: 50, h: 30, radius: 42, label: 'Turkey Trot registration', action: () => {
      if (state.mode === 'trot' || state.player.inCar) return;
      if (state.flags.trotCd && state.time < state.flags.trotCd) { toast('The turkey is resting. The turkey earned it.'); return; }
      state.mode = 'trot';
      state.trot = { wp: 0, t: 0, limit: 24, done: false };
      audio.sfx('turkey');
      if (state.turkey) { state.turkey.racing = true; state.turkey.x = 250; state.turkey.y = 360; }
      startDialog([{ speaker: 'narrator', text: 'The North Caldwell Turkey Trot: once around the block, you versus the turkey. The turkey did not train for this. The turkey did not need to. Follow the flares — beat the bird!' }]);
    } },
    { x: 400, y: 100, w: 56, h: 34, radius: 44, label: 'The idling armored car', action: () => {
      if (state.flags.armoredDone) { toast('The armored car route changed after the incident. Wonder whose fault that is.'); return; }
      state.flags.armoredDone = true;
      const roll = Math.random();
      if (roll < .35) {
        state.money += 320;
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1.5);
        audio.sfx('cash');
        spawnEffect(state.player.x, state.player.y - 16, '+$320', '#ffd23e');
        startDialog([
          { speaker: 'narrator', text: 'The doors are open. The guard is buying a hot dog. The bag is just — there. Your hand moves before your brain does, the way it has since 1978. $320 in worn twenties. You walk away at a completely casual pace that fools absolutely no one.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’M A CRIMINAL NOW! I’ve crossed over! There’s no going back! …Do they validate parking?' : 'Guard’s buying a hot dog. On the job. In my day that was a sit-down offense. You know what — the hot dog guy is getting a taste of this. Everybody eats.' }
        ]);
      } else {
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + 3);
        audio.sfx('denied');
        spawnEffect(state.player.x, state.player.y - 16, 'THE GUARD LOOKS UP', '#ff8e8e');
        startDialog([
          { speaker: 'narrator', text: 'The doors are open. The bag is there. And the guard — a man built like a filing cabinet with a mustache — looks up from his hot dog with the speed of a man who was never eating a hot dog at all. You walk away whistling. You have never whistled before. It shows.' },
          { speaker: 'narrator', text: 'The mustache follows you for three blocks. The heat is very much on.' }
        ]);
      }
    } },
    { x: 750, y: 210, w: 36, h: 26, radius: 40, label: 'Check the mail', action: () => {
      if (state.flags.mailCd && state.time < state.flags.mailCd) { toast('No new mail. Even the subpoenas are resting.'); return; }
      state.flags.mailCd = state.time + 45;
      audio.sfx('pickup');
      const roll = Math.random();
      if (roll < .25) {
        state.money += 15;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'The mail: a coupon insert, three catalogs, and — jammed in the middle — a rebate check for $15 made out to a name very close to but legally distinct from yours. Close enough. Thank you, mail fraud, hero of the people.' }]);
      } else if (roll < .5) {
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'A jury summons for Anthony Soprano. George holds it gingerly, like it might detonate.' },
          { speaker: 'george', text: 'I should NOT be touching this. This is evidence of ME touching evidence! …I’m keeping it as a souvenir.' }
        ] : [{ speaker: 'narrator', text: 'A jury summons. Tony regards it the way a man regards a rain cloud — annoyed, unhurried, already knowing a guy who knows a guy. Into the gutter it goes. The gutter is full of them.' }]);
      } else {
        startDialog([{ speaker: 'narrator', text: 'Victoria’s Secret catalog, a carpet cleaner flyer, and a handwritten card from someone named “Uncle Pat in the Joint” that just says EVERYTHING IS FINE in aggressively cheerful handwriting. Nothing is fine. You put it back carefully.' }]);
      }
    } },
    { x: 640, y: 140, w: 40, h: 30, radius: 42, label: 'Light the grill', action: () => {
      audio.sfx('pickup');
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .3);
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George lights the Soprano family grill with the confidence of a man who has never met propane. The flame whoomp— a modest fireball. His eyebrows survive. Barely. The smell of lighter fluid and ambition fills North Caldwell.' },
        { speaker: 'george', text: 'I’M GRILLING NOW! I have a grill AND a system! The system is: meat, then more meat! Why does no one respect the system?!' }
      ] : [
        { speaker: 'narrator', text: 'Tony lights the grill one-handed, fluid-perfect, first click. This is a man who has grilled through three decades and two indictments. The coals know him. The neighborhood smells it and collectively relaxes.' },
        { speaker: 'tony', text: 'Thanksgiving, a grill, the smell of charcoal. This is the stuff they can never take from you. The Feds can have the rest. Not this.' }
      ]);
    } },
    { x: 680, y: 150, w: 44, h: 30, radius: 42, label: 'AJ’s lemonade stand', action: () => {
      if (state.money < 4) { toast('AJ’s lemonade is $4. Yes, really. No, he will not negotiate.'); return; }
      state.money -= 4;
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George pays $4 for a Dixie cup of lemon-adjacent water, served by a fifteen-year-old with the dead eyes of a man who has never once been asked to work.' },
        { speaker: 'george', text: 'Four dollars! It’s WATER with a lemon ACCENT! …I’ll take two.' },
        { speaker: 'aj', text: 'Supply and demand, dude. Dad says I have an entrepreneurial spirit. Dad also bought most of the inventory.' }
      ] : [
        { speaker: 'narrator', text: 'Tony pays $4 for lemonade without blinking, tips another four, and tells the kid to keep the lemonade.' },
        { speaker: 'tony', text: 'It’s not about the lemonade, AJ. It’s never about the lemonade. You’re learning. That’s good. That’s the whole thing right there.' },
        { speaker: 'aj', text: '…This is the best day of my life and I don’t know why.' }
      ]);
    } },
    { x: 420, y: 230, w: 40, h: 30, radius: 34, label: 'Feed the turkey ($2)', action: () => {
      if (!state.turkey) { toast('The turkey is out there. Somewhere. Watching.'); return; }
      if (state.turkey.friend) { toast('The turkey already considers you kin.'); return; }
      if (state.money < 2) { toast('Breadcrumbs cost $2. The turkey accepts nothing else.'); return; }
      state.money = Math.max(0, state.money - 2);
      state.turkey.friend = true;
      state.turkey.enraged = 0;
      audio.sfx('turkey');
      startDialog([
        { speaker: 'narrator', text: 'You scatter breadcrumbs. The wild turkey of North Caldwell approaches with the gravity of a made man accepting tribute. It has decided you are family now. There is no ceremony. There is only following.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'It’s following me! Why is it following me?! …Actually this is the most loyal relationship I’ve ever had. I’m naming him CERTIFIED.' : 'The turkey eats, the turkey follows. That’s the whole arrangement. Honestly? Best partner I’ve ever had. Never once asked about the money.' }
      ]);
    } },
    ...(isNight() ? [] : [{ x: 420, y: 170, w: 60, h: 30, radius: 40, label: 'Ice cream truck', action: () => {
      if ((state.flags.tribute || 0) < 5) { startDialog([{ speaker: 'narrator', text: 'The ice cream man eyes your empty hands. Five dollars. The soft serve waits for no one.' }]); return; }
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 5);
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A vanilla-chocolate twist, structural integrity questionable. George inhales it in the time most people take to unwrap it. The heat of the streets fades a little.' },
        { speaker: 'george', text: 'The twist cone is a marvel of engineering! TWO flavors, ONE cone! This is what the Soviets never understood!' }
      ] : [
        { speaker: 'narrator', text: 'A soft serve, eaten in silence, leaning on the truck. For ninety seconds, Tony Soprano has no problems. Heat drops.' },
        { speaker: 'tony', text: 'When I was a kid the truck only had two flavors. Now there’s forty. That’s not progress — that’s confusion with sprinkles.' }
      ]);
    } }]),
    ...(state.vanHere ? [{ x: 700, y: 330, w: 70, h: 36, radius: 40, label: 'White van — “speakers”', action: () => {
      if ((state.flags.tribute || 0) < 40) { toast('The speakers are $40. A steal. Literally, probably.'); return; }
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 40);
      const hot = Math.random() < .5;
      audio.sfx(hot ? 'cash' : 'denied');
      if (hot) {
        state.flags.tribute = (state.flags.tribute || 0) + 95;
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'The speakers are REAL. They’re barely even warm! George unloads them on a guy outside the bagel place within the hour for ninety-five.' },
          { speaker: 'george', text: 'I’M A DISTRIBUTOR NOW! First the hats, now speakers! I’m basically Vandelay! I AM VANDELAY!' }
        ] : [
          { speaker: 'narrator', text: 'Tony knows the van. Tony knows the guy knows he knows. The speakers are real — a professional courtesy between adjacent industries. They resell before sunset.' },
          { speaker: 'tony', text: 'See, the trick with the van guys: sometimes they NEED the speakers to be real. Keeps the legend alive. It’s a whole ecosystem.' }
        ]);
      } else {
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'The boxes are full of bricks. Bricks and a note that just says “SORRY NOTHING PERSONAL.” The van is already gone. The van was maybe never fully there.' },
          { speaker: 'george', text: 'BRICKS! I paid forty dollars for BRICKS! …Although — good bricks. Very uniform. I could resell these as premium bricks— no. NO. I have to stop.' }
        ] : [
          { speaker: 'narrator', text: 'Bricks. Tony weighs one in his hand, nods once, and puts it down gently, like a man filing away a very small grudge for a very rainy day.' },
          { speaker: 'tony', text: 'Forty years in the business and I buy bricks off a van. Don’t tell Silvio. Don’t tell ANYBODY. Especially not the van.' }
        ]);
      }
      state.vanHere = false;
    } }] : []),
    { x: 100, y: 120, w: 50, h: 34, radius: 42, label: 'Yard sale', action: () => {
      if (state.money < 8) { toast('Everything at the yard sale costs $8. Everything.'); return; }
      state.money -= 8;
      const roll = Math.random();
      audio.sfx('pickup');
      if (roll < .15) {
        state.money += 120;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'You buy a dusty painting of a boat for $8. Inside the frame: a savings bond worth $120. The old man running the sale watches you leave with the serene smile of someone who already knows and does not care. It was his brother-in-law’s painting. He hated that guy.' }]);
      } else if (roll < .5) {
        state.money += 14;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'You buy a lamp shaped like a mallard. Its value is debatable but its resale is certain: a guy at the end of the driveway hands you $14 for it immediately. Commerce!' }]);
      } else {
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'george', text: 'Eight dollars for a ceramic frog! A STEAL! It holds pens! …It doesn’t hold pens. Why did I buy this?' },
          { speaker: 'narrator', text: 'George now owns a ceramic frog. The frog is named Ribbit. This was not George’s decision; it was the price tag’s.' }
        ] : [
          { speaker: 'narrator', text: 'Tony buys a box of old records for $8. One of them is signed by Frankie Valli. You can’t prove it and neither can he, which makes it authentic.' }
        ]);
      }
    } },
    { x: 380, y: 300, w: 34, h: 30, radius: 38, label: 'Quick change', action: () => {
      const toGeorge = state.player.kind !== 'george';
      state.player.kind = toGeorge ? 'george' : 'tony';
      audio.sfx('pickup');
      startDialog(toGeorge ? [
        { speaker: 'narrator', text: 'A quick change behind the hedges — a terrible wig, a worse attitude. You are now GEORGE COSTANZA: faster on foot, but the heat never quite leaves you.' },
        { speaker: 'george', text: 'I’m out there, Jerry — and I’m LOVING every minute of it!' }
      ] : [
        { speaker: 'narrator', text: 'The tracksuit goes back on. You are now TONY SOPRANO: hits harder, commands respect, scares waterfowl.' },
        { speaker: 'tony', text: 'Ah, that’s better. Room to breathe. Room for everything.' }
      ]);
    } },
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
    { x: 1158, y: 250, w: 80, h: 46, radius: 30, label: 'Pawn shop', action: () => {
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
      stealRandomCar();
    } },
    { x: 330, y: 168, w: 92, h: 36, label: 'Chase replay', action: () => {
      initDrive();
      state.mode = 'drive';
      objective('Catch the debtor — grab money boosts');
    } },
    { x: 530, y: 200, w: 60, h: 56, radius: 44, label: 'Newman', action: () => {
      if (!state.mission && nextMission()) {
        const mid = nextMission();
        startMission(mid);
        const offers = {
          packageJob: { speaker: 'newman', text: state.player.kind === 'george' ? 'Costanza. Perfect. I need a package taken to a bodega in Manhattan. No questions. $200. You look like a man who needs $200.' : 'Mr. Soprano! An honor. A package, the bodega on 81st, no questions, $200. It’s practically charity work.' },
          catalogCaper: { speaker: 'newman', text: 'More work, if you want it. A few… surplus catalogs. Deliver them to the Yankees offices. Steinbrenner’s people HATE surplus mail. Hee hee. $150.' },
          bigSalad: { speaker: 'newman', text: 'Hungry work, the mail. Fetch me a salad from Monk’s. A BIG salad. Not the small. If it’s small, I will know. I ALWAYS know. $120.' },
          soupNaziRun: { speaker: 'newman', text: 'Soup. From the Soup Man. I am… no longer welcome there. A misunderstanding involving the bread line. You go. Follow the rules EXACTLY or there will be NO SOUP. $160.' },
          cannonball: { speaker: 'newman', text: 'A wager! I bet a VERY smug fireman $350 that nobody sane can reach the Pine Barrens and return before his shift whistle. You are nobody sane. GO! The clock is ALREADY judgemental!' },
          bigOne: { speaker: 'newman', text: 'The big one. THE big one. Four stops, three counties, one bodega, a pork store, and a boardwalk. $500. This is the job they write ballads about, if ballads were written about parcels. Which they should be!' },
          heatMagnet: { speaker: 'newman', text: 'This one is simple. I may have told the police YOU are the mail thief. You’ll have some heat for a bit. Survive it, come back, $220. What — don’t look at me like that, it’s a COMPLIMENT. They believed me instantly!' },
          ryeExpress: { speaker: 'newman', text: 'SPEED job. A marble rye — don’t ask — must reach the Costanza house before Frank Costanza finishes his pre-dinner interrogation of the silverware. You have minutes. MINUTES, hee hee. $300 for a fast pair of legs.' },
          pineFresh: { speaker: 'newman', text: 'One more job. Simple. A box. The Pine Barrens. You put it in the ground, you come back, you forget the whole drive. $250. Don’t look inside. SERIOUSLY. Even I don’t know what’s in it. I lied just now — I do know. Don’t look.' }
        };
        startDialog([
          offers[mid],
          { speaker: 'system', text: `Mission accepted: ${MISSION_DEFS[mid].title}. Follow the objective banner.` }
        ]);
      }
      else if (!state.mission && state.flags.bigOneDone && state.flags.freeRoam) {
        // repeatable odd jobs — the mail never ends
        const drops = [
          { scene: 'vesuvio', x: 320, y: 250, radius: 60, name: 'Vesuvio — “kitchen supplies”, do not shake it' },
          { scene: 'satriale', x: 320, y: 200, radius: 60, name: 'Satriale’s — it’s cold. why is it cold. don’t ask' },
          { scene: 'bodega', x: 320, y: 200, radius: 60, name: 'the Manhattan bodega — the usual spot' },
          { scene: 'cabin', x: 180, y: 300, radius: 60, name: 'the cabin in the Pines — yes, THAT Pines. hee hee' },
          { scene: 'costanza', x: 320, y: 260, radius: 70, name: 'the Costanza house — ring twice, ignore the shouting' },
          { scene: 'slice', x: 320, y: 200, radius: 60, name: 'Ray’s — the original. probably. they all say that' },
          { scene: 'taffy', x: 320, y: 200, radius: 60, name: 'the taffy shop — it smells like sugar and secrets' }
        ];
        const drop = drops[Math.floor(Math.random() * drops.length)];
        const rolledPay = 60 + Math.floor(Math.random() * 50);
        startMission('oddJob');
        state.mission.payout = rolledPay;
        state.mission.steps = [
          { scene: drop.scene, x: drop.x, y: drop.y, radius: drop.radius, objective: `Deliver the parcel — ${drop.name.split('—')[0].trim()}`, label: 'the drop' },
          { scene: 'hub', x: 552, y: 220, radius: 52, objective: 'Report back to Newman', label: 'Newman' }
        ];
        startDialog([
          { speaker: 'newman', text: `The legend returns! Perfect timing — a parcel needs legs. ${drop.name}. $${rolledPay}. The mail never ends, my friend. It NEVER. ENDS.` },
          { speaker: 'system', text: 'Mission accepted: ODD JOB. Repeatable work — the mail is eternal.' }
        ]);
      }
      else if (state.flags.bigOneDone) startDialog([
        { speaker: 'newman', text: 'The legend returns! They speak of you in sorting facilities across the tri-state area. In hushed tones. Mostly because of the noise ordinances.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I did it all, Newman! Every last parcel! What now?! What’s left for a man like me?!' : 'Yeah yeah. The mail’s safe. Go back to your route, mailman. And Newman — the freezer box? We never spoke about it. Capisce?' },
        { speaker: 'newman', text: 'What’s left? Only the eternal mail, my friend. It is endless. It is forever. And on that day of days, when the last letter is delivered — I shall be there. HEE HEE HEE.' }
      ]);
      else if (state.player.kind === 'george') startDialog([
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
  if (drawSceneArt(sceneArt.costanza, 640, 416)) {
    // Frank's chair creaks; the TV murmurs baseball.
    if (!state.dialog) {
      const f = Math.sin(state.time * 9) * 1.5;
      px(ctx, 118, 118 + f * .3, 10, 6, '#8ecbff');
    }
    return;
  }

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
  list.push({ x: 430, y: 120, w: 50, h: 34, radius: 40, label: 'Order the big salad', action: () => {
    if (state.money < 9) { toast('The big salad is $9. Big salad, big price.'); return; }
    state.money -= 9;
    audio.sfx('pickup');
    state.flags.heat = Math.max(0, (state.flags.heat || 0) - .2);
    startDialog(state.player.kind === 'george' ? [
      { speaker: 'narrator', text: 'The big salad arrives. It is, objectively, a large salad. George watches the waitress hand it over and feels the ancient rage — WHO gets credit? The buyer or the hander-over?' },
      { speaker: 'george', text: 'Did YOU see who ordered it? YOU saw me! Tell people! The credit! THE CREDIT IS MINE!' },
      { speaker: 'narrator', text: 'The waitress has already forgotten him. The salad is very good.' }
    ] : [
      { speaker: 'narrator', text: 'Tony orders the big salad. The waitress does not ask if he means it literally. Nobody at Monk’s asks Tony Soprano anything twice. It is a very large salad. Tony finishes it. This impresses no one, which is its own kind of power.' }
    ]);
  } });
  list.push({ x: 170, y: 200, w: 120, h: 90, radius: 40, label: 'Your chair', action: () => {
    if (!state.mission && state.flags.therapyDone && !state.flags.shrinkRapDone && state.flags.freeRoam && state.player.kind !== 'george') {
      startMission('shrinkRap');
      startDialog([
        { speaker: 'melfi', text: 'Before we begin — an exercise. A patient gave me this watch. It’s wildly inappropriate and it must go back to the shop in Manhattan. YOU’RE going to return it. Here’s the exercise: no crimes on the way. No heat, Tony. If the police so much as look at you, the exercise fails. Think you can be a civilian for one afternoon?' },
        { speaker: 'system', text: 'Mission accepted: THE SHRINK RAP. Keep heat under 3 — no punching, no clipping, no “borrowing”.' }
      ]);
      return;
    }
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
    list.push({ x: 330, y: 320, w: 46, h: 26, radius: 34, label: 'The tissue box', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The tissue box on the coffee table. George eyes it with the caution of a man who knows that in this room, the tissues are both a product and a diagnosis. He does not need one. He takes three anyway, because they’re — they’re right there, they’re just SITTING there.' },
        { speaker: 'george', text: 'You never know! Allergies! Emotions! Various moisture events! They’re complimentary, presumably — there’s no sign — DO YOU CHARGE FOR THESE?' }
      ] : [
        { speaker: 'narrator', text: 'A box of tissues, positioned exactly equidistant from the patient chair and the doctor — close enough to reach, far enough to make reaching it a decision. Tony has sat in this room for years. He has never once touched the box. He regards it as a personal record. Melfi regards it as data.' }
      ]);
    } });
    list.push({ x: 110, y: 345, w: 40, h: 26, radius: 32, label: 'The clock', action: () => {
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'The wall clock. Round, quiet, merciless. In this room it is not a clock — it is a referee. When the minute hand reaches the appointed spot, the session is over, whether or not the breakthrough has clocked in. Tony has been beaten by bigger enemies. Few as punctual.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Fifty minutes! It should be sixty! Everyone knows an hour is sixty minutes! The therapy hour is fifty! Where does the other ten minutes GO? Somebody is SKIMMING!' : 'Time’s up means time’s up. Even here. Especially here.' }
      ]);
    } });
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

// ---------- Slots: the Bing's back-corner machine ----------
const SLOT_SYMBOLS = [
  { glyph: '7', color: '#ffdf4a', weight: 1 },
  { glyph: '$', color: '#8ffff2', weight: 2 },
  { glyph: 'B', color: '#ff8a7a', weight: 3 }, // bell-adjacent
  { glyph: 'C', color: '#ff9ad4', weight: 4 }, // cherry-adjacent
  { glyph: 'L', color: '#b8e86a', weight: 5 }  // lemon-adjacent
];
function slotSymbol() {
  const total = SLOT_SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SLOT_SYMBOLS) { r -= s.weight; if (r <= 0) return s.glyph; }
  return 'L';
}

function initRacing() {
  if ((state.flags.tribute || 0) < 20) { startDialog([{ speaker: 'narrator', text: 'The racing form costs twenty dollars of dignity, payable in tribute. You are short.' }]); return; }
  state.racing = {
    horses: [
      { name: 'NO SOUP FOR YOU', x: 0, speed: 0, color: '#c33' },
      { name: 'SERENITY NOW', x: 0, speed: 0, color: '#3a7' },
      { name: 'GABAGOOL EXPRESS', x: 0, speed: 0, color: '#48d' },
      { name: 'MASTER OF DOMAIN', x: 0, speed: 0, color: '#da3' }
    ],
    bet: 0, phase: 'pick', t: 0, finishT: 0, winner: -1, paid: false
  };
  state.mode = 'racing';
  audio.sfx('pickup');
}

function updateRacing(dt) {
  const r = state.racing;
  if (!r) { state.mode = 'explore'; return; }
  if (r.phase === 'pick') {
    if (consume(['ArrowLeft', 'KeyA'])) r.bet = (r.bet + 3) % 4;
    if (consume(['ArrowRight', 'KeyD'])) r.bet = (r.bet + 1) % 4;
    if (consume(['Space', 'Enter', 'KeyE'])) {
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 20);
      r.phase = 'run'; r.t = 0;
      audio.sfx('cash');
    }
    if (consume(['Escape', 'KeyM'])) { state.racing = null; state.mode = 'explore'; }
    return;
  }
  if (r.phase === 'run') {
    r.t += dt;
    for (const h of r.horses) {
      h.speed = 30 + Math.sin(r.t * 2.3 + h.name.length) * 14 + Math.random() * 26;
      h.x += h.speed * dt;
    }
    const lead = Math.max(...r.horses.map((h) => h.x));
    if (lead >= 480 && r.winner < 0) {
      r.winner = r.horses.findIndex((h) => h.x >= 480);
      r.phase = 'done'; r.finishT = 0;
    }
    if (r.t > 30) { r.winner = r.horses.indexOf(r.horses.reduce((a, b) => (a.x > b.x ? a : b))); r.phase = 'done'; r.finishT = 0; }
    return;
  }
  if (r.phase === 'done') {
    r.finishT += dt;
    if (!r.paid) {
      r.paid = true;
      if (r.winner === r.bet) {
        state.flags.tribute = (state.flags.tribute || 0) + 70;
        audio.sfx('cash');
      } else audio.sfx('denied');
    }
    if (consume(['Space', 'Enter', 'KeyE', 'Escape', 'KeyM'])) { state.racing = null; state.mode = 'explore'; }
  }
}

function drawRacing() {
  const r = state.racing;
  if (!r) return;
  if (!drawMgBackdrop(sceneArt.mgHorsetrack, 640, 360, .35)) {
    ctx.fillStyle = '#1a120b';
    ctx.fillRect(0, 0, 640, 360);
  }
  ctx.fillStyle = 'rgba(26,18,11,.75)';
  ctx.fillRect(60, 60, 520, 240);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 520, 240);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE BING RACING FORM — $20 A RACE', 320, 44);
  ctx.font = '9px monospace';
  // track
  for (let i = 0; i < 4; i++) {
    const y = 90 + i * 55;
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.strokeRect(70, y, 500, 40);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    const h = r.horses[i];
    ctx.fillText(h.name, 74, y + 14);
    // finish line
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillRect(70 + 480, y, 2, 40);
    // horse
    ctx.fillStyle = h.color;
    const hx = 70 + Math.min(480, h.x);
    ctx.fillRect(hx, y + 18, 18, 12);
    ctx.fillStyle = '#000';
    ctx.fillRect(hx + 12, y + 20, 4, 4);
    // bet marker
    if (r.phase === 'pick' && r.bet === i) {
      ctx.fillStyle = '#ffd23e';
      ctx.fillText('►', 60, y + 30);
    }
    if (r.winner === i) {
      ctx.fillStyle = '#ffd23e';
      ctx.textAlign = 'right';
      ctx.fillText('WINNER', 566, y + 14);
      ctx.textAlign = 'left';
    }
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  if (r.phase === 'pick') ctx.fillText('ARROWS pick your horse · SPACE to run the race · ESC walks away', 320, 330);
  else if (r.phase === 'run') ctx.fillText('THEY’RE OFF!', 320, 330);
  else {
    const won = r.winner === r.bet;
    ctx.fillStyle = won ? '#6f6' : '#f66';
    ctx.fillText(won ? 'YOUR HORSE WINS — +$70 tribute! SPACE to leave' : r.horses[r.winner].name + ' takes it. The house sends regards. SPACE to leave', 320, 330);
  }
  ctx.textAlign = 'left';
}

function initDarts() {
  if ((state.flags.tribute || 0) < 15) { startDialog([{ speaker: 'narrator', text: 'Darts is fifteen a round — the board has standards. You are short.' }]); return; }
  state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 15);
  state.darts = { throws: [], cur: { axis: 'x', x: 0, y: 0, dir: 1 }, total: 0, phase: 'aim', t: 0 };
  state.mode = 'darts';
  audio.sfx('pickup');
}

function updateDarts(dt) {
  const d = state.darts;
  if (!d) { state.mode = 'explore'; return; }
  d.t += dt;
  if (d.phase === 'aim') {
    const c = d.cur;
    if (c.axis === 'x' || c.axis === 'y') {
      const v = (c.axis === 'x' ? c.x : c.y) + dt * 1.4 * c.dir;
      if (v > 1) c.dir = -1; else if (v < -1) c.dir = 1;
      if (c.axis === 'x') c.x = Math.max(-1, Math.min(1, v)); else c.y = Math.max(-1, Math.min(1, v));
    }
    if (consume(['Space', 'Enter', 'KeyE'])) {
      if (c.axis === 'x') { c.axis = 'y'; audio.sfx('punch'); }
      else {
        // throw lands
        const dist = Math.sqrt(c.x * c.x + c.y * c.y) + (Math.random() - .5) * .12;
        let score = 0;
        if (dist < .12) score = 50;
        else if (dist < .3) score = 25;
        else if (dist < .55) score = 15;
        else if (dist < .8) score = 8;
        else score = 2;
        d.throws.push({ x: c.x, y: c.y, score });
        d.total += score;
        audio.sfx(score >= 25 ? 'cash' : 'punch');
        if (d.throws.length >= 3) { d.phase = 'done'; if (d.total >= 60) { state.flags.tribute = (state.flags.tribute || 0) + 50; audio.sfx('cash'); } }
        else d.cur = { axis: 'x', x: 0, y: 0, dir: 1 };
      }
    }
    if (consume(['Escape', 'KeyM']) && !d.throws.length) { state.darts = null; state.mode = 'explore'; }
    return;
  }
  if (d.phase === 'done' && consume(['Space', 'Enter', 'KeyE', 'Escape', 'KeyM'])) { state.darts = null; state.mode = 'explore'; }
}

function drawMgBackdrop(img, w, h, dim) {
  if (img && img.complete && img.naturalWidth) {
    ctx.drawImage(img, 0, 0, w, h);
    ctx.fillStyle = 'rgba(8,6,10,' + dim + ')';
    ctx.fillRect(0, 0, w, h);
    return true;
  }
  return false;
}

function drawDarts() {
  const d = state.darts;
  if (!d) return;
  if (!drawMgBackdrop(sceneArt.mgDarts, 640, 360, .45)) {
    ctx.fillStyle = '#171008';
    ctx.fillRect(0, 0, 640, 360);
  }
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DARTS AT THE BING — three throws, 60+ pays $50', 320, 40);
  const cx = 320, cy = 195, R = 110;
  // board rings
  const rings = [[1, '#4a3728'], [.8, '#8b2233'], [.55, '#2a5c34'], [.3, '#8b2233'], [.12, '#ffd23e']];
  for (const [r, col] of rings) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#000';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  // landed darts
  for (const t of d.throws) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + t.x * R - 2, cy + t.y * R - 2, 5, 5);
  }
  // aim crosshair
  if (d.phase === 'aim') {
    const ax = cx + d.cur.x * R, ay = cy + d.cur.y * R;
    ctx.strokeStyle = d.cur.axis === 'x' ? '#ffd23e' : '#4ef';
    ctx.beginPath();
    if (d.cur.axis === 'x') { ctx.moveTo(ax, cy - R); ctx.lineTo(ax, cy + R); }
    else { ctx.moveTo(cx - R, ay); ctx.lineTo(cx + R, ay); }
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(d.cur.axis === 'x' ? 'SPACE locks the horizontal…' : 'SPACE throws!', 320, 330);
  } else {
    ctx.fillStyle = d.total >= 60 ? '#6f6' : '#f66';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TOTAL ' + d.total + (d.total >= 60 ? ' — 60+! The board pays $50. SPACE' : ' — the board keeps your money. SPACE'), 320, 330);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaa';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  if (d.phase === 'aim') ctx.fillText('throw ' + (d.throws.length + 1) + ' of 3 · total ' + d.total, 320, 60);
  ctx.textAlign = 'left';
}

function initSkeeball() {
  if ((state.flags.tribute || 0) < 5) { startDialog([{ speaker: 'narrator', text: 'Skeeball is five dollars for three balls. The machine has not awarded the big prize since the Clinton administration. It remembers.' }]); return; }
  state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 5);
  state.skee = { balls: [], power: 0, dir: 1, charging: false, phase: 'aim', total: 0, t: 0 };
  state.mode = 'skeeball';
  audio.sfx('pickup');
}


// ——— the diner pinball machine: "GABAGOOL WIZARD" ———
function initPinball() {
  if ((state.flags.tribute || 0) < 2) { toast('Two bucks a play. The machine takes crumpled singles and the occasional button.'); return; }
  state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 2);
  state.pin = { x: 404, y: 330, vx: 0, vy: 0, score: 0, balls: 3, launched: false, charging: false, power: 0, lf: 0, rf: 0, msg: '', msgT: 0, over: false, overT: 0, flash: 0 };
  state.mode = 'pinball';
  audio.sfx('pickup');
}

function updatePinball(dt) {
  const g = state.pin;
  if (!g) { state.mode = 'explore'; return; }
  if (g.over) {
    g.overT += dt;
    if (g.overT > 2) {
      state.mode = 'explore';
      const sc = g.score;
      state.pin = null;
      if (sc >= 3000) {
        state.flags.tribute = (state.flags.tribute || 0) + 50;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'The machine spits a stream of tickets nobody has ever seen before. The waitress counts them twice, eyebrows climbing. $50 — you are, as of this moment, the Gabagool Wizard of record. The previous record holder was a long-haul trucker. He still never looked at anyone.' }]);
      } else if (sc >= 1500) {
        state.flags.tribute = (state.flags.tribute || 0) + 20;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'Respectable. The machine reluctantly prints tickets for $20. The jukebox plays a little piano riff, which is the closest this diner has to applause.' }]);
      } else {
        startDialog([{ speaker: 'narrator', text: 'The machine eats your two dollars with a sound like a small mechanical shrug. Pinball is a cruel mistress. The pie watches, saying nothing.' }]);
      }
    }
    return;
  }
  g.flash = Math.max(0, g.flash - dt);
  g.msgT = Math.max(0, g.msgT - dt);
  g.lf = down(['ArrowLeft', 'KeyF']) ? 1 : 0;
  g.rf = down(['ArrowRight', 'KeyE']) ? 1 : 0;
  if (!g.launched) {
    if (down(['Space', 'KeyE', 'KeyB'])) { g.charging = true; g.power = Math.min(1, g.power + dt * 1.3); }
    else if (g.charging) {
      g.launched = true;
      g.vy = -(420 + g.power * 300);
      g.charging = false;
      audio.sfx('honk');
    }
    if (consume(['Escape', 'KeyM']) && g.balls === 3 && !g.score) { state.pin = null; state.mode = 'explore'; }
    return;
  }
  // physics
  g.vy += 620 * dt;
  g.x += g.vx * dt;
  g.y += g.vy * dt;
  // walls: table inner 232..392, top 30, lane divider x=392 from y 62 down, lane right edge 416
  if (g.x < 238) { g.x = 238; g.vx = Math.abs(g.vx) * .82; }
  if (g.x > 410) { g.x = 410; g.vx = -Math.abs(g.vx) * .82; }
  if (g.y < 34) { g.y = 34; g.vy = Math.abs(g.vy) * .82; if (g.x > 390) { g.vx = -140 - Math.random() * 60; g.msg = 'AROUND THE TOP!'; g.msgT = 1; } }
  // lane divider: ball in lane (x>392) below y=62 can't re-enter play field going down; once over the top it's in play
  if (g.x > 392 && g.x < 396 && g.y > 62 && g.vx < 0) { g.vx = 0; g.x = 396; }
  if (g.x >= 388 && g.x < 392 && g.y > 62) { g.x = 388; g.vx = -Math.abs(g.vx) * .5; }
  // bumpers — three, score 50 each hit
  const bumpers = [[278, 96, 15], [336, 76, 15], [306, 150, 15]];
  for (const [bx, by, br] of bumpers) {
    const d = Math.hypot(g.x - bx, g.y - by);
    if (d < br + 5) {
      const ang = Math.atan2(g.y - by, g.x - bx);
      const sp = Math.max(260, Math.hypot(g.vx, g.vy) * 1.05);
      g.vx = Math.cos(ang) * sp;
      g.vy = Math.sin(ang) * sp;
      g.x = bx + Math.cos(ang) * (br + 5.5);
      g.y = by + Math.sin(ang) * (br + 5.5);
      g.score += 50;
      g.flash = .12;
      g.msg = '+50';
      g.msgT = .5;
      audio.sfx('pickup');
    }
  }
  // rollover targets — two little lanes worth 100 each, one-time per ball
  if (!g.rollHit) g.rollHit = {};
  const rolls = [[250, 200, 'L'], [368, 200, 'R']];
  for (const [rx, ry, id] of rolls) {
    if (!g.rollHit[id] && Math.hypot(g.x - rx, g.y - ry) < 12) {
      g.rollHit[id] = true;
      g.score += 100;
      g.msg = 'ROLLOVER +100';
      g.msgT = .8;
      audio.sfx('cash');
    }
  }
  // flippers: pivot zones at bottom — left pivot (286,318), right pivot (356,318)
  if (g.y > 296 && g.y < 330) {
    if (g.lf && g.x > 258 && g.x < 300 && g.vy > 0) {
      g.vy = -330 - Math.random() * 60;
      g.vx = 60 + Math.random() * 80;
      audio.sfx('smash');
    }
    if (g.rf && g.x > 342 && g.x < 384 && g.vy > 0) {
      g.vy = -330 - Math.random() * 60;
      g.vx = -(60 + Math.random() * 80);
      audio.sfx('smash');
    }
  }
  // dead flipper zone — ball resting on unpressed flipper rolls toward center drain
  if (g.y > 316 && g.y < 336) {
    if (g.x > 262 && g.x < 310 && !g.lf) g.vx += 90 * dt;
    if (g.x > 332 && g.x < 380 && !g.rf) g.vx -= 90 * dt;
  }
  // drain
  if (g.y > 352) {
    g.balls -= 1;
    audio.sfx('denied');
    if (g.balls <= 0) {
      g.over = true;
      g.overT = 0;
    } else {
      g.x = 404; g.y = 330; g.vx = 0; g.vy = 0; g.launched = false; g.power = 0; g.rollHit = null;
      g.msg = 'BALL ' + (4 - g.balls) + ' — SHOOT AGAIN';
      g.msgT = 1.6;
    }
  }
}

function drawPinball() {
  const g = state.pin;
  px(ctx, 0, 0, 640, 360, '#14101c');
  // the machine
  px(ctx, 220, 14, 204, 340, '#3a2030');
  px(ctx, 226, 20, 192, 328, '#221420');
  // backglass
  px(ctx, 236, 24, 172, 34, '#1a2a4a');
  outlineText(ctx, 'GABAGOOL WIZARD', 322, 40, '#ffd23e', 10, 'center');
  outlineText(ctx, 'score ' + g.score, 322, 52, g.flash ? '#fff' : '#9be59b', 8, 'center');
  // playfield
  if (sceneArt.mgPinball && sceneArt.mgPinball.complete && sceneArt.mgPinball.naturalWidth) {
    ctx.drawImage(sceneArt.mgPinball, 232, 62, 160, 286);
  } else {
    px(ctx, 232, 62, 160, 286, '#2a1a3a');
  }
  // lane divider + lane
  px(ctx, 392, 62, 4, 286, '#4a3040');
  px(ctx, 396, 62, 20, 286, '#1a1020');
  outlineText(ctx, 'PLUNGER', 406, 76, '#8a6a5a', 6, 'center');
  // top arc hint
  px(ctx, 232, 62, 160, 4, '#5a4a6a');
  // bumpers
  const bumpers = [[278, 96, 15, '#ff5a4a'], [336, 76, 15, '#ffd23e'], [306, 150, 15, '#5ab8ff']];
  for (const [bx, by, br, col] of bumpers) {
    const glow = g.flash ? .5 : .2;
    ctx.save();
    ctx.globalAlpha = glow + Math.sin(state.time * 4 + bx) * .1;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx, by, br + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.arc(bx - 3, by - 3, br * .45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.stroke();
  }
  // rollovers
  for (const [rx, ry, id] of [[250, 200, 'L'], [368, 200, 'R']]) {
    const lit = g.rollHit && g.rollHit[id];
    ctx.fillStyle = lit ? '#9be59b' : '#4a6a4a';
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // flippers
  const la = g.lf ? -0.7 : 0.3;
  const ra = g.rf ? -0.7 : 0.3;
  ctx.save();
  ctx.strokeStyle = '#e8d24a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(286, 318);
  ctx.lineTo(286 + Math.cos(la) * 34, 318 + Math.sin(la) * 34 * .4 - (g.lf ? 10 : 0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(356, 318);
  ctx.lineTo(356 - Math.cos(ra) * 34, 318 + Math.sin(ra) * 34 * .4 - (g.rf ? 10 : 0));
  ctx.stroke();
  ctx.restore();
  // ball
  if (!g.over) {
    px(ctx, g.x - 3, g.y - 3, 6, 6, '#e8e8f0');
    px(ctx, g.x - 2, g.y - 2, 2, 2, '#fff');
  }
  // plunger power meter
  if (!g.launched && !g.over) {
    px(ctx, 428, 330 - (g.power || 0) * 100, 8, (g.power || 0) * 100, '#ff5a4a');
    outlineText(ctx, g.charging ? 'RELEASE!' : 'hold E/B to plunge', 320, 360 - 8, '#8a8a92', 8, 'center');
  }
  outlineText(ctx, 'balls: ' + g.balls, 480, 100, '#fff', 10, 'left');
  outlineText(ctx, 'F/◀ left flipper', 480, 130, '#8a8a92', 8, 'left');
  outlineText(ctx, 'A/▶ right flipper', 480, 144, '#8a8a92', 8, 'left');
  outlineText(ctx, '1500+ pays $20', 480, 170, '#5a6a5a', 8, 'left');
  outlineText(ctx, '3000+ pays $50', 480, 184, '#5a6a5a', 8, 'left');
  outlineText(ctx, 'multiball is a myth', 480, 210, '#4a4a52', 7, 'left');
  if (g.msgT > 0) outlineText(ctx, g.msg, 320, 290, '#ffd23e', 12, 'center');
  if (g.over) {
    px(ctx, 200, 130, 240, 90, '#000a');
    outlineText(ctx, 'GAME OVER', 320, 160, '#ff5a4a', 18, 'center');
    outlineText(ctx, 'final score ' + g.score, 320, 190, '#fff', 11, 'center');
  }
  // the machine's legs, because a machine with no visible legs is a floating machine
  px(ctx, 226, 348, 8, 10, '#111');
  px(ctx, 410, 348, 8, 10, '#111');
}

function updateSkeeball(dt) {
  const s = state.skee;
  if (!s) { state.mode = 'explore'; return; }
  s.t += dt;
  if (s.phase === 'aim') {
    if (!s.charging) {
      if (consume(['Space', 'Enter', 'KeyE'])) s.charging = true;
      if (consume(['Escape', 'KeyM']) && !s.balls.length) { state.skee = null; state.mode = 'explore'; }
    } else {
      s.power += dt * 1.6 * s.dir;
      if (s.power > 1) { s.power = 1; s.dir = -1; }
      if (s.power < 0) { s.power = 0; s.dir = 1; }
      if (!down(['Space', 'Enter', 'KeyE'])) {
        // release: the throw
        const p = s.power + (Math.random() - .5) * .06;
        let score = 0, ring = 'GUTTER';
        if (p > .92) { score = 0; ring = 'OVER!'; }
        else if (p > .78) { score = 100; ring = '100!!'; }
        else if (p > .62) { score = 50; ring = '50'; }
        else if (p > .45) { score = 30; ring = '30'; }
        else if (p > .28) { score = 20; ring = '20'; }
        else { score = 10; ring = '10'; }
        s.balls.push({ power: p, score, ring });
        s.total += score;
        audio.sfx(score >= 50 ? 'cash' : 'punch');
        s.charging = false; s.power = 0; s.dir = 1;
        if (s.balls.length >= 3) {
          s.phase = 'done';
          if (s.total >= 120) { state.flags.tribute = (state.flags.tribute || 0) + 40; audio.sfx('cash'); }
        }
      }
    }
    return;
  }
  if (s.phase === 'done' && consume(['Space', 'Enter', 'KeyE', 'Escape'])) { state.skee = null; state.mode = 'explore'; }
}

function drawSkeeball() {
  const s = state.skee;
  if (!s) return;
  if (!drawMgBackdrop(sceneArt.mgSkeeball, 640, 360, .4)) {
    ctx.fillStyle = '#101426';
    ctx.fillRect(0, 0, 640, 360);
  }
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SKEEBALL — three balls, 120+ pays $40', 320, 36);
  // rings target at top of ramp
  const cx = 320, cy = 110;
  const rings = [[46, '#5a2a2a', '10'], [36, '#2a4a5a', '20'], [27, '#2a5a34', '30'], [18, '#6a5a20', '50'], [9, '#8b2233', '100']];
  for (const [r, col, label] of rings) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(label, cx, cy - r - 2 + 10);
  }
  // ramp
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.strokeRect(cx - 40, cy + 20, 80, 150);
  // thrown balls markers
  s.balls.forEach((ball, bi) => {
    ctx.fillStyle = '#fff';
    const bx = cx - 120 + bi * 30;
    ctx.fillRect(bx, 300, 18, 8);
    ctx.fillStyle = '#ffd23e';
    ctx.font = '8px monospace';
    ctx.fillText(ball.ring, bx + 9, 296);
  });
  // power meter
  ctx.fillStyle = '#333';
  ctx.fillRect(cx + 120, 80, 18, 200);
  ctx.fillStyle = s.power > .92 ? '#f66' : s.power > .78 ? '#ffd23e' : '#4a4';
  const ph = s.power * 200;
  ctx.fillRect(cx + 120, 280 - ph, 18, ph);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(cx + 120, 80, 18, 200);
  // sweet spot marker
  ctx.strokeStyle = '#ffd23e';
  ctx.strokeRect(cx + 118, 280 - (.92 * 200), 22, (.92 - .78) * 200);
  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  if (s.phase === 'aim') {
    ctx.fillText(s.charging ? 'release to throw!' : 'HOLD space to charge — the gold band is the sweet spot', 320, 336);
    ctx.fillText('ball ' + (s.balls.length + 1) + ' of 3 · total ' + s.total, 320, 60);
  } else {
    ctx.fillStyle = s.total >= 120 ? '#6f6' : '#f66';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TOTAL ' + s.total + (s.total >= 120 ? ' — the machine pays! +$40. SPACE' : ' — the machine remembers. SPACE'), 320, 336);
  }
  ctx.textAlign = 'left';
}

function initDanceOff() {
  if ((state.flags.tribute || 0) < 10) { startDialog([{ speaker: 'narrator', text: 'The dance-off pot is ten dollars. The floor has seen things. It demands tribute.' }]); return; }
  state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 10);
  const seq = [];
  const dirs = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'];
  for (let i = 0; i < 12; i++) seq.push({ dir: dirs[Math.floor(Math.random() * 4)], t: 1.2 + i * .85, hit: null });
  state.dance = { seq, t: 0, score: 0, phase: 'run', endT: 0 };
  state.mode = 'danceoff';
  audio.sfx('pickup');
}

function updateDanceOff(dt) {
  const d = state.dance;
  if (!d) { state.mode = 'explore'; return; }
  d.t += dt;
  if (d.phase === 'run') {
    for (const dir of ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight']) {
      if (consume([dir])) {
        // hit the nearest unhit note of this direction within the window
        let best = null, bd = .32;
        for (const n of d.seq) {
          if (n.hit || n.dir !== dir) continue;
          const dist = Math.abs(n.t - d.t);
          if (dist < bd) { best = n; bd = dist; }
        }
        if (best) {
          best.hit = bd < .13 ? 'perfect' : 'good';
          d.score += bd < .13 ? 2 : 1;
          audio.sfx(bd < .13 ? 'cash' : 'punch');
        } else {
          audio.sfx('denied');
          d.score = Math.max(0, d.score - 1);
        }
      }
    }
    const last = d.seq[d.seq.length - 1];
    if (d.t > last.t + 1) {
      d.phase = 'done'; d.endT = 0;
      if (d.score >= 14) { state.flags.tribute = (state.flags.tribute || 0) + 60; audio.sfx('cash'); }
    }
    return;
  }
  if (d.phase === 'done' && consume(['Space', 'Enter', 'KeyE', 'Escape'])) { state.dance = null; state.mode = 'explore'; }
}

function drawDanceOff() {
  const d = state.dance;
  if (!d) return;
  if (!drawMgBackdrop(sceneArt.mgDanceoff, 640, 360, .35)) {
    ctx.fillStyle = '#160a20';
    ctx.fillRect(0, 0, 640, 360);
  }
  // disco floor
  for (let fx = 0; fx < 8; fx++) for (let fy = 0; fy < 3; fy++) {
    const hue = (state.time * 90 + fx * 45 + fy * 90) % 360;
    ctx.fillStyle = `hsla(${hue},70%,40%,.25)`;
    ctx.fillRect(200 + fx * 30, 220 + fy * 30, 28, 28);
  }
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DANCE-OFF AT THE BING — 14+ points pays $60', 320, 40);
  // dancer silhouette
  const kind = state.player.kind;
  const wig = Math.sin(state.time * 6) * (d.phase === 'run' ? 6 : 1);
  drawPerson(ctx, 300 + wig * .4, 210, kind, 'down', state.frame * 2, {});
  // target zone + notes
  const lanes = { ArrowLeft: 200, ArrowUp: 270, ArrowDown: 340, ArrowRight: 410 };
  const glyph = { ArrowLeft: '◀', ArrowUp: '▲', ArrowDown: '▼', ArrowRight: '▶' };
  ctx.font = 'bold 16px monospace';
  for (const dir of Object.keys(lanes)) {
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillText(glyph[dir], lanes[dir], 80);
  }
  if (d.phase === 'run') {
    for (const n of d.seq) {
      if (n.hit) continue;
      const y = 80 - (n.t - d.t) * 120;
      if (y < 60 || y > 340) continue;
      ctx.fillStyle = '#ffd23e';
      ctx.fillText(glyph[n.dir], lanes[n.dir], y);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('score ' + d.score + ' · hit the arrows as they cross the line', 320, 336);
  } else {
    ctx.fillStyle = d.score >= 14 ? '#6f6' : '#f66';
    ctx.font = 'bold 13px monospace';
    const verdict = d.score >= 18 ? 'THE FLOOR IS YOURS. Elaine felt nothing. +$60' : d.score >= 14 ? 'Respectable. The little kicks landed. +$60' : 'The floor has seen worse. Once. In the seventies. SPACE';
    ctx.fillText('score ' + d.score + ' — ' + verdict, 320, 140);
    ctx.fillStyle = '#aaa';
    ctx.font = '9px monospace';
    ctx.fillText('SPACE to leave the floor', 320, 170);
  }
  ctx.textAlign = 'left';
}

function initRoulette() {
  if (state.money < 20) { toast('Roulette is $20 a spin. The wheel does not do credit.'); return; }
  state.roulette = { phase: 'bet', pick: null, t: 0, result: null, spinT: 0 };
  state.mode = 'roulette';
  audio.sfx('pickup');
}

function updateRoulette(dt) {
  const r = state.roulette;
  if (!r) { state.mode = 'explore'; return; }
  if (r.phase === 'bet') {
    if (consume(['ArrowLeft', 'KeyA'])) { r.pick = 'red'; audio.sfx('pickup'); }
    if (consume(['ArrowRight', 'KeyD'])) { r.pick = 'black'; audio.sfx('pickup'); }
    if (r.pick && consume(['Space', 'Enter', 'KeyE'])) {
      state.money -= 20;
      r.phase = 'spin'; r.spinT = 0;
      // the wheel decides
      const roll = Math.random();
      r.result = roll < .47 ? 'red' : roll < .94 ? 'black' : 'green';
      r.number = Math.floor(Math.random() * 37);
      audio.sfx('spin' in audio ? 'spin' : 'pickup');
    }
    if (consume(['Escape'])) { state.roulette = null; state.mode = 'explore'; }
    return;
  }
  if (r.phase === 'spin') {
    r.spinT += dt;
    if (r.spinT > 3.2) {
      r.phase = 'done';
      if (r.result === r.pick) {
        state.money += 40;
        audio.sfx('cash');
      } else audio.sfx('denied');
    }
    return;
  }
  if (r.phase === 'done' && consume(['Space', 'Enter', 'KeyE', 'Escape'])) { state.roulette = null; state.mode = 'explore'; }
}

function drawRoulette() {
  const r = state.roulette;
  if (!r) return;
  if (!drawMgBackdrop(sceneArt.mgRoulette, 640, 360, .45)) {
    ctx.fillStyle = '#160a20';
    ctx.fillRect(0, 0, 640, 360);
  }
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ROULETTE — $20 a spin, red or black pays double', 320, 40);
  // the wheel
  const cx = 320, cy = 180, rad = 90;
  for (let i = 0; i < 37; i++) {
    const a = (i / 37) * Math.PI * 2 + (r.phase === 'spin' ? state.time * (6 - r.spinT * 1.6) : 0);
    ctx.fillStyle = i === 0 ? '#2a8a3a' : i % 2 === 0 ? '#a02828' : '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rad, a, a + Math.PI * 2 / 37);
    ctx.fill();
  }
  ctx.fillStyle = '#4a3a28';
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fill();
  // the ball
  if (r.phase === 'spin') {
    const ba = state.time * (6 - r.spinT * 1.6) * 1.7;
    const br = 78 - r.spinT * 9;
    px(ctx, cx + Math.cos(ba) * Math.max(46, br), cy + Math.sin(ba) * Math.max(46, br), 5, 5, '#fff');
  }
  if (r.phase === 'bet') {
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('◀ RED or BLACK ▶ · SPACE spins · ESC walks', 320, 316);
    if (r.pick) {
      ctx.fillStyle = r.pick === 'red' ? '#f66' : '#ddd';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('on ' + r.pick.toUpperCase() + ' — SPACE to spin', 320, 296);
    }
  } else if (r.phase === 'spin') {
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText('the wheel decides…', 320, 316);
  } else {
    const won = r.result === r.pick;
    ctx.fillStyle = r.result === 'red' ? '#f66' : r.result === 'black' ? '#ddd' : '#4a4';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(r.number + ' ' + r.result.toUpperCase(), 320, 296);
    ctx.fillStyle = won ? '#6f6' : '#f66';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(won ? 'WINNER — double your money. +$40' : 'The house thanks you for the twenty. SPACE', 320, 316);
  }
  ctx.textAlign = 'left';
}

function initSlots() {
  state.slots = { reels: ['7', '7', '7'], spinning: false, spinT: 0, result: null, resultT: 0, pulls: 0 };
  state.mode = 'slots';
  audio.sfx('pickup');
}

function updateSlots(dt) {
  const s = state.slots;
  if (!s) { state.mode = 'explore'; return; }
  if (s.spinning) {
    s.spinT -= dt;
    // reels cycle fast while spinning
    if (Math.floor(state.time * 14) !== s.lastTick) {
      s.lastTick = Math.floor(state.time * 14);
      s.reels = [slotSymbol(), slotSymbol(), slotSymbol()];
      audio.sfx('card');
    }
    if (s.spinT <= 0) {
      s.spinning = false;
      s.reels = [slotSymbol(), slotSymbol(), slotSymbol()];
      const [a, b, c] = s.reels;
      let win = 0, msg = '';
      if (a === '7' && b === '7' && c === '7') { win = 500; msg = 'JACKPOT! TRIPLE SEVENS! +$500'; }
      else if (a === b && b === c) { win = 100; msg = 'THREE OF A KIND! +$100'; }
      else if (a === b || b === c || a === c) { win = 30; msg = 'PAIR! +$30'; }
      if (win) {
        state.flags.tribute = (state.flags.tribute || 0) + win;
        audio.sfx('cash');
        audio.sfx('success');
      } else {
        audio.sfx('denied');
        msg = 'nothing. the machine blinks, unbothered.';
      }
      s.result = { win, msg };
      s.resultT = 2.6;
    }
    return;
  }
  if (s.result) {
    s.resultT -= dt;
    if (s.resultT <= 0) {
      s.result = null;
      // exit after the hand if broke or done after several pulls — player can leave anytime with movement
      if ((state.flags.tribute || 0) < 20) {
        state.mode = 'explore';
        startDialog([{ speaker: 'narrator', text: 'The machine senses your empty pockets and loses interest in you completely.' }]);
        return;
      }
    }
    return;
  }
  if (consume(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) || consume(['KeyW'])) {
    state.mode = 'explore';
    return;
  }
  if (interactPressed()) {
    if ((state.flags.tribute || 0) < 20) {
      audio.sfx('denied');
      startDialog([{ speaker: 'narrator', text: 'Twenty a pull. You have less than twenty. The machine judges you silently, which is its only move.' }]);
      return;
    }
    state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 20);
    s.spinning = true;
    s.spinT = 1.6 + Math.random() * .8;
    s.pulls += 1;
    audio.sfx('pickup');
  }
}

function drawStrength() {
  const st = state.strength;
  if (!st) return;
  ctx.fillStyle = 'rgba(8,6,12,.88)';
  ctx.fillRect(180, 60, 280, 240);
  ctx.strokeStyle = '#d4a017';
  ctx.strokeRect(180, 60, 280, 240);
  ctx.fillStyle = '#f5efdc';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HIGH STRIKER', 320, 84);
  const v = st.swinging ? st.t : st.power;
  const barH = 150, bx = 296, by = 100, bw = 48;
  ctx.fillStyle = '#202028';
  ctx.fillRect(bx, by, bw, barH);
  const grad = ctx.createLinearGradient(0, by + barH, 0, by);
  grad.addColorStop(0, '#2f7a2f');
  grad.addColorStop(.7, '#d4a017');
  grad.addColorStop(1, '#c01818');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by + barH * (1 - v), bw, barH * v);
  ctx.fillStyle = '#f5efdc';
  ctx.font = '10px monospace';
  if (st.swinging) ctx.fillText('press E at the peak!', 320, 276);
  else ctx.fillText({ bell: 'DING DING DING! +$50', big: 'SO CLOSE! +$15', ok: 'halfway — $5 back', weak: 'pathetic. honestly.' }[st.result], 320, 276);
  ctx.textAlign = 'left';
}

function drawCraps() {
  const c = state.craps;
  if (!c) return;
  ctx.fillStyle = 'rgba(8,6,12,.9)';
  ctx.fillRect(190, 80, 260, 200);
  ctx.strokeStyle = '#d4a017';
  ctx.strokeRect(190, 80, 260, 200);
  ctx.fillStyle = '#f5efdc';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BACK ROOM DICE — $25', 320, 104);
  ctx.font = '11px monospace';
  if (c.phase === 'choose') {
    ctx.fillText('pick a side, then E to roll', 320, 132);
    ctx.fillStyle = c.pick === 'under' ? '#ffd23e' : '#f5efdc';
    ctx.fillText('◀ UNDER 8  (A / 1)', 320, 160);
    ctx.fillStyle = c.pick === 'over' ? '#ffd23e' : '#f5efdc';
    ctx.fillText('OVER 7  (D / 2) ▶', 320, 182);
    ctx.fillStyle = '#888';
    ctx.fillText('7 always loses. Q to walk away.', 320, 214);
  } else {
    const shake = c.phase === 'roll' ? Math.sin(state.time * 40) * 4 : 0;
    ctx.font = 'bold 30px monospace';
    ctx.fillText(c.phase === 'roll' ? '…' : String(c.d1), 290 + shake, 160);
    ctx.fillText(c.phase === 'roll' ? '…' : String(c.d2), 350 - shake, 160);
    ctx.font = '11px monospace';
    if (c.phase === 'done') {
      ctx.fillStyle = c.win ? '#7ad47a' : '#d47a7a';
      ctx.fillText(c.seven ? 'SEVEN — house eats it' : c.win ? `TOTAL ${c.d1 + c.d2} — YOU WIN $${c.bet * 2}` : `TOTAL ${c.d1 + c.d2} — house wins`, 320, 200);
      ctx.fillStyle = '#888';
      ctx.fillText('E to continue', 320, 226);
    } else {
      ctx.fillStyle = '#888';
      ctx.fillText('rolling…', 320, 200);
    }
  }
  ctx.textAlign = 'left';
}

function drawSlots() {
  const s = state.slots;
  if (!drawMgBackdrop(sceneArt.mgSlots, 640, 416, .45)) {
    px(ctx, 0, 0, 640, 416, '#16101e');
  }
  outlineText(ctx, 'SLOTS · THE BING BACK CORNER', 320, 44, '#ffe78a', 11, 'center');
  // machine body
  px(ctx, 170, 90, 300, 210, '#3a2a4a');
  px(ctx, 178, 98, 284, 130, '#241a30');
  px(ctx, 178, 96, 284, 4, '#c8a040');
  // reels
  for (let i = 0; i < 3; i++) {
    const rx = 208 + i * 92;
    px(ctx, rx, 118, 64, 84, s && s.spinning ? '#f4efdc' : '#fffbe8');
    px(ctx, rx + 3, 121, 58, 78, '#e8e0c8');
    const glyph = s ? s.reels[i] : '7';
    const sym = SLOT_SYMBOLS.find((x) => x.glyph === glyph) || SLOT_SYMBOLS[0];
    outlineText(ctx, glyph, rx + 32, 140, sym.color, 34, 'center');
  }
  // lever
  px(ctx, 478, 120, 12, 90, '#6a5a7a');
  px(ctx, 472, 108, 24, 18, s && s.spinning ? '#ff8a7a' : '#c02828');
  // paytable
  outlineText(ctx, '777 = $500 · 3-of-kind = $100 · pair = $30', 320, 246, '#9d8fc9', 8, 'center');
  outlineText(ctx, `cash: $${state.flags.tribute || 0} · $20/pull`, 320, 266, '#ffe78a', 9, 'center');
  if (s && s.result) {
    outlineText(ctx, s.result.msg, 320, 316, s.result.win ? '#8ffff2' : '#ff8a7a', 12, 'center');
  } else if (s && s.spinning) {
    outlineText(ctx, 'spinning…', 320, 316, '#9d8fc9', 10, 'center');
  } else {
    outlineText(ctx, 'E = PULL · move to walk away', 320, 316, '#ffe78a', 9, 'center');
  }
  px(ctx, 170, 236, 300, 4, '#c8a040');
}


// ---------- Vesuvio kitchen rush ----------
const KITCHEN_ING = [
  { key: 'KeyE', key2: 'KeyA', label: 'A', name: 'sauce', color: '#c23a2a' },
  { key: 'KeyB', label: 'B', name: 'cheese', color: '#f0e6c8' },
  { key: 'KeyR', label: 'R', name: 'basil', color: '#4a8a3a' },
  { key: 'KeyF', label: 'F', name: 'fire', color: '#e8862a' }
];
const KITCHEN_DISHES = [
  { name: 'baked ziti', pay: 9, len: 3 },
  { name: 'veal parm', pay: 12, len: 4 },
  { name: 'calamari', pay: 14, len: 4 },
  { name: 'the feast plate', pay: 18, len: 5 }
];
function kitchenOrder() {
  const d = KITCHEN_DISHES[Math.floor(Math.random() * KITCHEN_DISHES.length)];
  const seq = [];
  for (let i = 0; i < d.len; i++) seq.push(Math.floor(Math.random() * 4));
  if (seq[seq.length - 1] !== 3) seq[seq.length - 1] = 3; // always finish on the fire
  return { name: d.name, pay: d.pay, seq, done: 0, t: 22 };
}
function initKitchen() {
  state.kitchen = { order: kitchenOrder(), served: 0, ruined: 0, streak: 0, best: 0, timer: 75, flash: 0, flashBad: 0, over: false, overT: 0, earned: 0 };
  state.mode = 'kitchen';
  audio.sfx('pickup');
}
function updateKitchen(dt) {
  const k = state.kitchen;
  if (!k) { state.mode = 'explore'; return; }
  if (k.over) {
    k.overT += dt;
    if (k.overT > 1 && consume(['KeyE', 'KeyB', 'Space'])) {
      const earned = k.earned, served = k.served, ruined = k.ruined;
      state.kitchen = null; state.mode = 'explore';
      state.flags.tribute = (state.flags.tribute || 0) + earned;
      if (earned > 0) audio.sfx('cash');
      const lines = served >= 6
        ? [{ speaker: 'artie', text: served + ' plates! The man’s a natural! Take the $' + earned + ' — and listen, the invitation to invest in this restaurant is STILL retracted, but warmly this time.' }]
        : served >= 3
          ? [{ speaker: 'artie', text: served + ' plates out the door, ' + ruined + ' in the bin. $' + earned + '. Not bad for a — what are you exactly? Don’t answer that. $' + earned + '.' }]
          : [{ speaker: 'artie', text: 'That was… hmm. The health inspector would call it "an experience". $' + earned + ' for the effort. Please stop helping before the dinner rush.' }];
      startDialog(lines);
    }
    return;
  }
  k.timer -= dt;
  k.flash = Math.max(0, k.flash - dt);
  k.flashBad = Math.max(0, k.flashBad - dt);
  const o = k.order;
  o.t -= dt;
  if (o.t <= 0) {
    // order walked
    k.ruined++; k.streak = 0; k.flashBad = .5;
    audio.sfx('buzzer');
    k.order = kitchenOrder();
  } else {
    for (let i = 0; i < 4; i++) {
      if (consume(KITCHEN_ING[i].key2 ? [KITCHEN_ING[i].key, KITCHEN_ING[i].key2] : [KITCHEN_ING[i].key])) {
        if (o.seq[o.done] === i) {
          o.done++;
          k.flash = .25;
          audio.sfx('blip');
          if (o.done >= o.seq.length) {
            const bonus = k.streak >= 2 ? Math.round(o.pay * .5) : 0;
            k.earned += o.pay + bonus;
            k.served++; k.streak++;
            k.best = Math.max(k.best, k.streak);
            spawnEffect(320, 200, '+$' + (o.pay + bonus), '#9be59b');
            audio.sfx('pickup');
            k.order = kitchenOrder();
          }
        } else {
          k.ruined++; k.streak = 0; k.flashBad = .5;
          audio.sfx('buzzer');
          spawnEffect(320, 200, 'RUINED', '#ff9a8a');
          k.order = kitchenOrder();
        }
        break;
      }
    }
  }
  if (consume(['Escape', 'KeyM'])) {
    state.kitchen = null; state.mode = 'explore';
    startDialog([{ speaker: 'artie', text: 'Walking out mid-shift! In the middle of the RUSH! …Honestly? Respect. Most of my dishwashers just ghost. The unpaid tickets are the restaurant’s problem now, which is to say: my problem, which is to say: please never do this again.' }]);
    return;
  }
  if (k.timer <= 0) { k.over = true; k.overT = 0; audio.sfx('cash'); }
}
function drawKitchen() {
  const k = state.kitchen;
  if (!k) return;
  const hasKitchenArt = sceneArt.mgKitchen && sceneArt.mgKitchen.complete && sceneArt.mgKitchen.naturalWidth;
  if (hasKitchenArt) {
    ctx.drawImage(sceneArt.mgKitchen, 0, 0, 640, 360);
    ctx.fillStyle = 'rgba(12,8,6,.45)';
    ctx.fillRect(0, 0, 640, 34);
  } else {
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#2a1c12';
    ctx.fillRect(60, 60, 520, 220);
    ctx.fillStyle = '#c23a2a';
    ctx.fillRect(60, 60, 520, 34);
  }
  ctx.fillStyle = '#f5efdd';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VESUVIO — DINNER RUSH', 320, 82);
  if (!hasKitchenArt) {
    for (let i = 0; i < 5; i++) {
      const fx = 140 + i * 90;
      const h = 10 + Math.sin(state.time * 9 + i * 2) * 5;
      ctx.fillStyle = '#e8862a';
      ctx.fillRect(fx, 250 - h, 26, h);
      ctx.fillStyle = '#ffd76e';
      ctx.fillRect(fx + 8, 250 - h * .6, 10, h * .6);
    }
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(60, 250, 520, 30);
  }
  // current order ticket
  const o = k.order;
  ctx.fillStyle = '#f5efdd';
  ctx.fillRect(190, 108, 260, 118);
  ctx.strokeStyle = '#6e5540';
  ctx.strokeRect(190.5, 108.5, 259, 117);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(o.name.toUpperCase(), 320, 128);
  // time bar
  ctx.fillStyle = o.t < 7 ? '#c23a2a' : '#4a8a3a';
  ctx.fillRect(200, 134, 240 * Math.max(0, o.t / 22), 5);
  // sequence
  for (let i = 0; i < o.seq.length; i++) {
    const ing = KITCHEN_ING[o.seq[i]];
    const sx = 320 - (o.seq.length - 1) * 24 + i * 48;
    const sy = 172;
    ctx.fillStyle = i < o.done ? '#4a8a3a' : ing.color;
    ctx.beginPath();
    ctx.arc(sx, sy, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = i === o.done ? '#ffe78a' : '#333';
    ctx.lineWidth = i === o.done ? 3 : 1;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(ing.label, sx, sy + 5);
    if (i < o.seq.length - 1) {
      ctx.fillStyle = '#999';
      ctx.font = '10px monospace';
      ctx.fillText('→', sx + 24, sy + 4);
    }
  }
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.fillText('A sauce · B cheese · R basil · F fire — wrong ingredient ruins the plate', 320, 214);
  // hud
  ctx.fillStyle = '#e8dcc8';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SHIFT ' + Math.max(0, Math.ceil(k.timer)) + 's', 70, 312);
  ctx.fillText('served ' + k.served, 70, 330);
  ctx.fillStyle = '#ffe78a';
  ctx.fillText('earned $' + k.earned, 480, 312);
  ctx.fillStyle = k.streak >= 2 ? '#ffd76e' : '#b8a88a';
  ctx.fillText('streak x' + k.streak + (k.streak >= 2 ? ' (+50%)' : ''), 480, 330);
  ctx.textAlign = 'center';
  if (k.flashBad > 0) {
    ctx.fillStyle = 'rgba(194,58,42,' + (k.flashBad * .5) + ')';
    ctx.fillRect(0, 0, 640, 360);
  }
  if (k.over) {
    ctx.fillStyle = 'rgba(10,8,6,.82)';
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#e8c25a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('SHIFT OVER', 320, 150);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '11px monospace';
    ctx.fillText('plates out: ' + k.served + ' · ruined: ' + k.ruined + ' · best streak x' + k.best, 320, 176);
    ctx.fillStyle = '#ffe78a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('EARNED $' + k.earned, 320, 202);
    ctx.fillStyle = '#b8a88a';
    ctx.font = '10px monospace';
    ctx.fillText('E to wipe your hands', 320, 232);
  }
  ctx.textAlign = 'left';
}

// ---------- The Executive Game (five-card draw) ----------
function pkDeck() {
  const d = [];
  for (let s = 0; s < 4; s++) for (let v = 2; v <= 14; v++) d.push({ v, s });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; }
  return d;
}
function pkRank(hand) {
  const vs = hand.map(c => c.v).sort((a, b) => b - a);
  const ss = hand.map(c => c.s);
  const flush = ss.every(s => s === ss[0]);
  const uniq = [...new Set(vs)].sort((a, b) => a - b);
  let straight = 0;
  if (uniq.length === 5 && uniq[4] - uniq[0] === 4) straight = uniq[4];
  else if (uniq.join(',') === '2,3,4,5,14') straight = 5;
  const counts = {};
  vs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const groups = Object.entries(counts).map(([v, c]) => ({ v: +v, c })).sort((a, b) => b.c - a.c || b.v - a.v);
  let flat = groups.flatMap(g => Array(g.c).fill(g.v));
  if (uniq.join(',') === '2,3,4,5,14') flat = [5, 4, 3, 2, 14]; // wheel: ace plays low
  let rank = 0;
  if (straight && flush) rank = 8;
  else if (groups[0].c === 4) rank = 7;
  else if (groups[0].c === 3 && groups[1] && groups[1].c === 2) rank = 6;
  else if (flush) rank = 5;
  else if (straight) rank = 4;
  else if (groups[0].c === 3) rank = 3;
  else if (groups[0].c === 2 && groups[1] && groups[1].c === 2) rank = 2;
  else if (groups[0].c === 2) rank = 1;
  return [rank, ...flat];
}
function pkName(rank) {
  return ['high card', 'a pair', 'two pair', 'three of a kind', 'a straight', 'a flush', 'a full house', 'four of a kind', 'a STRAIGHT FLUSH'][rank] || 'high card';
}
function pkCompare(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d) return d;
  }
  return 0;
}
function pkAiDiscard(hand) {
  const r = pkRank(hand);
  if (r[0] >= 4) return [];
  const counts = {};
  hand.forEach(c => counts[c.v] = (counts[c.v] || 0) + 1);
  return hand.map((c, i) => counts[c.v] === 1 && c.v < 12 ? i : -1).filter(i => i >= 0).slice(0, 3);
}

function initPoker() {
  if ((state.flags.tribute || 0) < 20) {
    startDialog([{ speaker: 'narrator', text: 'The buy-in is twenty dollars. You have less than that. The table observes this in silence, which is worse than any comment.' }]);
    return;
  }
  state.flags.tribute -= 20;
  const deck = pkDeck();
  const mk = (name, kind) => ({ name, kind, hand: deck.splice(0, 5), discards: [], folded: false });
  state.poker = {
    deck,
    player: mk('You', state.player.kind),
    ai: [mk('Silvio', 'silvio'), mk('Paulie', 'paulie'), mk('Christopher', 'christopher')],
    pot: 80, cur: 0, sel: [false, false, false, false, false],
    phase: 'select', t: 0, ax: 0, result: null
  };
  state.mode = 'poker';
  audio.sfx('pickup');
}

function updatePoker(dt) {
  const p = state.poker;
  if (!p) { state.mode = 'explore'; return; }
  p.t += dt;
  if (p.phase === 'select') {
    let mv = 0;
    if (consume(['ArrowLeft'])) mv = -1;
    if (consume(['ArrowRight'])) mv = 1;
    if (Math.abs(axis.x) > .6 && Math.abs(p.ax) <= .6) mv = axis.x > 0 ? 1 : -1;
    p.ax = axis.x;
    if (mv) { p.cur = (p.cur + mv + 5) % 5; audio.sfx('blip'); }
    if (consume(['KeyE'])) { p.sel[p.cur] = !p.sel[p.cur]; audio.sfx('blip'); }
    if (consume(['KeyB', 'Space'])) {
      const deck = p.deck;
      for (let i = 0; i < 5; i++) if (p.sel[i]) p.player.hand[i] = deck.pop();
      for (const ai of p.ai) {
        const di = pkAiDiscard(ai.hand);
        ai.discards = di;
        for (const i2 of di) ai.hand[i2] = deck.pop();
      }
      p.phase = 'reveal'; p.t = 0;
      audio.sfx('smash');
    }
  } else if (p.phase === 'reveal') {
    if (p.t > 2.2 || consume(['KeyE', 'KeyB'])) {
      const pr = pkRank(p.player.hand);
      const ranked = p.ai.map(ai => ({ ai, r: pkRank(ai.hand) }));
      const seats = [{ name: 'player', r: pr }, ...ranked.map(e => ({ name: e.ai.name, r: e.r }))];
      let best = pr;
      for (const s of seats) if (pkCompare(s.r, best) > 0) best = s.r;
      const winners = seats.filter(s => pkCompare(s.r, best) === 0).map(s => s.name);
      p.playerRank = pr;
      const playerWon = winners.length === 1 && winners[0] === 'player';
      const playerTied = winners.includes('player') && winners.length > 1;
      p.result = playerWon ? 'player' : playerTied ? 'tie' : winners[0];
      p.winners = winners;
      p.phase = 'done'; p.t = 0;
      if (playerWon) {
        state.flags.tribute = (state.flags.tribute || 0) + p.pot;
        state.stats.pokerWins = (state.stats.pokerWins || 0) + 1;
        audio.sfx('cash');
      } else if (playerTied) {
        const share = Math.floor(p.pot / winners.length);
        state.flags.tribute = (state.flags.tribute || 0) + share;
        p.share = share;
        audio.sfx('pickup');
      } else audio.sfx('buzzer');
    }
  } else if (p.phase === 'done') {
    if (p.t > .8 && consume(['KeyE', 'KeyB', 'Space'])) {
      const won = p.result === 'player';
      const tied = p.result === 'tie';
      const share = p.share || 0;
      const others = (p.winners || []).filter(w => w !== 'player').join(' and ');
      const pname = pkName(p.playerRank[0]);
      state.poker = null; state.mode = 'explore';
      if (tied) {
        startDialog([
          { speaker: 'narrator', text: 'Dead heat — you and ' + others + ' show the same hand. The pot splits: $' + share + ' comes back to you. Paulie inspects both hands for a full minute, looking for the difference. There is no difference. That’s what a tie IS, Paulie.' }
        ]);
      } else if (won) {
        startDialog([
          { speaker: 'narrator', text: 'You rake the pot with ' + pname + '. $80 across the felt. Christopher throws his cards like they personally betrayed him, which, in a sense, they did.' },
          { speaker: 'silvio', text: 'Nice hand. Don’t make a habit of it.' }
        ]);
      } else {
        startDialog([
          { speaker: 'narrator', text: p.result + ' takes it. You had ' + pname + ', which in this room is a rumor, not a hand. Paulie is doing a small seated celebration that he thinks is subtle.' },
          { speaker: 'paulie', text: 'The secret is I never look at my cards. Can’t lose what you don’t acknowledge.' }
        ]);
      }
    }
  }
}

function drawPoker() {
  const p = state.poker;
  if (!p) return;
  if (sceneArt.mgPoker && sceneArt.mgPoker.complete && sceneArt.mgPoker.naturalWidth) {
    ctx.drawImage(sceneArt.mgPoker, 0, 0, 640, 360);
  } else {
    ctx.fillStyle = '#0d2417';
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#1a4a2e';
    ctx.beginPath();
    ctx.ellipse(320, 210, 290, 130, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6e5540';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = '#e8c25a';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE EXECUTIVE GAME', 320, 20);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#b8a88a';
  ctx.fillText('five-card draw · ante $20 · winner takes the pot', 320, 34);
  const suits = ['♠', '♥', '♦', '♣'];
  const suitCol = (s) => s === 1 || s === 2 ? '#d84040' : '#222';
  const oppX = [150, 320, 490];
  p.ai.forEach((ai, k) => {
    const x = oppX[k];
    drawPortrait(ctx, x - 16, 48, ai.kind);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '9px monospace';
    ctx.fillText(ai.name, x, 96);
    const show = p.phase === 'done';
    ai.hand.forEach((c, i) => {
      const cx = x - 34 + i * 15, cy = 102;
      ctx.fillStyle = show ? '#f5efdd' : '#8a2a2a';
      ctx.fillRect(cx, cy, 13, 18);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(cx + .5, cy + .5, 12, 17);
      if (show) {
        ctx.fillStyle = suitCol(c.s);
        ctx.font = '8px monospace';
        ctx.fillText((c.v === 14 ? 'A' : c.v === 13 ? 'K' : c.v === 12 ? 'Q' : c.v === 11 ? 'J' : c.v) + suits[c.s], cx + 6, cy + 13);
      }
    });
    if (p.phase === 'done') {
      ctx.fillStyle = '#ffe78a';
      ctx.fillText(pkName(pkRank(ai.hand)[0]), x, 132);
    } else if (p.phase === 'reveal') {
      ctx.fillStyle = '#b8a88a';
      ctx.fillText('drew ' + ai.discards.length, x, 132);
    }
  });
  ctx.fillStyle = '#ffe78a';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('POT $' + p.pot, 320, 158);
  const py = 240;
  p.player.hand.forEach((c, i) => {
    const cx = 220 + i * 42, cy = py + (p.sel[i] ? -12 : 0);
    ctx.fillStyle = '#f5efdd';
    ctx.fillRect(cx, cy, 34, 48);
    ctx.strokeStyle = p.cur === i && p.phase === 'select' ? '#ffe78a' : '#333';
    ctx.lineWidth = p.cur === i && p.phase === 'select' ? 3 : 1;
    ctx.strokeRect(cx + .5, cy + .5, 33, 47);
    ctx.lineWidth = 1;
    ctx.fillStyle = suitCol(c.s);
    ctx.font = 'bold 13px monospace';
    ctx.fillText((c.v === 14 ? 'A' : c.v === 13 ? 'K' : c.v === 12 ? 'Q' : c.v === 11 ? 'J' : c.v), cx + 17, cy + 20);
    ctx.font = '15px monospace';
    ctx.fillText(suits[c.s], cx + 17, cy + 38);
    if (p.sel[i]) {
      ctx.fillStyle = '#ff9a4a';
      ctx.font = '8px monospace';
      ctx.fillText('DISCARD', cx + 17, cy - 4);
    }
  });
  ctx.fillStyle = '#e8dcc8';
  ctx.font = '10px monospace';
  if (p.phase === 'select') {
    ctx.fillText('◀ ▶ choose · E mark for discard · B draw', 320, 320);
    ctx.fillStyle = '#b8a88a';
    ctx.fillText('marked cards get replaced — the table is watching', 320, 334);
  } else if (p.phase === 'reveal') {
    ctx.fillText('the draw is in…', 320, 320);
  } else {
    const won = p.result === 'player';
    ctx.fillStyle = won ? '#9be59b' : '#ff9a8a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(won ? 'YOU TAKE THE POT — ' + pkName(p.playerRank[0]).toUpperCase() : p.result === 'tie' ? 'SPLIT POT — $' + (p.share || 0) + ' back to you' : p.result.toUpperCase() + ' TAKES IT — you had ' + pkName(p.playerRank[0]), 320, 318);
    ctx.fillStyle = '#b8a88a';
    ctx.font = '10px monospace';
    ctx.fillText('E to leave the table', 320, 336);
  }
  ctx.textAlign = 'left';
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
  if (sceneArt.mgBlackjack && sceneArt.mgBlackjack.complete && sceneArt.mgBlackjack.naturalWidth) {
    ctx.drawImage(sceneArt.mgBlackjack, 0, 0, 640, 416);
  } else {
    px(ctx, 0, 0, 640, 416, '#0d2818');
  }
  outlineText(ctx, 'BLACKJACK · THE BING BACK ROOM', 320, 46, '#ffe78a', 11, 'center');
  const bj = state.blackjack;
  if (!bj) return;
  if (!(sceneArt.mgBlackjack && sceneArt.mgBlackjack.complete && sceneArt.mgBlackjack.naturalWidth)) {
    ctx.fillStyle = '#1a4a2e';
    ctx.beginPath();
    ctx.ellipse(320, 240, 260, 130, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8a040';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
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

const TRANSIT_EVENTS = [
  {
    key: 'deer', prompt: 'DEER IN THE ROAD! ◀ swerve · brake ▶',
    left: { text: 'You swerve onto the shoulder. The deer watches you leave with the total indifference of a creature that has done this before. Because it has. Twice today.', effect: s => { } },
    right: { text: 'You brake hard. The deer passes. Your coffee does not survive, but the bumper does. New Jersey owes you nothing for this.', effect: s => { } },
    timeout: { text: 'THUMP. A glancing hit — the deer is fine, they are built like tiny cars. Your dignity and $20 of body work are not.', effect: s => { s.money = Math.max(0, s.money - 20); } }
  },
  {
    key: 'toll', prompt: 'TOLL BOOTH! ◀ exact change · no-charge lane ▶',
    left: { text: 'Exact change, smooth toss, green light. Somewhere a toll collector nods at the purest transaction in New Jersey.', effect: s => { s.money = Math.max(0, s.money - 2); } },
    right: { text: 'You blow through the no-charge lane. A camera flashes. Somewhere, a violation notice begins its long journey to an address you don’t technically have.', effect: s => { s.flags.heat = Math.min(5, (s.flags.heat || 0) + .5); } },
    timeout: { text: 'You freeze at the booth. The attendant sighs the sigh of a thousand frozen tourists. $5 and a lecture.', effect: s => { s.money = Math.max(0, s.money - 5); } }
  },
  {
    key: 'speedtrap', prompt: 'SPEED TRAP AHEAD! ◀ ease off · GUN IT ▶',
    left: { text: 'You ease off as the cruiser glides by. The trooper’s eyes say “not today, but soon.” Wise.', effect: s => { } },
    right: { text: 'You gun it. For four seconds you are the fastest thing in either state. Then you spend the rest of the drive checking the mirror, which is its own punishment.', effect: s => { if (Math.random() < .4) s.flags.heat = Math.min(5, (s.flags.heat || 0) + .5); } },
    timeout: { text: 'You drive right past the trap at exactly the worst speed. The ticket is $30 and written with insulting neatness.', effect: s => { s.money = Math.max(0, s.money - 30); } }
  }
];

function updateTransit(dt) {
  const tr = state.transit;
  if (!tr) { state.mode = 'explore'; return; }
  tr.t += dt;
  if (tr.eventT === undefined && tr.t > 1.2 && Math.random() < .5) {
    tr.event = TRANSIT_EVENTS[Math.floor(Math.random() * TRANSIT_EVENTS.length)];
    tr.eventT = 0;
    audio.sfx('denied');
  }
  if (tr.event && tr.eventT >= 0) {
    tr.eventT += dt;
    let choice = null;
    if (consume(['ArrowLeft', 'KeyA'])) choice = 'left';
    if (consume(['ArrowRight', 'KeyD'])) choice = 'right';
    if (choice || tr.eventT > 1.6) {
      const out = choice ? tr.event[choice] : tr.event.timeout;
      out.effect(state);
      audio.sfx(choice ? 'pickup' : 'thud');
      tr.eventResult = out.text;
      tr.event = null;
      tr.eventT = -1;
      tr.resultT = 2;
    }
    return;
  }
  if (tr.resultT > 0) tr.resultT -= dt;
  if (tr.t >= tr.dur + (tr.resultT > 0 ? tr.resultT : 0)) {
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
  if (tr && tr.event) {
    ctx.fillStyle = 'rgba(8,6,12,.85)';
    ctx.fillRect(90, 150, 460, 100);
    ctx.strokeStyle = '#ffd23e';
    ctx.strokeRect(90, 150, 460, 100);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tr.event.prompt, 320, 185);
    ctx.fillStyle = '#f5efdc';
    ctx.font = '10px monospace';
    ctx.fillText('choose fast — left or right', 320, 210);
    const bar = Math.max(0, 1 - (tr.eventT || 0) / 1.6);
    ctx.fillStyle = '#ff5040';
    ctx.fillRect(140, 228, 360 * bar, 5);
    ctx.textAlign = 'left';
  } else if (tr && tr.eventResult && tr.resultT > 0) {
    ctx.fillStyle = 'rgba(8,6,12,.85)';
    ctx.fillRect(70, 160, 500, 76);
    ctx.strokeStyle = '#8ffff2';
    ctx.strokeRect(70, 160, 500, 76);
    ctx.fillStyle = '#f5efdc';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, tr.eventResult, 460, 10);
    lines.slice(0, 3).forEach((ln, li) => ctx.fillText(ln, 320, 180 + li * 13));
    ctx.textAlign = 'left';
  }

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

function robRegister(place, flavor) {
  const rc = state.flags.robCount || 0;
  if (rc >= 3 && Math.random() < .5 && !((state['registerCd_' + place] || 0) > state.time)) {
    startDialog([
      { speaker: 'narrator', text: 'The clerk squints at you before you even reach the counter. His hand is already under the register — on the silent alarm, not the cash.' },
      { speaker: 'clerk', text: 'YOU. I know your face. My cousin at the other store, he knows your face too. We got a GROUP CHAT, my friend. You want to buy something? Fine. Anything else — the cops are already bored of coming here.' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A group chat! They’re ORGANIZED! Since when are the clerks organized?!' : 'A group chat. The REGISTER GUYS got a network now. World’s going soft and digital at the same time. I need a new racket.' }
    ]);
    state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
    audio.sfx('denied');
    return;
  }
  const key = 'registerCd_' + place;
  if ((state[key] || 0) > state.time) { toast('You just hit this place. Even you got rules. Come back later.'); return; }
  state[key] = state.time + 120;
  state.flags.robCount = (state.flags.robCount || 0) + 1;
  const take = 40 + Math.floor(Math.random() * 50);
  state.money += take;
  state.flags.heat = Math.min(5, (state.flags.heat || 0) + 2);
  audio.sfx('cash');
  audio.sfx('denied');
  spawnEffect(state.player.x + 8, state.player.y - 12, `+$${take} · +2 heat`, '#ff9a7a');
  if (state.mission && state.mission.id === 'bigScore') {
    const bsStep = missionStep();
    if (bsStep && bsStep.scene === state.scene) setTimeout(() => { if (state.mission && state.mission.id === 'bigScore' && missionStep() && missionStep().scene === state.scene) advanceMission(); }, 60);
  }
  startDialog([
    { speaker: 'narrator', text: flavor },
    { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m a criminal now! A real one! I need to tell — no wait. I need to tell NOBODY. This is hard!' : `+${take}. Shoulda been more, but it’s Thanksgiving. Even robbery got a season.` }
  ]);
}

function bodegaInteractions() {
  return [
    { x: 90, y: 320, w: 50, h: 40, radius: 42, label: 'The bottle-return machine', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George feeds the machine a bag of empties he has absolutely been carrying around for exactly this occasion. It eats six, rejects one — “NON-REFUNDABLE” — and George argues with it out loud for ninety seconds about jurisdiction. Total payout: 30¢ and a deeper resentment of Michigan.' },
        { speaker: 'george', text: 'TEN cents in Michigan! TEN! We live in the wrong state, Jerry! We have ALWAYS lived in the wrong state!' },
        { speaker: 'system', text: '+$1 in sticky quarters. The machine keeps the dignity.' }
      ] : [
        { speaker: 'narrator', text: 'Tony watches a guy feed cans into the machine for eleven minutes. The machine pays out a dollar-fifty. The guy is thrilled. Tony does the math on the hourly rate and feels something close to grief.' }
      ]);
      if (state.player.kind === 'george') { state.money += 1; }
    } },
    { x: 340, y: 130, w: 40, h: 30, radius: 40, label: 'Rob the register', action: () => robRegister('bodega', 'You empty the register into a bodega bag in four seconds flat. The clerk doesn’t even look up — New York’s most unimpressed man. The cat, however, witnesses everything and will judge you forever.') },
    { x: 500, y: 150, w: 60, h: 40, radius: 42, label: 'Pocket a candy bar', action: () => {
      if ((state.shopliftCd || 0) > state.time) { toast('The clerk is watching the candy aisle now. He KNOWS.'); return; }
      state.shopliftCd = state.time + 40;
      const caught = Math.random() < .3;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + (caught ? .8 : .3));
      if (caught) {
        audio.sfx('denied');
        startDialog([
          { speaker: 'narrator', text: 'The clerk materializes with the silent speed of a man who has seen ten thousand candy bar attempts. “You pay, or you go. Both. Both, and never come back.” You pay $4. You will pay it forever, in shame.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'It fell INTO my pocket! Gravity did it! I’m a victim of PHYSICS!' : 'Kid’s got a good eye. Respect. I’m buying two. Full price. We never spoke.' }
        ]);
        state.money = Math.max(0, state.money - 4);
      } else {
        audio.sfx('pickup');
        state.money += 2;
        spawnEffect(state.player.x, state.player.y - 16, 'Pocketed. Smooth.', '#ffd0a0');
        startDialog([{ speaker: 'narrator', text: 'A candy bar slides into your pocket like it was born there. Somewhere a scanner fails to beep. The thrill is enormous and entirely disproportionate to the prize. You sold the wrapper for $2 to a tourist, somehow.' }]);
      }
    } },
    { x: 4, y: 330, w: 60, h: 76, radius: 42, label: 'Leave', action: leaveOutside },
    { x: 258, y: 8, w: 84, h: 86, radius: 34, label: 'Deli counter', action: () => {
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
    { x: 200, y: 60, w: 50, h: 34, radius: 40, label: 'Browse the magazines', action: () => {
      audio.sfx('pickup');
      if (Math.random() < .3) {
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + .2);
        startDialog([{ speaker: 'narrator', text: 'The bodega owner materializes beside you with the silent speed of a man who has caught ten thousand magazine browsers. “This is not a LIBRARY,” he says, in the tone of a man saying it for the ten-thousand-and-first time. You buy a pack of gum out of shame. It costs $4.' }]);
        state.money = Math.max(0, state.money - 4);
      } else {
        startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'George reads an entire magazine article about organizational productivity while standing in a bodega aisle, unpaid, the way nature intended.' },
          { speaker: 'george', text: 'Twelve tips! I only need eleven! The twelfth was “buy the magazine” — nice try, BIG MAGAZINE!' }
        ] : [
          { speaker: 'narrator', text: 'Tony flips through a fishing magazine, examines a centerfold of a largemouth bass, nods with genuine respect, and puts it back perfectly straight. Even browsing, there are standards.' }
        ]);
      }
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

function drawMeadow() {
  if (drawSceneArt(sceneArt.meadow, 768, 416)) {
    // horses circling the rail
    for (let h = 0; h < 3; h++) {
      const ang = state.time * .5 + h * 2.1;
      const hx = 390 + Math.cos(ang) * 72 - state.camera.x;
      const hy = 125 + Math.sin(ang) * 42 - state.camera.y;
      px(ctx, hx, hy, 8, 5, ['#6a4a2a', '#3a3a3a', '#8a6a4a'][h]);
      px(ctx, hx + 6, hy - 2, 3, 3, ['#6a4a2a', '#3a3a3a', '#8a6a4a'][h]);
    }
    for (let s = 0; s < 4; s++) {
      const sy = 300 - ((state.time * 20 + s * 18) % 60);
      ctx.save();
      ctx.globalAlpha = .3;
      px(ctx, 110 + s * 4 - state.camera.x, sy - state.camera.y, 4, 4, '#aaa');
      ctx.restore();
    }
    const fx2 = 150 + Math.sin(state.time * .3) * 30;
    drawPerson(ctx, fx2 - state.camera.x, 320 - state.camera.y, 'manA', 'down', state.frame, { pose: 'walk' });
    drawHighwaySign(660, 150, ['NJ TURNPIKE', '← NORTH CALDWELL']);
    drawHighwaySign(60, 200, ['ROUTE 3 WEST', '← THE NEIGHBORHOOD']);
    return;
  }
  px(ctx, 0, 0, 768, 416, '#23301f');
  // swampy flatlands
  for (let i = 0; i < 30; i++) {
    const gx = (i * 97) % 760;
    const gy = 150 + (i * 61) % 250;
    px(ctx, gx, gy, 8, 3, '#2e4530');
  }
  // stadium silhouette northeast
  px(ctx, 548, 8, 212, 104, '#2b2f38');
  px(ctx, 560, 18, 188, 84, '#343945');
  ctx.fillStyle = '#8f97a8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE MEADOWLANDS', 654, 62);
  const lit = Math.sin(state.time * 2) > 0;
  px(ctx, 560, 30, 188, 3, lit ? '#ffe9a0' : '#6a6a55');
  // grandstand west
  px(ctx, 8, 8, 180, 84, '#4a3f35');
  px(ctx, 16, 16, 164, 66, '#5d5044');
  ctx.fillStyle = '#d8c9a8';
  ctx.fillText('GRANDSTAND · RACING', 98, 34);
  ctx.fillStyle = '#ffd23e';
  ctx.font = '7px monospace';
  ctx.fillText('POST TIME 7:00', 98, 48);
  // the racetrack oval infield
  px(ctx, 280, 60, 220, 130, '#6b543a');
  px(ctx, 296, 74, 188, 102, '#3a5a34');
  px(ctx, 330, 96, 120, 58, '#6b543a');
  px(ctx, 344, 108, 92, 34, '#3a5a34');
  // horses going around the rail
  for (let h = 0; h < 3; h++) {
    const ang = state.time * .5 + h * 2.1;
    const hx = 390 + Math.cos(ang) * 72 - state.camera.x;
    const hy = 125 + Math.sin(ang) * 42 - state.camera.y;
    px(ctx, hx, hy, 8, 5, ['#6a4a2a', '#3a3a3a', '#8a6a4a'][h]);
    px(ctx, hx + 6, hy - 2, 3, 3, ['#6a4a2a', '#3a3a3a', '#8a6a4a'][h]);
  }
  // parking lot rows with cars
  px(ctx, 20, 120, 500, 60, '#3a3a3a');
  for (let c = 0; c < 9; c++) {
    px(ctx, 40 + c * 52, 132, 30, 14, ['#7a2a2a','#2a4a7a','#b8a888','#3a3a3a','#777','#2848a0','#6a5a2a','#4a4a4a','#8a3a5a'][c]);
  }
  // tailgate smoke
  for (let s = 0; s < 4; s++) {
    const sy = 300 - ((state.time * 20 + s * 18) % 60);
    ctx.save();
    ctx.globalAlpha = .3;
    px(ctx, 110 + s * 4 - state.camera.x, sy - state.camera.y, 4, 4, '#aaa');
    ctx.restore();
  }
  // drunk fans milling near tailgate
  const fx = 150 + Math.sin(state.time * .3) * 30;
  drawPerson(ctx, fx - state.camera.x, 320 - state.camera.y, 'manA', 'down', state.frame, { pose: 'walk' });
  drawHighwaySign(660, 150, ['NJ TURNPIKE', '← NORTH CALDWELL']);
  drawHighwaySign(60, 200, ['ROUTE 3 WEST', '← THE NEIGHBORHOOD']);
  ctx.textAlign = 'left';
}

function meadowInteractions() {
  return [
    { x: 400, y: 330, w: 90, h: 40, radius: 52, inCarOk: true, label: 'The chop shop — cash for cars', action: () => {
      if (!state.player.inCar) { toast('The chop shop only talks to people who arrive IN something. With four wheels. That they don’t plan to leave with.'); return; }
      if ((state.chopCd || 0) > state.time) { toast('The chop shop is hot right now — literally, there’s smoke. Come back in a couple minutes.'); return; }
      const cc2 = state.player.carColor || '';
      const tier = cc2 === '#a02828' ? ['the Vette', 110] : cc2 === '#2848a0' ? ['the cruiser', 85] : cc2 === '#3d6b35' ? ['the sedan', 60] : cc2 === '#b8a888' ? ['the wagon', 45] : ((state.player.speed || 160) >= 190 ? ['the unfamiliar ride — nice one', 70] : ['the unfamiliar ride', 50]);
      const pay = tier[1] + Math.floor(Math.random() * 20);
      state.money += pay;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 1);
      state.chopCd = state.time + 150;
      state.player.inCar = false;
      state.player.carColor = null;
      state.player.carV = 0;
      state.player.speed = state.player.kind === 'george' ? 96 : 88;
      audio.sfx('cash');
      audio.sfx('door');
      const sc = scenes[state.scene];
      if (sc) audio.setMusic(sc.music);
      saveWorld();
      spawnEffect(state.player.x + 8, state.player.y - 12, `+$${pay}`, '#9fe89a');
      startDialog([
        { speaker: 'narrator', text: `The garage door is open exactly enough. A man in a welding mask looks at ${tier[0]}, looks at you, looks at the Meadowlands beyond you both, and names a number without a single word being exchanged about provenance. $${pay}. The car will be seventeen cars by Tuesday. The welding mask does not care about your feelings.` },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? `They took it apart WHILE I WATCHED! It was someone’s car! It was MY car! It was — whose car was it? Should I feel bad? I feel a little bad. I feel worse that I got lowballed.` : 'Fair price, no paperwork, no eye contact. This is how commerce is SUPPOSED to work. The reeds keep secrets better than people do.' },
        { speaker: 'system', text: `+$${pay} · +1 heat. The shop needs a few minutes before the next one.` }
      ]);
    } },
    { x: 4, y: 210, w: 40, h: 90, radius: 46, label: '← West: the neighborhood', action: () => {
      startDialog([{ speaker: 'narrator', text: 'West on Route 3, past the reeds and the things the reeds keep secret. The neighborhood is ten minutes and a world away.' }], () => startTransit('hub', 60, 250, 'ROUTE 3 · WEST'));
    } },
    { x: 730, y: 210, w: 36, h: 90, radius: 46, label: 'Tunnel → Manhattan', action: () => {
      startDialog([{ speaker: 'narrator', text: 'East toward the skyline. The tunnel swallows you whole and spits you out in a place where the coffee costs four dollars.' }], () => startTransit('nyc', 60, 250, 'LINCOLN TUNNEL · EAST'));
    } },
    { x: 98, y: 100, w: 80, h: 30, radius: 46, label: 'Betting window — the ponies', action: () => {
      startDialog([{ speaker: 'narrator', text: 'The real track, the real odds, the same four horses somehow. The teller doesn’t ask questions. The teller has seen everything twice.' }], () => initRacing());
    } },
    { x: 280, y: 150, w: 60, h: 30, radius: 44, label: 'Borrow a parking-lot car', hidden: () => !!state.player.inCar, action: () => {
      stealRandomCar();
    } },
    { x: 110, y: 310, w: 40, h: 30, radius: 42, label: 'Tailgate — sausage and peppers', action: () => {
      if ((state.flags.tailgateFood || 0) > 2) { startDialog([{ speaker: 'narrator', text: 'The grill guy squints. "You again? Buddy. It’s Thanksgiving. Go home." The grill is closed to you now. This is somehow the saddest thing that has ever happened.' }]); return; }
      state.flags.tailgateFood = (state.flags.tailgateFood || 0) + 1;
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A stranger hands George a sausage and peppers off a tailgate grill, no questions asked. Free food. No obligation. No social contract. George has finally reached the promised land, and it is a parking lot off Route 3.' },
        { speaker: 'george', text: 'You see this? THIS is living! A man cooks meat in a parking lot and just GIVES it to you! Why do we even have restaurants?!' }
      ] : [
        { speaker: 'narrator', text: 'Tailgate sausage and peppers. Onions done right. Tony eats it leaning on somebody’s El Camino and for four minutes there is no heat, no crews, no nothing. Just the Meadowlands wind and a sandwich.' },
        { speaker: 'tony', text: 'This is better than half the restaurants I know. Don’t tell Artie. He’d genuinely never recover.' }
      ]);
    } },
    { x: 640, y: 150, w: 60, h: 40, radius: 44, label: 'Stadium gate', action: () => {
      startDialog([{ speaker: 'narrator', text: 'The stadium is dark — Thanksgiving, no game. A security guard the size of a freezer shakes his head before you even reach the gate. Behind him, an arena full of empty seats sits in the dark, dreaming of a halftime show.' }]);
    } },
    { x: 370, y: 130, w: 60, h: 30, radius: 44, label: 'Track rail — watch the workout', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'You lean on the rail as the horses pound past, close enough to feel it in your sternum. One of them — the dark one, third out — runs like it personally owes somebody money. You make a mental note. The mental note is worth exactly nothing.' }]);
    } },
    { x: 640, y: 200, w: 60, h: 30, radius: 42, label: 'Binoculars — quarter a look', action: () => {
      if (state.money < 1) { toast('The binoculars demand a dollar. Everything out here has a price.'); return; }
      state.money -= 1;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'Through the binoculars: the backstretch, the railbirds, a man tearing up tickets with the practiced grief of a daily ritual, and — far beyond the fence — the reeds. The reeds keep their own counsel. The reeds have seen things no binocular will ever confirm.' }]);
    } },
    { x: 200, y: 220, w: 70, h: 30, radius: 42, label: 'The railbirds', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'The railbirds lean in with their racing forms folded into squares, speaking a dialect of pure numbers and grievances. “The four horse? The four horse is a criminal. That horse owes ME money.” One of them sizes you up, decides you’re alright, and tells you a tip so bad it loops back around to wisdom.' }]);
    } },
    { x: 60, y: 300, w: 110, h: 60, radius: 40, label: 'Sleep in the car', action: () => {
      if (!state.player.inCar) { toast('You need to drive a car in here first.'); return; }
      state.time += 30;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'You crack the window, tilt the seat back, and sleep the parking-lot sleep of a person with nothing to prove. You wake up slightly later. The Meadowlands has not moved. Nothing has changed. It is perfect.' }]);
    } }
  ];
}

function drawDmv() {
  if (drawSceneArt(sceneArt.dmv, 640, 416)) {
    // live NOW SERVING number over the painted display
    const serving0 = state.flags.dmvServing || 41;
    px(ctx, 470, 32, 78, 24, '#2a2a26');
    outlineText(ctx, 'B-' + String(serving0).padStart(3, '0'), 509, 40, '#e8862a', 12, 'center');
    // the clerk in the one open window, medically incapable of urgency
    if (typeof drawPortrait === 'function') drawPortrait(ctx, 408, 58, 'manB');
    // fluorescent flicker
    if (Math.sin(state.time * 17) > .92) { ctx.save(); ctx.globalAlpha = .1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 416); ctx.restore(); }
    return;
  }
  // procedural institutional despair — no painted art could capture it more cheaply
  px(ctx, 0, 0, 640, 416, '#8a8a80');
  px(ctx, 0, 96, 640, 320, '#a8a898'); // linoleum
  for (let tx = 0; tx < 640; tx += 32) px(ctx, tx, 96, 1, 320, '#98988a');
  for (let ty = 96; ty < 416; ty += 32) px(ctx, 0, ty, 640, 1, '#98988a');
  // the wall of windows — three clerks, one open, as is tradition
  px(ctx, 30, 30, 580, 64, '#6a6a60');
  for (let wi = 0; wi < 3; wi++) {
    const wx = 90 + wi * 180;
    px(ctx, wx, 42, 120, 44, wi === 1 ? '#c8d8e0' : '#3a3a36');
    px(ctx, wx, 78, 120, 8, '#4a4a44');
    outlineText(ctx, wi === 1 ? 'OPEN' : 'CLOSED', wx + 60, 38, wi === 1 ? '#9be59b' : '#8a4a4a', 6, 'center');
    if (wi === 1) {
      px(ctx, wx + 52, 56, 16, 18, '#c8a880'); // the clerk, medically incapable of urgency
      px(ctx, wx + 55, 48, 10, 9, '#e8c8a0');
    }
  }
  // NOW SERVING display — the loneliest number in New York
  px(ctx, 250, 102, 140, 26, '#2a2a26');
  const serving = state.flags.dmvServing || 41;
  const blink = Math.sin(state.time * 2) > -.7;
  outlineText(ctx, 'NOW SERVING', 320, 112, '#8a8a80', 6, 'center');
  outlineText(ctx, 'B-' + String(serving).padStart(3, '0'), 320, 125, blink ? '#ffb02a' : '#7a5a20', 11, 'center');
  // seating rows — molded plastic in municipal orange
  for (const [sx, sy] of [[80, 170], [360, 170]]) {
    for (let ci = 0; ci < 5; ci++) {
      px(ctx, sx + ci * 38, sy, 30, 22, '#c87830');
      px(ctx, sx + ci * 38, sy + 22, 30, 6, '#a86028');
    }
  }
  // the occupied chairs — people who have been here since various presidential administrations
  const waiters = [[118, 176, 'manB'], [156, 176, 'womanA'], [398, 176, 'womanC'], [474, 176, 'manA']];
  for (const [wx, wy, kind] of waiters) {
    if (typeof drawPortrait === 'function') drawPortrait(ctx, wx - 11, wy - 22, kind);
    else px(ctx, wx - 6, wy - 14, 12, 16, '#7a5a40');
  }
  // the queue maze — retractable belt barriers, empty, mocking
  px(ctx, 120, 250, 400, 4, '#3a5a8a');
  px(ctx, 120, 286, 400, 4, '#3a5a8a');
  for (const px2 of [120, 320, 520]) { px(ctx, px2 - 3, 246, 6, 46, '#8a8a92'); px(ctx, px2 - 8, 288, 16, 4, '#555'); }
  // ticket dispenser on a pole
  px(ctx, 560, 240, 18, 26, '#b84030');
  px(ctx, 565, 266, 8, 30, '#666');
  outlineText(ctx, 'TICKETS', 569, 236, '#fff', 5, 'center');
  // the poster wall — organ donation, defensive driving, a missing cat
  px(ctx, 20, 120, 40, 52, '#d8d0b8');
  px(ctx, 24, 124, 32, 20, '#8ab8d8');
  outlineText(ctx, 'ORGAN', 40, 156, '#4a4a44', 5, 'center');
  outlineText(ctx, 'DONOR?', 40, 164, '#4a4a44', 5, 'center');
  px(ctx, 584, 120, 40, 52, '#d8d0b8');
  px(ctx, 588, 124, 32, 20, '#e8a0a0');
  outlineText(ctx, 'LOST', 604, 156, '#4a4a44', 5, 'center');
  outlineText(ctx, 'MUFFLER', 604, 164, '#4a4a44', 5, 'center');
  // fluorescent flicker
  if (Math.sin(state.time * 17) > .92) { ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 416); ctx.restore(); }
  px(ctx, 150, 16, 120, 8, '#e8e8d8');
  px(ctx, 390, 16, 120, 8, '#e8e8d8');
  // the forms table
  px(ctx, 240, 300, 160, 44, '#7a6a50');
  px(ctx, 250, 306, 30, 20, '#e8e8e0');
  px(ctx, 290, 308, 24, 16, '#d0d0c8');
  outlineText(ctx, 'FORMS', 320, 296, '#4a4a44', 6, 'center');
}

function dmvInteractions() {
  return [
    { x: 610, y: 262, w: 26, h: 60, radius: 48, label: 'Back to Manhattan', action: () => {
      setScene('nyc', 420, 250);
    } },
    { x: 498, y: 138, w: 26, h: 34, radius: 44, label: 'Take a number', action: () => {
      if (state.flags.dmvTicket) { toast('You already have a number — B-' + state.flags.dmvTicket + '. It is not being served. It may never be served.'); return; }
      const serving = state.flags.dmvServing || 41;
      const ticket = serving + 3 + Math.floor(Math.random() * 4);
      state.flags.dmvTicket = ticket;
      if (!state.flags.dmvServing) state.flags.dmvServing = serving;
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'The dispenser coughs up a small pink slip: B-' + String(ticket).padStart(3, '0') + '. Now serving: B-' + String(serving).padStart(3, '0') + '. The arithmetic of despair is simple and exact. Take a seat. Take several.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'THREE numbers away! That’s nothing! That’s — wait, how long is a number? …HOW LONG IS A NUMBER?!' : 'Yeah, I don’t do lines. We’ll see how this plays out.' }
      ]);
    } },
    { x: 420, y: 116, w: 90, h: 26, radius: 54, label: 'The clerk window', action: () => {
      const serving = state.flags.dmvServing || 41;
      const ticket = state.flags.dmvTicket;
      if (ticket && ticket <= serving) {
        startDialog([
          { speaker: 'clerk', text: 'NUMBER B-' + String(ticket).padStart(3, '0') + '. State your business in eight words or less. The words must be exactly correct.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Vanity plates! I want — okay — the BEST plate! Money no object! …Some object. What do you have in the forty-to-sixty range?' : 'Plates. The ones with the letters. You know the ones.' },
          { speaker: 'narrator', text: 'The clerk stamps your form with the last ounce of civic energy in the tri-state area. Your vanity plates will arrive in six-to-eight weeks. They will have exactly one letter wrong. This is guaranteed by the state. Your number is retired — the machine, impossibly, has served someone.', action: () => { state.flags.dmvTicket = 0; state.flags.dmvServing = (state.flags.dmvServing || 41) + 1; } }
        ]);
      } else if (ticket) {
        startDialog([{ speaker: 'narrator', text: 'The clerk looks at your ticket. Then at the NOW SERVING display. Then at you. Nothing is said. Nothing needs to be. You are B-' + String(ticket).padStart(3, '0') + '. The display says B-' + String(serving).padStart(3, '0') + '. Time passes, but not here.' }]);
      } else {
        startDialog([
          { speaker: 'clerk', text: 'No ticket, no service. That is not a policy. That is the load-bearing wall of civilization.' },
          { speaker: 'narrator', text: 'Somewhere behind her, a second clerk eats a sandwich with the intensity of a man who has never once been hurried. The OPEN sign buzzes, perhaps sarcastically.' }
        ]);
      }
    } },
    { x: 478, y: 122, w: 50, h: 20, radius: 48, label: 'Slip the clerk $40', action: () => {
      if (!state.flags.dmvTicket) { toast('Corruption requires paperwork. Get a number first.'); return; }
      if (state.money < 40) { toast('Forty bucks. Even graft has a price floor.'); return; }
      state.money -= 40;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .3);
      const t = state.flags.dmvTicket;
      state.flags.dmvServing = t;
      audio.sfx('cash');
      spawnEffect(300, 250, 'SERVING: B-' + String(t).padStart(3, '0'), '#ffd23e');
      startDialog([
        { speaker: 'narrator', text: 'The forty dollars vanish into the paperwork like they were never there — an act of civic magic. The NOW SERVING display flickers, thinks it over, and jumps directly to your number. The people in the orange chairs do not react. They have seen this before. They will see it again.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I beat the system! I PAID the system, but it FEELS like beating! …This is how the world works, isn’t it. I’m going to be sick.' : 'Forty bucks to skip a line. Cheapest favor in Jersey. Uh — New York. Wherever we are.' }
      ]);
    } },
    { x: 150, y: 272, w: 40, h: 22, radius: 40, label: 'Sit and wait', action: () => {
      if (!state.flags.dmvTicket) { toast('The chairs are for ticket-holders. Even the chairs have rules here.'); return; }
      const serving = state.flags.dmvServing || 41;
      if (state.flags.dmvTicket <= serving) { toast('Your number is UP — get to the window before the clerk notices joy.'); return; }
      state.flags.dmvServing = serving + 1;
      audio.sfx('door');
      startDialog([
        { speaker: 'narrator', text: 'You wait. Time passes the way it does here — geologically. A number is called. The display advances by exactly one. Someone’s legend ends at the window in silence.' },
        { speaker: 'narrator', text: state.player.kind === 'george' ? 'An elderly man two chairs down has a sandwich in a foil wrapper older than your car.' : 'A wiseguy never waits. And yet. The things we do for vanity plates.' }
      ]);
    } },
    { x: 600, y: 142, w: 34, h: 40, radius: 38, label: 'The poster wall', action: () => {
      startDialog([{ speaker: 'narrator', text: '"BE AN ORGAN DONOR — SOMEONE IS WAITING." Someone is also waiting for their license renewal, and has been since Tuesday, and frankly their organs are starting to feel like a renewable resource.' }]);
    } },
    { x: 26, y: 214, w: 34, h: 60, radius: 42, label: 'The forms', action: () => {
      startDialog([
        { speaker: 'narrator', text: 'Form MV-82. Form MV-44. Form MV-37C, which is a form explaining that you have completed the wrong forms. A pen is chained to the table. The chain is the most secure object in the state of New York.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'There’s a form for the forms! It’s PERFECT! It’s the perfect system — nothing can ever go wrong because nothing can ever HAPPEN!' : 'This is why the family uses fixers. God bless the fixers.' }
      ]);
    } }
  ];
}

function drawDiner() {
  if (drawSceneArt(sceneArt.diner, 640, 416)) {
    // neon coffee sign flicker
    const fl = Math.sin(state.time * 7) > .7 ? .5 : 1;
    ctx.save();
    ctx.globalAlpha = .3 * fl;
    ctx.fillStyle = '#e85a4a';
    ctx.beginPath();
    ctx.arc(300 - state.camera.x, 60 - state.camera.y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // jukebox glow pulse
    ctx.save();
    ctx.globalAlpha = .12 + Math.sin(state.time * 3) * .06;
    ctx.fillStyle = '#7ab5e8';
    ctx.beginPath();
    ctx.arc(590 - state.camera.x, 210 - state.camera.y, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawPerson(ctx, 200 - state.camera.x, 92 - state.camera.y, 'manB', 'down', Math.floor(state.time * .5) % 2, { pose: 'sit' });
    drawPerson(ctx, 470 - state.camera.x, 92 - state.camera.y, 'womanA', 'down', Math.floor(state.time * .4) % 2, { pose: 'sit' });
    drawPerson(ctx, 165 - state.camera.x, 185 - state.camera.y, 'womanB', 'down', 0, { pose: 'sit' });
    drawPerson(ctx, 330 - state.camera.x, 58 - state.camera.y, 'womanC', 'down', state.frame * .5, {});
    drawPerson(ctx, 100 - state.camera.x, 322 - state.camera.y, 'bobby', 'right', Math.floor(state.time * .3) % 2, { pose: 'stand' });
    return;
  }
  // checkered floor
  for (let fy = 8; fy < 408; fy += 16) for (let fx = 8; fx < 632; fx += 16) {
    px(ctx, fx, fy, 16, 16, ((fx + fy) / 16) % 2 ? '#3d3436' : '#332b2c');
  }
  // back wall band with windows — night outside, neon glow
  px(ctx, 8, 8, 624, 22, '#4a3a42');
  for (let wx = 60; wx < 600; wx += 120) {
    px(ctx, wx, 10, 60, 18, '#141c2e');
    px(ctx, wx, 10, 60, 2, '#6a5a62');
    px(ctx, wx + 26, 10, 2, 18, '#6a5a62');
    px(ctx, wx + 8, 14, 10, 8, '#e85a4a'); // neon OPEN reflection
  }
  // the long chrome counter with stools
  px(ctx, 30, 30, 580, 68, '#9a9aa2');
  px(ctx, 30, 30, 580, 8, '#d8d8e0');
  px(ctx, 30, 88, 580, 10, '#6a6a72');
  px(ctx, 30, 40, 580, 3, '#7a7a84');
  // pie case on the counter — the rotating shrine
  px(ctx, 440, 44, 60, 40, '#c8b060');
  px(ctx, 444, 48, 52, 32, '#2e2020');
  const pieSpin = Math.floor(state.time * 2) % 3;
  px(ctx, 448 + pieSpin * 4, 54, 12, 8, '#c85a5a');
  px(ctx, 466 - pieSpin * 3, 62, 12, 8, '#e8d88a');
  // coffee urns steaming
  px(ctx, 120, 44, 30, 44, '#b8b8c0');
  px(ctx, 156, 44, 30, 44, '#a8a8b0');
  if (Math.sin(state.time * 2) > 0) { px(ctx, 130, 36, 3, 6, '#888'); px(ctx, 168, 34, 3, 6, '#888'); }
  // counter stools — red vinyl tops
  for (let sx = 90; sx < 560; sx += 62) {
    px(ctx, sx, 104, 18, 8, '#a02e2e');
    px(ctx, sx + 7, 112, 4, 20, '#6a6a72');
  }
  // booths — red vinyl with chrome trim and little table
  for (const [bx, by] of [[120, 150], [420, 150], [120, 280], [420, 280]]) {
    px(ctx, bx, by, 96, 70, '#7a2e2e');
    px(ctx, bx, by, 96, 14, '#a03e3e');
    px(ctx, bx, by + 56, 96, 14, '#a03e3e');
    px(ctx, bx + 32, by + 26, 32, 18, '#d8d0c0');
    px(ctx, bx + 32, by + 26, 32, 3, '#f0e8d8');
    // ketchup and the little jukebox remote on each table
    px(ctx, bx + 38, by + 30, 4, 7, '#c03030');
    px(ctx, bx + 52, by + 31, 8, 6, '#3a3a44');
  }
  // the big jukebox — glowing arch, chrome trim
  px(ctx, 560, 200, 60, 140, '#2e4a6b');
  px(ctx, 566, 206, 48, 60, '#7ab5e8');
  px(ctx, 570, 210, 40, 40, '#e8c93e');
  px(ctx, 566, 272, 48, 8, '#c0c0c8');
  const jb = Math.sin(state.time * 4) > 0 ? '#e85a4a' : '#4ae85a';
  px(ctx, 568, 286, 6, 6, jb); px(ctx, 580, 286, 6, 6, '#4a6ae8'); px(ctx, 592, 286, 6, 6, jb);
  // tiled wainscot strip along walls
  for (let wx = 8; wx < 632; wx += 24) px(ctx, wx, 400, 24, 8, wx % 48 ? '#4a3a42' : '#554350');
  // hanging ceiling lights
  for (let lx = 130; lx < 600; lx += 140) {
    px(ctx, lx, 8, 2, 12, '#2a2a2e');
    px(ctx, lx - 5, 20, 12, 8, '#e8c93e');
    ctx.save();
    ctx.globalAlpha = .07;
    ctx.fillStyle = '#e8c93e';
    ctx.beginPath();
    ctx.arc(lx + 1, 60, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawDinerRegulars();
}

function drawDinerRegulars() {
  // the regulars — a diner is its people. camera is already translated in drawWorld,
  // but the art path runs pre-translate, so this is only called on the fallback path…
  // except drawDiner is ALWAYS inside the translated context — plain scene coords.
  drawPerson(ctx, 200, 92, 'manB', 'down', Math.floor(state.time * .5) % 2, { pose: 'sit' });
  drawPerson(ctx, 470, 92, 'womanA', 'down', Math.floor(state.time * .4) % 2, { pose: 'sit' });
  drawPerson(ctx, 165, 185, 'womanB', 'down', 0, { pose: 'sit' });
  drawPerson(ctx, 330, 58, 'womanC', 'down', state.frame * .5, {});
  drawPerson(ctx, 100, 322, 'bobby', 'right', Math.floor(state.time * .3) % 2, { pose: 'stand' });
}

function dinerInteractions() {
  // arm-wrestle the trucker — diner tradition
  return [
    { x: 30, y: 350, w: 60, h: 60, radius: 44, label: 'Leave', action: leaveOutside },
    { x: 200, y: 112, w: 56, h: 28, radius: 40, label: 'Coffee ($2)', action: () => {
      if (state.money < 2) { toast('Coffee is $2. The bottomless kind. You’re bottomless out of cash.'); return; }
      state.money -= 2;
      if ((state.flags.hp || 3) < 3) {
        state.flags.hp = (state.flags.hp || 3) + 1;
        startDialog([{ speaker: 'narrator', text: 'Hot, bitter, bottomless. The coffee tastes like a truck stop miracle and — huh. You feel measurably more alive. (+1 health)' }]);
      } else {
        startDialog([{ speaker: 'narrator', text: ['Hot, bitter, bottomless. The way nature intended.', 'The coffee is somehow both terrible and essential. The Jersey paradox.', 'Refill number whatever. The waitress keeps them coming.'][Math.floor(Math.random() * 3)] }]);
      }
      audio.sfx('success');
    } },
    { x: 330, y: 112, w: 60, h: 28, radius: 40, label: 'Onion rings ($4)', action: () => {
      if (state.money < 4) { toast('$4 for the rings. Best in the state, allegedly. You can’t even afford allegedly.'); return; }
      state.money -= 4;
      audio.sfx('success');
      const lines = state.player.kind === 'george'
        ? ['Golden. Crisp. The ratio of crunch to grease is a MASTERPIECE of the form!', 'You know what I love about onion rings? No pretense. Nobody orders onion rings to impress anybody!']
        : ['Best in the state. I’m not saying it’s true. I’m saying I ain’t arguing.', 'Good rings. Carm could learn something. Don’t tell her I said that.'];
      startDialog([
        { speaker: 'narrator', text: 'A basket of onion rings arrives, golden and structural, like delicious little scaffolding.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: lines[Math.floor(Math.random() * lines.length)] }
      ]);
      state.flags.ringsEaten = (state.flags.ringsEaten || 0) + 1;
    } },
    { x: 460, y: 112, w: 56, h: 28, radius: 40, label: 'Pie case', action: () => {
      startDialog([
        { speaker: 'narrator', text: 'The pie case rotates slowly, eternally. Apple. Cherry. Lemon meringue with structural integrity issues. A coconut cream that has witnessed things. Today’s blue-light special: ' + ['shoo-fly pie, which the waitress describes as “an acquired taste, like vinyl or New Jersey”', 'the turkey pot pie — seasonal, enormous, structurally ambitious', 'the same four pies as always. The rotation is a lie. The pies are forever', 'mince pie — nobody orders it, everybody respects it, it has been in the case since the Nixon administration and it will outlive us all'][Math.floor(state.time / 120) % 4] + '.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'The rotating case is genius. The pies can’t hide! Exposure! Total exposure!' : 'Pie’s been rotating since the Eisenhower administration, probably.' }
      ]);
    } },
    { x: 520, y: 110, w: 40, h: 28, radius: 38, label: 'Rob the register', action: () => robRegister('diner', 'You empty the diner’s register into a napkin dispenser in six seconds flat. The truckers do not look up. Truckers never look up — it’s in the union contract. The waitress sighs the sigh of a woman restocking a pie case for the third time tonight.') },
    { x: 200, y: 92, w: 30, h: 20, radius: 34, label: 'Arm-wrestle the trucker — $10', action: () => {
      if ((state.armCd || 0) > state.time) { startDialog([{ speaker: 'narrator', text: 'The trucker is still finishing his pie. Arm-wrestling etiquette — and make no mistake, there IS etiquette — demands you let a man finish his pie.' }]); return; }
      if ((state.flags.tribute || 0) < 10) { toast('Ten bucks. The trucker does not wrestle for free. Nobody in here does anything for free.'); return; }
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 10);
      state.armCd = state.time + 120;
      initArmWrestle('trucker');
    } },
    { x: 554, y: 260, w: 26, h: 30, radius: 40, label: 'Pinball — $2', action: () => {
      if (state.scene !== 'diner') return;
      initPinball();
    } },
    { x: 585, y: 190, w: 40, h: 30, radius: 42, label: 'Jukebox ($1)', action: () => {
      if (state.money < 1) { toast('A dollar for the jukebox. Even nostalgia has a cover charge.'); return; }
      state.money -= 1;
      audio.sfx('cash');
      if (!state.flags.jukeboxFinale) {
        state.flags.jukeboxFinale = true;
        startDialog([
          { speaker: 'narrator', text: 'The jukebox arm swings. A little piano riff starts up. You know the one. EVERYBODY knows the one.' },
          { speaker: 'narrator', text: 'Don’t stop—' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Why did it cut off?! WHO CUT IT OFF?! I was emotionally invested!' : '...huh. Song just — stops. Weird. Anyway.' },
          { speaker: 'narrator', text: 'In the corner booth, a man in a members-only jacket does not look up. He never looks up. That’s the thing about him.' }
        ]);
      } else {
        startDialog([{ speaker: 'narrator', text: ['The jukebox plays something Sinatra-adjacent. Nobody objects.', 'Deep Purple this time. The truckers approve.', 'The little piano riff again. The whole diner goes quiet for exactly one bar, out of respect.', 'Something with a mandolin. The members-only guy nods along like he’s at the opera. Maybe he is. Nobody here knows what the opera sounds like.'][Math.floor(Math.random() * 3)] }]);
      }
    } },
    { x: 100, y: 330, w: 40, h: 34, radius: 42, label: 'The guy in the members-only jacket', action: () => {
      const lines = [
        'He stares at the bathroom door like it owes him money. You decide not to ask.',
        'He stirs his coffee counterclockwise. Always counterclockwise. Nobody knows why. Nobody asks.',
        'For a second you think he’s looking at you. He isn’t. He’s never looking at anybody. That’s worse.',
        'He orders the same thing every night. Nobody remembers what it is. Including, possibly, him.'
      ];
      startDialog([{ speaker: 'narrator', text: lines[Math.floor(Math.random() * lines.length)] }]);
      if (!state.flags.membersOnlyMet) {
        state.flags.membersOnlyMet = true;
        setTimeout(() => {}, 0);
      }
    } },
    { x: 270, y: 240, w: 70, h: 40, radius: 44, label: 'Slide into a booth', action: () => {
      if ((state.boothCd || 0) > state.time) { toast('You just got up. Even sitting has a cooldown.'); return; }
      state.boothCd = state.time + 60;
      const hadHeat = (state.flags.heat || 0) > 0;
      if (hadHeat) state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
      audio.sfx('success');
      startDialog([
        { speaker: 'narrator', text: 'You slide into the booth. Vinyl squeaks. Somewhere a trucker is explaining the government to nobody.' + (hadHeat ? ' Twenty minutes of coffee later, the heat on you fades a little. Nobody looks for anybody in a diner. It’s a law of physics.' : '') },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A booth! See, a booth is a little apartment you rent by the hour. With pie access!' : 'Every important conversation I ever had happened in a booth. There’s a reason for that.' },
        { speaker: 'narrator', text: 'From the counter, a trucker is saying — ' + [
          '“— buried out in the Pines, I’m telling you. Things out there ain’t been found since the war. Any war.”',
          '“— Gabagool Park. Middle of suburbia. Who hides something in a PARK? Somebody who knows nobody looks in parks, that’s who.”',
          '“— twelve of them, scattered across the whole state. You ask me, it’s a scavenger hunt for guys who ain’t afraid of paperwork.”',
          '“— the radio station out of Secaucus. The POLICE band. Illegal as sin and twice as informative.”',
          '“— a cabin, deep past the clearing. Smoke coming out the chimney in August. Nobody asks. You don’t ask in the Pines.”'
        ][Math.floor(Math.random() * 5)] }
      ]);
    } },
    { x: 380, y: 120, w: 40, h: 26, radius: 40, label: 'The waitress', action: () => {
      const lines = [
        '"More coffee, hon?" She’s already pouring. It was never a question.',
        '"You look tired, hon." She says it to everyone. She’s never once been wrong.',
        '"The rings are fresh." The rings are always fresh. The rings have always been fresh. It’s a closed system.',
        '"Sit anywhere you like, hon." The diner is half empty. Somehow this is still essential information.'
      ];
      startDialog([{ speaker: 'narrator', text: lines[Math.floor(Math.random() * lines.length)] }]);
    } }
  ];
}

function drawCabin() {
  if (drawSceneArt(sceneArt.cabin, 640, 416)) {
    ctx.save();
    ctx.globalAlpha = .14 + Math.sin(state.time * 9) * .05;
    ctx.fillStyle = '#e8a54a';
    ctx.beginPath();
    ctx.arc(80 - state.camera.x, 130 - state.camera.y, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const cfl = Math.sin(state.time * 9) * 4;
    px(ctx, 66 - state.camera.x, 66 - cfl - state.camera.y, 12, 18 + cfl, '#e8722a');
    px(ctx, 78 - state.camera.x, 60 - cfl - state.camera.y, 10, 24 + cfl, '#ffd23e');
    return;
  }
  px(ctx, 0, 0, 640, 416, '#2a2018');
  // plank floor
  for (let fy = 0; fy < 416; fy += 16) px(ctx, 0, fy, 640, 1, '#241b13');
  // stone fireplace, lit
  px(ctx, 20, 20, 120, 80, '#4a4440');
  px(ctx, 50, 46, 60, 44, '#1a1512');
  const fl = Math.sin(state.time * 9) * 4;
  px(ctx, 66, 66 - fl, 12, 18 + fl, '#e8722a');
  px(ctx, 78, 60 - fl, 10, 24 + fl, '#ffd23e');
  ctx.save();
  ctx.globalAlpha = .18 + Math.sin(state.time * 9) * .05;
  ctx.fillStyle = '#e8a54a';
  ctx.beginPath();
  ctx.arc(80, 130, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // mounted bass + deer head
  px(ctx, 300, 30, 46, 14, '#4a6a8a');
  px(ctx, 344, 34, 8, 8, '#3a5a78');
  px(ctx, 400, 26, 26, 30, '#6a543a');
  px(ctx, 394, 20, 4, 10, '#8a7a5a');
  px(ctx, 428, 20, 4, 10, '#8a7a5a');
  // bunk bed
  px(ctx, 480, 20, 140, 90, '#5a4a35');
  px(ctx, 490, 30, 120, 30, '#7a6a9a');
  px(ctx, 490, 70, 120, 30, '#6a5a8a');
  // checkerboard table
  px(ctx, 60, 240, 100, 60, '#6a543a');
  for (let cxx = 0; cxx < 8; cxx++) for (let cyy = 0; cyy < 4; cyy++) {
    if ((cxx + cyy) % 2 === 0) px(ctx, 76 + cxx * 9, 252 + cyy * 9, 9, 9, '#1a1a1a');
  }
  // canned goods shelf
  px(ctx, 400, 250, 120, 50, '#4a3a28');
  for (let c = 0; c < 6; c++) px(ctx, 410 + c * 18, 262, 10, 22, ['#8a3a2a','#3a6a3a','#8a7a2a'][c % 3]);
  ctx.fillStyle = '#d8c9a8';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BEANS · BEANS · BEANS', 460, 292);
  ctx.textAlign = 'left';
}

function cabinInteractions() {
  return [
    { x: 380, y: 60, w: 60, h: 30, radius: 44, label: 'The window — watch the treeline', action: () => {
      audio.sfx('pickup');
      const russian = Math.random() < .35;
      startDialog(russian ? [
        { speaker: 'narrator', text: 'You watch the treeline through the small frost-edged window. For a moment — just a moment — something moves between the pines. Large. Patient. Wrong-footed in a way that suggests one shoe. Then nothing. You do not look away for a full minute. The pines do not blink either.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'HE’S OUT THERE! You saw it too, don’t say you didn’t! One shoe! ONE SHOE! Nobody limps like that unless a SHOE IS MISSING!' : 'Yeah. He’s still out there. Interior decorator my ass — guy’s a glacier with a grudge. Let him have the pines. The pines are his now.' }
      ] : [
        { speaker: 'narrator', text: 'You watch the treeline. Nothing moves. Snow sifts down through the pines in no hurry whatsoever. Whatever is out there — and something IS out there, the footprints didn’t lie — it has nowhere to be. That’s the thing about the Pines. Neither do you, while you’re in them.' },
        { speaker: 'system', text: 'The fire crackles behind you. For now: warm.' }
      ]);
    } },
    { x: 100, y: 200, w: 40, h: 30, radius: 40, label: 'The rifle — empty, decorative', action: () => {
      audio.sfx('denied');
      startDialog([
        { speaker: 'narrator', text: 'A hunting rifle over the fireplace, bolt open, no ammunition anywhere in the cabin — you checked, everyone checks, the last guy clearly checked too. Above it, a small carved sign: THE ONLY THING WORTH HUNTING IN HERE IS PEACE AND QUIET. Under it, in different handwriting, in pencil: the peace and quiet is ALSO out of season.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Empty! Of course it’s empty! In THIS cabin?! With HIM out there?! I’m sleeping with the canned beans. At least the cans are FULL.' : 'Smart. You leave a loaded rifle in a place like this, eventually it gets used, and not on a deer. Whoever owns this cabin knows exactly what they’re doing. That’s rare.' }
      ]);
    } },
    { x: 320, y: 392, w: 60, h: 22, radius: 44, label: 'Back to the clearing', action: () => {
      startDialog([{ speaker: 'narrator', text: 'You step out of the cabin. The pines are exactly where you left them. The pines are always exactly where you left them. That’s what’s unsettling.' }], () => setScene('pines', 430, 240));
    } },
    { x: 150, y: 120, w: 60, h: 40, radius: 48, label: 'Warm up by the fire', action: () => {
      audio.sfx('pickup');
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - 1);
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George stands close to the fire. Too close. There is a smell of singeing. He does not step back, because stepping back would mean admitting he was too close. The warmth is worth it. The heat of the world, for a moment, lets go. (−1 heat)' }
      ] : [
        { speaker: 'narrator', text: 'Tony holds his hands out to the fire like guys in this family have done in this exact cabin for thirty years. The quiet out here — real quiet, no wires, no eyes — that’s worth more than the heat. Speaking of heat: gone a little. (−1 heat)' }
      ]);
    } },
    { x: 460, y: 290, w: 60, h: 30, radius: 40, label: 'Canned beans — dinner', action: () => {
      if (state.flags.cabinBeans) { toast('The shelf is down to dust and one label-less can nobody will ever be brave enough to open.'); return; }
      state.flags.cabinBeans = true;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'You eat beans out of the can, cold, with a spoon somebody left in 1987. On Thanksgiving. There is a version of your life where this is a low point. In this version, honestly, it’s not bad.' }]);
    } },
    { x: 180, y: 300, w: 60, h: 30, radius: 44, label: 'Play checkers against yourself', action: () => {
      audio.sfx('pickup');
      const won = Math.random() < .5;
      startDialog([{ speaker: 'narrator', text: won ? 'You play checkers against yourself and win. You also lose. Somewhere in the Barrens, a balance is maintained. You feel smarter and dumber at the same time.' : 'You play checkers against yourself and lose. To yourself. You demand a rematch. You lose that too. The Barrens does this to people.' }]);
    } },
    { x: 200, y: 340, w: 60, h: 30, radius: 42, label: 'The cabin logbook', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'A water-stained logbook sits by the door. Entries going back thirty years, most of them in handwriting you halfway recognize. “NOV 94 — cold. nobody died.” “NOV 03 — cold. nobody died.” “NOV 16 — cold. Almost died. didn’t.” You add your own entry. It says the same thing. Tradition is tradition.' }]);
    } },
    { x: 550, y: 130, w: 60, h: 40, radius: 40, label: 'Take the top bunk', action: () => {
      state.time += 20;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'You climb into the top bunk and listen to the woods settle. Something out there is walking in a circle. You decide, very consciously, not to think about it. You sleep. Time passes.' }]);
    } }
  ];
}

function drawTaffy() {
  if (drawSceneArt(sceneArt.taffy, 640, 416)) {
    const pull2 = Math.sin(state.time * 2.4) * 6;
    ctx.save();
    ctx.globalAlpha = .35;
    px(ctx, 120 + pull2 - state.camera.x, 66 - state.camera.y, 40, 8, '#f0c9dc');
    ctx.restore();
    const ga2 = state.time * 1.4;
    const gx3 = 320 + Math.cos(ga2) * 130 - state.camera.x;
    const gy3 = 200 + Math.sin(ga2) * 60 - state.camera.y;
    px(ctx, gx3, gy3, 7, 4, '#e8e8e8');
    px(ctx, gx3 + 5, gy3 - 2, 3, 3, '#e8c93e');
    return;
  }
  px(ctx, 0, 0, 640, 416, '#c9b8a0');
  // checkered floor
  for (let fx = 0; fx < 40; fx++) for (let fy = 0; fy < 26; fy++) {
    if ((fx + fy) % 2 === 0) px(ctx, fx * 16, fy * 16, 16, 16, '#b8a78f');
  }
  // taffy pulling machine — the hypnotist
  px(ctx, 30, 30, 200, 90, '#7a6a8a');
  px(ctx, 42, 42, 176, 66, '#8a7a9a');
  const pull = Math.sin(state.time * 2.4) * 30;
  px(ctx, 80 + pull, 60, 60, 10, '#e8c9d8');
  px(ctx, 60, 52, 10, 26, '#5a4a6a');
  px(ctx, 190, 52, 10, 26, '#5a4a6a');
  // display case rows of pastel taffy
  px(ctx, 420, 30, 190, 90, '#8a6a4a');
  for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 8; tx++) {
    px(ctx, 434 + tx * 21, 42 + ty * 24, 16, 10, ['#e8a0b8','#a0d8e8','#e8d8a0','#b8e8a0'][ (tx + ty) % 4 ]);
  }
  // counter
  px(ctx, 240, 300, 180, 70, '#6a5a48');
  px(ctx, 250, 310, 160, 20, '#8a7a68');
  // the seagull that got inside — it circles, forever
  const ga = state.time * 1.4;
  const gx = 320 + Math.cos(ga) * 130 - state.camera.x;
  const gy = 200 + Math.sin(ga) * 60 - state.camera.y;
  px(ctx, gx, gy, 7, 4, '#e8e8e8');
  px(ctx, gx + 5, gy - 2, 3, 3, '#e8c93e');
  ctx.fillStyle = '#6a4a3a';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SALTY’S — EST. 1921', 320, 40);
  ctx.textAlign = 'left';
}

function taffyInteractions() {
  return [
    { x: 450, y: 130, w: 40, h: 28, radius: 40, label: 'Rob the register', action: () => robRegister('taffy', 'You empty the taffy shop till. The register drawer is sticky — everything here is sticky — and for one terrible moment you and the drawer are one. The take includes $6 in pennies and a button. You keep the button.') },
    { x: 320, y: 392, w: 60, h: 22, radius: 44, label: 'Back to the boardwalk', action: () => {
      setScene('shore', 400, 250);
    } },
    { x: 480, y: 300, w: 80, h: 30, radius: 42, label: 'Watch the taffy pull', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The machine pulls. The taffy folds. The machine pulls. You could watch this for hours. You DO watch this for hours. Somewhere, your afternoon evaporates.' },
        { speaker: 'george', text: 'It’s HYPNOTIC. The pulling! The folding! Why is that not a job — professional taffy watcher. I would be GREAT at it.' }
      ] : [
        { speaker: 'narrator', text: 'The machine pulls the taffy in long gleaming loops. Same motion, forever. Hypnotic. Like therapy, but it smells like molasses.' },
        { speaker: 'tony', text: 'Guy who invented this machine — genius. Everybody else in this operation is just feedin’ it sugar.' }
      ]);
    } },
    { x: 150, y: 150, w: 60, h: 24, radius: 40, label: 'Buy the fudge — $5', action: () => {
      if (state.money < 5) { toast('The fudge is five dollars. Worth every cent, but five.'); return; }
      state.money -= 5;
      if ((state.flags.hp || 3) < 3) { state.flags.hp = (state.flags.hp || 3) + 1; spawnEffect(state.player.x + 8, state.player.y - 20, '+1 HEALTH', '#9be59b'); }
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'One slice of boardwalk fudge, cut with a wire. Dense as a cinderblock, sweet as a confession. The woman behind the counter says they make it in the back, the way her grandmother did, except her grandmother used a bigger knife.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'This fudge has STRUCTURE. Integrity. You could build a house on this fudge!' : 'That’s real fudge. Not the mall stuff. Tell nobody I ate it before noon.' }
      ]);
    } },
    { x: 320, y: 290, w: 60, h: 20, radius: 42, label: 'Buy a box of taffy — $6', action: () => {
      if (state.money < 6) { toast('Six dollars. It’s taffy, not a casino.'); return; }
      state.money -= 6;
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George buys the assorted box and immediately begins ranking the flavors out loud to nobody. Vanilla, undeserving of its reputation. Molasses, a dark horse. The green one — whatever it is — a miracle.' },
        { speaker: 'george', text: 'You know what I’m doing? I’m rationing. One piece an hour. …I’ve had eleven.' }
      ] : [
        { speaker: 'narrator', text: 'A box of saltwater taffy for the road. Tony eats three pieces before the door closes behind him. The dentist is a problem for a man with fewer enemies.' }
      ]);
    } },
    { x: 130, y: 140, w: 70, h: 30, radius: 44, label: 'Watch the pulling machine', action: () => {
      audio.sfx('pickup');
      state.time += 5;
      startDialog([{ speaker: 'narrator', text: 'The machine pulls and folds, pulls and folds. It does not hurry. It does not stop. It has been doing this since 1921 and it will be doing it long after all of us. Five minutes pass like they’re nothing. You understand the machine a little too well now.' }]);
    } },
    { x: 510, y: 140, w: 70, h: 30, radius: 44, label: 'Free fudge sample', action: () => {
      if (state.flags.fudgeSample) { toast('One sample per customer. The woman behind the case has a memory like a courthouse.'); return; }
      state.flags.fudgeSample = true;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'A free fudge sample, cut with the precision of a woman who has cut ten thousand of them and resents maybe six thousand. It’s incredible. You briefly understand why people retire here.' }]);
    } },
    { x: 120, y: 200, w: 60, h: 30, radius: 42, label: 'The storm shelf', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'A high shelf holds a single dusty box labeled 1962 — the taffy that survived the great storm, when the ocean came through the front door and left through the back. The box is not for sale. It has never been for sale. It is the shop’s horcrux.' }]);
    } },
    { x: 320, y: 160, w: 50, h: 30, radius: 40, label: 'Shoo the seagull', action: () => {
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .2);
      startDialog([{ speaker: 'narrator', text: 'You shoo the seagull. The seagull relocates exactly four feet to the left and screams at you with its whole body. The other customers are now watching YOU like you’re the problem. (+0.2 heat, somehow)' }]);
    } }
  ];
}

function drawSlice() {
  if (drawSceneArt(sceneArt.slice, 640, 416)) {
    ctx.save();
    ctx.globalAlpha = .12 + Math.sin(state.time * 8) * .04;
    ctx.fillStyle = '#e8722a';
    ctx.beginPath();
    ctx.arc(510 - state.camera.x, 70 - state.camera.y, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const pgx = 300 + Math.sin(state.time * .7) * 60;
    drawPerson(ctx, pgx - state.camera.x, 100 - state.camera.y, 'bobby', 'down', state.frame, { pose: 'walk' });
    return;
  }
  px(ctx, 0, 0, 640, 416, '#3a2a22');
  // tile floor
  for (let fx = 0; fx < 40; fx++) for (let fy = 0; fy < 26; fy++) {
    if ((fx + fy) % 2 === 0) px(ctx, fx * 16, fy * 16, 16, 16, '#44332a');
  }
  // counter + ovens along the north wall
  px(ctx, 20, 20, 600, 110, '#6a5544');
  px(ctx, 30, 30, 580, 40, '#8a7560');
  // pizza ovens with fire glow
  px(ctx, 420, 34, 180, 60, '#4a3a30');
  const fl = Math.sin(state.time * 8) * 3;
  px(ctx, 450, 52 - fl, 40, 26 + fl, '#e8722a');
  px(ctx, 500, 56 - fl, 34, 22 + fl, '#ffd23e');
  // pies on the counter
  for (let pi2 = 0; pi2 < 4; pi2++) {
    const pxp = 60 + pi2 * 80;
    px(ctx, pxp, 42, 34, 34, '#d8a858');
    px(ctx, pxp + 6, 48, 22, 22, '#c94030');
    for (let pep = 0; pep < 4; pep++) px(ctx, pxp + 8 + (pep * 7) % 18, 52 + (pep * 11) % 14, 4, 4, '#8a2015');
  }
  // red vinyl booths east
  px(ctx, 480, 220, 130, 90, '#8a2a2a');
  px(ctx, 490, 230, 110, 30, '#a83a3a');
  // the folding chairs + napkin dispenser vibe
  px(ctx, 200, 240, 40, 30, '#5a6a7a');
  // pizza guy behind the counter, sliding pies
  const gx = 300 + Math.sin(state.time * .7) * 60;
  drawPerson(ctx, gx - state.camera.x, 100 - state.camera.y, 'bobby', 'down', state.frame, { pose: 'walk' });
  ctx.fillStyle = '#e8c93e';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FAMOUS ORIGINAL RAY’S — NOT AFFILIATED WITH ANY OTHER RAY', 320, 20);
  ctx.textAlign = 'left';
}

function sliceInteractions() {
  return [
    { x: 320, y: 392, w: 60, h: 22, radius: 44, label: 'Back to the street', action: leaveOutside },
    { x: 540, y: 130, w: 40, h: 28, radius: 40, label: 'Rob the register', action: () => robRegister('slice', 'You hit Ray’s register during the oven rush. Nobody stops you — the oven guy is the only employee who cares, and the oven guy is FLAMES. Behind you, a heated argument about which Ray this even is provides perfect cover.') },
    { x: 200, y: 130, w: 70, h: 30, radius: 44, label: 'A slice — $3', action: () => {
      if (state.money < 3) { toast('Three bucks. It’s the cheapest dignity in Manhattan.'); return; }
      state.money -= 3;
      audio.sfx('pickup');
      state.time += 2;
      if ((state.flags.hp || 3) < 3) { state.flags.hp = (state.flags.hp || 3) + 1; spawnEffect(state.player.x + 8, state.player.y - 20, '+1 HEALTH', '#9be59b'); }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George folds the slice lengthwise — the correct way, the only way — and eats it in four bites while walking nowhere in particular. Grease runs down his wrist. He has never been more of a New Yorker and he knows it.' },
        { speaker: 'george', text: 'This is the food. This is THE food. Everything else is a rumor.' }
      ] : [
        { speaker: 'narrator', text: 'Tony eats the slice standing at the counter like the counter owes him money. It’s not Jersey pizza — he’d never say it is — but at 1am in Manhattan, it does the job and then some.' }
      ]);
    } },
    { x: 300, y: 130, w: 70, h: 30, radius: 44, label: 'The counter guy — delivery work', action: () => {
      if (state.mission) { toast('Finish your current job first. The pies can wait. The pies are PATIENT.'); return; }
      if (!state.flags.freeRoam) { startDialog([{ speaker: 'narrator', text: 'The counter guy jerks a thumb at the delivery rack. “You drive? You walk fast? Pies need legs. Come back when you’re your own boss.”' }]); return; }
      const drops = [
        { scene: 'hub', x: 180, y: 260, radius: 60, name: 'the blue house in the neighborhood — ring once, the dog bites' },
        { scene: 'hub', x: 470, y: 300, radius: 60, name: 'the corner house in the neighborhood — exact change, ALWAYS exact change' },
        { scene: 'queens', x: 250, y: 260, radius: 60, name: 'Queens — the house with the plastic on the couch. you know the one' },
        { scene: 'queens', x: 420, y: 180, radius: 60, name: 'Queens — knock loud, the tv is ALWAYS loud' },
        { scene: 'nyc', x: 300, y: 300, radius: 60, name: 'the walkup — fourth floor, no elevator, no excuses' }
      ];
      const drop = drops[Math.floor(Math.random() * drops.length)];
      const rolledPay = 18 + Math.floor(Math.random() * 20);
      startMission('sliceJob');
      state.mission.payout = rolledPay;
      state.mission.timeLimit = 150;
      state.mission.deadline = state.time + 150;
      state.mission.steps = [
        { scene: drop.scene, x: drop.x, y: drop.y, radius: drop.radius, objective: `Deliver the pie — ${drop.name.split('—')[0].trim()} — before it goes cold`, label: 'the customer' },
        { scene: 'slice', x: 320, y: 200, radius: 60, objective: 'Report back to Ray’s', label: 'Ray’s' }
      ];
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: `The counter guy slides a pie across the marble. “${drop.name}. $${rolledPay} plus whatever they tip, which is nothing, it’s never anything. You got two and a half minutes before it’s just bread and regret.” He is already making the next pie. He was never not making the next pie.` },
        { speaker: 'system', text: 'Mission accepted: THE SLICE RUN. 150 seconds before the pie goes cold. Repeatable work — the oven never stops.' }
      ]);
    } },
    { x: 490, y: 130, w: 80, h: 30, radius: 44, label: 'Watch the oven', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'The pie goes in pale and comes out blistered in ninety seconds. The oven guy does it with a long peel and zero wasted motion, like a card sharp. You watch three rotations. It never stops being a little bit magic.' }]);
    } },
    { x: 90, y: 200, w: 60, h: 30, radius: 42, label: 'The wall of fame', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'Signed photos line the wall — celebrities, athletes, three different mayors, and one photo of a man nobody can identify who is simply labeled CHAMPION. Legend says he ate nine slices. Legend also says he is still here, in a way. He’s in the booth. He never left.' }]);
    } },
    { x: 560, y: 130, w: 60, h: 30, radius: 42, label: 'Ask what makes it original', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George asks the counter guy what makes this Ray’s the ORIGINAL Ray’s. The counter guy does not look up. “Famous Original,” he says, with the energy of a man who has answered this exact question four hundred thousand times. George presses. This is a mistake. The answer is a twenty-minute lecture that somehow contains no information at all.' },
        { speaker: 'george', text: 'But WHO IS RAY?! …What do you mean “Ray is a concept”?!' }
      ] : [
        { speaker: 'narrator', text: 'Tony asks what makes it the original. The counter guy shrugs the shrug of a thousand identical shifts. “Famous Original Ray’s. It’s famous. It’s original. You want the slice or you want a philosophy class?” Tony respects the economy of it, and takes the slice.' }
      ]);
    } },
    { x: 540, y: 280, w: 60, h: 30, radius: 42, label: 'Take the booth', action: () => {
      state.time += 4;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'You slide into the red vinyl booth and do nothing at all for a few minutes. Outside, the city does its impression of a city that never sleeps. In here it’s just you, the heat lamps, and the faint hiss of a pie becoming a legend.' }]);
    } }
  ];
}

function drawCasino() {
  if (drawSceneArt(sceneArt.casino, 640, 416)) {
    ctx.save();
    ctx.globalAlpha = .1 + Math.sin(state.time * 2) * .03;
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(320 - state.camera.x, 40 - state.camera.y, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawPerson(ctx, 210 - state.camera.x, 235 - state.camera.y, 'manA', 'down', 0, {});
    drawPerson(ctx, 470 - state.camera.x, 235 - state.camera.y, 'womanB', 'down', 0, {});
    const gcx = 180 + Math.sin(state.time * .4) * 20;
    drawPerson(ctx, gcx - state.camera.x, 330 - state.camera.y, 'bobby', 'up', 0, {});
    return;
  }
  px(ctx, 0, 0, 640, 416, '#2a1a2e');
  // gaudy carpet
  for (let fx = 0; fx < 40; fx++) for (let fy = 0; fy < 26; fy++) {
    if ((fx * 3 + fy * 7) % 5 === 0) px(ctx, fx * 16, fy * 16, 16, 16, '#33203a');
  }
  // chandelier glow
  ctx.save();
  ctx.globalAlpha = .1 + Math.sin(state.time * 2) * .03;
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(320, 40, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // slots row west
  for (let s = 0; s < 4; s++) {
    const sx = 30 + s * 58;
    px(ctx, sx, 20, 48, 80, '#6a2a3a');
    px(ctx, sx + 8, 30, 32, 26, '#1a1a2a');
    const spin = Math.floor(state.time * 3 + s) % 3;
    px(ctx, sx + 10, 36 + spin * 3, 8, 8, '#ffd23e');
    px(ctx, sx + 20, 36, 8, 8, '#e83a5a');
    px(ctx, sx + 30, 36 + ((spin + 1) % 3) * 3, 8, 8, '#3ae85a');
    px(ctx, sx + 36, 64, 6, 20, '#c9a86a');
  }
  // cashier cage east
  px(ctx, 380, 20, 240, 80, '#4a3a28');
  for (let bar = 0; bar < 12; bar++) px(ctx, 392 + bar * 18, 30, 3, 60, '#c9a86a');
  // blackjack tables — green felt
  px(ctx, 140, 240, 140, 80, '#2a6a3a');
  px(ctx, 150, 250, 120, 60, '#35884a');
  px(ctx, 400, 240, 140, 80, '#2a6a3a');
  px(ctx, 410, 250, 120, 60, '#35884a');
  // dealers + a lonely gambler
  drawPerson(ctx, 210 - state.camera.x, 235 - state.camera.y, 'manA', 'down', 0, {});
  drawPerson(ctx, 470 - state.camera.x, 235 - state.camera.y, 'womanB', 'down', 0, {});
  const gx = 180 + Math.sin(state.time * .4) * 20;
  drawPerson(ctx, gx - state.camera.x, 330 - state.camera.y, 'bobby', 'up', 0, {});
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ THE DUNES — WHERE THE BUFFET NEVER CLOSES ★', 320, 130);
  ctx.textAlign = 'left';
}

function casinoInteractions() {
  return [
    { x: 320, y: 392, w: 60, h: 22, radius: 44, label: 'Back to the boardwalk', action: leaveOutside },
    { x: 130, y: 130, w: 80, h: 30, radius: 46, label: 'The slots — $5 a pull', action: () => initSlots() },
    { x: 210, y: 290, w: 60, h: 40, radius: 44, label: 'Blackjack table', action: () => initBlackjack() },
    { x: 540, y: 118, w: 30, h: 22, radius: 34, label: 'Rob the cashier cage', action: () => {
      const key = 'registerCd_casino';
      if ((state[key] || 0) > state.time) { toast('The cage is already light. Security remembers your face — come back in a few minutes.'); return; }
      state[key] = state.time + 150;
      const take = 120 + Math.floor(Math.random() * 80);
      state.money += take;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 3);
      if (state.mission && state.mission.id === 'bigScore' && missionStep() && missionStep().scene === 'casino') setTimeout(() => { if (state.mission && state.mission.id === 'bigScore' && missionStep() && missionStep().scene === 'casino') advanceMission(); }, 60);
      audio.sfx('cash');
      audio.sfx('denied');
      spawnEffect(state.player.x + 8, state.player.y - 12, `+$${take} · +3 heat`, '#ff9a7a');
      startDialog([
        { speaker: 'narrator', text: `You slide the note. The cashier reads it twice, looks at the camera, looks at you, and slides $${take} in non-sequential bills under the glass with the weary professionalism of a man who is paid eleven dollars an hour to NOT be a hero.` },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A NOTE! I can’t believe the note WORKED! It was a thank-you card! I robbed them with a THANK-YOU CARD!' : 'Non-sequentials. Professional. I almost respect this place. Almost. That carpet is still a crime worse than mine.' },
        { speaker: 'system', text: 'The eye in the sky has your face now. +3 heat. The cage restocks in a couple of minutes.' }
      ]);
    } },
    { x: 470, y: 290, w: 60, h: 40, radius: 44, label: 'Blackjack table', action: () => initBlackjack() },
    { x: 320, y: 210, w: 70, h: 30, radius: 44, label: 'Roulette — red or black', action: () => initRoulette() },
    { x: 60, y: 380, w: 80, h: 26, radius: 42, label: 'ATM of doom', action: () => {
      startDialog([{ speaker: 'narrator', text: 'The casino ATM charges a $6 fee and dispenses twenties with the reluctance of a machine that knows exactly what you’re about to do with them. A small printed receipt says GOOD LUCK. It is lying. It has never meant it.' }]);
    } },
    { x: 570, y: 380, w: 60, h: 26, radius: 42, label: 'Cocktail waitress', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The cocktail waitress asks George if he wants a drink. George asks if it’s free. It is, if he’s playing. George picks up a nickel slot token from the carpet and presents it as evidence of play. She walks away. The system, once again, is undefeated.' },
        { speaker: 'george', text: 'I AM playing! I’m playing the LONG game! The longest game there is — watching other people lose!' }
      ] : [
        { speaker: 'narrator', text: 'The waitress brings Tony a drink he didn’t order, calls him sir like she means it, and glides away. On the house. Everything for certain people is always, somehow, on the house — and that is its own kind of debt.' }
      ]);
    } },
    { x: 500, y: 130, w: 70, h: 30, radius: 44, label: 'Cashier cage — count your sins', action: () => {
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'The cashier counts your chips with the neutral face of a person who has watched ten thousand men have the best and worst nights of their lives in the same chair. Behind her, the vault hums. Everything here is somebody’s fault.' }]);
    } },
    { x: 320, y: 170, w: 80, h: 30, radius: 44, label: 'The buffet — $12, all you can regret', action: () => {
      if (state.money < 12) { toast('Twelve dollars. The shrimp alone is worth it, allegedly.'); return; }
      state.money -= 12;
      audio.sfx('pickup');
      state.time += 6;
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George approaches the buffet with a strategy document he wrote on a napkin in the car. Proteins first — maximum value density. The shrimp. THE SHRIMP. A man in a visor tries to share the ladle. It does not go well for the man in the visor.' },
        { speaker: 'george', text: 'Twelve dollars! I’m eating forty dollars of shrimp MINIMUM. This is arithmetic, not gluttony!' }
      ] : [
        { speaker: 'narrator', text: 'Tony does the buffet the way he does everything: like he owns it, which — through three shell companies and a favor — he technically does. The carving station guy knows him. The carving station guy is smart enough not to say so.' }
      ]);
    } }
  ];
}

function drawQueens() {
  if (drawSceneArt(sceneArt.queens, 768, 416)) {
    const qx = 200 + Math.sin(state.time * .25) * 140;
    drawPerson(ctx, qx - state.camera.x, 290 - state.camera.y, 'womanC', Math.sin(state.time * .25) > 0 ? 'right' : 'left', state.frame, { pose: 'walk' });
    const qx2 = 600 - Math.sin(state.time * .31) * 120;
    drawPerson(ctx, qx2 - state.camera.x, 270 - state.camera.y, 'manA', Math.sin(state.time * .31) > 0 ? 'left' : 'right', state.frame + 2, { pose: 'walk' });
    drawHighwaySign(620, 250, ['SUBWAY →', 'MANHATTAN']);
    // Frank is home. Frank is always home. Frank is always audible.
    if (Math.sin(state.time * .5) > .92) {
      const franks = ['SERENITY NOW!', 'MY MOVING TRUCK!', 'THE GARAGE, ESTELLE!', 'INSPECTOR? WHAT INSPECTOR!'];
      outlineText(ctx, franks[Math.floor(state.time / 9) % franks.length], 120 - state.camera.x, 58 - state.camera.y, '#ffd23e', 6, 'left');
    }
    // drifting autumn leaves
    for (let lf = 0; lf < 5; lf++) {
      const lx = ((lf * 173 + state.time * 22) % 790) - state.camera.x;
      const ly = 200 + Math.sin(state.time * 1.3 + lf * 2) * 60 + lf * 30 - state.camera.y;
      px(ctx, lx, ly, 3, 3, ['#e8722a', '#d4a017', '#c94030'][lf % 3]);
    }
    return;
  }
  px(ctx, 0, 0, 768, 416, '#3d3830');
  // row houses — brick, aluminum siding, ambition
  const houses = [[40, '#7a4a3a'], [300, '#6a5a4a'], [560, '#5a6a7a']];
  for (const [hx, hc] of houses) {
    px(ctx, hx, 30, 180, 110, hc);
    px(ctx, hx + 10, 40, 160, 20, '#4a3a30');
    px(ctx, hx + 70, 90, 40, 50, '#3a2a20');
    for (let wx = 0; wx < 3; wx++) {
      px(ctx, hx + 16 + wx * 56, 66, 24, 18, '#c9b86a');
      px(ctx, hx + 16 + wx * 56, 66, 24, 3, '#e8d89a');
    }
  }
  // the Costanza house gets a lawn ornament
  px(ctx, 130, 150, 10, 14, '#e8e8e8');
  px(ctx, 132, 146, 6, 6, '#d8d8d8');
  // the street — double parked as god intended
  px(ctx, 0, 180, 768, 70, '#333');
  for (let c = 0; c < 5; c++) {
    px(ctx, 90 + c * 140, 196, 44, 18, ['#7a2a2a','#2a4a7a','#b8a888','#4a4a4a','#6a5a2a'][c]);
    if (c % 2 === 0) px(ctx, 100 + c * 140, 222, 44, 18, ['#2848a0','#5a5a5a','#8a3a5a'][c % 3]);
  }
  // power lines, always
  for (let pl = 0; pl < 4; pl++) px(ctx, 0, 20 + pl * 6, 768, 1, '#1a1a1a');
  // pedestrians hauling dry cleaning and grievances
  const gx = 200 + Math.sin(state.time * .25) * 140;
  drawPerson(ctx, gx - state.camera.x, 290 - state.camera.y, 'womanC', Math.sin(state.time * .25) > 0 ? 'right' : 'left', state.frame, { pose: 'walk' });
  const gx2 = 600 - Math.sin(state.time * .31) * 120;
  drawPerson(ctx, gx2 - state.camera.x, 270 - state.camera.y, 'manA', Math.sin(state.time * .31) > 0 ? 'left' : 'right', state.frame + 2, { pose: 'walk' });
  drawHighwaySign(620, 250, ['SUBWAY →', 'MANHATTAN']);
  ctx.fillStyle = '#d8c9a8';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('QUEENS — where the Costanzas hold court', 384, 24);
  ctx.textAlign = 'left';
}

function queensInteractions() {
  return [
    { x: 640, y: 120, w: 50, h: 40, radius: 44, label: 'The neighbor’s dog', action: () => {
      audio.sfx('denied');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The dog — a beagle with the lungs of a much larger animal — has barked at this fence since 1987. George barks back, once. The dog pauses, reassesses the relationship, and redoubles. Somewhere inside, a neighbor mutters that the dog never barks. The dog barks.' },
        { speaker: 'george', text: 'He started it! Ask anyone! HE. STARTED. IT.' }
      ] : [
        { speaker: 'narrator', text: 'The dog barks at you through the fence — then recognizes you and stops, tail going. You’ve been leaving cold cuts on the fence post for weeks. This dog knows things about you. This dog is the most loyal being in Queens. The dog says nothing.' },
        { speaker: 'tony', text: 'Good boy. Keep it that way.' }
      ]);
    } },
    { x: 4, y: 210, w: 40, h: 90, radius: 46, label: '← Subway: Manhattan', action: () => {
      startDialog([{ speaker: 'narrator', text: 'The 7 train rattles toward Manhattan. A man is eating soup out of a thermos in direct violation of several unwritten rules. Nobody stops him. This is Queens’ gift to the world: the absence of rules nobody wrote down.' }], () => startTransit('nyc', 60, 250, 'THE 7 TRAIN · WESTBOUND'));
    } },
    { x: 130, y: 150, w: 60, h: 40, radius: 46, label: 'The Costanza house', action: () => {
      travelHub('costanza');
    } },
    { x: 390, y: 150, w: 60, h: 40, radius: 44, label: 'The sauna', action: () => {
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
      state.time += 3;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'Ten minutes in the sauna next to a man who speaks no English and sweats like it’s a competitive sport. You emerge lighter, dumber, and slightly less wanted. (−0.5 heat)' }]);
    } },
    { x: 640, y: 150, w: 60, h: 40, radius: 44, label: 'The shampoo factory', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The shampoo factory where George once almost had a job, or did have a job, or was fired from a job — the records are unclear because George may have set fire to the records. The smell of ten thousand gallons of industrial conditioner hangs over the block like a haunted meadow.' },
        { speaker: 'george', text: 'I could have been somebody here. I WAS somebody here. Briefly. Then the incident. …I don’t want to talk about the incident.' }
      ] : [
        { speaker: 'narrator', text: 'A shampoo factory. Tony regards it with the deep suspicion of a man who has never once trusted a business that is exactly what it appears to be.' }
      ]);
    } },
    { x: 480, y: 210, w: 30, h: 40, radius: 42, label: 'Puddy', action: () => {
      startDialog([
        { speaker: 'narrator', text: 'David Puddy leans against a car that may or may not be his, staring straight ahead with the confidence of a man who has never once been unsure of anything.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Puddy! Hey! So — you and Elaine, is that — are you — what IS that?' : 'You look like a man who knows a guy. I know guys. You a guy who knows guys?' },
        { speaker: 'narrator', text: 'Puddy regards you for a long moment. “Yeah, that’s right.” It answers nothing. It answers everything. You feel, somehow, completely briefed.' }
      ]);
    } },
    { x: 560, y: 210, w: 30, h: 40, radius: 42, label: 'Uncle Leo', action: () => {
      if (!state.mission && state.flags.freeRoam && !state.flags.leoScarfDone) {
        startMission('leoScarf');
        startDialog([
          { speaker: 'narrator', text: '“GEORG—” Leo stops. Corrects himself. “You! Person! A favor! I gave Jerry a scarf. BEAUTIFUL scarf. I need it back. For SAFEKEEPING. Not for re-gifting. Why would you think re-gifting? Who says re-gifting?!”' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'You want me to STEAL a gift?! …How much?' : 'Fifteen bucks to lift a scarf from a comedian. I’ve done worse for less. Don’t tell anybody I said that.' },
          { speaker: 'system', text: 'Mission accepted: THE RE-GIFT. $15. The eyebrows never lie.' }
        ]);
        return;
      }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Uncle Leo spots you from forty yards. There is no escape. There has never been an escape. “GEORGIE! HELLO!” The eyebrows are doing most of the waving.' },
        { speaker: 'george', text: 'Uncle Leo! What — how — I have to go, I have a thing! A big thing! Vandelay business!' },
        { speaker: 'narrator', text: 'Leo grabs your arm with the grip strength of a man who has held grudges since 1962. “Your mother — rest her soul — wait, she’s alive. Tell her I say hello. And Jerry! Tell Jerry his cousin is a very big deal now! VERY big!” He presses $2 into your hand. It is somehow damp. +$2' },
      ] : [
        { speaker: 'narrator', text: 'An elderly man with prominent eyebrows waves at you like you owe him money. “HELLO! You look like a man of IMPORTANCE! My nephew — Jerry Seinfeld — you know him? BIG star! VERY big!”' },
        { speaker: 'tony', text: 'Yeah, I know Jerry. Tell him… actually, tell him nothing. You never saw me. Here’s twenty for the trouble — buy yourself a spray tan or whatever you people do.' },
        { speaker: 'narrator', text: 'Leo takes the $20 with both hands and the expression of a man who has never once questioned money. “You’re a good boy! I can tell! The eyebrows never lie!” Somehow YOU are down $20. You’re not sure how that happened. He’s GOOD. −$20' }
      ]);
      if (!state.mission && Math.random() < .35) { if (state.player.kind === 'george') state.money += 2; else state.money = Math.max(0, state.money - 20); }
    } },
    { x: 330, y: 245, w: 50, h: 26, radius: 44, inCarOk: true, label: 'The contested parking space', action: () => {
      if (!state.player.inCar) {
        startDialog([
          { speaker: 'narrator', text: 'A single open parking space, defended by a man standing in it. LEGALLY, he cannot do this. PHYSICALLY, he is doing this. He has been doing it since October.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'That’s MY space! I mean — it COULD be my space! If I had a car! Which I’m borrowing! PERMANENTLY!' : 'Guy thinks he’s a fire hydrant. Adorable.' }
        ]);
        return;
      }
      if (Math.random() < .5) {
        state.money += 5;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'You back in. A Buick noses in behind you — the classic Queens standoff. Ten minutes of honking later, the Buick capitulates. A passerby hands you $5. “I had money on you. I ALWAYS bet the guy in reverse.”' }]);
      } else {
        state.flags.heat = Math.min(5, (state.flags.heat || 0) + .3);
        audio.sfx('denied');
        startDialog([
          { speaker: 'narrator', text: 'The standoff goes long. A traffic enforcement officer arrives to mediate, tickets BOTH cars out of principle, and writes your plate in a small book. (+heat)' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I was BACKING IN! BACKING IN IS THE LAW OF CIVILIZATION!' : 'I’ll give him a space. In the HOSPITAL. …Nah. He’s not worth the paperwork.' }
        ]);
      }
    } },
    { x: 250, y: 245, w: 60, h: 30, radius: 48, label: 'Borrow a street car', hidden: () => !!state.player.inCar, action: () => {
      stealRandomCar();
    } },
    { x: 80, y: 150, w: 60, h: 40, radius: 42, label: 'Sit on the stoop', action: () => {
      state.time += 3;
      audio.sfx('pickup');
      startDialog([{ speaker: 'narrator', text: 'You sit on somebody’s stoop in Queens. A woman across the street watches you from behind a curtain with the focus of a surveillance professional. In Queens, the curtain is always watching. You wave. The curtain closes. You have been logged.' }]);
    } },
    { x: 480, y: 290, w: 60, h: 30, radius: 42, label: 'Honking standoff', action: () => {
      audio.sfx('honk');
      startDialog([{ speaker: 'narrator', text: 'Two drivers are locked in a honking standoff over a parking spot neither of them fits into. It has been going eleven minutes. A small crowd has formed. One elderly man is keeping score. You watch two full rounds. It ends in a draw, which in Queens means both men believe they won forever.' }]);
    } },
    { x: 300, y: 290, w: 60, h: 30, radius: 42, label: 'Double-parked Buick', action: () => {
      startDialog([{ speaker: 'narrator', text: 'A Buick double-parked so perfectly perpendicular to reality it can only belong to a man with nothing left to lose. There is a bumper sticker. It says SERENITY NOW. The irony is load-bearing.' }]);
    } }
  ];
}

function drawAC() {
  if (drawSceneArt(sceneArt.ac, 768, 416)) {
    const flick = Math.sin(state.time * 7) > .6;
    if (flick) px(ctx, 340 - state.camera.x, 60 - state.camera.y, 60, 6, '#ffd76a');
    for (let k = 0; k < 4; k++) {
      const fx = 640 + Math.sin(state.time * 3 + k) * 8 - state.camera.x;
      const fy = 210 + Math.cos(state.time * 4 + k * 2) * 6 - state.camera.y;
      px(ctx, fx, fy, 2, 2, '#bfefff');
    }
    const wx = 200 + Math.sin(state.time * .2) * 130;
    drawPerson(ctx, wx, 250, 'womanA', Math.sin(state.time * .2) > 0 ? 'right' : 'left', state.frame, { pose: 'walk' });
    const wx2 = 500 - Math.sin(state.time * .16) * 110;
    drawPerson(ctx, wx2, 230, 'bobby', Math.sin(state.time * .16) > 0 ? 'left' : 'right', state.frame + 2, { pose: 'walk' });
    return;
  }
  px(ctx, 0, 0, 768, 416, '#1a2030');
}

function acInteractions() {
  return [
    { x: 8, y: 210, w: 24, h: 90, radius: 44, label: '← Drive north', action: () => startTransit('shore', 700, 250, 'GARDEN STATE PARKWAY · NORTH') },
    { x: 384, y: 130, w: 80, h: 40, radius: 46, label: 'The Dunes casino', action: () => {
      startDialog([{ speaker: 'narrator', text: 'The doors part with a breath of cold, oxygen-enriched air. No clocks. No windows. The carpet pattern was designed by a man who hated you personally. Welcome to the Dunes.' }], () => travelHub('casino'));
    } },
    { x: 640, y: 150, w: 40, h: 34, radius: 40, label: 'Psychic — $10 readings', action: () => {
      if (state.money < 10) { toast('Madame Zelda sees poverty in your future. The reading is still $10.'); return; }
      state.money -= 10;
      audio.sfx('pickup');
      const heat = state.flags.heat || 0;
      const reading = heat >= 3
        ? 'The cards show… a chase. Flashing lights. A man in uniform behind you — no, TWO men. Madame Zelda slides your ten back across the table. “This one’s on the house. You’re gonna need it. GO. Now.”'
        : (state.money > 400
          ? 'Madame Zelda peers into the crystal. “I see wealth… suspicious wealth. A safe. A man named Silvio counts your money and sings to it. Is this… is this normal where you’re from?” You nod. It is.'
          : state.player.kind === 'george'
            ? 'Madame Zelda shuffles, freezes, looks at George with genuine alarm. “The cards say you will be embarrassed on a date. Soon. Also every date after that. The cards are very consistent. The cards are SORRY.”'
            : 'Madame Zelda reads your palm and goes quiet. “You carry a heavy sadness,” she says. “And gabagool. Mostly gabagool. The line of the heart is strong. The line of the cholesterol is stronger.”');
      startDialog([{ speaker: 'narrator', text: reading }]);
    } },
    { x: 450, y: 150, w: 56, h: 36, radius: 42, label: 'The $19.99 buffet', action: () => {
      if (state.money < 20) { toast('The buffet is $19.99 plus dignity, payable in advance.'); return; }
      state.money -= 20;
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George approaches the buffet with a strategy: proteins first, no filler, visit structure optimized. Forty minutes later he is weeping gently into a bread pudding. The system has beaten him. It beats everyone.' },
        { speaker: 'george', text: 'The crab legs are TIME-GATED! They ration the crab legs! That’s not a buffet, that’s a crab-leg LOTTERY! …I’ll take a plate for the road. Two plates. A tray!' }
      ] : [
        { speaker: 'narrator', text: 'Tony does the buffet the way he does everything: no wasted motion. Plate one, meat. Plate two, meat adjacent. Plate three is dessert because Tony Soprano contains multitudes. The carving station guy gives him the respect slice — the end cut. The fat cap. The one they save.' },
        { speaker: 'tony', text: 'Nineteen ninety-nine. In this economy? This is the last honest deal in America. Don’t tell nobody. Actually — tell Paulie nothing, he’d move in.' }
      ]);
    } },
    { x: 250, y: 150, w: 60, h: 40, radius: 42, label: 'High-roller slots', action: () => {
      if (state.money < 50) { toast('High-roller slots are $50 a pull.'); return; }
      state.money -= 50;
      const night = isNight();
      const roll = Math.random() * (night ? .82 : 1); // the house gets generous after dark — or seems to
      audio.sfx('spin');
      if (roll < .04) {
        state.money += 1000;
        audio.sfx('cash');
        startDialog([
          { speaker: 'narrator', text: 'SEVEN SEVEN SEVEN. The machine screams like it is being robbed — which, legally, it is not. A pit boss materializes, counts out $1000, and vanishes like a magic trick in a bad suit.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A THOUSAND! I am up for the YEAR! I am telling everyone! I am telling NO ONE! BOTH!' : 'Now THAT is a machine. Other machines — take notes.' }
        ]);
      } else if (roll < .2) {
        state.money += 120;
        audio.sfx('cash');
        startDialog([{ speaker: 'narrator', text: 'Two sevens and a bell. $120 slides out. The machine is already pretending it never happened.' }]);
      } else {
        audio.sfx('thud');
        startDialog([{ speaker: 'narrator', text: 'Cherry, lemon, and a symbol that might be a duck. The machine eats your $50 with the serenity of a thing that has eaten thousands before it.' }]);
      }
    } },
    { x: 250, y: 260, w: 60, h: 40, radius: 44, label: 'Rolling chair ride', action: () => {
      if (state.money < 10) { toast('The rolling chair guy wants $10.'); return; }
      state.money -= 10;
      audio.sfx('pickup');
      startDialog([
        { speaker: 'narrator', text: 'A man pushes you the length of the boards in a wicker chair on wheels, narrating the casinos like a very tired nature documentary. It is the most relaxing crime-adjacent ten dollars you have ever spent.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'This is TRANSPORTATION! Why do we walk ANYWHERE! I want one of these for the office! For LIVING!' : 'Now this — this is how a man inspects a boardwalk. Paulie would love this. He ain’t invited.' }
      ]);
    } },
    { x: 620, y: 230, w: 50, h: 44, radius: 44, label: 'The fountain', action: () => {
      if (!state.flags.fountainDive) {
        state.flags.fountainDive = true;
        state.money += 23;
        audio.sfx('cash');
        spawnEffect(384, 180, '+$23 in wishes', '#ffd23e');
      } else {
        toast('The fountain is coinless. You took the wishes. All of them.');
      }
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'Coins glitter at the bottom of the fountain. Hundreds of wishes, layered like sediment. George counts them with his eyes. Somebody’s wish is about a knish.' },
        { speaker: 'george', text: 'You think anyone notices if you take a few back? Hypothetically? Asking for the Human Fund.' }
      ] : [
        { speaker: 'narrator', text: 'The fountain throws glittering arcs into the neon. Tourists throw money in; the ocean, ten yards away, throws it back out. Somewhere in there is a metaphor for the whole town.' },
        { speaker: 'tony', text: 'I knew a guy who fished these fountains. Made a living. Then he got greedy — started carrying a net. Never carry a net. That is the whole lesson.' }
      ]);
    } },
    { x: 420, y: 150, w: 70, h: 40, radius: 44, label: 'Loan shark', action: () => {
      if (state.flags.acLoan) {
        if (state.money >= 250) {
          state.money -= 250;
          state.flags.acLoan = false;
          state.flags.heat = Math.max(0, (state.flags.heat || 0) - .5);
          audio.sfx('cash');
          startDialog([
            { speaker: 'narrator', text: 'You count out $250. The shark makes it disappear with the efficiency of a man who has never once needed a receipt. “Pleasure. Tell your friends. Don’t tell your friends.” The wrench stays hypothetical.' },
            { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'Paid in full! My kneecaps are MINE again! I’m never borrowing again! …Unless the rates improve!' : 'Clean. That’s how you do business. No paper, no problems, no reminders.' }
          ]);
        } else {
          startDialog([{ speaker: 'narrator', text: 'The shark smiles with entirely too many teeth. “Payment Friday — $250. Or don’t. I own a very persuasive pipe wrench either way.” You need the cash first. Somehow. Anyhow.' }]);
        }
        return;
      }
      state.flags.acLoan = true;
      state.money += 200;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
      audio.sfx('cash');
      startDialog([
        { speaker: 'narrator', text: 'A man in a cream suit lends you $200 against “future considerations.” No paperwork. Paperwork is how they GET you, he explains, at length, unprompted.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'No paperwork! Finally, a financial institution that understands me! …Why is he cracking his knuckles like that?' : 'Two hundred, no paper. I’ve been on the other side of this transaction. The view’s worse from here. Heh.' }
      ]);
    } }
  ];
}

function drawShore() {
  if (!drawSceneArt(sceneArt.shore, 768, 416)) px(ctx, 0, 0, 768, 416, '#4a4238');
  drawHighwaySign(60, 158, ['GSP NORTH', '← THE BARRENS']);
  drawHighwaySign(640, 158, ['AC EXPRESSWAY', 'ATLANTIC CITY →']);
  // rolling wave animation along the blocked beach edge
  for (let i = 0; i < 8; i++) {
    const wx = 30 + i * 95 + Math.sin(state.time * 1.2 + i) * 14;
    const wy = 330 + Math.sin(state.time * 1.7 + i * 2) * 6;
    ctx.save();
    ctx.globalAlpha = .35 + Math.sin(state.time * 2 + i) * .2;
    px(ctx, wx, wy, 42, 3, '#cfe8f4');
    ctx.restore();
  }
  // seagulls
  for (let i = 0; i < 4; i++) {
    const gx = (state.time * (14 + i * 5) + i * 190) % 820 - 30;
    const gy = 60 + i * 24 + Math.sin(state.time * 2 + i * 3) * 10;
    px(ctx, gx, gy, 5, 2, '#e8e8e0');
    if (Math.floor(state.time * 6 + i) % 2) px(ctx, gx - 2, gy - 1, 3, 1, '#e8e8e0');
    else px(ctx, gx + 4, gy - 1, 3, 1, '#e8e8e0');
  }
  outlineText(ctx, '← north', 24, 200, '#ffe78a', 7, 'left');
}

function shoreInteractions() {
  return [
    { x: 4, y: 150, w: 50, h: 120, radius: 46, label: '← Drive north', action: () => startTransit('pines', 384, 210, 'shore') },
    { x: 340, y: 130, w: 60, h: 40, radius: 44, label: "Salty's Taffy", action: () => {
      startDialog([{ speaker: 'narrator', text: 'Inside it smells like sugar and 1921. The pulling machine never stops. Neither, apparently, does the seagull that got in here in June.' }], () => setScene('taffy', 320, 385));
    } },
    { x: 752, y: 210, w: 20, h: 90, radius: 44, label: 'AC →', action: () => startTransit('ac', 40, 220, 'ATLANTIC CITY EXPRESSWAY') },
    { x: 248, y: 8, w: 272, h: 110, radius: 52, label: 'Saltwater taffy', action: () => {
      if ((state.flags.tribute || 0) < 5) {
        startDialog([{ speaker: 'narrator', text: 'Taffy is five bucks a bag. You have lint and regret. The shopkeep has seen worse — it’s the off-season, everyone has lint and regret.' }]);
        return;
      }
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 5);
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A bag of saltwater taffy. George eats eleven pieces in ninety seconds and immediately requires a sit-down.' },
        { speaker: 'george', text: 'The trick is you don’t chew. Chewing is how they get you. You let it dissolve like a memory!' }
      ] : [
        { speaker: 'narrator', text: 'Taffy. Tony regards it with suspicion, eats one piece, then buys three more bags for the ride home.' },
        { speaker: 'tony', text: 'What. It’s for the kids. Some of it. Look — the molasses one’s mine, that’s non-negotiable.' }
      ]);
    } },
    { x: 330, y: 240, w: 120, h: 60, radius: 48, label: 'Watch the ocean', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'George stares at the Atlantic. Somewhere out there: Portugal. He will never go. He thinks about this for a long time.' },
        { speaker: 'george', text: 'You know what the ocean is? A reminder. Everything is huge and I am very, very small. I need a taffy.' }
      ] : [
        { speaker: 'narrator', text: 'Tony watches the water. Melfi would call this processing. Tony calls it looking at water. Both are true.' },
        { speaker: 'tony', text: 'My old man never took us down the shore. First time I saw the ocean I was nineteen, on a… work trip. Funny what you remember.' }
      ]);
    } },
    { x: 100, y: 130, w: 90, h: 80, radius: 48, label: 'Zoltar fortune machine', action: () => {
      if ((state.flags.tribute || 0) < 1) {
        startDialog([{ speaker: 'narrator', text: 'Zoltar requires one dollar. Even mechanical prophets have overhead.' }]);
        return;
      }
      state.flags.tribute = Math.max(0, (state.flags.tribute || 0) - 1);
      audio.sfx('pickup');
      const fortunes = state.player.kind === 'george' ? [
        'Zoltar sees… a man who argues about chairs. Greatness? No. But persistent. VERY persistent.',
        'Zoltar sees a big salad in your future. It is not for you. It is never for you.',
        'The spirits say: you will die in a small apartment, but with excellent posture.',
        'Zoltar sees you saying "it’s not a lie if YOU believe it" at a deposition. The spirits are concerned.'
      ] : [
        'Zoltar sees… a big man with a heavy heart. Also duck food. The spirits are very specific today.',
        'The spirits say: your enemies fear you, your family needs you, and your backyard needs a ducks-only policy.',
        'Zoltar sees two paths: therapy or the other thing. The machine recommends the therapy. It is only a dollar for this wisdom.',
        'A great fortune approaches — along with several small federal investigations. Zoltar suggests taffy.'
      ];
      startDialog([
        { speaker: 'narrator', text: 'The machine whirs. Zoltar’s eyes light up. His painted mustache has seen a thousand boardwalk summers and judged every one of them.' },
        { speaker: 'narrator', text: fortunes[Math.floor(Math.random() * fortunes.length)] }
      ]);
    } },
    { x: 450, y: 280, w: 40, h: 30, radius: 42, label: 'The beached whale crowd', action: () => {
      if (state.player.kind === 'george') {
        if (!state.flags.whaleHero) {
          state.flags.whaleHero = true;
          state.money += 45;
          audio.sfx('cash');
          startDialog([
            { speaker: 'narrator', text: 'A crowd gathers around driftwood that could — at a certain angle, in fog — be a small whale. Someone shouts IS ANYONE HERE A MARINE BIOLOGIST? George’s hand rises before his brain can stop it.' },
            { speaker: 'george', text: 'I — yes! Yes I am! A marine biologist! The sea was angry that day, my friends — like an old man trying to send back soup at a deli!' },
            { speaker: 'narrator', text: 'George waves his arms at the driftwood until the crowd loses interest and disperses. A woman presses $45 into his hand “for the whales.” The whales are fine. The whales were never in danger. There are no whales.' }
          ]);
        } else {
          startDialog([{ speaker: 'narrator', text: 'The crowd is gone. The driftwood remains, silent, unmoved, whale-adjacent. George salutes it anyway.' }]);
        }
      } else {
        startDialog([
          { speaker: 'narrator', text: 'A small crowd argues about whether driftwood is a beached whale. It is not. Tony knows because he once asked a guy who knows about these things. The guy owed him money.' },
          { speaker: 'tony', text: 'It’s a LOG. It’s a log, people. Go home. It’s the off-season, even the whales know that.' }
        ]);
      }
    } },
    { x: 250, y: 260, w: 44, h: 30, radius: 40, label: 'Borrow golf cart', action: () => {
      if (state.player.inCar) return;
      state.player.inCar = true;
      state.player.speed = 110;
      state.player.carColor = '#e8e4d8';
      state.player.carDamage = 0;
      state.player.carV = 0;
      audio.sfx('door');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'CART ACQUIRED', '#ffe78a');
      startDialog([{ speaker: 'narrator', text: 'A golf cart. Off-season, off-leash, barely off-road. It tops out at “brisk walk” but it is technically a vehicle, and technically is the best kind.' }]);
    } },
    { x: 250, y: 110, w: 44, h: 34, radius: 40, label: 'Metal detector guy', action: () => {
      audio.sfx('pickup');
      if (!state.flags.metalChat) {
        state.flags.metalChat = true;
        state.money += 12;
        audio.sfx('cash');
        startDialog([
          { speaker: 'narrator', text: 'The metal detector guy — forty years on this beach, knees like a seabird — shows you today’s haul: eleven bottle caps, a hoop earring, and one very suspicious washer. He pays you $12 for “that thing you’re standing on.” You were standing on a quarter. He’s that good.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'A CAREER! A man with a metal detector has a CAREER! What do I have?! A nap mat under a desk!' : 'Forty years walking in circles. No boss, no crew, no sit-downs. This guy figured it all out. Don’t tell nobody he exists.' }
        ]);
      } else startDialog([{ speaker: 'narrator', text: 'The detector hums its patient song. Somewhere under the sand: bottle caps, always and forever, mostly bottle caps. He keeps walking. The dream is the point.' }]);
    } },
    { x: 380, y: 140, w: 44, h: 34, radius: 42, label: 'Fish off the pier', action: () => {
      if (state.mode === 'fishing') return;
      state.mode = 'fishing';
      state.fishing = { phase: 'cast', t: 1.5 + Math.random() * 3, window: 0 };
      audio.sfx('pickup');
    } },
    { x: 560, y: 160, w: 44, h: 40, radius: 42, label: 'Claw machine', action: () => {
      if (state.mode === 'claw') return;
      if (state.money < 5) { toast('The claw machine is $5.'); return; }
      state.money -= 5;
      state.mode = 'claw';
      state.claw = { x: .5, prize: .15 + Math.random() * .7, t: 8, phase: 'aim', dropT: 0 };
      audio.sfx('pickup');
    } },
    { x: 470, y: 130, w: 44, h: 40, radius: 40, label: 'Skeeball', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The skeeball machine. The 100 ring has a single ball-sized dent, as if it happened once, in 1994, and the machine still flinches.' },
        { speaker: 'george', text: 'Skeeball! The sport of kings! I have a theory — it’s all in the ARC. Physics! Angles! I once scored a 40 with my eyes closed. Open, I averaged 20. I play better blind!' }
      ] : [
        { speaker: 'narrator', text: 'The skeeball machine. Five bucks, three balls, and the chance to beat a machine older than most of the crew.' },
        { speaker: 'tony', text: 'My uncle ran one of these on the boardwalk in the sixties. The trick is the machine decides. Like everything else in Jersey.' }
      ], () => initSkeeball());
    } },
    { x: 640, y: 240, w: 44, h: 44, radius: 44, label: 'High striker', action: () => {
      if (state.money < 5) { toast('High striker is $5 a swing.'); return; }
      state.money -= 5;
      state.mode = 'strength';
      state.strength = { t: 0, dir: 1, swinging: true, resultT: 0, result: null, power: 0 };
      audio.sfx('pickup');
    } },
    { x: 520, y: 200, w: 100, h: 60, radius: 46, label: 'Feed the gulls', action: () => {
      audio.sfx('turkey');
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .2);
      startDialog([
        { speaker: 'narrator', text: 'You throw one taffy crumb. Eleven thousand seagulls arrive as a single organism. A sign nearby says DO NOT FEED THE GULLS in very large letters.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'THEY’RE ORGANIZED! THEY HAVE A STRUCTURE! The big one is clearly management!' : 'Even the birds down here got a crew. Look at the little one — he’s the earner. The fat one? Union rep.' }
      ]);
    } }
  ];
}

function drawPines() {
  drawHighwaySign(40, 150, ['GSP NORTH', '← NORTH CALDWELL']);
  drawHighwaySign(620, 150, ['EXIT 88', 'THE SHORE →']);
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
    { x: 300, y: 250, w: 50, h: 40, radius: 44, label: 'Disturbed earth', action: () => {
      const finds = [
        { text: 'You dig. A single ice skate, ancient and rusted. Size 14. You rebury it with more respect than it probably deserves.', money: 0 },
        { text: 'You dig. A coffee can full of quarters — somebody’s rainy-day fund from 1974. The rain came. $38 in vintage change.', money: 38 },
        { text: 'You dig. A very heavy door hinge and a note that just says “SORRY — P.” You stop digging. You will never dig again. …You pocket a $5 that was under the hinge.', money: 5 },
        { text: 'You dig. Nothing. Just cold pine soil. Somewhere behind you, a branch breaks, and you decide the digging is done.', money: 0 }
      ];
      const f = finds[Math.floor(Math.random() * finds.length)];
      if (f.money) state.money += f.money;
      audio.sfx(f.money ? 'cash' : 'pickup');
      startDialog([
        { speaker: 'narrator', text: f.text },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'I’m digging in a HAUNTED FOREST! For QUARTERS! This is what my life is now!' : 'Ground keeps secrets. That’s the business model. Always has been.' }
      ]);
    } },
    { x: 490, y: 250, w: 40, h: 30, radius: 42, label: 'Hunting cabin', action: () => {
      if (!state.flags.cabinFound) {
        state.flags.cabinFound = true;
        startDialog([{ speaker: 'narrator', text: 'Half hidden in the treeline: a hunting cabin, smoke curling from the chimney. Somebody keeps it warm. Somebody who does not want visitors, but keeps it warm anyway. Family rules: it’s yours too.' }], () => setScene('cabin', 320, 360));
        return;
      }
      setScene('cabin', 320, 360);
    } },
    { x: 460, y: 330, w: 60, h: 50, radius: 50, label: 'Shore →', action: () => startTransit('shore', 80, 210, null) },
    { x: 260, y: 350, w: 30, h: 24, radius: 40, label: 'Frozen turkey leg', hidden: () => (state.flags.brick || 0) > 0, action: () => {
      state.flags.brick = 3;
      audio.sfx('pickup');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'TURKEY LEG x3 · SEASONAL ORDNANCE', '#ff9a7a');
      startDialog([
        { speaker: 'narrator', text: 'Half-buried in the frost: a frozen turkey leg, hard as rebar. Somebody’s Thanksgiving never made it home. The Barrens provide. The Barrens always provide.' },
        { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'It’s frozen solid! You could — I mean, hypothetically — this is essentially a club! A DELICIOUS club!' : 'Frostbite hard. Three good swings in it, easy. Waste not.' }
      ]);
    } },
    { x: 300, y: 380, w: 130, h: 26, radius: 48, label: '← Drive back north', action: () => {
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

function initArmWrestle(opp) {
  state.armwrestle = { power: .5, t: 0, duration: 8, done: false, resultT: 0, won: false, opp: opp || 'bouncer' };
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
        state.flags.tribute = (state.flags.tribute || 0) + (a.opp === 'trucker' ? 40 : 75);
        audio.sfx('cash');
        if (a.opp === 'trucker') {
          startDialog(state.player.kind === 'george' ? [
            { speaker: 'narrator', text: 'The trucker’s hand hits the formica. The whole diner applauds — all three of them. The waitress compacts her disbelief into a single nod. He pays up without a word, still never looking at you.' },
            { speaker: 'george', text: 'I beat a TRUCKER! A man whose forearms shift GEARS! I am basically a longshoreman!' }
          ] : [
            { speaker: 'narrator', text: 'The trucker goes down slow, like a bridge demolition. Forty bucks on the counter. He nods once, finishes his pie, and tells the waitress you’re “okay for a Jersey guy.” From him that is canonization.' },
            { speaker: 'tony', text: 'Good match. Tell your union I said hello. The pie’s on him — I mean me. It’s on me.' }
          ]);
        } else startDialog(state.player.kind === 'george' ? [
          { speaker: 'narrator', text: 'GEORGE WINS! The Bing erupts! Somewhere, a single tear rolls down a bouncer’s cheek.' },
          { speaker: 'george', text: 'FIFTY YEARS of repressed rage, all in the wrist! I could arm-wrestle GOD right now!' }
        ] : [
          { speaker: 'narrator', text: 'Tony slams the bouncer’s hand through the table. Literally through it. The table is two tables now.' },
          { speaker: 'tony', text: 'Tell Paulie he owes me seventy-five bucks. Also tell him he owes me a new table, but he already knew that.' }
        ]);
      } else {
        if (a.opp === 'trucker') {
          startDialog([
            { speaker: 'narrator', text: 'The trucker’s arm does not so much move as relocate your hand. Somewhere in the Midwest, a load of produce arrives on time. He finishes his pie like nothing occurred, because for him nothing did.' },
            { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'He had LEVERAGE! His whole life is leverage! I want a rematch with a smaller trucker!' : 'Guy’s got a piston for an arm. Nobody speak of this.' }
          ]);
        } else startDialog(state.player.kind === 'george' ? [
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
  if (!drawMgBackdrop(sceneArt.mgMonte, 640, 416, .6)) {
    px(ctx, 0, 0, 640, 416, '#1c1710');
    px(ctx, 0, 200, 640, 216, '#2c2419');
  }
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
  drawHighwaySign(60, 168, ['HOLLAND TUNNEL', '← NEW JERSEY']);
  // the Manhattan-side tunnel portal — the hole New Jersey comes out of
  px(ctx, 0, 150, 40, 96, '#6a5a4a');
  px(ctx, 4, 158, 32, 80, '#1a1410');
  px(ctx, 0, 150, 40, 8, '#8a7a6a');
  for (let rib = 0; rib < 4; rib++) px(ctx, 4 + rib * 8, 158, 2, 80, '#4a3a2a');
  const tl = .5 + Math.sin(state.time * 2) * .15;
  ctx.save();
  ctx.globalAlpha = tl;
  px(ctx, 8, 166, 4, 4, '#ffd23e');
  px(ctx, 28, 166, 4, 4, '#ffd23e');
  ctx.restore();
  // steam — Manhattan breathes
  if (Math.sin(state.time * .7) > 0) {
    ctx.save();
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#c8c8d0';
    const sx = 250 + (state.time * 14) % 300;
    ctx.beginPath();
    ctx.arc(sx, 216 - (state.time * 20) % 40, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Kenny Roger's Roasters — the red neon chicken that never sleeps
  px(ctx, 560, 40, 90, 50, '#2a1a1a');
  const rglow = .55 + Math.sin(state.time * 3) * .2;
  ctx.save();
  ctx.globalAlpha = rglow;
  px(ctx, 568, 48, 74, 8, '#ff2a1a');
  px(ctx, 568, 62, 74, 8, '#ff2a1a');
  ctx.restore();
  ctx.fillStyle = '#ffb0a0';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KENNY’S ROASTERS', 605, 56);
  ctx.fillText('CHICKEN CHICKEN', 605, 70);
  if (typeof isNight === 'function' && isNight()) {
    ctx.save();
    ctx.globalAlpha = .12 + Math.sin(state.time * 3) * .04;
    ctx.fillStyle = '#ff3a2a';
    ctx.beginPath();
    ctx.arc(605, 120, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.textAlign = 'left';
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
  // Kramer holding court at his mission spot
  drawPerson(ctx, 310, 238, 'kramer', 'down', state.frame * .5, {});
  if (nextKramerMission() && !state.mission && Math.sin(state.time * 3) > 0) outlineText(ctx, '!', 320, 224, '#ffe78a', 10, 'center');
  // parked stealable taxi
  if (!state.player.inCar) {
    px(ctx, 380, 356, 30, 11, '#c9a015');
    px(ctx, 382, 357, 26, 9, '#e8b822');
    px(ctx, 387, 358, 14, 7, '#9fd4ec');
    px(ctx, 392, 354, 6, 3, '#fff3b0');
    px(ctx, 383, 365, 5, 3, '#05070c');
    px(ctx, 402, 365, 5, 3, '#05070c');
  }
  // parked mail truck — Newman's route, keys in the ignition
  if (!state.player.inCar) {
    px(ctx, 640, 354, 34, 13, '#b8b4a8');
    px(ctx, 642, 355, 30, 11, '#dcd8cc');
    px(ctx, 642, 356, 12, 9, '#c8c4b8');
    px(ctx, 655, 357, 8, 6, '#9fd4ec');
    px(ctx, 644, 357, 4, 4, '#2848a0'); // eagle-ish blob
    px(ctx, 643, 366, 5, 3, '#05070c');
    px(ctx, 664, 366, 5, 3, '#05070c');
  }
  // taxi fare markers
  if (state.fare && state.scene === 'nyc') {
    const f = state.fare;
    const bob = Math.sin(state.time * 4) * 3;
    if (f.stage === 'pickup') {
      drawPerson(ctx, f.x - 10, f.y - 20, 'womanB', 'down', state.frame * .5, {});
      outlineText(ctx, 'TAXI!', f.x, f.y - 34 + bob, '#ffe78a', 8, 'center');
    } else {
      outlineText(ctx, '▼', f.x, f.y - 20 + bob, '#8ffff2', 11, 'center');
      outlineText(ctx, f.name.toUpperCase(), f.x, f.y - 34 + bob, '#8ffff2', 6, 'center');
    }
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
    { x: 605, y: 120, w: 80, h: 40, radius: 44, label: 'The red chicken light', action: () => {
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The red neon glow of the chicken sign washes over the street like a sunset that only sells one thing. George feels his pupils dilate and his resolve weaken. He doesn’t even like the chicken. Nobody likes the chicken. That’s not what it’s about.' },
        { speaker: 'george', text: 'It’s the light, Jerry. THE LIGHT. It gets in your head and it rearranges things!' }
      ] : [
        { speaker: 'narrator', text: 'A chicken place bathing the whole block in red neon at all hours. Tony has shaken down vending machines with more dignity than this signage. The chicken, he is forced to admit, smells incredible.' }
      ]);
    } },
    { x: 200, y: 150, w: 60, h: 40, radius: 52, label: 'Famous Original Ray’s', action: () => {
      startDialog([{ speaker: 'narrator', text: 'Which Ray’s is the real Ray’s is a question that has ended friendships. This one has the good oven. Inside: heat, grease, glory.' }], () => travelHub('slice'));
    } },
    { x: 730, y: 210, w: 34, h: 90, radius: 46, label: 'Subway → Queens', action: () => {
      startDialog([{ speaker: 'narrator', text: 'The 7 train east. The skyline slides backward and the rent drops a thousand dollars a mile. Somewhere out there, Frank Costanza is already angry about something. You can feel it, like thunder.' }], () => startTransit('queens', 60, 250, 'THE 7 TRAIN · EASTBOUND'));
    } },
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
      } else {
        const headlines = [];
        if (state.flags.fixedRaceDone) headlines.push('FIXED RACE FIXED BY RIVAL FIX — HORSE BLAMES NOBODY');
        if (state.flags.gravyChainDone) headlines.push('GRAVY SHORTAGE AVERTED — STRIP CLUB THANKSGIVING SAVED');
        if (state.flags.trackSystemDone) headlines.push('LOCAL SYSTEM COMES IN SECOND — SYSTEM EVOLVES, SAYS MAN IN CAP');
        if (state.flags.libraryRunDone) headlines.push('23-YEAR OVERDUE BOOK RETURNED — LIBRARY COP RETIRES TRIUMPHANT');
        if (state.flags.turkeyTaxDone) headlines.push('TURKEY PRICES UP — ENVELOPES UNRELATED, INSIST RESTAURANTS');
        if (state.flags.heatMagnetDone) headlines.push('MAIL THIEF AT LARGE — POSTAL INSPECTOR "VERY SURE THIS TIME"');
        if (state.flags.cottonUniformsDone) headlines.push('YANKEES UNIFORMS BREATHE AGAIN — COTTON INDUSTRY REJOICES');
        headlines.push('TURKEY PRICES THIS YEAR — FORGET ABOUT IT');
        if (state.flags.heat >= 3) headlines.unshift('MANHUNT — ARMED AND GABAGOOLY');
        const pick2 = headlines[Math.floor((state.time / 40) % headlines.length)];
        startDialog([{ speaker: 'narrator', text: 'Today’s headline: ' + pick2 + '. The paper costs two dollars. The ink costs extra, spiritually.' }]);
      }
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
    { x: 200, y: 236, w: 40, h: 34, radius: 40, label: 'Elaine', action: () => {
      if (!state.mission && state.flags.urbanSombreroDone && !state.flags.jPetermanBurmaDone && state.flags.freeRoam) {
        startMission('jPetermanBurma');
        startDialog([
          { speaker: 'elaine', text: 'Oh thank god — you! Do you want to make $290? Peterman went to Burma ONCE. The office is FULL. The accounting department is CRYING. I need someone with no questions and a strong back. You look like both.' },
          { speaker: 'system', text: 'Mission accepted: THE BURMA SHAVE. So much Burma.' }
        ]);
        return;
      }
      if (!state.mission && !state.flags.urbanSombreroDone && state.flags.freeRoam) {
        startMission('urbanSombrero');
        startDialog([
          { speaker: 'elaine', text: 'Psst! You want $230? I need someone to move a hat. Not just any hat — THE hat. Peterman can’t know it left the building, the photographer needs it at Monk’s, and NO ONE can be seen enjoying it. Can you not-enjoy a hat?' },
          { speaker: 'system', text: 'Mission accepted: THE URBAN SOMBRERO. It’s urban. It’s a sombrero.' }
        ]);
        return;
      }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'elaine', text: 'George! Did you know a man in a tracksuit punched a goose near my office? Everyone is talking about it. Everyone!' },
        { speaker: 'george', text: 'A goose?! I don’t know anything about — okay ONE goose. But he started it! They all start it! It’s their whole thing!' }
      ] : [
        { speaker: 'elaine', text: 'You’re the big guy with the — yeah. Jerry says I shouldn’t talk to you. So obviously I’m talking to you.' },
        { speaker: 'tony', text: 'Smart. Tell Jerry he still owes me for the — actually, forget it. You didn’t hear anything. Nice boots.' }
      ]);
    } },
    { x: 150, y: 250, w: 46, h: 28, radius: 38, label: 'Borrow convertible', action: () => {
      if (state.player.inCar) return;
      state.player.inCar = true;
      state.player.speed = 225;
      state.player.carColor = '#c03838';
      state.player.carDamage = 0;
      state.player.carV = 0;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + .5);
      audio.sfx('door');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'CONVERTIBLE!', '#ffe78a');
      startDialog([{ speaker: 'narrator', text: 'A red convertible, top down, keys in it, in MANHATTAN. This is either a gift or a trap. It is both. It is New York.' }]);
    } },
    { x: 230, y: 255, w: 40, h: 30, radius: 42, label: 'Buzz Jerry’s building', action: () => {
      audio.sfx('pickup');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'You buzz 5A. Silence. Then the intercom crackles with the sound of a man mid-stride through a door.' },
        { speaker: 'kramer', text: 'Yeah?! Who is it — oh, George. Jerry’s out. I’m watering his plants. The plants are fine. One of them is… resting. Come back never— I mean later!' },
        { speaker: 'george', text: 'He’s eating the cereal. I KNOW he’s eating the cereal! It’s a vintage box! It’s appreciating!' }
      ] : [
        { speaker: 'narrator', text: 'You buzz 5A. The intercom produces a man who sounds like he has never once been entirely indoors.' },
        { speaker: 'kramer', text: 'Yeah? Whaddaya want? You selling something? ’Cause I’m buying. What is it? Is it meat? It’s meat, isn’t it. Giddy up!' },
        { speaker: 'tony', text: '…I like this guy. Wrong neighborhood, but I like him.' }
      ]);
    } },
    { x: 690, y: 260, w: 40, h: 34, radius: 42, label: 'Pretzel cart', action: () => {
      if (state.money < 3) { toast('The pretzel man does not extend credit. He has been hurt before.'); return; }
      state.money -= 3;
      audio.sfx('pickup');
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .1);
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'The pretzel is the size of a steering wheel and roughly as chewy. George inhales half of it standing up, which in New York counts as dining out.' },
        { speaker: 'george', text: 'THESE PRETZELS… are making me THIRSTY! …I don’t know why I yelled that. I don’t know what’s wrong with me. Where’s a water fountain?' }
      ] : [
        { speaker: 'narrator', text: 'Tony eats a pretzel the way he does everything: completely, without ceremony, while walking. The pretzel man nods with respect. Nobody eats like that anymore. Nobody.' }
      ]);
    } },
    { x: 60, y: 240, w: 40, h: 34, radius: 42, label: 'Saxophone guy', action: () => {
      if (state.money < 1) { toast('You haven’t even a dollar for the arts.'); return; }
      state.money -= 1;
      audio.sfx('pickup');
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .2);
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'You drop a dollar in the case. The saxophonist — a man who has played this exact spot since 1986 — nods once and launches into something smooth enough to make the pigeons sway.' },
        { speaker: 'george', text: 'This is the good stuff! The REAL New York! I’m a patron of the arts now — tell people! Actually don’t, it cost a dollar!' }
      ] : [
        { speaker: 'narrator', text: 'You drop a dollar in the case. The saxophonist nods with the gravity of a made man accepting tribute, and the tunnel fills with something golden.' },
        { speaker: 'tony', text: 'Guy’s been here longer than most families I know. That’s consistency. That’s respect.' }
      ]);
    } },
    { x: 430, y: 250, w: 50, h: 34, radius: 40, label: 'Feed the pigeons', action: () => {
      if ((state.pigeonCd || 0) > state.time) { toast('The pigeons are full. They are judging you anyway. It’s their way.'); return; }
      state.pigeonCd = state.time + 30;
      state.flags.heat = Math.max(0, (state.flags.heat || 0) - .3);
      audio.sfx('pickup');
      spawnEffect(state.player.x, state.player.y - 16, 'the flock approves', '#b8d0e0');
      startDialog([{ speaker: 'narrator', text: 'You scatter crumbs. The flock descends with military precision. For one shining moment, you are the most important creature in Manhattan. Then the crumbs are gone, and so is their respect.' }]);
    } },
    { x: 700, y: 210, w: 60, h: 30, radius: 46, label: 'DMV', action: () => {
      if (!state.flags.dmvSeen) {
        state.flags.dmvSeen = true;
        startDialog([
          { speaker: 'narrator', text: 'The Department of Motor Vehicles. A building where time goes to be measured, catalogued, and made to take a number. Inside: the exact opposite of the open road.' },
          { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'The DMV! I have no business here! I’m going in! This is how bad decisions FEEL — like errands!' : 'I got people who handle this. Today I’m handling it. Don’t tell anyone.' }
        ], () => setScene('dmv', 320, 360));
      } else setScene('dmv', 320, 360);
    } },
    { x: 620, y: 236, w: 40, h: 34, radius: 40, label: 'Jerry', action: () => {
      if (!state.mission && state.flags.freeRoam && state.flags.kramericaBookDone && !state.flags.jerrysFavorDone) {
        startMission('jerrysFavor');
        startDialog([
          { speaker: 'jerry', text: 'Okay — don’t make it weird — I need a favor. The cereal. The good one, with the toy. The bodega has ONE box left and if I buy it myself I have to have a whole conversation about it. Just — get it. Don’t tell anyone. I’m begging you in a way that is legally not begging. Twenty bucks.' },
          { speaker: 'system', text: 'Mission accepted: THE FAVOR. The most legitimate job you will ever run.' }
        ]);
        return;
      }
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'jerry', text: 'George. Please tell me you’re not doing crimes with the mailman again. The last time, my super got a subpoena. A SUBPOENA, George!' },
        { speaker: 'george', text: 'That was ONE time! And technically it was Newman’s scheme! I was a passenger! A very well-compensated passenger!' }
      ] : [
        { speaker: 'jerry', text: 'You know, you look exactly like every guy my mother warns me about. All at once. It’s honestly impressive.' },
        { speaker: 'tony', text: 'You’re the comedian. I seen you on the TV. You’re funnier than my brother-in-law, which — low bar, but respect.' }
      ]);
    } },
    { x: 300, y: 232, w: 40, h: 36, radius: 44, label: 'Kramer', action: () => {
      if (!state.mission && nextKramerMission()) {
        const mid = nextKramerMission();
        startMission(mid);
        const offers = {
          muffinTops: { speaker: 'kramer', text: 'Buddy! Perfect timing! Kramerica Foods needs a logistics man. Muffin stumps — forty pounds — to the bodega. They take anything. $140. Giddy up!' },
          bladderRun: { speaker: 'kramer', text: 'The bladder, buddy. She’s full. She needs to be… relieved. In the Pine Barrens. It’s not dumping — it’s redistribution of petroleum assets! $200. Mostly airtight.' },
          bottleRun: { speaker: 'kramer', text: 'Buddy — bottles. Cases of them. The deposit money is just SITTING there in Michigan waiting for us. Well — the truck goes to Michigan eventually. You just get them to the bodega for now. Logistics! $160.' },
          trackSystem: { speaker: 'kramer', text: 'The Meadowlands, buddy. I got a system. A SYSTEM. It involves a man in a cap and a horse that knows things. Put the bet down, watch it run, bring me the word. This cannot fail — it’s mathematically ordained. $280.' },
          kramericaBook: { speaker: 'kramer', text: 'The coffee table book about coffee tables — it’s DONE, buddy. The publisher wants the manuscript at the Yankees office. Don’t ask why. Publishing is a strange world. $300 and a credit in the acknowledgments!' }
        };
        startDialog([
          offers[mid],
          { speaker: 'system', text: `Mission accepted: ${MISSION_DEFS[mid].title}. Follow the objective banner.` }
        ]);
      } else if (!state.mission && state.flags.kramericaBookDone && !state.flags.truckerSystemDone && state.flags.freeRoam) {
        startMission('truckerSystem');
        startDialog([
          { speaker: 'kramer', text: 'Buddy — Kramerica Logistics has a problem. The tolls are eating us alive. ALIVE! But the truckers — the truckers know every road in Jersey. Every shortcut. Every no-scale zone. There’s a guy at the Endgame Diner — truckers always know. Interview him. Verify the route. Logistics, buddy — it’s about to be a SCIENCE.' },
          { speaker: 'system', text: 'Mission accepted: THE TRUCKER SYSTEM. The shadow freight network awaits.' }
        ]);
      } else if (!state.mission && state.flags.truckerSystemDone && !state.flags.assmanDone && state.flags.freeRoam) {
        startMission('assman');
        startDialog([
          { speaker: 'kramer', text: 'Buddy — sit down. Sensitive matter. You know the DMV? Circus of incompetence. They printed vanity plates — ASSMAN — beautiful plates — and they were meant for ME. Clerical error! Now they’re OUT THERE, buddy, on somebody else’s car. I need you to find them. I need closure. I need to know who’s driving my legacy. $240 for closure.' },
          { speaker: 'system', text: 'Mission accepted: THE ASSMAN. Find the plates.' }
        ]);
      } else if (!state.mission && state.flags.kramericaBookDone && state.flags.freeRoam) {
        const drops = [
          { scene: 'monks', x: 320, y: 250, radius: 60, name: 'Monk’s — a business lunch. The business is confidential. The lunch is soup' },
          { scene: 'bodega', x: 320, y: 200, radius: 60, name: 'the bodega — they take anything, buddy. ANYTHING' },
          { scene: 'yankees', x: 320, y: 300, radius: 62, name: 'the Yankees office — tell them Kramerica sends regards. They don’t know us yet. They will' },
          { scene: 'soup', x: 320, y: 200, radius: 60, name: 'the Soup Man — follow the rules. Kramerica cannot afford another ban' },
          { scene: 'queens', x: 390, y: 160, radius: 60, name: 'the sauna in Queens — steam it. don’t ask. it’s a process' }
        ];
        const drop = drops[Math.floor(Math.random() * drops.length)];
        const rolledPayK = 60 + Math.floor(Math.random() * 60);
        startMission('kramerJob');
        state.mission.payout = rolledPayK;
        state.mission.steps = [
          { scene: drop.scene, x: drop.x, y: drop.y, radius: drop.radius, objective: `Kramerica errand — ${drop.name.split('—')[0].trim()}`, label: 'the pickup' },
          { scene: 'nyc', x: 300, y: 232, radius: 52, objective: 'Report back to Kramer', label: 'Kramer' }
        ];
        startDialog([
          { speaker: 'kramer', text: `Buddy! Kramerica Industries has a situation — a GOOD situation. ${drop.name}. $${rolledPayK}. Giddy up!` },
          { speaker: 'system', text: 'Mission accepted: KRAMERICA ERRAND. Repeatable — the empire never sleeps.' }
        ]);
      } else startDialog([
        { speaker: 'kramer', text: state.player.kind === 'george' ? 'Georgie! You look tired. Kramerica Industries is hiring, you know. No benefits, no salary, but the adrenaline — top shelf.' : 'You got the look, buddy. Waste management, huh? I can smell opportunity. And other things. It’s the bladder, don’t ask.' }
      ]);
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
      state.player.carDamage = 0;
      state.player.carV = 0;
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
    { x: 640, y: 358, w: 66, h: 36, radius: 44, label: 'Steal mail truck', hidden: () => !!state.player.inCar, action: () => {
      state.player.inCar = true;
      state.player.speed = 150;
      state.player.carColor = '#dcd8cc';
      state.player.carDamage = 0;
      state.player.carV = 0;
      state.flags.heat = Math.min(5, (state.flags.heat || 0) + 2);
      audio.sfx('door');
      spawnEffect(state.player.x + 8, state.player.y - 8, 'FEDERAL OFFENSE!', '#ff9a7a');
      startDialog(state.player.kind === 'george' ? [
        { speaker: 'narrator', text: 'A USPS mail truck, keys in the ignition. Newman left it running to double-park for a gyro. George commits a federal crime for a slightly faster vehicle.' },
        { speaker: 'george', text: 'It’s not stealing — I’m relocating government property! …Why does it smell like old tuna?' },
        { speaker: 'newman', text: 'MY TRUCK! COSTANZAAAA! You can’t handle the ROUTE! There are five hundred undelivered L.L. Bean catalogs in there! FIVE! HUNDRED!' }
      ] : [
        { speaker: 'narrator', text: 'A mail truck. Tony considers the resale value of mail. Approximately zero. But it’s slow, armored, and absolutely nobody tailgates a mail truck.' },
        { speaker: 'tony', text: 'Thing drives like a refrigerator. But a refrigerator nobody pulls in front of.' },
        { speaker: 'newman', text: 'MAIL THEFT IS A FEDERAL CRIME, SOPRANO! I mean — I’m going to need a ride to work now. Don’t suppose you’re headed to the depot?' }
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

function drawHubWayfinding() {
  // Holland Tunnel portal at the east edge — a real structure you drive into
  if (state.scene === 'hub') {
    // connector asphalt: the main road bends right into the tunnel mouth
    px(ctx, 1060, 204, 172, 44, '#2e2e34');
    px(ctx, 1060, 204, 172, 3, '#454550');
    px(ctx, 1060, 245, 172, 3, '#454550');
    for (let dx = 1066; dx < 1226; dx += 22) px(ctx, dx, 224, 12, 3, '#c8b830');
    // curved shoulder joining the main road up top
    px(ctx, 1060, 170, 60, 34, '#2e2e34');
    px(ctx, 1118, 178, 30, 26, '#2e2e34');
    // arrow painted on the asphalt pointing at the mouth
    px(ctx, 1150, 218, 40, 6, '#c8b830');
    px(ctx, 1186, 212, 8, 18, '#c8b830');
    px(ctx, 1190, 208, 4, 26, '#2e2e34');
    const px0 = 1226, py0 = 196;
    px(ctx, px0, py0, 54, 14, '#5a4a38'); // fascia
    px(ctx, px0, py0, 54, 4, '#7a6848');
    px(ctx, px0 + 4, py0 + 14, 8, 104, '#4a3e30'); // left pillar
    px(ctx, px0 + 42, py0 + 14, 8, 104, '#4a3e30'); // right pillar
    px(ctx, px0 + 12, py0 + 14, 30, 104, '#0a0c12'); // tunnel mouth darkness
    px(ctx, px0 + 12, py0 + 14, 30, 8, '#161a24');
    const glow = .5 + Math.sin(state.time * 2.2) * .3;
    ctx.save();
    ctx.globalAlpha = glow;
    px(ctx, px0 + 16, py0 + 20, 4, 3, '#e8b822'); // interior lights receding
    px(ctx, px0 + 24, py0 + 24, 3, 2, '#e8b822');
    px(ctx, px0 + 30, py0 + 28, 2, 2, '#e8b822');
    ctx.restore();
    outlineText(ctx, 'HOLLAND TUNNEL', px0 + 27, py0 + 10, '#ffe78a', 5, 'center');
    outlineText(ctx, 'NEW YORK →', px0 + 27, py0 + 130, '#9fd4ec', 5, 'center');
  }
  if (state.vanHere) {
    // the white van. it is always the same van. it is never the same guy.
    px(ctx, 700, 330, 58, 24, 'rgba(0,0,0,.3)');
    px(ctx, 702, 318, 54, 26, '#ddd8ce');
    px(ctx, 702, 318, 54, 6, '#c8c2b4');
    px(ctx, 744, 322, 10, 14, '#b8b2a4');
    px(ctx, 746, 324, 6, 5, '#9fd4ec');
    px(ctx, 706, 340, 8, 5, '#1a1a20');
    px(ctx, 738, 340, 8, 5, '#1a1a20');
    outlineText(ctx, 'SPEAKERS', 728, 334, '#7a7264', 6, 'center');
  }
  // big green jersey highway signs — nobody reads them, everybody needs them
  drawHighwaySign(1075, 168, ['HOLLAND TUNNEL', 'MANHATTAN →']);
  drawHighwaySign(518, 330, ['GSP SOUTH ↓', 'PINE BARRENS', 'SHORE · A.C.']);
  drawHighwaySign(60, 168, ['ROUTE 3 WEST', '← MEADOWLANDS']);
  // the Endgame Diner storefront — a stainless stripe in the north-edge gap, neon and everything
  if (state.scene === 'hub') {
    px(ctx, 852, 62, 68, 88, '#8a8a92');
    px(ctx, 852, 62, 68, 6, '#c8c8d0');
    for (let rib = 0; rib < 6; rib++) px(ctx, 852, 74 + rib * 12, 68, 2, '#7a7a84');
    px(ctx, 876, 108, 20, 42, '#2a2a30'); // door
    px(ctx, 878, 112, 16, 14, '#9fd4ec');
    px(ctx, 856, 100, 16, 20, '#e8dfc8'); // window, warm inside
    px(ctx, 902, 100, 14, 20, '#e8dfc8');
    // the neon sign — ENDGAME in red, buzzes like a real one
    const neon = Math.sin(state.time * 6) > -.85;
    if (neon) outlineText(ctx, 'ENDGAME', 886, 78, '#ff5a4a', 6, 'center');
    outlineText(ctx, 'DINER', 886, 90, neon ? '#ffd24a' : '#8a7a4a', 5, 'center');
    ctx.save();
    ctx.globalAlpha = neon ? .14 + Math.sin(state.time * 6) * .04 : .05;
    ctx.fillStyle = '#ff5a4a';
    ctx.beginPath();
    ctx.arc(886, 96, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
    drawHubWayfinding();
    outlineText(ctx, 'FREE ROAM', 320, 24, '#ffe78a', 10, 'center');
    return;
  }
  drawNjStreet();

  drawHubWayfinding();
}

function drawHighwaySign(x, y, lines) {
  const w = 96, h = 12 + lines.length * 11;
  px(ctx, x + 3, y + h, 4, 26, '#6a6a5a'); // post
  px(ctx, x, y, w, h, '#0d5c2e');
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 13 + i * 11));
  ctx.textAlign = 'left';
}

function drawNjStreet() {
  if (drawSceneArt(sceneArt.njstreet, 640, 416)) return;

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
    if ((state.player.carDamage || 0) >= 2) {
      for (let i = 0; i < 3; i++) {
        const ph = (state.time * .9 + i * .33) % 1;
        const sx = state.player.x - 2 + Math.sin(ph * 9 + i) * 5;
        const sy = state.player.y - 6 - ph * 26;
        ctx.fillStyle = `rgba(90,90,95,${(1 - ph) * .4})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + ph * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // a befriended turkey rides shotgun. no further questions.
    if (state.scene === 'hub' && state.turkey && state.turkey.friend) {
      const bob = Math.sin(state.time * 7) * 1.5;
      px(ctx, state.player.x - 6, state.player.y - 14 + bob, 7, 6, '#5a3a20');
      px(ctx, state.player.x - 8, state.player.y - 18 + bob, 4, 4, '#7a5230');
      px(ctx, state.player.x - 4, state.player.y - 17 + bob, 2, 2, '#c03838');
    }
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
  if (!state.flags.freeRoam || !['hub', 'nyc', 'pines', 'shore', 'ac', 'meadow', 'queens'].includes(state.scene) || state.mode !== 'explore') return;
  const mx = 8, my = H - 46, mw = 110, mh = 34;
  const sceneW = state.scene === 'hub' ? 1280 : 768;
  const sx = mw / sceneW, sy = mh / 416;
  ctx.save();
  ctx.globalAlpha = .88;
  drawPanel(mx, my, mw, mh, '#0d1424', '#4a5a78');
  ctx.restore();
  // road band
  px(ctx, mx + 2, my + 198 * sy, mw - 4, 90 * sy, '#3a3f48');
  // landmark dots
  const simpleMarks = {
    pines: [[384, 210, '#8ffff2'], [400, 260, '#c09aff']],
    shore: [[330, 240, '#9fd4ec'], [520, 200, '#ffb98a'], [740, 210, '#8ffff2'], [640, 240, '#ffd34f']],
    ac: [[250, 150, '#ffd34f'], [620, 230, '#9fd4ec'], [420, 150, '#ff9a7a'], [8, 210, '#8ffff2']]
  };
  const marks = simpleMarks[state.scene] || (state.scene === 'nyc' ? [
    [125, 230, '#ffb98a'], [435, 220, '#ffe78a'], [650, 228, '#9fd4ec'], [18, 226, '#8ffff2'],
    [500, 220, '#e8e2d0'], [160, 350, '#c09aff'], [390, 370, '#e8b822']
  ] : [
    [157, 150, '#ffd34f'], [525, 150, '#ff9a7a'], [90, 315, '#c09aff'], [554, 395, '#ff6a8a'],
    [320, 325, '#9fd4ec'], [218, 276, '#ffb98a'], [80, 150, '#e8e2d0'], [283, 138, '#e8e2d0'], [609, 162, '#8fb8ff'],
    [1010, 100, '#ff8a8a'], [1100, 350, '#9be59b']
  ]);
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

function drawParkedCars() {
  const spots = PARKED_CARS[state.scene];
  if (!spots) return;
  for (const s of spots) {
    if ((state['parkedCd' + s.id] || 0) > state.time) continue;
    px(ctx, s.x - 2, s.y + 12, 40, 8, 'rgba(0,0,0,.25)');
    drawCar(s.x, s.y, s.color);
  }
}

function drawWorld() {
  const scene = scenes[state.scene];
  if (!scene) return;
  ctx.save();
  ctx.translate(-Math.round(state.camera.x), -Math.round(state.camera.y));
  scene.draw();
  drawParkedCars();
  drawAmbient();
  drawSchemeProps();
  drawCop();
  drawRoadblock();
  drawLeaves();
  drawSnatcher();
  drawPackages();
  drawFireworks();
  drawKite();
  drawLawnmower();
  drawUmbrellaGuy();
  drawWantedPoster();
  drawRaccoons();
  drawParadeBalloon();
  drawParadeCrowd();
  drawIceCream();
  drawWildTurkey();
  drawHubEventProps();
  drawRussian();
  drawTailCourier();
  drawBrawler();
  drawFares();
  drawCash();
  drawInteractionMarkers();
  drawPlayer();
  drawEffects();
  ctx.restore();
  drawObjectiveArrow();
  drawMinimap();
  drawMissionHud();
  drawToast();
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
  const mapped = CAR_SPRITE_MAP[color];
  const model = (state.player && state.player.inCar && state.player.carModel) || null;
  const spriteName = model || mapped || 'sedan';
  const needsTint = !!(model && color && mapped !== model);
  const img = carSprites[spriteName];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(1, 2, 15, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    // night headlight beams ahead of the hood
    if (typeof isNight === 'function' && isNight()) {
      ctx.fillStyle = 'rgba(255,240,180,.10)';
      ctx.beginPath();
      ctx.moveTo(-9, -18);
      ctx.lineTo(9, -18);
      ctx.lineTo(20, -58);
      ctx.lineTo(-20, -58);
      ctx.closePath();
      ctx.fill();
    }
    const w = 30;
    const h = Math.round(w * img.naturalHeight / img.naturalWidth);
    if (needsTint) {
      // resprayed: draw onto a scratch canvas and tint, so the body shape stays the stolen model
      if (!drawCar._scratch) {
        drawCar._scratch = document.createElement('canvas');
        drawCar._scratch.width = 40;
        drawCar._scratch.height = 80;
      }
      const sc = drawCar._scratch;
      const scx = sc.getContext('2d');
      scx.clearRect(0, 0, 40, 80);
      scx.drawImage(img, (40 - w) / 2, (80 - h) / 2, w, h);
      scx.globalCompositeOperation = 'source-atop';
      scx.fillStyle = color;
      scx.globalAlpha = .45;
      scx.fillRect(0, 0, 40, 80);
      scx.globalAlpha = 1;
      scx.globalCompositeOperation = 'source-over';
      ctx.drawImage(sc, -20, -40);
    } else {
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
    if (target) {
      ctx.strokeStyle = '#ffe78a';
      ctx.strokeRect(x - 16.5, y - 22.5, 33, 45);
    }
    return;
  }
  if (angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
  }
  // shadow
  px(ctx, x - 15, y - 19, 30, 40, 'rgba(0,0,0,.35)');
  // night headlights — beams ahead of the hood
  if (typeof isNight === 'function' && isNight()) {
    ctx.fillStyle = 'rgba(255,240,180,.10)';
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 18);
    ctx.lineTo(x + 9, y - 18);
    ctx.lineTo(x + 20, y - 58);
    ctx.lineTo(x - 20, y - 58);
    ctx.closePath();
    ctx.fill();
    px(ctx, x - 9, y - 19, 5, 3, '#fff3c4');
    px(ctx, x + 4, y - 19, 5, 3, '#fff3c4');
  }
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

const PARKED_CARS = {
  hub: [
    { id: 'hub1', x: 350, y: 238, color: '#3d6b35', speed: 190, name: 'a sensible sedan', desc: 'A forest-green sedan, five years old, Baby on Board sign long faded.', line: 'Keys in the visor. In THIS neighborhood. Somebody’s getting a stern note.' },
    { id: 'hub2', x: 1000, y: 240, color: '#b8a888', speed: 160, name: 'a wood-paneled station wagon', desc: 'A wood-paneled wagon parked at a careless angle, like the owner gave up mid-park.', line: 'The wagon. Slow, invisible, unstoppable. Like erosion.' }
  ],
  nyc: [
    { id: 'nyc1', x: 300, y: 240, color: '#2848a0', speed: 205, name: 'an ex-cop cruiser', desc: 'A blue cruiser-ish sedan with a spotlight bracket and a thinly veiled past.', line: 'Ex-cop car. Still smells like authority and stale coffee.' }
  ],
  queens: [
    { id: 'q1', x: 400, y: 240, color: '#a02828', speed: 230, name: 'a CORVETTE', desc: 'A red Corvette parked outside a Queens rowhouse, the single most optimistic object in the borough.', line: 'Somebody’s midlife crisis, curbside, unlocked. I’m doing them a favor. This was a cry for help.' },
    { id: 'q2', x: 150, y: 242, color: '#e8e4da', speed: 150, name: 'a mail truck', desc: 'A United States postal truck, driver\u2019s door open, engine ticking. Bundles of mail in the back — catalogues, mostly, and something that is definitely a jury summons.', line: 'A mail truck. FEDERAL vehicle. Newman is going to have a complete meltdown and honestly that alone is worth the gas.' }
  ]
};
const OUTDOOR_SCENES = ['hub', 'nyc', 'njstreet', 'pines', 'shore', 'ac', 'meadow', 'queens'];
function weatherRain() {
  if (!OUTDOOR_SCENES.includes(state.scene)) return 0;
  // rain for ~90s out of every 360s, offset so it doesn't sync with night
  const wt = state.time % 360;
  return wt > 240 && wt < 330 ? 1 : 0;
}

function weatherSnow() {
  if (!OUTDOOR_SCENES.includes(state.scene)) return 0;
  // thanksgiving-eve flurries: the cold first hour of every 6-minute cycle
  const wt = state.time % 360;
  return wt < 60 ? 1 : 0;
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
  // thanksgiving flurries — lazy drifting flakes, everywhere outdoors
  if (weatherSnow() && (state.mode === 'explore' || state.mode === 'transit')) {
    const t = state.time;
    for (let i = 0; i < 34; i++) {
      const fx = ((i * 97 + t * (8 + (i % 5) * 4)) % 680) - 20 + Math.sin(t * .8 + i) * 14;
      const fy = ((i * 71 + t * (12 + (i % 3) * 6)) % 400) - 20;
      ctx.fillStyle = `rgba(240,246,255,${.4 + (i % 3) * .15})`;
      ctx.fillRect(fx, fy, 2, 2);
    }
    if (Math.random() < .002) audio.tone(1200 + Math.random() * 400, .03, 'sine', .004);
  }
  // day/night cycle for the outdoor open world — 4-minute days, warm dusk, blue night
  if (OUTDOOR_SCENES.includes(state.scene) && (state.mode === 'explore' || state.mode === 'monte')) {
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
  else if (state.mode === 'slots') drawSlots();
  else if (state.mode === 'racing') drawRacing();
  else if (state.mode === 'darts') drawDarts();
  else if (state.mode === 'skeeball') drawSkeeball();
  else if (state.mode === 'pinball') drawPinball();
  else if (state.mode === 'poker') drawPoker();
  else if (state.mode === 'kitchen') drawKitchen();
  else if (state.mode === 'danceoff') drawDanceOff();
  else if (state.mode === 'roulette') drawRoulette();
  else if (state.mode === 'craps') drawCraps();
  else if (state.mode === 'fasttravel') drawFastTravel();
  else if (state.mode === 'trivia') drawTrivia();
  else if (state.mode === 'claw') drawClaw();
  else if (state.mode === 'fishing') drawFishing();
  else if (state.mode === 'trot') drawTrot();
  else if (state.mode === 'strength') drawStrength();
  else if (state.mode === 'goosechase') drawGooseChase();
  else if (state.mode === 'bonus') drawBonus();
  else if (state.mode === 'produce') drawProduce();
  else if (state.mode === 'ending') drawEnding();
  else drawWorld();
  if (state.mode === 'explore') drawExitHints();

  if (state.mode === 'menu') drawMenu();
  drawAtmosphere();
  if (!['title', 'ending', 'dream', 'bone', 'peptides', 'drive', 'bonus', 'produce', 'menu', 'transit', 'monte', 'armwrestle', 'fasttravel'].includes(state.mode)) drawObjective();
  if (state.mode === 'explore') drawPrompt(nearestInteraction());
  drawPhoneIncoming();
  if (state.mode !== 'menu') drawDialog();
  drawWasted();
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
  state.money = 0;
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

function checkMissionHeatBreach() {
  const m = state.mission;
  if (!m || !MISSION_DEFS[m.id] || !MISSION_DEFS[m.id].maxHeat) return;
  if (state.mode === 'transit') return; // let the trip finish — the failure fires on arrival
  if ((state.flags.heat || 0) >= MISSION_DEFS[m.id].maxHeat) {
    state.mission = null;
    audio.sfx('denied');
    startDialog([
      { speaker: 'narrator', text: 'Heat. You generated HEAT. The whole point — the ONE point — was no heat. Somewhere across the river, Dr. Melfi crosses out today’s date in her appointment book, twice, angrily.' },
      { speaker: state.player.kind === 'george' ? 'george' : 'tony', text: state.player.kind === 'george' ? 'The heat GENERATED ITSELF! I’m heat-adjacent at worst!' : 'Ah, maronn’. She’s gonna use the disappointed voice. I HATE the disappointed voice.' },
      { speaker: 'system', text: 'MISSION FAILED — the exercise was impulse control. Talk to Dr. Melfi to retry.' }
    ]);
  }
}

function update(dt) {
  if (state.wasted) { updateWasted(dt); return; }
  updateFares(dt);
  state.frameCount = (state.frameCount || 0) + 1;
  const overlayMode = ['menu', 'fasttravel', 'dialogue'].includes(state.mode);
  if (state._overlayMode !== overlayMode) {
    state._overlayMode = overlayMode;
    document.body.classList.toggle('overlayOpen', overlayMode);
  }
  state.time += dt;
  checkMissionHeatBreach();
  updateMovers(dt);
  for (const e of state.effects) e.t += dt;
  if (state.toastMsg) { state.toastMsg.t -= dt; if (state.toastMsg.t <= 0) state.toastMsg = null; }
  state.effects = state.effects.filter((e) => e.t < e.life);
  if (consume(['KeyN'])) {
    const on = audio.toggle();
    document.getElementById('muteBtn').textContent = on ? 'Sound' : 'Muted';
  }
  if (state.help && consume(cancelCodes)) state.help = false;
  if (state.mode !== 'kitchen' && consume(['Escape', 'KeyP', 'KeyM'])) {
    if (state.mode === 'menu') closeMenu();
    else openMenu();
  }
  if (state.mode === 'menu') {
    if (!state.menu) { state.mode = 'explore'; return; }
    const entries = menuEntries();
    state.menuStickT = (state.menuStickT || 0) - dt;
    const mi = moveInput();
    if (Math.abs(mi.y) > .5 && state.menuStickT <= 0) {
      state.menu.sel = (state.menu.sel + (mi.y > 0 ? 1 : -1) + entries.length) % entries.length;
      state.menuStickT = .22;
      audio.sfx('pickup');
    }
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
  if (state.mode === 'explore' && state.flags.freeRoam && consume(['KeyT'])) {
    state.mode = 'fasttravel';
    state.ftSel = 0;
    pressed.clear();
    return;
  }
  if (state.mode === 'fasttravel') {
    state.ftStickT = (state.ftStickT || 0) - dt;
    if (typeof state.ftSel !== 'number' || isNaN(state.ftSel)) state.ftSel = 0;
    const fi = moveInput();
    if (Math.abs(fi.y) > .5 && state.ftStickT <= 0) {
      state.ftSel = (state.ftSel + (fi.y > 0 ? 1 : -1) + FT_NODES.length) % FT_NODES.length;
      state.ftStickT = .22;
      audio.sfx('pickup');
    }
    if (consume(['ArrowUp', 'KeyW'])) { state.ftSel = (state.ftSel - 1 + FT_NODES.length) % FT_NODES.length; audio.sfx('pickup'); }
    if (consume(['ArrowDown', 'KeyS'])) { state.ftSel = (state.ftSel + 1) % FT_NODES.length; audio.sfx('pickup'); }
    if (state.ftSel === undefined) state.ftSel = 0;
    if (consume(['KeyE', 'Space', 'Enter'])) {
      const n = FT_NODES[state.ftSel];
      if (n.id === state.scene) { state.mode = state.dialog ? 'dialogue' : 'explore'; toast('You’re already here.'); }
      else { state.flags.freeRoam = true; startTransit(n.id, n.dx, n.dy, n.flavor); }
      pressed.clear();
      return;
    }
    if (consume(['Escape', 'KeyT'])) { state.mode = state.dialog ? 'dialogue' : 'explore'; pressed.clear(); }
    return;
  }
  if (consume(['KeyH']) && state.mode === 'explore') {
    state.help = !state.help;
    pressed.clear();
  }
  if (!['title', 'ending', 'kitchen'].includes(state.mode) && !(state.player.inCar && state.mode === 'explore') && consume(['KeyR'])) {
    const nowT = performance.now();
    if (state._resetArmT && nowT - state._resetArmT < 1500) {
      state._resetArmT = 0;
      resetGame();
      pressed.clear();
      return;
    }
    state._resetArmT = nowT;
    toast('Tap ↻ again to restart — progress since your last save is lost. Once more with feeling.');
    pressed.clear();
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
  } else if (state.mode === 'strength') {
    const st = state.strength;
    const dt2 = dt;
    if (st.swinging) {
      st.t += dt2 * 2.4 * st.dir;
      if (st.t >= 1) { st.t = 1; st.dir = -1; }
      if (st.t <= 0) { st.t = 0; st.dir = 1; }
      if (consume(['KeyE', 'Space'])) {
        st.swinging = false;
        st.power = st.t;
        st.resultT = 1.6;
        const pw = st.power;
        st.result = pw >= .95 ? 'bell' : pw >= .7 ? 'big' : pw >= .4 ? 'ok' : 'weak';
        if (pw >= .95) { state.money += 50; audio.sfx('cash'); }
        else if (pw >= .7) { state.money += 15; audio.sfx('pickup'); }
        else if (pw >= .4) { state.money += 5; audio.sfx('pickup'); }
        else audio.sfx('whiff');
      }
    } else {
      st.resultT -= dt2;
      if (st.resultT <= 0 || consume(['KeyE', 'Space'])) {
        state.mode = 'explore';
        const lines = {
          bell: state.player.kind === 'tony' ? 'DING DING DING! The carnie goes pale. "$50, pal. Please don’t come back."' : 'DING! GEORGE RINGS THE BELL! He will mention this at every meal for a decade. $50!',
          big: 'A solid crack — the puck stops just short. The carnie flips you $15. "Again?"',
          ok: 'Halfway up. You get your $5 back. The carnie respects the honesty of the attempt.',
          weak: 'The puck barely leaves the pad. Somewhere, a seagull laughs. They are learning.'
        };
        startDialog([{ speaker: 'narrator', text: lines[st.result] }]);
        state.strength = null;
      }
    }
  } else if (state.mode === 'trot') {
    const tr = state.trot;
    if (!tr) { state.mode = 'explore'; return; }
    const wps = [[250, 200], [600, 200], [600, 370], [250, 370]];
    tr.t += dt;
    if (!tr.done) {
      const wp = wps[tr.wp % wps.length];
      const pd = Math.hypot(state.player.x - wp[0], state.player.y - wp[1]);
      if (pd < 30 && tr.wp < wps.length) { tr.wp += 1; audio.sfx('pickup'); }
      // turkey runs its own pace — fast, unbothered, majestic
      if (state.turkey) {
        const tk = state.turkey;
        const twp = wps[(tk.trotWp || 0) % wps.length];
        const td = Math.hypot(tk.x - twp[0], tk.y - twp[1]);
        if (td < 20) tk.trotWp = (tk.trotWp || 0) + 1;
        else {
          tk.x += (twp[0] - tk.x) / td * 95 * dt;
          tk.y += (twp[1] - tk.y) / td * 95 * dt;
        }
        if ((tk.trotWp || 0) >= wps.length && !tr.turkeyDone) tr.turkeyDone = true;
      }
      if (tr.wp >= wps.length) {
        tr.done = true;
        state.mode = 'explore';
        state.flags.trotCd = state.time + 60;
        if (state.turkey) state.turkey.racing = false;
        const won = !tr.turkeyDone;
        if (won) {
          state.money += 75;
          audio.sfx('cash');
          startDialog([{ speaker: 'narrator', text: 'YOU BEAT THE TURKEY. The crowd — three neighbors and a dog — goes mild. $75 in prize money, because North Caldwell takes its turkey racing seriously. The turkey regards you with new respect, which for a turkey looks identical to contempt.' }]);
        } else {
          startDialog(state.player.kind === 'george' ? [
            { speaker: 'narrator', text: 'The turkey wins. It isn’t close. George walks off the course with the dignity of a man who has lost to poultry before and will again.' },
            { speaker: 'george', text: 'It TOOK the INSIDE LINE! That bird has racing instincts! I want a rematch! I want a drug test! ON THE BIRD!' }
          ] : [{ speaker: 'narrator', text: 'The turkey wins wire to wire. Tony nods once. “Bird wanted it more,” he tells a neighbor, and means it as a compliment to the bird, which is somehow worse.' }]);
        }
      } else if (tr.t > tr.limit) {
        tr.done = true;
        state.mode = 'explore';
        state.flags.trotCd = state.time + 60;
        if (state.turkey) state.turkey.racing = false;
        startDialog([{ speaker: 'narrator', text: 'Time expires mid-block. The turkey finished minutes ago and is now doing whatever turkeys do with victory. The registration table has packed up. Even the dog left.' }]);
      }
    }
  } else if (state.mode === 'fishing') {
    const f = state.fishing;
    if (!f) { state.mode = 'explore'; return; }
    if (f.phase === 'cast') {
      f.t -= dt;
      if (f.t <= 0) { f.phase = 'bite'; f.window = .7; audio.sfx('splash'); spawnEffect(170, 200, '!', '#8fd8ff'); }
    } else if (f.phase === 'bite') {
      f.window -= dt;
      if (consume(['KeyE', 'Space'])) {
        state.mode = 'explore';
        state.fishing = null;
        const roll = Math.random();
        audio.sfx('cash');
        if (roll < .12) {
          state.money += 85;
          startDialog([{ speaker: 'narrator', text: 'You yank at exactly the right moment — a striped bass, a beauty, thirty inches of pure fight. The pier applauds. A man in a bucket hat pays you $85 for it on the spot because this is the Jersey Shore and everything is for sale.' }]);
        } else if (roll < .45) {
          state.money += 18;
          startDialog([{ speaker: 'narrator', text: 'A sea robin — ugly, edible, technically a fish. The bait shop gives you $18 for it without making eye contact.' }]);
        } else if (roll < .6) {
          startDialog(state.player.kind === 'george' ? [
            { speaker: 'narrator', text: 'You reel in a boot. Inside the boot: a smaller boot. George stares at the nested boots with the hollow eyes of a man confronting a metaphor.' },
            { speaker: 'george', text: 'A boot. In a boot. That’s my life. That’s literally — I’m the small boot, Jerry! THE SMALL BOOT!' }
          ] : [{ speaker: 'narrator', text: 'Tony reels in a boot containing a smaller boot. He nods slowly. He has questions for the ocean. He decides, wisely, not to ask them.' }]);
        } else {
          startDialog([{ speaker: 'narrator', text: 'Seaweed. A tremendous, triumphant mound of seaweed. The gulls are impressed. Nobody else is.' }]);
        }
      } else if (f.window <= 0) {
        state.mode = 'explore';
        state.fishing = null;
        startDialog([{ speaker: 'narrator', text: 'The bite comes and goes — you feel the line go slack with the particular emptiness of a missed fish. Somewhere below, a fish tells the story differently.' }]);
      }
    }
  } else if (state.mode === 'claw') {
    const cl = state.claw;
    if (!cl) { state.mode = 'explore'; return; }
    const mi = moveInput();
    if (cl.phase === 'aim') {
      cl.t -= dt;
      cl.x += (mi.x || (down(['ArrowLeft', 'KeyA']) ? -1 : down(['ArrowRight', 'KeyD']) ? 1 : 0)) * dt * .6;
      cl.x = Math.max(.05, Math.min(.95, cl.x));
      if (consume(['KeyE', 'Space']) || cl.t <= 0) {
        cl.phase = 'drop';
        cl.dropT = 1.3;
        audio.sfx('spin');
      }
    } else {
      cl.dropT -= dt;
      if (cl.dropT <= 0) {
        const dist = Math.abs(cl.x - cl.prize);
        state.mode = 'explore';
        state.claw = null;
        if (dist < .07) {
          const prize = Math.random();
          const payout = prize < .1 ? 100 : prize < .4 ? 25 : 10;
          state.money += payout;
          audio.sfx('cash');
          startDialog([{ speaker: 'narrator', text: `The claw descends, closes with actual conviction, and lifts — a prize! The machine releases it with visible reluctance. Inside the plush turkey: $${payout}, because this is Jersey and even the toys are mobbed up.` }]);
        } else if (dist < .15) {
          startDialog([{ speaker: 'narrator', text: 'The claw grazes the prize, wobbles it meaningfully, and lifts nothing. The prize settles back with a smugness that should be impossible in plush. The machine does not care. The machine has seen everything.' }]);
        } else {
          startDialog([{ speaker: 'narrator', text: 'The claw closes on empty air with the weak grip of a machine that was never intended to prize anything. Somewhere, a carnie laughs in advance.' }]);
        }
      }
    }
  } else if (state.mode === 'trivia') {
    const tv = state.trivia;
    if (!tv) { state.mode = 'explore'; return; }
    if (tv.resultT > 0) {
      tv.resultT -= dt;
      if (tv.resultT <= 0) {
        tv.i += 1;
        tv.pick = null;
        if (tv.i >= tv.qs.length) {
          const won = tv.right >= 2;
          state.mode = 'explore';
          if (won) { state.money += 50; audio.sfx('cash'); }
          startDialog([{ speaker: 'narrator', text: won ? `${tv.right}/3 correct! The trivia master — a man named Bubble — slides you $50 and mutters that the questions were too easy. They were not. They were never easy.` : `${tv.right}/3. Bubble shakes his head with the deep disappointment of a man who owns every encyclopedia. The $10 is gone, but the shame is free.` }]);
          state.trivia = null;
        }
      }
      return;
    }
    const q = tv.qs[tv.i];
    if (!q) { state.mode = 'explore'; state.trivia = null; return; }
    const mi = moveInput();
    if (consume(['ArrowLeft', 'KeyA']) || mi.x < -.5) tv.pick = 0;
    if (consume(['ArrowRight', 'KeyD']) || mi.x > .5) tv.pick = 1;
    if (consume(['Digit1'])) tv.pick = 0;
    if (consume(['Digit2'])) tv.pick = 1;
    if (tv.pick !== null && consume(['KeyE', 'Space'])) {
      const correct = q.opts[tv.pick] === q.a;
      if (correct) { tv.right += 1; audio.sfx('pickup'); } else audio.sfx('thud');
      tv.lastCorrect = correct;
      tv.resultT = 1.1;
    }
    if (consume(['Escape', 'KeyQ'])) { state.mode = 'explore'; state.trivia = null; }
  } else if (state.mode === 'craps') {
    const c = state.craps;
    if (c.phase === 'choose') {
      const mi = moveInput();
      if (consume(['ArrowLeft', 'KeyA']) || consume(['Digit1']) || (mi.x < -.5)) c.pick = 'under';
      if (consume(['ArrowRight', 'KeyD']) || consume(['Digit2']) || (mi.x > .5)) c.pick = 'over';
      if (consume(['Escape', 'KeyQ'])) { state.mode = 'explore'; state.craps = null; return; }
      if (c.pick && consume(['KeyE', 'Space'])) {
        state.money -= c.bet;
        c.phase = 'roll';
        c.t = 0;
        c.d1 = 1 + Math.floor(Math.random() * 6);
        c.d2 = 1 + Math.floor(Math.random() * 6);
        audio.sfx('spin');
      }
    } else if (c.phase === 'roll') {
      c.t += dt;
      if (c.t > 1.2) {
        c.phase = 'done';
        const total = c.d1 + c.d2;
        const over = total >= 8;
        c.win = (c.pick === 'over') === over && total !== 7;
        c.seven = total === 7;
        if (c.win) { state.money += c.bet * 2; audio.sfx('cash'); }
        else audio.sfx('thud');
        c.resultT = 1.4;
      }
    } else if (c.phase === 'done') {
      c.resultT -= dt;
      if (c.resultT <= 0 || consume(['KeyE', 'Space'])) {
        const total = c.d1 + c.d2;
        state.mode = 'explore';
        const tone = c.seven ? 'Seven. The house always eats sevens. Paulie nods like he invented math.' : c.win ? `The dice come up ${total}. “Winner,” the dealer mutters, sliding you $${c.bet * 2}. Silvio applauds once. Once.` : `The dice come up ${total}. Wrong side. The dealer’s face does not move. It never moves.`;
        startDialog([{ speaker: 'narrator', text: tone }]);
        state.craps = null;
      }
    }
  } else if (state.mode === 'slots') {
    updateSlots(dt);
  } else if (state.mode === 'racing') {
    updateRacing(dt);
  } else if (state.mode === 'darts') {
    updateDarts(dt);
  } else if (state.mode === 'skeeball') {
    updateSkeeball(dt);
  } else if (state.mode === 'pinball') {
    updatePinball(dt);
  } else if (state.mode === 'poker') {
    updatePoker(dt);
  } else if (state.mode === 'kitchen') {
    updateKitchen(dt);
  } else if (state.mode === 'danceoff') {
    updateDanceOff(dt);
  } else if (state.mode === 'roulette') {
    updateRoulette(dt);
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
