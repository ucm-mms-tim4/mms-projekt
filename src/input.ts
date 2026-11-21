import { moveAxes } from "./movement";

export class Input {
  private readonly pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => {
      this.pressed.add(event.code);
    });
    window.addEventListener("keyup", (event) => {
      this.pressed.delete(event.code);
    });
    // Keyup never arrives if the window loses focus while a key is held.
    window.addEventListener("blur", () => {
      this.clear();
    });
    document.addEventListener("mousemove", (event) => {
      if (this.isPointerLocked()) {
        this.lookX += event.movementX;
        this.lookY += event.movementY;
      }
    });
  }

  isPointerLocked() {
    return document.pointerLockElement === this.canvas;
  }

  lockPointer() {
    // Fails when called too soon after the player pressed Esc. Clicking the canvas tries again.
    // Firefox may return undefined instead of a Promise, hence Promise.resolve.
    Promise.resolve(this.canvas.requestPointerLock()).catch(() => undefined);
  }

  unlockPointer() {
    if (this.isPointerLocked()) {
      document.exitPointerLock();
    }
  }

  moveAxes() {
    return moveAxes(this.pressed);
  }

  // Mouse movement in pixels since the last call.
  takeLook() {
    const look = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return look;
  }

  clear() {
    this.pressed.clear();
    this.lookX = 0;
    this.lookY = 0;
  }
}
