"use client";

import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const scrollPositions = new Map<string, number>();

export function ScrollRestoration() {
  const location = useLocation();
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    const save = () => {
      scrollPositions.set(location.pathname, window.scrollY);
    };

    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [location.pathname]);

  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      const saved = scrollPositions.get(location.pathname);
      if (saved !== undefined) {
        setTimeout(() => window.scrollTo({ top: saved, behavior: "smooth" }), 350);
      }
      prevPathname.current = location.pathname;
    }
  }, [location.pathname]);

  return null;
}
