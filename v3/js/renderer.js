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

function getSharedPageRect(layout) {
  const page = layout?.sharedPage;
  if (page && Number.isFinite(page.x) && Number.isFinite(page.y) && Number.isFinite(page.w) && Number.isFinite(page.h)) {
    return page;
  }

  return {
    x: 24,
    y: 18,
    w: CANVAS_SIZE - 48,
    h: CANVAS_SIZE - 36,
  };
}

function getCenteredRect(rect, scale = 1) {
  const w = rect.w * scale;
  const h = rect.h * scale;
  return {
    x: rect.cx - w / 2,
    y: rect.cy - h / 2,
    w,
    h,
    cx: rect.cx,
    cy: rect.cy,
  };
}

function drawSharedPageShell(ctx, images, rect) {
  const page = images['tattered-page'];
  ctx.save();
  ctx.shadowColor = 'rgba(45, 28, 12, 0.28)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  if (page) {
    ctx.drawImage(page, rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.fillStyle = '#f5e6c8';
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 24, true, false);
  }
  ctx.restore();
}

function drawPrimaryButton(ctx, rect, label, hovered, disabled = false) {
  const buttonRect = getCenteredRect(rect, hovered && !disabled ? 1.035 : 1);
  const gradient = ctx.createLinearGradient(buttonRect.x, buttonRect.y, buttonRect.x, buttonRect.y + buttonRect.h);
  const baseTop = disabled ? 'rgba(135, 170, 201, 0.72)' : '#78b3de';
  const baseBottom = disabled ? 'rgba(74, 120, 165, 0.78)' : '#2d6b9e';
  gradient.addColorStop(0, baseTop);
  gradient.addColorStop(1, baseBottom);

  ctx.save();
  ctx.shadowColor = disabled ? 'rgba(26, 63, 111, 0.18)' : 'rgba(26, 63, 111, 0.35)';
  ctx.shadowBlur = hovered && !disabled ? 16 : 12;
  ctx.shadowOffsetY = hovered && !disabled ? 8 : 6;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = disabled ? 'rgba(26, 63, 111, 0.45)' : BLUE_DARK;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 16, true, true);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  drawRoundedRect(
    ctx,
    buttonRect.x + 5,
    buttonRect.y + 4,
    buttonRect.w - 10,
    Math.max(12, buttonRect.h * 0.42),
    12,
    true,
    false,
  );

  const maxTextWidth = Math.max(40, buttonRect.w - 28);
  let fontSize = label.length > 26 ? 16 : 18;
  while (fontSize > 12) {
    ctx.font = FONT(fontSize, true);
    if (ctx.measureText(label).width <= maxTextWidth) break;
    fontSize -= 1;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = FONT(fontSize, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.cx, rect.cy + (hovered && !disabled ? -1 : 0));
  ctx.restore();
}

