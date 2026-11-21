import { CollisionUtils } from '../utils/CollisionUtils.js';

/**
 * Fair, non-cheating perception system for bots:
 * - Field-of-view cone (130 deg) + close-range sound awareness (14m)
 * - Terrain line-of-sight sampling (cannot see through hills)
 * - Building & player-built structure raycast occlusion (cannot see through walls)
 * - Last-known-position memory
 */
export const BotPerception = {
  hasLineOfSight(ax, ay, az, bx, by, bz, world, buildingManager) {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.5) return true;

    const dir = { x: dx / dist, y: dy / dist, z: dz / dist };
    const origin = { x: ax, y: ay + 1.6, z: az };

    // 1. Check terrain occlusion along ray
    const steps = Math.min(12, Math.max(3, Math.floor(dist / 8)));
    for (let s = 1; s < steps; s++) {
      const t = (s / steps) * dist;
      const sx = origin.x + dir.x * t;
      const sy = origin.y + dir.y * t;
      const sz = origin.z + dir.z * t;
      if (world && world.getTerrainHeight(sx, sz) > sy + 0.4) {
        return false;
      }
    }

    // 2. Check POI building colliders
    if (world) {
      const poiBoxes = world.getNearbyColliders((ax + bx) * 0.5, (az + bz) * 0.5, dist * 0.6);
      for (const box of poiBoxes) {
        const hit = CollisionUtils.rayIntersectsAABB(origin, dir, box, dist);
        if (hit !== null && hit < dist - 0.5) return false;
      }
    }

    // 3. Check player-built walls/floors/ramps/cones
    if (buildingManager) {
      const buildBoxes = buildingManager.getRaycastBoxesNear((ax + bx) * 0.5, (az + bz) * 0.5, dist * 0.6);
      for (const box of buildBoxes) {
        const hit = CollisionUtils.rayIntersectsAABB(origin, dir, box, dist);
        if (hit !== null && hit < dist - 0.4) return false;
      }
    }

    return true;
  },

  findNearestThreat(bot, player, bots, stormManager, world, buildingManager) {
    let bestTarget = null;
    let bestDist = bot.personality.aggroRange;
    const fwdX = Math.cos(bot.dir);
    const fwdZ = Math.sin(bot.dir);

    const evaluateCandidate = (isPlayer, ref, cx, cy, cz, hp, isStealthed) => {
      const dx = cx - bot.x;
      const dz = cz - bot.z;
      const dist = Math.hypot(dx, dz);
      const maxRange = isStealthed ? 11 : bestDist;
      if (dist > maxRange || dist < 0.1) return;

      // FOV cone check (130 deg) OR close-range sound awareness (14m)
      const dot = (dx / dist) * fwdX + (dz / dist) * fwdZ;
      const inFOV = dot >= 0.42;
      const heardNearby = dist < 14;
      if (!inFOV && !heardNearby) return;

      // Actual line-of-sight occlusion check
      const visible = this.hasLineOfSight(bot.x, bot.y, bot.z, cx, cy, cz, world, buildingManager);
      if (!visible) return;

      bestDist = dist;
      bestTarget = { isPlayer, ref, x: cx, y: cy, z: cz, hp };
    };

    if (!bot.isMate && player.health.alive) {
      evaluateCandidate(true, player, player.x, player.y, player.z, player.health.hp, player.inBush);
    }

    const step = Math.max(1, Math.floor(bots.length / 25));
    const start = Math.floor(Math.random() * step);
    for (let i = start; i < bots.length; i += step) {
      const other = bots[i];
      if (!other.alive || other === bot || other.isMate === bot.isMate) continue;
      evaluateCandidate(false, other, other.x, other.y, other.z, other.hp, false);
    }

    const inStorm = stormManager.isInsideStorm(bot.x, bot.z);
    return { target: bestTarget, distance: bestDist, inStorm };
  }
};
