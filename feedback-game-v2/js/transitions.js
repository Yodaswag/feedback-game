import { CANVAS_SIZE, TRANSITION_STEP } from './constants.js';

let activeButtons = [];

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,20,50,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,100,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawButton(ctx, label, x, y, w, h, highlight) {
  ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = highlight ? '#1a1a2e' : '#FFF';
  ctx.font = 'bold 14px Arial';
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
    ctx.font = `${size * 0.5}px serif`;
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

export function drawRevealScreen(ctx, images, level) {
  activeButtons = [];

  const px = 50, py = 40, pw = CANVAS_SIZE - 100, ph = CANVAS_SIZE - 100;

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

  ctx.fillStyle = 'rgba(30,15,5,0.45)';
  ctx.fillRect(px, py, pw, ph);

  const lines = level.revealCardText.split('\n');
  let lineY = py + 30;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const line of lines) {
    if (line.trim() === '') { lineY += 10; continue; }
    const isHeader = /^[^ -]/.test(line) && line.length < 40;
    if (isHeader) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 17px Arial';
    } else {
      ctx.fillStyle = '#f0e8d0';
      ctx.font = '14px Arial';
    }
    lineY = wrapText(ctx, line, CANVAS_SIZE / 2, lineY, pw - 60, 21);
  }

  const ruleY = py + ph - 110;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(px + 10, ruleY, pw - 20, 52);
  ctx.fillStyle = '#adf';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('הכלל שהיה בשלב זה:', CANVAS_SIZE / 2, ruleY + 8);
  ctx.font = '12px Arial';
  ctx.fillStyle = '#fff';
  wrapText(ctx, level.transitionReveal, CANVAS_SIZE / 2, ruleY + 26, pw - 40, 18);

  drawButton(ctx, 'המשך ←', CANVAS_SIZE / 2 - 70, py + ph - 50, 140, 40, true);
}

export function drawMoodScreen(ctx, images, level, selectedMood) {
  activeButtons = [];

  const px = 40, py = 60, pw = CANVAS_SIZE - 80, ph = CANVAS_SIZE - 120;
  drawPanel(ctx, px, py, pw, ph);

  drawPirate(ctx, images, level.pirateTransitionMood, CANVAS_SIZE / 2, py + 100, 120);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(level.moodQuestion, CANVAS_SIZE / 2, py + 174);

  const btnW = 120, btnH = 44, gap = 12;
  const gridW = 2 * btnW + gap;
  const startX = (CANVAS_SIZE - gridW) / 2;
  level.moodOptions.forEach((opt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = startX + col * (btnW + gap);
    const by = py + 210 + row * (btnH + gap);
    drawButton(ctx, opt, bx, by, btnW, btnH, opt === selectedMood);
  });
}

const END_CARD_TEXT = [
  '🏴‍☠️ סיימתם את המסע!',
  '',
  'האם תדמיינו לנסות לפענח את כלל שלב 3',
  'עם משוב תוצאה בלבד? 😰',
  '',
  'הכללים שהתלמידים שלנו מתמודדים איתם',
  'בחיים האמיתיים הם לרוב מורכבים —',
  'קשה לפענח אותם בניסוי וטעייה.',
  '',
  'משוב בונה בלמידה מבוססת משחק',
  'הוא לא נחמד — הוא הכרחי!',
  '',
  'השתמשו בו כדי לייצר חוויות',
  'לימוד משמעותיות ומרתקות. ⚓',
];

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
  ctx.fillStyle = 'rgba(20,10,5,0.5)';
  ctx.fillRect(px, py, pw, ph);

  drawPirate(ctx, images, 'happy', px + pw - 55, py + 55, 90);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let lineY = py + 22;
  for (const line of END_CARD_TEXT) {
    if (line === '') { lineY += 8; continue; }
    const isBold = line.startsWith('משוב בונה') || line.startsWith('🏴');
    ctx.fillStyle = isBold ? '#FFD700' : '#f0e8d0';
    ctx.font = isBold ? 'bold 16px Arial' : '14px Arial';
    lineY = wrapText(ctx, line, CANVAS_SIZE / 2, lineY, pw - 120, 20);
  }

  const stripY = py + ph - 110;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(px + 6, stripY, pw - 12, 64);
  const summaries = ['משוב תוצאה', 'משוב מתקן', 'משוב בונה'];
  summaries.forEach((name, i) => {
    const mood = levelResults[i]?.mood ?? '—';
    const sx = px + 16 + i * ((pw - 32) / 3);
    const sw = (pw - 32) / 3 - 6;
    ctx.fillStyle = '#adf';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, sx + sw / 2, stripY + 8);
    ctx.fillStyle = '#FFD700';
    ctx.font = '11px Arial';
    ctx.fillText(mood, sx + sw / 2, stripY + 26);
  });

  drawButton(ctx, 'שחק שוב', CANVAS_SIZE / 2 - 60, py + ph - 38, 120, 34, true);
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
