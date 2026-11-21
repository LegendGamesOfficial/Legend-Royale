import { Config } from '../core/Config.js';
import { BuildingBuilder } from '../../assets/models/buildings/BuildingBuilder.js';

/**
 * Represents a placed wall, floor, stairs, cone, or trap with health and edit state.
 */
export class BuildingPiece {
  constructor({ type, x, y, z, rot = 0, trapId = null, assetManager }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rot = rot;
    this.trapId = trapId;
    this.hp = type === 'trap' ? 120 : 150;
    this.maxHp = this.hp;
    this.edited = false;
    this.alive = true;

    this.mesh = BuildingBuilder.createPlayerPiece(type, trapId, assetManager);
    const GRID = Config.BUILD_GRID_SIZE;
    this.mesh.position.set(x, y + (type === 'wall' ? GRID / 2 : 0.2), z);
    this.mesh.rotation.y = rot;
    if (type === 'stairs') this.mesh.rotation.x = -0.65;
  }

  getBoundingBox() {
    const GRID = Config.BUILD_GRID_SIZE;
    if (this.type === 'wall') {
      const rot90 = Math.abs(Math.sin(this.rot)) > 0.7;
      return {
        x: this.x,
        y: this.y,
        z: this.z,
        halfW: rot90 ? 0.3 : GRID / 2,
        halfD: rot90 ? GRID / 2 : 0.3,
        height: GRID,
        pieceRef: this
      };
    }
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      halfW: GRID / 2,
      halfD: GRID / 2,
      height: 0.4,
      pieceRef: this
    };
  }
}
