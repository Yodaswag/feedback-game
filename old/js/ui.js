export function updateChecklist(checklist) {
  for (const [mode, entries] of Object.entries(checklist)) {
    for (const [key, done] of Object.entries(entries)) {
      const el = document.getElementById(`mode-${mode}-${key}`);
      if (!el) continue;
      el.classList.toggle('is-complete', done);
      el.classList.toggle('is-pending', !done);
      el.querySelector('.status-icon').textContent = done ? '✅' : '⬜';
    }
  }
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
