import type { Engine } from "@babylonjs/core/Engines/engine";
import { Input } from "./input";
import { loadRoom1, type Room1 } from "./levels/room1";

type State = "menu" | "loading" | "playing" | "paused" | "finished";

// Longer frames (tab in background, slow load) would make the player jump.
const MAX_FRAME_TIME = 0.1;

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`Missing #${id} in index.html`);
  }
  return found;
}

export class Game {
  private state: State = "menu";
  private room: Room1 | null = null;
  private readonly input: Input;

  // One overlay per state, only the current one is visible.
  private readonly screens: Record<State, HTMLElement> = {
    menu: element("menu"),
    loading: element("loading"),
    playing: element("hud"),
    paused: element("pause"),
    finished: element("finish"),
  };
  private readonly mouseHint = element("mouse-hint");
  private readonly loadingText = element("loading-text");

  constructor(
    private readonly engine: Engine,
    canvas: HTMLCanvasElement,
  ) {
    this.input = new Input(canvas);

    element("start-button").addEventListener("click", () => {
      void this.start();
    });
    element("again-button").addEventListener("click", () => {
      void this.start();
    });
    element("resume-button").addEventListener("click", () => {
      this.resume();
    });
    element("quit-button").addEventListener("click", () => {
      this.showMenu();
    });
    element("menu-button").addEventListener("click", () => {
      this.showMenu();
    });

    canvas.addEventListener("click", () => {
      if (this.state === "playing" && !this.input.isPointerLocked()) {
        this.input.lockPointer();
      }
    });
    // With the pointer locked the browser keeps Esc for itself and only
    // releases the mouse. That release is our signal to pause.
    document.addEventListener("pointerlockchange", () => {
      this.mouseHint.hidden = this.input.isPointerLocked();
      if (this.state === "playing" && !this.input.isPointerLocked()) {
        this.pause();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape" && this.state === "playing") {
        this.pause();
      }
    });
    window.addEventListener("blur", () => {
      if (this.state === "playing") {
        this.pause();
      }
    });
    window.addEventListener("resize", () => {
      engine.resize();
      // While paused nothing renders, and resizing clears the canvas.
      this.room?.scene.render();
    });

    // Dev tools exist only on the dev server. The build drops this import,
    // so the live site does not contain them at all.
    if (import.meta.env.DEV) {
      void import("./dev/devTools").then(({ DevTools }) => {
        new DevTools(engine, () => this.room);
      });
    }

    engine.runRenderLoop(() => {
      this.frame();
    });
    this.setState("menu");
  }

  private frame() {
    if (this.state !== "playing" || !this.room) {
      return;
    }
    const dt = Math.min(this.engine.getDeltaTime() / 1000, MAX_FRAME_TIME);
    this.room.player.update(this.input.moveAxes(), this.input.takeLook(), dt);
    // Flying over the hatch in noclip (dev tools) should not end the room.
    if (!this.room.player.noclip && this.room.reachedExit()) {
      this.finish();
      return;
    }
    this.room.scene.render();
  }

  private async start() {
    // A focused button can still be clicked with Space or Enter after it is hidden.
    if (this.state === "loading" || this.state === "playing") {
      return;
    }
    // Pointer lock needs a click, so ask now, before the slow load.
    this.input.lockPointer();
    this.disposeRoom();
    this.setState("loading");
    try {
      this.room = await loadRoom1(this.engine);
    } catch (error) {
      console.error(error);
      this.input.unlockPointer();
      this.loadingText.textContent =
        "Hru sa nepodarilo načítať. Obnov stránku.";
      return;
    }
    this.input.clear();
    this.setState("playing");
  }

  private pause() {
    this.input.clear();
    this.setState("paused");
  }

  private resume() {
    this.input.lockPointer();
    this.setState("playing");
  }

  private finish() {
    this.setState("finished");
    this.input.unlockPointer();
  }

  private showMenu() {
    this.disposeRoom();
    this.setState("menu");
  }

  private disposeRoom() {
    this.room?.scene.dispose();
    this.room = null;
  }

  private setState(state: State) {
    this.state = state;
    for (const [name, screen] of Object.entries(this.screens)) {
      screen.hidden = name !== state;
    }
    this.mouseHint.hidden = this.input.isPointerLocked();
  }
}
