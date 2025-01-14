'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 30;
const PARTICLE_COLORS = [
  'rgba(76, 175, 80, 0.3)',  // Green
  'rgba(33, 150, 243, 0.3)', // Blue
  'rgba(255, 87, 34, 0.3)',  // Orange/Magma
  'rgba(156, 39, 176, 0.3)', // Purple
];
const PARTICLE_SIZES = [2, 3, 4];

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create initial particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      createParticle(container);
    }

    // Setup interval to continuously create new particles
    const interval = setInterval(() => {
      createParticle(container);
    }, 2000); // Create a new particle every 2 seconds

    return () => {
      clearInterval(interval);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  const createParticle = (container: HTMLDivElement) => {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random properties
    const size = PARTICLE_SIZES[Math.floor(Math.random() * PARTICLE_SIZES.length)];
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    const startX = Math.random() * container.offsetWidth;
    const xDrift = (Math.random() - 0.5) * 200; // Random drift between -100px and 100px
    const duration = 15 + Math.random() * 10; // Random duration between 15-25 seconds

    // Apply styles
    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${startX}px;
      bottom: -20px;
      --particle-color: ${color};
      --x-drift: ${xDrift}px;
      animation: 
        float-up ${duration}s linear forwards,
        particle-glow 2s ease-in-out infinite;
    `;

    container.appendChild(particle);

    // Remove particle after animation
    setTimeout(() => {
      if (container.contains(particle)) {
        container.removeChild(particle);
      }
    }, duration * 1000);
  };

  return <div ref={containerRef} className="particles-container" />;
}
