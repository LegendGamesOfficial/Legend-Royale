import { Bot } from './Bot.js';
import { BotAI } from './BotAI.js';

/**
 * Spawns 99 bots (or staged developer bots) and schedules staggered AI updates.
 */
export class BotManager {
  constructor(scene, assetManager, animationManager = null) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.animationManager = animationManager;
    this.bots = [];
    this._cursor = 0;
    this.paused = false;
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
        new Bot(i, {
          x: bx, y: by, z: bz,
          skinItem, isMate,
          assetManager: this.assetManager,
          scene: this.scene,
          animationManager: this.animationManager
        })
      );
    }
  }

  spawnStagedBots(count, centerX, centerZ, world, spreadRadius = 22) {
    const skins = this.assetManager.data.items.filter((i) => i.type === 'skin');
    const startId = this.bots.length;
    const spawned = [];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * spreadRadius;
      const bx = centerX + Math.cos(ang) * dist;
      const bz = centerZ + Math.sin(ang) * dist;
      const by = Math.max(0.2, world.getTerrainHeight(bx, bz));
      const skinItem = skins[(startId + i) % Math.max(1, skins.length)];
      const bot = new Bot(startId + i, {
        x: bx, y: by, z: bz,
        skinItem, isMate: false,
        assetManager: this.assetManager,
        scene: this.scene,
        animationManager: this.animationManager
      });
      this.bots.push(bot);
      spawned.push(bot);
    }
    return spawned;
  }

  update(dt, ctx, batchSize = 25) {
    if (this.paused || this.bots.length === 0) return;
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
    for (const b of this.bots) {
      if (b.animator && this.animationManager) this.animationManager.unregister(b.animator);
      this.scene.remove(b.mesh);
    }
    this.bots = [];
    this._cursor = 0;
  }
}
