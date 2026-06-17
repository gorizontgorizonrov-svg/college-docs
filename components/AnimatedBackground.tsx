"use client";

import { useMemo } from "react";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function AnimatedBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: rand(0, 100),
      top: rand(0, 100),
      size: rand(1.5, 3.5),
      delay: rand(0, 5),
      duration: rand(3, 6),
    }));
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: rand(5, 95),
      size: rand(2, 5),
      delay: rand(0, 8),
      duration: rand(12, 20),
    }));
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: "absolute",
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            background: "rgba(167, 139, 250, 0.6)",
            boxShadow: `0 0 ${star.size * 2}px rgba(167, 139, 250, 0.3)`,
            animation: `starPulse ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.3)",
            boxShadow: `0 0 ${p.size * 3}px rgba(139, 92, 246, 0.15)`,
            animation: `particleDrift ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
