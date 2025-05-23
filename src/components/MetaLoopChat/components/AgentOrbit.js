// AgentOrbit.js
// Handles orbit math and rendering for MetaLoop agents

export default class AgentOrbit {
  constructor({ centerX, centerY, radius, color, label }) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = color;
    this.label = label;
  }
  getPositionByAngle(angle) {
    return {
      x: this.centerX + Math.cos(angle) * this.radius,
      y: this.centerY + Math.sin(angle) * this.radius,
    };
  }
  getPositionByProgress(progress, easingFn = null) {
    const eased = easingFn ? easingFn(progress) : progress;
    const angle = eased * 2 * Math.PI - Math.PI / 2;
    return this.getPositionByAngle(angle);
  }
  getCenter() {
    return { x: this.centerX, y: this.centerY };
  }
}
