// Keyboard and mouse state. WASD / arrows move, Shift sneaks, a mouse
// click tosses a coin at that spot, M mutes, Enter confirms panels.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    coinClick: null,   // {x, y} in canvas pixels, consumed by the game loop
    pressedEnter: false,
    pressedMute: false,
  };

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    keys.add(k);
    if (k === 'enter') input.pressedEnter = true;
    if (k === 'm') input.pressedMute = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.coinClick = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  });

  return input;
}

export function moveVector(input) {
  const k = input.keys;
  let x = 0, y = 0;
  if (k.has('a') || k.has('arrowleft')) x -= 1;
  if (k.has('d') || k.has('arrowright')) x += 1;
  if (k.has('w') || k.has('arrowup')) y -= 1;
  if (k.has('s') || k.has('arrowdown')) y += 1;
  const len = Math.hypot(x, y);
  if (len > 0) { x /= len; y /= len; }
  return { x, y, sneaking: k.has('shift') };
}
