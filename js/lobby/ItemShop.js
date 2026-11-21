import { eventBus } from '../core/EventBus.js';

/**
 * Item Shop controller: displays shop_items.json, supports 3D preview of shop skins/emotes, and purchases with L-Bucks.
 */
export class ItemShop {
  constructor(assetManager, profile, currencyManager, preview, audio) {
    this.assetManager = assetManager;
    this.profile = profile;
    this.currency = currencyManager;
    this.preview = preview;
    this.audio = audio;
  }

  render() {
    const grid = document.getElementById('shop-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.assetManager.data.shopItems.forEach((sItem) => {
      const fullItem = this.assetManager.getItemById(sItem.id) || sItem;
      const owned = this.profile.ownsItem(sItem.id);

      const card = document.createElement('div');
      card.className = `item-card rarity-${sItem.rarity || 2}`;
      card.innerHTML = `
        <div class="item-type-tag">${sItem.type}</div>
        <div class="item-name">${sItem.name}</div>
        <div class="item-meta">${sItem.price} L-Bucks</div>
      `;

      const previewBtn = document.createElement('button');
      previewBtn.className = 'btn-fn btn-blue';
      previewBtn.textContent = '3D PREVIEW';
      previewBtn.addEventListener('click', () => {
        this.audio.sfx.click();
        const user = this.profile.current;
        if (sItem.type === 'emote') {
          this.preview.showCharacter({ skinItem: this.assetManager.getItemById(user.loadout.skin), offsetX: 1.4 });
          this.preview.playEmote(fullItem.anim, 3.6);
          this.audio.sfx.emote();
        } else {
          this.preview.showCharacter({
            skinItem: sItem.type === 'skin' ? fullItem : this.assetManager.getItemById(user.loadout.skin),
            pickaxeItem: sItem.type === 'pickaxe' ? fullItem : null,
            gliderItem: sItem.type === 'glider' ? fullItem : null,
            mode: sItem.type === 'glider' ? 'glider' : sItem.type === 'pickaxe' ? 'pickaxe' : 'character',
            offsetX: 1.4
          });
        }
      });

      const buyBtn = document.createElement('button');
      buyBtn.className = `btn-fn ${owned ? 'btn-dark' : 'btn-yellow'}`;
      buyBtn.disabled = owned;
      buyBtn.textContent = owned ? 'OWNED' : `BUY (${sItem.price})`;
      buyBtn.addEventListener('click', () => {
        if (!this.currency.spendLBucks(sItem.price)) {
          eventBus.emit('ui:notify', 'Not enough L-Bucks! Visit the L-Bucks tab for free packs.');
          return;
        }
        this.audio.sfx.chest();
        this.profile.grantItem(sItem.id);
        this.render();
        eventBus.emit('ui:notify', `Purchased ${sItem.name}!`);
      });

      card.append(previewBtn, buyBtn);
      grid.appendChild(card);
    });
  }
}
