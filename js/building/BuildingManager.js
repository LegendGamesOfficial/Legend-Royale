import { Config } from '../core/Config.js';
import { BuildingPiece } from './BuildingPiece.js';
import { BuildingPlacement } from './BuildingPlacement.js';
import { BuildingDestruction } from './BuildingDestruction.js';

/**
 * Coordinates player & bot building, editing, trap triggers, and collision queries.
 */
export class BuildingManager {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.pieces = [];
    this.placement = new BuildingPlacement(scene);
    this.destruction = new BuildingDestruction();

    this.buildMode = false;
    this.selectedPiece = 'wall';
    this.buildRot = 0;
  }

  toggleBuildMode() {
    this.buildMode = !this.buildMode;
    if (!this.buildMode) this.placement.previewMesh.visible = false;
    return this.buildMode;
  }

  rotate() {
    this.buildRot = (this.buildRot + Math.PI / 2) % (Math.PI * 2);
  }

  selectPieceByIndex(idx) {
    const map = ['wall', 'floor', 'stairs', 'cone', 'trap'];
    if (map[idx]) this.selectedPiece = map[idx];
  }

  placePlayerPiece(player, inventory, audio) {
    const pos = this.placement.getGridPosition(player);
    if (this.selectedPiece === 'trap') {
      const trapIds = ['spike_trap', 'zap_trap', 'bouncer', 'launch_pad'];
      const chosen = trapIds.find((id) => (inventory.traps[id] || 0) > 0);
      if (!chosen) return false;
      inventory.traps[chosen] -= 1;
      const piece = new BuildingPiece({
        type: 'trap', x: pos.x, y: pos.y, z: pos.z, trapId: chosen, assetManager: this.assetManager
      });
      this.scene.add(piece.mesh);
      this.pieces.push(piece);
      audio.sfx.build();
      return true;
    }

    if (player.wood < Config.BUILD_COST) return false;
    player.wood -= Config.BUILD_COST;

    const piece = new BuildingPiece({
      type: this.selectedPiece,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rot: this.buildRot,
      assetManager: this.assetManager
    });
    this.scene.add(piece.mesh);
    this.pieces.push(piece);
    audio.sfx.build();
    return true;
  }

  placeBotWall(x, y, z, rot) {
    const GRID = Config.BUILD_GRID_SIZE;
    const gx = Math.round(x / GRID) * GRID;
    const gz = Math.round(z / GRID) * GRID;
    const gy = Math.max(0, Math.round(y / GRID) * GRID);
    const piece = new BuildingPiece({
      type: 'wall', x: gx, y: gy, z: gz, rot, assetManager: this.assetManager
    });
    this.scene.add(piece.mesh);
    this.pieces.push(piece);
    return piece;
  }

  editNearest(player, audio) {
    const pos = this.placement.getGridPosition(player);
    const target = this.pieces.find((p) => p.type !== 'trap' && Math.hypot(p.x - pos.x, p.z - pos.z) < 5);
    if (!target) return false;
    target.edited = !target.edited;
    target.mesh.scale.set(target.edited ? 0.55 : 1, target.edited ? 0.72 : 1, 1);
    audio.sfx.click();
    return true;
  }

  damagePiece(piece, amount) {
    return this.destruction.applyDamage(piece, amount, this.scene, this.pieces);
  }

  getSolidWallsNear(x, z, radius) {
    const out = [];
    for (const p of this.pieces) {
      if (p.alive && p.type === 'wall' && !p.edited && Math.hypot(p.x - x, p.z - z) <= radius) {
        out.push(p.getBoundingBox());
      }
    }
    return out;
  }

  getFloorHeightAt(x, y, z) {
    let maxH = -999;
    const half = Config.BUILD_GRID_SIZE * 0.55;
    for (const p of this.pieces) {
      if (!p.alive) continue;
      if ((p.type === 'floor' || p.type === 'stairs') && Math.abs(p.x - x) < half && Math.abs(p.z - z) < half && y >= p.y - 0.8) {
        maxH = Math.max(maxH, p.y + 0.5);
      }
    }
    return maxH;
  }

  update(dt, player, bots, damageSystem, audio, onBotEliminated) {
    this.placement.updatePreview(this.buildMode, player, this.selectedPiece, this.buildRot);

    for (const p of this.pieces) {
      if (!p.alive || p.type !== 'trap') continue;
      if (p.trapId === 'bouncer' && Math.hypot(p.x - player.x, p.z - player.z) < 2.2 && Math.abs(p.y - player.y) < 2) {
        player.vy = 22;
        player.grounded = false;
        audio.sfx.bounce();
      } else if (p.trapId === 'launch_pad' && Math.hypot(p.x - player.x, p.z - player.z) < 2.2 && Math.abs(p.y - player.y) < 2) {
        player.y += 4;
        player.vy = 28;
        player.setGliding(true);
        audio.sfx.bounce();
      } else if (p.trapId === 'spike_trap' || p.trapId === 'zap_trap') {
        const dmg = p.trapId === 'spike_trap' ? 100 : 50;
        for (const bot of bots) {
          if (bot.alive && !bot.isMate && Math.hypot(bot.x - p.x, bot.z - p.z) < 2.4) {
            damageSystem.applyBotDamage(bot, dmg, { attackerIsPlayer: true }, audio, onBotEliminated);
          }
        }
      }
    }
  }

  clear() {
    for (const p of this.pieces) this.scene.remove(p.mesh);
    this.pieces = [];
    this.buildMode = false;
  }
}
