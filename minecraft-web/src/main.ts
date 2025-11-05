import { Renderer } from "./engine/render/Renderer";
import { World } from "./engine/world/World";
import { PointerLock } from "./engine/input/PointerLock";
import { Controls, type PlayerState } from "./engine/input/Controls";
import { createVec3, setVec3, normalizeVec3 } from "./engine/utils/Vec3";
import { initHUD } from "./ui/hud";
import { CHUNK, RAYCAST_MAX } from "./data/config";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas #game not found");
}

const renderer = new Renderer(canvas);
const world = new World(renderer);
const pointerLock = new PointerLock(canvas);

const player: PlayerState = {
  position: createVec3(0, 80, 0),
  velocity: createVec3(),
  yaw: Math.PI,
  pitch: 0,
};

const controls = new Controls(pointerLock, player);
const hud = initHUD();

let lastSelected = controls.getSelectedBlock();
hud.setSelectedBlock(lastSelected);

const rayDirection = createVec3();

let last = performance.now();

const loop = (time: number) => {
  const delta = (time - last) / 1000;
  last = time;

  controls.update(delta);

  const cosPitch = Math.cos(player.pitch);
  setVec3(
    rayDirection,
    -Math.sin(player.yaw) * cosPitch,
    Math.sin(player.pitch),
    -Math.cos(player.yaw) * cosPitch,
  );
  normalizeVec3(rayDirection);

  const hit = world.raycastBlock(player.position, rayDirection, RAYCAST_MAX);
  const placeHeld = controls.isPlaceHeld();
  let highlightTarget: { x: number; y: number; z: number } | null = null;

  if (hit.hit) {
    const blockId = world.getBlock(hit.wx, hit.wy, hit.wz);
    hud.setTargetBlock(blockId);

    if (placeHeld) {
      const targetX = hit.wx + hit.face[0];
      const targetY = hit.wy + hit.face[1];
      const targetZ = hit.wz + hit.face[2];
      if (targetY >= 0 && targetY < CHUNK.Y && world.getBlock(targetX, targetY, targetZ) === 0) {
        highlightTarget = { x: targetX, y: targetY, z: targetZ };
      } else {
        highlightTarget = { x: hit.wx, y: hit.wy, z: hit.wz };
      }
    } else {
      highlightTarget = { x: hit.wx, y: hit.wy, z: hit.wz };
    }
  } else {
    hud.setTargetBlock(null);
  }

  renderer.setHighlight(highlightTarget);

  if (hit.hit && controls.consumeBreakRequest()) {
    world.setBlock(hit.wx, hit.wy, hit.wz, 0);
  }

  if (hit.hit && controls.consumePlaceRequest()) {
    const targetX = hit.wx + hit.face[0];
    const targetY = hit.wy + hit.face[1];
    const targetZ = hit.wz + hit.face[2];
    if (targetY >= 0 && targetY < CHUNK.Y && world.getBlock(targetX, targetY, targetZ) === 0) {
      world.setBlock(targetX, targetY, targetZ, controls.getSelectedBlock());
    }
  }

  const selected = controls.getSelectedBlock();
  if (selected !== lastSelected) {
    lastSelected = selected;
    hud.setSelectedBlock(selected);
  }

  hud.update(time, delta);
  renderer.renderFrame(world, controls.getState(), time);

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
