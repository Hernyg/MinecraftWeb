import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { World } from "../world/World";
import type { PlayerState } from "../input/Controls";

export class Renderer {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb);

    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = "YXZ";

    this.renderer = new WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const ambient = new AmbientLight(0xffffff, 0.6);
    const sun = new DirectionalLight(0xffffff, 0.6);
    sun.position.set(5, 10, 2);
    this.scene.add(ambient, sun);

    window.addEventListener("resize", this.handleResize);
  }

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  renderFrame(world: World, player: PlayerState): void {
    this.camera.position.set(player.position.x, player.position.y, player.position.z);
    this.camera.rotation.x = player.pitch;
    this.camera.rotation.y = player.yaw;

    world.updateAround(player.position.x, player.position.z);
    this.renderer.render(this.scene, this.camera);
  }
}
