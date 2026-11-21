import { describe, expect, it } from "vitest";
import { moveAxes, walkStep } from "./movement";

describe("moveAxes", () => {
  it("maps WASD and arrows", () => {
    expect(moveAxes(new Set(["KeyW"]))).toEqual({ forward: 1, right: 0 });
    expect(moveAxes(new Set(["ArrowDown", "KeyD"]))).toEqual({
      forward: -1,
      right: 1,
    });
  });

  it("cancels opposite keys", () => {
    expect(moveAxes(new Set(["KeyA", "KeyD"]))).toEqual({
      forward: 0,
      right: 0,
    });
  });
});

describe("walkStep", () => {
  it("does not move without input", () => {
    expect(walkStep({ forward: 0, right: 0 }, 1, 2)).toEqual({ x: 0, z: 0 });
  });

  it("walks along +Z at yaw 0 and +X when strafing right", () => {
    const ahead = walkStep({ forward: 1, right: 0 }, 0, 2);
    expect(ahead.x).toBeCloseTo(0);
    expect(ahead.z).toBeCloseTo(2);

    const right = walkStep({ forward: 0, right: 1 }, 0, 2);
    expect(right.x).toBeCloseTo(2);
    expect(right.z).toBeCloseTo(0);
  });

  it("follows the yaw", () => {
    const step = walkStep({ forward: 1, right: 0 }, Math.PI / 2, 1);
    expect(step.x).toBeCloseTo(1);
    expect(step.z).toBeCloseTo(0);
  });

  it("is not faster diagonally", () => {
    const step = walkStep({ forward: 1, right: 1 }, 0.3, 1);
    expect(Math.hypot(step.x, step.z)).toBeCloseTo(1);
  });
});
