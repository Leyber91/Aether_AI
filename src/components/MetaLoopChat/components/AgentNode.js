// AgentNode.js
// Renders a single agent's SVG node (circle + label)
import React from "react";

export default function AgentNode({ x, y, color, label, active, gradientId }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={active ? 44 : 38}
        fill={gradientId ? `url(#${gradientId})` : color}
        fillOpacity={active ? 0.22 : 0.14}
        stroke={color}
        strokeWidth={active ? 5 : 2.5}
        strokeOpacity={active ? 1 : 0.6}
        filter={active ? 'url(#glow)' : undefined}
        style={{ transition: 'r 0.25s, fill-opacity 0.25s, stroke-width 0.25s' }}
      />
      <circle
        cx={x}
        cy={y}
        r={28}
        fill="#0a121e"
        fillOpacity={0.6}
        stroke={color}
        strokeWidth={2}
      />
      <text
        x={x}
        y={y + 7}
        textAnchor="middle"
        fontSize="1.3em"
        fill={color}
        fontWeight="bold"
        opacity={active ? 1 : 0.7}
      >
        {label}
      </text>
    </g>
  );
}
