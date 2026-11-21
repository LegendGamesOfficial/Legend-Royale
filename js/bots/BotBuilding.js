/**
 * Places defensive walls when bots take fire or engage in combat based on their personality.
 */
export const BotBuilding = {
  tryBuildCover(bot, threatX, threatZ, buildingManager) {
    if (!buildingManager || bot.materials < 10 || bot.buildCooldown > 0) return false;
    if (Math.random() > bot.personality.buildChance) return false;

    const ang = Math.atan2(threatZ - bot.z, threatX - bot.x);
    const wx = bot.x + Math.cos(ang) * 3.2;
    const wz = bot.z + Math.sin(ang) * 3.2;
    buildingManager.placeBotWall(wx, bot.y, wz, -ang + Math.PI / 2);
    bot.materials -= 10;
    bot.buildCooldown = 3.5;
    return true;
  }
};
