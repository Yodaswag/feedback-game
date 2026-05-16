import { CANVAS_SIZE } from './constants.js';

const POPUP_W = 340;
const POPUP_H = 180;
const POPUP_X = (CANVAS_SIZE - POPUP_W) / 2;
const POPUP_Y = (CANVAS_SIZE - POPUP_H) / 2;

export function drawPopup(ctx, images, popup) {
  const { text, isCorrect } = popup;

  const bg = images['tattered-page'];
  if (bg) {
    ctx.drawImage(bg, POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
  }

  ctx.fillStyle = isCorrect ? 'rgba(80,200,80,0.35)' : 'rgba(220,80,80,0.35)';
  ctx.fillRect(POPUP_X, POPUP_Y, POPUP_W, 36);

  const symbol = isCorrect ? '✓' : '✗';
  ctx.fillStyle = isCorrect ? '#2d8a2d' : '#b02020';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, POPUP_X + POPUP_W / 2, POPUP_Y + 18);

  if (text !== '✓' && text !== '✗') {
    ctx.fillStyle = '#3a2600';
    ctx.font = '15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, text, POPUP_X + 20, POPUP_Y + 46, POPUP_W - 40, 22);
  }
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      ctx.fillText(line, x + maxWidth / 2, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x + maxWidth / 2, lineY);
}
