"use client";

/**
 * Animated health-themed loading screen.
 * Shows rotating health icons (heartbeat, stethoscope, pill, tooth, shield)
 * with a pulsing ring and "Cargando..." text.
 */
export function HealthLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Rotating icons ring */}
        <div className="relative h-24 w-24">
          {/* Outer ring pulse */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-0 rounded-full border-2 border-primary/30" />

          {/* Center icon — heartbeat */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-primary animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
            </svg>
          </div>

          {/* Orbiting icons */}
          {[
            // Tooth
            { delay: "0s", path: "M12 2C9.5 2 7.5 3.5 7 6c-.5 2.5 0 4 .5 6 .3 1.2.5 3-.5 5.5a.5.5 0 0 0 .9.4c1-1.5 2-2.5 2.6-2.9.4-.3.6-.3 1 0 .6.4 1.6 1.4 2.6 2.9a.5.5 0 0 0 .9-.4c-1-2.5-.8-4.3-.5-5.5.5-2 1-3.5.5-6-.5-2.5-2.5-4-5-4Z" },
            // Pill
            { delay: "0.8s", path: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" },
            // Shield/cross
            { delay: "1.6s", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" },
            // Stethoscope
            { delay: "2.4s", path: "M4.8 2.655A.5.5 0 1 0 4 3.145V6.5a2.5 2.5 0 0 0 5 0V3.145a.5.5 0 1 0-.8-.49M2 14a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2M18 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" },
          ].map((icon, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                animation: `orbit 3.2s linear infinite`,
                animationDelay: icon.delay,
              }}
            >
              <svg
                className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-5 text-primary/60"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={icon.path} />
              </svg>
            </div>
          ))}
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Cargando...
          </p>
          {/* Dot progress */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/40"
                style={{
                  animation: "dotBounce 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes dotBounce {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
