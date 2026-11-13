/**
 * Zero-re-render cursor-following 3D floating tilt & radial sheen handlers.
 * Updates CSS custom properties directly on hovered cards for silky 60fps interaction.
 */
export function handleFloatingCardMove(e) {
  const el = e.currentTarget;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

  el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  el.style.setProperty('--rx', `${((0.5 - py) * 5).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${((px - 0.5) * 5).toFixed(2)}deg`);
}

export function handleFloatingCardLeave(e) {
  const el = e.currentTarget;
  if (!el) return;
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
}

export const floatingCardEvents = {
  onMouseMove: handleFloatingCardMove,
  onMouseLeave: handleFloatingCardLeave
};
