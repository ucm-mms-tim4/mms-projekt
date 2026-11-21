import { describe, expect, it } from "vitest";
import { flyStep, moveAxes, walkStep, type MoveAxes } from "./movement";

function axes(forward: number, right: number, up = 0): MoveAxes {
  return { forward, right, up, fast: false };
}

describe("moveAxes", () => {
  it("maps WASD and arrows", () => {
    expect(moveAxes(new Set(["KeyW"]))).toEqual(axes(1, 0));
    expect(moveAxes(new Set(["ArrowDown", "KeyD"]))).toEqual(axes(-1, 1));
  });

  it("cancels opposite keys", () => {
    expect(moveAxes(new Set(["KeyA", "KeyD"]))).toEqual(axes(0, 0));
  });

  it("maps Q and E to down and up, Shift to fast", () => {
    expect(moveAxes(new Set(["KeyE", "ShiftLeft"]))).toEqual({
      ...axes(0, 0, 1),
      fast: true,
    });
    expect(moveAxes(new Set(["KeyQ"]))).toEqual(axes(0, 0, -1));
  });
});

describe("walkStep", () => {
  it("does not move without input", () => {
    expect(walkStep(axes(0, 0), 1, 2)).toEqual({ x: 0, z: 0 });
  });

  it("walks along +Z at yaw 0 and +X when strafing right", () => {
    const ahead = walkStep(axes(1, 0), 0, 2);
    expect(ahead.x).toBeCloseTo(0);
    expect(ahead.z).toBeCloseTo(2);

    const right = walkStep(axes(0, 1), 0, 2);
    expect(right.x).toBeCloseTo(2);
    expect(right.z).toBeCloseTo(0);
  });

  it("follows the yaw", () => {
    const step = walkStep(axes(1, 0), Math.PI / 2, 1);
    expect(step.x).toBeCloseTo(1);
    expect(step.z).toBeCloseTo(0);
  });

  it("is not faster diagonally", () => {
    const step = walkStep(axes(1, 1), 0.3, 1);
    expect(Math.hypot(step.x, step.z)).toBeCloseTo(1);
  });

  it("ignores up", () => {
    expect(walkStep(axes(0, 0, 1), 0, 1)).toEqual({ x: 0, z: 0 });
  });
});

describe("flyStep", () => {
  it("does not move without input", () => {
    expect(flyStep(axes(0, 0), 1, 0.5, 2)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("matches walking when looking straight ahead", () => {
    const fly = flyStep(axes(1, 1), 0.7, 0, 2);
    const walk = walkStep(axes(1, 1), 0.7, 2);
    expect(fly.x).toBeCloseTo(walk.x);
    expect(fly.y).toBeCloseTo(0);
    expect(fly.z).toBeCloseTo(walk.z);
  });

  it("goes down when looking down", () => {
    const step = flyStep(axes(1, 0), 0, Math.PI / 2, 1);
    expect(step.y).toBeCloseTo(-1);
    expect(step.z).toBeCloseTo(0);
  });

  it("goes straight up with E", () => {
    expect(flyStep(axes(0, 0, 1), 1, 0.5, 2)).toEqual({ x: 0, y: 2, z: 0 });
  });

  it("is not faster diagonally", () => {
    const step = flyStep(axes(1, 1), 0.3, 0.4, 1);
    expect(Math.hypot(step.x, step.y, step.z)).toBeCloseTo(1);
  });
});
