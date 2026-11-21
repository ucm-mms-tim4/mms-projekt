import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Scene } from "@babylonjs/core/scene";

export function createScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.1, 0.12, 0.18, 1);

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2.5,
    5,
    Vector3.Zero(),
    scene,
  );
  camera.attachControl();

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  const ball = CreateSphere("ball", { diameter: 1.5, segments: 32 }, scene);
  const material = new StandardMaterial("ballMaterial", scene);
  material.diffuseColor = new Color3(0.95, 0.75, 0.2);
  ball.material = material;

  return scene;
}
