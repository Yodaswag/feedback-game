import { CANVAS_SIZE, TRANSITION_STEP } from './constants.js';

let activeButtons = [];

const FONT = (size, bold = false) => `${bold ? 'bold ' : ''}${size}px 'Rubik', Arial, sans-serif`;
const BLUE_DARK = '#1a3f6f';
const BLUE_MID = '#2d6b9e';

function drawButton(ctx, label, x, y, w, h, highlight) {
  ctx.fillStyle = highlight ? BLUE_MID : 'rgba(45,107,158,0.18)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = BLUE_MID;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = highlight ? '#fff' : BLUE_DARK;
  ctx.font = FONT(14, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  activeButtons.push({ label, rect: { x, y, w, h } });
}

function drawPirate(ctx, images, mood, cx, cy, size) {
  const img = images[`pirate-${mood}`] ?? images['pirate-bored'];
  if (img) {
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  } else {
    ctx.fillStyle = '#DDD';
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.fillStyle = '#333';
    ctx.font = FONT(size * 0.5);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emoji = { happy: '😄', bored: '😐', frustrated: '😤', confused: '😕' }[mood] ?? '🏴‍☠️';
    ctx.fillText(emoji, cx, cy);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
  return lineY + lineHeight;
}

function countWrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  let line = '';
  let count = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      count++;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) count++;
  return count;
}

export function drawRevealScreen(ctx, images, level) {
  activeButtons = [];

  const px = 50, pw = CANVAS_SIZE - 100;
  // Inset 14% from each horizontal edge of the page image — keeps text on visible paper
  const hInset = Math.round(pw * 0.14);
  const textMaxW = pw - hInset * 2;
  const textCX = px + pw / 2; // center x of page (= CANVAS_SIZE/2)

  // Measure content height before drawing so the card fits the text
  const lines = level.revealCardText.split('\n');
  let contentH = 0;
  for (const line of lines) {
    if (line.trim() === '') { contentH += 10; continue; }
    const isHeader = /^[^ -]/.test(line) && line.length < 40;
    ctx.font = FONT(isHeader ? 17 : 14, isHeader);
    contentH += countWrapLines(ctx, line, textMaxW) * 21;
  }
  const ph = contentH + 200; // 200 = top+bottom insets + rule + button
  const py = Math.max(30, Math.floor((CANVAS_SIZE - ph) / 2));

  // Vertical insets as % of ph to stay on visible paper
  const vInsetTop = Math.round(ph * 0.12);
  const vInsetBot = Math.round(ph * 0.10);

  const page = images['tattered-page'];
  if (page) {
    ctx.drawImage(page, px, py, pw, ph);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);
  }

  let lineY = py + vInsetTop;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const line of lines) {
    if (line.trim() === '') { lineY += 10; continue; }
    const isHeader = /^[^ -]/.test(line) && line.length < 40;
    if (isHeader) {
      ctx.fillStyle = BLUE_DARK;
      ctx.font = FONT(17, true);
    } else {
      ctx.fillStyle = BLUE_MID;
      ctx.font = FONT(14);
    }
    lineY = wrapText(ctx, line, textCX, lineY, textMaxW, 21);
  }

  const ruleY = py + ph - vInsetBot - 105;
  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(12, true);
  ctx.textAlign = 'center';
  ctx.fillText('הכלל שהיה בשלב זה:', textCX, ruleY);
  ctx.font = FONT(12);
  ctx.fillStyle = BLUE_MID;
  wrapText(ctx, level.transitionReveal, textCX, ruleY + 18, textMaxW, 18);

  drawButton(ctx, 'המשך ←', textCX - 75, py + ph - vInsetBot - 44, 140, 40, true);
}


const END_CARD_TITLE = 'סיימתם את המסע!';
const END_CARD_TEXT = [
  'האם תדמיינו לנסות לפענח את כלל שלב 3 עם משוב תוצאה בלבד? 😰',
  '',
  'הכללים שהתלמידים שלנו מתמודדים איתם בחיים האמיתיים הם לרוב מורכבים — קשה לפענח אותם בניסוי וטעייה.',
  '',
  '__BOLD__משוב בונה בלמידה מבוססת משחק — הוא לא נחמד, הוא הכרחי!',
  '',
  'השתמשו בו כדי לייצר חוויות לימוד משמעותיות ומרתקות. ⚓',
];

const SUMMARY_COLS = [
  { name: 'משוב תוצאה', brief: 'רק נכון/לא נכון' },
  { name: 'משוב מתקן', brief: 'מצביע על מה לתקן ואיך' },
  { name: 'משוב בונה', brief: 'מסביר למה ומנחה קדימה' },
];

