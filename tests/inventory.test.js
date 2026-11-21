import assert from 'node:assert/strict';
import { Inventory } from '../js/inventory/Inventory.js';
import { ItemDefinitions } from '../js/inventory/ItemDefinitions.js';

export function runInventoryTests() {
  const inv = new Inventory();
  const defs = new ItemDefinitions({ weapons: [{ id: 'scar', name: 'SCAR', category: 'weapon', rarities: [4], damage: [35], mag: 30 }], consumables: [], traps: [] });
  const item = defs.rollRandomLoot();
  inv.addItem(item);
  assert.equal(inv.getActiveItem().id, 'scar');
  assert.equal(inv.getAmmoType('sniper_rifle'), 'heavy');
  console.log('PASS: inventory.test.js');
}