function drawLevelCard(ctx, images, card, label, itemKeys, hasWaterline, unlocked, completed, hovered) {
  const frame = getCenteredRect(card, hovered && unlocked ? 1.04 : 1);
  const artInsetX = 10;
  const artInsetTop = 10;
  const artInsetBottom = 40;
  const art = {
    x: frame.x + artInsetX,
    y: frame.y + artInsetTop,
    w: frame.w - artInsetX * 2,
    h: frame.h - artInsetTop - artInsetBottom,
  };
  const artRight = art.x + art.w;
  const artBottom = art.y + art.h;

  ctx.save();
  ctx.shadowColor = hovered && unlocked ? 'rgba(26, 63, 111, 0.22)' : 'rgba(60, 39, 22, 0.14)';
  ctx.shadowBlur = hovered && unlocked ? 16 : 10;
  ctx.shadowOffsetY = hovered && unlocked ? 8 : 5;
  ctx.fillStyle = hovered && unlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(252, 246, 233, 0.86)';
  ctx.strokeStyle = hovered && unlocked ? BLUE_MID : 'rgba(114, 85, 56, 0.28)';
  ctx.lineWidth = hovered && unlocked ? 3 : 2;
  drawRoundedRect(ctx, frame.x, frame.y, frame.w, frame.h, 18, true, true);
  ctx.restore();

  ctx.save();
  const water = images['water-bg'];
  drawRoundedRect(ctx, art.x, art.y, art.w, art.h, 14, false, false);
  ctx.clip();
  if (water) {
    ctx.drawImage(water, 0, 0, water.width, water.height, art.x, art.y, art.w, art.h);
  } else {
    ctx.fillStyle = BLUE_LIGHT;
    ctx.fillRect(art.x, art.y, art.w, art.h);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = BLUE_MID;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, art.x, art.y, art.w, art.h, 14, false, true);
  ctx.restore();

  if (hasWaterline) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.78)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(art.x, art.y + art.h / 2);
    ctx.lineTo(artRight, art.y + art.h / 2);
    ctx.stroke();
    ctx.restore();
  }

  const shipImg = images['ship'];
  if (shipImg) {
    const shipW = art.w * 0.27;
    const shipH = shipW * 0.84;
    const shipX = art.x + art.w * 0.28;
    const shipY = hasWaterline ? art.y + art.h * 0.28 : art.y + art.h * 0.52;
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.scale(-1, 1);
    ctx.drawImage(shipImg, -shipW / 2, -shipH / 2, shipW, shipH);
    ctx.restore();
  }

  const itemPositions = [
    { x: artRight - art.w * 0.22, y: art.y + art.h * 0.23 },
    { x: artRight - art.w * 0.22, y: art.y + art.h * 0.52 },
    { x: artRight - art.w * 0.22, y: artBottom - art.h * 0.18 },
  ];
  const itemSize = Math.min(36, art.w * 0.24);

  itemKeys.forEach((itemKey, index) => {
    const itemImg = images[itemKey];
    const point = itemPositions[index];
    if (itemImg) {
      ctx.drawImage(itemImg, point.x - itemSize / 2, point.y - itemSize / 2, itemSize, itemSize);
    }
  });

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(13, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, frame.cx, frame.y + frame.h - 16);

  if (!unlocked) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    drawRoundedRect(ctx, art.x, art.y, art.w, art.h, 14, true, false);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = FONT(32, true);
    ctx.fillText('🔒', frame.cx, art.y + art.h / 2 + 2);
    ctx.restore();
  }

  if (completed) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    drawRoundedRect(ctx, art.x, art.y, art.w, art.h, 14, true, false);
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(frame.cx, art.y + art.h / 2, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(32, true);
    ctx.fillText('✓', frame.cx, art.y + art.h / 2 + 1);
    ctx.restore();
  }
}

export function drawStartScreen(ctx, images, layout, hoverTarget) {
  drawBackground(ctx, images);

  const page = getSharedPageRect(layout);
  const pageCenterX = page.x + page.w / 2;
  drawSharedPageShell(ctx, images, page);

  const logo = images['logo'];
  if (logo) {
    const logoSize = 116;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(logo, pageCenterX - logoSize / 2, page.y + 46, logoSize, logoSize);
    ctx.restore();
  }

  ctx.fillStyle = BLUE_DARK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = "38px 'Aloja', Arial, sans-serif";
  ctx.fillText('The Feedback Compass', pageCenterX, page.y + 205);

  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(17, true);
  ctx.textAlign = 'right';
  ctx.fillText('אספו את הפריט הנכון שלוש פעמים ברצף', page.x + page.w - 56, page.y + 280);

  ctx.fillStyle = BLUE_MID;
  ctx.font = FONT(16);
  ctx.fillText('בכל שלב תגלו את החוקיות בעזרת סוגי משוב שונים.', page.x + page.w - 56, page.y + 322);
  ctx.fillText('שימו לב למה שהמצפן אומר, ובחרו טוב יותר בכל ניסיון.', page.x + page.w - 56, page.y + 352);

  drawPrimaryButton(ctx, layout.startButton, 'להתחלה', hoverTarget?.id === 'start-button');
}

