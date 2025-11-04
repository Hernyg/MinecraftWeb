declare module "three" {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }

  export class Euler {
    constructor(x?: number, y?: number, z?: number, order?: string);
    x: number;
    y: number;
    z: number;
    order: string;
  }

  export class Color {
    constructor(color?: number | string);
  }

  export class Object3D {
    position: Vector3;
    rotation: Euler;
    add(...objects: Object3D[]): this;
    remove(...objects: Object3D[]): this;
    userData: Record<string, unknown>;
    visible: boolean;
    frustumCulled: boolean;
  }

  export class Scene extends Object3D {
    background: Color | null;
  }

  export class Group extends Object3D {}

  export class Camera extends Object3D {}

  export class PerspectiveCamera extends Camera {
    constructor(fov: number, aspect: number, near: number, far: number);
    aspect: number;
    updateProjectionMatrix(): void;
  }

  export class BufferGeometry {
    setAttribute(name: string, attribute: BufferAttribute): this;
    setIndex(attribute: BufferAttribute): this;
    dispose(): void;
  }

  export class BufferAttribute {
    constructor(array: Float32Array | Uint32Array, itemSize: number);
  }

  export class Material {
    depthWrite: boolean;
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: { map?: Texture; side?: number; vertexColors?: boolean });
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: { color?: number | string; wireframe?: boolean; depthTest?: boolean });
  }

  export class Mesh<TGeometry extends BufferGeometry = BufferGeometry, TMaterial extends Material = Material> extends Object3D {
    constructor(geometry?: TGeometry, material?: TMaterial);
    geometry: TGeometry;
    material: TMaterial;
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number);
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number);
  }

  export class WebGLRenderer {
    constructor(parameters?: { canvas?: HTMLCanvasElement; antialias?: boolean });
    setPixelRatio(value: number): void;
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }

  export class AmbientLight extends Object3D {
    constructor(color?: number | string, intensity?: number);
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: number | string, intensity?: number);
  }

  export class Texture {
    magFilter: number;
    minFilter: number;
    generateMipmaps: boolean;
    wrapS: number;
    wrapT: number;
  }

  export class TextureLoader {
    loadAsync(url: string): Promise<Texture>;
  }

  export const DoubleSide: number;
  export const NearestFilter: number;
  export const ClampToEdgeWrapping: number;

  export class EdgesGeometry extends BufferGeometry {
    constructor(geometry?: BufferGeometry);
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: { color?: number | string; depthTest?: boolean; depthWrite?: boolean });
  }

  export class LineSegments<
    TGeometry extends BufferGeometry = BufferGeometry,
    TMaterial extends Material = Material,
  > extends Object3D {
    constructor(geometry?: TGeometry, material?: TMaterial);
    renderOrder: number;
  }
}
