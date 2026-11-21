/**
 * Controls the Victory Royale / Eliminated post-match summary modal.
 */
export class MatchResults {
  constructor(onReturnLobby) {
    this.modal = document.getElementById('match-end-modal');
    document.getElementById('btn-return-lobby').addEventListener('click', () => {
      this.hide();
      onReturnLobby();
    });
  }

  show({ victory, placement, kills, xpEarned, mode }) {
    document.getElementById('match-end-title').textContent = victory ? 'VICTORY ROYALE!' : 'ELIMINATED';
    document.getElementById('match-end-sub').textContent = victory
      ? 'You outlasted all 99 opponents!'
      : `Eliminated at #${placement}`;
    document.getElementById('end-place').textContent = `#${placement} / 100`;
    document.getElementById('end-kills').textContent = `${kills}`;
    document.getElementById('end-xp').textContent = `+${xpEarned} XP`;
    document.getElementById('end-mode').textContent = mode;
    this.modal.classList.remove('hidden');
  }

  hide() {
    this.modal.classList.add('hidden');
  }
}
