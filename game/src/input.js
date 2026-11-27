// Pardon Run — input. One job: turn keyboards and mice into a small
// state object the game reads, so no other file touches the DOM events.

export function createInput(canvas) {
  const keys = new Set();
  const clicks = [];
  let pointerDown = false;

  const GAME_KEYS = new Set([
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
    "KeyA", "KeyD", "KeyW", "KeyS", "ShiftLeft", "ShiftRight",
    "Enter", "KeyR", "KeyM", "KeyP",
  ]);

  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());

  function toGamePoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    pointerDown = true;
    clicks.push(toGamePoint(e));
  });
  window.addEventListener("pointerup", () => { pointerDown = false; });

  return {
    down: (code) => keys.has(code),
    pressed: (code) => keys.has(code),
    takeClicks: () => clicks.splice(0, clicks.length),
    get pointerDown() { return pointerDown; },
    right: () => keys.has("ArrowRight") || keys.has("KeyD"),
    left: () => keys.has("ArrowLeft") || keys.has("KeyA"),
    jump: () => keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW"),
    duck: () => keys.has("ArrowDown") || keys.has("KeyS"),
    dash: () => keys.has("ShiftLeft") || keys.has("ShiftRight"),
  };
}