const SCROLL_PROMPT = 'גללו מטה כדי לקבל את המטבעות שלכם, או שחקו שוב ללמידה חוזרת';

export function drawEndScreen(ctx, images, levelResults) {
  activeButtons = [];

  const px = 40, py = 30, pw = CANVAS_SIZE - 80, ph = CANVAS_SIZE - 70;

  const page = images['tattered-page'];
  if (page) {
    ctx.drawImage(page, px, py, pw, ph);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);
  }

  // Title — large, bold (Gestalt emphasis)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(24, true);
  let lineY = py + 48;
  ctx.fillText(END_CARD_TITLE, CANVAS_SIZE / 2, lineY);
  lineY += 36;

  // Body — wider text area (pw - 60)
  const bodyMaxW = pw - 60;
  for (const rawLine of END_CARD_TEXT) {
    if (rawLine === '') { lineY += 6; continue; }
    const isBold = rawLine.startsWith('__BOLD__');
    const line = isBold ? rawLine.slice('__BOLD__'.length) : rawLine;
    ctx.fillStyle = isBold ? BLUE_DARK : BLUE_MID;
    ctx.font = isBold ? FONT(15, true) : FONT(13);
    lineY = wrapText(ctx, line, CANVAS_SIZE / 2, lineY, bodyMaxW, 18);
  }

  // Stats row — RTL: index 0 on right
  const stripY = py + ph - 290;
  const colW = (pw - 32) / 3;
  SUMMARY_COLS.forEach((col, i) => {
    const visualIdx = 2 - i;
    const sx = px + 16 + visualIdx * colW;
    const cx = sx + colW / 2;
    const mood = levelResults[i]?.mood ?? null;

    drawPirate(ctx, images, moodLabelToKey(mood), cx, stripY + 30, 56);

    ctx.fillStyle = BLUE_DARK;
    ctx.font = FONT(17, true);
    ctx.textAlign = 'center';
    ctx.fillText(col.name, cx, stripY + 68);

    ctx.fillStyle = BLUE_MID;
    ctx.font = FONT(13);
    ctx.fillText(mood ? `סימנת: ${mood}` : 'אתה סימנת: —', cx, stripY + 90);

    ctx.fillStyle = BLUE_MID;
    ctx.font = FONT(13);
    wrapText(ctx, col.brief, cx, stripY + 110, colW - 12, 16);
  });

  // Prompt line + aligned arrow & button (all inside card)
  const promptY = py + ph - 90;
  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(15);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(SCROLL_PROMPT, CANVAS_SIZE / 2, promptY);

  // x-positions: "גללו" visually rightmost, "שחקו שוב" inside left half (partB)
  const fullW = ctx.measureText(SCROLL_PROMPT).width;
  const partB = 'או שחקו שוב ללמידה חוזרת';
  const partBW = ctx.measureText(partB).width;
  const lineLeft = CANVAS_SIZE / 2 - fullW / 2;
  const lineRight = lineLeft + fullW;
  const arrowX = lineRight - ctx.measureText('גללו מטה כדי לקבל את המטבעות').width / 2;
  // partB center placed at lineLeft + partBW/2; "שחקו שוב" sits near center of partB — small shift left for "או"
  const btnX = lineLeft + partBW / 2 - ctx.measureText('או ').width / 2 + ctx.measureText(partB).width / 2;

  // Action row centerline — comfortably inside card bottom
  const actionY = py + ph - 55;
  const arrowImg = images['arrow'];
  const aSize = 40;
  if (arrowImg) {
    ctx.drawImage(arrowImg, arrowX - aSize / 2, actionY - aSize / 2, aSize, aSize);
  } else {
    ctx.fillStyle = BLUE_DARK;
    ctx.font = FONT(28, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↓', arrowX, actionY);
  }

  drawButton(ctx, 'שחק שוב', btnX - 55, actionY - 17, 110, 34, true);
}

function moodLabelToKey(label) {
  if (!label) return 'bored';
  if (label.includes('מתרגש') || label.includes('שמח') || label.includes('מאושר')) return 'happy';
  if (label.includes('מתוסכל') || label.includes('כועס')) return 'frustrated';
  if (label.includes('מבולבל') || label.includes('תקוע') || label.includes('לא בטוח')) return 'confused';
  return 'bored';
}

export function handleClick(x, y) {
  for (const btn of activeButtons) {
    const { rect } = btn;
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
      return btn.label;
    }
  }
  return null;
}
