import "./hud.css";

export interface HUD {
  update(time: number, delta: number): void;
}

export const initHUD = (): HUD => {
  const root = document.createElement("div");
  root.className = "hud-root";

  const crosshair = document.createElement("div");
  crosshair.className = "hud-crosshair";
  root.appendChild(crosshair);

  const stats = document.createElement("div");
  stats.className = "hud-stats";
  stats.textContent = "FPS: --";
  root.appendChild(stats);

  document.body.appendChild(root);

  let lastUpdate = performance.now();

  return {
    update(time: number, delta: number) {
      if (time - lastUpdate > 250) {
        const fps = Math.round(1 / Math.max(delta, 1e-6));
        stats.textContent = `FPS: ${fps}`;
        lastUpdate = time;
      }
    },
  };
};
