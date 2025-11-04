export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const createVec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const copyVec3 = (source: Vec3): Vec3 => ({ x: source.x, y: source.y, z: source.z });

export const setVec3 = (target: Vec3, x: number, y: number, z: number): Vec3 => {
  target.x = x;
  target.y = y;
  target.z = z;
  return target;
};

export const addVec3 = (target: Vec3, value: Vec3): Vec3 => {
  target.x += value.x;
  target.y += value.y;
  target.z += value.z;
  return target;
};

export const addScaledVec3 = (target: Vec3, value: Vec3, scale: number): Vec3 => {
  target.x += value.x * scale;
  target.y += value.y * scale;
  target.z += value.z * scale;
  return target;
};

export const scaleVec3 = (target: Vec3, scale: number): Vec3 => {
  target.x *= scale;
  target.y *= scale;
  target.z *= scale;
  return target;
};

export const normalizeVec3 = (target: Vec3): Vec3 => {
  const length = Math.hypot(target.x, target.y, target.z);
  if (length > 0) {
    const inv = 1 / length;
    target.x *= inv;
    target.y *= inv;
    target.z *= inv;
  }
  return target;
};

export const zeroVec3 = (target: Vec3): Vec3 => setVec3(target, 0, 0, 0);
