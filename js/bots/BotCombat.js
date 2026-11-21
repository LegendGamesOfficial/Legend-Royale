import { HitDetection } from '../combat/HitDetection.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Executes fair bot combat:
 * - Reaction delay before first shot
 * - Smooth aim tracking & distance/movement spread
 * - Raycasted shot collision against walls & buildings (cannot damage through builds)
 * - Magazine & reload management
 */
export const BotCombat = {
  fireAt(bot, target, ctx, dt) {
    if (bot.reloadTimer > 0) {
      bot.reloadTimer = Math.max(0, bot.reloadTimer - dt);
      return;
    }
    if (bot.magAmmo <= 0) {
      bot.reloadTimer = 1.8;
      bot.magAmmo = 30;
      return;
    }
    if (bot.reactionTimer > 0) {
      bot.reactionTimer = Math.max(0, bot.reactionTimer - dt);
      return;
    }
    if (bot.fireCooldown > 0) return;

    const { projectileManager, damageSystem, buildingManager, world, audio, onBotEliminated } = ctx;
    const dist = Math.hypot(target.x - bot.x, target.z - bot.z);
    if (dist > (bot.weaponRange || 68)) return;

    // Smoothly turn aim toward target
    const desiredDir = Math.atan2(target.z - bot.z, target.x - bot.x);
    bot.aimYaw = MathUtils.lerpAngle(bot.aimYaw, desiredDir, 0.35);

    bot.fireCooldown = 0.55 + Math.random() * 0.65;
    bot.magAmmo -= 1;
    if (bot.animator) bot.animator.triggerShoot();

    // Distance + movement-based aim spread so bots miss realistically
    const distFactor = Math.min(1.8, dist / 35);
    const spread = (1 - bot.personality.accuracy) * 0.12 * distFactor;

    const THREE = window.THREE;
    const origin = new THREE.Vector3(bot.x, bot.y + 1.6, bot.z);
    const rawDir = new THREE.Vector3(
      target.x - origin.x,
      (target.y + 1.35) - origin.y,
      target.z - origin.z
    ).normalize();

    rawDir.x += (Math.random() - 0.5) * spread;
    rawDir.y += (Math.random() - 0.5) * spread * 0.6;
    rawDir.z += (Math.random() - 0.5) * spread;
    rawDir.normalize();

    // Gather solid colliders (buildings + player-built structures)
    const colliders = [];
    if (world) colliders.push(...world.getNearbyColliders(bot.x, bot.z, dist + 5));
    if (buildingManager) colliders.push(...buildingManager.getRaycastBoxesNear(bot.x, bot.z, dist + 5));

    const targetObj = target.isPlayer
      ? { alive: target.ref.health.alive, x: target.ref.x, y: target.ref.y, z: target.ref.z }
      : target.ref;

    const res = HitDetection.raycastShot(origin, rawDir, bot.weaponRange || 68, [targetObj], colliders);
    const endPoint = origin.clone().add(rawDir.clone().multiplyScalar(res.distance));
    projectileManager.spawnTracer(origin, endPoint);

    // If a wall or building blocked the shot, damage the build instead of the target!
    if (res.hitBuild && buildingManager) {
      bot.losBlocked = true;
      const destroyed = buildingManager.damagePiece(res.hitBuild, bot.weaponPower || 12);
      if (destroyed) audio.sfx.buildDestroy();
      return;
    }

    if (res.hitTarget) {
      bot.losBlocked = false;
      const dmg = bot.weaponPower || 12;
      if (target.isPlayer) {
        damageSystem.applyPlayerDamage(target.ref, dmg, audio);
      } else if (target.ref && target.ref.alive) {
        damageSystem.applyBotDamage(target.ref, dmg, { attackerIsPlayer: false }, audio, onBotEliminated);
      }
    }
  }
};
