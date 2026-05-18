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

  // Draw the circular Correct/Wrong indicator badge at the top-right
  ctx.save();
  ctx.fillStyle = isCorrect ? '#2ecc71' : '#e74c3c';
  ctx.beginPath();
  ctx.arc(POPUP_X + POPUP_W - 35, POPUP_Y + 28, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = FONT(12, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isCorrect ? '✓' : '✗', POPUP_X + POPUP_W - 35, POPUP_Y + 28);
  ctx.restore();

  // Draw Title area with Compass Icon + "המצפן אומר:"
  ctx.save();
  const titleText = 'המצפן אומר:';
  ctx.font = FONT(15, true);
  const textWidth = ctx.measureText(titleText).width;
  
  const iconSize = 24;
  const gap = 8;
  const totalTitleW = iconSize + gap + textWidth;
  const startX = POPUP_X + (POPUP_W - totalTitleW) / 2;

  const compassImg = images['compass'];
  if (compassImg) {
    ctx.drawImage(compassImg, startX, POPUP_Y + 28 - iconSize / 2, iconSize, iconSize);
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, startX + iconSize + gap, POPUP_Y + 28);
  ctx.restore();

  // Always show text beneath title
  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(14, true);
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, text, POPUP_X + 22, POPUP_Y + 62, POPUP_W - 44, 22);
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
