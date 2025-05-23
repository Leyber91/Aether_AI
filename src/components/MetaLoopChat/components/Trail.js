// Trail.js
// Renders the fading trail behind the moving ball
import React from "react";

export default function Trail({ trail, color }) {
  if (!trail || trail.length === 0) return null;
  return (
    <g>
      {trail.map((pt, idx) => (
        <circle
          key={idx}
          cx={pt.x}
          cy={pt.y}
          r={12 - (trail.length - idx) * 0.5}
          fill={color}
          opacity={pt.opacity}
          filter="url(#glow)"
        />
      ))}
    </g>
  );
}
