import { RAYCAST_MAX } from "../../data/config";
import type { Vec3 } from "../utils/Vec3";

export interface RaycastHit {
  hit: boolean;
  wx: number;
  wy: number;
  wz: number;
  face: [number, number, number];
}

type Sampler = (x: number, y: number, z: number) => number;

const EPSILON = 1e-6;

export const voxelRaycast = (
  origin: Vec3,
  direction: Vec3,
  maxDist: number = RAYCAST_MAX,
  sample: Sampler,
): RaycastHit => {
  const dirX = direction.x;
  const dirY = direction.y;
  const dirZ = direction.z;

  const stepX = dirX > EPSILON ? 1 : dirX < -EPSILON ? -1 : 0;
  const stepY = dirY > EPSILON ? 1 : dirY < -EPSILON ? -1 : 0;
  const stepZ = dirZ > EPSILON ? 1 : dirZ < -EPSILON ? -1 : 0;

  const invDx = stepX !== 0 ? Math.abs(1 / dirX) : Number.POSITIVE_INFINITY;
  const invDy = stepY !== 0 ? Math.abs(1 / dirY) : Number.POSITIVE_INFINITY;
  const invDz = stepZ !== 0 ? Math.abs(1 / dirZ) : Number.POSITIVE_INFINITY;

  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const boundaryX = stepX > 0 ? x + 1 : x;
  const boundaryY = stepY > 0 ? y + 1 : y;
  const boundaryZ = stepZ > 0 ? z + 1 : z;

  let tMaxX = stepX !== 0 ? (boundaryX - origin.x) * invDx : Number.POSITIVE_INFINITY;
  let tMaxY = stepY !== 0 ? (boundaryY - origin.y) * invDy : Number.POSITIVE_INFINITY;
  let tMaxZ = stepZ !== 0 ? (boundaryZ - origin.z) * invDz : Number.POSITIVE_INFINITY;

  if (tMaxX < 0) tMaxX = 0;
  if (tMaxY < 0) tMaxY = 0;
  if (tMaxZ < 0) tMaxZ = 0;

  let distance = 0;
  let lastFace: [number, number, number] = [0, 0, 0];

  while (distance <= maxDist) {
    const id = sample(x, y, z);
    if (id !== 0) {
      return { hit: true, wx: x, wy: y, wz: z, face: lastFace };
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        x += stepX;
        distance = tMaxX;
        tMaxX += invDx;
        lastFace = [-stepX, 0, 0];
      } else {
        z += stepZ;
        distance = tMaxZ;
        tMaxZ += invDz;
        lastFace = [0, 0, -stepZ];
      }
    } else {
      if (tMaxY < tMaxZ) {
        y += stepY;
        distance = tMaxY;
        tMaxY += invDy;
        lastFace = [0, -stepY, 0];
      } else {
        z += stepZ;
        distance = tMaxZ;
        tMaxZ += invDz;
        lastFace = [0, 0, -stepZ];
      }
    }

    if (stepX === 0 && stepY === 0 && stepZ === 0) {
      break;
    }
  }

  return { hit: false, wx: 0, wy: 0, wz: 0, face: [0, 0, 0] };
};
