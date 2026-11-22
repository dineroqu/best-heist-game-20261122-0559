// Nightshift Heist — keyboard and mouse input, kept apart from the game rules.
// Exposes a small state object the loop reads every frame.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    moveTarget: null,   // {x, y} in canvas space, set by mouse click
    pressed: new Set(), // edge-triggered keys, consumed by the loop
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const action = KEYMAP[event.code];
    if (action) {
      keys.add(action);
      state.pressed.add(action);
      event.preventDefault();
      return;
    }
    // One-shot actions go through the same pressed set.
    if (event.code === 'KeyQ') { state.pressed.add('smoke'); event.preventDefault(); }
    if (event.code === 'KeyE') { state.pressed.add('coin'); event.preventDefault(); }
    if (event.code === 'KeyP') { state.pressed.add('pause'); event.preventDefault(); }
    if (event.code === 'KeyM') { state.pressed.add('mute'); event.preventDefault(); }
    if (event.code === 'KeyR') { state.pressed.add('restart'); event.preventDefault(); }
    if (event.code === 'Enter') { state.pressed.add('confirm'); event.preventDefault(); }
    if (event.code === 'Space') { state.pressed.add('smoke'); event.preventDefault(); }
  });

  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
  });

  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    state.moveTarget = { x, y };
    state.pressed.add('confirm');
  });

  return state;
}

// Read the current movement direction from held keys. Returns {x, y} unit-ish.
export function moveDirection(input) {
  const x = (input.keys.has('right') ? 1 : 0) - (input.keys.has('left') ? 1 : 0);
  const y = (input.keys.has('down') ? 1 : 0) - (input.keys.has('up') ? 1 : 0);
  if (x === 0 && y === 0) return { x: 0, y: 0 };
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

// Take and clear one edge-triggered action, if it was pressed this frame.
export function takePressed(input, action) {
  if (input.pressed.has(action)) {
    input.pressed.delete(action);
    return true;
  }
  return false;
}
