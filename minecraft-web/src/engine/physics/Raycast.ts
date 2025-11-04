export interface RaycastHit {
  x: number;
  y: number;
  z: number;
  normal: [number, number, number];
}

export const voxelRaycast = (): RaycastHit | null => {
  // TODO: Implement voxel ray marching to support block interaction.
  return null;
};
