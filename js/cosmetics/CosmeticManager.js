import { eventBus } from '../core/EventBus.js';

/**
 * Central coordinator for equipped skins, pickaxes, gliders, banners, and emotes.
 */
export class CosmeticManager {
  constructor(assetManager, playerProfile) {
    this.assetManager = assetManager;
    this.profile = playerProfile;
  }

  getEquipped(type) {
    const user = this.profile.current;
    if (!user) return null;
    const id = user.loadout[type];
    return this.assetManager.getItemById(id);
  }

  equipItem(itemId) {
    const user = this.profile.current;
    const item = this.assetManager.getItemById(itemId);
    if (!user || !item || !this.profile.ownsItem(itemId)) return false;

    if (item.type === 'skin' || item.type === 'pickaxe' || item.type === 'glider') {
      user.loadout[item.type] = itemId;
      this.profile.save();
      eventBus.emit('cosmetic:equipped', item);
      return true;
    }
    return false;
  }

  setBanner(icon, color) {
    const user = this.profile.current;
    if (!user) return;
    if (icon) user.loadout.bannerIcon = icon;
    if (color) user.loadout.bannerColor = color;
    this.profile.save();
    eventBus.emit('profile:updated', user);
  }
}
