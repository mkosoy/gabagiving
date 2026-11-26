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
  const p = palettes[kind] || palettes.tony;
  const maxxed = kind === 'tonyMax' || options.maxxed;
  const wide = ((kind === 'tony' || kind === 'bobby' || kind === 'junior') && !maxxed) ? 2 : 0;
  const tall = kind === 'kramer' || kind === 'augustus' ? 2 : 0;
  const short = kind === 'george' ? -1 : 0;
  const step = Math.sin(frame * 0.35) * 1.2;
  skinShadow(ctx, x, y + tall, 17 + wide);

  // legs
  const legY = y + 13 + tall;
  px(ctx, x + 4, legY + (dir !== 'up' ? step * .35 : 0), 3, 6 - short, p.pants);
  px(ctx, x + 9 + wide, legY - (dir !== 'up' ? step * .35 : 0), 3, 6 - short, p.pants);
  px(ctx, x + 3, legY + 5 - short, 5, 2, p.shoes);
  px(ctx, x + 9 + wide, legY + 5 - short, 5, 2, p.shoes);

  // torso
  px(ctx, x + 2 - wide * .5, y + 7 + tall * .5, 13 + wide, 9, p.shirt);
  if (kind === 'augustus') {
    px(ctx, x + 2, y + 8, 13, 3, '#fff2d6');
    px(ctx, x + 10, y + 7, 4, 11, '#aa2634');
  }
  if (kind === 'jerry') px(ctx, x + 6, y + 8, 4, 7, '#efeee2');
  if (kind === 'tony' || kind === 'tonyMax') px(ctx, x + 6, y + 7, 2, 8, p.accent);

  // arms
  const armColor = p.skin;
  px(ctx, x, y + 8 + tall * .5 - step * .2, 3, 8, armColor);
  px(ctx, x + 14 + wide, y + 8 + tall * .5 + step * .2, 3, 8, armColor);

  // head
  px(ctx, x + 3, y - 1 + short, 11 + wide, 9, p.skin);
  // jaw / maxxing
  if (maxxed) {
    px(ctx, x + 4, y + 6, 10, 3, p.skin);
    px(ctx, x + 4, y + 7, 10, 1, '#9f5f3f');
    px(ctx, x + 3, y + 2, 12, 2, '#0e1520'); // sharp sunglasses
    px(ctx, x + 7, y + 3, 3, 1, '#76dcff');
  } else {
    px(ctx, x + 4, y + 7, 9 + wide, 2, p.skin);
  }

  // hair / hats / laurel
  if (kind === 'augustus') {
    // Imperial laurel over an anachronistically perfect looksmaxxer haircut.
    px(ctx, x + 2, y - 4, 14, 4, '#f1d37a');
    px(ctx, x + 3, y - 5, 12, 2, '#3a251b');
    px(ctx, x + 2, y - 2, 14, 2, '#d6b93e');
    px(ctx, x + 3, y - 5, 3, 2, '#6aa84f');
    px(ctx, x + 8, y - 6, 3, 2, '#6aa84f');
    px(ctx, x + 13, y - 5, 3, 2, '#6aa84f');
    px(ctx, x + 4, y + 6, 10, 3, p.skin); // marble-cut jaw
    px(ctx, x + 4, y + 8, 10, 1, '#9d6042');
  } else if (kind === 'kramer') {
    px(ctx, x + 2, y - 4, 13, 4, p.hair);
    px(ctx, x + 1, y - 2, 3, 4, p.hair);
    px(ctx, x + 13, y - 3, 3, 5, p.hair);
  } else if (kind === 'elaine') {
    px(ctx, x + 1, y - 2, 15, 5, p.hair);
    px(ctx, x + 2, y + 2, 2, 6, p.hair);
    px(ctx, x + 13, y + 2, 2, 6, p.hair);
  } else if (kind === 'george') {
    // Balding crown with hair only at the sides/back.
    px(ctx, x + 3, y - 1, 3, 3, p.hair);
    px(ctx, x + 12, y - 1, 3, 3, p.hair);
    px(ctx, x + 4, y + 1, 2, 3, p.hair);
    px(ctx, x + 12, y + 1, 2, 3, p.hair);
  } else if (kind === 'jerry') {
    // Thick dark sitcom-comedian hair with a little height.
    px(ctx, x + 2, y - 3, 13, 4, p.hair);
    px(ctx, x + 4, y - 5, 8, 2, p.hair);
  } else if (kind === 'silvio') {
    // Tall sculpted pompadour.
    px(ctx, x + 2, y - 5, 13, 4, p.hair);
    px(ctx, x + 4, y - 7, 9, 3, '#1b1514');
  } else if (kind === 'christopher') {
    // Slicked hair plus a young wiseguy brim silhouette.
    px(ctx, x + 2, y - 3, 14, 3, p.hair);
    px(ctx, x + 1, y - 1, 16, 1, '#101010');
  } else if (kind === 'janice') {
    // Large burgundy hair, unmistakably Janice-adjacent without copying an actor.
    px(ctx, x + 1, y - 4, 15, 6, p.hair);
    px(ctx, x, y, 3, 8, p.hair);
    px(ctx, x + 14, y, 3, 8, p.hair);
  } else if (kind === 'meadow') {
    px(ctx, x + 2, y - 2, 13, 4, p.hair);
    px(ctx, x + 2, y + 1, 3, 8, p.hair);
    px(ctx, x + 12, y + 1, 3, 8, p.hair);
  } else if (kind === 'melfi' || kind === 'carmela') {
    px(ctx, x + 2, y - 2, 13, 4, p.hair);
    px(ctx, x + 2, y + 1, 2, 6, p.hair);
    px(ctx, x + 13, y + 1, 2, 6, p.hair);
  } else if (kind === 'paulie' || kind === 'paulieSuit') {
    // Silver wings sweeping back from the temples.
    px(ctx, x + 5, y - 2, 7, 2, p.hair);
    px(ctx, x + 2, y - 1, 3, 4, '#eeeeE5');
    px(ctx, x + 12, y - 1, 3, 4, '#eeeeE5');
    if (kind === 'paulieSuit') px(ctx, x + 6, y + 7, 4, 7, '#f1e7c8');
  } else {
    px(ctx, x + 3, y - 2, 11 + wide, 3, p.hair);
    if (dir !== 'up') px(ctx, x + 2, y, 2, 4, p.hair);
  }

  // face details only when not facing away
  if (dir !== 'up') {
    if (!maxxed) {
      px(ctx, x + 5, y + 3, 2, 1, '#12151c');
      px(ctx, x + 10 + wide, y + 3, 2, 1, '#12151c');
    }
    if (kind === 'tony') {
      px(ctx, x + 6, y + 5, 5, 1, '#70442f');
      px(ctx, x + 5, y + 1, 7, 1, '#1c1715');
    } else if (kind === 'george') {
      px(ctx, x + 4, y + 2, 4, 3, '#20242a');
      px(ctx, x + 10, y + 2, 4, 3, '#20242a');
      px(ctx, x + 5, y + 3, 2, 1, '#a8d8e8');
      px(ctx, x + 11, y + 3, 2, 1, '#a8d8e8');
      px(ctx, x + 6, y + 6, 4, 1, '#6d3b2d');
    } else if (kind === 'melfi') {
      px(ctx, x + 4, y + 2, 4, 2, '#20242a');
      px(ctx, x + 10, y + 2, 4, 2, '#20242a');
      px(ctx, x + 6, y + 6, 4, 1, '#744233');
    } else if (kind === 'aj') {
      px(ctx, x + 5, y + 5, 5, 1, '#633b2e');
      px(ctx, x + 2, y + 1, 3, 4, '#22252d'); // headphone
    } else if (kind === 'jerry') {
      px(ctx, x + 5, y + 5, 5, 1, '#6f3c2d');
    } else if (kind === 'augustus') {
      px(ctx, x + 4, y + 2, 4, 1, '#2a1b15');
      px(ctx, x + 10, y + 2, 4, 1, '#2a1b15');
      px(ctx, x + 5, y + 3, 2, 1, '#5bd7ff');
      px(ctx, x + 11, y + 3, 2, 1, '#5bd7ff');
      px(ctx, x + 6, y + 5, 5, 1, '#7a4935');
    }
  }
}

export function drawPortrait(ctx, x, y, kind = 'tony') {
  const p = palettes[kind] || palettes.tony;
  px(ctx, x, y, 34, 34, '#1a2548');
  px(ctx, x + 2, y + 2, 30, 30, '#31477a');
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
  px(ctx, -2, -10, 4, 15, '#bd8650');
  px(ctx, -1, -15, 3, 6, '#d7a66a');
  px(ctx, -2, 5, 4, 3, '#5b3824');
  ctx.restore();
}

export function drawVial(ctx, x, y, t = 0) {
  const bob = Math.sin(t * 5 + x) * 2;
  px(ctx, x - 3, y - 7 + bob, 6, 10, 'rgba(120,220,255,.9)');
  px(ctx, x - 2, y - 9 + bob, 4, 3, '#e6eef7');
  px(ctx, x - 2, y - 2 + bob, 4, 4, '#52ff9a');
  px(ctx, x - 1, y - 6 + bob, 2, 2, '#ffffff');
}
