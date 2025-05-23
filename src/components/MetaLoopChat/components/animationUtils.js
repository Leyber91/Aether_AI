// animationUtils.js
// Easing and math helpers for MetaLoopAnimation

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Add more easing functions or helpers as needed
