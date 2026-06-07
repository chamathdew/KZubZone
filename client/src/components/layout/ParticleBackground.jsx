import { useMemo, useEffect, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Stable initialization callback defined outside the component
const initParticles = async (engine) => {
  await loadSlim(engine);
};

export default function ParticleBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: {
        enable: true,
        zIndex: 1, // Draw on top of background but below z-10 content
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
            enable: true, // Enable mobile click/tap push
            mode: "push",
          },
          onHover: {
            enable: true, // Enable hover/touch interactions
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
          enable: true, // Enable linking lines on all screen sizes
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
          speed: 0.8, // Slightly slower speed for cleaner background motion
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: isMobile ? 50 : 90, // Scale down to 50 on mobile screens (balanced for performance)
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
          options: {},
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
          enable: true, // Enable shadows on all screens for premium aesthetic
          color: "#8b5cf6",
          blur: 4,
        }
      },
      detectRetina: true,
    }),
    [isMobile],
  );

  return (
    <ParticlesProvider init={initParticles}>
      <Particles
        id="tsparticles"
        options={options}
        className="pointer-events-none"
        style={{ pointerEvents: "none" }}
      />
    </ParticlesProvider>
  );
}