export function drawLevelSelectScreen(ctx, images, state, layout, hoverTarget) {
  const completedLevels = state.completedLevels;
  const allLevelsUnlockedFromStart = state.allLevelsUnlockedFromStart;
  const page = getSharedPageRect(layout);
  const pageCenterX = page.x + page.w / 2;
  const hasSeenReflection = state.hasSeenReflection === true;
  const treasureDisabled = hasSeenReflection ? false : !completedLevels.every(levelComplete => levelComplete === true);
  const buttonLabel = hasSeenReflection ? 'בחזרה למסך הסיכום' : 'השלימו את כל 3 השלבים על מנת לקבל את האוצר';

  drawBackground(ctx, images);
  drawSharedPageShell(ctx, images, page);

  ctx.fillStyle = BLUE_DARK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = FONT(30, true);
  ctx.fillText('בחירת שלב', pageCenterX, page.y + 70);

  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(16, true);
  ctx.textAlign = 'right';
  ctx.fillText('בכל שלב עליכם לגלות החוקיות הנסתרת ולאסוף פריט נכון 3 פעמים ברצף', page.x + page.w - 56, page.y + 108);
  ctx.fillText('פתחו שלבים בהדרגה, ואז חזרו לאסוף את האוצר.', page.x + page.w - 56, page.y + 136);

  const thumbs = [
    { index: 0, label: 'שלב 1: משוב תוצאה', items: ['chest-ribbon', 'chest-plain', 'bomb-lit'], hasLine: false },
    { index: 1, label: 'שלב 2: משוב מתקן', items: ['bomb-unlit', 'chest-green', 'bomb-lit'], hasLine: false },
    { index: 2, label: 'שלב 3: משוב בונה', items: ['chest-ribbon', 'bomb-unlit', 'bomb-lit'], hasLine: true },
  ];

  thumbs.forEach((thumb, index) => {
    const card = layout.levelCards[index];
    if (!card) return;

    const unlocked = thumb.index === 0 || allLevelsUnlockedFromStart || completedLevels[thumb.index - 1] === true;
    const hovered = hoverTarget?.id === `level-${thumb.index}`;

    drawLevelCard(
      ctx,
      images,
      card,
      thumb.label,
      thumb.items,
      thumb.hasLine,
      unlocked,
      completedLevels[thumb.index],
      hovered,
    );
  });

  drawPrimaryButton(
    ctx,
    layout.treasureButton,
    buttonLabel,
    hoverTarget?.id === 'treasure-button',
    treasureDisabled,
  );
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

  const rightMarginX = cardX + cardW - 56;

  ctx.fillStyle = BLUE_MID;
  ctx.font = FONT(15);
  ctx.textAlign = 'right';
  ctx.fillText('כל הכבוד! גיליתם את החוקיות בכל 3 הרמות:', rightMarginX, cardY + 255);

  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(14, true);
  ctx.fillText('1. משוב תוצאה - רק נכון/לא נכון (הכי פחות מועיל ומבלבל)', rightMarginX, cardY + 290);
  ctx.fillText('2. משוב מתקן - מסביר מה שגוי (עוזר חלקית ומפחית תסכול)', rightMarginX, cardY + 320);
  ctx.fillText('3. משוב בונה - נותן אסטרטגיה מלאה ומסביר למה (הכי מקדם למידה!)', rightMarginX, cardY + 350);

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(15, true);
  ctx.fillText('כעת אתם מבינים את הכוח של משוב בונה בעיצוב למידה!', rightMarginX, cardY + 410);

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


export function drawPauseOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 26, 46, 0.72)';
  ctx.fillRect(0, 0, 680, 680);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px \'Rubik\', Arial, sans-serif';
  ctx.fillText('משחק מושהה ⏸', 340, 320);
  ctx.font = '15px \'Rubik\', Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('לחצו על מקש חץ כלשהו או על המסך כדי להמשיך', 340, 365);
  ctx.restore();
}
