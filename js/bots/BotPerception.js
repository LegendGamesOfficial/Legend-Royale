/**
 * Realistic sensory perception for bots (limited range, stealth bush concealment, no omniscient wallhacks).
 */
export const BotPerception = {
  findNearestThreat(bot, player, bots, stormManager) {
    let bestTarget = null;
    let bestDist = bot.personality.aggroRange;

    // Check player (concealed if crouching in bush beyond 12m)
    if (!bot.isMate && player.health.alive) {
      const dp = Math.hypot(player.x - bot.x, player.z - bot.z);
      const effectiveRange = player.inBush ? 12 : bestDist;
      if (dp < effectiveRange) {
        bestDist = dp;
        bestTarget = { isPlayer: true, ref: player, x: player.x, y: player.y, z: player.z, hp: player.health.hp };
      }
    }

    // Check nearby enemy bots (sampled subset for O(N) performance)
    const step = Math.max(1, Math.floor(bots.length / 25));
    const start = Math.floor(Math.random() * step);
    for (let i = start; i < bots.length; i += step) {
      const other = bots[i];
      if (!other.alive || other === bot || other.isMate === bot.isMate) continue;
      const d = Math.hypot(other.x - bot.x, other.z - bot.z);
      if (d < bestDist) {
        bestDist = d;
        bestTarget = { isPlayer: false, ref: other, x: other.x, y: other.y, z: other.z, hp: other.hp };
      }
    }

    const inStorm = stormManager.isInsideStorm(bot.x, bot.z);
    return { target: bestTarget, distance: bestDist, inStorm };
  }
};
