/**
 * Allows bots to collect nearby world pickups, upgrade weapons, and heal when below threshold.
 */
export const BotLooting = {
  tryLootNearby(bot, pickupManager, scene) {
    const idx = pickupManager.findNearest(bot.x, bot.z, 3.2);
    if (idx === -1) return false;
    const p = pickupManager.pickups[idx];
    if (p.item.category === 'weapon') {
      bot.weaponPower = Math.max(bot.weaponPower, 10 + (p.item.rarity || 1) * 3);
    } else if (p.item.category === 'heal') {
      bot.heals += 1;
    }
    scene.remove(p.mesh);
    pickupManager.pickups.splice(idx, 1);
    return true;
  },

  tryHeal(bot) {
    if (bot.heals > 0 && bot.hp < 65) {
      bot.heals -= 1;
      bot.hp = Math.min(100, bot.hp + 35);
      return true;
    }
    return false;
  }
};
