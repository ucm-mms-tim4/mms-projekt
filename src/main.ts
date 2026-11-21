import { Engine } from "@babylonjs/core/Engines/engine";
import { SceneLoaderFlags } from "@babylonjs/core/Loading/sceneLoaderFlags";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { Game } from "./game";
import "./style.css";

// The glTF loader is downloaded only when the first model loads.
registerBuiltInLoaders();
// The game has its own loading screen.
SceneLoaderFlags.ShowLoadingScreen = false;

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) {
  throw new Error("Missing #game canvas in index.html");
}

new Game(new Engine(canvas, true), canvas);
