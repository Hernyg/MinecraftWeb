import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
} from "three";
import type { MeshResult } from "../utils/Types";
import { getAtlasMaterial } from "./Materials";

export const buildChunkMesh = async (data: MeshResult): Promise<Mesh | null> => {
  if (data.indices.length === 0) {
    return null;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(data.positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(data.normals, 3));
  geometry.setAttribute("uv", new BufferAttribute(data.uvs, 2));
  geometry.setIndex(new BufferAttribute(data.indices, 1));

  const material = await getAtlasMaterial();
  return new Mesh(geometry, material);
};
