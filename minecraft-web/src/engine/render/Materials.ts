import {
  ClampToEdgeWrapping,
  MeshStandardMaterial,
  NearestFilter,
  Texture,
  TextureLoader,
} from "three";

let atlasTexturePromise: Promise<Texture> | null = null;
let opaqueMaterialPromise: Promise<MeshStandardMaterial> | null = null;
let cutoutMaterialPromise: Promise<MeshStandardMaterial> | null = null;
let waterMaterialPromise: Promise<MeshStandardMaterial> | null = null;

const loadAtlasTexture = async (): Promise<Texture> => {
  if (!atlasTexturePromise) {
    const loader = new TextureLoader();
    atlasTexturePromise = loader.loadAsync("/textures/atlas.png").then((texture) => {
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      return texture;
    });
  }
  return atlasTexturePromise;
};

export const getOpaqueMaterial = async (): Promise<MeshStandardMaterial> => {
  if (!opaqueMaterialPromise) {
    opaqueMaterialPromise = loadAtlasTexture().then((texture) => {
      const material = new MeshStandardMaterial({
        map: texture,
        vertexColors: false,
      });
      const configured = material as MeshStandardMaterial & {
        transparent: boolean;
        metalness: number;
        roughness: number;
      };
      configured.transparent = false;
      configured.metalness = 0;
      configured.roughness = 1;
      return configured;
    });
  }
  return opaqueMaterialPromise;
};

export const getCutoutMaterial = async (): Promise<MeshStandardMaterial> => {
  if (!cutoutMaterialPromise) {
    cutoutMaterialPromise = loadAtlasTexture().then((texture) => {
      const material = new MeshStandardMaterial({
        map: texture,
        vertexColors: false,
      });
      const configured = material as MeshStandardMaterial & {
        transparent: boolean;
        metalness: number;
        roughness: number;
        alphaTest: number;
      };
      configured.transparent = false;
      configured.metalness = 0;
      configured.roughness = 1;
      configured.alphaTest = 0.5;
      return configured;
    });
  }
  return cutoutMaterialPromise;
};

export const getWaterMaterial = async (): Promise<MeshStandardMaterial> => {
  if (!waterMaterialPromise) {
    waterMaterialPromise = loadAtlasTexture().then((texture) => {
      const material = new MeshStandardMaterial({
        map: texture,
        vertexColors: false,
      });
      const configured = material as MeshStandardMaterial & {
        transparent: boolean;
        opacity: number;
        metalness: number;
        roughness: number;
        depthWrite: boolean;
        depthTest: boolean;
      };
      configured.transparent = false;
      configured.opacity = 1;
      configured.metalness = 0;
      configured.roughness = 1;
      configured.depthWrite = true;
      configured.depthTest = true;
      return configured;
    });
  }
  return waterMaterialPromise;
};
