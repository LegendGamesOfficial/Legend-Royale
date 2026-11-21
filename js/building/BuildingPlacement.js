import { Config } from '../core/Config.js';

/**
 * Grid-snapped placement calculator with green/red validity preview.
 */
export class BuildingPlacement {
  constructor(scene) {
    this.scene = scene;
    const THREE = window.THREE;
    const GRID = Config.BUILD_GRID_SIZE;
    this.validMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.45 });
    this.invalidMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.48 });
    this.previewMesh = new THREE.Mesh(new THREE.BoxGeometry(GRID, GRID, 0.25), this.validMat);
    this.previewMesh.visible = false;
    this.scene.add(this.previewMesh);
  }

  getGridPosition(player, buildPiece) {
    const GRID = Config.BUILD_GRID_SIZE;
    const fwdX = -Math.sin(player.yaw) * 4.5;
    const fwdZ = -Math.cos(player.yaw) * 4.5;
    const gx = Math.round((player.x + fwdX) / GRID) * GRID;
    const gz = Math.round((player.z + fwdZ) / GRID) * GRID;
    const gy = Math.max(-1, Math.round(player.y / GRID) * GRID);
    // Snap yaw to nearest 90 degrees
    const snappedRot = Math.round(player.yaw / (Math.PI / 2)) * (Math.PI / 2);
    return { x: gx, y: gy, z: gz, snappedRot };
  }

  isValidPlacement(pos, buildPiece, rot, player, pieces, world) {
    if (buildPiece !== 'trap' && player.wood < Config.BUILD_COST) return false;
    if (world) {
      const terrainY = world.getTerrainHeight(pos.x, pos.z);
      if (pos.y < terrainY - 2.2) return false;
    }
    for (const p of pieces) {
      if (!p.alive) continue;
      if (p.type === buildPiece && Math.abs(p.x - pos.x) < 0.5 && Math.abs(p.y - pos.y) < 0.5 && Math.abs(p.z - pos.z) < 0.5) {
        if (buildPiece !== 'wall' || Math.abs(Math.sin(p.rot - rot)) < 0.2) {
          return false; // Duplicate overlapping piece
        }
      }
    }
    return true;
  }

  updatePreview(visible, player, buildPiece, extraRot, pieces, world) {
    this.previewMesh.visible = visible;
    if (!visible) return { valid: false, pos: null };

    const pos = this.getGridPosition(player, buildPiece);
    const totalRot = pos.snappedRot + extraRot;
    const valid = this.isValidPlacement(pos, buildPiece, totalRot, player, pieces, world);

    this.previewMesh.material = valid ? this.validMat : this.invalidMat;
    this.previewMesh.position.set(pos.x, pos.y + (buildPiece === 'wall' ? 2 : 0.25), pos.z);
    this.previewMesh.rotation.y = totalRot;
    this.previewMesh.scale.set(1, buildPiece === 'wall' ? 1 : 0.12, buildPiece === 'wall' ? 1 : 16);
    return { valid, pos, rot: totalRot };
  }
}
