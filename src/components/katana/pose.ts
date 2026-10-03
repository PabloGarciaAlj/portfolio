// Where the katana sits for a given scroll progress. Each animation option
// (one per branch) only changes `poseAt`; the stage, lighting and loading are
// shared.
//
// Units are CSS pixels in the backdrop layer, origin at the layer centre, x to
// the right, y up. The card occupies `card` in the same space, so a pose can be
// placed relative to it (the katana lives behind the card and around its edges).

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
  /** The TFG card, relative to the layer centre. */
  card: Rect;
  /** Narrow viewport: the card stacks and the side margins are tiny. */
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
 * The poster (katana-poster.webp) is the rest pose rendered with the stage
 * lights, tip to the right and no tilt: where its habaki sits in the image (as
 * fractions of its size), how wide it is for a given katana length, and its
 * aspect ratio. Used to place it like the 3D pose. Re-measure when re-rendered.
 */
export const POSTER = { habakiX: 0.2901, habakiY: 0.8048, widthPerLength: 0.9894, aspect: 2196 / 335 };

/** Typical layouts the poster is placed for, before any JS runs. */
export const NOMINAL_LAYOUTS: Record<'wide' | 'compact', Layout> = {
  wide: { width: 1440, height: 406 + 2 * 180, card: { x: 0, y: 0, width: 1088, height: 406 }, compact: false },
  compact: { width: 390, height: 640 + 2 * 120, card: { x: 0, y: 0, width: 358, height: 640 }, compact: true },
};

/** Scroll progress `t`: 0 when the card enters from the bottom, 1 when it leaves at the top. */
export function poseAt(_t: number, layout: Layout): Pose {
  return restPose(layout);
}

/**
 * Base composition: the katana lies in the band between the section title and
 * the card, handle to the left and tip to the right, with its lower part tucked
 * behind the card's top edge as if resting behind it. The tip runs past the
 * card's right edge into the margin.
 */
export function restPose({ card, compact }: Layout): Pose {
  const length = compact ? card.width * 1.08 : Math.min(card.width * 1.02, 1240);
  const top = card.y + card.height / 2;
  return {
    // Habaki about a third of the way along, as on the real sword.
    x: card.x - card.width / 2 + length * (compact ? 0.3 : 0.36),
    y: top + length * (compact ? 0.008 : 0.002),
    z: 0,
    length,
    tilt: compact ? 0.035 : 0.025,
    // A slight turn shows the face of the guard, as in the Blender render.
    yaw: -0.32,
    roll: 0.3,
  };
}
