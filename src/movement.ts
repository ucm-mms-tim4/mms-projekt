export interface MoveAxes {
  forward: number;
  right: number;
}

const KEYS_FORWARD = ["KeyW", "ArrowUp"];
const KEYS_BACK = ["KeyS", "ArrowDown"];
const KEYS_LEFT = ["KeyA", "ArrowLeft"];
const KEYS_RIGHT = ["KeyD", "ArrowRight"];

// KeyboardEvent.code is the physical key, so Shift, Caps Lock and the keyboard layout do not matter.
export function moveAxes(pressed: ReadonlySet<string>): MoveAxes {
  const held = (codes: string[]) => codes.some((code) => pressed.has(code));
  return {
    forward: Number(held(KEYS_FORWARD)) - Number(held(KEYS_BACK)),
    right: Number(held(KEYS_RIGHT)) - Number(held(KEYS_LEFT)),
  };
}

// Horizontal step for a camera turned by yaw around the Y axis.
// Babylon is left-handed: yaw 0 looks along +Z and right is +X.
export function walkStep(axes: MoveAxes, yaw: number, distance: number) {
  const length = Math.hypot(axes.forward, axes.right);
  if (length === 0) {
    return { x: 0, z: 0 };
  }
  // Normalized so walking diagonally is not faster.
  const forward = (axes.forward / length) * distance;
  const right = (axes.right / length) * distance;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return {
    x: forward * sin + right * cos,
    z: forward * cos - right * sin,
  };
}
