import { CANVAS_SIZE } from './constants.js';

export const POPUP_W = 340;
export const POPUP_H = 205; // slightly taller to fit everything beautifully
export const POPUP_X = (CANVAS_SIZE - POPUP_W) / 2;
export const POPUP_Y = (CANVAS_SIZE - POPUP_H) / 2;

const FONT = (size, bold = false) => `${bold ? 'bold ' : ''}${size}px 'Rubik', Arial, sans-serif`;
const BLUE_DARK = '#1a3f6f';
const BLUE_MID  = '#2d6b9e';

export function getPopupCloseRect() {
  return {
    x: POPUP_X + POPUP_W - 40,
    y: POPUP_Y + 12,
    w: 28,
    h: 28,
  };
}

export function drawPopup(ctx, images, popup, hoverTarget) {
  const { text, isCorrect } = popup;
  const isCloseHovered = hoverTarget?.id === 'feedback-close';

  // 1. Draw Card Card Background
  drawPopupCard(ctx, images);

  // 2. Draw Close 'X' Glyph in top right corner (brownish, semi-transparent)
  drawCloseGlyph(ctx, isCloseHovered);

  // 3. Draw Title (Compass sits visually to the right of "המצפן אומר")
  const titleText = 'המצפן אומר';
  drawPopupTitle(ctx, images['compass'], titleText);

  // 4. Draw Status Badge ("נכון ✓" or "לא נכון ✕") below title
  const statusLabel = isCorrect ? 'נכון' : 'לא נכון';
  const statusIcon = isCorrect ? '✓' : '✕';
  drawStatusRow(ctx, statusLabel, statusIcon, isCorrect);

  // 5. Draw Body text below status row
  const bodyText = stripStatusPrefix(text);
  drawPopupBody(ctx, bodyText);
}

function drawPopupCard(ctx, images) {
  const bg = images['tattered-page'];
  ctx.save();
  ctx.shadowColor = 'rgba(45, 28, 12, 0.35)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;
  if (bg) {
    ctx.drawImage(bg, POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    // rounded rect
    ctx.beginPath();
    ctx.roundRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H, 16);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCloseGlyph(ctx, hovered) {
  const rect = getPopupCloseRect();
  ctx.save();
  ctx.fillStyle = hovered ? 'rgba(94, 58, 38, 0.42)' : 'rgba(94, 58, 38, 0.22)';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5e3a26';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const pad = 8;
  ctx.beginPath();
  ctx.moveTo(rect.x + pad, rect.y + pad);
  ctx.lineTo(rect.x + rect.w - pad, rect.y + rect.h - pad);
  ctx.moveTo(rect.x + rect.w - pad, rect.y + pad);
  ctx.lineTo(rect.x + pad, rect.y + rect.h - pad);
  ctx.stroke();
  ctx.restore();
}

function drawPopupTitle(ctx, compassImg, titleText) {
  ctx.save();
  ctx.font = FONT(15, true);
  const textWidth = ctx.measureText(titleText).width;
  const iconSize = 22;
  const gap = 6;
  const totalW = textWidth + gap + iconSize;
  const startX = POPUP_X + (POPUP_W - totalW) / 2;
  const y = POPUP_Y + 28;

  // Text first (on the left)
  ctx.fillStyle = BLUE_DARK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, startX, y);

  // Compass icon to the right of text
  if (compassImg) {
    ctx.drawImage(compassImg, startX + textWidth + gap, y - iconSize / 2, iconSize, iconSize);
  }
  ctx.restore();
}

function drawStatusRow(ctx, label, icon, isCorrect) {
  ctx.save();
  const text = `${label} ${icon}`;
  ctx.font = FONT(13, true);
  const textW = ctx.measureText(text).width;
  const badgeW = textW + 20;
  const badgeH = 24;
  const cx = POPUP_X + POPUP_W / 2;
  const cy = POPUP_Y + 58;

  ctx.fillStyle = isCorrect ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.12)';
  ctx.strokeStyle = isCorrect ? '#2ecc71' : '#e74c3c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isCorrect ? '#27ae60' : '#c0392b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function stripStatusPrefix(text) {
  return text
    .replace(/^(נכון!|שגיאה!|טעות!|מצוין!|נהדר!|נכון|לא נכון)\s*—?\s*/, '')
    .trim();
}

function drawPopupBody(ctx, text) {
  ctx.save();
  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(13, true);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  
  const textX = POPUP_X + POPUP_W - 32;
  const textY = POPUP_Y + 84;
  const maxW = POPUP_W - 64;
  
  drawWrappedText(ctx, text, textX, textY, maxW, 20);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
}
