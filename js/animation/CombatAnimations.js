import { MathUtils } from '../utils/MathUtils.js';

/**
 * Procedural combat animations (aiming, shooting recoil, reloading, weapon switching, hit flinch).
 */
export const CombatAnimations = {
  apply(rig, state, dt) {
    const { armR, armL, torso } = rig.userData;

    if (state.isReloading) {
      armR.rotation.x = MathUtils.damp(armR.rotation.x, -0.9, 14, dt);
      armL.rotation.x = MathUtils.damp(armL.rotation.x, -1.1, 14, dt);
      return;
    }

    if (state.isAiming || state.isShooting) {
      const recoil = state.recoilTimer > 0 ? Math.sin(state.recoilTimer * 40) * 0.22 : 0;
      armR.rotation.x = MathUtils.damp(armR.rotation.x, -1.45 - recoil, 18, dt);
    }

    if (state.hitFlinchTimer > 0) {
      torso.rotation.x = MathUtils.damp(torso.rotation.x, -0.18, 20, dt);
    } else {
      torso.rotation.x = MathUtils.damp(torso.rotation.x, 0, 12, dt);
    }
  }
};
