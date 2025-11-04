import type { FaceKey } from "../utils/Types";

interface AtlasData {
  blocks: Record<string, [number, number, number, number]>;
  tileSize: number;
  atlasSize: number;
}

export interface UVRect {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

let atlasDataPromise: Promise<AtlasData> | null = null;
let atlasData: AtlasData | null = null;
const rectCache = new Map<string, UVRect>();

const fetchAtlas = async (): Promise<AtlasData> => {
  const response = await fetch("/textures/atlas.json");
  if (!response.ok) {
    throw new Error(`Failed to load atlas.json (${response.status})`);
  }
  const json = (await response.json()) as AtlasData;
  return json;
};

const ensureAtlasData = async (): Promise<AtlasData> => {
  if (atlasData) {
    return atlasData;
  }
  if (!atlasDataPromise) {
    atlasDataPromise = fetchAtlas();
  }
  atlasData = await atlasDataPromise;
  return atlasData;
};

const rectKey = (name: string, padding: number): string => `${name}|${padding}`;

const computeRect = (atlas: AtlasData, name: string, paddingPx: number): UVRect => {
  const coords = atlas.blocks[name];
  if (!coords) {
    throw new Error(`Unknown texture '${name}' in atlas`);
  }

  const [u0Raw, v0Raw, u1Raw, v1Raw] = coords;
  const padding = paddingPx > 0 ? (paddingPx / atlas.atlasSize) : 0;

  const u0 = u0Raw + padding;
  const u1 = u1Raw - padding;
  const v0 = v0Raw + padding;
  const v1 = v1Raw - padding;

  const converted: UVRect = {
    u0,
    v0: 1 - v1,
    u1,
    v1: 1 - v0,
  };

  return converted;
};

export const loadUVAtlas = async (): Promise<void> => {
  await ensureAtlasData();
};

export const uvRect = (name: string, paddingPx = 0): UVRect => {
  if (!atlasData) {
    throw new Error("UV atlas not loaded. Call loadUVAtlas() before requesting rectangles.");
  }
  const key = rectKey(name, paddingPx);
  const cached = rectCache.get(key);
  if (cached) {
    return cached;
  }
  const rect = computeRect(atlasData, name, paddingPx);
  rectCache.set(key, rect);
  return rect;
};

export const uvForFace = (textures: Record<FaceKey, string>, face: FaceKey, paddingPx = 0): UVRect =>
  uvRect(textures[face], paddingPx);
