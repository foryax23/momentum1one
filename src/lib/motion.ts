/** Shared motion values so every component moves with the same character. Mirrors the --ease-* tokens in styles.css. */

/** Entrances, exits and anything responding to the user. */
export const easeOut = [0.23, 1, 0.32, 1] as const;
/** Elements that move or morph while staying on screen. */
export const easeInOut = [0.77, 0, 0.175, 1] as const;
/** Sheets and drawers. */
export const easeDrawer = [0.32, 0.72, 0, 1] as const;
/** Interruptible, physical motion (docking parts, the course sheet). Keep bounce subtle. */
export const spring = { type: "spring", duration: 0.5, bounce: 0.14 } as const;
