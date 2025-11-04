import { BoxGeometry, DoubleSide, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { Renderer } from "./engine/render/Renderer";
import { getAtlas } from "./engine/render/Materials";
import { World } from "./engine/world/World";
import { PointerLock } from "./engine/input/PointerLock";
import { Controls, type PlayerState } from "./engine/input/Controls";
import { createVec3 } from "./engine/utils/Vec3";
import { initHUD } from "./ui/hud";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas #game not found");
}

const renderer = new Renderer(canvas);
const world = new World();
const pointerLock = new PointerLock(canvas);

const player: PlayerState = {
  position: createVec3(0, 70, 10),
  velocity: createVec3(),
  yaw: Math.PI,
  pitch: 0,
};

const controls = new Controls(pointerLock, player);
const hud = initHUD();

let cube: Mesh | null = null;

getAtlas().then((atlas) => {
  const material = new MeshStandardMaterial({ map: atlas });
  cube = new Mesh(new BoxGeometry(2, 2, 2), material);
  cube.position.set(0, 65, 0);
  renderer.scene.add(cube);

  const ground = new Mesh(
    new PlaneGeometry(32, 32),
    new MeshStandardMaterial({ map: atlas, side: DoubleSide }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 64;
  renderer.scene.add(ground);
});

let last = performance.now();

const loop = (time: number) => {
  const delta = (time - last) / 1000;
  last = time;

  controls.update(delta);

  if (cube) {
    cube.rotation.y += delta;
    cube.rotation.x += delta * 0.5;
  }

  hud.update(time, delta);
  renderer.renderFrame(world, controls.getState());

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
