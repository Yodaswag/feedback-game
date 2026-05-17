# Project Rules and Instructions

## Rule: Small Surgical Game Edits

1. **Surgical Edits First:** If the user request is a small, narrow surgical game edit (such as changing constants, speed values, text, asset paths, font styling, or sprite direction in the game files), you **MUST** immediately prioritize and invoke the `surgical-game-edits` skill.
2. **No Autonomous Brainstorming:** For small/surgical edits, you **ABSOLUTELY MUST NOT** autonomously invoke the `brainstorming` skill, write spec documents, or create complex multi-step implementation plans.
3. **No Excessive Questioning:** Do not ask the user too many questions or demand a lengthy collaborative design spec phase for simple surgical changes. State the scope, identify the exact lines/constants to change, and execute the edit directly.
4. **Preserve Current Design & Codebase:** Only touch the exact files and lines required for the requested outcome. Do not perform adjacent cleanup, renames, refactorings, formatting, or dead code removal unless explicitly requested.
