import { ITEM, WATERLINE_Y } from './constants.js';

const LEVELS = [
  {
    index: 0,
    feedbackType: 'outcome',
    feedbackTypeName: 'משוב תוצאה',
    feedbackTypeNameEn: 'Outcome Feedback',
    feedbackTypeDesc: 'נכון או לא נכון — ללא שום הסבר.',
    revealCardText:
      '🏴‍☠️ סיימת שלב 1!\n\n' +
      'משוב תוצאה (Outcome Feedback)\n' +
      'רק ✓ או ✗ — ללא שום הסבר.\n\n' +
      'כמו קפטן שאומר "כן!" או "לא!" — בלי להגיד לך למה.\n\n' +
      'כמה ניסיונות לקח לך? זו בדיוק התחושה של תלמיד שמקבל רק נכון/לא נכון ללא הסבר — ניסוי וטעייה בלבד.',
    spawnPool: [
      { type: ITEM.CHEST_RIBBON, weight: 3 },
      { type: ITEM.CHEST_PLAIN,  weight: 3 },
      { type: ITEM.BOMB_LIT,     weight: 2 },
    ],
    isCorrect(item) { return item.type === ITEM.CHEST_RIBBON; },
    isHazard(item)  { return item.type === ITEM.BOMB_LIT; },
    getFeedbackText(_item, correct) { return correct ? 'נכון' : 'לא נכון'; },
    transitionReveal:
      'הכלל היה: ארגז עם סרט אדום = בטוח לאסוף. ארגז ללא סרט = מלכודת. פצצה דולקת = סכנה.',
    moodQuestion: 'איך הרגשת?',
    nextLevelIntro: 'בשלב הבא תקבל הסבר על מה שטעית.',
  },
  {
    index: 1,
    feedbackType: 'corrective',
    feedbackTypeName: 'משוב מתקן',
    feedbackTypeNameEn: 'Corrective Feedback',
    feedbackTypeDesc: 'מסביר מה היה שגוי — אבל לא למה.',
    revealCardText:
      '🔧 סיימת שלב 2!\n\n' +
      'משוב מתקן (Corrective Feedback)\n' +
      'מסביר מה שגוי — אבל לא את הכלל המלא.\n\n' +
      'כמו קפטן שאומר: "זו הייתה פצצה דולקת!" — מועיל יותר, אבל עדיין לא נותן לך אסטרטגיה.\n\n' +
      'הרגשת את ההבדל? קצת פחות תסכול, אבל עדיין קשה לדעת מה לעשות בפעם הבאה.',
    spawnPool: [
      { type: ITEM.CHEST_GREEN, weight: 3 },
      { type: ITEM.BOMB_LIT,    weight: 2 },
      { type: ITEM.BOMB_UNLIT,  weight: 3 },
    ],
    isCorrect(item) { return item.type === ITEM.BOMB_UNLIT; },
    isHazard(item)  { return item.type === ITEM.BOMB_LIT; },
    getFeedbackText(item, correct) {
      if (correct)                          return 'נכון! פצצה כבויה — בטוח לאסוף.';
      if (item.type === ITEM.CHEST_GREEN)   return 'שגיאה! ארגז ירוק — מלכודת.';
      if (item.type === ITEM.BOMB_LIT)      return 'שגיאה! פצצה דולקת — מסוכנת!';
      return 'שגיאה!';
    },
    transitionReveal:
      'הכלל היה: כל הארגזים הירוקים מסוכנים. פצצות דולקות — סכנה. פצצות כבויות — בטוח לאסוף.',
    moodQuestion: 'איך הרגשת לעומת השלב הקודם?',
    nextLevelIntro: 'בשלב הבא תקבל הסבר מלא — כולל למה ואיך להצליח.',
  },
  {
    index: 2,
    feedbackType: 'constructive',
    feedbackTypeName: 'משוב בונה',
    feedbackTypeNameEn: 'Constructive Feedback',
    feedbackTypeDesc: 'מסביר למה ונותן אסטרטגיה לפעם הבאה.',
    revealCardText:
      '⚓ סיימת שלב 3!\n\n' +
      'משוב בונה (Constructive Feedback)\n' +
      'מסביר למה, נותן לך את הכלל ואסטרטגיה לפעם הבאה.\n\n' +
      'כמו קפטן שנותן לך את מפת האוצר המלאה — פתאום הכל הגיוני!\n\n' +
      'הרגשת את ה"אהה!"? זו בדיוק המטרה של משוב בונה — להפוך כאוס לבהירות.',
    spawnPool: [
      { type: ITEM.CHEST_RIBBON, weight: 3 },
      { type: ITEM.BOMB_UNLIT,   weight: 3 },
      { type: ITEM.BOMB_LIT,     weight: 2 },
    ],
    isCorrect(item) {
      if (item.type === ITEM.CHEST_RIBBON) return item.y < WATERLINE_Y;
      if (item.type === ITEM.BOMB_UNLIT)   return item.y >= WATERLINE_Y;
      return false;
    },
    isHazard(item) { return item.type === ITEM.BOMB_LIT; },
    getFeedbackText(item, correct) {
      if (item.type === ITEM.CHEST_RIBBON && correct)
        return 'מצוין! ארגז מעל קו המים — כלל: ארגז צף מעל = אוצר אמיתי. חפש ארגזים בחצי העליון!';
      if (item.type === ITEM.CHEST_RIBBON && !correct)
        return 'טעות! הארגז היה מתחת לקו המים — שם הוא מלכודת. כלל: ארגז מעל קו המים בלבד!';
      if (item.type === ITEM.BOMB_UNLIT && correct)
        return 'נהדר! פצצה כבויה מתחת לקו המים — שם היא בטוחה לאיסוף. כלל: פצצה בחצי התחתון = בטוח!';
      if (item.type === ITEM.BOMB_UNLIT && !correct)
        return 'טעות! הפצצה הייתה מעל קו המים — שם היא מסוכנת. כלל: פצצה כבויה רק בחצי התחתון!';
      if (item.type === ITEM.BOMB_LIT)
        return 'טעות! פצצה דולקת — תמיד מסוכנת, בכל מקום! הימנע מפצצות דולקות.';
      return '';
    },
    transitionReveal:
      'הכלל היה: מעל קו המים — ארגז בטוח, פצצה מסוכנת. מתחת לקו המים — פצצה כבויה בטוחה, ארגז מלכודת. המיקום קובע הכל!',
    moodQuestion: 'איך הרגשת לעומת השלבים הקודמים?',
    nextLevelIntro: null,
  },
];

export default LEVELS;
