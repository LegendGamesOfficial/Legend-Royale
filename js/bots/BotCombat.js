/**
 * Executes bot-vs-player and bot-vs-bot ranged combat with realistic accuracy & tracers.
 */
export const BotCombat = {
  fireAt(bot, target, projectileManager, damageSystem, audio, onBotEliminated) {
    if (bot.fireCooldown > 0) return;
    bot.fireCooldown = 0.85 + Math.random() * 0.9 + bot.personality.reactionTime;

    const THREE = window.THREE;
    const origin = new THREE.Vector3(bot.x, bot.y + 1.6, bot.z);
    const hitRoll = Math.random() < bot.personality.accuracy;
    const aimOffset = hitRoll ? 0 : (Math.random() - 0.5) * 3.2;
    const dest = new THREE.Vector3(target.x + aimOffset, target.y + 1.4, target.z + aimOffset);
    projectileManager.spawnTracer(origin, dest);

    if (!hitRoll) return;
    const dmg = bot.weaponPower || 12;

    if (target.isPlayer) {
      damageSystem.applyPlayerDamage(target.ref, dmg, audio);
    } else if (target.ref && target.ref.alive) {
      damageSystem.applyBotDamage(target.ref, dmg, { attackerIsPlayer: false }, audio, onBotEliminated);
    }
  }
};
