import { BotPerception } from './BotPerception.js';
import { BotNavigation } from './BotNavigation.js';
import { BotLooting } from './BotLooting.js';
import { BotBuilding } from './BotBuilding.js';
import { BotCombat } from './BotCombat.js';

/**
 * Build-aware Behavior State Machine for bots (ROTATE, RETREAT, COMBAT, SEARCH, ROAM).
 */
export const BotAI = {
  updateBot(bot, ctx, dt) {
    if (!bot.alive) return;
    bot.fireCooldown = Math.max(0, bot.fireCooldown - dt);
    bot.buildCooldown = Math.max(0, bot.buildCooldown - dt);

    const { player, bots, stormManager, world, pickupManager, buildingManager } = ctx;
    const sense = BotPerception.findNearestThreat(bot, player, bots, stormManager, world, buildingManager);

    // 1. Storm rotation priority
    if (sense.inStorm) {
      bot.state = 'ROTATE';
      bot.speed = 6.8;
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
        bot.speed = 6.2;
        BotNavigation.moveToward(bot, awayX, awayZ, 6.2, world, dt);
        return;
      }
    }

    // 3. Direct Line-of-Sight Combat
    if (sense.target) {
      if (bot.currentTarget !== sense.target.ref) {
        bot.currentTarget = sense.target.ref;
        bot.reactionTimer = bot.personality.reactionTime;
      }
      bot.lastKnownPos = { x: sense.target.x, y: sense.target.y, z: sense.target.z };
      bot.timeSinceSeen = 0;
      bot.losBlocked = false;
      bot.state = 'COMBAT';
      bot.dir = Math.atan2(sense.target.z - bot.z, sense.target.x - bot.x);
      bot.speed = 0;

      if (sense.distance < 22) {
        BotBuilding.tryBuildCover(bot, sense.target.x, sense.target.z, buildingManager);
      }
      BotCombat.fireAt(bot, sense.target, ctx, dt);
      return;
    }

    // 4. Search last known position if target recently ducked behind cover
    if (bot.lastKnownPos && bot.timeSinceSeen < 4.5) {
      bot.timeSinceSeen += dt;
      bot.losBlocked = true;
      bot.state = 'SEARCH';
      bot.speed = 5.6;
      // Flank slightly around cover toward last known position
      BotNavigation.moveToward(bot, bot.lastKnownPos.x, bot.lastKnownPos.z, 5.6, world, dt);
      if (Math.hypot(bot.x - bot.lastKnownPos.x, bot.z - bot.lastKnownPos.z) < 3) {
        bot.lastKnownPos = null;
      }
      return;
    }

    // 5. Loot & Roam
    bot.currentTarget = null;
    bot.state = 'ROAM';
    bot.speed = 5.2;
    BotLooting.tryLootNearby(bot, pickupManager, ctx.scene);
    BotNavigation.roam(bot, world, dt);
  }
};
