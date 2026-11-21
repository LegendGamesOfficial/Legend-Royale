import { eventBus } from '../core/EventBus.js';

/**
 * Manages the active player's account data, guest profile, ownership, and loadout.
 */
export class PlayerProfile {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.current = null;
  }

  login(accounts, username, password) {
    const match = accounts.find((a) => a.username === username && a.password === password);
    if (!match) return { ok: false, error: 'Invalid username or password.' };
    this.current = this.saveManager.loadAccount(match);
    this._ensureDefaults();
    eventBus.emit('profile:loggedIn', this.current);
    return { ok: true, profile: this.current };
  }

  loginGuest() {
    this.current = {
      username: 'Guest',
      displayName: 'Guest',
      isGuest: true,
      level: 1,
      xp: 0,
      lbucks: 0,
      ownedItems: [
        'default_skin_1', 'default_skin_2', 'default_skin_3', 'default_skin_4',
        'default_pickaxe', 'default_glider', 'emote_dance_moves'
      ],
      claimedBattlePassLevels: [],
      loadout: {
        skin: 'default_skin_1',
        pickaxe: 'default_pickaxe',
        glider: 'default_glider',
        bannerIcon: 'star',
        bannerColor: '#2563eb',
        emotes: ['emote_dance_moves', null, null, null, null, null, null, null]
      }
    };
    eventBus.emit('profile:loggedIn', this.current);
    return this.current;
  }

  logout() {
    this.current = null;
    eventBus.emit('profile:loggedOut');
  }

  ownsItem(itemId) {
    return !!this.current && this.current.ownedItems.includes(itemId);
  }

  grantItem(itemId) {
    if (!this.current || this.ownsItem(itemId)) return false;
    this.current.ownedItems.push(itemId);
    this.save();
    eventBus.emit('profile:updated', this.current);
    return true;
  }

  save() {
    this.saveManager.saveAccount(this.current);
  }

  _ensureDefaults() {
    if (!this.current.claimedBattlePassLevels) this.current.claimedBattlePassLevels = [];
    if (!this.current.loadout) {
      this.current.loadout = {
        skin: 'default_skin_1',
        pickaxe: 'default_pickaxe',
        glider: 'default_glider',
        bannerIcon: 'star',
        bannerColor: '#2563eb',
        emotes: ['emote_dance_moves', null, null, null, null, null, null, null]
      };
    }
    if (!Array.isArray(this.current.loadout.emotes)) {
      this.current.loadout.emotes = ['emote_dance_moves', null, null, null, null, null, null, null];
    }
  }
}
