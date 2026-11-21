import { CharacterBuilder } from '../../assets/models/characters/CharacterBuilder.js';
import { CharacterAnimator } from '../animation/CharacterAnimator.js';
import { pickRandomPersonality } from './BotPersonalities.js';

/**
 * Represents a single AI-controlled combatant with fair perception memory, aim smoothing, and CharacterAnimator.
 */
export class Bot {
  constructor(id, { x, y, z, skinItem, isMate = false, assetManager, scene, animationManager = null }) {
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
    this.aimYaw = this.dir;
    this.speed = 0;
    this.state = 'ROAM';

    // Fair perception & combat state
    this.currentTarget = null;
    this.lastKnownPos = null;
    this.timeSinceSeen = 999;
    this.losBlocked = false;
    this.reactionTimer = this.personality.reactionTime;
    this.magAmmo = 30;
    this.reloadTimer = 0;

    this.weaponPower = 12;
    this.weaponRange = 68;
    this.heals = 1;
    this.materials = 40;
    this.fireCooldown = 1 + Math.random() * 2;
    this.buildCooldown = 0;

    this.mesh = CharacterBuilder.createCharacter(skinItem, assetManager);
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);

    this.animator = animationManager ? animationManager.register(new CharacterAnimator(this.mesh)) : null;
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
    if (this.animator) this.animator.triggerHit();
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      if (this.animator) this.animator.state.eliminated = true;
      this.mesh.visible = false;
    }
  }

  syncMesh() {
    if (!this.alive) return;
    this.mesh.position.set(this.x, this.y, this.z);
    // Character +Z front faces dir (cos(dir), sin(dir)) -> rotation.y = atan2(cos(dir), sin(dir))
    this.mesh.rotation.y = Math.atan2(Math.cos(this.dir), Math.sin(this.dir));
    if (this.animator) {
      this.animator.state.speed = this.speed;
      this.animator.state.grounded = true;
      this.animator.state.isAiming = this.state === 'COMBAT';
      this.animator.state.isReloading = this.reloadTimer > 0;
    }
  }
}
