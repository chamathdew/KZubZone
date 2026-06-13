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
  const [isMobile, setIsMobile] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const options = useMemo(
    () => {
      if (isMobile) {
        return {
          fullScreen: {
            enable: false,
          },
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 40, // Lower fps limit on mobile for battery and CPU savings
          interactivity: {
            detectsOn: "window",
            events: {
              onClick: {
                enable: false, // Disable click push on mobile to save CPU
              },
              onHover: {
                enable: false, // Disable touch hover trigger calculations
              },
              resize: true,
            },
          },
          particles: {
            color: {
              value: ["#8b5cf6", "#ec4899", "#eab308"],
            },
            links: {
              color: "#8b5cf6",
              distance: 90, // Reduced link distance for fewer line computations
              enable: true,
              opacity: 0.1,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "out",
              },
              random: true,
              speed: 0.5, // Slower motion on mobile
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 25, // Significantly reduced particle count on mobile
            },
            opacity: {
              value: 0.35,
              animation: {
                enable: true,
                speed: 0.8,
                minimumValue: 0.1,
              }
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 0.8, max: 2.8 },
              animation: {
                enable: true,
                speed: 1,
                minimumValue: 0.5,
              }
            },
            shadow: {
              enable: false, // Disabled resource-heavy CSS/canvas shadows on mobile
            }
          },
          detectRetina: false, // Disable retina scaling on mobile to avoid double resolution processing
        };
      }

      // Desktop layout - Full premium details
      return {
        fullScreen: {
          enable: false,
        },
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
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
            opacity: 0.12,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "out",
            },
            random: true,
            speed: 0.8,
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
          detectRetina: true,
        };
    },
    [isMobile],
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

