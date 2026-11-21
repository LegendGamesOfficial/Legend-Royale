import { BotPerception } from './BotPerception.js';
import { BotNavigation } from './BotNavigation.js';
import { BotLooting } from './BotLooting.js';
import { BotBuilding } from './BotBuilding.js';
import { BotCombat } from './BotCombat.js';

/**
 * Behavior state machine for each bot (ROTATE, RETREAT, LOOT, COMBAT, ROAM).
 */
export const BotAI = {
  updateBot(bot, ctx, dt) {
    if (!bot.alive) return;
    bot.fireCooldown = Math.max(0, bot.fireCooldown - dt);
    bot.buildCooldown = Math.max(0, bot.buildCooldown - dt);

    const { player, bots, stormManager, world, pickupManager, buildingManager, projectileManager, damageSystem, audio, onBotEliminated } = ctx;
    const sense = BotPerception.findNearestThreat(bot, player, bots, stormManager);

    // 1. Storm rotation priority
    if (sense.inStorm) {
      bot.state = 'ROTATE';
      BotNavigation.moveToward(bot, stormManager.cx, stormManager.cz, 6.8, world, dt);
      return;
    }

    // 2. Retreat & heal if low HP
    if (bot.hp <= bot.personality.retreatHp) {
      bot.state = 'RETREAT';
      BotLooting.tryHeal(bot);
      if (sense.target) {
        BotBuilding.tryBuildCover(bot, sense.target.x, sense.target.z, buildingManager);
        const awayX = bot.x + (bot.x - sense.target.x);
        const awayZ = bot.z + (bot.z - sense.target.z);
        BotNavigation.moveToward(bot, awayX, awayZ, 6.2, world, dt);
        return;
      }
    }

    // 3. Combat if threat spotted
    if (sense.target) {
      bot.state = 'COMBAT';
      bot.dir = Math.atan2(sense.target.z - bot.z, sense.target.x - bot.x);
      if (sense.distance < 22) {
        BotBuilding.tryBuildCover(bot, sense.target.x, sense.target.z, buildingManager);
      }
      BotCombat.fireAt(bot, sense.target, projectileManager, damageSystem, audio, onBotEliminated);
      return;
    }

    // 4. Loot & Roam
    bot.state = 'ROAM';
    BotLooting.tryLootNearby(bot, pickupManager, ctx.scene);
    BotNavigation.roam(bot, world, dt);
  }
};
