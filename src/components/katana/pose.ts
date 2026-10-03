// Where the katana sits for a given scroll progress. The stage, lighting and
// loading live in KatanaScene / KatanaBackdrop; this file is the choreography.
//
// Units are CSS pixels in the backdrop layer, origin at the layer centre, x to
// the right, y up. The card occupies `card` in the same space, so a pose can be
// placed relative to it: the katana crosses diagonally *behind* the card and
// shows in the free space at its sides, above and below.

export interface Rect {
  /** Centre of the rect. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout {
  /** The backdrop layer (the canvas), in CSS pixels. */
  width: number;
  height: number;
  /** Width of the section's content (the card is narrower and centred in it). */
  container: number;
  /** The TFG card, relative to the layer centre. */
  card: Rect;
  /** Narrow viewport: the card takes the full width, only above and below are free. */
  compact: boolean;
}

export interface Pose {
  /** Habaki (the collar above the guard) position, the pivot of every rotation. */
  x: number;
  y: number;
  /** Depth in pixels; positive comes towards the viewer (perspective only). */
  z: number;
  /** Total length on screen, in pixels. */
  length: number;
  /** In-plane angle of the blade, radians, counter-clockwise from pointing right. */
  tilt: number;
  /** Turn towards or away from the viewer around the vertical axis, radians. */
  yaw: number;
  /** Spin around the katana's own long axis, radians (0 = edge up, as modelled). */
  roll: number;
}

/**
 * The poster (katana-poster.webp) is the final pose (`poseAt(1)`) rendered with
 * the stage lights, with no tilt: where its habaki sits in the image (as
 * fractions of its size), how wide it is for a given katana length, and its
 * aspect ratio. Used to place it like the 3D pose. Re-measure when re-rendered.
 */
export const POSTER = { habakiX: 0.217, habakiY: 0.8114, widthPerLength: 1.1245, aspect: 4221 / 565 };

/** Typical layouts the poster is placed for, before any JS runs. */
export const NOMINAL_LAYOUTS: Record<'wide' | 'compact', Layout> = {
  wide: {
    width: 1440,
    height: 288 + 100 + 110,
    container: 1088,
    card: { x: 0, y: -5, width: 736, height: 288 },
    compact: false,
  },
  compact: {
    width: 390,
    height: 442 + 120 + 96,
    container: 358,
    card: { x: 0, y: -12, width: 358, height: 442 },
    compact: true,
  },
};

// Where the habaki sits along the katana, pommel (0) to tip (1), measured on
// the model (z from -0.567 to 1.217, habaki at 0).
const HABAKI_ALONG = 0.318;
// Edge up as modelled plus a little turn, so the flat catches the light.
const REST_ROLL = 0.3;

/**
 * Scroll progress `t`: 0 when the card enters from the bottom, 1 when it leaves
 * at the top (0.5 = card centred on screen).
 *
 * The katana lies behind the card, almost level on wide screens (the blade's
 * own curve gives it its slight rise) and upright on phones. It starts small,
 * its two ends just showing past the card's sides, and comes closer slowly as
 * the card rises: it grows to about 2.3 times the section's width while it makes
 * one full, smooth turn on its own axis, so the light runs across the steel and
 * the guard spins. It ends with the guard in the left margin and the blade
 * crossing behind the card to the right edge, and holds there while it leaves.
 */
export function poseAt(t: number, layout: Layout): Pose {
  const { card, compact, container } = layout;
  // Both eased over most of the time the katana is on screen: from the card
  // entering at the bottom until it is half under the header (t ≈ 0.8), so it
  // keeps moving while it rises and settles just before it leaves. Slow, no
  // step, no sudden start or stop.
  const grow = ease(0, 0.82, t);
  const spin = ease(0.02, 0.8, t);

  const start = card.width * (compact ? 1.9 : 1.35);
  const end = compact ? container * 3.36 : Math.min(container * 2.3, 3120);
  const length = start + (end - start) * grow;

  // Upright on phones, where only the space above and below the card is free.
  // On wide screens nearly level: the blade's curve already lifts the tip about
  // 6° over the handle, so the steel never runs out of the band at the top.
  const tilt = compact ? 1.12 : 0.04;
  // Turned away at first, facing the viewer more as it comes closer.
  const yaw = -0.55 + 0.25 * grow;

  // The point of the katana kept over the card's centre: its middle at first,
  // then a little towards the tip, so the guard ends up beside the card.
  const focus = 0.5 + (compact ? 0.06 : 0.055) * grow;
  const along = (focus - HABAKI_ALONG) * length * Math.cos(yaw);

  return {
    x: card.x - along * Math.cos(tilt),
    // A little below the centre, so the rising blade sits mid-band on the right.
    y: card.y - along * Math.sin(tilt) - (compact ? 0 : card.height * 0.14),
    z: 0,
    length,
    tilt,
    yaw,
    // One full turn, ending at the resting angle.
    roll: REST_ROLL - (1 - spin) * Math.PI * 2,
  };
}

/** 0 before `from`, 1 after `to`, eased in between (smoothstep). */
function ease(from: number, to: number, t: number) {
  const x = Math.max(0, Math.min(1, (t - from) / (to - from)));
  return x * x * (3 - 2 * x);
}
