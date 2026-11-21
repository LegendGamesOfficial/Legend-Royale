import { MathUtils } from '../utils/MathUtils.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

/**
 * Smooth ground, jump, crouch, skydive, and glider movement with AABB collision resolution.
 */
export class PlayerMovement {
  constructor() {
    this.walkSpeed = 7.5;
    this.runSpeed = 11.2;
    this.crouchSpeed = 5.2;
    this.jumpForce = 11.8;
    this.gravity = 26.5;
    this.radius = 0.55;
    this._stepTimer = 0;
  }

  updateGround(player, input, world, buildingManager, audio, dt) {
    const isMoving = input.forward !== 0 || input.strafe !== 0;
    const baseSpeed = player.crouch ? this.crouchSpeed : (input.sprint ? this.runSpeed : this.walkSpeed);
    const targetSpeed = isMoving ? baseSpeed * (player.aiming ? 0.65 : 1) : 0;

    player.currentSpeed = MathUtils.damp(player.currentSpeed, targetSpeed, 14, dt);

    if (isMoving) {
      const len = Math.hypot(input.forward, input.strafe) || 1;
      const mx = (-Math.sin(player.yaw) * input.forward + Math.cos(player.yaw) * input.strafe) / len;
      const mz = (-Math.cos(player.yaw) * input.forward - Math.sin(player.yaw) * input.strafe) / len;
      player.x += mx * player.currentSpeed * dt;
      player.z += mz * player.currentSpeed * dt;

      if (player.grounded) {
        this._stepTimer -= dt;
        if (this._stepTimer <= 0) {
          audio.sfx.footstep();
          this._stepTimer = player.crouch ? 0.45 : 0.3;
        }
      }
    }

    // Resolve horizontal collisions against POI buildings & player walls
    const colliders = world.getNearbyColliders(player.x, player.z, 8);
    if (buildingManager) {
      for (const b of buildingManager.getSolidWallsNear(player.x, player.z, 8)) {
        colliders.push(b);
      }
    }
    for (const box of colliders) {
      const res = CollisionUtils.resolveCircleAABB2D(player.x, player.z, this.radius, box);
      player.x = res.x;
      player.z = res.z;
    }

    // Jump & gravity
    if (input.jump && player.grounded) {
      player.vy = this.jumpForce;
      player.grounded = false;
      audio.sfx.jump();
    }
    player.vy -= this.gravity * dt;
    player.y += player.vy * dt;

    let floorY = world.getTerrainHeight(player.x, player.z);
    if (buildingManager) {
      floorY = Math.max(floorY, buildingManager.getFloorHeightAt(player.x, player.y, player.z));
    }

    if (player.y <= floorY) {
      if (!player.grounded && player.vy < -10) audio.sfx.land();
      player.y = floorY;
      player.vy = 0;
      player.grounded = true;
    } else if (player.y > floorY + 0.15) {
      player.grounded = false;
    }
  }

  updateSkydive(player, input, world, dt) {
    const speed = player.gliding ? 26 : 16;
    const len = Math.hypot(input.forward, input.strafe) || 1;
    if (input.forward !== 0 || input.strafe !== 0) {
      const mx = (-Math.sin(player.yaw) * input.forward + Math.cos(player.yaw) * input.strafe) / len;
      const mz = (-Math.cos(player.yaw) * input.forward - Math.sin(player.yaw) * input.strafe) / len;
      player.x += mx * speed * dt;
      player.z += mz * speed * dt;
    }
    player.y += (player.gliding ? -11 : -34) * dt;

    const gnd = world.getTerrainHeight(player.x, player.z);
    if (player.y <= 38 && !player.gliding) {
      player.setGliding(true);
    }
    if (player.y <= gnd) {
      player.y = gnd;
      player.vy = 0;
      player.grounded = true;
      player.setGliding(false);
      return true; // Landed
    }
    return false;
  }
}
