import { MathUtils } from '../utils/MathUtils.js';

/**
 * Procedural locomotion animations (idle, walk, run, jump, fall, glide, crouch).
 */
export const MovementAnimations = {
  apply(rig, state, t, dt) {
    const { armL, armR, legL, legR, torso, headGrp } = rig.userData;
    const speed = state.speed || 0;
    const isMoving = speed > 0.4;

    if (state.gliding) {
      armL.rotation.x = MathUtils.damp(armL.rotation.x, -2.5, 10, dt);
      armR.rotation.x = MathUtils.damp(armR.rotation.x, -2.5, 10, dt);
      legL.rotation.x = MathUtils.damp(legL.rotation.x, 0.25, 8, dt);
      legR.rotation.x = MathUtils.damp(legR.rotation.x, -0.25, 8, dt);
      return;
    }

    if (!state.grounded) {
      armL.rotation.x = MathUtils.damp(armL.rotation.x, -0.6, 10, dt);
      armR.rotation.x = MathUtils.damp(armR.rotation.x, -0.6, 10, dt);
      legL.rotation.x = MathUtils.damp(legL.rotation.x, 0.45, 10, dt);
      legR.rotation.x = MathUtils.damp(legR.rotation.x, -0.35, 10, dt);
      return;
    }

    if (isMoving) {
      const freq = state.crouch ? 7.5 : 11.5;
      const amp = state.crouch ? 0.35 : 0.65;
      const swing = Math.sin(t * freq) * amp;
      legL.rotation.x = MathUtils.damp(legL.rotation.x, swing, 14, dt);
      legR.rotation.x = MathUtils.damp(legR.rotation.x, -swing, 14, dt);
      armL.rotation.x = MathUtils.damp(armL.rotation.x, -swing * 0.7, 14, dt);
      if (!state.isAiming && !state.isShooting) {
        armR.rotation.x = MathUtils.damp(armR.rotation.x, swing * 0.7, 14, dt);
      }
      torso.position.y = 1.38 + Math.abs(Math.sin(t * freq)) * 0.04;
    } else {
      legL.rotation.x = MathUtils.damp(legL.rotation.x, 0, 12, dt);
      legR.rotation.x = MathUtils.damp(legR.rotation.x, 0, 12, dt);
      armL.rotation.x = MathUtils.damp(armL.rotation.x, 0, 12, dt);
      if (!state.isAiming && !state.isShooting) {
        armR.rotation.x = MathUtils.damp(armR.rotation.x, 0, 12, dt);
      }
      torso.position.y = 1.38 + Math.sin(t * 2.2) * 0.015;
    }

    headGrp.rotation.x = MathUtils.damp(headGrp.rotation.x, state.crouch ? 0.15 : 0, 10, dt);
  }
};
