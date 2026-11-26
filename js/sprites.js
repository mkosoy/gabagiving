export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function outlineText(ctx, text, x, y, color = '#fff', size = 8, align = 'left') {
  ctx.font = `${size}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#07101e';
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function wrapText(ctx, text, maxWidth, size = 9) {
  ctx.font = `${size}px ui-monospace, Menlo, Consolas, monospace`;
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function skinShadow(ctx, x, y, w = 16) {
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 20, w * .48, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function loadSprite(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const illustratedSprites = {
  tony: loadSprite('./assets/sprites/tony.webp'),
  aj: loadSprite('./assets/sprites/aj.webp'),
  carmela: loadSprite('./assets/sprites/carmela.webp'),
  paulie: loadSprite('./assets/sprites/paulie.webp'),
  augustus: loadSprite('./assets/sprites/augustus.webp'),
  jerry: loadSprite('./assets/sprites/jerry.webp'),
  george: loadSprite('./assets/sprites/george.webp'),
  kramer: loadSprite('./assets/sprites/kramer.webp'),
  elaine: loadSprite('./assets/sprites/elaine.webp'),
  meadow: loadSprite('./assets/sprites/meadow.webp'),
  melfi: loadSprite('./assets/sprites/melfi.webp'),
  christopher: loadSprite('./assets/sprites/christopher.webp'),
  silvio: loadSprite('./assets/sprites/silvio.webp'),
  bobby: loadSprite('./assets/sprites/bobby.webp'),
  artie: loadSprite('./assets/sprites/artie.webp'),
  irina: loadSprite('./assets/sprites/irina.webp'),
  junior: loadSprite('./assets/sprites/junior.webp'),
  janice: loadSprite('./assets/sprites/janice.webp'),
  plav: loadSprite('./assets/sprites/plav.webp'),
  romanGuard: loadSprite('./assets/sprites/romanGuard.webp'),
  romanSenator: loadSprite('./assets/sprites/romanSenator.webp'),
  romanNoblewoman: loadSprite('./assets/sprites/romanNoblewoman.webp'),
  romanCitizen: loadSprite('./assets/sprites/romanCitizen.webp'),
  romanCitizenWoman: loadSprite('./assets/sprites/romanCitizenWoman.webp'),
  romanPerformer: loadSprite('./assets/sprites/romanPerformer.webp')
};

const spriteAliases = {
  tonyMax: 'tony',
  womanA: 'carmela',
  womanB: 'meadow',
  womanC: 'janice',
  womanD: 'irina',
  guard: 'romanGuard'
};
function canonicalSpriteKind(kind) { return spriteAliases[kind] || kind; }

function drawIllustratedPerson(ctx, x, y, img, kind, dir, frame, options) {
  const pose = options.pose || 'stand';
  const heights = { tony: 47, aj: 41, carmela: 43, paulie: 43, augustus: 49, jerry: 43, george: 38, kramer: 49, elaine: 42, meadow: 44, melfi: 45, christopher: 45, silvio: 46, bobby: 46, artie: 44, irina: 44, junior: 42, janice: 44, plav: 45, romanGuard: 48, romanSenator: 46, romanNoblewoman: 45, romanCitizen: 43, romanCitizenWoman: 43, romanPerformer: 46 };
  let h = (heights[kind] || 43) * (options.scale ? options.scale / 1.18 : 1);
  let w = h * img.naturalWidth / img.naturalHeight;
  const sitting = pose === 'sit';
  if (sitting) {
    h *= .86;
    w *= .94;
  }
  if (kind === 'kramer' && pose !== 'burst') w *= .72; // crop visual emphasis toward Kramer when not using the door-burst pose
  const bob = pose === 'stand' || pose === 'watch' ? Math.sin(frame * .55) * 1.2 : Math.sin(frame * .35) * .45;
  const bottom = y + 31 + (sitting ? 4 : 0);
  const cx = x + 10;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  ctx.beginPath();
  ctx.ellipse(cx, bottom + 1, Math.max(9, w * .32), 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(cx, bottom + bob * .3);
  const tilt = pose === 'lean' ? -.08 : pose === 'angry' ? .05 : pose === 'burst' ? -.05 : 0;
  ctx.rotate(tilt + Math.sin(frame * .25) * .008);
  if (dir === 'left' && kind !== 'kramer') ctx.scale(-1, 1);
  const drawX = kind === 'kramer' && pose !== 'burst' ? -w * .62 : -w / 2;
  // illustrated sprites are smooth art, not pixel art: high-quality scaling keeps them crisp
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, Math.round(drawX), Math.round(-h + bob), Math.round(w), Math.round(h));
  ctx.imageSmoothingEnabled = false;
  ctx.restore();
}

const palettes = {
  tony: { skin: '#c8875f', hair: '#27201d', shirt: '#5a1f2e', pants: '#242333', shoes: '#17151a', accent: '#d4aa45' },
  tonyMax: { skin: '#d29a70', hair: '#1d1918', shirt: '#212636', pants: '#151722', shoes: '#101014', accent: '#68d4ff' },
  aj: { skin: '#c89166', hair: '#1f1a17', shirt: '#20242d', pants: '#263a58', shoes: '#101014', accent: '#79ff9d' },
  augustus: { skin: '#d9a476', hair: '#d7c17a', shirt: '#f4e4c6', pants: '#a52531', shoes: '#6d3b24', accent: '#f0c33c' },
  jerry: { skin: '#c99066', hair: '#38251c', shirt: '#202b44', pants: '#30364a', shoes: '#15161c', accent: '#f1f1e9' },
  george: { skin: '#d19a73', hair: '#5b473a', shirt: '#7d3f32', pants: '#2f4054', shoes: '#15161c', accent: '#dbc07e' },
  kramer: { skin: '#d5a075', hair: '#4a2c1d', shirt: '#7b4b87', pants: '#283b54', shoes: '#15161c', accent: '#e8c05e' },
  elaine: { skin: '#d59a72', hair: '#4c2b22', shirt: '#365c87', pants: '#50314f', shoes: '#15161c', accent: '#e7e0c6' },
  christopher: { skin: '#c88e63', hair: '#211c18', shirt: '#273445', pants: '#1f2732', shoes: '#121217', accent: '#a8d2ff' },
  paulie: { skin: '#cf976c', hair: '#d8d8cf', shirt: '#3f4b35', pants: '#2c2f39', shoes: '#121217', accent: '#c5c5bd' },
  paulieSuit: { skin: '#cf976c', hair: '#d8d8cf', shirt: '#151a2b', pants: '#10131f', shoes: '#08090d', accent: '#f1e7c8' },
  womanA: { skin: '#d69a70', hair: '#c16d32', shirt: '#a33155', pants: '#3a2746', shoes: '#17161c', accent: '#ffd2df' },
  womanB: { skin: '#b97954', hair: '#17110f', shirt: '#2d6f80', pants: '#2d3852', shoes: '#17161c', accent: '#bdf7ff' },
  womanC: { skin: '#e0aa7e', hair: '#e0c06c', shirt: '#6c3e95', pants: '#3c294d', shoes: '#17161c', accent: '#f6e6ff' },
  womanD: { skin: '#c98d64', hair: '#54301e', shirt: '#bd7b27', pants: '#3a2b42', shoes: '#17161c', accent: '#fff0a0' },
  bobby: { skin: '#d19a73', hair: '#6b4b36', shirt: '#4b5f77', pants: '#303645', shoes: '#15161c', accent: '#d8e5f2' },
  artie: { skin: '#cf966b', hair: '#3a2a22', shirt: '#e8e1cf', pants: '#333844', shoes: '#15161c', accent: '#c7483d' },
  irina: { skin: '#d59a72', hair: '#191413', shirt: '#9c2345', pants: '#2d2538', shoes: '#17161c', accent: '#ffd0dc' },
  junior: { skin: '#cf976c', hair: '#b8b8ad', shirt: '#4b3c35', pants: '#2c2f39', shoes: '#121217', accent: '#d8d0bd' },
  silvio: { skin: '#c99066', hair: '#2b211e', shirt: '#2f243e', pants: '#22202e', shoes: '#121217', accent: '#bab4d8' },
  carmela: { skin: '#d69d73', hair: '#caa15b', shirt: '#7d3042', pants: '#2c2f42', shoes: '#17161c', accent: '#f0d47c' },
  meadow: { skin: '#d59a72', hair: '#3a241e', shirt: '#755aa8', pants: '#2d3852', shoes: '#17161c', accent: '#e8d5ff' },
  melfi: { skin: '#d8a47c', hair: '#b7b0a5', shirt: '#263447', pants: '#34313b', shoes: '#17161c', accent: '#d8d0bd' },
  plav: { skin: '#d99b68', hair: '#151312', shirt: '#111722', pants: '#171c26', shoes: '#08090d', accent: '#8ffff2' },
  janice: { skin: '#cf9068', hair: '#5c251e', shirt: '#71305d', pants: '#3a2746', shoes: '#17161c', accent: '#f06eaa' },
  guard: { skin: '#c89166', hair: '#40302a', shirt: '#9a2e32', pants: '#5e5960', shoes: '#4b3224', accent: '#d5b45a' }
};

export function drawPerson(ctx, x, y, kind = 'tony', dir = 'down', frame = 0, options = {}) {
  const spriteKind = canonicalSpriteKind(kind);
  const illustrated = illustratedSprites[spriteKind];
  if (illustrated?.complete && illustrated.naturalWidth) {
    drawIllustratedPerson(ctx, x, y, illustrated, spriteKind, dir, frame, options);
    return;
  }
  const p = palettes[kind] || palettes.tony;
  const maxxed = kind === 'tonyMax' || options.maxxed;
  const pose = options.pose || 'stand';
  const wide = ((kind === 'tony' || kind === 'bobby' || kind === 'junior') && !maxxed) ? 3 : (kind === 'george' ? 2 : 0);
  const tall = kind === 'kramer' || kind === 'augustus' ? 3 : 0;
  const short = kind === 'george' ? -2 : 0;
  const idle = Math.sin(frame * .9 + x * .13) * .8;
  const walk = Math.sin(frame * .55) * 1.6;
  const sitting = pose === 'sit';
  const lean = pose === 'lean' ? 2 : 0;
  const bodyY = y + (sitting ? 5 : 0) + (pose === 'work' ? 1 : 0);
  const cx = x + lean;

  // Slightly oversized RPG sprites read better against the detailed illustrated rooms.
  const spriteScale = options.scale || 1.18;
  ctx.save();
  ctx.translate(x + 10, y + 31);
  ctx.scale(spriteScale, spriteScale);
  ctx.translate(-(x + 10), -(y + 31));

  // soft contact shadow
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(cx + 11, y + (sitting ? 25 : 31) + tall, sitting ? 13 : 10 + wide * .4, sitting ? 3 : 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs / seated knees
  const legY = y + 20 + tall + short;
  if (sitting) {
    px(ctx, cx + 2, legY - 1, 8, 4, p.pants);
    px(ctx, cx + 11 + wide, legY - 1, 8, 4, p.pants);
    px(ctx, cx + 1, legY + 3, 7, 2, p.shoes);
    px(ctx, cx + 14 + wide, legY + 3, 7, 2, p.shoes);
  } else {
    const step = pose === 'stand' ? walk * .35 : walk * .12;
    px(ctx, cx + 5, legY + step, 4, 9 - short, p.pants);
    px(ctx, cx + 11 + wide, legY - step, 4, 9 - short, p.pants);
    px(ctx, cx + 4, legY + 7 - short, 6, 3, p.shoes);
    px(ctx, cx + 11 + wide, legY + 7 - short, 6, 3, p.shoes);
  }

  // torso with outline and clothing shape
  const torsoX = cx + 2 - wide * .5;
  const torsoY = bodyY + 9 + tall * .4;
  const torsoW = 18 + wide;
  px(ctx, torsoX - 1, torsoY - 1, torsoW + 2, 14, '#171119');
  px(ctx, torsoX, torsoY, torsoW, 13, p.shirt);
  px(ctx, torsoX + 1, torsoY + 1, torsoW - 2, 3, 'rgba(255,255,255,.08)');
  if (kind === 'augustus') {
    px(ctx, torsoX + 2, torsoY + 1, torsoW - 4, 4, '#fff1d1');
    px(ctx, torsoX + torsoW - 6, torsoY, 5, 14, '#a91f31');
    px(ctx, torsoX + 4, torsoY + 8, 4, 2, p.accent);
  }
  if (kind === 'jerry') {
    px(ctx, torsoX + 6, torsoY + 1, 6, 11, '#efeee2');
    px(ctx, torsoX + 8, torsoY + 2, 2, 8, '#2c4f7d');
  }
  if (kind === 'artie') {
    px(ctx, torsoX + 3, torsoY + 1, torsoW - 6, 10, '#f1eadc');
    px(ctx, torsoX + 8, torsoY + 2, 2, 9, '#b8ac98');
  }
  if (kind === 'aj') {
    px(ctx, torsoX - 2, torsoY - 1, torsoW + 4, 5, '#11151d');
    px(ctx, torsoX + 4, torsoY + 2, torsoW - 8, 8, '#1c2029');
    px(ctx, torsoX + 7, torsoY + 3, 4, 1, '#313947');
    px(ctx, torsoX + 8, torsoY + 8, 2, 5, '#11151d');
  }
  if (kind === 'tony' || kind === 'tonyMax') {
    px(ctx, torsoX + 7, torsoY + 1, 3, 11, p.accent);
    px(ctx, torsoX + 4, torsoY + 5, torsoW - 8, 1, '#d4aa45');
  }
  if (kind === 'paulieSuit') {
    px(ctx, torsoX + 6, torsoY, 6, 12, '#f1e7c8');
    px(ctx, torsoX + 8, torsoY + 2, 2, 7, '#25212b');
  }
  if (kind.startsWith('woman') || kind === 'elaine' || kind === 'irina' || kind === 'janice' || kind === 'carmela' || kind === 'meadow' || kind === 'melfi') {
    px(ctx, torsoX + 4, torsoY + 2, torsoW - 8, 2, p.accent);
  }

  // arms and pose-specific gestures
  const armY = torsoY + 2;
  const skin = p.skin;
  if (pose === 'burst' || pose === 'perform') {
    px(ctx, cx - 1, armY - 6 - idle, 4, 10, skin);
    px(ctx, cx + 18 + wide, armY - 6 + idle, 4, 10, skin);
    px(ctx, cx - 2, armY - 8 - idle, 5, 3, skin);
    px(ctx, cx + 18 + wide, armY - 8 + idle, 5, 3, skin);
  } else if (pose === 'phone') {
    px(ctx, cx, armY + 1, 4, 9, skin);
    px(ctx, cx + 15 + wide, armY - 1, 4, 7, skin);
    px(ctx, cx + 15 + wide, armY - 3, 5, 4, '#111827');
    px(ctx, cx + 16 + wide, armY - 2, 3, 2, '#67f5a0');
  } else if (pose === 'angry' || pose === 'imperial') {
    px(ctx, cx - 1, armY + Math.sin(frame) * 1, 4, 9, skin);
    px(ctx, cx + 17 + wide, armY - 2, 5, 7, skin);
  } else if (sitting) {
    px(ctx, cx + 1, armY + 2, 4, 7, skin);
    px(ctx, cx + 15 + wide, armY + 2, 4, 7, skin);
  } else {
    px(ctx, cx, armY - walk * .15, 4, 10, skin);
    px(ctx, cx + 17 + wide, armY + walk * .15, 4, 10, skin);
  }

  // neck and outlined head
  const headX = cx + 3 - wide * .25;
  const headY = bodyY + short;
  const headW = 15 + wide;
  px(ctx, headX + 5, headY + 10, 6, 3, skin);
  px(ctx, headX - 1, headY - 1, headW + 2, 14, '#171119');
  px(ctx, headX, headY, headW, 13, skin);
  px(ctx, headX + 1, headY + 1, headW - 2, 3, 'rgba(255,255,255,.10)');
  px(ctx, headX + 1, headY + 9, headW - 2, 3, 'rgba(107,55,38,.20)');
  // ears and nose
  px(ctx, headX - 1, headY + 5, 2, 4, skin);
  px(ctx, headX + headW - 1, headY + 5, 2, 4, skin);
  if (dir !== 'up') {
    const noseShift = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    px(ctx, headX + 7 + wide / 2 + noseShift, headY + 6, 3, 2, '#a86143');
  }

  // hair, hats, glasses, and character silhouettes
  if (kind === 'augustus') {
    px(ctx, headX + 1, headY - 3, headW - 2, 4, '#3a251b');
    px(ctx, headX, headY - 2, headW, 3, '#d6b93e');
    for (let i = 0; i < 4; i++) px(ctx, headX + 2 + i * 4, headY - 4 - (i % 2), 3, 2, '#6aa84f');
    px(ctx, headX + 3, headY + 10, headW - 6, 2, '#9d6042'); // marble jaw
  } else if (kind === 'kramer') {
    px(ctx, headX - 1, headY - 5, headW + 2, 6, p.hair);
    px(ctx, headX - 3, headY - 1, 4, 8, p.hair);
    px(ctx, headX + headW - 1, headY - 2, 4, 9, p.hair);
    px(ctx, headX + 3, headY - 8, headW - 6, 4, '#2c1711');
  } else if (kind === 'elaine' || kind === 'janice' || kind === 'meadow' || kind === 'melfi' || kind === 'carmela' || kind === 'irina' || kind.startsWith('woman')) {
    px(ctx, headX - 1, headY - 3, headW + 2, 6, p.hair);
    px(ctx, headX - 2, headY + 2, 4, 11, p.hair);
    px(ctx, headX + headW - 2, headY + 2, 4, 11, p.hair);
    if (kind === 'janice') px(ctx, headX - 3, headY - 1, headW + 6, 5, p.hair);
  } else if (kind === 'george') {
    px(ctx, headX + 1, headY + 1, 4, 5, p.hair);
    px(ctx, headX + headW - 5, headY + 1, 4, 5, p.hair);
    px(ctx, headX + 2, headY + 5, 5, 4, '#1c222c');
    px(ctx, headX + headW - 7, headY + 5, 5, 4, '#1c222c');
    px(ctx, headX + 6, headY + 6, headW - 12, 1, '#1c222c');
  } else if (kind === 'paulie' || kind === 'paulieSuit') {
    px(ctx, headX + 4, headY - 2, headW - 8, 3, p.hair);
    px(ctx, headX, headY, 4, 8, '#eeeeE5');
    px(ctx, headX + headW - 4, headY, 4, 8, '#eeeeE5');
  } else if (kind === 'silvio') {
    px(ctx, headX, headY - 5, headW, 5, p.hair);
    px(ctx, headX + 3, headY - 8, headW - 6, 4, '#1b1514');
  } else if (kind === 'jerry') {
    px(ctx, headX, headY - 3, headW, 5, p.hair);
    px(ctx, headX + 3, headY - 5, headW - 6, 3, p.hair);
  } else if (kind === 'aj') {
    px(ctx, headX - 1, headY - 3, headW + 2, 5, p.hair);
    px(ctx, headX + 1, headY - 5, 4, 3, p.hair);
    px(ctx, headX + 6, headY - 6, 4, 4, p.hair);
    px(ctx, headX + 11, headY - 4, 4, 3, p.hair);
    px(ctx, headX + 2, headY + 1, 4, 3, p.hair);
    px(ctx, headX + 8, headY, 5, 2, p.hair);
  } else if (kind === 'bobby') {
    px(ctx, headX + 1, headY - 2, headW - 2, 4, p.hair);
    px(ctx, headX + 3, headY + 9, headW - 6, 3, '#6b4b36'); // beard
  } else {
    px(ctx, headX + 1, headY - 2, headW - 2, 4, p.hair);
    if (dir !== 'up') px(ctx, headX, headY + 1, 2, 5, p.hair);
  }

  // facial features
  if (dir !== 'up') {
    const eyeY = headY + 5;
    if (maxxed) {
      px(ctx, headX + 2, eyeY - 1, headW - 4, 3, '#0c1320');
      px(ctx, headX + 5, eyeY, 4, 1, '#76dcff');
      px(ctx, headX + 3, headY + 10, headW - 6, 2, '#8f5439');
    } else {
      const leftEye = dir === 'left' ? 2 : 4;
      const rightEye = dir === 'right' ? headW - 6 : headW - 5;
      px(ctx, headX + leftEye, eyeY, 2, 2, '#12151c');
      if (dir !== 'left' && dir !== 'right') px(ctx, headX + rightEye, eyeY, 2, 2, '#12151c');
      px(ctx, headX + 4, eyeY - 2, 3, 1, p.hair);
      px(ctx, headX + headW - 7, eyeY - 2, 3, 1, p.hair);
      px(ctx, headX + 6, headY + 10, Math.max(4, headW - 11), 1, '#70422f');
    }
    if (kind === 'aj') {
      px(ctx, headX - 2, headY + 2, 3, 8, '#22252d');
      px(ctx, headX + headW - 1, headY + 2, 3, 8, '#22252d');
      px(ctx, headX + 4, eyeY - 2, 4, 1, '#0d0f14');
      px(ctx, headX + headW - 8, eyeY - 2, 4, 1, '#0d0f14');
      px(ctx, headX + 5, headY + 11, 6, 1, '#4f3028');
    }
    if (kind === 'melfi') {
      px(ctx, headX + 3, eyeY - 1, 5, 3, '#20242a');
      px(ctx, headX + headW - 8, eyeY - 1, 5, 3, '#20242a');
    }
    if (kind === 'tony') {
      px(ctx, headX + 3, eyeY - 2, 5, 1, '#1c1715');
      px(ctx, headX + headW - 8, eyeY - 2, 5, 1, '#1c1715');
    }
  }
  ctx.restore();
}

export function drawPortrait(ctx, x, y, kind = 'tony') {
  const p = palettes[kind] || palettes.tony;
  px(ctx, x, y, 34, 34, '#1a2548');
  px(ctx, x + 2, y + 2, 30, 30, '#31477a');
  const illustrated = illustratedSprites[canonicalSpriteKind(kind)];
  if (illustrated?.complete && illustrated.naturalWidth) {
    const h = 31;
    const w = h * illustrated.naturalWidth / illustrated.naturalHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, 30, 30);
    ctx.clip();
    ctx.drawImage(illustrated, x + 17 - w / 2, y + 32 - h, w, h);
    ctx.restore();
    return;
  }
  px(ctx, x + 8, y + 9, 18, 17, p.skin);
  px(ctx, x + 7, y + 5, 20, 7, p.hair);
  if (kind === 'tonyMax') {
    px(ctx, x + 7, y + 13, 20, 4, '#0c1320');
    px(ctx, x + 10, y + 14, 6, 1, '#76dcff');
    px(ctx, x + 8, y + 24, 18, 2, '#9f5f3f');
  } else {
    px(ctx, x + 11, y + 15, 3, 2, '#111');
    px(ctx, x + 21, y + 15, 3, 2, '#111');
    px(ctx, x + 13, y + 22, 8, 2, '#714232');
  }
  if (kind === 'augustus') {
    px(ctx, x + 7, y + 3, 20, 4, '#d6b93e');
    px(ctx, x + 10, y + 1, 4, 3, '#6aa84f');
    px(ctx, x + 20, y + 1, 4, 3, '#6aa84f');
  }
  if (kind === 'kramer') {
    px(ctx, x + 5, y + 2, 24, 8, p.hair);
    px(ctx, x + 4, y + 8, 5, 7, p.hair);
    px(ctx, x + 25, y + 8, 5, 7, p.hair);
  }
  if (kind === 'elaine') {
    px(ctx, x + 5, y + 4, 24, 9, p.hair);
    px(ctx, x + 5, y + 10, 4, 15, p.hair);
    px(ctx, x + 25, y + 10, 4, 15, p.hair);
  }
  if (kind === 'paulie' || kind === 'paulieSuit') {
    px(ctx, x + 10, y + 5, 14, 4, p.hair);
    px(ctx, x + 6, y + 8, 4, 10, '#eeeeE5');
    px(ctx, x + 24, y + 8, 4, 10, '#eeeeE5');
  }
  if (kind === 'george') {
    px(ctx, x + 8, y + 7, 18, 5, p.skin); // bald crown
    px(ctx, x + 6, y + 10, 4, 9, p.hair);
    px(ctx, x + 24, y + 10, 4, 9, p.hair);
    px(ctx, x + 10, y + 14, 5, 4, '#20242a');
    px(ctx, x + 20, y + 14, 5, 4, '#20242a');
    px(ctx, x + 15, y + 15, 5, 1, '#20242a');
  }
  if (kind === 'jerry') {
    px(ctx, x + 6, y + 3, 22, 8, p.hair);
    px(ctx, x + 10, y + 1, 14, 3, p.hair);
  }
  if (kind === 'silvio') {
    px(ctx, x + 6, y + 2, 22, 8, p.hair);
    px(ctx, x + 10, y, 14, 4, '#1b1514');
  }
  if (kind === 'janice') {
    px(ctx, x + 4, y + 2, 26, 10, p.hair);
    px(ctx, x + 4, y + 10, 5, 16, p.hair);
    px(ctx, x + 25, y + 10, 5, 16, p.hair);
  }
  if (kind === 'meadow' || kind === 'carmela' || kind === 'melfi') {
    px(ctx, x + 5, y + 4, 24, 8, p.hair);
    px(ctx, x + 5, y + 10, 4, 14, p.hair);
    px(ctx, x + 25, y + 10, 4, 14, p.hair);
  }
  if (kind === 'melfi') {
    px(ctx, x + 10, y + 14, 5, 3, '#20242a');
    px(ctx, x + 20, y + 14, 5, 3, '#20242a');
  }
  if (kind === 'guard') px(ctx, x + 7, y + 3, 20, 6, '#b8b0a0');
}

export function drawTurkey(ctx, x, y, scale = 1, cooked = true) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (cooked) {
    px(ctx, -8, -4, 16, 9, '#a65327');
    px(ctx, -5, -7, 10, 4, '#c97838');
    px(ctx, -12, -2, 5, 3, '#e7d0a0');
    px(ctx, 7, -2, 5, 3, '#e7d0a0');
    px(ctx, -4, 2, 8, 2, '#7b351d');
  } else {
    px(ctx, -6, -5, 12, 11, '#7b4b35');
    px(ctx, -2, -11, 5, 7, '#8b5a3f');
    px(ctx, 2, -13, 4, 4, '#d34232');
    px(ctx, -11, -2, 5, 7, '#b7833f');
    px(ctx, 6, -2, 5, 7, '#b7833f');
    px(ctx, -1, -8, 2, 2, '#111');
  }
  ctx.restore();
}

export function drawBat(ctx, x, y, angle = -0.5) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  px(ctx, -3, -14, 6, 22, '#bd8650');
  px(ctx, -2, -22, 5, 9, '#d7a66a');
  px(ctx, -2, 8, 6, 4, '#5b3824');
  px(ctx, -1, -19, 2, 12, 'rgba(255,240,200,.35)');
  ctx.restore();
}

export function drawVial(ctx, x, y, t = 0, kind = 'normal') {
  const bob = Math.sin(t * 5 + x) * 2;
  const glass = kind === 'gold' ? 'rgba(255,210,90,.95)' : kind === 'bad' ? 'rgba(160,110,190,.95)' : 'rgba(120,220,255,.9)';
  const liquid = kind === 'gold' ? '#ffd849' : kind === 'bad' ? '#8c39bd' : '#52ff9a';
  px(ctx, x - 3, y - 7 + bob, 6, 10, glass);
  px(ctx, x - 2, y - 9 + bob, 4, 3, '#e6eef7');
  px(ctx, x - 2, y - 2 + bob, 4, 4, liquid);
  px(ctx, x - 1, y - 6 + bob, 2, 2, '#ffffff');
  if (kind !== 'normal') px(ctx, x - 6, y - 8 + bob, 12, 1, kind === 'gold' ? '#fff0a5' : '#e8a0ff');
}
