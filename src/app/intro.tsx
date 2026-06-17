"use client";

import { useEffect, useState } from "react";

const KEY = "mf_intro_seen";

export default function Intro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem(KEY);
    if (seen) return;

    window.sessionStorage.setItem(KEY, "1");
    const showId = window.setTimeout(() => setVisible(true), 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const hideId = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = prevOverflow;
    }, 1950);

    return () => {
      window.clearTimeout(showId);
      window.clearTimeout(hideId);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="intro-overlay" aria-hidden="true">
      <div className="intro-stage">
        <div className="intro-spark" />
        <div className="intro-logo">
          <img src="/assets/icon/icon/mf_fix2.svg" alt="" className="intro-img" />
          <div className="intro-shine" />
        </div>
      </div>
    </div>
  );
}
