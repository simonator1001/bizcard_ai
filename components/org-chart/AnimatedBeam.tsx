import React from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface AnimatedBeamProps {
  start: Point;
  end: Point;
  color?: string;
  thickness?: number;
  duration?: number;
  curvature?: number;
  isHovered?: boolean;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  start,
  end,
  color = '#94a3b8',
  thickness = 2,
  duration = 0.5,
  curvature = 0.3,
  isHovered = false,
}) => {
  // Calculate control points for the curved path
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const controlX = midX;
  const controlY = midY - (end.y - start.y) * curvature;

  // Create the SVG path
  const path = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;

  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth={thickness}
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ 
        pathLength: 1, 
        opacity: 1,
        strokeWidth: isHovered ? thickness * 1.5 : thickness 
      }}
      transition={{ 
        pathLength: { duration, ease: "easeInOut" },
        opacity: { duration: duration * 0.5 },
        strokeWidth: { duration: 0.2 }
      }}
    />
  );
}; 