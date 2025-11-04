import "./hud.css";
import { placeableIds } from "../data/blocks";

export interface HUD {
  update(time: number, delta: number): void;
  setSelectedBlock(id: number): void;
  setTargetBlock(id: number | null): void;
}

export const initHUD = (): HUD => {
  const root = document.createElement("div");
  root.className = "hud-root";

  const crosshair = document.createElement("div");
  crosshair.className = "hud-crosshair";
  crosshair.textContent = "+";
  root.appendChild(crosshair);

  const stats = document.createElement("div");
  stats.className = "hud-stats";
  const fpsLine = document.createElement("div");
  fpsLine.textContent = "FPS: --";
  const blockLine = document.createElement("div");
  blockLine.textContent = "Target: --";
  stats.append(fpsLine, blockLine);
  root.appendChild(stats);

  const hotbar = document.createElement("div");
  hotbar.className = "hud-hotbar";
  const slots = placeableIds.map((id, index) => {
    const slot = document.createElement("div");
    slot.className = "hud-hotbar-slot";
    slot.textContent = `${index + 1}:${id}`;
    hotbar.appendChild(slot);
    return slot;
  });
  root.appendChild(hotbar);

  document.body.appendChild(root);

  let lastUpdate = performance.now();
  let currentSelected = placeableIds[0];

  const refreshHotbar = () => {
    slots.forEach((slot, idx) => {
      if (placeableIds[idx] === currentSelected) {
        slot.classList.add("active");
      } else {
        slot.classList.remove("active");
      }
    });
  };
  refreshHotbar();

  return {
    update(time: number, delta: number) {
      if (time - lastUpdate > 250) {
        const fps = Math.round(1 / Math.max(delta, 1e-6));
        fpsLine.textContent = `FPS: ${fps}`;
        lastUpdate = time;
      }
    },
    setSelectedBlock(id: number) {
      currentSelected = id;
      refreshHotbar();
    },
    setTargetBlock(id: number | null) {
      blockLine.textContent = id != null ? `Target: ${id}` : "Target: --";
    },
  };
};
