import { Engine } from "@babylonjs/core/Engines/engine";
import { createScene } from "./scene";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const button = document.querySelector<HTMLButtonElement>("#hello");
if (!canvas || !button) {
  throw new Error("Missing #game canvas or #hello button in index.html");
}

const engine = new Engine(canvas, true);
const scene = createScene(engine);
engine.runRenderLoop(() => {
  scene.render();
});
window.addEventListener("resize", () => {
  engine.resize();
});

button.addEventListener("click", () => {
  alert("Ahoj! Všetko funguje.");
});
