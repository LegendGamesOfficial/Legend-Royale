import { CharacterBuilder } from '../../assets/models/characters/CharacterBuilder.js';
import { pickRandomPersonality } from './BotPersonalities.js';

/**
 * Represents a single AI-controlled combatant (enemy or squadmate).
 */
export class Bot {
  constructor(id, { x, y, z, skinItem, isMate = false, assetManager, scene }) {
    this.id = id;
    this.isMate = isMate;
    this.name = isMate ? `SquadMate_${id + 1}` : `LegendBot_${id + 1}`;
    this.personality = pickRandomPersonality();

    this.x = x;
    this.y = y;
    this.z = z;
    this.hp = 100;
    this.shield = isMate ? 50 : 25;
    this.alive = true;
    this.dir = Math.random() * Math.PI * 2;
    this.state = 'ROAM';

    this.weaponPower = 12;
    this.heals = 1;
    this.materials = 40;
    this.fireCooldown = 1 + Math.random() * 2;
    this.buildCooldown = 0;

    this.mesh = CharacterBuilder.createCharacter(skinItem, assetManager);
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    let rem = amount;
    if (this.shield > 0) {
      const abs = Math.min(this.shield, rem);
      this.shield -= abs;
      rem -= abs;
    }
    this.hp -= rem;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  syncMesh() {
    if (!this.alive) return;
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.y = -this.dir + Math.PI / 2;
  }
}
