import { Config } from '../core/Config.js';

/**
 * Computes grid-aligned placement coordinates and updates the translucent build preview mesh.
 */
export class BuildingPlacement {
  constructor(scene) {
    this.scene = scene;
    const THREE = window.THREE;
    const GRID = Config.BUILD_GRID_SIZE;
    this.previewMesh = new THREE.Mesh(
      new THREE.BoxGeometry(GRID, GRID, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42 })
    );
    this.previewMesh.visible = false;
    this.scene.add(this.previewMesh);
  }

  getGridPosition(player) {
    const GRID = Config.BUILD_GRID_SIZE;
    const fwdX = -Math.sin(player.yaw) * 4.5;
    const fwdZ = -Math.cos(player.yaw) * 4.5;
    return {
      x: Math.round((player.x + fwdX) / GRID) * GRID,
      y: Math.max(0, Math.round(player.y / GRID) * GRID),
      z: Math.round((player.z + fwdZ) / GRID) * GRID
    };
  }

  updatePreview(visible, player, buildPiece, buildRot) {
    this.previewMesh.visible = visible;
    if (!visible) return;
    const pos = this.getGridPosition(player);
    this.previewMesh.position.set(pos.x, pos.y + (buildPiece === 'wall' ? 2 : 0.25), pos.z);
    this.previewMesh.rotation.y = buildRot;
    this.previewMesh.scale.set(1, buildPiece === 'wall' ? 1 : 0.12, buildPiece === 'wall' ? 1 : 16);
  }
}
