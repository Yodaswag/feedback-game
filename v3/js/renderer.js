import {
  CANVAS_SIZE, SHIP_X, CONSECUTIVE_TO_WIN, WATERLINE_Y, WATER_Y_TOP,
  NUDGE_TEXT, NUDGE_POSITION, NUDGE_FONT_SIZE,
} from './constants.js';

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
  const x = CANVAS_SIZE - 190, y = 8, w = 180, h = 36;

  const page = images['tattered-page'];
  if (page) {
    ctx.drawImage(page, x, y, w, h);
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(13, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
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

// Resolve nudge anchor enum + offsets into pixel coords + textAlign.
function resolveNudgeAnchor(pos) {
  let x, textAlign;
  switch (pos.axisX) {
    case 'left':   x = 20;                  textAlign = 'left';   break;
    case 'right':  x = CANVAS_SIZE - 20;    textAlign = 'right';  break;
    case 'center':
    default:       x = CANVAS_SIZE / 2;     textAlign = 'center'; break;
  }
  let y;
  switch (pos.axisY) {
    case 'middle': y = CANVAS_SIZE / 2;        break;
    case 'bottom': y = CANVAS_SIZE - 20;       break;
    case 'top':
    default:       y = 0;                      break;
  }
  return { x: x + (pos.offsetX || 0), y: y + (pos.offsetY || 0), textAlign };
}

export function drawAvoidanceNudge(ctx, images) {
  const { x, y, textAlign } = resolveNudgeAnchor(NUDGE_POSITION);
  ctx.save();
  ctx.font = FONT(NUDGE_FONT_SIZE, true);
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(NUDGE_TEXT);
  const textW = metrics.width;
  const padX = 32, padY = 14;
  const pageW = textW + padX * 2;
  const pageH = NUDGE_FONT_SIZE + padY * 2;
  let pageX;
  if (textAlign === 'left')        pageX = x - padX;
  else if (textAlign === 'right')  pageX = x - textW - padX;
  else                             pageX = x - pageW / 2;
  const pageY = y - pageH / 2;

  const page = images && images['tattered-page'];
  if (page) {
    ctx.drawImage(page, pageX, pageY, pageW, pageH);
  } else {
    ctx.fillStyle = 'rgba(245, 230, 200, 0.92)';
    ctx.fillRect(pageX, pageY, pageW, pageH);
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.fillText(NUDGE_TEXT, x, y);
  ctx.restore();
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

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export function drawLevelSelectScreen(ctx, images, state) {
  const completedLevels = state.completedLevels;
  const allLevelsUnlockedFromStart = state.allLevelsUnlockedFromStart;

  // Draw background texture
  const tex = images['background-texture'];
  if (tex) {
    ctx.drawImage(tex, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // Draw Title Card using tattered-page
  const page = images['tattered-page'];
  if (page) {
    ctx.drawImage(page, 40, 15, 520, 105);
  } else {
    ctx.fillStyle = 'rgba(255, 245, 220, 0.85)';
    ctx.fillRect(40, 15, 520, 105);
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(24, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('בחירת שלב', 300, 48);

  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(16, true);
  ctx.fillText('בכל שלב עליכם לגלות את החוקיות כדי לעבור את השלב', 300, 82);

  // Position of thumbnails from right to left:
  // Level 1: Right, Level 2: Center, Level 3: Left.
  const thumbW = 140;
  const thumbH = 180;
  const thumbY = 150;
  
  const thumbs = [
    { index: 0, cx: 470, label: 'שלב 1: משוב תוצאה', items: ['chest-ribbon', 'chest-plain', 'bomb-lit'], hasLine: false },
    { index: 1, cx: 300, label: 'שלב 2: משוב מתקן', items: ['bomb-unlit', 'chest-green', 'bomb-lit'], hasLine: false },
    { index: 2, cx: 130, label: 'שלב 3: משוב בונה', items: ['chest-ribbon', 'bomb-unlit', 'bomb-lit'], hasLine: true }
  ];

  thumbs.forEach(t => {
    const lx = t.cx - thumbW / 2;
    const rx = t.cx + thumbW / 2;
    const ty = thumbY;
    const by = thumbY + thumbH;

    const unlocked = t.index === 0 || allLevelsUnlockedFromStart || completedLevels[t.index - 1] === true;

    ctx.save();
    // Inner sea area: clip and draw water-bg instead of solid blue!
    const waterImg = images['water-bg'];
    if (waterImg) {
      drawRoundedRect(ctx, lx, ty, thumbW, thumbH, 12, false, false);
      ctx.clip();
      ctx.drawImage(waterImg, 0, 0, waterImg.width, waterImg.height, lx, ty, thumbW, thumbH);
    } else {
      ctx.fillStyle = '#4a90c4';
      drawRoundedRect(ctx, lx, ty, thumbW, thumbH, 12, true, false);
    }
    
    // Draw sea border
    ctx.strokeStyle = '#2d6b9e';
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, lx, ty, thumbW, thumbH, 12, false, true);
    ctx.restore();

    // If third level, draw the dashed waterline dividing the top and bottom!
    if (t.hasLine) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(lx, ty + thumbH / 2);
      ctx.lineTo(rx, ty + thumbH / 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw the ship inside the thumbnail
    const shipImg = images['ship'];
    const shipW = 45;
    const shipH = 38;
    const shipX = lx + 30;
    const shipYLoc = t.hasLine ? ty + thumbH / 4 : ty + thumbH / 2;
    if (shipImg) {
      ctx.save();
      ctx.translate(shipX, shipYLoc);
      ctx.scale(-1, 1);
      ctx.drawImage(shipImg, -shipW / 2, -shipH / 2, shipW, shipH);
      ctx.restore();
    }

    // Draw the 3 item types inside the thumbnail
    const itemPositions = [
      { x: rx - 35, y: ty + 40 },
      { x: rx - 35, y: ty + thumbH / 2 },
      { x: rx - 35, y: ty + thumbH - 40 }
    ];

    t.items.forEach((itemKey, idx) => {
      const itemImg = images[itemKey];
      const pos = itemPositions[idx];
      const itemSize = 34;
      if (itemImg) {
        ctx.drawImage(itemImg, pos.x - itemSize / 2, pos.y - itemSize / 2, itemSize, itemSize);
      }
    });

    // Draw level label beneath thumbnail
    ctx.fillStyle = BLUE_DARK;
    ctx.font = FONT(13, true);
    ctx.textAlign = 'center';
    ctx.fillText(t.label, t.cx, by + 25);

    // Lock Overlay if level is locked
    if (!unlocked) {
      ctx.save();
      // Dark translucent rounded rectangle overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      drawRoundedRect(ctx, lx, ty, thumbW, thumbH, 12, true, false);

      // Lock icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = FONT(32, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', t.cx, ty + thumbH / 2);
      ctx.restore();
    }

    // Completed Level overlay with a dark rounded rectangle and checkmark
    if (completedLevels[t.index]) {
      ctx.save();
      // Dark translucent rounded rectangle overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      drawRoundedRect(ctx, lx, ty, thumbW, thumbH, 12, true, false);

      // Checkmark green circle with white checkmark
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(t.cx, ty + thumbH / 2, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = FONT(32, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', t.cx, ty + thumbH / 2);
      ctx.restore();
    }
  });

  // Disabled/Enabled treasure button at the bottom
  const allCompleted = completedLevels.every(c => c === true);
  const btnW = 500;
  const btnH = 50;
  const btnX = 300 - btnW / 2;
  const btnY = 460;

  ctx.save();
  if (allCompleted) {
    // Enabled button: beautiful gold/blue button!
    ctx.fillStyle = '#e67e22'; // bright orange/gold
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8, true, true);
    ctx.fillStyle = '#ffffff';
  } else {
    // Disabled button: grey translucent / dull color
    ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8, true, true);
    ctx.fillStyle = 'rgba(80, 80, 80, 0.65)';
  }

  // Button text
  ctx.font = FONT(14, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const buttonText = allCompleted 
    ? 'לחצו כאן כדי לקבל את האוצר המסתורי! 🏆' 
    : 'השלימו את כל 3 השלבים על מנת לקבל את האוצר';

  ctx.fillText(buttonText, 300, btnY + btnH / 2);
  ctx.restore();
}

export function drawTreasureWinScreen(ctx, images) {
  // Draw background texture
  const tex = images['background-texture'];
  if (tex) {
    ctx.drawImage(tex, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // Draw parchment page
  const page = images['tattered-page'];
  const cx = CANVAS_SIZE / 2;
  const cardX = 50, cardY = 30, cardW = CANVAS_SIZE - 100, cardH = 530;
  if (page) {
    ctx.drawImage(page, cardX, cardY, cardW, cardH);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // Draw open chest image
  const chest = images['chest-open'];
  if (chest) {
    const chestW = 160;
    const chestH = 160;
    ctx.save();
    // Multiply blend for seamless look on parchment
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(chest, cx - chestW / 2, cardY + 25, chestW, chestH);
    ctx.restore();
  }

  // Text
  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(28, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('מצאתם את האוצר! 🏆', cx, cardY + 215);

  ctx.fillStyle = BLUE_MID;
  ctx.font = FONT(15);
  ctx.fillText('כל הכבוד! גיליתם את החוקיות בכל 3 הרמות:', cx, cardY + 255);

  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(14, true);
  ctx.fillText('1. משוב תוצאה - רק נכון/לא נכון (הכי פחות מועיל ומבלבל)', cx, cardY + 290);
  ctx.fillText('2. משוב מתקן - מסביר מה שגוי (עוזר חלקית ומפחית תסכול)', cx, cardY + 320);
  ctx.fillText('3. משוב בונה - נותן אסטרטגיה מלאה ומסביר למה (הכי מקדם למידה!)', cx, cardY + 350);

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(15, true);
  ctx.fillText('כעת אתם מבינים את הכוח של משוב בונה בעיצוב למידה!', cx, cardY + 410);

  // Play Again Button inside card
  const btnW = 180;
  const btnH = 42;
  const btnX = cx - btnW / 2;
  const btnY = cardY + 450;
  ctx.save();
  ctx.fillStyle = BLUE_MID;
  ctx.strokeStyle = BLUE_DARK;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8, true, true);

  ctx.fillStyle = '#ffffff';
  ctx.font = FONT(14, true);
  ctx.fillText('שחקו שוב ↩', cx, btnY + btnH / 2);
  ctx.restore();
}
