import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { AppendSceneAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Player } from "../player";
import roomUrl from "../assets/models/room1-cryochamber.glb?url";

// The glTF loader mirrors the X axis, so in Babylon the capsule is at +X
// and the hatch at -X (the opposite of the Blender file).
const START = new Vector3(1.9, 0, 0);
const START_YAW = -Math.PI / 2; // facing the hatch
const EXIT_RADIUS = 1; // m, measured on the floor from the hatch center

export interface Room1 {
  scene: Scene;
  player: Player;
  spawn: { position: Vector3; yaw: number };
  exit: Vector3;
  reachedExit(): boolean;
}

// Tests pass the file bytes because NullEngine in Node cannot fetch the Vite URL.
export async function loadRoom1(
  engine: AbstractEngine,
  source: string | ArrayBufferView = roomUrl,
): Promise<Room1> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 1);
  await AppendSceneAsync(source, scene, { pluginExtension: ".glb" });

  for (const mesh of scene.meshes) {
    mesh.checkCollisions = true;
  }
  addLights(scene);

  const player = new Player(scene, START, START_YAW);
  const hatch = centerOf(scene, "INT_Poklop_Dvere");
  // Compile shaders now, under the loading screen, not during the first seconds of play.
  await scene.whenReadyAsync();

  return {
    scene,
    player,
    spawn: { position: START, yaw: START_YAW },
    exit: hatch,
    reachedExit: () =>
      Math.hypot(player.position.x - hatch.x, player.position.z - hatch.z) <
      EXIT_RADIUS,
  };
}

// The model has no lights, only glowing materials, and glowing materials
// do not light anything around them. These lights stand in for the glow.
// PBR materials use at most 4 lights by default, and this is already 4.
function addLights(scene: Scene) {
  const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.25;
  ambient.diffuse = new Color3(0.6, 0.7, 0.9);
  ambient.groundColor = new Color3(0.1, 0.1, 0.15);

  addGlow(scene, "Kryokomora_Kapsula", new Color3(0.25, 0.85, 1), 6);
  addGlow(scene, "Iskry", new Color3(1, 0.6, 0.15), 2);
  addGlow(scene, "Znak_Nudzovy_Vychod", new Color3(0.45, 1, 0.35), 2);
}

function addGlow(
  scene: Scene,
  nodeName: string,
  color: Color3,
  intensity: number,
) {
  const light = new PointLight(
    `${nodeName}_light`,
    centerOf(scene, nodeName),
    scene,
  );
  light.diffuse = color;
  light.specular = color;
  light.intensity = intensity;
}

function centerOf(scene: Scene, nodeName: string): Vector3 {
  const node =
    scene.getTransformNodeByName(nodeName) ?? scene.getMeshByName(nodeName);
  if (!node) {
    throw new Error(`Room 1 model has no node named ${nodeName}`);
  }
  const { min, max } = node.getHierarchyBoundingVectors(true);
  return Vector3.Center(min, max);
}
