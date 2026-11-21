/// <reference types="node" />
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { MOUSE_SENSITIVITY } from "../player";
import { loadRoom1 } from "./room1";

const model = readFileSync("src/assets/models/room1-cryochamber.glb");
const STEP = 1 / 60;
const noLook = { x: 0, y: 0 };

let engine: NullEngine;

beforeAll(() => {
  registerBuiltInLoaders();
});

afterEach(() => {
  engine.dispose();
});

async function load() {
  engine = new NullEngine();
  return loadRoom1(engine, new Uint8Array(model));
}

describe("room 1", () => {
  it("lets the player walk from the start to the hatch", async () => {
    const room = await load();
    expect(room.reachedExit()).toBe(false);

    for (let t = 0; t < 10 && !room.reachedExit(); t += STEP) {
      room.player.update({ forward: 1, right: 0 }, noLook, STEP);
    }

    expect(room.reachedExit()).toBe(true);
  });

  it("keeps the player inside the walls", async () => {
    const room = await load();
    const turn = { x: Math.PI / 4 / MOUSE_SENSITIVITY, y: 0 };

    for (let heading = 0; heading < 8; heading++) {
      room.player.update({ forward: 0, right: 0 }, turn, STEP);
      for (let t = 0; t < 6; t += STEP) {
        room.player.update({ forward: 1, right: 0 }, noLook, STEP);
      }
      // Inner walls are at x = ±5 and z = ±4.
      expect(Math.abs(room.player.position.x)).toBeLessThan(5);
      expect(Math.abs(room.player.position.z)).toBeLessThan(4);
    }
  });
});
