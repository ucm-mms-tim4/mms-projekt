import type { Engine } from "@babylonjs/core/Engines/engine";
import { EngineInstrumentation } from "@babylonjs/core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "@babylonjs/core/Instrumentation/sceneInstrumentation";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/AbstractEngine/abstractEngine.timeQuery";
import "@babylonjs/core/Engines/Extensions/engine.query";
import "@babylonjs/core/Rendering/boundingBoxRenderer";
import type { Room1 } from "../levels/room1";
import "./devTools.css";

const TOGGLE_KEY = "Backquote";
const RENDER_SCALES = [1, 0.5, 0.25];
const REFRESH_MS = 250;
const MESSAGE_MS = 2000;

// Chrome only, not in the TypeScript DOM types.
type ChromePerformance = Performance & {
  memory?: { usedJSHeapSize: number };
};

export class DevTools {
  private readonly panel = document.createElement("pre");
  private readonly engineStats: EngineInstrumentation;
  private readonly gpuName: string;
  private open = false;
  private noclip = false;
  private wireframe = false;
  private boundingBoxes = false;
  private renderScale = 1;
  private message = "";
  private messageUntil = 0;
  private scene: Scene | null = null;
  private sceneStats: SceneInstrumentation | null = null;

  constructor(
    private readonly engine: Engine,
    private readonly getRoom: () => Room1 | null,
  ) {
    this.panel.id = "dev-tools";
    this.panel.hidden = true;
    document.body.append(this.panel);

    this.engineStats = new EngineInstrumentation(engine);
    this.engineStats.captureGPUFrameTime = true;
    this.gpuName = engine.getGlInfo().renderer;

    window.addEventListener("keydown", (event) => {
      this.onKey(event);
    });
    setInterval(() => {
      this.refresh();
    }, REFRESH_MS);
  }

  private onKey(event: KeyboardEvent) {
    // Ctrl+F, Ctrl+P and Ctrl+R belong to the browser.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    if (event.code === TOGGLE_KEY) {
      this.open = !this.open;
      this.panel.hidden = !this.open;
      this.refresh();
      return;
    }
    // Tool keys work only with the panel open, so they never fire by accident.
    if (!this.open) {
      return;
    }
    const room = this.getRoom();
    switch (event.code) {
      case "KeyN":
        this.noclip = !this.noclip;
        break;
      case "KeyF":
        this.wireframe = !this.wireframe;
        break;
      case "KeyB":
        this.boundingBoxes = !this.boundingBoxes;
        break;
      case "KeyR":
        this.nextRenderScale();
        break;
      case "KeyP":
        this.copyPosition(room);
        break;
      case "KeyH":
        room?.player.teleport(room.spawn.position, room.spawn.yaw);
        break;
      case "KeyX":
        // The exit does not trigger in noclip.
        this.noclip = false;
        room?.player.teleport(
          new Vector3(room.exit.x, 0, room.exit.z),
          room.player.facing,
        );
        break;
      default:
        return;
    }
    if (room) {
      this.apply(room);
      // Nothing renders while paused, so show the change now.
      room.scene.render();
    }
    this.refresh();
  }

  // A new scene and player start with Babylon defaults, so the toggles are set again.
  private apply(room: Room1) {
    room.scene.forceWireframe = this.wireframe;
    room.scene.forceShowBoundingBoxes = this.boundingBoxes;
    room.player.noclip = this.noclip;
  }

  private watch(room: Room1 | null) {
    const scene = room?.scene ?? null;
    if (scene === this.scene) {
      return;
    }
    this.sceneStats?.dispose();
    this.sceneStats = null;
    this.scene = scene;
    if (room) {
      this.sceneStats = new SceneInstrumentation(room.scene);
      this.sceneStats.captureFrameTime = true;
      this.apply(room);
    }
  }

  private nextRenderScale() {
    const next =
      (RENDER_SCALES.indexOf(this.renderScale) + 1) % RENDER_SCALES.length;
    this.renderScale = RENDER_SCALES[next] ?? 1;
    this.engine.setHardwareScalingLevel(1 / this.renderScale);
  }

  private copyPosition(room: Room1 | null) {
    if (!room) {
      return;
    }
    const text = describePosition(room);
    console.log(text);
    // navigator.clipboard is missing outside a secure context, for example on a
    // LAN address with pnpm dev --host. Starting from a promise turns that into the catch.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(() => {
        this.flash("Copied");
      })
      .catch(() => {
        this.flash("Copy failed, see console");
      });
  }

  private flash(message: string) {
    this.message = message;
    this.messageUntil = performance.now() + MESSAGE_MS;
    this.refresh();
  }

  private refresh() {
    const room = this.getRoom();
    this.watch(room);
    if (!this.open) {
      return;
    }
    this.panel.textContent = [
      "DEV TOOLS   [`] close",
      "",
      ...this.statsLines(room),
      "",
      room ? describePosition(room) : "Position     -",
      "",
      `[N] noclip           ${onOff(this.noclip)}   Q/E down/up, Shift fast, turn off in open space`,
      `[F] wireframe        ${onOff(this.wireframe)}`,
      `[B] bounding boxes   ${onOff(this.boundingBoxes)}`,
      `[R] render scale     ${percent(this.renderScale)}`,
      "[P] copy position",
      "[H] teleport to spawn",
      "[X] teleport to exit (finishes the room)",
      performance.now() < this.messageUntil ? `\n${this.message}` : "",
    ].join("\n");
  }

  private statsLines(room: Room1 | null): string[] {
    const engine = this.engine;
    const gpuTime = engine.getCaps().timerQuery
      ? ms(this.engineStats.gpuFrameTimeCounter.lastSecAverage * 1e-6)
      : "not supported";
    const heap = (performance as ChromePerformance).memory?.usedJSHeapSize;
    const lines = [
      `FPS          ${engine.getFps().toFixed(0)}`,
      `Render CPU   ${this.sceneStats ? ms(this.sceneStats.frameTimeCounter.lastSecAverage) : "-"}`,
      `GPU frame    ${gpuTime}`,
      `Resolution   ${engine.getRenderWidth()} x ${engine.getRenderHeight()}`,
      `GPU          ${this.gpuName}`,
      `JS heap      ${heap === undefined ? "Chrome only" : `${(heap / 1048576).toFixed(0)} MB`}`,
    ];
    if (!room || !this.sceneStats) {
      return lines;
    }
    const scene = room.scene;
    return [
      ...lines,
      `Draw calls   ${this.sceneStats.drawCallsCounter.current}`,
      `Meshes       ${scene.getActiveMeshes().length} drawn / ${scene.meshes.length}`,
      `Triangles    ${(scene.getActiveIndices() / 3).toFixed(0)} drawn`,
      `Vertices     ${scene.getTotalVertices()} in scene`,
      `Materials    ${scene.materials.length}`,
      `Textures     ${scene.textures.length}`,
      `Lights       ${scene.lights.length}`,
    ];
  }
}

function describePosition(room: Room1): string {
  const { x, y, z } = room.player.position;
  const yaw = room.player.facing;
  return `Position     (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})  yaw ${yaw.toFixed(2)}`;
}

function onOff(on: boolean): string {
  return on ? "ON " : "off";
}

function percent(scale: number): string {
  return `${(scale * 100).toFixed(0)} %`;
}

function ms(value: number): string {
  return `${value.toFixed(2)} ms`;
}
