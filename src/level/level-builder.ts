import Phaser from 'phaser';
import { SOLID_TILE_IDS, TILE_FLAGPOLE, TILE_SIZE, WORLD_Y_OFFSET } from '../core/constants';
import type { LevelDefinition } from '../core/contracts';

export interface BuiltLevel {
  map: Phaser.Tilemaps.Tilemap;
  solidLayer: Phaser.Tilemaps.TilemapLayer;
  worldPixelWidth: number;
  worldPixelHeight: number;
}

export function buildLevel(scene: Phaser.Scene, level: LevelDefinition, tilesetKey: string): BuiltLevel {
  const map = scene.make.tilemap({
    data: level.solidLayer,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });
  const tileset = map.addTilesetImage(tilesetKey, undefined, TILE_SIZE, TILE_SIZE, 0, 0);
  if (!tileset) {
    throw new Error(`Tileset key not found: ${tilesetKey}`);
  }

  const solidLayer = map.createLayer(0, tileset, 0, WORLD_Y_OFFSET);
  if (!solidLayer) {
    throw new Error('Failed to create solid tile layer');
  }
  solidLayer.setDepth(0);

  const physicsSolidIds = SOLID_TILE_IDS.filter((tileId) => tileId !== TILE_FLAGPOLE);
  map.setCollision(physicsSolidIds);

  return {
    map,
    solidLayer,
    worldPixelWidth: level.widthTiles * TILE_SIZE,
    worldPixelHeight: level.heightTiles * TILE_SIZE + WORLD_Y_OFFSET,
  };
}
