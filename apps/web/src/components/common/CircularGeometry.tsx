import React from 'react';

interface CircularGeometryProps {
  className?: string;
  opacity?: number;
}

export const CircularGeometry: React.FC<CircularGeometryProps> = ({
  className = '',
  opacity = 0.85,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full max-w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outermost Harmonic Orbit */}
        <circle
          cx="250"
          cy="250"
          r="230"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          className="text-emerald-300/60 animate-spin-slow"
        />

        {/* Co-existence Ellipse A */}
        <ellipse
          cx="250"
          cy="250"
          rx="210"
          ry="140"
          transform="rotate(30 250 250)"
          stroke="currentColor"
          strokeWidth="1.2"
          className="text-emerald-600/30"
        />

        {/* Co-existence Ellipse B */}
        <ellipse
          cx="250"
          cy="250"
          rx="210"
          ry="140"
          transform="rotate(-30 250 250)"
          stroke="currentColor"
          strokeWidth="1.2"
          className="text-emerald-600/30"
        />

        {/* Inner Relationship Orbit */}
        <circle
          cx="250"
          cy="250"
          r="170"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-uhv-gold/40 animate-spin-reverse-slow"
        />

        {/* Human Values Core Circle */}
        <circle
          cx="250"
          cy="250"
          r="120"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 4"
          className="text-emerald-500/40"
        />

        {/* Interconnecting Harmony Radii */}
        <line x1="250" y1="20" x2="250" y2="480" stroke="currentColor" strokeWidth="0.8" className="text-emerald-200/50" />
        <line x1="20" y1="250" x2="480" y2="250" stroke="currentColor" strokeWidth="0.8" className="text-emerald-200/50" />

        {/* Orbiting Values Nodes (Humanity, Harmony, Knowledge, Nature) */}
        <circle cx="250" cy="80" r="4.5" className="fill-uhv-gold" />
        <circle cx="250" cy="420" r="4.5" className="fill-uhv-gold" />
        <circle cx="80" cy="250" r="4" className="fill-emerald-600" />
        <circle cx="420" cy="250" r="4" className="fill-emerald-600" />

        {/* Center halo */}
        <circle cx="250" cy="250" r="60" stroke="currentColor" strokeWidth="0.75" className="text-emerald-300/40" />
      </svg>
    </div>
  );
};
