// Shared tuning for Moonlight Museum: sizes, speeds, vision and suspicion.

export const VIEW_W = 960;
export const VIEW_H = 600;

export const PLAYER_RADIUS = 10;
export const PLAYER_SPEED = 152;      // px per second, walking
export const SNEAK_SPEED = 76;        // px per second, sneaking (Shift)

export const GUARD_RADIUS = 11;
export const GUARD_SPEED = 62;        // patrol pace, learnable and slow
export const GUARD_INVESTIGATE_SPEED = 92;
export const CONE_RANGE = 178;
export const CONE_HALF_ANGLE = 0.61;  // radians, about 35 degrees each side
export const CONE_RAYS = 24;          // rays cast per cone for wall clipping

export const SUSPICION_FILL_NEAR = 1.15;  // per second at point blank
export const SUSPICION_FILL_FAR = 0.38;   // per second at cone edge
export const SUSPICION_DECAY = 0.3;       // per second once unseen (recoverable)
export const SNEAK_FILL_FACTOR = 0.45;    // sneaking fills suspicion slower

export const COIN_NOISE_RADIUS = 260;     // guards this close hear a tossed coin
export const COIN_LOOK_SECONDS = 1.6;     // time a guard studies the coin spot

export const MAX_STRIKES = 3;             // caught 3 times restarts the level
