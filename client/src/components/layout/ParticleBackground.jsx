'use client';

import { useMemo, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Stable initialization callback defined outside the component
const initParticles = async (engine) => {
  await loadSlim(engine);
};

export default function ParticleBackground() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: {
        enable: false,
      },
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60, // Capped at 60fps for battery/thermal savings in background
      interactivity: {
        detectsOn: "window",
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 3,
          },
          grab: {
            distance: 140,
            links: {
              opacity: 0.4,
            },
          },
        },
      },
      particles: {
        color: {
          value: ["#8b5cf6", "#ec4899", "#eab308"],
        },
        links: {
          color: "#8b5cf6",
          distance: 120,
          enable: true,
          opacity: 0.12, // Lower opacity for high transparency as requested
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: 0.8, // Slow speed for clean background motion
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 90,
        },
        opacity: {
          value: 0.4,
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.1,
          }
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3.5 },
          animation: {
            enable: true,
            speed: 1.5,
            minimumValue: 0.6,
          }
        },
        shadow: {
          enable: true,
          color: "#8b5cf6",
          blur: 4,
        }
      },
      responsive: [
        {
          maxWidth: 768,
          options: {
            particles: {
              number: {
                value: 50, // Scale down particle count on mobile screens
              },
            },
          },
        },
      ],
      detectRetina: true,
    }),
    [],
  );

  if (!mounted) return null;

  return (
    <ParticlesProvider init={initParticles}>
      <Particles
        key={pathname}
        id="tsparticles"
        options={options}
        className="fixed inset-0 pointer-events-none"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: "none" }}
      />
    </ParticlesProvider>
  );
}

