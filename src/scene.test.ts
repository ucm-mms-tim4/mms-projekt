import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { describe, expect, it } from "vitest";
import { createScene } from "./scene";

describe("createScene", () => {
  it("contains the ball", () => {
    const engine = new NullEngine();
    const scene = createScene(engine);

    expect(scene.getMeshByName("ball")).not.toBeNull();

    engine.dispose();
  });
});
