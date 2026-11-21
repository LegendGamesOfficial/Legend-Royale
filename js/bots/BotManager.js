import { Bot } from './Bot.js';
import { BotAI } from './BotAI.js';

/**
 * Spawns 99 bots and schedules staggered AI updates for high-FPS 100-combatant matches.
 */
export class BotManager {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.bots = [];
    this._cursor = 0;
  }

  spawnAll(mode, world) {
    this.clear();
    const skins = this.assetManager.data.items.filter((i) => i.type === 'skin');
    for (let i = 0; i < 99; i++) {
      const isMate = mode === 'SQUAD' && i < 3;
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 340;
      const bx = Math.cos(ang) * dist;
      const bz = Math.sin(ang) * dist;
      const by = Math.max(0.2, world.getTerrainHeight(bx, bz));
      const skinItem = skins[i % Math.max(1, skins.length)];

      this.bots.push(
        new Bot(i, { x: bx, y: by, z: bz, skinItem, isMate, assetManager: this.assetManager, scene: this.scene })
      );
    }
  }

  update(dt, ctx, batchSize = 25) {
    if (this.bots.length === 0) return;
    const count = Math.min(batchSize, this.bots.length);
    const scaledDt = dt * (this.bots.length / count);

    for (let i = 0; i < count; i++) {
      const bot = this.bots[this._cursor];
      this._cursor = (this._cursor + 1) % this.bots.length;
      if (bot.alive) {
        BotAI.updateBot(bot, ctx, scaledDt);
        bot.syncMesh();
      }
    }
  }

  clear() {
    for (const b of this.bots) this.scene.remove(b.mesh);
    this.bots = [];
    this._cursor = 0;
  }
}
