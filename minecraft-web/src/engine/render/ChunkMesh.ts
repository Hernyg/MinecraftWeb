import { BufferAttribute, BufferGeometry, Group, Mesh, type Object3D } from "three";
import type { MeshBuffers, MeshResult } from "../utils/Types";
import { getCutoutMaterial, getOpaqueMaterial, getWaterMaterial } from "./Materials";

const buildGeometry = (buffers: MeshBuffers): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(buffers.positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(buffers.normals, 3));
  geometry.setAttribute("uv", new BufferAttribute(buffers.uvs, 2));
  geometry.setIndex(new BufferAttribute(buffers.indices, 1));
  return geometry;
};

export const buildChunkMesh = async (data: MeshResult): Promise<Object3D | null> => {
  const group = new Group();
  let childCount = 0;

  if (data.opaque.indices.length > 0) {
    const geometry = buildGeometry(data.opaque);
    const material = await getOpaqueMaterial();
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
    childCount += 1;
  }

  if (data.cutout.indices.length > 0) {
    const geometry = buildGeometry(data.cutout);
    const material = await getCutoutMaterial();
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
    childCount += 1;
  }

  if (data.water.indices.length > 0) {
    const geometry = buildGeometry(data.water);
    const material = await getWaterMaterial();
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
    childCount += 1;
  }

  if (childCount === 0) {
    return null;
  }

  return group;
};
