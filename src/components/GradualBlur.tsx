"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

const DEFAULT_CONFIG = {
  position: "bottom" as const,
  strength: 2,
  height: "6rem",
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false as boolean | "scroll",
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear" as CurveName,
  responsive: false,
  target: "parent" as "parent" | "page",
  className: "",
  style: {} as React.CSSProperties,
};

type Position = "top" | "bottom" | "left" | "right";
type CurveName = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";

type PresetConfig = {
  position?: Position;
  height?: string;
  strength?: number;
  opacity?: number;
  divCount?: number;
  exponential?: boolean;
  curve?: CurveName;
  target?: "parent" | "page";
};

const PRESETS: Record<string, PresetConfig> = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
  "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 },
};

const CURVE_FUNCTIONS: Record<CurveName, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const getGradientDirection = (position: Position) =>
  ({ top: "to top", bottom: "to bottom", left: "to left", right: "to right" }[position] || "to bottom");

interface GradualBlurProps {
  position?: Position;
  strength?: number;
  height?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: CurveName;
  responsive?: boolean;
  target?: "parent" | "page";
  className?: string;
  style?: React.CSSProperties;
  preset?: string;
  hoverIntensity?: number;
  onAnimationComplete?: () => void;
}

export default function GradualBlur(props: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(props.animated !== "scroll");

  const config = useMemo(() => {
    const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
    return { ...DEFAULT_CONFIG, ...presetConfig, ...props } as typeof DEFAULT_CONFIG & GradualBlurProps;
  }, [props]);

  useEffect(() => {
    if (config.animated !== "scroll" || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [config.animated]);

  const blurDivs = useMemo(() => {
    const divs = [];
    const increment = 100 / config.divCount;
    const currentStrength =
      isHovered && config.hoverIntensity ? config.strength * config.hoverIntensity : config.strength;
    const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= config.divCount; i++) {
      let progress = curveFunc(i / config.divCount);
      const blurValue = config.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * currentStrength
        : 0.0625 * (progress * config.divCount + 1) * currentStrength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position as Position);
      const blurVal = `blur(${blurValue.toFixed(3)}rem)`;

      divs.push(
        <div
          key={i}
          style={{
            position: "absolute",
            inset: "0",
            maskImage: `linear-gradient(${direction}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
            backdropFilter: blurVal,
            WebkitBackdropFilter: blurVal,
            opacity: config.opacity,
          }}
        />
      );
    }
    return divs;
  }, [config, isHovered]);

  const containerStyle = useMemo((): React.CSSProperties => {
    const isPageTarget = config.target === "page";
    const pos = config.position as Position;
    const isVertical = ["top", "bottom"].includes(pos);

    const base: React.CSSProperties = {
      position: isPageTarget ? "fixed" : "absolute",
      pointerEvents: config.hoverIntensity ? "auto" : "none",
      opacity: isVisible ? 1 : 0,
      zIndex: isPageTarget ? (config.zIndex ?? 1000) + 100 : config.zIndex,
      ...config.style,
    };

    if (isVertical) {
      return { ...base, height: config.height, width: "100%", [pos]: 0, left: 0, right: 0 };
    }
    return { ...base, width: config.height, height: "100%", [pos]: 0, top: 0, bottom: 0 };
  }, [config, isVisible]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${config.className}`}
      style={containerStyle}
      onMouseEnter={config.hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={config.hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {blurDivs}
      </div>
    </div>
  );
}
