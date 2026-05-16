# Feedback Game Light Redesign — Design

## Purpose

The game teaches learners to distinguish among three feedback types:

- **Outcome feedback** — tells the learner whether the choice was right or wrong.
- **Corrective feedback** — identifies the mistake and gives the correct answer.
- **Elaborative feedback** — explains the reasoning and gives a strategy for future choices.

The player should experience each feedback type after both a successful and an unsuccessful game event, so the lesson is learned through contrast rather than explanation alone.

## Player Loop

1. Player chooses one feedback mode.
2. Player sails through the scene while avoiding hazards and collecting treasure.
3. A collision pauses play and shows feedback in the selected mode.
4. The checklist records that exact combination:
   - outcome-positive
   - outcome-negative
   - corrective-positive
   - corrective-negative
   - elaborative-positive
   - elaborative-negative
5. When all six combinations are complete, the player can finish the mission and see the victory screen.

## Visual Direction

The redesign keeps the existing educational structure but restages the game around the supplied watercolor assets:

- `Water background.png` becomes the sea backdrop.
- `background texture.png` adds subtle paper texture.
- `Ship.png` replaces the drawn/emoji ship.
- `Bomb.png` replaces negative items.
- `TreasureChest.png` replaces positive items and victory/progress imagery.
- `Arrow.png` becomes the on-screen up/down control.
- `ColorPallete.png` informs the CSS color system rather than appearing as gameplay art.

Visual tone: warm watercolor illustration, parchment UI, dark-brown outlines, muted sea blues, restrained use of gold for reward and active controls.

## Controls

- The ship remains on one fixed **X coordinate** for the whole game; only **Y** changes.
- Player may control vertical movement through:
  - on-screen up/down arrow buttons
  - keyboard arrow keys
  - mouse movement outside the reserved control lane
- The left control lane is reserved for arrow buttons; moving the mouse inside that lane must not move the ship.
- When keyboard arrows are held, keyboard input takes precedence over mouse tracking until the keys are released.

## HUD and Utility Controls

- Add a compact mute + speed control cluster.
- Use only the referenced control language, not the rest of that game's presentation:
  - circular amber buttons
  - dark outlines
  - compact parchment-gold tray
  - teal slider fill
  - lightning glyph for speed
- For this game, place the cluster at the **bottom-left** of the game area so the slider can live along the bottom edge.

## Architecture

Split the current monolith into focused browser ES modules:

- `js/main.js` — bootstrapping and dependency wiring
- `js/game-state.js` — score, progress, checklist, completion state
- `js/assets.js` — local asset manifest and preload helpers
- `js/input.js` — mouse, keyboard, and button controls
- `js/renderer.js` — canvas scene drawing
- `js/ui.js` — DOM updates, overlays, feedback bubble, utility controls
- `css/style.css` — extracted styles plus new visual system

This keeps the game small while giving each subsystem one clear responsibility.

## Data Flow

1. `main.js` initializes assets, state, UI, input, and renderer.
2. `input.js` emits desired Y-axis movement updates.
3. `game-state.js` owns score, checklist, feedback mode, speed multiplier, and completion state.
4. `renderer.js` reads immutable render inputs from current state and draws the frame.
5. `ui.js` reacts to state changes by updating labels, overlays, progress markers, checklist rows, and utility controls.

## Error Handling and Runtime Expectations

- Images preload before the first active game session starts.
- If an image fails to load, the game should log the failure and continue with a safe canvas fallback rather than crashing.
- Speed multiplier should stay within the configured slider bounds.
- Ship Y should remain clamped inside the playable canvas bounds.
- Browser ES modules require a local web server; opening `index.html` directly from `file://` is unsupported.

## Testing Strategy

Automated tests cover pure behavior:

- six-slot checklist completion
- score increase/decrease clamping
- speed multiplier clamping
- mouse dead-zone handling
- keyboard-over-mouse precedence
- fixed-X ship model

Manual browser verification covers:

- asset loading and layering
- on-screen controls
- feedback overlays
- checklist progression
- victory transition
- responsive resizing

