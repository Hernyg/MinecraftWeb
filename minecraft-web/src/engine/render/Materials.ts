import { NearestFilter, Texture, TextureLoader } from "three";

let atlasPromise: Promise<Texture> | undefined;

export const getAtlas = (): Promise<Texture> => {
  if (!atlasPromise) {
    const loader = new TextureLoader();
    atlasPromise = loader.loadAsync("/textures/atlas.png").then((texture: Texture) => {
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.generateMipmaps = false;
      return texture;
    });
  }
  return atlasPromise!;
};
