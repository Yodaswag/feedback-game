import { CANVAS_SIZE, SHIP_X, CONSECUTIVE_TO_WIN, WATERLINE_Y } from './constants.js';

export function drawBackground(ctx, images) {
  if (images['water-bg']) {
    ctx.drawImage(images['water-bg'], 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    ctx.fillStyle = '#4a90c4';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

export function drawShip(ctx, images, shipY) {
  const img = images['ship'];
  const w = 90, h = 70;
  if (img) {
    ctx.drawImage(img, SHIP_X - w / 2, shipY - h / 2, w, h);
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

export function drawCounter(ctx, count) {
  const slotSize = 28;
  const gap = 10;
  const totalW = CONSECUTIVE_TO_WIN * (slotSize + gap) - gap;
  const startX = (CANVAS_SIZE - totalW) / 2;
  const y = 18;

  for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
    const x = startX + i * (slotSize + gap);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, slotSize, slotSize);
    if (i < count) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(x + 3, y + 3, slotSize - 6, slotSize - 6);
      ctx.fillStyle = '#FFF';
      ctx.font = `${slotSize - 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x + slotSize / 2, y + slotSize / 2);
    }
  }
}

export function drawWaterline(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, WATERLINE_Y);
  ctx.lineTo(CANVAS_SIZE, WATERLINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawLevelIndicator(ctx, levelIndex, feedbackTypeName) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(CANVAS_SIZE - 180, 10, 170, 36);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`שלב ${levelIndex + 1}: ${feedbackTypeName}`, CANVAS_SIZE - 18, 28);
}

export function drawStartScreen(ctx, images) {
  drawBackground(ctx, images);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(60, 120, CANVAS_SIZE - 120, 360);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('עולים שלב', CANVAS_SIZE / 2, 195);

  ctx.fillStyle = '#FFF';
  ctx.font = '16px Arial';
  ctx.fillText('3 שלבים. אותו אתגר. משוב שונה.', CANVAS_SIZE / 2, 240);
  ctx.fillText('אסוף 3 פריטים נכונים ברצף.', CANVAS_SIZE / 2, 268);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('לחץ להתחלה', CANVAS_SIZE / 2, 340);
}
