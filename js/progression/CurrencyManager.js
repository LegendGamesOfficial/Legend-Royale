import { eventBus } from '../core/EventBus.js';

/**
 * Manages L-Bucks balance, free pack claims, and item shop purchases (local-only).
 */
export class CurrencyManager {
  constructor(playerProfile) {
    this.profile = playerProfile;
  }

  getBalance() {
    return this.profile.current ? this.profile.current.lbucks : 0;
  }

  addLBucks(amount) {
    const user = this.profile.current;
    if (!user || amount <= 0) return false;
    user.lbucks += amount;
    this.profile.save();
    eventBus.emit('profile:updated', user);
    return true;
  }

  spendLBucks(amount) {
    const user = this.profile.current;
    if (!user || amount < 0 || user.lbucks < amount) return false;
    user.lbucks -= amount;
    this.profile.save();
    eventBus.emit('profile:updated', user);
    return true;
  }
}
