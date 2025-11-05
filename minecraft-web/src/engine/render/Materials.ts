import {
  ClampToEdgeWrapping,
  MeshStandardMaterial,
  NearestFilter,
  Texture,
  TextureLoader,
} from "three";

let atlasTexturePromise: Promise<Texture> | null = null;
let atlasMaterialPromise: Promise<MeshStandardMaterial> | null = null;
let translucentMaterialPromise: Promise<MeshStandardMaterial> | null = null;

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

export const getAtlasMaterial = async (): Promise<MeshStandardMaterial> => {
  if (!atlasMaterialPromise) {
    atlasMaterialPromise = loadAtlasTexture().then((texture) => {
      const material = new MeshStandardMaterial({
        map: texture,
        vertexColors: false,
      });
      const configured = material as MeshStandardMaterial & {
        metalness: number;
        roughness: number;
        transparent: boolean;
        alphaTest: number;
      };
      configured.metalness = 0;
      configured.roughness = 1;
      configured.transparent = false;
      configured.alphaTest = 0;
      return configured;
    });
  }
  return atlasMaterialPromise;
};

export const getTranslucentAtlasMaterial = async (): Promise<MeshStandardMaterial> => {
  if (!translucentMaterialPromise) {
    translucentMaterialPromise = loadAtlasTexture().then((texture) => {
      const material = new MeshStandardMaterial({
        map: texture,
        vertexColors: false,
      });
      const configured = material as MeshStandardMaterial & {
        metalness: number;
        roughness: number;
        transparent: boolean;
        alphaTest: number;
        depthWrite: boolean;
      };
      configured.metalness = 0;
      configured.roughness = 1;
      configured.transparent = true;
      configured.alphaTest = 0.05;
      configured.depthWrite = false;
      return configured;
    });
  }
  return translucentMaterialPromise;
};
