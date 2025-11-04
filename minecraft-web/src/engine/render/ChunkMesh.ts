import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from "three";
import type { MeshResult } from "../utils/Types";
import { getAtlas } from "./Materials";

export class ChunkMesh {
  private mesh: Mesh | null = null;

  constructor(private readonly scene: Scene) {}

  async update(data: MeshResult): Promise<void> {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(data.positions, 3));
    geometry.setAttribute("normal", new BufferAttribute(data.normals, 3));
    geometry.setAttribute("uv", new BufferAttribute(data.uvs, 2));
    geometry.setIndex(new BufferAttribute(data.indices, 1));

    if (!this.mesh) {
      const material = new MeshStandardMaterial({ map: await getAtlas() });
      this.mesh = new Mesh(geometry, material);
      this.scene.add(this.mesh);
    } else {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    }
  }
}
