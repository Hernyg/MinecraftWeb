import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { World } from "../world/World";
import type { PlayerState } from "../input/Controls";
interface HighlightTarget {
  x: number;
  y: number;
  z: number;
}

class VoxelHighlighter {
  private readonly mesh: LineSegments;

  constructor() {
    const geometry = new EdgesGeometry(new BoxGeometry(1.002, 1.002, 1.002));
    const material = new LineBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false });
    this.mesh = new LineSegments(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 10;
    this.mesh.visible = false;
  }

  get object(): LineSegments {
    return this.mesh;
  }

  show(x: number, y: number, z: number): void {
    this.mesh.visible = true;
    this.mesh.position.set(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5);
  }

  hide(): void {
    this.mesh.visible = false;
  }
}

export class Renderer {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly chunkRoot: Group;
  private readonly highlighter: VoxelHighlighter;
  private lastWorldUpdate = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb);

    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = "YXZ";

    this.renderer = new WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const ambient = new AmbientLight(0xffffff, 0.6);
    const sun = new DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 2);
    this.scene.add(ambient, sun);

    this.chunkRoot = new Group();
    this.scene.add(this.chunkRoot);

    this.highlighter = new VoxelHighlighter();
    this.scene.add(this.highlighter.object);

    window.addEventListener("resize", this.handleResize);
  }

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  addChunkMesh(key: string, mesh: Mesh): void {
    mesh.userData.chunkKey = key;
    this.chunkRoot.add(mesh);
  }

  removeChunkMesh(_key: string, mesh: Mesh): void {
    this.chunkRoot.remove(mesh);
  }

  setHighlight(target: HighlightTarget | null): void {
    if (!target) {
      this.highlighter.hide();
      return;
    }
    this.highlighter.show(target.x, target.y, target.z);
  }

  renderFrame(world: World, player: PlayerState, now: number): void {
    this.camera.position.set(player.position.x, player.position.y + player.eyeHeight, player.position.z);
    this.camera.rotation.x = player.pitch;
    this.camera.rotation.y = player.yaw;

    if (now - this.lastWorldUpdate > 250) {
      world.updateAround(player.position.x, player.position.z);
      this.lastWorldUpdate = now;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
