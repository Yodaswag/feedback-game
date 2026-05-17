import { CANVAS_SIZE, SHIP_X, CONSECUTIVE_TO_WIN, WATERLINE_Y, WATER_Y_TOP } from './constants.js';

const FONT = (size, bold = false) => `${bold ? 'bold ' : ''}${size}px 'Rubik', Arial, sans-serif`;
const BLUE_DARK   = '#1a3f6f';
const BLUE_MID    = '#2d6b9e';
const BLUE_LIGHT  = '#4a90c4';

export function drawBackground(ctx, images) {
  // Layer 1: background texture fills full canvas
  const tex = images['background-texture'];
  if (tex) {
    ctx.drawImage(tex, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
  // Layer 2: water-bg sits on top, covers gameplay strip (WATER_Y_TOP → bottom)
  const water = images['water-bg'];
  if (water) {
    ctx.drawImage(water, 0, WATER_Y_TOP, CANVAS_SIZE, CANVAS_SIZE - WATER_Y_TOP);
  } else {
    ctx.fillStyle = BLUE_LIGHT;
    ctx.fillRect(0, WATER_Y_TOP, CANVAS_SIZE, CANVAS_SIZE - WATER_Y_TOP);
  }
}

export function drawShip(ctx, images, shipY) {
  const img = images['ship'];
  // 1.5× current base size (90×70), stretched 1.1× in Y
  const w = 135, h = Math.round(70 * 1.5 * 1.1); // 135 × 116
  if (img) {
    ctx.save();
    // Move origin to ship center
    ctx.translate(SHIP_X, shipY);
    // Flip horizontally
    ctx.scale(-1, 1);
    // Draw centered at origin
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(SHIP_X - w / 2, shipY - h / 2, w, h);
  }
}

export function drawItems(ctx, images, items) {
  for (const item of items) {
    const img = images[item.type];
    if (img) {
      ctx.drawImage(img, item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
    } else {
      const colors = {
        'chest-ribbon': '#DAA520',
        'chest-plain':  '#8B6914',
        'chest-green':  '#228B22',
        'bomb-lit':     '#DC143C',
        'bomb-unlit':   '#708090',
      };
      ctx.fillStyle = colors[item.type] ?? '#888';
      ctx.fillRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
    }
  }
}

// 3-slot consecutive counter — drawn on a small tattered-page strip at top
export function drawCounter(ctx, images, count) {
  const slotSize = 28;
  const gap = 10;
  const totalW = CONSECUTIVE_TO_WIN * (slotSize + gap) - gap;
  const startX = (CANVAS_SIZE - totalW) / 2;
  const y = 18;

  // Tattered-page background behind counter
  const page = images['tattered-page'];
  if (page) {
    const padX = 18, padY = 8;
    ctx.drawImage(page, startX - padX, y - padY, totalW + padX * 2, slotSize + padY * 2);
  }

  for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
    const x = startX + i * (slotSize + gap);
    ctx.strokeStyle = BLUE_DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, slotSize, slotSize);
    if (i < count) {
      ctx.fillStyle = BLUE_MID;
      ctx.fillRect(x + 3, y + 3, slotSize - 6, slotSize - 6);
      ctx.fillStyle = '#fff';
      ctx.font = FONT(slotSize - 8);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x + slotSize / 2, y + slotSize / 2);
    }
  }
}

export function drawWaterline(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, WATERLINE_Y);
  ctx.lineTo(CANVAS_SIZE, WATERLINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Level badge drawn on a tattered-page strip at top-right
export function drawLevelIndicator(ctx, images, levelIndex, feedbackTypeName) {
  const text = `שלב ${levelIndex + 1}: ${feedbackTypeName}`;
  const x = CANVAS_SIZE - 190, w = 180, h = 36;

  const page = images['tattered-page'];
  if (page) {
    ctx.drawImage(page, x, 8, w, h);
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(13, true);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CANVAS_SIZE - 14, 26);
}

export function drawGameplayInstruction(ctx, images) {
  const text = 'השתמשו בחצי מעלה ומטה כדי להזיז את הספינה ולאסוף את הפריטים';
  const cx = CANVAS_SIZE / 2;
  const y = CANVAS_SIZE - 46;
  const w = 480, h = 36;
  const startX = cx - w / 2;

  const page = images['tattered-page'];
  if (page) {
    ctx.drawImage(page, startX, y, w, h);
  } else {
    ctx.fillStyle = 'rgba(255, 245, 220, 0.85)';
    ctx.fillRect(startX, y, w, h);
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(13, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + h / 2);
}

export function drawStartScreen(ctx, images) {
  drawBackground(ctx, images);

  // Tattered-page card for start text
  const page = images['tattered-page'];
  const cx = CANVAS_SIZE / 2;
  const cardX = 60, cardY = 80, cardW = CANVAS_SIZE - 120, cardH = 380;
  if (page) {
    ctx.drawImage(page, cardX, cardY, cardW, cardH);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // Draw logo image with 'multiply' blend mode for seamless parchment integration
  const logo = images['logo'];
  if (logo) {
    const logoW = 95;
    const logoH = 95;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(logo, cx - logoW / 2, cardY + 25, logoW, logoH);
    ctx.restore();
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(30, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('הפלגת המשובים', cx, cardY + 160);

  ctx.fillStyle = BLUE_MID;
  ctx.font = FONT(16);
  ctx.fillText('במשחק זה עליכם לאסוף את הפריט הנכון', cx, cardY + 215);
  ctx.fillText('3 פעמים ברצף.', cx, cardY + 240);
  ctx.fillText('תוכלו לגלות מה הפריט הנכון בעזרת המשובים.', cx, cardY + 270);

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(18, true);
  ctx.fillText('לחץ להתחלה', cx, cardY + 325);
}
