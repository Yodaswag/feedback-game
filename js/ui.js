export function updateChecklist(checklist) {
  for (const [mode, entries] of Object.entries(checklist)) {
    for (const [key, done] of Object.entries(entries)) {
      const el = document.getElementById(`check-${mode}-${key}`);
      if (!el) continue;
      el.classList.toggle('done', done);
      el.querySelector('.status-icon').textContent = done ? '✅' : '⬜';
    }
  }
}

export function updateProgress(count, goal) {
  document.querySelectorAll('#chestProgress span').forEach((el, index) => {
    el.classList.toggle('active', index < count);
  });
}

export function wireUtilityControls({ onSpeedChange, onMuteToggle }) {
  const muteBtn = document.getElementById('muteBtn');
  const speedBtn = document.getElementById('speedBtn');
  const speedTray = document.getElementById('speedTray');
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');

  muteBtn.addEventListener('click', () => onMuteToggle?.());
  speedBtn.addEventListener('click', () => speedTray.classList.toggle('hidden'));
  speedSlider.addEventListener('input', () => {
    const value = Number(speedSlider.value);
    speedValue.textContent = `×${value.toFixed(1)}`;
    onSpeedChange?.(value);
  });
}
