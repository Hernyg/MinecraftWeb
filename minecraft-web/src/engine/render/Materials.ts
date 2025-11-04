import { MeshStandardMaterial, NearestFilter, Texture, TextureLoader } from "three";

let atlasTexturePromise: Promise<Texture> | null = null;
let atlasMaterialPromise: Promise<MeshStandardMaterial> | null = null;

const loadAtlasTexture = async (): Promise<Texture> => {
  if (!atlasTexturePromise) {
    const loader = new TextureLoader();
    atlasTexturePromise = loader.loadAsync("/textures/atlas.png").then((texture) => {
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.generateMipmaps = false;
      return texture;
    });
  }
  return atlasTexturePromise;
};

export const getAtlasMaterial = async (): Promise<MeshStandardMaterial> => {
  if (!atlasMaterialPromise) {
    atlasMaterialPromise = loadAtlasTexture().then((texture) => new MeshStandardMaterial({ map: texture }));
  }
  return atlasMaterialPromise;
};
