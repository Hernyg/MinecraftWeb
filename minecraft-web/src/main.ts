const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();
ctx.fillStyle = "#9cdcfe";
ctx.font = "16px Consolas, monospace";
ctx.fillText("Minecraft Web – starter", 16, 28);
