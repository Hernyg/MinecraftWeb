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

const EPSILON = 1e-8;

export const voxelRaycast = (
  origin: Vec3,
  direction: Vec3,
  maxDist: number = RAYCAST_MAX,
  sample: Sampler,
): RaycastHit => {
  const dirLengthSq = direction.x * direction.x + direction.y * direction.y + direction.z * direction.z;
  if (dirLengthSq < EPSILON) {
    return { hit: false, wx: 0, wy: 0, wz: 0, face: [0, 0, 0] };
  }

  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = direction.x > 0 ? 1 : direction.x < 0 ? -1 : 0;
  const stepY = direction.y > 0 ? 1 : direction.y < 0 ? -1 : 0;
  const stepZ = direction.z > 0 ? 1 : direction.z < 0 ? -1 : 0;

  const invDx = stepX !== 0 ? 1 / direction.x : Infinity;
  const invDy = stepY !== 0 ? 1 / direction.y : Infinity;
  const invDz = stepZ !== 0 ? 1 / direction.z : Infinity;

  const nextBoundaryX = stepX > 0 ? x + 1 : x;
  const nextBoundaryY = stepY > 0 ? y + 1 : y;
  const nextBoundaryZ = stepZ > 0 ? z + 1 : z;

  let tMaxX = stepX !== 0 ? (nextBoundaryX - origin.x) * invDx : Infinity;
  let tMaxY = stepY !== 0 ? (nextBoundaryY - origin.y) * invDy : Infinity;
  let tMaxZ = stepZ !== 0 ? (nextBoundaryZ - origin.z) * invDz : Infinity;

  const tDeltaX = Math.abs(invDx);
  const tDeltaY = Math.abs(invDy);
  const tDeltaZ = Math.abs(invDz);

  let distance = 0;
  let lastFace: [number, number, number] = [0, 0, 0];

  while (distance <= maxDist) {
    const id = sample(x, y, z);
    if (id !== 0) {
      return { hit: true, wx: x, wy: y, wz: z, face: lastFace };
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        if (!Number.isFinite(tMaxX)) {
          break;
        }
        x += stepX;
        distance = tMaxX;
        tMaxX += tDeltaX;
        lastFace = [-stepX, 0, 0];
      } else {
        if (!Number.isFinite(tMaxZ)) {
          break;
        }
        z += stepZ;
        distance = tMaxZ;
        tMaxZ += tDeltaZ;
        lastFace = [0, 0, -stepZ];
      }
    } else {
      if (tMaxY < tMaxZ) {
        if (!Number.isFinite(tMaxY)) {
          break;
        }
        y += stepY;
        distance = tMaxY;
        tMaxY += tDeltaY;
        lastFace = [0, -stepY, 0];
      } else {
        if (!Number.isFinite(tMaxZ)) {
          break;
        }
        z += stepZ;
        distance = tMaxZ;
        tMaxZ += tDeltaZ;
        lastFace = [0, 0, -stepZ];
      }
    }
  }

  return { hit: false, wx: 0, wy: 0, wz: 0, face: [0, 0, 0] };
};
