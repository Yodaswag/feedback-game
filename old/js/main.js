import { preloadImages } from './assets.js';
import {
  createInitialState,
  applyCollision,
  setFeedbackMode,
  setSpeedMultiplier,
  isMissionComplete,
} from './game-state.js';
import {
  SHIP_X,
  CONTROL_LANE_WIDTH,
  shouldTrackMouse,
  resolveShipY,
} from './input.js';
import { drawScene } from './renderer.js';
import { updateChecklist, wireUtilityControls } from './ui.js';

const MODE_META = {
  outcome: {
    label: 'משוב תוצאה',
    color: '#ef4444',
    explanation: 'משוב תוצאה: המינימום הנדרש. רק לדעת אם פגעתם או פספסתם.',
  },
  corrective: {
    label: 'משוב מתקן',
    color: '#f97316',
    explanation: 'משוב מתקן: אומר לכם מה הטעות ומה היה צריך להיות במקום.',
  },
  elaborative: {
    label: 'משוב בונה',
    color: '#22c55e',
    explanation: 'משוב בונה: מסביר את ההיגיון ונותן אסטרטגיה שתעזור לכם לא לטעות שוב.',
  },
};

const ITEM_TYPES = [
  { id: 'treasure', label: 'יהלום',    isGood: true,  hint: 'חפצים נוצצים מעידים על אוצר יקר. חפש את הניצוץ!' },
  { id: 'barrel',   label: 'חבית נפט', isGood: false, hint: 'חביות נפט הן כהות ואטומות. הן פוגעות בסביבה הימית.' },
  { id: 'fish',     label: 'דג זהב',   isGood: true,  hint: 'דגים צהובים הם סימן למים בריאים. הם תמיד בחירה טובה.' },
  { id: 'mine',     label: 'מוקש ימי', isGood: false, hint: 'מוקשים הם תמיד שחורים עם קוצים חדים. היזהר מצורות אלו!' },
];

const SPAWN_INTERVAL_BASE = 1.8; // seconds
const SHIP_SPEED_PX = 220;

function getFeedbackText(mode, item) {
  if (item.isGood) {
    if (mode === 'outcome') {
      return { title: 'נכון!', msg: 'הוספת אוצר לתיבה! הניקוד עלה.', icon: '⭐' };
    }
    if (mode === 'corrective') {
      return { title: 'מעולה!', msg: `נכון מאוד, אספת ${item.label}. פריט זה מועיל למסע.`, icon: '⭐' };
    }
    return {
      title: 'בחירה חכמה!',
      msg: `זיהית נכון את ה${item.label}! ${item.hint} ההצלחה שלך נובעת מהבנת סימני הים.`,
      icon: '⭐',
    };
  }
  if (mode === 'outcome') {
    return { title: 'טעות!', msg: 'זה לא אוצר. איבדת פריט מהתיבה.', icon: '🚫' };
  }
  if (mode === 'corrective') {
    return { title: 'זהירות!', msg: `טעות, פגעת ב${item.label}. זה מזיק למשימה שלך ומעכב אותך.`, icon: '🚫' };
  }
  return {
    title: 'משוב לשיפור:',
    msg: `אופס, פגעת ב${item.label}. זכור: ${item.hint} שימוש בסימנים האלו יעזור לך להימנע מטעויות בעתיד.`,
    icon: '🚫',
  };
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameUI = document.getElementById('gameUI');
const winUI = document.getElementById('winUI');
const feedbackBubble = document.getElementById('feedbackBubble');
const fbTitle = document.getElementById('fbTitle');
const fbText = document.getElementById('fbText');
const fbIcon = document.getElementById('fbIcon');
const fbTag = document.getElementById('fbTag');
const feedbackCloseBtn = document.getElementById('feedbackCloseBtn');
const modeExplanation = document.getElementById('modeExplanation');
const overlayStartBtn = document.getElementById('overlayStartBtn');
const spotlightStartHint = document.getElementById('spotlightStartHint');
const modeSpotlight = document.getElementById('modeSpotlight');
const mainStartBtn = document.getElementById('mainStartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

let state = createInitialState();
let shipY = 0;
let keyboardDirection = 0;
let mouseY = null;
let lastTime = performance.now();
let assets = {};
let items = [];
let isRunning = false;
let spawnTimer = 0;
let hasSelectedInitialMode = false;

function resize() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  if (!shipY) shipY = canvas.height / 2;
}

function spawnItem() {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  items.push({
    ...type,
    x: canvas.width + 100,
    y: 100 + Math.random() * Math.max(1, canvas.height - 200),
    speed: (140 + Math.random() * 100) * state.speedMultiplier,
  });
}

function showFeedback(item) {
  const meta = MODE_META[state.feedbackMode];
  const { title, msg, icon } = getFeedbackText(state.feedbackMode, item);
  fbTitle.textContent = title;
  fbText.textContent = msg;
  fbIcon.textContent = icon;
  fbTag.textContent = meta.label;
  feedbackBubble.style.borderColor = item.isGood ? '#22c55e' : '#ef4444';
  feedbackBubble.classList.remove('hidden');
}

function hideFeedback() {
  feedbackBubble.classList.add('hidden');
}

function handleCollision(item) {
  isRunning = false;
  state = applyCollision(state, { isGood: item.isGood });
  updateChecklist(state.checklist);
  showFeedback(item);
  if (isMissionComplete(state)) {
    mainStartBtn.disabled = false;
    mainStartBtn.textContent = 'סיום המשימה וקבלת האוצר 🏆';
    mainStartBtn.className = 'pulse-gold bg-[#d69e2e] hover:bg-[#b7791f] text-white font-black py-4 rounded-xl shadow-2xl transition-all scale-105 text-sm uppercase';
  }
}

function updateWorld(dt) {
  spawnTimer += dt;
  const interval = SPAWN_INTERVAL_BASE / state.speedMultiplier;
  if (spawnTimer >= interval) {
    spawnItem();
    spawnTimer = 0;
  }

  for (const item of items) {
    item.x -= item.speed * dt;
  }

  // Collision detection
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (Math.abs(item.x - SHIP_X) < 60 && Math.abs(item.y - shipY) < 40) {
      items.splice(i, 1);
      handleCollision(item);
      return; // pause; stop processing this frame
    }
  }

  // Remove off-screen items
  items = items.filter((item) => item.x > -100);
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  shipY = resolveShipY({
    currentY: shipY,
    mouseY,
    keyboardDirection,
    dt,
    speed: SHIP_SPEED_PX,
    canvasHeight: canvas.height,
  });

  if (isRunning) {
    updateWorld(dt);
  }

  drawScene(ctx, canvas, assets, { shipY, items });
  requestAnimationFrame(loop);
}

