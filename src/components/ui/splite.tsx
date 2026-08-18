"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined"
  );
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldRender(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);

    const fallback = window.setTimeout(() => {
      setShouldRender(true);
      io.disconnect();
    }, 3000);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            <span className="loader" />
          </div>
        }
      >
        {shouldRender && (
          <Spline
            scene={scene}
            className="h-full w-full"
            onLoad={(spline) => {
              if (!reduceMotion) return;
              const app = spline as unknown as { setTimeScale?: (v: number) => void };
              if (typeof app.setTimeScale === "function") {
                app.setTimeScale(0);
              } else {
                spline.stop();
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
