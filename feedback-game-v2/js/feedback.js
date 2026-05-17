import { CANVAS_SIZE } from './constants.js';

const POPUP_W = 340;
const POPUP_H = 190;
const POPUP_X = (CANVAS_SIZE - POPUP_W) / 2;
const POPUP_Y = (CANVAS_SIZE - POPUP_H) / 2;

const FONT = (size, bold = false) => `${bold ? 'bold ' : ''}${size}px 'Rubik', Arial, sans-serif`;
const BLUE_DARK = '#1a3f6f';
const BLUE_MID  = '#2d6b9e';

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

  // Correct/wrong symbol
  ctx.fillStyle = isCorrect ? '#1a7a3f' : '#8b1a1a';
  ctx.font = FONT(24, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(isCorrect ? '✓' : '✗', POPUP_X + POPUP_W / 2, POPUP_Y + 16);

  // Always show text
  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(15, true);
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, text, POPUP_X + 20, POPUP_Y + 52, POPUP_W - 40, 24);
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
