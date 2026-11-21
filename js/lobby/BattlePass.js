import { eventBus } from '../core/EventBus.js';

/**
 * Season 1 Battle Pass (5 Tiers, Levels 5-125, 1000 XP per level, free for all players).
 */
export class BattlePass {
  constructor(assetManager, profile, currencyManager, audio) {
    this.assetManager = assetManager;
    this.profile = profile;
    this.currency = currencyManager;
    this.audio = audio;
  }

  render() {
    const container = document.getElementById('bp-tiers-container');
    const bp = this.assetManager.data.battlePass;
    const user = this.profile.current;
    if (!container || !bp || !user) return;
    container.innerHTML = '';

    bp.tiers.forEach((tier) => {
      const block = document.createElement('div');
      block.className = 'bp-tier-block';
      block.innerHTML = `<div class="bp-tier-title">${tier.title} (Free Pass)</div>`;
      const grid = document.createElement('div');
      grid.className = 'bp-grid';

      tier.rewards.forEach((rew) => {
        const item = this.assetManager.getItemById(rew.itemId);
        const rarity = item ? item.rarity : 4;
        const unlocked = user.level >= rew.level;
        const claimed = user.claimedBattlePassLevels.includes(rew.level);

        const card = document.createElement('div');
        card.className = `item-card rarity-${rarity}`;
        card.innerHTML = `
          <div class="item-type-tag">LVL ${rew.level} • ${rew.type}</div>
          <div class="item-name">${rew.name}</div>
          <div class="item-meta">${claimed ? 'Unlocked & Claimed' : unlocked ? 'Ready to Claim!' : `Requires Level ${rew.level}`}</div>
        `;

        const btn = document.createElement('button');
        btn.className = `btn-fn ${claimed ? 'btn-dark' : unlocked ? 'btn-yellow' : 'btn-dark'}`;
        btn.disabled = !unlocked || claimed;
        btn.textContent = claimed ? 'CLAIMED' : unlocked ? 'UNLOCK' : 'LOCKED';
        btn.addEventListener('click', () => {
          this.audio.sfx.chest();
          user.claimedBattlePassLevels.push(rew.level);
          if (rew.type === 'lbucks') {
            this.currency.addLBucks(rew.amount);
          } else {
            this.profile.grantItem(rew.itemId);
          }
          this.profile.save();
          this.render();
          eventBus.emit('ui:notify', `Unlocked ${rew.name}!`);
        });
        card.appendChild(btn);
        grid.appendChild(card);
      });

      block.appendChild(grid);
      container.appendChild(block);
    });
  }
}