function startGame() {
  if (!hasSelectedInitialMode) return;
  gameUI.classList.add('hidden');
  isRunning = true;
}

function syncStartGate() {
  overlayStartBtn.disabled = !hasSelectedInitialMode;
  spotlightStartHint.classList.toggle('hidden', hasSelectedInitialMode);
  modeSpotlight.classList.toggle('hidden', hasSelectedInitialMode);
}

function setMode(mode) {
  state = setFeedbackMode(state, mode);
  if (!hasSelectedInitialMode) {
    hasSelectedInitialMode = true;
    syncStartGate();
  }
  for (const m of Object.keys(MODE_META)) {
    const card = document.getElementById(`mode-${m}`);
    if (!card) continue;
    card.classList.toggle('active', m === mode);
    card.classList.toggle('spotlight-target', !hasSelectedInitialMode);
  }
  modeExplanation.textContent = MODE_META[mode].explanation;
}

function showModeSelectionPrompt() {
  modeExplanation.textContent = 'בחרו אחד מסוגי המשוב כדי להתחיל, ואז נסו להשלים בכל כרטיס גם אוצר וגם מכשול.';
  for (const m of Object.keys(MODE_META)) {
    const card = document.getElementById(`mode-${m}`);
    if (!card) continue;
    card.classList.remove('active');
    card.classList.add('spotlight-target');
  }
  syncStartGate();
}

function wireButtons() {
  overlayStartBtn.addEventListener('click', startGame);
  mainStartBtn.addEventListener('click', () => {
    if (isMissionComplete(state)) {
      isRunning = false;
      winUI.classList.remove('hidden');
    }
  });
  playAgainBtn.addEventListener('click', () => location.reload());
  feedbackCloseBtn.addEventListener('click', () => {
    hideFeedback();
    isRunning = true;
  });

  for (const mode of Object.keys(MODE_META)) {
    const card = document.getElementById(`mode-${mode}`);
    if (!card) continue;
    card.addEventListener('click', () => setMode(mode));
  }
}

window.addEventListener('resize', resize);
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  if (shouldTrackMouse(x, CONTROL_LANE_WIDTH) && keyboardDirection === 0) {
    mouseY = event.clientY - rect.top;
  }
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') keyboardDirection = -1;
  if (event.key === 'ArrowDown') keyboardDirection = 1;
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') keyboardDirection = 0;
});

wireUtilityControls({
  onSpeedChange(value) {
    state = setSpeedMultiplier(state, value);
  },
});

resize();
showModeSelectionPrompt();
wireButtons();
assets = await preloadImages();
updateChecklist(state.checklist);
lastTime = performance.now();
requestAnimationFrame(loop);
