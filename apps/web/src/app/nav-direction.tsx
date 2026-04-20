"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

type Direction = "forward" | "back";

const NavDirectionContext = createContext<Direction>("forward");

export function useNavDirection(): Direction {
  return useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<{ direction: Direction; prev: string }>({
    direction: "forward",
    prev: location.pathname,
  });

  if (state.prev !== location.pathname) {
    const prevDepth = state.prev.split("/").filter(Boolean).length;
    const currDepth = location.pathname.split("/").filter(Boolean).length;
    setState({
      direction: currDepth >= prevDepth ? "forward" : "back",
      prev: location.pathname,
    });
  }

  return (
    <NavDirectionContext.Provider value={state.direction}>
      {children}
    </NavDirectionContext.Provider>
  );
}
