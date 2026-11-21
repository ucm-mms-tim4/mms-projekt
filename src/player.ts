import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Collisions/collisionCoordinator";
import { walkStep, type MoveAxes } from "./movement";

const EYE_HEIGHT = 1.6;
const WALK_SPEED = 2; // m/s
export const MOUSE_SENSITIVITY = 0.002; // radians per pixel
const MAX_PITCH = 1.4; // about 80 degrees up or down

// The collider floats this high above the floor, so cables and low debris
// do not block the player. The floor is flat, so there is no gravity.
const STEP_HEIGHT = 0.3;
const BODY_TOP = 1.8;
const BODY_RADIUS = 0.3;

export class Player {
  private readonly body: Mesh;
  private readonly camera: FreeCamera;
  private yaw: number;
  private pitch = 0;

  constructor(scene: Scene, start: Vector3, yaw: number) {
    this.yaw = yaw;

    // An empty mesh: invisible, it only carries the collision ellipsoid.
    this.body = new Mesh("player", scene);
    this.body.position.copyFrom(start);
    const halfHeight = (BODY_TOP - STEP_HEIGHT) / 2;
    this.body.ellipsoid = new Vector3(BODY_RADIUS, halfHeight, BODY_RADIUS);
    this.body.ellipsoidOffset = new Vector3(0, STEP_HEIGHT + halfHeight, 0);

    this.camera = new FreeCamera(
      "playerCamera",
      new Vector3(0, EYE_HEIGHT, 0),
      scene,
    );
    this.camera.parent = this.body;
    // Babylon's default near plane is 1 m, which cuts through walls up close.
    this.camera.minZ = 0.05;
    this.applyRotation();
  }

  get position(): Vector3 {
    return this.body.position;
  }

  update(axes: MoveAxes, look: { x: number; y: number }, dt: number) {
    this.yaw += look.x * MOUSE_SENSITIVITY;
    this.pitch += look.y * MOUSE_SENSITIVITY;
    this.pitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, this.pitch));
    this.applyRotation();

    const step = walkStep(axes, this.yaw, WALK_SPEED * dt);
    if (step.x === 0 && step.z === 0) {
      return;
    }
    // Babylon refreshes the world matrix only once per rendered frame.
    // Without this, collisions start from a stale position (and never work in tests).
    this.body.computeWorldMatrix(true);
    this.body.moveWithCollisions(new Vector3(step.x, 0, step.z));
    // Sliding along slanted surfaces can push the collider up or down.
    this.body.position.y = 0;
  }

  private applyRotation() {
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
